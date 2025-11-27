import express from "express";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import VendorAnalytics from "../models/VendorAnalytics.js";
import Vendor from "../models/Vendor.js";
import { logger } from "../config/logger.js";

const router = express.Router();

/**
 * @swagger
 * /api/vendor/analytics/stats:
 *   get:
 *     summary: Get vendor analytics statistics
 *     tags: [Vendor - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 30
 *     responses:
 *       200:
 *         description: Analytics statistics
 */
router.get(
    "/analytics/stats",
    authenticateJWT,
    authorizeRoles("vendor"),
    async (req, res) => {
        try {
            const { days = 30 } = req.query;

            // Find vendor linked to user
            const vendor = await Vendor.findOne({ user: req.user._id });
            if (!vendor) {
                return res.status(404).json({ error: "Vendor profile not found" });
            }

            const stats = await VendorAnalytics.getAggregatedStats(vendor._id, parseInt(days));

            res.json({
                period: `${days} days`,
                stats: stats || {
                    totalShopViews: 0,
                    totalProductClicks: 0,
                    totalReviews: 0,
                    totalAddToCart: 0,
                    totalOrders: 0,
                    totalRevenue: 0,
                },
            });
        } catch (error) {
            logger.error("Get vendor analytics error:", error);
            res.status(500).json({ error: "Server error" });
        }
    }
);

/**
 * @swagger
 * /api/vendor/analytics/daily:
 *   get:
 *     summary: Get daily analytics breakdown
 *     tags: [Vendor - Analytics]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: days
 *         schema:
 *           type: integer
 *           default: 7
 *     responses:
 *       200:
 *         description: Daily analytics data
 */
router.get(
    "/analytics/daily",
    authenticateJWT,
    authorizeRoles("vendor"),
    async (req, res) => {
        try {
            const { days = 7 } = req.query;

            // Find vendor linked to user
            const vendor = await Vendor.findOne({ user: req.user._id });
            if (!vendor) {
                return res.status(404).json({ error: "Vendor profile not found" });
            }

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - parseInt(days));
            startDate.setHours(0, 0, 0, 0);

            const endDate = new Date();
            endDate.setHours(23, 59, 59, 999);

            const dailyData = await VendorAnalytics.getAnalytics(vendor._id, startDate, endDate);

            res.json({
                period: `${days} days`,
                data: dailyData,
            });
        } catch (error) {
            logger.error("Get daily analytics error:", error);
            res.status(500).json({ error: "Server error" });
        }
    }
);

export default router;
