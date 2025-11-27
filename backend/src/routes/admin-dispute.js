import express from "express";
import { logger } from "../config/logger.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import Dispute from "../models/Dispute.js";

const router = express.Router();

// Apply authentication and authorization middleware
router.use(authenticateJWT);
router.use(authorizeRoles("admin"));

/**
 * @swagger
 * /api/admin/disputes:
 *   get:
 *     summary: Get all disputes with filtering
 *     tags: [Admin Dispute]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [open, under_review, resolved, closed, escalated]
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of disputes
 */
router.get("/", async (req, res) => {
  try {
    const { page = 1, limit = 20, status, priority, type } = req.query;
    const skip = (page - 1) * limit;

    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (type) query.type = type;

    const disputes = await Dispute.find(query)
      .sort({ priority: -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("customer", "name email")
      .populate("vendor", "businessName businessEmail")
      .populate("order")
      .populate("assignedTo", "name email");

    const total = await Dispute.countDocuments(query);

    res.json({
      disputes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Get disputes error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/disputes/unassigned:
 *   get:
 *     summary: Get unassigned disputes
 *     tags: [Admin Dispute]
 *     responses:
 *       200:
 *         description: List of unassigned disputes
 */
router.get("/unassigned", async (req, res) => {
  try {
    const disputes = await Dispute.find({
      assignedTo: { $exists: false },
      status: { $in: ["open", "escalated"] },
    })
      .sort({ priority: -1, createdAt: 1 })
      .populate("customer", "name email")
      .populate("vendor", "businessName businessEmail")
      .populate("order");

    res.json({
      disputes,
      total: disputes.length,
    });
  } catch (error) {
    logger.error("Get unassigned disputes error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/disputes/{disputeId}:
 *   get:
 *     summary: Get dispute details
 *     tags: [Admin Dispute]
 *     parameters:
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dispute details
 */
router.get("/:disputeId", async (req, res) => {
  try {
    const { disputeId } = req.params;

    const dispute = await Dispute.findById(disputeId)
      .populate("customer", "name email phone")
      .populate("vendor", "businessName businessEmail businessPhone")
      .populate("order")
      .populate("assignedTo", "name email")
      .populate("resolution.resolvedBy", "name email")
      .populate("messages.sender", "name email");

    if (!dispute) {
      return res.status(404).json({ error: "Dispute not found" });
    }

    res.json({ dispute });
  } catch (error) {
    logger.error("Get dispute details error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/disputes/{disputeId}/assign:
 *   put:
 *     summary: Assign dispute to admin
 *     tags: [Admin Dispute]
 *     parameters:
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               adminId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute assigned
 */
router.put("/:disputeId/assign", async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { adminId } = req.body;

    const dispute = await Dispute.findById(disputeId);

    if (!dispute) {
      return res.status(404).json({ error: "Dispute not found" });
    }

    // If no adminId provided, assign to current admin
    const assignTo = adminId || req.user._id;

    await dispute.assignToAdmin(assignTo);

    logger.info(`Dispute ${disputeId} assigned to admin ${assignTo}`, {
      disputeId,
      assignedTo: assignTo,
      assignedBy: req.user._id,
    });

    const updatedDispute = await Dispute.findById(disputeId).populate(
      "assignedTo",
      "name email"
    );

    res.json({
      message: "Dispute assigned successfully",
      dispute: updatedDispute,
    });
  } catch (error) {
    logger.error("Assign dispute error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/disputes/{disputeId}/message:
 *   post:
 *     summary: Add message to dispute
 *     tags: [Admin Dispute]
 *     parameters:
 *       - in: path
 *         name: disputeId
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
 *               message:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Message added
 */
router.post("/:disputeId/message", async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { message, attachments = [] } = req.body;

    if (!message) {
      return res.status(400).json({ error: "Message is required" });
    }

    const dispute = await Dispute.findById(disputeId);

    if (!dispute) {
      return res.status(404).json({ error: "Dispute not found" });
    }

    await dispute.addMessage(req.user._id, "admin", message, attachments);

    logger.info(`Admin ${req.user._id} added message to dispute ${disputeId}`, {
      disputeId,
      adminId: req.user._id,
    });

    const updatedDispute = await Dispute.findById(disputeId).populate(
      "messages.sender",
      "name email"
    );

    res.json({
      message: "Message added successfully",
      dispute: updatedDispute,
    });
  } catch (error) {
    logger.error("Add dispute message error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/disputes/{disputeId}/resolve:
 *   put:
 *     summary: Resolve a dispute
 *     tags: [Admin Dispute]
 *     parameters:
 *       - in: path
 *         name: disputeId
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
 *               decision:
 *                 type: string
 *                 enum: [refund_customer, replace_item, partial_refund, favor_vendor, no_action]
 *               reason:
 *                 type: string
 *               refundAmount:
 *                 type: number
 *     responses:
 *       200:
 *         description: Dispute resolved
 */
router.put("/:disputeId/resolve", async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { decision, reason, refundAmount } = req.body;

    if (!decision || !reason) {
      return res
        .status(400)
        .json({ error: "Decision and reason are required" });
    }

    const dispute = await Dispute.findById(disputeId);

    if (!dispute) {
      return res.status(404).json({ error: "Dispute not found" });
    }

    if (dispute.status === "resolved" || dispute.status === "closed") {
      return res.status(400).json({
        error: `Cannot resolve dispute with status: ${dispute.status}`,
      });
    }

    await dispute.resolve(decision, reason, refundAmount, req.user._id);

    logger.info(`Dispute ${disputeId} resolved by admin ${req.user._id}`, {
      disputeId,
      adminId: req.user._id,
      decision,
    });

    const updatedDispute = await Dispute.findById(disputeId).populate(
      "resolution.resolvedBy",
      "name email"
    );

    res.json({
      message: "Dispute resolved successfully",
      dispute: updatedDispute,
    });
  } catch (error) {
    logger.error("Resolve dispute error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/disputes/{disputeId}/close:
 *   put:
 *     summary: Close a dispute
 *     tags: [Admin Dispute]
 *     parameters:
 *       - in: path
 *         name: disputeId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Dispute closed
 */
router.put("/:disputeId/close", async (req, res) => {
  try {
    const { disputeId } = req.params;

    const dispute = await Dispute.findById(disputeId);

    if (!dispute) {
      return res.status(404).json({ error: "Dispute not found" });
    }

    if (dispute.status !== "resolved") {
      return res
        .status(400)
        .json({ error: "Only resolved disputes can be closed" });
    }

    await dispute.close();

    logger.info(`Dispute ${disputeId} closed by admin ${req.user._id}`, {
      disputeId,
      adminId: req.user._id,
    });

    res.json({
      message: "Dispute closed successfully",
      dispute,
    });
  } catch (error) {
    logger.error("Close dispute error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/disputes/{disputeId}/escalate:
 *   put:
 *     summary: Escalate a dispute
 *     tags: [Admin Dispute]
 *     parameters:
 *       - in: path
 *         name: disputeId
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
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Dispute escalated
 */
router.put("/:disputeId/escalate", async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ error: "Escalation reason is required" });
    }

    const dispute = await Dispute.findById(disputeId);

    if (!dispute) {
      return res.status(404).json({ error: "Dispute not found" });
    }

    await dispute.escalate(req.user._id, reason);

    logger.info(`Dispute ${disputeId} escalated by admin ${req.user._id}`, {
      disputeId,
      adminId: req.user._id,
      reason,
    });

    res.json({
      message: "Dispute escalated successfully",
      dispute,
    });
  } catch (error) {
    logger.error("Escalate dispute error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/disputes/{disputeId}/notes:
 *   post:
 *     summary: Add internal note to dispute
 *     tags: [Admin Dispute]
 *     parameters:
 *       - in: path
 *         name: disputeId
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
 *               note:
 *                 type: string
 *     responses:
 *       200:
 *         description: Note added
 */
router.post("/:disputeId/notes", async (req, res) => {
  try {
    const { disputeId } = req.params;
    const { note } = req.body;

    if (!note) {
      return res.status(400).json({ error: "Note is required" });
    }

    const dispute = await Dispute.findById(disputeId);

    if (!dispute) {
      return res.status(404).json({ error: "Dispute not found" });
    }

    dispute.internalNotes.push({
      note,
      addedBy: req.user._id,
    });

    await dispute.save();

    logger.info(`Admin ${req.user._id} added note to dispute ${disputeId}`, {
      disputeId,
      adminId: req.user._id,
    });

    res.json({
      message: "Note added successfully",
      dispute,
    });
  } catch (error) {
    logger.error("Add dispute note error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

/**
 * @swagger
 * /api/admin/disputes/statistics:
 *   get:
 *     summary: Get dispute statistics
 *     tags: [Admin Dispute]
 *     parameters:
 *       - in: query
 *         name: period
 *         schema:
 *           type: string
 *           enum: [week, month, year]
 *           default: month
 *     responses:
 *       200:
 *         description: Dispute statistics
 */
router.get("/statistics/overview", async (req, res) => {
  try {
    const { period = "month" } = req.query;

    const stats = await Dispute.getDisputeStats(period);
    const disputesByType = await Dispute.getDisputesByType();

    // Get average resolution time
    const avgResolutionTime =
      stats.reduce((sum, stat) => {
        return sum + (stat.avgResolutionTime || 0);
      }, 0) / (stats.length || 1);

    res.json({
      period,
      statistics: {
        byStatus: stats,
        byType: disputesByType,
        avgResolutionTimeHours: avgResolutionTime,
      },
    });
  } catch (error) {
    logger.error("Get dispute statistics error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
