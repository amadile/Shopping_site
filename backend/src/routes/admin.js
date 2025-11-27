import express from "express";
import { body, query, validationResult } from "express-validator";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import { logger } from "../config/logger.js";
import adminVendor from "./admin-vendor.js";
import adminCommission from "./admin-commission.js";
import adminPayout from "./admin-payout.js";

const router = express.Router();

router.use(authenticateJWT);
router.use(authorizeRoles("admin"));

// Mount admin sub-routes
router.use(adminVendor);
router.use(adminCommission);
router.use(adminPayout);

router.get(
  "/users",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("role").optional().isIn(["customer", "admin", "vendor"]),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { page = 1, limit = 10, role } = req.query;
      const query = {};

      if (role) query.role = role;

      const users = await User.find(query)
        .select("-password -refreshTokens -verificationToken -resetPasswordToken")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await User.countDocuments(query);

      res.json({
        users,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } catch (err) {
      logger.error("Get users error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select(
      "-password -refreshTokens -verificationToken -resetPasswordToken"
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (err) {
    logger.error("Get user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put(
  "/users/:id",
  [
    body("role").optional().isIn(["customer", "admin", "vendor"]),
    body("isVerified").optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      if (req.body.role) user.role = req.body.role;
      if (req.body.isVerified !== undefined) user.isVerified = req.body.isVerified;

      await user.save();
      logger.info(`User ${user._id} updated by admin ${req.user._id}`);

      const updatedUser = await User.findById(user._id).select(
        "-password -refreshTokens -verificationToken -resetPasswordToken"
      );

      res.json(updatedUser);
    } catch (err) {
      logger.error("Update user error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ error: "Cannot delete your own account" });
    }

    await User.findByIdAndDelete(req.params.id);
    logger.info(`User ${req.params.id} deleted by admin ${req.user._id}`);

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    logger.error("Delete user error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get all products (Admin view)
router.get(
  "/products",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("lowStock").optional().isBoolean(),
    query("search").optional().isString(),
  ],
  async (req, res) => {
    try {
      const { page = 1, limit = 10, lowStock, search } = req.query;
      const query = {};

      if (lowStock === "true") {
        query.stock = { $lt: 10 }; // Low stock threshold
      }

      if (search) {
        query.$text = { $search: search };
      }

      const products = await Product.find(query)
        .populate("vendor", "businessName email")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Product.countDocuments(query);

      res.json({
        products,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } catch (err) {
      logger.error("Get admin products error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get(
  "/orders",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional().isIn(["pending", "paid", "shipped", "delivered", "cancelled"]),
  ],
  async (req, res) => {
    try {
      const { page = 1, limit = 10, status } = req.query;
      const query = {};

      if (status) query.status = status;

      const orders = await Order.find(query)
        .populate("user", "name email")
        .populate("items.product", "name price")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Order.countDocuments(query);

      res.json({
        orders,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } catch (err) {
      logger.error("Get all orders error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get("/stats", async (req, res) => {
  try {
    const [totalUsers, totalProducts, totalOrders, revenue] = await Promise.all([
      User.countDocuments(),
      Product.countDocuments(),
      Order.countDocuments(),
      Order.aggregate([
        { $match: { status: { $in: ["paid", "shipped", "delivered"] } } },
        { $group: { _id: null, total: { $sum: "$total" } } },
      ]),
    ]);

    res.json({
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue: revenue[0]?.total || 0,
    });
  } catch (err) {
    logger.error("Get stats error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;