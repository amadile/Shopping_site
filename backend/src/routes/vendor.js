import bcrypt from "bcrypt";
import express from "express";
import { body, validationResult } from "express-validator";
import fs from "fs";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import multer from "multer";
import path from "path";
import { logger } from "../config/logger.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import { authLimiter } from "../middleware/rateLimiter.js";
import Order from "../models/Order.js";
import Payout from "../models/Payout.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import VendorAnalytics from "../models/VendorAnalytics.js";

const router = express.Router();

/**
 * @swagger
 * /api/vendor/register:
 *   post:
 *     summary: Register as a new vendor
 *     tags: [Vendor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - businessEmail
 *               - businessPhone
 *               - password
 *               - district
 *               - businessType
 *             properties:
 *               businessName:
 *                 type: string
 *               businessEmail:
 *                 type: string
 *                 format: email
 *               businessPhone:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 8
 *               district:
 *                 type: string
 *               zone:
 *                 type: string
 *               landmark:
 *                 type: string
 *               tinNumber:
 *                 type: string
 *               businessType:
 *                 type: string
 *                 enum: [individual, company]
 *     responses:
 *       201:
 *         description: Vendor registered successfully
 *       400:
 *         description: Validation error or vendor already exists
 *       500:
 *         description: Server error
 */
router.post(
  "/register",
  authLimiter,
  [
    body("businessName")
      .trim()
      .notEmpty()
      .withMessage("Business name is required"),
    body("businessEmail")
      .isEmail()
      .withMessage("Valid business email is required"),
    body("businessPhone").notEmpty().withMessage("Business phone is required"),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters"),
    body("district").notEmpty().withMessage("District is required"),
    body("zone").optional(),
    body("landmark").optional(),
    body("tinNumber").optional(),
    body("businessType")
      .isIn(["individual", "company"])
      .withMessage("Invalid business type"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const {
        businessName,
        businessEmail,
        businessPhone,
        password,
        district,
        zone,
        landmark,
        tinNumber,
        businessType,
      } = req.body;

      // Check if email or phone already exists
      const existingVendor = await Vendor.findOne({
        $or: [{ businessEmail }, { businessPhone }],
      }).session(session);

      if (existingVendor) {
        await session.abortTransaction();
        return res.status(400).json({
          error: "A vendor with this email or phone already exists",
        });
      }

      // Create user account
      const user = new User({
        name: businessName,
        email: businessEmail,
        password: await bcrypt.hash(password, 10),
        role: "vendor",
        isVerified: true, // Auto-verify vendors for now
      });

      await user.save({ session });

      // Create vendor profile
      const vendor = new Vendor({
        user: user._id,
        businessName,
        businessEmail,
        businessPhone,
        businessType,
        tinNumber,
        address: {
          district,
          zone,
          landmark,
          country: "Uganda",
        },
        verificationStatus: "pending",
        commissionRate: 15, // Default commission rate
      });

      await vendor.save({ session });
      await session.commitTransaction();

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      // Remove sensitive data before sending response
      user.password = undefined;

      res.status(201).json({
        message:
          "Vendor registration successful. Please complete your profile.",
        token,
        vendor: {
          id: vendor._id,
          businessName: vendor.businessName,
          status: vendor.verificationStatus,
          nextSteps: [
            "Complete your business profile",
            "Upload required documents",
            "Set up your payment method",
          ],
        },
      });
    } catch (error) {
      await session.abortTransaction();
      logger.error("Vendor registration error:", error);
      res.status(500).json({ error: "Registration failed. Please try again." });
    } finally {
      session.endSession();
    }
  }
);

/**
 * @swagger
 * /api/vendor/login:
 *   post:
 *     summary: Login as a vendor
 *     tags: [Vendor]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post(
  "/login",
  authLimiter,
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { email, password } = req.body;

      // Find user with vendor role
      const user = await User.findOne({ email, role: "vendor" });
      if (!user) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Find vendor profile
      const vendor = await Vendor.findOne({ user: user._id });
      if (!vendor) {
        return res.status(404).json({ error: "Vendor profile not found" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "30d" }
      );

      // Remove sensitive data before sending response
      user.password = undefined;

      res.json({
        message: "Login successful",
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          vendorProfile: {
            id: vendor._id,
            businessName: vendor.businessName,
            status: vendor.verificationStatus,
          },
        },
      });
    } catch (error) {
      logger.error("Vendor login error:", error);
      res.status(500).json({ error: "Login failed. Please try again." });
    }
  }
);

/**
 * @swagger
 * /api/vendor/register:
 *   post:
 *     summary: Register as a vendor
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - businessName
 *               - businessEmail
 *               - businessPhone
 *             properties:
 *               businessName:
 *                 type: string
 *               businessEmail:
 *                 type: string
 *               businessPhone:
 *                 type: string
 *               description:
 *                 type: string
 *               address:
 *                 type: object
 *               businessType:
 *                 type: string
 *                 enum: [individual, company]
 *               registrationNumber:
 *                 type: string
 *               tinNumber:
 *                 type: string
 *               phoneNumbers:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Vendor registration successful
 */
