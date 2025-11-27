import express from "express";
import User from "../models/User.js";

const router = express.Router();

// Temporary debug endpoint to check and fix user verification
router.get("/check-user/:email", async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      email: user.email,
      name: user.name,
      isVerified: user.isVerified,
      role: user.role,
      createdAt: user.createdAt,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Temporary debug endpoint to verify a user
router.post("/verify-user/:email", async (req, res) => {
  try {
    const result = await User.updateOne(
      { email: req.params.email },
      { $set: { isVerified: true } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    const user = await User.findOne({ email: req.params.email });

    res.json({
      message: "User verified successfully",
      email: user.email,
      isVerified: user.isVerified,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Temporary debug endpoint to reset user password
router.post("/reset-password/:email", async (req, res) => {
  try {
    const bcrypt = await import("bcrypt");
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    
    const result = await User.updateOne(
      { email: req.params.email },
      { $set: { password: hashedPassword } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      message: "Password reset successfully",
      email: req.params.email,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
