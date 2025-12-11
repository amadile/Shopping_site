import bcrypt from "bcrypt";
import crypto from "crypto";
import express from "express";
import { body, validationResult } from "express-validator";
import jwt from "jsonwebtoken";
import { authLimiter } from "../middleware/rateLimiter.js";
import User from "../models/User.js";
import emailService from "../services/emailService.js";
import { logger } from "../config/logger.js";

const router = express.Router();

// Check if email is configured (dynamic check)
const isEmailConfigured = () => !!(process.env.SMTP_USER && process.env.SMTP_PASS);

// Registration endpoint
router.post(
  "/register",
  authLimiter,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
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

      const userData = {
        name,
        email,
        password: hashedPassword,
        role: role || "customer",
        verificationToken,
        isVerified: !isEmailConfigured(), // Auto-verify if email not configured
      };

      // Add vendor-specific fields if role is vendor
      if (role === "vendor") {
        userData.businessName = businessName;
        userData.businessAddress = businessAddress;
      }

      const user = new User(userData);
      await user.save();

      // Send verification email only if configured
      if (isEmailConfigured()) {
        try {
          await emailService.sendVerificationEmail(email, name, verificationToken);
          logger.info('Verification email sent', { email });
        } catch (emailError) {
          logger.error('Failed to send verification email', { email, error: emailError.message });
          // Continue with registration even if email fails
        }
      } else {
        // Log verification link for development/testing when email is not configured
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        logger.info(`[DEV] Email not configured. Verification Link: ${verificationUrl}`);
        console.log(`[DEV] Verification Link for ${email}: ${verificationUrl}`);
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
        isVerified: user.isVerified,
      };

      if (role === "vendor") {
        userResponse.businessName = user.businessName;
        userResponse.businessAddress = user.businessAddress;
      }

      res.status(201).json({
        message: isEmailConfigured()
          ? "Registration successful! Please check your email to verify your account."
          : "Registration successful! Your account is ready to use.",
        token,
        refreshToken,
        user: userResponse
      });
    } catch (err) {
      logger.error("Registration error:", err);
      res.status(500).json({ error: "Server error during registration" });
    }
  }
);

// Email verification endpoint
router.get("/verify-email", async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ error: "Verification token is required" });
  }

  try {
    const user = await User.findOne({ verificationToken: token });

    if (!user) {
      return res.status(400).json({ error: "Invalid or expired verification token" });
    }

    if (user.isVerified) {
      return res.json({ message: "Email already verified. You can log in now." });
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();

    // Send welcome email
    if (isEmailConfigured()) {
      try {
        await emailService.sendWelcomeEmail(user.email, user.name);
      } catch (emailError) {
        logger.error('Failed to send welcome email', { email: user.email, error: emailError.message });
      }
    }

    logger.info('Email verified successfully', { email: user.email });
    res.json({ message: "Email verified successfully! You can now log in." });
  } catch (err) {
    logger.error("Verification error:", err);
    res.status(500).json({ error: "Server error during verification" });
  }
});

// Resend verification email
router.post(
  "/resend-verification",
  authLimiter,
  [body("email").isEmail().withMessage("Valid email is required")],
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
          message: "If the email exists and is not verified, a verification email has been sent.",
        });
      }

      if (user.isVerified) {
        return res.status(400).json({ error: "Email is already verified" });
      }

      // if (!isEmailConfigured) {
      //   return res.status(400).json({ error: "Email service is not configured" });
      // }

      // Generate new verification token
      const verificationToken = crypto.randomBytes(32).toString("hex");
      user.verificationToken = verificationToken;
      await user.save();

      // Send verification email
      if (isEmailConfigured()) {
        try {
          await emailService.sendVerificationEmail(email, user.name, verificationToken);
          logger.info('Verification email resent', { email });
        } catch (emailError) {
          logger.error('Failed to resend verification email', { email, error: emailError.message });
          return res.status(500).json({ error: "Failed to send verification email" });
        }
      } else {
        // Log verification link for development
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${verificationToken}`;
        logger.info(`[DEV] Email not configured. Verification Link: ${verificationUrl}`);
        console.log(`[DEV] Verification Link for ${email}: ${verificationUrl}`);

        // Return success even if email not sent (for dev)
        return res.json({
          message: "Verification email has been sent (simulated). Check server logs for link.",
        });
      }

      res.json({
        message: "Verification email has been sent. Please check your inbox.",
      });
    } catch (err) {
      logger.error("Resend verification error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Request password reset
router.post(
  "/forgot-password",
  authLimiter,
  [body("email").isEmail().withMessage("Valid email is required")],
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
          message: "If the email exists, a password reset link has been sent.",
        });
      }

      const resetToken = crypto.randomBytes(32).toString("hex");
      user.resetPasswordToken = resetToken;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
      await user.save();

      // Send password reset email
      if (isEmailConfigured()) {
        try {
          await emailService.sendPasswordResetEmail(email, user.name, resetToken);
          logger.info('Password reset email sent', { email });
        } catch (emailError) {
          logger.error('Failed to send password reset email', { email, error: emailError.message });
          return res.status(500).json({ error: "Failed to send password reset email" });
        }
      } else {
        // Log reset link for development
        const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`;
        logger.info(`[DEV] Email not configured. Password Reset Link: ${resetUrl}`);
        console.log(`[DEV] Password Reset Link for ${email}: ${resetUrl}`);
      }

      res.json({ message: "If the email exists, a password reset link has been sent." });
    } catch (err) {
      logger.error("Forgot password error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Reset password with token
router.post(
  "/reset-password",
  authLimiter,
  [
    body("token").notEmpty().withMessage("Reset token is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { token, password } = req.body;

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

      logger.info('Password reset successful', { email: user.email });
      res.json({ message: "Password reset successful. You can now log in with your new password." });
    } catch (err) {
      logger.error("Reset password error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Admin registration endpoint (protected by secret key)
router.post(
  "/register-admin",
  authLimiter,
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("secretKey").notEmpty().withMessage("Secret key is required"),
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

      logger.info('Admin account created', { email });
      res.status(201).json({
        message: "Admin account created successfully. You can now login.",
      });
    } catch (err) {
      logger.error("Admin registration error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
