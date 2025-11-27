import nodemailer from "nodemailer";
import { logger } from "../config/logger.js";
import templateService from "./templateService.js";

const transporter =
  process.env.NODE_ENV === "test"
    ? {
        sendMail: async (mailOptions) => {
          logger.info("Mock email sent:", mailOptions.to, mailOptions.subject);
          return { messageId: "mock-message-id" };
        },
      }
    : nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });

export const sendOrderConfirmation = async (user, order) => {
  try {
    const items = order.items.map((item) => ({
      name: item.product?.name || "Product",
      quantity: item.quantity,
      price: item.price.toFixed(2),
      itemTotal: (item.price * item.quantity).toFixed(2),
    }));

    const data = {
      userName: user.name,
      orderId: order._id,
      orderDate: new Date(order.createdAt).toLocaleDateString(),
      orderStatus: order.status,
      subtotal: order.subtotal.toFixed(2),
      total: order.total.toFixed(2),
      items: items,
      orderUrl: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/orders/${order._id}`,
      discount: order.appliedCoupon?.discountAmount?.toFixed(2),
      couponCode: order.appliedCoupon?.code,
    };

    const html = await templateService.renderEmail("order-confirmation", data);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Order Confirmation - #${order._id}`,
      html: html,
    });
    logger.info(`Order confirmation email sent to ${user.email}`);
  } catch (err) {
    logger.error("Order confirmation email error:", err);
  }
};

export const sendOrderStatusUpdate = async (user, order) => {
  try {
    const data = {
      userName: user.name,
      orderId: order._id,
      orderDate: new Date(order.createdAt).toLocaleDateString(),
      orderStatus: order.status,
      total: order.total.toFixed(2),
      orderUrl: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/orders/${order._id}`,
      reviewUrl: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/orders/${order._id}/review`,
      isPaid: order.status === "paid",
      isShipped: order.status === "shipped",
      isDelivered: order.status === "delivered",
      trackingNumber: order.tracking?.trackingNumber || null,
      trackingUrl: order.tracking?.trackingUrl || null,
      carrier: order.tracking?.carrier || null,
      estimatedDelivery: order.tracking?.estimatedDelivery
        ? new Date(order.tracking.estimatedDelivery).toLocaleDateString()
        : null,
    };

    const html = await templateService.renderEmail("order-status", data);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Order Status Update - #${order._id}`,
      html: html,
    });
    logger.info(`Order status update email sent to ${user.email}`);
  } catch (err) {
    logger.error("Order status update email error:", err);
  }
};

/**
 * Send order cancellation email
 */
export const sendOrderCancellation = async (user, order) => {
  try {
    const data = {
      userName: user.name,
      orderId: order._id,
      orderDate: new Date(order.createdAt).toLocaleDateString(),
      cancellationDate: new Date(order.cancelledAt).toLocaleDateString(),
      total: order.total.toFixed(2),
      reason: order.cancellationReason,
      refundAmount: order.status === "paid" ? order.total.toFixed(2) : null,
      shopUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    };

    const html = await templateService.renderEmail("order-cancellation", data);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Order Cancelled - #${order._id}`,
      html: html,
    });
    logger.info(`Order cancellation email sent to ${user.email}`);
  } catch (err) {
    logger.error("Order cancellation email error:", err);
  }
};

/**
 * Send refund confirmation email
 */
export const sendRefundConfirmation = async (user, order, refundData) => {
  try {
    const items = order.items.map((item) => ({
      name: item.product?.name || "Product",
      quantity: item.quantity,
      itemTotal: (item.price * item.quantity).toFixed(2),
    }));

    const data = {
      userName: user.name,
      orderId: order._id,
      refundAmount: refundData.amount.toFixed(2),
      refundDate: new Date(refundData.processedAt).toLocaleDateString(),
      refundMethod: "Original Payment Method",
      refundId: refundData.refundId,
      items: items,
      shopUrl: process.env.FRONTEND_URL || "http://localhost:3000",
    };

    const html = await templateService.renderEmail("refund-confirmation", data);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: `Refund Processed - #${order._id}`,
      html: html,
    });
    logger.info(`Refund confirmation email sent to ${user.email}`);
  } catch (err) {
    logger.error("Refund confirmation email error:", err);
  }
};

/**
 * Send welcome email to new users
 */
export const sendWelcomeEmail = async (user, welcomeOffer = null) => {
  try {
    const data = {
      userName: user.name,
      shopUrl: process.env.FRONTEND_URL || "http://localhost:3000",
      welcomeOffer: welcomeOffer ? true : false,
      welcomeCode: welcomeOffer?.code,
      welcomeDiscount: welcomeOffer?.discount,
      expiryDate: welcomeOffer?.expiryDate,
    };

    const html = await templateService.renderEmail("welcome", data);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Welcome to Shopping Site! 🎉",
      html: html,
    });
    logger.info(`Welcome email sent to ${user.email}`);
  } catch (err) {
    logger.error("Welcome email error:", err);
  }
};

/**
 * Send password reset email
 */
export const sendPasswordReset = async (user, resetToken) => {
  try {
    const resetUrl = `${
      process.env.FRONTEND_URL || "http://localhost:3000"
    }/reset-password?token=${resetToken}`;

    const data = {
      userName: user.name,
      resetUrl: resetUrl,
      expiryTime: "1 hour",
    };

    const html = await templateService.renderEmail("password-reset", data);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "Password Reset Request - Shopping Site",
      html: html,
    });
    logger.info(`Password reset email sent to ${user.email}`);
  } catch (err) {
    logger.error("Password reset email error:", err);
  }
};

