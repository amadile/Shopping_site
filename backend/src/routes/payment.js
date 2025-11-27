import express from "express";
import { body, validationResult } from "express-validator";
import Stripe from "stripe";
import { logger } from "../config/logger.js";
import { authenticateJWT } from "../middleware/auth.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import * as paypalService from "../services/paypalService.js";
import { calculateOrderCommissions } from "../services/commissionService.js";

const router = express.Router();

const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null;

router.post(
  "/create-payment-intent",
  authenticateJWT,
  body("orderId").optional().isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      if (!stripe) {
        return res.json({
          clientSecret: "mock_client_secret_for_testing",
          orderId: req.body.orderId || "mock_order_id",
          message: "Mock payment intent created (Stripe not configured)",
        });
      }

      let amount, orderId;

      if (req.body.orderId) {
        const order = await Order.findOne({
          _id: req.body.orderId,
          user: req.user._id,
        });
        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }
        if (order.status !== "pending") {
          return res.status(400).json({ error: "Order already processed" });
        }
        amount = Math.round(order.total * 100);
        orderId = order._id;
      } else {
        const cart = await Cart.findOne({ user: req.user._id }).populate(
          "items.product"
        );
        if (!cart || cart.items.length === 0) {
          return res.status(400).json({ error: "Cart is empty" });
        }
        const total = cart.items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
        amount = Math.round(total * 100);
      }

      const paymentIntent = await stripe.paymentIntents.create({
        amount,
        currency: "usd",
        metadata: {
          userId: req.user._id.toString(),
          orderId: orderId ? orderId.toString() : "new",
        },
      });

      logger.info(`Payment intent created: ${paymentIntent.id}`);

      res.json({
        clientSecret: paymentIntent.client_secret,
        orderId,
      });
    } catch (err) {
      logger.error("Payment intent error:", err);
      res.status(500).json({ error: err.message || "Server error" });
    }
  }
);

// -----------------------------
// PayPal endpoints
// -----------------------------
router.post(
  "/paypal/create-order",
  authenticateJWT,
  body("orderId").optional().isMongoId(),
  async (req, res) => {
    try {
      const { orderId } = req.body;
      let amount = 0;
      let reference = orderId;

      if (orderId) {
        const order = await Order.findOne({ _id: orderId, user: req.user._id });
        if (!order) return res.status(404).json({ error: "Order not found" });
        if (order.status !== "pending")
          return res.status(400).json({ error: "Order already processed" });
        amount = order.total;
      } else {
        const cart = await Cart.findOne({ user: req.user._id }).populate(
          "items.product"
        );
        if (!cart || cart.items.length === 0)
          return res.status(400).json({ error: "Cart is empty" });
        amount = cart.items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
      }

      const hostBase =
        process.env.FRONTEND_URL ||
        process.env.BASE_URL ||
        "http://localhost:5000";
      const returnUrl = `${hostBase}/paypal/success`;
      const cancelUrl = `${hostBase}/paypal/cancel`;

      const order = await paypalService.createOrder({
        total: amount,
        currency: "USD",
        returnUrl,
        cancelUrl,
        reference,
      });
      if (!order)
        return res.status(500).json({ error: "PayPal not configured" });

      // Find approval link
      const approval =
        order.links && order.links.find((l) => l.rel === "approve");

      res.json({
        paypalOrder: order,
        approveUrl: approval ? approval.href : null,
      });
    } catch (err) {
      logger.error("PayPal create-order error:", err);
      res.status(500).json({ error: err.message || "Server error" });
    }
  }
);

router.post(
  "/paypal/capture-order",
  authenticateJWT,
  body("paypalOrderId").notEmpty(),
  body("orderId").optional().isMongoId(),
  async (req, res) => {
    try {
      const { paypalOrderId, orderId } = req.body;
      const capture = await paypalService.captureOrder(paypalOrderId);
      if (!capture)
        return res
          .status(500)
          .json({ error: "Capture failed or PayPal not configured" });

      // If orderId provided, mark order as paid
      let order;
      if (orderId) {
        order = await Order.findOne({ _id: orderId, user: req.user._id });
        if (!order) return res.status(404).json({ error: "Order not found" });
        order.status = "paid";
        order.paymentIntentId = paypalOrderId;
        await order.save();
        
        // Calculate vendor commissions
        try {
          await calculateOrderCommissions(order);
        } catch (commError) {
          logger.error("Commission calculation error:", commError);
          // Don't fail the payment, just log the error
        }
      } else {
        // Create order from cart
        const cart = await Cart.findOne({ user: req.user._id }).populate(
          "items.product"
        );
        if (!cart || cart.items.length === 0)
          return res.status(400).json({ error: "Cart is empty" });

        const orderItems = cart.items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        }));
        const total = orderItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        order = new Order({
          user: req.user._id,
          items: orderItems,
          total,
          status: "paid",
          paymentIntentId: paypalOrderId,
        });
        await order.save();

        // Calculate vendor commissions
        try {
          await calculateOrderCommissions(order);
        } catch (commError) {
          logger.error("Commission calculation error:", commError);
          // Don't fail the payment, just log the error
        }

        cart.items = [];
        await cart.save();
      }

      res.json({ success: true, order, capture });
    } catch (err) {
      logger.error("PayPal capture error:", err);
      res.status(500).json({ error: err.message || "Server error" });
    }
  }
);

