import { logger } from "../config/logger.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Review from "../models/Review.js";
import User from "../models/User.js";

/**
 * Enhanced Analytics Service
 * Provides comprehensive sales, revenue, and product metrics
 */

class AnalyticsService {
  /**
   * Get sales overview for a date range
   */
  async getSalesOverview(startDate, endDate) {
    try {
      const match = {
        status: { $in: ["paid", "shipped", "delivered"] },
      };

      if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
      }

      const [salesData, orderStats] = await Promise.all([
        // Sales data by status
        Order.aggregate([
          { $match: match },
          {
            $group: {
              _id: "$status",
              count: { $sum: 1 },
              totalRevenue: { $sum: "$total" },
              avgOrderValue: { $avg: "$total" },
            },
          },
        ]),

        // Overall statistics
        Order.aggregate([
          { $match: match },
          {
            $group: {
              _id: null,
              totalOrders: { $sum: 1 },
              totalRevenue: { $sum: "$total" },
              avgOrderValue: { $avg: "$total" },
              totalItems: { $sum: { $size: "$items" } },
            },
          },
        ]),
      ]);

      // Calculate revenue by status
      const revenueByStatus = {};
      salesData.forEach((item) => {
        revenueByStatus[item._id] = {
          count: item.count,
          revenue: item.totalRevenue,
          avgOrderValue: item.avgOrderValue,
        };
      });

      return {
        overview: orderStats[0] || {
          totalOrders: 0,
          totalRevenue: 0,
          avgOrderValue: 0,
          totalItems: 0,
        },
        byStatus: revenueByStatus,
      };
    } catch (error) {
      logger.error("Error getting sales overview:", error);
      throw error;
    }
  }

  /**
   * Get revenue trends over time
   */
  async getRevenueTrends(startDate, endDate, groupBy = "day") {
    try {
      const match = {
        status: { $in: ["paid", "shipped", "delivered"] },
      };

      if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
      }

      // Determine date grouping format
      let dateFormat;
      switch (groupBy) {
        case "hour":
          dateFormat = {
            $dateToString: { format: "%Y-%m-%d %H:00", date: "$createdAt" },
          };
          break;
        case "week":
          dateFormat = {
            $dateToString: { format: "%Y-W%V", date: "$createdAt" },
          };
          break;
        case "month":
          dateFormat = {
            $dateToString: { format: "%Y-%m", date: "$createdAt" },
          };
          break;
        case "year":
          dateFormat = { $dateToString: { format: "%Y", date: "$createdAt" } };
          break;
        default: // day
          dateFormat = {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
          };
      }

      const trends = await Order.aggregate([
        { $match: match },
        {
          $group: {
            _id: dateFormat,
            orders: { $sum: 1 },
            revenue: { $sum: "$total" },
            avgOrderValue: { $avg: "$total" },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      return trends.map((item) => ({
        date: item._id,
        orders: item.orders,
        revenue: item.revenue,
        avgOrderValue: item.avgOrderValue,
      }));
    } catch (error) {
      logger.error("Error getting revenue trends:", error);
      throw error;
    }
  }

  /**
   * Get top-selling products
   */
  async getTopProducts(startDate, endDate, limit = 10) {
    try {
      const match = {
        status: { $in: ["paid", "shipped", "delivered"] },
      };

      if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
      }

      const topProducts = await Order.aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { totalQuantity: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $project: {
            _id: 1,
            name: "$product.name",
            totalQuantity: 1,
            totalRevenue: 1,
            orderCount: 1,
            avgOrderQuantity: { $divide: ["$totalQuantity", "$orderCount"] },
          },
        },
      ]);

      return topProducts;
    } catch (error) {
      logger.error("Error getting top products:", error);
      throw error;
    }
  }

  /**
   * Get customer metrics
   */
  async getCustomerMetrics(startDate, endDate) {
    try {
      const match = {
        status: { $in: ["paid", "shipped", "delivered"] },
      };

      if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
      }

      const [customerData, totalCustomers] = await Promise.all([
        // Customer purchase patterns
        Order.aggregate([
          { $match: match },
          {
            $group: {
              _id: "$user",
              orderCount: { $sum: 1 },
              totalSpent: { $sum: "$total" },
              avgOrderValue: { $avg: "$total" },
              firstOrder: { $min: "$createdAt" },
              lastOrder: { $max: "$createdAt" },
            },
          },
          {
            $group: {
              _id: null,
              totalCustomers: { $sum: 1 },
              avgOrdersPerCustomer: { $avg: "$orderCount" },
              avgCustomerValue: { $avg: "$totalSpent" },
              repeatCustomers: {
                $sum: { $cond: [{ $gt: ["$orderCount", 1] }, 1, 0] },
              },
            },
          },
        ]),

        // Total registered users
        User.countDocuments({ role: "customer" }),
      ]);

      const metrics = customerData[0] || {
        totalCustomers: 0,
        avgOrdersPerCustomer: 0,
        avgCustomerValue: 0,
        repeatCustomers: 0,
      };

      metrics.totalRegistered = totalCustomers;
      metrics.repeatCustomerRate =
        metrics.totalCustomers > 0
          ? ((metrics.repeatCustomers / metrics.totalCustomers) * 100).toFixed(
              2
            )
          : 0;

      return metrics;
    } catch (error) {
      logger.error("Error getting customer metrics:", error);
      throw error;
    }
  }

  /**
   * Get product performance metrics
   */
  async getProductPerformance() {
    try {
      const [productStats, reviewStats] = await Promise.all([
        // Product sales and inventory
        Product.aggregate([
          {
            $group: {
              _id: null,
              totalProducts: { $sum: 1 },
              avgPrice: { $avg: "$price" },
              avgRating: { $avg: "$rating" },
              totalReviews: { $sum: "$reviewCount" },
            },
          },
        ]),

        // Review distribution
        Review.aggregate([
          { $match: { moderationStatus: "approved" } },
          {
            $group: {
              _id: "$rating",
              count: { $sum: 1 },
            },
          },
          { $sort: { _id: -1 } },
        ]),
      ]);

      const ratingDistribution = {};
      reviewStats.forEach((item) => {
        ratingDistribution[`${item._id}star`] = item.count;
      });

      return {
        ...(productStats[0] || {
          totalProducts: 0,
          avgPrice: 0,
          avgRating: 0,
          totalReviews: 0,
        }),
        ratingDistribution,
      };
    } catch (error) {
      logger.error("Error getting product performance:", error);
      throw error;
    }
  }

  /**
   * Get category-wise sales
   */
  async getCategorySales(startDate, endDate) {
    try {
      const match = {
        status: { $in: ["paid", "shipped", "delivered"] },
      };

      if (startDate || endDate) {
        match.createdAt = {};
        if (startDate) match.createdAt.$gte = new Date(startDate);
        if (endDate) match.createdAt.$lte = new Date(endDate);
      }

      const categorySales = await Order.aggregate([
        { $match: match },
        { $unwind: "$items" },
        {
          $lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "product",
          },
        },
        { $unwind: "$product" },
        {
          $group: {
            _id: "$product.category",
            totalQuantity: { $sum: "$items.quantity" },
            totalRevenue: {
              $sum: { $multiply: ["$items.price", "$items.quantity"] },
            },
            productCount: { $addToSet: "$items.product" },
          },
        },
        {
          $project: {
            _id: 1,
            category: "$_id",
            totalQuantity: 1,
            totalRevenue: 1,
            uniqueProducts: { $size: "$productCount" },
          },
        },
        { $sort: { totalRevenue: -1 } },
      ]);

      return categorySales;
    } catch (error) {
      logger.error("Error getting category sales:", error);
      throw error;
    }
  }

  /**
   * Get comprehensive dashboard data
   */
  async getDashboardData(startDate, endDate) {
    try {
      const [
        salesOverview,
        revenueTrends,
        topProducts,
        customerMetrics,
        productPerformance,
        categorySales,
      ] = await Promise.all([
        this.getSalesOverview(startDate, endDate),
        this.getRevenueTrends(startDate, endDate, "day"),
        this.getTopProducts(startDate, endDate, 10),
        this.getCustomerMetrics(startDate, endDate),
        this.getProductPerformance(),
        this.getCategorySales(startDate, endDate),
      ]);

      return {
        salesOverview,
        revenueTrends,
        topProducts,
        customerMetrics,
        productPerformance,
        categorySales,
        generatedAt: new Date(),
      };
    } catch (error) {
      logger.error("Error getting dashboard data:", error);
      throw error;
    }
  }
}

export default new AnalyticsService();