/**
 * Send review request email
 */
export const sendReviewRequest = async (user, order) => {
  try {
    const products = order.items.map((item) => ({
      name: item.product?.name || "Product",
      category: item.product?.category || "General",
      reviewUrl: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/products/${item.product?._id}/review`,
    }));

    const data = {
      userName: user.name,
      orderId: order._id,
      deliveryDate: new Date().toLocaleDateString(),
      products: products,
      orderUrl: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/orders/${order._id}`,
    };

    const html = await templateService.renderEmail("review-request", data);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: "How was your purchase? Leave a review ⭐",
      html: html,
    });
    logger.info(`Review request email sent to ${user.email}`);
  } catch (err) {
    logger.error("Review request email error:", err);
  }
};

/**
 * Send stock alert email to admin
 */
export const sendStockAlert = async (product, inventory) => {
  try {
    const data = {
      productName: product.name,
      productId: product._id,
      variantSku: inventory.variantId || null,
      currentStock: inventory.quantity,
      threshold: inventory.lowStockThreshold || 10,
      isOutOfStock: inventory.quantity === 0,
      salesLast7Days: inventory.salesLast7Days || 0,
      salesLast30Days: inventory.salesLast30Days || 0,
      avgDailySales: inventory.avgDailySales || 0,
      estimatedStockout: inventory.estimatedStockout || null,
      inventoryUrl: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/admin/inventory`,
      productUrl: `${
        process.env.FRONTEND_URL || "http://localhost:3000"
      }/admin/products/${product._id}`,
      alertTime: new Date().toLocaleTimeString(),
      alertDate: new Date().toLocaleDateString(),
    };

    const html = await templateService.renderEmail("stock-alert", data);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.ADMIN_EMAIL || process.env.EMAIL_USER,
      subject: `⚠️ Low Stock Alert - ${product.name}`,
      html: html,
    });
    logger.info(`Stock alert email sent for product ${product._id}`);
  } catch (err) {
    logger.error("Stock alert email error:", err);
  }
};

/**
 * Send notification email
 */
export const sendNotificationEmail = async (user, notification) => {
  try {
    const data = {
      userName: user.name || "User",
      title: notification.title,
      message: notification.message,
      actionUrl: notification.actionUrl
        ? `${process.env.FRONTEND_URL || "http://localhost:3000"}${
            notification.actionUrl
          }`
        : null,
      priority: notification.priority || "normal",
      type: notification.type,
      icon: notification.icon,
      timestamp: new Date().toLocaleString(),
    };

    // Use a simple HTML template for notifications
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
            .message { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
            .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            .priority-urgent { border-left: 4px solid #DC2626; }
            .priority-high { border-left: 4px solid #F59E0B; }
            .priority-normal { border-left: 4px solid #3B82F6; }
            .priority-low { border-left: 4px solid #10B981; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${data.title}</h1>
            </div>
            <div class="content">
              <p>Hi ${data.userName},</p>
              <div class="message priority-${data.priority}">
                <p>${data.message}</p>
              </div>
              ${
                data.actionUrl
                  ? `<a href="${data.actionUrl}" class="button">View Details</a>`
                  : ""
              }
              <div class="footer">
                <p>This notification was sent on ${data.timestamp}</p>
                <p>You're receiving this email based on your notification preferences.</p>
                <p><a href="${
                  process.env.FRONTEND_URL || "http://localhost:3000"
                }/settings/notifications">Manage notification preferences</a></p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: notification.title,
      html: html,
    });

    logger.info(`Notification email sent to ${user.email}`);
    return true;
  } catch (err) {
    logger.error("Notification email error:", err);
    return false;
  }
};

/**
 * Generic send email function for notification service
 */
export const sendEmail = async ({ to, subject, template, context }) => {
  try {
    // If 'to' is a user ID, fetch the user first
    let userEmail = to;
    if (to.match(/^[0-9a-fA-F]{24}$/)) {
      // It's a MongoDB ObjectId
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(to);
      if (!user) {
        logger.error(`User not found for notification email: ${to}`);
        return false;
      }
      userEmail = user.email;
      context.userName = user.name;
    }

    let html;
    if (template === "notification") {
      html = `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background: #4F46E5; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
              .content { background: #f9f9f9; padding: 30px; border: 1px solid #ddd; border-radius: 0 0 5px 5px; }
              .message { background: white; padding: 20px; border-radius: 5px; margin: 20px 0; }
              .button { display: inline-block; padding: 12px 30px; background: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }
              .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>${context.title}</h1>
              </div>
              <div class="content">
                <p>Hi ${context.userName || "there"},</p>
                <div class="message">
                  <p>${context.message}</p>
                </div>
                ${
                  context.actionUrl
                    ? `<a href="${context.actionUrl}" class="button">View Details</a>`
                    : ""
                }
                <div class="footer">
                  <p>You're receiving this email based on your notification preferences.</p>
                </div>
              </div>
            </div>
          </body>
        </html>
      `;
    } else {
      html = await templateService.renderEmail(template, context);
    }

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: userEmail,
      subject: subject,
      html: html,
    });

    logger.info(`Email sent to ${userEmail}`);
    return true;
  } catch (err) {
    logger.error("Send email error:", err);
    return false;
  }
};

export default {
  sendOrderConfirmation,
  sendOrderStatusUpdate,
  sendOrderCancellation,
  sendRefundConfirmation,
  sendWelcomeEmail,
  sendPasswordReset,
  sendReviewRequest,
  sendStockAlert,
  sendNotificationEmail,
  sendEmail,
};
