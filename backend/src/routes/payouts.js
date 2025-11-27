import express from "express";
import { logger } from "../config/logger.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import Payout from "../models/Payout.js";
import Vendor from "../models/Vendor.js";

const router = express.Router();

/**
 * @swagger
 * /api/payout/admin/pending:
 *   get:
 *     summary: Get all pending payouts (Admin only)
 *     tags: [Payout]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending payouts
 */
router.get(
  "/admin/pending",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { limit = 50 } = req.query;

      const payouts = await Payout.getPendingPayouts(parseInt(limit));

      res.json({ payouts });
    } catch (error) {
      logger.error("Get pending payouts error:", error);
      res.status(500).json({ error: req.t("error.serverError") });
    }
  }
);

/**
 * @swagger
 * /api/payout/admin/all:
 *   get:
 *     summary: Get all payouts (Admin only)
 *     tags: [Payout]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all payouts
 */
router.get(
  "/admin/all",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { page = 1, limit = 20, status, vendorId } = req.query;
      const skip = (page - 1) * limit;

      const query = {};
      if (status) query.status = status;
      if (vendorId) query.vendor = vendorId;

      const payouts = await Payout.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate("vendor", "businessName businessEmail")
        .populate("processedBy", "name email");

      const total = await Payout.countDocuments(query);

      // Get summary statistics
      const summary = await Payout.aggregate([
        {
          $group: {
            _id: "$status",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]);

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
      logger.error("Get all payouts error:", error);
      res.status(500).json({ error: req.t("error.serverError") });
    }
  }
);

/**
 * @swagger
 * /api/payout/admin/{payoutId}/process:
 *   put:
 *     summary: Start processing a payout (Admin only)
 *     tags: [Payout]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payoutId
 *         required: true
 *     responses:
 *       200:
 *         description: Payout marked as processing
 */
router.put(
  "/admin/:payoutId/process",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { payoutId } = req.params;

      const payout = await Payout.findById(payoutId).populate(
        "vendor",
        "businessName payoutInfo"
      );

      if (!payout) {
        return res.status(404).json({ error: req.t("payout.notFound") });
      }

      if (payout.status !== "pending") {
        return res
          .status(400)
          .json({ error: req.t("payout.alreadyProcessed") });
      }

      await payout.markAsProcessing(req.user._id);

      logger.info(`Payout ${payoutId} marked as processing`, {
        payoutId,
        adminId: req.user._id,
        amount: payout.amount,
      });

      res.json({
        message: req.t("payout.processing"),
        payout,
      });
    } catch (error) {
      logger.error("Process payout error:", error);
      res.status(500).json({ error: req.t("error.serverError") });
    }
  }
);

/**
 * @swagger
 * /api/payout/admin/{payoutId}/complete:
 *   put:
 *     summary: Mark payout as completed (Admin only)
 *     tags: [Payout]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payoutId
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               transactionId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payout completed
 */
router.put(
  "/admin/:payoutId/complete",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { payoutId } = req.params;
      const { transactionId } = req.body;

      if (!transactionId) {
        return res
          .status(400)
          .json({ error: req.t("payout.transactionIdRequired") });
      }

      const payout = await Payout.findById(payoutId);

      if (!payout) {
        return res.status(404).json({ error: req.t("payout.notFound") });
      }

      if (payout.status === "completed") {
        return res
          .status(400)
          .json({ error: req.t("payout.alreadyCompleted") });
      }

      await payout.markAsCompleted(transactionId);

      logger.info(`Payout ${payoutId} completed`, {
        payoutId,
        adminId: req.user._id,
        amount: payout.amount,
        transactionId,
      });

      res.json({
        message: req.t("payout.completed"),
        payout,
      });
    } catch (error) {
      logger.error("Complete payout error:", error);
      res.status(500).json({ error: req.t("error.serverError") });
    }
  }
);

/**
 * @swagger
 * /api/payout/admin/{payoutId}/fail:
 *   put:
 *     summary: Mark payout as failed (Admin only)
 *     tags: [Payout]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: payoutId
 *         required: true
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payout marked as failed
 */
router.put(
  "/admin/:payoutId/fail",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const { payoutId } = req.params;
      const { reason } = req.body;

      if (!reason) {
        return res.status(400).json({ error: req.t("payout.reasonRequired") });
      }

      const payout = await Payout.findById(payoutId);

      if (!payout) {
        return res.status(404).json({ error: req.t("payout.notFound") });
      }

      if (payout.status === "completed") {
        return res
          .status(400)
          .json({ error: req.t("payout.cannotFailCompleted") });
      }

      await payout.markAsFailed(reason);

      logger.info(`Payout ${payoutId} marked as failed`, {
        payoutId,
        adminId: req.user._id,
        reason,
      });

      res.json({
        message: req.t("payout.failed"),
        payout,
      });
    } catch (error) {
      logger.error("Fail payout error:", error);
      res.status(500).json({ error: req.t("error.serverError") });
    }
  }
);

/**
 * @swagger
 * /api/payout/admin/statistics:
 *   get:
 *     summary: Get payout statistics (Admin only)
 *     tags: [Payout]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payout statistics
 */
router.get(
  "/admin/statistics",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      // Get overall statistics
      const stats = await Payout.aggregate([
        {
          $group: {
            _id: null,
            totalPayouts: { $sum: "$amount" },
            count: { $sum: 1 },
            avgAmount: { $avg: "$amount" },
          },
        },
      ]);

      // Get statistics by status
      const byStatus = await Payout.aggregate([
        {
          $group: {
            _id: "$status",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]);

      // Get statistics by payment method
      const byMethod = await Payout.aggregate([
        {
          $group: {
            _id: "$paymentMethod",
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
      ]);

      // Get recent payouts trend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const trend = await Payout.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
            },
            totalAmount: { $sum: "$amount" },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]);

      // Get vendors with highest payouts
      const topVendors = await Payout.aggregate([
        {
          $match: { status: "completed" },
        },
        {
          $group: {
            _id: "$vendor",
            totalPayouts: { $sum: "$amount" },
            payoutCount: { $sum: 1 },
          },
        },
        { $sort: { totalPayouts: -1 } },
        { $limit: 10 },
      ]);

      // Populate vendor details
      await Vendor.populate(topVendors, {
        path: "_id",
        select: "businessName businessEmail rating",
      });

      res.json({
        overall: stats[0] || { totalPayouts: 0, count: 0, avgAmount: 0 },
        byStatus,
        byMethod,
        trend,
        topVendors: topVendors.map((v) => ({
          vendor: v._id,
          totalPayouts: v.totalPayouts,
          payoutCount: v.payoutCount,
        })),
      });
    } catch (error) {
      logger.error("Get payout statistics error:", error);
      res.status(500).json({ error: req.t("error.serverError") });
    }
  }
);

export default router;
