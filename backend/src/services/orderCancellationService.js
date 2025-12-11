import { logger } from "../config/logger.js";
import Order from "../models/Order.js";
import StockReservation from "../models/StockReservation.js";
// TODO: Add these methods to emailService
// import {
//   sendOrderCancellation,
//   sendRefundConfirmation,
// } from "./emailService.js";
import inventoryService from "./inventoryService.js";

/**
 * Order Cancellation & Refund Service
 * Handles order cancellations, refund processing, and stock restoration
 */

class OrderCancellationService {
  /**
   * Cancel an order and process refund
   */
  async cancelOrder(orderId, userId, reason, isAdmin = false) {
    try {
      const order = await Order.findById(orderId).populate("items.product");

      if (!order) {
        throw new Error("Order not found");
      }

      // Check if user owns the order or is admin
      if (!isAdmin && order.user.toString() !== userId.toString()) {
        throw new Error("Unauthorized to cancel this order");
      }

      // Check if order can be cancelled
      if (order.status === "cancelled") {
        throw new Error("Order is already cancelled");
      }

      if (order.status === "delivered") {
        throw new Error(
          "Delivered orders cannot be cancelled. Please initiate a return instead."
        );
      }

      if (order.status === "shipped" && !isAdmin) {
        throw new Error(
          "Shipped orders can only be cancelled by admin. Please contact support."
        );
      }

      const previousStatus = order.status;

      // Update order status
      order.status = "cancelled";
      order.cancellationReason = reason;
      order.cancelledAt = new Date();
      order.cancelledBy = userId;
      await order.save();

      // Process refund if payment was made
      let refundResult = null;
      if (previousStatus === "paid" && order.paymentIntentId) {
        refundResult = await this.processRefund(order);
      }

      // Restore stock for all items
      await this.restoreStock(order, userId);

      // Release any active reservations
      await this.releaseReservations(order, userId);

      // Send cancellation email
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(userId);
      if (user) {
        // TODO: Implement sendOrderCancellation in emailService
        // await sendOrderCancellation(user, order);

        // Send refund confirmation if refund was processed
        if (refundResult) {
          // TODO: Implement sendRefundConfirmation in emailService
          // await sendRefundConfirmation(user, order, refundResult);
        }
      }

      logger.info(
        `Order ${orderId} cancelled by user ${userId}. Reason: ${reason}`
      );

      return {
        success: true,
        order,
        refund: refundResult,
        message: "Order cancelled successfully",
      };
    } catch (error) {
      logger.error("Error cancelling order:", error);
      throw error;
    }
  }

  /**
   * Process refund for cancelled order
   */
  async processRefund(order) {
    try {
      // In production, integrate with Stripe/PayPal refund API
      const refund = {
        orderId: order._id,
        amount: order.total,
        currency: "USD",
        status: "pending",
        processedAt: new Date(),
        refundId: `refund_${Date.now()}`,
      };

      // TODO: Actual payment gateway integration
      // Example for Stripe:
      // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
      // const refund = await stripe.refunds.create({
      //   payment_intent: order.paymentIntentId,
      // });

      logger.info(`Refund processed for order ${order._id}: $${order.total}`);

      return refund;
    } catch (error) {
      logger.error("Error processing refund:", error);
      throw new Error("Failed to process refund");
    }
  }

  /**
   * Restore stock for cancelled order items
   */
  async restoreStock(order, userId) {
    try {
      for (const item of order.items) {
        try {
          // Add stock back to inventory
          await inventoryService.addStock(
            item.product._id,
            item.variantId,
            item.quantity,
            userId,
            `Order cancelled: ${order._id}`
          );

          logger.info(
            `Restored ${item.quantity} units for product ${item.product._id}`
          );
        } catch (error) {
          logger.error(
            `Failed to restore stock for product ${item.product._id}:`,
            error
          );
          // Continue with other items even if one fails
        }
      }
    } catch (error) {
      logger.error("Error restoring stock:", error);
      throw error;
    }
  }

  /**
   * Release stock reservations for the order
   */
  async releaseReservations(order, userId) {
    try {
      const reservations = await StockReservation.find({
        order: order._id,
        status: "active",
      });

      for (const reservation of reservations) {
        try {
          await inventoryService.releaseReservedStock(
            reservation._id,
            `Order cancelled: ${order._id}`
          );
        } catch (error) {
          logger.error(
            `Failed to release reservation ${reservation._id}:`,
            error
          );
        }
      }

      logger.info(
        `Released ${reservations.length} reservations for order ${order._id}`
      );
    } catch (error) {
      logger.error("Error releasing reservations:", error);
    }
  }

  /**
   * Check if order is eligible for cancellation
   */
  async canCancelOrder(orderId, userId, isAdmin = false) {
    try {
      const order = await Order.findById(orderId);

      if (!order) {
        return { canCancel: false, reason: "Order not found" };
      }

      if (!isAdmin && order.user.toString() !== userId.toString()) {
        return { canCancel: false, reason: "Unauthorized" };
      }

      if (order.status === "cancelled") {
        return { canCancel: false, reason: "Order already cancelled" };
      }

      if (order.status === "delivered") {
        return { canCancel: false, reason: "Order already delivered" };
      }

      if (order.status === "shipped" && !isAdmin) {
        return {
          canCancel: false,
          reason: "Shipped orders can only be cancelled by admin",
        };
      }

      return { canCancel: true };
    } catch (error) {
      logger.error("Error checking cancellation eligibility:", error);
      throw error;
    }
  }

  /**
   * Get cancellation statistics
   */
  async getCancellationStats(startDate, endDate) {
    try {
      const stats = await Order.aggregate([
        {
          $match: {
            status: "cancelled",
            cancelledAt: {
              $gte:
                startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
              $lte: endDate || new Date(),
            },
          },
        },
        {
          $group: {
            _id: null,
            totalCancelled: { $sum: 1 },
            totalRefundAmount: { $sum: "$total" },
            avgOrderValue: { $avg: "$total" },
          },
        },
      ]);

      return (
        stats[0] || {
          totalCancelled: 0,
          totalRefundAmount: 0,
          avgOrderValue: 0,
        }
      );
    } catch (error) {
      logger.error("Error getting cancellation stats:", error);
      throw error;
    }
  }
}

export default new OrderCancellationService();
