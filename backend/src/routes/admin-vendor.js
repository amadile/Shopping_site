import express from "express";
import { param, query, validationResult } from "express-validator";
import User from "../models/User.js";
import Vendor from "../models/Vendor.js";
import { logger } from "../config/logger.js";

const router = express.Router();

// Get all vendors with search, filtering, and pagination
router.get("/vendors", [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("status").optional().isIn(["pending", "approved", "rejected"]),
    query("search").optional().isString(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const { page = 1, limit = 10, status, search } = req.query;

        // Build query for Vendor model
        const vendorQuery = {};
        if (status) {
            vendorQuery.status = status;
        }
        if (search) {
            vendorQuery.$or = [
                { businessName: { $regex: search, $options: 'i' } },
                { businessEmail: { $regex: search, $options: 'i' } },
                { ownerName: { $regex: search, $options: 'i' } }
            ];
        }

        const vendors = await Vendor.find(vendorQuery)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(limit * 1)
            .skip((page - 1) * limit)
            .exec();

        const total = await Vendor.countDocuments(vendorQuery);

        res.json({
            vendors,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            total,
        });
    } catch (err) {
        logger.error("Get vendors error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Get single vendor details
router.get("/vendors/:id", [param("id").isMongoId()], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const vendor = await Vendor.findById(req.params.id)
            .populate('user', 'name email');

        if (!vendor) {
            return res.status(404).json({ error: "Vendor not found" });
        }

        res.json(vendor);
    } catch (err) {
        logger.error("Get vendor error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Approve a vendor
router.put(
    "/vendors/:id/approve",
    [param("id").isMongoId()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const vendor = await Vendor.findById(req.params.id);
            if (!vendor) {
                return res.status(404).json({ error: "Vendor not found" });
            }

            vendor.status = "approved";

            // Set default commission if not set
            if (!vendor.commissionRate) {
                vendor.commissionRate = 15;
            }

            await vendor.save();

            // Also update the user's isVerified status
            await User.findByIdAndUpdate(vendor.user, { isVerified: true });

            logger.info(`Vendor ${vendor._id} approved by admin`);

            const updated = await Vendor.findById(vendor._id).populate('user', 'name email');
            res.json(updated);
        } catch (err) {
            logger.error("Approve vendor error:", err);
            res.status(500).json({ error: "Server error" });
        }
    }
);

// Reject a vendor
router.put(
    "/vendors/:id/reject",
    [param("id").isMongoId()],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const vendor = await Vendor.findById(req.params.id);
            if (!vendor) {
                return res.status(404).json({ error: "Vendor not found" });
            }

            vendor.status = "rejected";
            vendor.rejectionReason = req.body.reason || "Admin rejected";
            await vendor.save();

            logger.info(`Vendor ${vendor._id} rejected by admin`);
            res.json({ message: "Vendor rejected", vendor });
        } catch (err) {
            logger.error("Reject vendor error:", err);
            res.status(500).json({ error: "Server error" });
        }
    }
);

export default router;
