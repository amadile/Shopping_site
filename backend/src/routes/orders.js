import express from "express";
import { body, validationResult } from "express-validator";
import { authenticateJWT } from "../middleware/auth.js";
import Cart from "../models/Cart.js";
import Coupon from "../models/Coupon.js";
import Order from "../models/Order.js";
import emailService from "../services/emailService.js";
import invoiceService from "../services/invoiceService.js";
import orderCancellationService from "../services/orderCancellationService.js";
import trackingService from "../services/trackingService.js";
import { calculateOrderCommissions } from "../services/commissionService.js";

const router = express.Router();

// Place an order (checkout)
router.post("/checkout", authenticateJWT, async (req, res) => {
  const startTime = Date.now();
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // Build order items with variant support and calculate subtotal
    const orderItems = cart.items.map((item) => {
      const price = item.variantDetails?.price || item.product.price;
      const orderItem = {
        product: item.product._id,
        quantity: item.quantity,
        price: price,
      };

      // Only include variant fields if they exist and are not null
      // Note: typeof null === 'object' in JavaScript, so we need explicit null check
      if (item.variantId && item.variantId !== null) {
        orderItem.variantId = item.variantId;
      }
      if (
        item.variantDetails !== null &&
        item.variantDetails !== undefined &&
        typeof item.variantDetails === "object"
      ) {
        orderItem.variantDetails = item.variantDetails;
      }

      return orderItem;
    });

    const subtotal = orderItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Calculate tax (10% standard rate)
    const taxRate = 0.1;
    const tax = subtotal * taxRate;

    // Shipping fee from frontend (validated by zone selector)
    const shippingFee = Number(req.body.shippingFee) || 0;

    let total = subtotal + tax + shippingFee;
    let appliedCoupon = null;

    // Handle applied coupon (discount applied to subtotal before tax)
    let couponPromise = null;
    if (cart.appliedCoupon && cart.appliedCoupon.couponId) {
      const coupon = await Coupon.findById(cart.appliedCoupon.couponId);

      if (coupon) {
        // Revalidate coupon at checkout
        const validCheck = coupon.isValid();
        const userCheck = coupon.canUserUse(req.user._id);

        if (validCheck.valid && userCheck.valid) {
          const discountInfo = coupon.calculateDiscount(subtotal);
          if (discountInfo.valid) {
            const discountedSubtotal = discountInfo.finalTotal;
            const discountedTax = discountedSubtotal * taxRate;
            total = discountedSubtotal + discountedTax + shippingFee;

            appliedCoupon = {
              couponId: coupon._id,
              code: coupon.code,
              discountType: coupon.discountType,
              discountValue: coupon.discountValue,
              discountAmount: discountInfo.discount,
            };

            // Record coupon usage asynchronously (don't block)
            couponPromise = coupon
              .recordUsage(req.user._id)
              .catch((err) =>
                console.error("Coupon usage recording failed:", err)
              );
          }
        }
      }
    }

    // Create order
    const order = new Order({
      user: req.user._id,
      items: orderItems,
      subtotal,
      tax,
      shippingFee,
      shippingAddress: req.body.shippingAddress,
      paymentMethod: req.body.paymentMethod || "paypal",
      notes: req.body.notes,
      appliedCoupon,
      total,
      status: "pending",
    });

    // Clear cart items in parallel with order save
    cart.items = [];
    cart.appliedCoupon = undefined;

    // Execute order save and cart clear in parallel
    const savePromises = [order.save(), cart.save()];
    if (couponPromise) {
      savePromises.push(couponPromise);
    }
    await Promise.all(savePromises);

    console.log("Order created:", {
      orderId: order._id,
      subtotal,
      tax,
      total,
      itemCount: orderItems.length,
    });

    // Send order confirmation email asynchronously (don't block response)
    emailService.sendOrderConfirmation(req.user, order).catch((err) =>
      console.error("Order confirmation email failed:", err)
    );

    // Calculate commissions asynchronously
    calculateOrderCommissions(order).catch((err) =>
      console.error("Commission calculation failed:", err)
    );

    const processingTime = Date.now() - startTime;
    console.log(`Order placed successfully in ${processingTime}ms`);

    // Return order with tax information
    res.status(201).json({
      ...order.toObject(),
      tax, // Include tax in response even though it's not stored in Order model
      breakdown: {
        subtotal,
        tax,
        discount: appliedCoupon?.discountAmount || 0,
        total,
      },
    });
  } catch (err) {
    console.error("Checkout error:", err);
    console.error("Error details:", {
      name: err.name,
      message: err.message,
      errors: err.errors,
    });
    res.status(500).json({ error: "Server error", details: err.message });
  }
});

