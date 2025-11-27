import express from "express";
import { param, body, query, validationResult } from "express-validator";
import Payout from "../models/Payout.js";
import Vendor from "../models/Vendor.js";
import { logger } from "../config/logger.js";

const router = express.Router();

/**
 * @swagger
 * /api/admin/payouts:
 *   get:
 *     summary: Get all payout requests
 *     tags: [Admin]
 */
router.get("/payouts", async (req, res) => {
    try {
        const { status, vendor, page = 1, limit = 20 } = req.query;
        const skip = (page - 1) * limit;

        const query = {};
        if (status) query.status = status;
        if (vendor) query.vendor = vendor;

        const payouts = await Payout.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(parseInt(limit))
            .populate("vendor", "businessName businessEmail payoutInfo")
            .populate("processedBy", "name email");

        const total = await Payout.countDocuments(query);

        // Get summary stats
        const stats = await Payout.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 },
                    totalAmount: { $sum: "$amount" },
                },
            },
        ]);

        res.json({
            payouts,
            pagination: {
                page: parseInt(page),
                limit: parseInt(limit),
                total,
                pages: Math.ceil(total / limit),
            },
            stats,
        });
    } catch (error) {
        logger.error("Get admin payouts error:", error);
        res.status(500).json({ error: "Server error" });
    }
});

/**
 * @swagger
 * /api/admin/payouts/{id}/approve:
 *   patch:
 *     summary: Approve payout request
 *     tags: [Admin]
 */
router.patch(
    "/payouts/:id/approve",
    [param("id").isMongoId(), body("notes").optional().isString()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const payout = await Payout.findById(req.params.id);

            if (!payout) {
                return res.status(404).json({ error: "Payout not found" });
            }

            if (payout.status !== "pending") {
                return res.status(400).json({
                    error: `Cannot approve payout with status: ${payout.status}`,
                });
            }

            // Update payout status
            await payout.markAsProcessing(req.user._id);

            if (req.body.notes) {
                payout.notes = req.body.notes;
                await payout.save();
            }

            logger.info(`Payout ${payout._id} approved by admin ${req.user._id}`, {
                payoutId: payout._id,
                amount: payout.amount,
            });

            const updatedPayout = await Payout.findById(payout._id)
                .populate("vendor", "businessName businessEmail")
                .populate("processedBy", "name email");

            res.json({
                message: "Payout approved successfully",
                payout: updatedPayout,
            });
        } catch (error) {
            logger.error("Approve payout error:", error);
            res.status(500).json({ error: "Server error" });
        }
    }
);

/**
 * @swagger
 * /api/admin/payouts/{id}/complete:
 *   patch:
 *     summary: Mark payout as completed
 *     tags: [Admin]
 */
router.patch(
    "/payouts/:id/complete",
    [
        param("id").isMongoId(),
        body("transactionId").notEmpty().withMessage("Transaction ID is required"),
        body("notes").optional().isString(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const payout = await Payout.findById(req.params.id);

            if (!payout) {
                return res.status(404).json({ error: "Payout not found" });
            }

            if (payout.status !== "processing") {
                return res.status(400).json({
                    error: `Cannot complete payout with status: ${payout.status}`,
                });
            }

            // Mark as completed (this updates vendor balance)
            await payout.markAsCompleted(req.body.transactionId);

            if (req.body.notes) {
                payout.notes = req.body.notes;
                await payout.save();
            }

            logger.info(`Payout ${payout._id} completed by admin ${req.user._id}`, {
                payoutId: payout._id,
                amount: payout.amount,
                transactionId: req.body.transactionId,
            });

            const updatedPayout = await Payout.findById(payout._id)
                .populate("vendor", "businessName businessEmail")
                .populate("processedBy", "name email");

            res.json({
                message: "Payout completed successfully",
                payout: updatedPayout,
            });
        } catch (error) {
            logger.error("Complete payout error:", error);
            res.status(500).json({ error: "Server error" });
        }
    }
);

/**
 * @swagger
 * /api/admin/payouts/{id}/reject:
 *   patch:
 *     summary: Reject payout request
 *     tags: [Admin]
 */
router.patch(
    "/payouts/:id/reject",
    [
        param("id").isMongoId(),
        body("reason").notEmpty().withMessage("Rejection reason is required"),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        try {
            const payout = await Payout.findById(req.params.id);

            if (!payout) {
                return res.status(404).json({ error: "Payout not found" });
            }

            if (payout.status !== "pending") {
                return res.status(400).json({
                    error: `Cannot reject payout with status: ${payout.status}`,
                });
            }

            // Mark as failed
            await payout.markAsFailed(req.body.reason);

            logger.info(`Payout ${payout._id} rejected by admin ${req.user._id}`, {
                payoutId: payout._id,
                reason: req.body.reason,
            });

            const updatedPayout = await Payout.findById(payout._id)
                .populate("vendor", "businessName businessEmail")
                .populate("processedBy", "name email");

            res.json({
                message: "Payout rejected successfully",
                payout: updatedPayout,
            });
        } catch (error) {
            logger.error("Reject payout error:", error);
            res.status(500).json({ error: "Server error" });
        }
    }
);

// Legacy endpoint for backward compatibility
router.get("/vendors/payouts", async (req, res) => {
    try {
        const vendors = await Vendor.find()
            .select("businessName businessEmail pendingPayout totalPayouts")
            .sort({ createdAt: -1 });
        res.json(vendors);
    } catch (err) {
        logger.error("Get vendor payouts error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

export default router;
