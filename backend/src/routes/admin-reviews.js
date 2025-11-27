import express from "express";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import Review from "../models/Review.js";
import Vendor from "../models/Vendor.js";
import { logger } from "../config/logger.js";
import mongoose from "mongoose";

const router = express.Router();

/**
 * @swagger
 * /api/admin/reviews/pending:
 *   get:
 *     summary: Get all pending reviews for moderation
 *     tags: [Admin - Reviews]
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
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [product, vendor, all]
 *     responses:
 *       200:
 *         description: List of pending reviews
 */
router.get(
    "/reviews/pending",
    authenticateJWT,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const { page = 1, limit = 20, type = "all" } = req.query;

            const query = { moderationStatus: "pending" };

            // Filter by review type
            if (type === "product") {
                query.product = { $exists: true };
            } else if (type === "vendor") {
                query.vendor = { $exists: true };
            }

            const reviews = await Review.find(query)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(parseInt(limit))
                .populate("user", "name email")
                .populate("product", "name")
                .populate("vendor", "businessName");

            const total = await Review.countDocuments(query);

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
            logger.error("Get pending reviews error:", error);
            res.status(500).json({ error: "Server error" });
        }
    }
);

/**
 * @swagger
 * /api/admin/reviews/{id}/approve:
 *   patch:
 *     summary: Approve a review
 *     tags: [Admin - Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review approved
 */
router.patch(
    "/reviews/:id/approve",
    authenticateJWT,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid review ID" });
            }

            const review = await Review.findById(id);
            if (!review) {
                return res.status(404).json({ error: "Review not found" });
            }

            review.moderationStatus = "approved";
            review.moderatedBy = req.user._id;
            review.moderatedAt = new Date();
            await review.save();

            // Update vendor/product rating if applicable
            if (review.vendor) {
                await updateVendorRating(review.vendor);
            }

            res.json({
                message: "Review approved successfully",
                review,
            });
        } catch (error) {
            logger.error("Approve review error:", error);
            res.status(500).json({ error: "Server error" });
        }
    }
);

/**
 * @swagger
 * /api/admin/reviews/{id}/reject:
 *   patch:
 *     summary: Reject a review
 *     tags: [Admin - Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *         description: Review rejected
 */
router.patch(
    "/reviews/:id/reject",
    authenticateJWT,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid review ID" });
            }

            const review = await Review.findById(id);
            if (!review) {
                return res.status(404).json({ error: "Review not found" });
            }

            review.moderationStatus = "rejected";
            review.moderatedBy = req.user._id;
            review.moderatedAt = new Date();
            review.moderationReason = reason || "Rejected by admin";
            await review.save();

            res.json({
                message: "Review rejected successfully",
                review,
            });
        } catch (error) {
            logger.error("Reject review error:", error);
            res.status(500).json({ error: "Server error" });
        }
    }
);

/**
 * @swagger
 * /api/admin/reviews/{id}:
 *   delete:
 *     summary: Delete a review
 *     tags: [Admin - Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted
 */
router.delete(
    "/reviews/:id",
    authenticateJWT,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const { id } = req.params;

            if (!mongoose.Types.ObjectId.isValid(id)) {
                return res.status(400).json({ error: "Invalid review ID" });
            }

            const review = await Review.findById(id);
            if (!review) {
                return res.status(404).json({ error: "Review not found" });
            }

            const vendorId = review.vendor;
            await Review.findByIdAndDelete(id);

            // Update vendor rating if applicable
            if (vendorId) {
                await updateVendorRating(vendorId);
            }

            res.json({
                message: "Review deleted successfully",
            });
        } catch (error) {
            logger.error("Delete review error:", error);
            res.status(500).json({ error: "Server error" });
        }
    }
);

/**
 * Helper function to update vendor rating after review changes
 */
async function updateVendorRating(vendorId) {
    try {
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

        const vendor = await Vendor.findById(vendorId);
        if (vendor) {
            if (stats.length > 0) {
                vendor.rating = stats[0].avgRating;
                vendor.totalReviews = stats[0].count;
            } else {
                vendor.rating = 0;
                vendor.totalReviews = 0;
            }
            await vendor.save();
        }
    } catch (error) {
        logger.error("Update vendor rating error:", error);
    }
}

export default router;