router.post("/register", authenticateJWT, async (req, res) => {
  try {
    const {
      businessName,
      businessEmail,
      businessPhone,
      description,
      address,
      businessType,
      registrationNumber,
      tinNumber,
      phoneNumbers,
    } = req.body;

    // Check if user already has a vendor account
    const existingVendor = await Vendor.findOne({ user: req.user._id });
    if (existingVendor) {
      return res.status(400).json({ error: req.t("vendor.alreadyRegistered") });
    }

    const vendor = new Vendor({
      user: req.user._id,
      businessName,
      businessEmail,
      businessPhone,
      description,
      address,
      businessType,
      registrationNumber,
      tinNumber,
      phoneNumbers,
      // Set default values for Uganda
      "storeSettings.currencies": ["UGX"],
      "storeSettings.languages": ["en", "lg"],
      "notifications.smsNotifications": true,
    });

    await vendor.save();

    logger.info(`New vendor registered: ${businessName}`, {
      vendorId: vendor._id,
      userId: req.user._id,
    });

    res.status(201).json({
      message: req.t("vendor.registrationSuccess"),
      vendor: {
        id: vendor._id,
        businessName: vendor.businessName,
        verificationStatus: vendor.verificationStatus,
      },
    });
  } catch (error) {
    logger.error("Vendor registration error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/vendor/profile:
 *   get:
 *     summary: Get vendor profile
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Vendor profile
 */
router.get("/profile", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id }).populate(
      "user",
      "name email"
    );

    if (!vendor) {
      return res.status(404).json({ error: req.t("vendor.notFound") });
    }

    res.json({ vendor });
  } catch (error) {
    logger.error("Get vendor profile error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/vendor/profile:
 *   put:
 *     summary: Update vendor profile
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put("/profile", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ error: req.t("vendor.notFound") });
    }

    const allowedUpdates = [
      "businessName",
      "businessEmail",
      "businessPhone",
      "description",
      "address",
      "logo",
      "banner",
      "socialMedia",
      "storeSettings",
      "notifications",
      "businessType",
      "registrationNumber",
      "tinNumber",
      "phoneNumbers",
      "payoutInfo",
    ];

    Object.keys(req.body).forEach((key) => {
      if (allowedUpdates.includes(key)) {
        if (
          typeof req.body[key] === "object" &&
          !Array.isArray(req.body[key])
        ) {
          vendor[key] = { ...vendor[key].toObject(), ...req.body[key] };
        } else {
          vendor[key] = req.body[key];
        }
      }
    });

    await vendor.save();

    logger.info(`Vendor profile updated: ${vendor.businessName}`, {
      vendorId: vendor._id,
    });

    res.json({
      message: req.t("vendor.profileUpdated"),
      vendor,
    });
  } catch (error) {
    logger.error("Update vendor profile error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/vendor/dashboard:
 *   get:
 *     summary: Get vendor dashboard statistics
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard statistics
 */
router.get("/dashboard", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ error: req.t("vendor.notFound") });
    }

    // Get recent orders - query by vendor field on order (set during commission calculation)
    // Also check items.product.vendor as fallback for older orders
    const recentOrders = await Order.find({
      $or: [
        { vendor: vendor._id },
        {
          "items.product": {
            $in: await Product.find({ vendor: vendor._id }).distinct("_id"),
          },
        },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("user", "name email")
      .populate({
        path: "items.product",
        select: "name price images",
      });

    // Get product statistics
    const products = await Product.find({ vendor: vendor._id });
    const activeProducts = products.filter((p) => p.isActive).length;
    const lowStockProducts = products.filter((p) => p.stock < 10).length;

    // Calculate period statistics (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Get vendor product IDs for query
    const vendorProductIds = await Product.find({
      vendor: vendor._id,
    }).distinct("_id");

    const periodOrders = await Order.countDocuments({
      $or: [
        { vendor: vendor._id },
        { "items.product": { $in: vendorProductIds } },
      ],
      createdAt: { $gte: thirtyDaysAgo },
    });

    const dashboard = {
      overview: {
        totalSales: vendor.totalSales,
        totalRevenue: vendor.totalRevenue,
        totalCommission: vendor.totalCommission,
        netRevenue: vendor.netRevenue,
        pendingPayout: vendor.pendingPayout,
        totalOrders: vendor.totalOrders,
        rating: vendor.rating,
        totalReviews: vendor.totalReviews,
      },
      products: {
        total: vendor.totalProducts,
        active: activeProducts,
        lowStock: lowStockProducts,
      },
      recentPeriod: {
        days: 30,
        orders: periodOrders,
      },
      recentOrders: recentOrders.map((order) => ({
        id: order._id,
        orderNumber: order.orderNumber,
        customer: order.user.name,
        total: order.total,
        status: order.status,
        date: order.createdAt,
      })),
      performance: {
        averageResponseTime: vendor.metrics.averageResponseTime,
        orderFulfillmentRate: vendor.metrics.orderFulfillmentRate,
        returnRate: vendor.metrics.returnRate,
      },
    };

    res.json({ dashboard });
  } catch (error) {
    logger.error("Get vendor dashboard error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/vendor/orders:
 *   get:
 *     summary: Get vendor orders
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of orders
 */
router.get("/orders", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ error: req.t("vendor.notFound") });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    // Get vendor product IDs for query
    const vendorProductIds = await Product.find({
      vendor: vendor._id,
    }).distinct("_id");

    // Query orders by vendor field or by product vendor
    const query = {
      $or: [
        { vendor: vendor._id },
        { "items.product": { $in: vendorProductIds } },
      ],
    };
    if (status) {
      query.status = status;
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("user", "name email phone")
      .populate({
        path: "items.product",
        select: "name price images vendor",
        populate: {
          path: "vendor",
          select: "businessName",
        },
      });

    const total = await Order.countDocuments(query);

    res.json({
      orders,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Get vendor orders error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/vendor/orders/{orderId}/status:
 *   put:
 *     summary: Update order status
 *     tags: [Vendor]
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
 *               status:
 *                 type: string
 *               trackingNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Order status updated
 */
router.put("/orders/:orderId/status", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ error: req.t("vendor.notFound") });
    }

    const { orderId } = req.params;
    const { status, trackingNumber } = req.body;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ error: req.t("order.notFound") });
    }

    // Populate products to check vendor ownership
    await order.populate({
      path: "items.product",
      populate: { path: "vendor" },
    });

    // Verify vendor owns products in this order
    // Check by order.vendor field or by product.vendor
    const isVendorOrder =
      (order.vendor && order.vendor.toString() === vendor._id.toString()) ||
      order.items.some((item) => {
        const productVendorId =
          item.product?.vendor?._id || item.product?.vendor;
        return (
          productVendorId &&
          productVendorId.toString() === vendor._id.toString()
        );
      });

    if (!isVendorOrder) {
      return res.status(403).json({ error: req.t("error.forbidden") });
    }

    order.status = status;
    if (trackingNumber) {
      order.trackingNumber = trackingNumber;
    }

    await order.save();

    logger.info(`Order ${orderId} status updated to ${status}`, {
      vendorId: vendor._id,
      orderId,
    });

    res.json({
      message: req.t("order.statusUpdated"),
      order,
    });
  } catch (error) {
    logger.error("Update order status error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/vendor/orders/{orderId}:
 *   get:
 *     summary: Get order details
 *     tags: [Vendor]
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
 *         description: Order details
 */
router.get("/orders/:orderId", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ error: req.t("vendor.notFound") });
    }

    const { orderId } = req.params;

    const order = await Order.findById(orderId)
      .populate("user", "name email phone")
      .populate({
        path: "items.product",
        select: "name price images vendor",
        populate: {
          path: "vendor",
          select: "businessName",
        },
      });

    if (!order) {
      return res.status(404).json({ error: req.t("order.notFound") });
    }

    // Verify vendor owns products in this order
    const isVendorOrder =
      (order.vendor && order.vendor.toString() === vendor._id.toString()) ||
      order.items.some((item) => {
        const productVendorId =
          item.product?.vendor?._id || item.product?.vendor;
        return (
          productVendorId &&
          productVendorId.toString() === vendor._id.toString()
        );
      });

    if (!isVendorOrder) {
      return res.status(403).json({ error: req.t("error.forbidden") });
    }

    res.json({ order });
  } catch (error) {
    logger.error("Get order details error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/vendor/analytics/chart:
 *   get:
 *     summary: Get analytics chart data
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Analytics chart data
 */
// Ad-blocker safe endpoint
router.get("/stats/chart", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const { startDate, endDate } = req.query;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date();

    if (!startDate) {
      start.setDate(end.getDate() - 30); // Default to last 30 days
    }

    // Ensure dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const analytics = await VendorAnalytics.getAnalytics(
      vendor._id,
      start,
      end
    );

    // Fill in missing dates with zero values
    const result = [];
    const current = new Date(start);
    const analyticsMap = new Map(
      analytics.map((a) => [a.date.toISOString().split("T")[0], a])
    );

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      const data = analyticsMap.get(dateStr) || {
        date: new Date(current),
        revenue: 0,
        orders: 0,
        shopViews: 0,
        productViews: 0,
      };

      result.push({
        date: dateStr,
        revenue: data.revenue || 0,
        orders: data.orders || 0,
        views: (data.shopViews || 0) + (data.productViews || 0),
      });

      current.setDate(current.getDate() + 1);
    }

    res.json(result);
  } catch (error) {
    logger.error("Get stats chart error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/analytics/chart", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const { startDate, endDate } = req.query;
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date();

    if (!startDate) {
      start.setDate(end.getDate() - 30); // Default to last 30 days
    }

    // Ensure dates are valid
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return res.status(400).json({ error: "Invalid date format" });
    }

    const analytics = await VendorAnalytics.getAnalytics(
      vendor._id,
      start,
      end
    );

    // Fill in missing dates with zero values
    const result = [];
    const current = new Date(start);
    const analyticsMap = new Map(
      analytics.map((a) => [a.date.toISOString().split("T")[0], a])
    );

    while (current <= end) {
      const dateStr = current.toISOString().split("T")[0];
      const data = analyticsMap.get(dateStr) || {
        date: new Date(current),
        revenue: 0,
        orders: 0,
        shopViews: 0,
        productViews: 0,
      };

      result.push({
        date: dateStr,
        revenue: data.revenue || 0,
        orders: data.orders || 0,
        views: (data.shopViews || 0) + (data.productViews || 0),
      });

      current.setDate(current.getDate() + 1);
    }

    res.json(result);
  } catch (error) {
    logger.error("Get analytics chart error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/vendor/analytics/summary:
 *   get:
 *     summary: Get analytics summary
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Analytics summary
 */
// Ad-blocker safe endpoint
router.get("/stats/summary", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const days = parseInt(req.query.days) || 30;
    logger.info(
      `Fetching stats summary for vendor ${vendor._id} (User: ${req.user._id}) for last ${days} days`
    );

    const stats = await VendorAnalytics.getAggregatedStats(vendor._id, days);
    logger.info(`Stats result: ${JSON.stringify(stats)}`);

    res.json(
      stats || {
        totalRevenue: 0,
        totalOrders: 0,
        totalShopViews: 0,
        totalProductClicks: 0,
        totalReviews: 0,
        totalAddToCart: 0,
      }
    );
  } catch (error) {
    logger.error("Get stats summary error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/analytics/summary", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const days = parseInt(req.query.days) || 30;
    logger.info(
      `Fetching analytics summary for vendor ${vendor._id} (User: ${req.user._id}) for last ${days} days`
    );

    const stats = await VendorAnalytics.getAggregatedStats(vendor._id, days);
    logger.info(`Analytics stats result: ${JSON.stringify(stats)}`);

    res.json(
      stats || {
        totalRevenue: 0,
        totalOrders: 0,
        totalShopViews: 0,
        totalProductClicks: 0,
        totalReviews: 0,
        totalAddToCart: 0,
      }
    );
  } catch (error) {
    logger.error("Get analytics summary error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/vendor/orders/stats:
 *   get:
 *     summary: Get order statistics
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Order statistics
 */
router.get("/orders/stats", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ error: req.t("vendor.notFound") });
    }

    // Get vendor product IDs
    const vendorProductIds = await Product.find({
      vendor: vendor._id,
    }).distinct("_id");

    // Query for vendor orders
    const orderQuery = {
      $or: [
        { vendor: vendor._id },
        { "items.product": { $in: vendorProductIds } },
      ],
    };

    // Total orders
    const totalOrders = await Order.countDocuments(orderQuery);

    // Orders by status
    const pendingOrders = await Order.countDocuments({
      ...orderQuery,
      status: "pending",
    });
    const paidOrders = await Order.countDocuments({
      ...orderQuery,
      status: "paid",
    });
    const shippedOrders = await Order.countDocuments({
      ...orderQuery,
      status: "shipped",
    });
    const deliveredOrders = await Order.countDocuments({
      ...orderQuery,
      status: "delivered",
    });
    const cancelledOrders = await Order.countDocuments({
      ...orderQuery,
      status: "cancelled",
    });

    // This month's orders
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const thisMonthOrders = await Order.countDocuments({
      ...orderQuery,
      createdAt: { $gte: startOfMonth },
    });

    // Calculate revenue from orders
    const orders = await Order.find(orderQuery);
    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );

    const thisMonthOrdersData = await Order.find({
      ...orderQuery,
      createdAt: { $gte: startOfMonth },
    });
    const thisMonthRevenue = thisMonthOrdersData.reduce(
      (sum, order) => sum + (order.total || 0),
      0
    );

    const stats = {
      totalOrders,
      pendingOrders,
      paidOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      totalRevenue,
      thisMonthOrders,
      thisMonthRevenue,
      averageOrderValue: totalOrders > 0 ? totalRevenue / totalOrders : 0,
    };

    res.json({ stats });
  } catch (error) {
    logger.error("Get order stats error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/vendor/products:
 *   get:
 *     summary: Get vendor products
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of products
 */
router.get("/products", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ error: req.t("vendor.notFound") });
    }

    const { page = 1, limit = 20, category, isActive } = req.query;
    const skip = (page - 1) * limit;

    const query = { vendor: vendor._id };
    if (category) query.category = category;
    if (isActive !== undefined) query.isActive = isActive === "true";

    const products = await Product.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Get vendor products error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/vendor/analytics:
 *   get:
 *     summary: Get vendor analytics
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *     responses:
 *       200:
 *         description: Analytics data
 */
router.get("/analytics", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ error: req.t("vendor.notFound") });
    }

    const { period = "month" } = req.query;

    const analytics = await Vendor.getVendorAnalytics(vendor._id, period);

    // Get top products
    const topProducts = await Product.find({ vendor: vendor._id })
      .sort({ rating: -1, reviewCount: -1 })
      .limit(10)
      .select("name price rating reviewCount stock");

    // Get sales trend
    const startDate = new Date();
    let groupBy;
    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        groupBy = { $dateToString: { format: "%Y-%m", date: "$createdAt" } };
        break;
      default:
        startDate.setMonth(startDate.getMonth() - 1);
        groupBy = { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } };
    }

    // Get vendor product IDs for aggregation
    const vendorProductIds = await Product.find({
      vendor: vendor._id,
    }).distinct("_id");

    const salesTrend = await Order.aggregate([
      {
        $match: {
          $or: [
            { vendor: vendor._id },
            { "items.product": { $in: vendorProductIds } },
          ],
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: groupBy,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: "$totalAmount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      analytics,
      topProducts,
      salesTrend,
    });
  } catch (error) {
    logger.error("Get vendor analytics error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/vendor/payout/request:
 *   post:
 *     summary: Request payout
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Payout request created
 */
router.post("/payout/request", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ error: req.t("vendor.notFound") });
    }

    if (!vendor.isVerified) {
      return res.status(403).json({ error: req.t("vendor.notVerified") });
    }

    const { amount } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({ error: req.t("vendor.invalidAmount") });
    }

    if (amount > vendor.pendingPayout) {
      return res
        .status(400)
        .json({ error: req.t("vendor.insufficientBalance") });
    }

    // Check minimum payout amount (e.g., 50,000 UGX)
    const minPayoutAmount = 50000;
    if (amount < minPayoutAmount) {
      return res.status(400).json({
        error: req.t("vendor.minimumPayout", { amount: minPayoutAmount }),
      });
    }

    // Determine payment method and details
    let paymentMethod = vendor.payoutInfo.preferredMethod || "bank";
    const paymentDetails = {
      accountNumber: vendor.payoutInfo.accountNumber
        ? `****${vendor.payoutInfo.accountNumber.slice(-4)}`
        : undefined,
      accountHolderName: vendor.payoutInfo.accountHolderName,
      paypalEmail: vendor.payoutInfo.paypalEmail,
    };

    // Handle mobile money payouts for Uganda
    if (paymentMethod === "mtn_momo" || paymentMethod === "airtel_money") {
      const network = paymentMethod === "mtn_momo" ? "mtn" : "airtel";
      const mobileMoneyNumber = vendor.payoutInfo.mobileMoneyNumbers?.[network];

      if (!mobileMoneyNumber) {
        return res.status(400).json({
          error: `Mobile money number for ${network.toUpperCase()} not configured. Please update your payout information.`,
        });
      }

      paymentDetails.mobileMoneyNumber = mobileMoneyNumber;
      paymentDetails.mobileMoneyNetwork = network;
    }

    const payout = new Payout({
      vendor: vendor._id,
      amount,
      currency: "UGX", // Default to UGX for Uganda
      paymentMethod,
      paymentDetails,
    });

    await payout.save();

    logger.info(
      `Payout requested: ${amount} for vendor ${vendor.businessName}`,
      {
        vendorId: vendor._id,
        payoutId: payout._id,
      }
    );

    res.status(201).json({
      message: req.t("vendor.payoutRequested"),
      payout: {
        id: payout._id,
        amount: payout.amount,
        status: payout.status,
        requestedDate: payout.requestedDate,
      },
    });
  } catch (error) {
    logger.error("Payout request error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/vendor/payouts:
 *   get:
 *     summary: Get vendor payouts history
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payout history
 */
router.get("/payouts", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ error: req.t("vendor.notFound") });
    }

    const { page = 1, limit = 20, status } = req.query;
    const skip = (page - 1) * limit;

    const query = { vendor: vendor._id };
    if (status) query.status = status;

    const payouts = await Payout.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Payout.countDocuments(query);

    const summary = await Payout.getVendorPayoutSummary(vendor._id);

    res.json({
      payouts,
      summary,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Get vendor payouts error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/vendor/earnings:
 *   get:
 *     summary: Get vendor earnings summary
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Earnings summary
 */
router.get("/earnings", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ error: req.t("vendor.notFound") });
    }

    const earnings = {
      totalRevenue: vendor.totalRevenue || 0,
      totalCommission: vendor.totalCommission || 0,
      netRevenue: vendor.netRevenue || 0,
      pendingPayout: vendor.pendingPayout || 0,
      totalPaidOut: vendor.totalPaidOut || 0,
      currency: "UGX",
    };

    res.json({ earnings });
  } catch (error) {
    logger.error("Get vendor earnings error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/vendor/sales-report:
 *   get:
 *     summary: Generate sales report
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Sales report
 */
router.get("/sales-report", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ error: req.t("vendor.notFound") });
    }

    const { startDate, endDate } = req.query;

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    // Get vendor product IDs for query
    const vendorProductIds = await Product.find({
      vendor: vendor._id,
    }).distinct("_id");

    const query = {
      $or: [
        { vendor: vendor._id },
        { "items.product": { $in: vendorProductIds } },
      ],
    };
    if (Object.keys(dateFilter).length > 0) {
      query.createdAt = dateFilter;
    }

    const orders = await Order.find(query).populate("user", "name email");

    // Calculate report metrics
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce(
      (sum, order) => sum + order.totalAmount,
      0
    );
    const totalCommission = totalRevenue * (vendor.commissionRate / 100);
    const netRevenue = totalRevenue - totalCommission;

    // Group by status
    const ordersByStatus = orders.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1;
      return acc;
    }, {});

    // Group by date
    const salesByDate = orders.reduce((acc, order) => {
      const date = order.createdAt.toISOString().split("T")[0];
      if (!acc[date]) {
        acc[date] = { orders: 0, revenue: 0 };
      }
      acc[date].orders += 1;
      acc[date].revenue += order.totalAmount;
      return acc;
    }, {});

    // Top products
    const productSales = {};
    orders.forEach((order) => {
      order.items.forEach((item) => {
        // Check if product belongs to this vendor
        const productVendorId =
          item.product?.vendor?._id || item.product?.vendor;
        if (
          productVendorId &&
          productVendorId.toString() === vendor._id.toString()
        ) {
          const productId = item.product._id.toString();
          if (!productSales[productId]) {
            productSales[productId] = {
              product: item.product,
              quantity: 0,
              revenue: 0,
            };
          }
          productSales[productId].quantity += item.quantity;
          productSales[productId].revenue += item.price * item.quantity;
        }
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    res.json({
      report: {
        period: {
          startDate: startDate || "All time",
          endDate: endDate || "Now",
        },
        summary: {
          totalOrders,
          totalRevenue,
          totalCommission,
          netRevenue,
          commissionRate: vendor.commissionRate,
        },
        ordersByStatus,
        salesByDate,
        topProducts,
      },
    });
  } catch (error) {
    logger.error("Generate sales report error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

// Admin routes for vendor management

/**
 * @swagger
 * /api/vendor/admin/all:
 *   get:
 *     summary: Get all vendors (Admin only)
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all vendors
 */
router.get(
  "/admin/all",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status, search } = req.query;
      const skip = (page - 1) * limit;

      const query = {};
      if (status) query.verificationStatus = status;
      if (search) {
        query.$or = [
          { businessName: { $regex: search, $options: "i" } },
          { businessEmail: { $regex: search, $options: "i" } },
        ];
      }

      const vendors = await Vendor.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("user", "name email");

      const total = await Vendor.countDocuments(query);

      res.json({
        vendors,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      logger.error("Get all vendors error:", error);
      res.status(500).json({ error: req.t("error.serverError") });
    }
  }
);

/**
 * @swagger
 * /api/vendor/admin/{vendorId}/verify:
 *   put:
 *     summary: Verify/reject vendor (Admin only)
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [approved, rejected]
 *     responses:
 *       200:
 *         description: Vendor verification updated
 */
router.put(
  "/admin/:vendorId/verify",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { status, reason } = req.body;

      const vendor = await Vendor.findById(vendorId);

      if (!vendor) {
        return res.status(404).json({ error: req.t("vendor.notFound") });
      }

      vendor.verificationStatus = status;
      vendor.isVerified = status === "approved";

      await vendor.save();

      logger.info(`Vendor ${vendorId} verification status: ${status}`, {
        vendorId,
        adminId: req.user._id,
      });

      res.json({
        message: req.t("vendor.verificationUpdated"),
        vendor,
      });
    } catch (error) {
      logger.error("Vendor verification error:", error);
      res.status(500).json({ error: req.t("error.serverError") });
    }
  }
);

/**
 * @swagger
 * /api/vendor/admin/{vendorId}/commission:
 *   put:
 *     summary: Update vendor commission rate (Admin only)
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               commissionRate:
 *                 type: number
 *     responses:
 *       200:
 *         description: Commission rate updated
 */
router.put(
  "/admin/:vendorId/commission",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { vendorId } = req.params;
      const { commissionRate } = req.body;

      if (commissionRate < 0 || commissionRate > 100) {
        return res
          .status(400)
          .json({ error: req.t("vendor.invalidCommissionRate") });
      }

      const vendor = await Vendor.findById(vendorId);

      if (!vendor) {
        return res.status(404).json({ error: req.t("vendor.notFound") });
      }

      vendor.commissionRate = commissionRate;
      await vendor.save();

      logger.info(
        `Vendor ${vendorId} commission rate updated to ${commissionRate}%`,
        {
          vendorId,
          adminId: req.user._id,
        }
      );

      res.json({
        message: req.t("vendor.commissionUpdated"),
        vendor,
      });
    } catch (error) {
      logger.error("Update commission rate error:", error);
      res.status(500).json({ error: req.t("error.serverError") });
    }
  }
);

