import { logger } from "../config/logger.js";
import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";
import StockAlert from "../models/StockAlert.js";
import StockHistory from "../models/StockHistory.js";
import StockReservation from "../models/StockReservation.js";

/**
 * Inventory Management Service
 * Comprehensive stock control system with reservations, alerts, and history tracking
 */

class InventoryService {
  /**
   * Check stock availability for a product/variant
   */
  async checkAvailability(productId, variantId = null, quantity = 1) {
    try {
      const query = { product: productId };
      if (variantId) query.variantId = variantId;

      const inventory = await Inventory.findOne(query);

      if (!inventory) {
        return {
          available: false,
          reason: "Product not found in inventory",
          stock: 0,
        };
      }

      const availableStock = inventory.currentStock - inventory.reservedStock;

      if (availableStock < quantity) {
        return {
          available: false,
          reason: "Insufficient stock",
          stock: availableStock,
          requested: quantity,
        };
      }

      return {
        available: true,
        stock: availableStock,
        lowStock: inventory.isLowStock,
        outOfStock: inventory.isOutOfStock,
      };
    } catch (error) {
      logger.error("Error checking stock availability:", error);
      throw error;
    }
  }

  /**
   * Reserve stock for pending orders (with auto-release after timeout)
   */
  async reserveStock(
    productId,
    variantId,
    quantity,
    userId,
    orderId,
    expiresInMinutes = 15
  ) {
    try {
      const query = { product: productId };
      if (variantId) query.variantId = variantId;

      const inventory = await Inventory.findOne(query);

      if (!inventory) {
        throw new Error("Product not found in inventory");
      }

      // Check if enough stock is available
      const availableStock = inventory.currentStock - inventory.reservedStock;
      if (availableStock < quantity) {
        throw new Error(
          `Insufficient stock. Available: ${availableStock}, Requested: ${quantity}`
        );
      }

      // Create reservation record
      const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);
      const reservation = await StockReservation.create({
        inventory: inventory._id,
        product: productId,
        variantId,
        quantity,
        user: userId,
        order: orderId,
        expiresAt,
        status: "active",
      });

      // Update inventory reserved stock
      await inventory.reserveStock(quantity, userId, orderId);

      logger.info(`Stock reserved: ${quantity} units for order ${orderId}`);

      return {
        success: true,
        reservation: reservation._id,
        expiresAt,
        message: `Reserved ${quantity} units until ${expiresAt.toLocaleString()}`,
      };
    } catch (error) {
      logger.error("Error reserving stock:", error);
      throw error;
    }
  }

  /**
   * Release reserved stock (on order cancellation or expiration)
   */
  async releaseReservedStock(reservationId, reason = "Order cancelled") {
    try {
      const reservation = await StockReservation.findById(reservationId);

      if (!reservation) {
        throw new Error("Reservation not found");
      }

      if (
        reservation.status === "released" ||
        reservation.status === "confirmed"
      ) {
        return {
          success: false,
          message: "Reservation already processed",
        };
      }

      const inventory = await Inventory.findById(reservation.inventory);

      if (!inventory) {
        throw new Error("Inventory not found");
      }

      // Release the reserved stock
      await inventory.releaseReservedStock(
        reservation.quantity,
        reservation.user,
        reservation.order,
        reason
      );

      // Update reservation status
      reservation.status = "released";
      reservation.releasedAt = new Date();
      await reservation.save();

      logger.info(
        `Stock reservation released: ${reservation.quantity} units, Reason: ${reason}`
      );

      return {
        success: true,
        message: `Released ${reservation.quantity} units`,
      };
    } catch (error) {
      logger.error("Error releasing reserved stock:", error);
      throw error;
    }
  }

  /**
   * Confirm stock reservation and deduct from inventory (on payment success)
   */
  async confirmReservation(reservationId, userId) {
    try {
      const reservation = await StockReservation.findById(reservationId);

      if (!reservation) {
        throw new Error("Reservation not found");
      }

      if (reservation.status === "confirmed") {
        return {
          success: false,
          message: "Reservation already confirmed",
        };
      }

      if (reservation.status === "released") {
        throw new Error("Reservation has been released");
      }

      const inventory = await Inventory.findById(reservation.inventory);

      if (!inventory) {
        throw new Error("Inventory not found");
      }

      // Deduct from both current stock and reserved stock
      await inventory.removeStock(
        reservation.quantity,
        userId,
        reservation.order,
        "Order confirmed"
      );

      // Release the reservation (since stock is now deducted)
      inventory.reservedStock = Math.max(
        0,
        inventory.reservedStock - reservation.quantity
      );
      await inventory.save();

      // Update reservation status
      reservation.status = "confirmed";
      reservation.confirmedAt = new Date();
      await reservation.save();

      // Create stock history record
      await StockHistory.create({
        inventory: inventory._id,
        product: reservation.product,
        variantId: reservation.variantId,
        type: "sale",
        quantity: -reservation.quantity,
        previousStock: inventory.currentStock + reservation.quantity,
        newStock: inventory.currentStock,
        order: reservation.order,
        user: userId,
        reason: "Order confirmed and paid",
      });

      logger.info(
        `Stock reservation confirmed: ${reservation.quantity} units for order ${reservation.order}`
      );

      return {
        success: true,
        message: `Confirmed ${reservation.quantity} units`,
        newStock: inventory.currentStock,
      };
    } catch (error) {
      logger.error("Error confirming reservation:", error);
      throw error;
    }
  }

  /**
   * Auto-release expired reservations (should be run by a cron job)
   */
  async releaseExpiredReservations() {
    try {
      const expiredReservations = await StockReservation.find({
        status: "active",
        expiresAt: { $lt: new Date() },
      });

      let releasedCount = 0;

      for (const reservation of expiredReservations) {
        try {
          await this.releaseReservedStock(
            reservation._id,
            "Reservation expired"
          );
          releasedCount++;
        } catch (error) {
          logger.error(
            `Error releasing expired reservation ${reservation._id}:`,
            error
          );
        }
      }

      logger.info(`Released ${releasedCount} expired reservations`);

      return {
        success: true,
        releasedCount,
        message: `Released ${releasedCount} expired reservations`,
      };
    } catch (error) {
      logger.error("Error releasing expired reservations:", error);
      throw error;
    }
  }

  /**
   * Add stock (restock)
   */
  async addStock(productId, variantId, quantity, userId, reason = "Restock") {
    try {
      const query = { product: productId };
      if (variantId) query.variantId = variantId;

      const inventory = await Inventory.findOne(query);

      if (!inventory) {
        throw new Error("Product not found in inventory");
      }

      const previousStock = inventory.currentStock;
      await inventory.addStock(quantity, userId, reason);

      // Create stock history record
      await StockHistory.create({
        inventory: inventory._id,
        product: productId,
        variantId,
        type: "restock",
        quantity,
        previousStock,
        newStock: inventory.currentStock,
        user: userId,
        reason,
      });

      // Check if we need to clear low stock alert
      if (
        previousStock <= inventory.lowStockThreshold &&
        inventory.currentStock > inventory.lowStockThreshold
      ) {
        await StockAlert.updateMany(
          {
            inventory: inventory._id,
            status: "active",
            type: "low_stock",
          },
          {
            status: "resolved",
            resolvedAt: new Date(),
          }
        );
      }

      logger.info(`Stock added: ${quantity} units to product ${productId}`);

      return {
        success: true,
        previousStock,
        newStock: inventory.currentStock,
        message: `Added ${quantity} units to inventory`,
      };
    } catch (error) {
      logger.error("Error adding stock:", error);
      throw error;
    }
  }

  /**
   * Adjust stock (manual correction)
   */
  async adjustStock(productId, variantId, newQuantity, userId, reason) {
    try {
      const query = { product: productId };
      if (variantId) query.variantId = variantId;

      const inventory = await Inventory.findOne(query);

      if (!inventory) {
        throw new Error("Product not found in inventory");
      }

      const previousStock = inventory.currentStock;
      await inventory.adjustStock(newQuantity, userId, reason);

      // Create stock history record
      await StockHistory.create({
        inventory: inventory._id,
        product: productId,
        variantId,
        type: "adjustment",
        quantity: newQuantity - previousStock,
        previousStock,
        newStock: inventory.currentStock,
        user: userId,
        reason,
      });

      logger.info(
        `Stock adjusted: ${previousStock} -> ${newQuantity} for product ${productId}`
      );

      return {
        success: true,
        previousStock,
        newStock: inventory.currentStock,
        difference: newQuantity - previousStock,
        message: `Stock adjusted from ${previousStock} to ${newQuantity}`,
      };
    } catch (error) {
      logger.error("Error adjusting stock:", error);
      throw error;
    }
  }

  /**
   * Get stock history for a product
   */
  async getStockHistory(productId, variantId = null, limit = 50) {
    try {
      const query = { product: productId };
      if (variantId) query.variantId = variantId;

      const history = await StockHistory.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("user", "name email")
        .populate("order", "status total");

      return {
        success: true,
        history,
      };
    } catch (error) {
      logger.error("Error fetching stock history:", error);
      throw error;
    }
  }

  /**
   * Create or update inventory record
   */
  async createOrUpdateInventory(productId, variantId, data, userId) {
    try {
      const query = { product: productId };
      if (variantId) query.variantId = variantId;

      let inventory = await Inventory.findOne(query);

      if (inventory) {
        // Update existing
        Object.assign(inventory, data);
        await inventory.save();
      } else {
        // Create new
        inventory = await Inventory.create({
          product: productId,
          variantId,
          ...data,
          lastRestockedBy: userId,
          lastRestockedAt: new Date(),
        });
      }

      return {
        success: true,
        inventory,
        message: inventory.isNew ? "Inventory created" : "Inventory updated",
      };
    } catch (error) {
      logger.error("Error creating/updating inventory:", error);
      throw error;
    }
  }

  /**
   * Get low stock alerts
   */
  async getLowStockProducts(limit = 50) {
    try {
      const lowStockItems = await Inventory.find({ isLowStock: true })
        .limit(limit)
        .populate("product", "name category")
        .sort({ availableStock: 1 });

      return {
        success: true,
        count: lowStockItems.length,
        items: lowStockItems,
      };
    } catch (error) {
      logger.error("Error fetching low stock products:", error);
      throw error;
    }
  }

  /**
   * Get out of stock products
   */
  async getOutOfStockProducts(limit = 50) {
    try {
      const outOfStockItems = await Inventory.find({ isOutOfStock: true })
        .limit(limit)
        .populate("product", "name category")
        .sort({ updatedAt: -1 });

      return {
        success: true,
        count: outOfStockItems.length,
        items: outOfStockItems,
      };
    } catch (error) {
      logger.error("Error fetching out of stock products:", error);
      throw error;
    }
  }

  /**
   * Sync inventory with product stock (for products without variants)
   */
  async syncWithProduct(productId) {
    try {
      const product = await Product.findById(productId);

      if (!product) {
        throw new Error("Product not found");
      }

      const inventory = await Inventory.findOne({
        product: productId,
        variantId: null,
      });

      if (inventory) {
        // Update product stock to match inventory
        product.stock = inventory.currentStock;
        await product.save();
      } else {
        // Create inventory from product stock
        await Inventory.create({
          product: productId,
          sku: `SKU-${productId}`,
          currentStock: product.stock,
          availableStock: product.stock,
        });
      }

      return {
        success: true,
        message: "Inventory synced with product",
      };
    } catch (error) {
      logger.error("Error syncing inventory with product:", error);
      throw error;
    }
  }
}

export default new InventoryService();
