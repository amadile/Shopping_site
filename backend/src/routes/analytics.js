import express from "express";
import { logger } from "../config/logger.js";
import { cacheGet, cacheSet } from "../config/redis.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import analyticsService from "../services/analyticsService.js";

const router = express.Router();

router.use(authenticateJWT);
router.use(authorizeRoles("admin"));

// Get comprehensive dashboard data
router.get("/dashboard", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const cacheKey = `analytics:dashboard:${startDate || "all"}:${
      endDate || "now"
    }`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const dashboard = await analyticsService.getDashboardData(
      startDate,
      endDate
    );

    await cacheSet(cacheKey, dashboard, 1800); // Cache for 30 minutes

    res.json(dashboard);
  } catch (err) {
    logger.error("Dashboard analytics error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get sales overview
router.get("/sales/overview", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const cacheKey = `analytics:sales:overview:${startDate || "all"}:${
      endDate || "now"
    }`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const overview = await analyticsService.getSalesOverview(
      startDate,
      endDate
    );

    await cacheSet(cacheKey, overview, 1800);

    res.json(overview);
  } catch (err) {
    logger.error("Sales overview error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get revenue trends
router.get("/sales/trends", async (req, res) => {
  try {
    const { startDate, endDate, groupBy = "day" } = req.query;
    const cacheKey = `analytics:revenue:trends:${startDate || "all"}:${
      endDate || "now"
    }:${groupBy}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const trends = await analyticsService.getRevenueTrends(
      startDate,
      endDate,
      groupBy
    );

    await cacheSet(cacheKey, trends, 1800);

    res.json(trends);
  } catch (err) {
    logger.error("Revenue trends error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get top products
router.get("/products/top", async (req, res) => {
  try {
    const { startDate, endDate, limit = 10 } = req.query;
    const cacheKey = `analytics:products:top:${startDate || "all"}:${
      endDate || "now"
    }:${limit}`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const topProducts = await analyticsService.getTopProducts(
      startDate,
      endDate,
      parseInt(limit)
    );

    await cacheSet(cacheKey, topProducts, 1800);

    res.json(topProducts);
  } catch (err) {
    logger.error("Top products error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get customer metrics
router.get("/customers/metrics", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const cacheKey = `analytics:customers:metrics:${startDate || "all"}:${
      endDate || "now"
    }`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const metrics = await analyticsService.getCustomerMetrics(
      startDate,
      endDate
    );

    await cacheSet(cacheKey, metrics, 1800);

    res.json(metrics);
  } catch (err) {
    logger.error("Customer metrics error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get product performance
router.get("/products/performance", async (req, res) => {
  try {
    const cacheKey = "analytics:products:performance";

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const performance = await analyticsService.getProductPerformance();

    await cacheSet(cacheKey, performance, 3600);

    res.json(performance);
  } catch (err) {
    logger.error("Product performance error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get category sales
router.get("/categories/sales", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const cacheKey = `analytics:categories:sales:${startDate || "all"}:${
      endDate || "now"
    }`;

    const cached = await cacheGet(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    const categorySales = await analyticsService.getCategorySales(
      startDate,
      endDate
    );

    await cacheSet(cacheKey, categorySales, 1800);

    res.json(categorySales);
  } catch (err) {
    logger.error("Category sales error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