// Configure multer for document uploads
const documentStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Create uploads directory if it doesn't exist
    const uploadDir = "uploads/vendor-documents";
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `vendor-${req.user._id}-${uniqueSuffix}${ext}`);
  },
});

const documentUpload = multer({
  storage: documentStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    // Allow common document types
    const allowedTypes = [
      "application/pdf",
      "image/jpeg",
      "image/png",
      "image/jpg",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only PDF, JPEG, PNG, and Word documents are allowed."
        )
      );
    }
  },
});

/**
 * @swagger
 * /api/vendor/documents/upload:
 *   post:
 *     summary: Upload vendor verification documents
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               document:
 *                 type: string
 *                 format: binary
 *               documentType:
 *                 type: string
 *                 enum: [business_license, tax_id, identity, other]
 *     responses:
 *       200:
 *         description: Document uploaded successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Vendor not found
 *       500:
 *         description: Server error
 */
router.post(
  "/documents/upload",
  authenticateJWT,
  documentUpload.single("document"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No document file uploaded" });
      }

      const { documentType } = req.body;

      // Validate document type
      const validDocumentTypes = [
        "business_license",
        "tax_id",
        "identity",
        "other",
      ];
      if (!documentType || !validDocumentTypes.includes(documentType)) {
        // Delete uploaded file
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {
            // Ignore deletion errors
          }
        }
        return res.status(400).json({
          error:
            "Invalid document type. Must be one of: business_license, tax_id, identity, other",
        });
      }

      // Find vendor
      const vendor = await Vendor.findOne({ user: req.user._id });
      if (!vendor) {
        // Delete uploaded file
        if (req.file && req.file.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {
            // Ignore deletion errors
          }
        }
        return res.status(404).json({ error: "Vendor not found" });
      }

      // Create document URL (relative to server)
      const documentUrl = `/uploads/vendor-documents/${req.file.filename}`;

      // Add document to vendor's verificationDocuments array
      vendor.verificationDocuments.push({
        url: documentUrl,
        documentType: documentType,
        uploadedAt: new Date(),
      });

      await vendor.save();

      res.status(200).json({
        message: "Document uploaded successfully",
        document: {
          url: documentUrl,
          type: documentType,
          uploadedAt: new Date(),
        },
      });
    } catch (error) {
      // Delete uploaded file on error
      if (req.file && req.file.path) {
        try {
          fs.unlinkSync(req.file.path);
        } catch (e) {
          // Ignore deletion errors
        }
      }

      console.error("Document upload error:", error);
      res.status(500).json({ error: "Server error during document upload" });
    }
  }
);