// PayPal webhook endpoint - accept raw JSON
router.post(
  "/paypal/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      const verified = await paypalService.verifyWebhook(
        req.headers,
        JSON.parse(req.body.toString())
      );
      if (!verified) {
        logger.warn("Unverified PayPal webhook");
        return res.status(400).send("Webhook verification failed");
      }

      const event = JSON.parse(req.body.toString());
      logger.info("PayPal webhook event:", event.event_type);

      switch (event.event_type) {
        case "CHECKOUT.ORDER.APPROVED":
          // optional: capture automatically or let frontend call capture
          break;
        case "PAYMENT.CAPTURE.COMPLETED":
          const capture = event.resource;
          // Find and update order by reference id or capture id
          const order = await Order.findOne({
            paymentIntentId:
              capture.supplementary_data?.related_ids?.order_id || capture.id,
          });
          if (order && order.status === "pending") {
            order.status = "paid";
            await order.save();
            
            // Calculate vendor commissions
            try {
              await calculateOrderCommissions(order);
            } catch (commError) {
              logger.error("Commission calculation error:", commError);
            }
          }
          break;
        default:
          logger.info(`Unhandled PayPal event ${event.event_type}`);
      }

      res.status(200).json({ received: true });
    } catch (err) {
      logger.error("PayPal webhook processing error:", err);
      res.status(500).send("Server error");
    }
  }
);

router.post(
  "/confirm-payment",
  authenticateJWT,
  body("paymentIntentId").notEmpty(),
  body("orderId").optional().isMongoId(),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { paymentIntentId, orderId } = req.body;

      if (!stripe) {
        if (orderId) {
          const order = await Order.findById(orderId);
        if (order) {
          order.status = "paid";
          order.paymentIntentId = paymentIntentId;
          await order.save();
          
          // Calculate vendor commissions
          try {
            await calculateOrderCommissions(order);
          } catch (commError) {
            logger.error("Commission calculation error:", commError);
          }
        }
        }
        logger.info("Mock payment confirmed");
        return res.json({
          success: true,
          message: "Mock payment confirmed (Stripe not configured)",
          orderId,
        });
      }

      const paymentIntent = await stripe.paymentIntents.retrieve(
        paymentIntentId
      );

      if (paymentIntent.status !== "succeeded") {
        return res.status(400).json({ error: "Payment not successful" });
      }

      let order;
      if (orderId) {
        order = await Order.findOne({
          _id: orderId,
          user: req.user._id,
        });
        if (!order) {
          return res.status(404).json({ error: "Order not found" });
        }
        order.status = "paid";
        order.paymentIntentId = paymentIntentId;
        await order.save();
        
        // Calculate vendor commissions
        try {
          await calculateOrderCommissions(order);
        } catch (commError) {
          logger.error("Commission calculation error:", commError);
          // Don't fail the payment, just log the error
        }
      } else {
        const cart = await Cart.findOne({ user: req.user._id }).populate(
          "items.product"
        );
        if (!cart || cart.items.length === 0) {
          return res.status(400).json({ error: "Cart is empty" });
        }

        const orderItems = cart.items.map((item) => ({
          product: item.product._id,
          quantity: item.quantity,
          price: item.product.price,
        }));
        const total = orderItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        order = new Order({
          user: req.user._id,
          items: orderItems,
          total,
          status: "paid",
          paymentIntentId,
        });
        await order.save();

        // Calculate vendor commissions
        try {
          await calculateOrderCommissions(order);
        } catch (commError) {
          logger.error("Commission calculation error:", commError);
          // Don't fail the payment, just log the error
        }

        cart.items = [];
        await cart.save();
      }

      logger.info(`Payment confirmed for order: ${order._id}`);

      res.json({
        success: true,
        order,
      });
    } catch (err) {
      logger.error("Payment confirmation error:", err);
      res.status(500).json({ error: err.message || "Server error" });
    }
  }
);

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    if (!stripe) {
      return res.status(200).json({ received: true });
    }

    const sig = req.headers["stripe-signature"];
    let event;

    try {
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err) {
      logger.error("Webhook signature verification failed:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    switch (event.type) {
      case "payment_intent.succeeded":
        const paymentIntent = event.data.object;
        logger.info("PaymentIntent was successful:", paymentIntent.id);
        const order = await Order.findOne({
          paymentIntentId: paymentIntent.id,
        });
        if (order && order.status === "pending") {
          order.status = "paid";
          await order.save();
          
          // Calculate vendor commissions
          try {
            await calculateOrderCommissions(order);
          } catch (commError) {
            logger.error("Commission calculation error:", commError);
          }
        }
        break;
      case "payment_intent.payment_failed":
        const failedIntent = event.data.object;
        logger.warn("PaymentIntent failed:", failedIntent.id);
        break;
      default:
        logger.info(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  }
);

export default router;
