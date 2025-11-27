import express from "express";
import bcrypt from "bcrypt";
import { body, validationResult } from "express-validator";
import { authenticateJWT } from "../middleware/auth.js";
import User from "../models/User.js";
import { logger } from "../config/logger.js";

const router = express.Router();

router.use(authenticateJWT);

router.get("/profile", async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      "-password -refreshTokens -verificationToken -resetPasswordToken"
    );
    res.json(user);
  } catch (err) {
    logger.error("Get profile error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.put(
  "/profile",
  [body("name").optional().notEmpty().trim(), body("email").optional().isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user._id);

      if (req.body.name) user.name = req.body.name;

      if (req.body.email && req.body.email !== user.email) {
        const existingUser = await User.findOne({ email: req.body.email });
        if (existingUser) {
          return res.status(400).json({ error: "Email already in use" });
        }
        user.email = req.body.email;
        user.isVerified = false;
      }

      await user.save();
      logger.info(`User ${user._id} updated profile`);

      const updatedUser = await User.findById(user._id).select(
        "-password -refreshTokens -verificationToken -resetPasswordToken"
      );

      res.json(updatedUser);
    } catch (err) {
      logger.error("Update profile error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.post(
  "/change-password",
  [
    body("currentPassword").notEmpty(),
    body("newPassword").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user._id);
      const { currentPassword, newPassword } = req.body;

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Current password is incorrect" });
      }

      user.password = await bcrypt.hash(newPassword, 10);
      user.refreshTokens = [];
      await user.save();

      logger.info(`User ${user._id} changed password`);

      res.json({ message: "Password changed successfully. Please log in again." });
    } catch (err) {
      logger.error("Change password error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.get("/addresses", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.shippingAddresses || []);
  } catch (err) {
    logger.error("Get addresses error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.post(
  "/addresses",
  [
    body("fullName").notEmpty().trim(),
    body("addressLine1").notEmpty().trim(),
    body("city").notEmpty().trim(),
    body("state").notEmpty().trim(),
    body("zipCode").notEmpty().trim(),
    body("country").notEmpty().trim(),
    body("phone").optional().trim(),
    body("isDefault").optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user._id);

      if (req.body.isDefault) {
        user.shippingAddresses.forEach((addr) => (addr.isDefault = false));
      }

      user.shippingAddresses.push(req.body);
      await user.save();

      logger.info(`User ${user._id} added shipping address`);

      res.status(201).json(user.shippingAddresses);
    } catch (err) {
      logger.error("Add address error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

router.put("/addresses/:id", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.shippingAddresses.id(req.params.id);

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    if (req.body.isDefault) {
      user.shippingAddresses.forEach((addr) => (addr.isDefault = false));
    }

    Object.assign(address, req.body);
    await user.save();

    logger.info(`User ${user._id} updated address ${req.params.id}`);

    res.json(user.shippingAddresses);
  } catch (err) {
    logger.error("Update address error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/addresses/:id", async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const address = user.shippingAddresses.id(req.params.id);

    if (!address) {
      return res.status(404).json({ error: "Address not found" });
    }

    address.deleteOne();
    await user.save();

    logger.info(`User ${user._id} deleted address ${req.params.id}`);

    res.json(user.shippingAddresses);
  } catch (err) {
    logger.error("Delete address error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

export default router;