// Public Vendor Routes

/**
 * @swagger
 * /api/vendor/reviews:
 *   get:
 *     summary: Get authenticated vendor's reviews
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of reviews for the authenticated vendor
 */
router.get("/reviews", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });

    if (!vendor) {
      return res.status(404).json({ error: req.t("vendor.notFound") });
    }

    const { page = 1, limit = 20 } = req.query;

    const reviews = await Review.find({
      vendor: vendor._id,
      moderationStatus: "approved",
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("user", "name");

    const total = await Review.countDocuments({
      vendor: vendor._id,
      moderationStatus: "approved",
    });

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Get vendor reviews error:", error);
    res.status(500).json({ error: req.t("error.serverError") });
  }
});

/**
 * @swagger
 * /api/vendor/{vendorId}:
 *   get:
 *     summary: Get public vendor profile
 *     tags: [Vendor]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Vendor profile
 */
router.get("/:vendorId", async (req, res) => {
  try {
    const { vendorId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ error: "Invalid vendor ID" });
    }

    const vendor = await Vendor.findById(vendorId)
      .select(
        "-payoutInfo -verificationDocuments -totalRevenue -totalCommission -pendingPayout -metrics"
      )
      .populate("user", "name");

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    if (!vendor.storeSettings.isActive) {
      return res
        .status(404)
        .json({ error: "Vendor store is currently inactive" });
    }

    // Track shop view
    const userId = req.user ? req.user._id : null;
    VendorAnalytics.recordShopView(vendorId, userId).catch((err) =>
      logger.error("Analytics tracking error:", err)
    );

    res.json({ vendor });
  } catch (error) {
    logger.error("Get public vendor profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/vendor/{vendorId}/products:
 *   get:
 *     summary: Get vendor products (public)
 *     tags: [Vendor]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List of products
 */
router.get("/:vendorId/products", async (req, res) => {
  try {
    const { vendorId } = req.params;
    const {
      page = 1,
      limit = 20,
      category,
      search,
      sort,
      minPrice,
      maxPrice,
      minRating,
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ error: "Invalid vendor ID" });
    }

    const query = {
      vendor: vendorId,
      isActive: true,
    };

    if (category) query.category = category;
    if (search) query.$text = { $search: search };

    // Price range filter
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }

    // Rating filter
    if (minRating) {
      query.rating = { $gte: parseFloat(minRating) };
    }

    let sortOptions = { createdAt: -1 };
    if (sort === "price_asc") sortOptions = { price: 1 };
    if (sort === "price_desc") sortOptions = { price: -1 };
    if (sort === "rating") sortOptions = { rating: -1 };

    const products = await Product.find(query)
      .sort(sortOptions)
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await Product.countDocuments(query);

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Get vendor public products error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/vendor/{vendorId}/reviews:
 *   get:
 *     summary: Get vendor reviews
 *     tags: [Vendor]
 *     parameters:
 *       - in: path
 *         name: vendorId
 *         required: true
 *     responses:
 *       200:
 *         description: List of reviews
 */
router.get("/:vendorId/reviews", async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { page = 1, limit = 20 } = req.query;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ error: "Invalid vendor ID" });
    }

    const reviews = await Review.find({
      vendor: vendorId,
      moderationStatus: "approved",
    })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .populate("user", "name");

    const total = await Review.countDocuments({
      vendor: vendorId,
      moderationStatus: "approved",
    });

    res.json({
      reviews,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Get vendor reviews error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/vendor/{vendorId}/reviews:
 *   post:
 *     summary: Add vendor review
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - rating
 *             properties:
 *               rating:
 *                 type: number
 *               comment:
 *                 type: string
 *     responses:
 *       201:
 *         description: Review added
 */
router.post("/:vendorId/reviews", authenticateJWT, async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { rating, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(400).json({ error: "Invalid vendor ID" });
    }

    // Check if user has already reviewed this vendor
    const existingReview = await Review.findOne({
      vendor: vendorId,
      user: req.user._id,
    });

    if (existingReview) {
      return res
        .status(400)
        .json({ error: "You have already reviewed this vendor" });
    }

    // Verify vendor exists
    const vendor = await Vendor.findById(vendorId);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Create review
    const review = new Review({
      vendor: vendorId,
      user: req.user._id,
      rating,
      comment,
      moderationStatus: "approved", // Auto-approve for now, or use "pending" if moderation is required
    });

    await review.save();

    // Update vendor rating stats
    const stats = await Review.aggregate([
      {
        $match: {
          vendor: new mongoose.Types.ObjectId(vendorId),
          moderationStatus: "approved",
        },
      },
      {
        $group: {
          _id: "$vendor",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
    ]);

    if (stats.length > 0) {
      vendor.rating = stats[0].avgRating;
      vendor.totalReviews = stats[0].count;
      await vendor.save();
    }

    res.status(201).json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    logger.error("Add vendor review error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ==================== PAYOUT ENDPOINTS ====================

/**
 * @swagger
 * /api/vendor/payouts:
 *   get:
 *     summary: Get vendor payout history
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 */
router.get("/payouts", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const query = { vendor: vendor._id };
    if (status) query.status = status;

    const payouts = await Payout.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("processedBy", "name email");

    const total = await Payout.countDocuments(query);

    res.json({
      payouts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Get vendor payouts error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/vendor/payouts/request:
 *   post:
 *     summary: Request a payout
 *     tags: [Vendor]
 */
router.post("/payouts/request", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const { amount, paymentMethod, paymentDetails } = req.body;

    // Validation
    const MIN_PAYOUT_AMOUNT = 50000;
    if (!amount || amount < MIN_PAYOUT_AMOUNT) {
      return res.status(400).json({
        error: `Minimum payout amount is UGX ${MIN_PAYOUT_AMOUNT.toLocaleString()}`,
      });
    }

    if (amount > vendor.pendingPayout) {
      return res.status(400).json({
        error: `Insufficient balance. Available: UGX ${vendor.pendingPayout.toLocaleString()}`,
      });
    }

    // Check for existing pending payout
    const existingPayout = await Payout.findOne({
      vendor: vendor._id,
      status: "pending",
    });
    if (existingPayout) {
      return res.status(400).json({
        error: "You already have a pending payout request",
      });
    }

    // Validate payment method
    const validMethods = [
      "bank",
      "paypal",
      "stripe",
      "mtn_momo",
      "airtel_money",
    ];
    if (!validMethods.includes(paymentMethod)) {
      return res.status(400).json({ error: "Invalid payment method" });
    }

    // Create payout request
    const payout = new Payout({
      vendor: vendor._id,
      amount,
      currency: "UGX",
      paymentMethod,
      paymentDetails,
      status: "pending",
    });

    await payout.save();

    logger.info(`Payout requested by vendor ${vendor.businessName}`, {
      vendorId: vendor._id,
      payoutId: payout._id,
      amount,
    });

    res.status(201).json({
      message: "Payout request submitted successfully",
      payout,
    });
  } catch (error) {
    logger.error("Request payout error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/vendor/payouts/{id}:
 *   get:
 *     summary: Get payout details
 */
router.get("/payouts/:id", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const payout = await Payout.findById(req.params.id).populate(
      "processedBy",
      "name email"
    );

    if (!payout) {
      return res.status(404).json({ error: "Payout not found" });
    }

    if (payout.vendor.toString() !== vendor._id.toString()) {
      return res.status(403).json({ error: "Forbidden" });
    }

    res.json({ payout });
  } catch (error) {
    logger.error("Get payout details error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/vendor/payouts/{id}:
 *   delete:
 *     summary: Cancel payout request
 */
router.delete("/payouts/:id", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const payout = await Payout.findById(req.params.id);
    if (!payout) {
      return res.status(404).json({ error: "Payout not found" });
    }

    if (payout.vendor.toString() !== vendor._id.toString()) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (payout.status !== "pending") {
      return res.status(400).json({
        error: "Can only cancel pending payout requests",
      });
    }

    payout.status = "cancelled";
    await payout.save();

    logger.info(`Payout cancelled by vendor ${vendor.businessName}`, {
      vendorId: vendor._id,
      payoutId: payout._id,
    });

    res.json({
      message: "Payout request cancelled successfully",
      payout,
    });
  } catch (error) {
    logger.error("Cancel payout error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// BULK PRODUCT OPERATIONS
// ============================================

import { generateProductCSV, parseProductCSV } from "../utils/csvParser.js";

// Configure multer for CSV upload
const csvStorage = multer.memoryStorage();
const csvUpload = multer({
  storage: csvStorage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "text/csv" || file.originalname.endsWith(".csv")) {
      cb(null, true);
    } else {
      cb(new Error("Only CSV files are allowed"));
    }
  },
});

/**
 * @swagger
 * /api/vendor/products/bulk-upload:
 *   post:
 *     summary: Bulk upload products via CSV
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Products uploaded successfully
 */
router.post(
  "/products/bulk-upload",
  authenticateJWT,
  csvUpload.single("file"),
  async (req, res) => {
    try {
      const vendor = await Vendor.findOne({ user: req.user._id });
      if (!vendor) {
        return res.status(404).json({ error: "Vendor not found" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      // Parse CSV
      const csvText = req.file.buffer.toString("utf-8");
      const { products, errors } = parseProductCSV(csvText);

      if (errors.length > 0 && products.length === 0) {
        return res.status(400).json({
          error: "CSV validation failed",
          errors,
        });
      }

      // Create products
      const createdProducts = [];
      const failedProducts = [];

      for (const productData of products) {
        try {
          const product = new Product({
            ...productData,
            vendor: vendor._id,
          });
          await product.save();
          createdProducts.push(product);
        } catch (error) {
          failedProducts.push({
            name: productData.name,
            error: error.message,
          });
        }
      }

      // Update vendor product count
      vendor.totalProducts = await Product.countDocuments({
        vendor: vendor._id,
      });
      await vendor.save();

      logger.info(
        `Bulk upload: ${createdProducts.length} products created for vendor ${vendor.businessName}`,
        {
          vendorId: vendor._id,
          created: createdProducts.length,
          failed: failedProducts.length,
        }
      );

      res.status(201).json({
        message: `Successfully uploaded ${createdProducts.length} products`,
        created: createdProducts.length,
        failed: failedProducts.length,
        errors: [
          ...errors,
          ...failedProducts.map((f) => `${f.name}: ${f.error}`),
        ],
        products: createdProducts,
      });
    } catch (error) {
      logger.error("Bulk upload error:", error);
      res.status(500).json({ error: "Server error" });
    }
  }
);

/**
 * @swagger
 * /api/vendor/products/bulk-delete:
 *   post:
 *     summary: Bulk delete products
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Products deleted successfully
 */
router.post("/products/bulk-delete", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const { productIds } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "Product IDs array is required" });
    }

    // Verify all products belong to vendor
    const products = await Product.find({
      _id: { $in: productIds },
      vendor: vendor._id,
    });

    if (products.length !== productIds.length) {
      return res.status(403).json({
        error: "Some products do not belong to this vendor",
      });
    }

    // Delete products
    const result = await Product.deleteMany({
      _id: { $in: productIds },
      vendor: vendor._id,
    });

    // Update vendor product count
    vendor.totalProducts = await Product.countDocuments({ vendor: vendor._id });
    await vendor.save();

    logger.info(
      `Bulk delete: ${result.deletedCount} products deleted for vendor ${vendor.businessName}`,
      {
        vendorId: vendor._id,
        count: result.deletedCount,
      }
    );

    res.json({
      message: `Successfully deleted ${result.deletedCount} products`,
      deletedCount: result.deletedCount,
    });
  } catch (error) {
    logger.error("Bulk delete error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/vendor/products/bulk-update:
 *   post:
 *     summary: Bulk update products
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productIds:
 *                 type: array
 *                 items:
 *                   type: string
 *               updates:
 *                 type: object
 *     responses:
 *       200:
 *         description: Products updated successfully
 */
router.post("/products/bulk-update", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const { productIds, updates } = req.body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return res.status(400).json({ error: "Product IDs array is required" });
    }

    if (!updates || typeof updates !== "object") {
      return res.status(400).json({ error: "Updates object is required" });
    }

    // Only allow certain fields to be bulk updated
    const allowedFields = ["isActive", "category", "stock"];
    const updateData = {};

    Object.keys(updates).forEach((key) => {
      if (allowedFields.includes(key)) {
        updateData[key] = updates[key];
      }
    });

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: `No valid update fields. Allowed: ${allowedFields.join(", ")}`,
      });
    }

    // Update products
    const result = await Product.updateMany(
      {
        _id: { $in: productIds },
        vendor: vendor._id,
      },
      { $set: updateData }
    );

    logger.info(
      `Bulk update: ${result.modifiedCount} products updated for vendor ${vendor.businessName}`,
      {
        vendorId: vendor._id,
        count: result.modifiedCount,
        updates: updateData,
      }
    );

    res.json({
      message: `Successfully updated ${result.modifiedCount} products`,
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    logger.error("Bulk update error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/vendor/products/export:
 *   get:
 *     summary: Export products to CSV
 *     tags: [Vendor]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: CSV file
 *         content:
 *           text/csv:
 *             schema:
 *               type: string
 */
router.get("/products/export", authenticateJWT, async (req, res) => {
  try {
    const vendor = await Vendor.findOne({ user: req.user._id });
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Get all vendor products
    const products = await Product.find({ vendor: vendor._id })
      .select("name description price category stock sku images isActive")
      .lean();

    if (products.length === 0) {
      return res.status(404).json({ error: "No products to export" });
    }

    // Generate CSV
    const csv = generateProductCSV(products);

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="products-${Date.now()}.csv"`
    );

    res.send(csv);
  } catch (error) {
    logger.error("Export products error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

// ============================================
// PUBLIC VENDOR SHOP ENDPOINTS (Customer-facing)
// ============================================

/**
 * Get public vendor profile
 */
router.get("/:id", async (req, res) => {
  try {
    const vendor = await Vendor.findById(req.params.id)
      .select(
        "businessName description logo banner rating totalReviews address"
      )
      .lean();

    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    // Only show approved vendors to public
    if (vendor.verificationStatus !== "approved") {
      return res.status(404).json({ error: "Vendor not found" });
    }

    res.json({ vendor });
  } catch (error) {
    logger.error("Get public vendor profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Get vendor products (public)
 */
router.get("/:id/products", async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const skip = (page - 1) * limit;

    const products = await Product.find({
      vendor: req.params.id,
      isActive: true,
    })
      .select("name price images stockQuantity category")
      .skip(skip)
      .limit(parseInt(limit))
      .lean();

    const total = await Product.countDocuments({
      vendor: req.params.id,
      isActive: true,
    });

    res.json({
      products,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Get vendor products error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Get vendor reviews (public)
 */
router.get("/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({
      vendor: req.params.id,
    })
      .populate("user", "name")
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    res.json({ reviews });
  } catch (error) {
    logger.error("Get vendor reviews error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * Submit vendor review (authenticated)
 */
router.post("/:id/reviews", authenticateJWT, async (req, res) => {
  try {
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: "Rating must be between 1 and 5" });
    }

    const vendor = await Vendor.findById(req.params.id);
    if (!vendor) {
      return res.status(404).json({ error: "Vendor not found" });
    }

    const review = new Review({
      vendor: req.params.id,
      user: req.user._id,
      rating,
      comment,
    });

    await review.save();

    // Update vendor rating
    const reviews = await Review.find({ vendor: req.params.id });
    const avgRating =
      reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    vendor.rating = avgRating;
    vendor.totalReviews = reviews.length;
    await vendor.save();

    res.status(201).json({
      message: "Review submitted successfully",
      review,
    });
  } catch (error) {
    logger.error("Submit vendor review error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
