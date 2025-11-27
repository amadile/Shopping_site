import express from "express";
import { param, body, validationResult } from "express-validator";
import User from "../models/User.js";
import { logger } from "../config/logger.js";

const router = express.Router();

// Get commission rates for all vendors (and a global default)
router.get("/commissions", async (req, res) => {
    try {
        const vendors = await User.find({ role: "vendor" })
            .select("businessName email commissionRate")
            .sort({ createdAt: -1 });
        const globalCommission = parseFloat(process.env.DEFAULT_COMMISSION_RATE) || 15;
        res.json({ globalCommission, vendors });
    } catch (err) {
        logger.error("Get commissions error:", err);
        res.status(500).json({ error: "Server error" });
    }
});

// Update global commission rate (placeholder – just returns success)
router.put(
    "/commissions/global",
    [body("globalCommission").isFloat({ min: 0 })],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        // In a real app you'd persist this in a config collection or env file.
        // Here we just acknowledge the request.
        logger.info(`Admin ${req.user._id} attempted to set global commission to ${req.body.globalCommission}`);
        res.json({ message: "Global commission update received (not persisted in this demo)" });
    }
);

// Update a specific vendor's commission rate
router.put(
    "/commissions/vendor/:id",
    [param("id").isMongoId(), body("commissionRate").isFloat({ min: 0 })],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        try {
            const vendor = await User.findById(req.params.id);
            if (!vendor || vendor.role !== "vendor") {
                return res.status(404).json({ error: "Vendor not found" });
            }
            vendor.commissionRate = req.body.commissionRate;
            await vendor.save();
            const updated = await User.findById(vendor._id).select("-password -refreshTokens -verificationToken -resetPasswordToken");
            res.json(updated);
        } catch (err) {
            logger.error("Update vendor commission error:", err);
            res.status(500).json({ error: "Server error" });
        }
    }
);

export default router;