// Get current user's orders (with pagination and sorting)
router.get("/", authenticateJWT, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Count total orders for pagination
    const totalOrders = await Order.countDocuments({ user: req.user._id });
    const totalPages = Math.ceil(totalOrders / limit);

    // Fetch orders with pagination, sorting (newest first), and optimized population
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 }) // Most recent first
      .skip(skip)
      .limit(limit)
      .populate({
        path: "items.product",
        select: "name price images category", // Only load needed fields
      })
      .lean(); // Convert to plain JavaScript objects for better performance

    res.json({
      orders,
      currentPage: page,
      totalPages,
      totalOrders,
      hasMore: page < totalPages,
    });
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Get current user's orders (legacy endpoint - keeping for backwards compatibility)
router.get("/my", authenticateJWT, async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate({
        path: "items.product",
        select: "name price images category",
      })
      .lean();
    res.json(orders);
  } catch (err) {
    console.error("Error fetching orders:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get order by ID (optimized)
router.get("/:id", authenticateJWT, async (req, res) => {
  try {
    console.log(`Fetching order ${req.params.id} for user ${req.user._id}`);

    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    })
      .populate({
        path: "items.product",
        select: "name price images category description brand", // Include more details for order page
      })
      .lean(); // Better performance

    if (!order) {
      console.log(`Order ${req.params.id} not found for user ${req.user._id}`);
      return res.status(404).json({ error: "Order not found" });
    }

    console.log(`Order ${req.params.id} fetched successfully`);
    res.json(order);
  } catch (err) {
    console.error("Error fetching order:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Admin: update order status
router.put(
  "/:id/status",
  authenticateJWT,
  body("status").isIn(["pending", "paid", "shipped", "delivered", "cancelled"]),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    try {
      const order = await Order.findById(req.params.id).populate("user");
      if (!order) return res.status(404).json({ error: "Order not found" });

      const oldStatus = order.status;
      order.status = req.body.status;
      await order.save();

      // Send email notification if status changed
      if (oldStatus !== req.body.status) {
        await emailService.sendOrderStatusUpdate(order.user, order);

        // Send SMS notification based on new status
        if (order.smsNotifications) {
          try {
            const smsData = {
              customerPhone: order.shippingAddress?.phone,
              orderNumber: `ORD-${order._id.toString().slice(-8).toUpperCase()}`,
            };

            if (req.body.status === 'shipped') {
              await import('../services/sms.js').then(m => m.sendDispatchNotificationSMS({
                ...smsData,
                trackingNumber: order.tracking?.trackingNumber
              }));
            } else if (req.body.status === 'delivered') {
              await import('../services/sms.js').then(m => m.sendDeliveryConfirmationSMS(smsData));
            }
          } catch (smsError) {
            console.error("Failed to send status update SMS:", smsError);
          }
        }
      }

      res.json(order);
    } catch (err) {
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Cancel an order
router.post(
  "/:id/cancel",
  authenticateJWT,
  body("reason").notEmpty().withMessage("Cancellation reason is required"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const result = await orderCancellationService.cancelOrder(
        req.params.id,
        req.user._id,
        req.body.reason,
        req.user.role === "admin"
      );

      res.json(result);
    } catch (err) {
      console.error("Order cancellation error:", err);
      res.status(400).json({ error: err.message });
    }
  }
);

// Check if order can be cancelled
router.get("/:id/can-cancel", authenticateJWT, async (req, res) => {
  try {
    const result = await orderCancellationService.canCancelOrder(
      req.params.id,
      req.user._id,
      req.user.role === "admin"
    );

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Admin: Get cancellation statistics
router.get("/admin/cancellation-stats", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const { startDate, endDate } = req.query;
    const stats = await orderCancellationService.getCancellationStats(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined
    );

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// Download invoice for an order
router.get("/:id/invoice", authenticateJWT, async (req, res) => {
  try {
    const pdfBuffer = await invoiceService.generateInvoice(
      req.params.id,
      req.user._id,
      req.user.role === "admin"
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice-${req.params.id}.pdf`
    );
    res.send(pdfBuffer);
  } catch (err) {
    console.error("Invoice generation error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Add tracking information to order (Admin only)
router.post(
  "/:id/tracking",
  authenticateJWT,
  body("trackingNumber").notEmpty().withMessage("Tracking number is required"),
  body("carrier")
    .isIn(["fedex", "ups", "dhl", "usps", "other"])
    .withMessage("Invalid carrier"),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if user is admin
      if (req.user.role !== "admin") {
        return res
          .status(403)
          .json({ error: "Admin access required to add tracking information" });
      }

      const result = await trackingService.updateOrderTracking(
        req.params.id,
        {
          trackingNumber: req.body.trackingNumber,
          carrier: req.body.carrier,
          estimatedDelivery: req.body.estimatedDelivery,
          origin: req.body.origin,
          trackingUrl: req.body.trackingUrl,
        },
        req.user
      );

      res.json(result);
    } catch (err) {
      console.error("Add tracking error:", err);
      res.status(400).json({ error: err.message });
    }
  }
);

// Get tracking information for an order
router.get("/:id/tracking", authenticateJWT, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order && req.user.role !== "admin") {
      return res.status(404).json({ error: "Order not found" });
    }

    const trackingInfo = await trackingService.getOrderTracking(req.params.id);

    res.json(trackingInfo);
  } catch (err) {
    console.error("Get tracking error:", err);
    res.status(500).json({ error: "Server error", message: err.message });
  }
});

// Refresh tracking information from carrier API
router.post("/:id/tracking/refresh", authenticateJWT, async (req, res) => {
  try {
    const order = await Order.findOne({
      _id: req.params.id,
      user: req.user._id,
    });

    if (!order && req.user.role !== "admin") {
      return res.status(404).json({ error: "Order not found" });
    }

    const result = await trackingService.refreshTracking(req.params.id);

    res.json(result);
  } catch (err) {
    console.error("Refresh tracking error:", err);
    res.status(400).json({ error: err.message });
  }
});

// Get carrier configuration status (Admin only)
router.get("/admin/carrier-status", authenticateJWT, async (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Admin access required" });
    }

    const carrierStatus = trackingService.getCarrierStatus();

    res.json({
      carriers: carrierStatus,
      message:
        "Configure carrier API keys in .env to enable real-time tracking",
    });
  } catch (err) {
    console.error("Get carrier status error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
