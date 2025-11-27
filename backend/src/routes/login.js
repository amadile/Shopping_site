import bcrypt from "bcrypt";
import express from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { authLimiter } from "../middleware/rateLimiter.js";
import User from "../models/User.js";

const router = express.Router();

router.post(
  "/login",
  authLimiter,
  [body("email").isEmail(), body("password").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { email, password } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({ error: "Invalid credentials" });
      }
      if (!user.isVerified) {
        return res.status(403).json({ error: "Email not verified" });
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({ error: "Invalid credentials" });
      }
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      // Generate refresh token
      const refreshToken = jwt.sign(
        { id: user._id },
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
        { expiresIn: "7d" }
      );

      // Store refresh token
      user.refreshTokens = user.refreshTokens || [];
      user.refreshTokens.push(refreshToken);
      // Keep only last 5 refresh tokens
      if (user.refreshTokens.length > 5) {
        user.refreshTokens = user.refreshTokens.slice(-5);
      }
      await user.save();

      // Return user data (without sensitive info)
      const userData = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      res.json({ token, refreshToken, user: userData });
    } catch (err) {
      console.error("Login error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Refresh token endpoint
router.post(
  "/refresh-token",
  [body("refreshToken").notEmpty()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { refreshToken } = req.body;

    try {
      // Verify refresh token
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
      );

      // Find user and check if refresh token exists
      const user = await User.findById(decoded.id);
      if (!user || !user.refreshTokens?.includes(refreshToken)) {
        return res.status(401).json({ error: "Invalid refresh token" });
      }

      // Generate new access token
      const newToken = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ token: newToken });
    } catch (err) {
      // Only log unexpected errors, not JWT validation errors
      if (
        err.name !== "JsonWebTokenError" &&
        err.name !== "TokenExpiredError"
      ) {
        console.error("Refresh token error:", err);
      }
      res.status(401).json({ error: "Invalid or expired refresh token" });
    }
  }
);

// Logout endpoint (invalidate refresh token)
router.post("/logout", [body("refreshToken").notEmpty()], async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const decoded = jwt.verify(
      refreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );

    const user = await User.findById(decoded.id);
    if (user) {
      user.refreshTokens = user.refreshTokens?.filter(
        (token) => token !== refreshToken
      );
      await user.save();
    }

    res.json({ message: "Logged out successfully" });
  } catch (err) {
    // Even if token is invalid, return success
    res.json({ message: "Logged out successfully" });
  }
});

export default router;
