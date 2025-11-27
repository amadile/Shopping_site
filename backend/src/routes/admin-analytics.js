import express from "express";
import { logger } from "../config/logger.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import Dispute from "../models/Dispute.js";
import Order from "../models/Order.js";
import Payout from "../models/Payout.js";
import Product from "../models/Product.js";
import User from "../models/User.js";
import Vendor from "../models/Vendor.js";

const router = express.Router();

// Apply authentication and authorization middleware
router.use(authenticateJWT);
router.use(authorizeRoles("admin"));

/**
 * @swagger
 * /api/admin/analytics/marketplace-overview:
 *   get:
 *     summary: Get comprehensive marketplace analytics
 *     tags: [Admin Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year, all]
 *           default: month
 *     responses:
 *       200:
 *         description: Marketplace overview
 */
router.get("/marketplace-overview", async (req, res) => {
  try {
    const { period = "month" } = req.query;

    const startDate = new Date();
    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
      case "all":
        startDate.setFullYear(2000); // Get all data
        break;
    }

    // Get vendor statistics
    const totalVendors = await Vendor.countDocuments();
    const activeVendors = await Vendor.countDocuments({
      isVerified: true,
      "storeSettings.isActive": true,
    });
    const pendingVendors = await Vendor.countDocuments({
      verificationStatus: "pending",
    });

    // Get product statistics
    const totalProducts = await Product.countDocuments();
    const activeProducts = await Product.countDocuments({ isActive: true });

    // Get order statistics
    const totalOrders = await Order.countDocuments({
      createdAt: { $gte: startDate },
    });
    const ordersByStatus = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalValue: { $sum: "$total" },
        },
      },
    ]);

    // Calculate total revenue and commission
    const revenueStats = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ["paid", "shipped", "delivered"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$total" },
          totalCommission: { $sum: "$platformCommission" },
          totalOrders: { $sum: 1 },
        },
      },
    ]);

    const revenue = revenueStats[0] || {
      totalRevenue: 0,
      totalCommission: 0,
      totalOrders: 0,
    };

    // Get user statistics
    const totalCustomers = await User.countDocuments({ role: "customer" });
    const newCustomers = await User.countDocuments({
      role: "customer",
      createdAt: { $gte: startDate },
    });

    // Get payout statistics
    const payoutStats = await Payout.aggregate([
      {
        $match: {
          requestedDate: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    // Get pending payout balance across all vendors
    const vendorBalances = await Vendor.aggregate([
      {
        $group: {
          _id: null,
          totalPendingBalance: { $sum: "$pendingPayout" },
          totalPayoutsPaid: { $sum: "$totalPayouts" },
        },
      },
    ]);

    // Get dispute statistics
    const disputeStats = await Dispute.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    res.json({
      period,
      vendors: {
        total: totalVendors,
        active: activeVendors,
        pending: pendingVendors,
      },
      products: {
        total: totalProducts,
        active: activeProducts,
      },
      orders: {
        total: totalOrders,
        byStatus: ordersByStatus,
      },
      revenue: {
        totalRevenue: revenue.totalRevenue,
        platformCommission: revenue.totalCommission,
        vendorEarnings: revenue.totalRevenue - revenue.totalCommission,
        completedOrders: revenue.totalOrders,
      },
      customers: {
        total: totalCustomers,
        new: newCustomers,
      },
      payouts: {
        byStatus: payoutStats,
        pendingBalance: vendorBalances[0]?.totalPendingBalance || 0,
        totalPaid: vendorBalances[0]?.totalPayoutsPaid || 0,
      },
      disputes: {
        byStatus: disputeStats,
      },
    });
  } catch (error) {
    logger.error("Get marketplace overview error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/analytics/revenue-breakdown:
 *   get:
 *     summary: Get detailed revenue breakdown
 *     tags: [Admin Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Revenue breakdown
 */
router.get("/revenue-breakdown", async (req, res) => {
  try {
    const { period = "month" } = req.query;

    const startDate = new Date();
    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }

    // Revenue by payment method
    const revenueByPaymentMethod = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ["paid", "shipped", "delivered"] },
        },
      },
      {
        $group: {
          _id: "$paymentMethod",
          totalRevenue: { $sum: "$total" },
          totalCommission: { $sum: "$platformCommission" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    // Revenue by delivery zone
    const revenueByZone = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ["paid", "shipped", "delivered"] },
        },
      },
      {
        $group: {
          _id: {
            zone: "$shippingAddress.zone",
            district: "$shippingAddress.district",
          },
          totalRevenue: { $sum: "$total" },
          totalCommission: { $sum: "$platformCommission" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Revenue by category (requires joining with products)
    const revenueByCategory = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ["paid", "shipped", "delivered"] },
        },
      },
      {
        $unwind: "$items",
      },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productInfo",
        },
      },
      {
        $unwind: "$productInfo",
      },
      {
        $group: {
          _id: "$productInfo.category",
          totalRevenue: {
            $sum: { $multiply: ["$items.price", "$items.quantity"] },
          },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { totalRevenue: -1 },
      },
    ]);

    // Daily revenue trend
    const dailyRevenue = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate },
          status: { $in: ["paid", "shipped", "delivered"] },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          },
          totalRevenue: { $sum: "$total" },
          totalCommission: { $sum: "$platformCommission" },
          orderCount: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json({
      period,
      byPaymentMethod: revenueByPaymentMethod,
      byZone: revenueByZone,
      byCategory: revenueByCategory,
      dailyTrend: dailyRevenue,
    });
  } catch (error) {
    logger.error("Get revenue breakdown error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/analytics/vendor-performance:
 *   get:
 *     summary: Get top performing vendors
 *     tags: [Admin Analytics]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [revenue, orders, rating]
 *           default: revenue
 *     responses:
 *       200:
 *         description: Top vendors
 */
router.get("/vendor-performance", async (req, res) => {
  try {
    const { limit = 10, sortBy = "revenue" } = req.query;

    const sortField =
      sortBy === "orders"
        ? "totalOrders"
        : sortBy === "rating"
        ? "rating"
        : "totalRevenue";

    const topVendors = await Vendor.find({ isVerified: true })
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .select(
        "businessName totalRevenue totalSales totalOrders rating tier verificationStatus"
      )
      .populate("user", "name email");

    // Get detailed stats for each vendor
    const vendorStats = await Promise.all(
      topVendors.map(async (vendor) => {
        const orderStats = await Order.aggregate([
          {
            $match: {
              vendor: vendor._id,
              status: { $in: ["paid", "shipped", "delivered"] },
            },
          },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: "$total" },
              avgOrderValue: { $avg: "$total" },
            },
          },
        ]);

        const productCount = await Product.countDocuments({
          vendor: vendor._id,
          isActive: true,
        });

        return {
          ...vendor.toObject(),
          stats: orderStats[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            avgOrderValue: 0,
          },
          productCount,
        };
      })
    );

    res.json({
      vendors: vendorStats,
      total: vendorStats.length,
    });
  } catch (error) {
    logger.error("Get vendor performance error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/analytics/growth-metrics:
 *   get:
 *     summary: Get growth metrics over time
 *     tags: [Admin Analytics]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Growth metrics
 */
router.get("/growth-metrics", async (req, res) => {
  try {
    const { period = "month" } = req.query;

    const startDate = new Date();
    const previousStartDate = new Date();

    switch (period) {
      case "week":
        startDate.setDate(startDate.getDate() - 7);
        previousStartDate.setDate(previousStartDate.getDate() - 14);
        break;
      case "month":
        startDate.setMonth(startDate.getMonth() - 1);
        previousStartDate.setMonth(previousStartDate.getMonth() - 2);
        break;
      case "year":
        startDate.setFullYear(startDate.getFullYear() - 1);
        previousStartDate.setFullYear(previousStartDate.getFullYear() - 2);
        break;
    }

    // Get current period metrics
    const currentMetrics = await Promise.all([
      Vendor.countDocuments({
        createdAt: { $gte: startDate },
      }),
      User.countDocuments({
        role: "customer",
        createdAt: { $gte: startDate },
      }),
      Order.countDocuments({
        createdAt: { $gte: startDate },
      }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
            status: { $in: ["paid", "shipped", "delivered"] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
          },
        },
      ]),
    ]);

    // Get previous period metrics
    const previousMetrics = await Promise.all([
      Vendor.countDocuments({
        createdAt: { $gte: previousStartDate, $lt: startDate },
      }),
      User.countDocuments({
        role: "customer",
        createdAt: { $gte: previousStartDate, $lt: startDate },
      }),
      Order.countDocuments({
        createdAt: { $gte: previousStartDate, $lt: startDate },
      }),
      Order.aggregate([
        {
          $match: {
            createdAt: { $gte: previousStartDate, $lt: startDate },
            status: { $in: ["paid", "shipped", "delivered"] },
          },
        },
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: "$total" },
          },
        },
      ]),
    ]);

    const calculateGrowth = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return ((current - previous) / previous) * 100;
    };

    const currentRevenue = currentMetrics[3][0]?.totalRevenue || 0;
    const previousRevenue = previousMetrics[3][0]?.totalRevenue || 0;

    res.json({
      period,
      vendors: {
        current: currentMetrics[0],
        previous: previousMetrics[0],
        growth: calculateGrowth(currentMetrics[0], previousMetrics[0]),
      },
      customers: {
        current: currentMetrics[1],
        previous: previousMetrics[1],
        growth: calculateGrowth(currentMetrics[1], previousMetrics[1]),
      },
      orders: {
        current: currentMetrics[2],
        previous: previousMetrics[2],
        growth: calculateGrowth(currentMetrics[2], previousMetrics[2]),
      },
      revenue: {
        current: currentRevenue,
        previous: previousRevenue,
        growth: calculateGrowth(currentRevenue, previousRevenue),
      },
    });
  } catch (error) {
    logger.error("Get growth metrics error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/analytics/uganda-specific:
 *   get:
 *     summary: Get Uganda-specific marketplace insights
 *     tags: [Admin Analytics]
 *     responses:
 *       200:
 *         description: Uganda-specific insights
 */
router.get("/uganda-specific", async (req, res) => {
  try {
    // Payment method distribution (MTN, Airtel, COD, etc.)
    const paymentMethodStats = await Order.aggregate([
      {
        $group: {
          _id: "$paymentMethod",
          count: { $sum: 1 },
          totalValue: { $sum: "$total" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // Vendors by district
    const vendorsByDistrict = await Vendor.aggregate([
      {
        $match: {
          "address.district": { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$address.district",
          count: { $sum: 1 },
          totalRevenue: { $sum: "$totalRevenue" },
        },
      },
      {
        $sort: { count: -1 },
      },
      {
        $limit: 10,
      },
    ]);

    // Orders by Kampala zone
    const ordersByZone = await Order.aggregate([
      {
        $match: {
          "shippingAddress.zone": { $exists: true, $ne: "" },
        },
      },
      {
        $group: {
          _id: "$shippingAddress.zone",
          count: { $sum: 1 },
          totalValue: { $sum: "$total" },
        },
      },
      {
        $sort: { count: -1 },
      },
    ]);

    // SMS notifications preference
    const smsPreference = await Order.aggregate([
      {
        $group: {
          _id: "$smsNotifications",
          count: { $sum: 1 },
        },
      },
    ]);

    // Vendor tier distribution
    const vendorsByTier = await Vendor.aggregate([
      {
        $group: {
          _id: "$tier",
          count: { $sum: 1 },
          avgRevenue: { $avg: "$totalRevenue" },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    res.json({
      paymentMethods: paymentMethodStats,
      vendorsByDistrict,
      ordersByKampalaZone: ordersByZone,
      smsNotificationPreference: smsPreference,
      vendorsByTier,
    });
  } catch (error) {
    logger.error("Get Uganda-specific analytics error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
