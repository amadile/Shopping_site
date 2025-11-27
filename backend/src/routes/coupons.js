import express from "express";
import { body, query, validationResult } from "express-validator";
import { logger } from "../config/logger.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import Coupon from "../models/Coupon.js";

const router = express.Router();

// ============================================
// Admin Routes
// ============================================

// Get all coupons (Admin only)
router.get(
  "/",
  authenticateJWT,
  authorizeRoles("admin"),
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("isActive").optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { page = 1, limit = 20, isActive } = req.query;
      const query = {};

      if (isActive !== undefined) {
        query.isActive = isActive === "true";
      }

      const coupons = await Coupon.find(query)
        .populate("createdBy", "name email")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Coupon.countDocuments(query);

      res.json({
        coupons,
        totalPages: Math.ceil(total / limit),
        currentPage: parseInt(page),
        total,
      });
    } catch (err) {
      logger.error("Get coupons error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get single coupon (Admin only)
router.get(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const coupon = await Coupon.findById(req.params.id).populate(
        "createdBy",
        "name email"
      );

      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }

      res.json(coupon);
    } catch (err) {
      logger.error("Get coupon error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Create coupon (Admin only)
router.post(
  "/",
  authenticateJWT,
  authorizeRoles("admin"),
  [
    body("code").notEmpty().trim().toUpperCase(),
    body("description").notEmpty().trim(),
    body("discountType").isIn(["percentage", "fixed"]),
    body("discountValue").isFloat({ min: 0 }),
    body("minOrderValue").optional().isFloat({ min: 0 }),
    body("maxDiscountAmount").optional().isFloat({ min: 0 }),
    body("expiresAt").isISO8601(),
    body("usageLimit").optional().isInt({ min: 1 }),
    body("perUserLimit").optional().isInt({ min: 1 }),
    body("applicableCategories").optional().isArray(),
    body("applicableProducts").optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Check if coupon code already exists
      const existingCoupon = await Coupon.findOne({ code: req.body.code });
      if (existingCoupon) {
        return res.status(400).json({ error: "Coupon code already exists" });
      }

      // Validate percentage discount
      if (
        req.body.discountType === "percentage" &&
        req.body.discountValue > 100
      ) {
        return res
          .status(400)
          .json({ error: "Percentage discount cannot exceed 100%" });
      }

      const couponData = {
        ...req.body,
        createdBy: req.user._id,
      };

      const coupon = new Coupon(couponData);
      await coupon.save();

      await coupon.populate("createdBy", "name email");
      logger.info(`Coupon created: ${coupon.code} by ${req.user.email}`);

      res.status(201).json(coupon);
    } catch (err) {
      logger.error("Create coupon error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Update coupon (Admin only)
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin"),
  [
    body("code").optional().notEmpty().trim().toUpperCase(),
    body("description").optional().notEmpty().trim(),
    body("discountType").optional().isIn(["percentage", "fixed"]),
    body("discountValue").optional().isFloat({ min: 0 }),
    body("minOrderValue").optional().isFloat({ min: 0 }),
    body("maxDiscountAmount").optional().isFloat({ min: 0 }),
    body("expiresAt").optional().isISO8601(),
    body("usageLimit").optional().isInt({ min: 1 }),
    body("perUserLimit").optional().isInt({ min: 1 }),
    body("isActive").optional().isBoolean(),
    body("applicableCategories").optional().isArray(),
    body("applicableProducts").optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const coupon = await Coupon.findById(req.params.id);

      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }

      // If code is being updated, check uniqueness
      if (req.body.code && req.body.code !== coupon.code) {
        const existingCoupon = await Coupon.findOne({ code: req.body.code });
        if (existingCoupon) {
          return res.status(400).json({ error: "Coupon code already exists" });
        }
      }

      // Validate percentage discount
      if (
        req.body.discountType === "percentage" &&
        req.body.discountValue > 100
      ) {
        return res
          .status(400)
          .json({ error: "Percentage discount cannot exceed 100%" });
      }

      Object.assign(coupon, req.body);
      await coupon.save();

      await coupon.populate("createdBy", "name email");
      logger.info(`Coupon updated: ${coupon.code} by ${req.user.email}`);

      res.json(coupon);
    } catch (err) {
      logger.error("Update coupon error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Delete coupon (Admin only)
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const coupon = await Coupon.findById(req.params.id);

      if (!coupon) {
        return res.status(404).json({ error: "Coupon not found" });
      }

      await Coupon.findByIdAndDelete(req.params.id);
      logger.info(`Coupon deleted: ${coupon.code} by ${req.user.email}`);

      res.json({ message: "Coupon deleted successfully" });
    } catch (err) {
      logger.error("Delete coupon error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// ============================================
// Public Routes
// ============================================

// Validate coupon (Public - authenticated users)
router.post(
  "/validate",
  authenticateJWT,
  body("code").notEmpty().trim().toUpperCase(),
  body("orderTotal").optional().isFloat({ min: 0 }),
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { code, orderTotal = 0 } = req.body;

      const coupon = await Coupon.findOne({ code });

      if (!coupon) {
        return res
          .status(404)
          .json({ valid: false, error: "Invalid coupon code" });
      }

      // Check basic validity
      const validCheck = coupon.isValid();
      if (!validCheck.valid) {
        return res.status(400).json(validCheck);
      }

      // Check user-specific validity
      const userCheck = coupon.canUserUse(req.user._id);
      if (!userCheck.valid) {
        return res.status(400).json(userCheck);
      }

      // Calculate discount if order total provided
      let discountInfo = { valid: true };
      if (orderTotal > 0) {
        discountInfo = coupon.calculateDiscount(orderTotal);
        if (!discountInfo.valid) {
          return res.status(400).json(discountInfo);
        }
      }

      res.json({
        valid: true,
        coupon: {
          code: coupon.code,
          description: coupon.description,
          discountType: coupon.discountType,
          discountValue: coupon.discountValue,
          minOrderValue: coupon.minOrderValue,
          maxDiscountAmount: coupon.maxDiscountAmount,
          expiresAt: coupon.expiresAt,
        },
        ...discountInfo,
      });
    } catch (err) {
      logger.error("Validate coupon error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
