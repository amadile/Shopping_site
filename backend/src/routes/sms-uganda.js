import express from "express";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import Order from "../models/Order.js";
import { logger } from "../config/logger.js";

const router = express.Router();

// In a real implementation, this would integrate with Africa's Talking or similar SMS provider
// For now, we'll simulate the functionality

/**
 * @swagger
 * /api/sms/order/{orderId}/send:
 *   post:
 *     summary: Send SMS notification for order (Uganda-specific)
 *     tags: [SMS Uganda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               messageType:
 *                 type: string
 *                 enum: [order_confirmation, payment_confirmation, dispatch_notification, delivery_eta]
 *     responses:
 *       200:
 *         description: SMS sent
 */
router.post("/order/:orderId/send", authenticateJWT, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { phoneNumber, messageType } = req.body;

    // Validate input
    if (!phoneNumber || !messageType) {
      return res.status(400).json({ error: "phoneNumber and messageType are required" });
    }

    // Validate message type
    const validMessageTypes = [
      "order_confirmation",
      "payment_confirmation",
      "dispatch_notification",
      "delivery_eta"
    ];
    if (!validMessageTypes.includes(messageType)) {
      return res.status(400).json({ error: "Invalid messageType" });
    }

    // Get order
    const order = await Order.findById(orderId).populate("user");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if order belongs to user or if user is admin
    const isAdmin = req.user.role === "admin";
    if (order.user._id.toString() !== req.user._id.toString() && !isAdmin) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // In a real implementation, we would send SMS via Africa's Talking API
    // For now, we'll simulate the process

    let message = "";
    switch (messageType) {
      case "order_confirmation":
        message = `Your order #${order._id.toString().substr(0, 8)} has been confirmed. Total: UGX ${order.total.toLocaleString()}. Thank you for shopping with us!`;
        break;
      case "payment_confirmation":
        message = `Payment confirmed for order #${order._id.toString().substr(0, 8)}. Amount: UGX ${order.total.toLocaleString()}. Your order is being processed.`;
        break;
      case "dispatch_notification":
        message = `Your order #${order._id.toString().substr(0, 8)} has been dispatched. Track your order at our website.`;
        break;
      case "delivery_eta":
        message = `Your order #${order._id.toString().substr(0, 8)} will be delivered within 24 hours. Keep UGX ${order.total.toLocaleString()} ready for Cash on Delivery.`;
        break;
      default:
        message = `Order update for #${order._id.toString().substr(0, 8)}.`;
    }

    // Log the SMS (in real implementation, send via Africa's Talking)
    logger.info(`SMS sent to ${phoneNumber}`, {
      orderId,
      phoneNumber,
      messageType,
      message,
      userId: req.user._id,
    });

    // Update order with SMS notification flag
    if (!order.smsNotifications) {
      order.smsNotifications = true;
      await order.save();
    }

    res.json({
      message: "SMS notification sent successfully",
      orderId,
      phoneNumber,
      messageType,
    });
  } catch (error) {
    logger.error("Send SMS error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/sms/order/{orderId}/opt-in:
 *   post:
 *     summary: Opt-in to SMS notifications for order (Uganda-specific)
 *     tags: [SMS Uganda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: SMS opt-in successful
 */
router.post("/order/:orderId/opt-in", authenticateJWT, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { phoneNumber } = req.body;

    // Validate input
    if (!phoneNumber) {
      return res.status(400).json({ error: "phoneNumber is required" });
    }

    // Get order
    const order = await Order.findById(orderId).populate("user");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if order belongs to user
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Update order with SMS notification preference
    order.smsNotifications = true;
    if (!order.shippingAddress) {
      order.shippingAddress = {};
    }
    order.shippingAddress.phone = phoneNumber;
    
    await order.save();

    logger.info(`SMS opt-in for order ${orderId}`, {
      orderId,
      phoneNumber,
      userId: req.user._id,
    });

    res.json({
      message: "SMS notifications enabled for this order",
      orderId,
      phoneNumber,
    });
  } catch (error) {
    logger.error("SMS opt-in error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/sms/order/{orderId}/opt-out:
 *   post:
 *     summary: Opt-out of SMS notifications for order (Uganda-specific)
 *     tags: [SMS Uganda]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: SMS opt-out successful
 */
router.post("/order/:orderId/opt-out", authenticateJWT, async (req, res) => {
  try {
    const { orderId } = req.params;

    // Get order
    const order = await Order.findById(orderId).populate("user");

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check if order belongs to user
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: "Forbidden" });
    }

    // Update order with SMS notification preference
    order.smsNotifications = false;
    await order.save();

    logger.info(`SMS opt-out for order ${orderId}`, {
      orderId,
      userId: req.user._id,
    });

    res.json({
      message: "SMS notifications disabled for this order",
      orderId,
    });
  } catch (error) {
    logger.error("SMS opt-out error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// Admin routes for SMS management

/**
 * @swagger
 * /api/admin/sms/bulk:
 *   post:
 *     summary: Send bulk SMS to customers (Admin only)
 *     tags: [SMS Uganda Admin]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               phoneNumbers:
 *                 type: array
 *                 items:
 *                   type: string
 *               message:
 *                 type: string
 *     responses:
 *       200:
 *         description: Bulk SMS sent
 */
router.post("/admin/sms/bulk", authenticateJWT, authorizeRoles("admin"), async (req, res) => {
  try {
    const { phoneNumbers, message } = req.body;

    // Validate input
    if (!phoneNumbers || !Array.isArray(phoneNumbers) || !message) {
      return res.status(400).json({ error: "phoneNumbers array and message are required" });
    }

    if (phoneNumbers.length === 0) {
      return res.status(400).json({ error: "phoneNumbers array cannot be empty" });
    }

    if (message.length > 160) {
      return res.status(400).json({ error: "Message too long. Maximum 160 characters." });
    }

    // In a real implementation, we would send bulk SMS via Africa's Talking API
    // For now, we'll simulate the process

    logger.info(`Bulk SMS sent`, {
      phoneNumbersCount: phoneNumbers.length,
      message,
      adminId: req.user._id,
    });

    res.json({
      message: `Bulk SMS sent to ${phoneNumbers.length} recipients`,
      recipients: phoneNumbers.length,
    });
  } catch (error) {
    logger.error("Bulk SMS error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;