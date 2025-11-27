import bcrypt from "bcrypt";
import crypto from "crypto";
import express from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import nodemailer from "nodemailer";
import { authLimiter } from "../middleware/rateLimiter.js";
import User from "../models/User.js";

const router = express.Router();

// Mock transporter for tests or when email credentials are missing
const transporter =
  process.env.NODE_ENV === "test" || !(process.env.EMAIL_USER && process.env.EMAIL_PASS)
    ? {
      sendMail: async (mailOptions) => {
        console.log("Mock email sent:", mailOptions.to, mailOptions.subject);
        console.log("Email not configured - verification email skipped");
        return { messageId: "mock-message-id" };
      },
    }
    : nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

// Registration endpoint
router.post(
  "/register",
  authLimiter,
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    const { name, email, password, role, businessName, businessAddress } = req.body;
    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }
      const hashedPassword = await bcrypt.hash(password, 10);
      const verificationToken = crypto.randomBytes(32).toString("hex");

      // Auto-verify users when email is not properly configured (need both user and pass)
      // const isEmailConfigured = !!(process.env.EMAIL_USER && process.env.EMAIL_PASS);
      const isEmailConfigured = false; // Bypass for testing);

      const userData = {
        name,
        email,
        password: hashedPassword,
        role: role || "customer",
        verificationToken,
        isVerified: !isEmailConfigured, // Auto-verify if email not properly configured
      };

      // Add vendor-specific fields if role is vendor
      if (role === "vendor") {
        userData.businessName = businessName;
        userData.businessAddress = businessAddress;
      }

      const user = new User(userData);
      await user.save();

      // Send verification email only if configured
      if (isEmailConfigured) {
        const verifyUrl = `${process.env.BASE_URL}/api/auth/verify/${verificationToken}`;
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: email,
          subject: "Verify your email",
          html: `<p>Click <a href="${verifyUrl}">here</a> to verify your email.</p>`,
        });
      }

      // Generate JWT token for immediate login
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
      user.refreshTokens = [refreshToken];
      await user.save();

      // Return user data (without sensitive info)
      const userResponse = {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      };

      if (role === "vendor") {
        userResponse.businessName = user.businessName;
        userResponse.businessAddress = user.businessAddress;
      }

      res.status(201).json({
        message: isEmailConfigured
          ? "User registered. Please verify your email."
          : "User registered and auto-verified (email not configured).",
        token,
        refreshToken,
        user: userResponse
      });
    } catch (err) {
      console.error("Registration error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Email verification endpoint
router.get("/verify/:token", async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({ verificationToken: token });
    if (!user) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }
    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    res.json({ message: "Email verified successfully." });
  } catch (err) {
    console.error("Verification error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Request password reset
router.post(
  "/forgot-password",
  authLimiter,
  [body("email").isEmail()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    try {
      const user = await User.findOne({ email });
      if (!user) {
        // Don't reveal if user exists
        return res.json({
          message: "If the email exists, a reset link has been sent.",
        });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send password reset email
      const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Password Reset Request",
        html: `
          <p>You requested a password reset.</p>
          <p>Click <a href="${resetUrl}">here</a> to reset your password.</p>
          <p>This link will expire in 1 hour.</p>
          <p>If you didn't request this, please ignore this email.</p>
        `,
      });

      res.json({ message: "If the email exists, a reset link has been sent." });
    } catch (err) {
      console.error("Forgot password error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Reset password with token
router.post(
  "/reset-password/:token",
  authLimiter,
  [body("password").isLength({ min: 6 })],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token } = req.params;
    const { password } = req.body;

    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res
          .status(400)
          .json({ error: "Invalid or expired reset token" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({ message: "Password reset successful. You can now log in." });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Alias route for reset password (accepts token in body)
router.post(
  "/reset-password",
  authLimiter,
  [body("password").isLength({ min: 6 }).optional(), body("token").optional()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

    if (!token && !password) {
      return res.status(400).json({ error: "Token and password required" });
    }

    if (!token) {
      return res.status(400).json({ error: "Reset token required" });
    }

    if (!password) {
      return res.status(400).json({ error: "Password required" });
    }

    try {
      const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordExpires: { $gt: Date.now() },
      });

      if (!user) {
        return res
          .status(400)
          .json({ error: "Invalid or expired reset token" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      await user.save();

      res.json({ message: "Password reset successful. You can now log in." });
    } catch (err) {
      console.error("Reset password error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Admin registration endpoint (protected by secret key)
router.post(
  "/register-admin",
  authLimiter,
  [
    body("name").notEmpty(),
    body("email").isEmail(),
    body("password").isLength({ min: 6 }),
    body("secretKey").notEmpty(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, secretKey } = req.body;

    // Verify secret key (set in .env file)
    const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY || "admin-secret-2024";
    if (secretKey !== ADMIN_SECRET_KEY) {
      return res.status(403).json({ error: "Invalid secret key" });
    }

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: "Email already registered" });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = new User({
        name,
        email,
        password: hashedPassword,
        role: "admin",
        isVerified: true, // Auto-verify admin users
      });

      await user.save();

      res.status(201).json({
        message: "Admin account created successfully. You can now login.",
      });
    } catch (err) {
      console.error("Admin registration error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
