import Vendor from "../models/Vendor.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import { logger } from "../config/logger.js";

/**
 * Calculate and update vendor commissions for an order
 * This should be called when an order payment is confirmed
 * @param {Object} order - Order document
 * @returns {Promise<Object>} Commission summary
 */
export async function calculateOrderCommissions(order) {
  try {
    // If commissions already calculated, skip
    if (order.vendorCommission && order.vendorCommission > 0) {
      logger.info(`Commissions already calculated for order ${order._id}`);
      return {
        alreadyCalculated: true,
        vendorCommission: order.vendorCommission,
        platformCommission: order.platformCommission,
      };
    }

    // Populate products to get vendor information
    await order.populate({
      path: "items.product",
      populate: { path: "vendor" },
    });

    let totalVendorCommission = 0;
    let totalPlatformCommission = 0;
    const vendorUpdates = new Map(); // Track vendor updates to batch them

    // Process each order item
    for (const item of order.items) {
      const product = item.product;
      
      if (!product || !product.vendor) {
        logger.warn(`Product ${item.product?._id} has no vendor, skipping commission calculation`);
        continue;
      }

      const vendorId = product.vendor._id || product.vendor;
      const itemTotal = item.price * item.quantity;

      // Get or create vendor update entry
      if (!vendorUpdates.has(vendorId.toString())) {
        const vendor = await Vendor.findById(vendorId);
        if (!vendor) {
          logger.warn(`Vendor ${vendorId} not found, skipping commission calculation`);
          continue;
        }
        vendorUpdates.set(vendorId.toString(), {
          vendor,
          totalAmount: 0,
          totalCommission: 0,
        });
      }

      const vendorUpdate = vendorUpdates.get(vendorId.toString());
      const vendor = vendorUpdate.vendor;

      // Calculate commission for this item
      const commission = vendor.calculateCommission(itemTotal);
      vendorUpdate.totalAmount += itemTotal;
      vendorUpdate.totalCommission += commission;

      totalVendorCommission += commission;
      totalPlatformCommission += commission;
    }

    // Update all vendors
    const vendorUpdatePromises = Array.from(vendorUpdates.values()).map(
      async ({ vendor, totalAmount, totalCommission }) => {
        await vendor.updateSalesStats(totalAmount, totalCommission);
        logger.info(
          `Updated vendor ${vendor.businessName} with ${totalAmount} revenue and ${totalCommission} commission`
        );
      }
    );

    await Promise.all(vendorUpdatePromises);

    // Update order with commission information
    // If order has multiple vendors, we'll use the primary vendor (first one)
    const primaryVendorId = Array.from(vendorUpdates.keys())[0];
    
    order.vendorCommission = totalVendorCommission;
    order.platformCommission = totalPlatformCommission;
    if (primaryVendorId) {
      order.vendor = primaryVendorId;
    }

    await order.save();

    logger.info(
      `Commissions calculated for order ${order._id}: Vendor=${totalVendorCommission}, Platform=${totalPlatformCommission}`
    );

    return {
      vendorCommission: totalVendorCommission,
      platformCommission: totalPlatformCommission,
      vendorId: primaryVendorId,
      vendorsUpdated: vendorUpdates.size,
    };
  } catch (error) {
    logger.error(`Error calculating commissions for order ${order._id}:`, error);
    throw error;
  }
}

/**
 * Recalculate commissions for an order (useful for corrections)
 * @param {String} orderId - Order ID
 * @returns {Promise<Object>} Commission summary
 */
export async function recalculateOrderCommissions(orderId) {
  const order = await Order.findById(orderId);
  if (!order) {
    throw new Error("Order not found");
  }

  // Reset commission fields
  order.vendorCommission = 0;
  order.platformCommission = 0;

  return await calculateOrderCommissions(order);
}

export default {
  calculateOrderCommissions,
  recalculateOrderCommissions,
};

