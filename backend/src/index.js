import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import helmet from "helmet";
import { createServer } from "http";
import mongoose from "mongoose";
import { Server } from "socket.io";
import swaggerUi from "swagger-ui-express";
import path from 'path';
import { fileURLToPath } from 'url';
import { currencyMiddleware } from "./config/currency.js";
import { logger } from "./config/logger.js";
import { initializeSocketIO } from "./config/socket.js";
import swaggerSpec from "./config/swagger.js";
import { compressionMiddleware } from "./middleware/compression.js";
import {
  csrfErrorHandler,
  csrfProtection,
  getCsrfToken,
} from "./middleware/csrf.js";
import i18nMiddleware from "./middleware/i18n.js";
import { preventNoSQLInjection, sanitizeInput } from "./middleware/sanitize.js";
import notificationService from "./services/notificationService.js";

if (process.env.NODE_ENV === "test") {
  dotenv.config({ path: ".env.test" });
} else {
  dotenv.config();
}

// Security: CORS configuration - Define allowed origins first
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : ["http://localhost:3000", "http://localhost:8080"];

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io with CORS
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
    methods: ["GET", "POST"],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Initialize Socket.io handlers and set in notification service
initializeSocketIO(io);
notificationService.setSocketIO(io);

// Security: Request body size limits to prevent DoS attacks
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Optimized compression middleware for performance
app.use(compressionMiddleware);

// Cookie parser (required for CSRF)
app.use(cookieParser());

// Serve uploaded files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Security: Helmet with enhanced configuration
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
  })
);

// Security: CORS configuration for Express
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-CSRF-Token",
      "X-Language",
      "X-Currency",
    ],
  })
);

// Internationalization (i18n) - Must come after CORS
app.use(i18nMiddleware);

// Multi-currency support - Must come after i18n
app.use(currencyMiddleware);

// Security: NoSQL injection prevention
app.use(preventNoSQLInjection);

// Security: XSS sanitization
app.use(sanitizeInput);

const PORT = process.env.PORT || 5000;

// MongoDB connection - skip in test environment or if explicitly disabled
if (process.env.NODE_ENV !== "test" && process.env.SKIP_MONGODB !== "true") {
  if (process.env.MONGO_URI) {
    mongoose
      .connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then(() => {
        console.log("MongoDB connected");
        logger.info("MongoDB connected successfully");
      })
      .catch((err) => {
        console.error("MongoDB connection error:", err);
        logger.error("MongoDB connection failed - continuing without database");
      });
  } else {
    console.warn("MONGO_URI is not defined. Skipping MongoDB connection.");
    logger.warn("MongoDB connection skipped - MONGO_URI not configured");
  }
} else {
  console.log("MongoDB connection skipped (SKIP_MONGODB=true or test mode)");
  logger.info("MongoDB connection skipped by configuration");
}

// Routes
import adminAnalyticsRoutes from "./routes/admin-analytics.js";
import adminCommissionRoutes from "./routes/admin-commission.js";
import adminDeliveryZoneRoutes from "./routes/admin-delivery-zone.js";
import adminDisputeRoutes from "./routes/admin-dispute.js";
import adminPayoutRoutes from "./routes/admin-payout.js";
import adminReviewRoutes from "./routes/admin-reviews.js";
import adminVendorRoutes from "./routes/admin-vendor.js";
import adminRoutes from "./routes/admin.js";
import analyticsRoutes from "./routes/analytics.js";
import authRoutes from "./routes/auth.js";
import cartRoutes from "./routes/cart.js";
import couponsRoutes from "./routes/coupons.js";
import currencyRoutes from "./routes/currency.js";
import debugRoutes from "./routes/debug.js";
import deliveryUgandaRoutes from "./routes/delivery-uganda.js";
import inventoryRoutes from "./routes/inventory.js";
import loginRoutes from "./routes/login.js";
import loyaltyRoutes from "./routes/loyalty.js";
import notificationsRoutes from "./routes/notifications.js";
import ordersRoutes from "./routes/orders.js";

import paymentRoutes from "./routes/payment.js";
import paymentPesapalRoutes from "./routes/payment-pesapal.js";
import paymentPayPalRoutes from "./routes/payment-paypal.js";
import paymentMobileMoneyRoutes from "./routes/payment-mobile-money.js";
import paymentMunoPayRoutes from "./routes/payment-munopay.js";
import paymentManualMomoRoutes from "./routes/payment-manual-momo.js";
import paymentCODRoutes from "./routes/payment-cod.js";
import payoutsRoutes from "./routes/payouts.js";
import productRoutes from "./routes/products.js";
import reviewsRoutes from "./routes/reviews.js";
import searchRoutes from "./routes/search.js";
import smsUgandaRoutes from "./routes/sms-uganda.js";
import uploadRoutes from "./routes/upload.js";
import userRoutes from "./routes/user.js";
import vendorRoutes from "./routes/vendor.js";
import vendorAnalyticsRoutes from "./routes/vendor-analytics.js";
import vendorPaymentConfigRoutes from "./routes/vendor-payment-config.js";

/**
 * @swagger
 * /:
 *   get:
 *     summary: API root endpoint
 *     description: Returns basic API information
 *     tags: [General]
 *     responses:
 *       200:
 *         description: API info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 version:
 *                   type: string
 *                 documentation:
 *                   type: string
 */

// Swagger UI
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Shopping Site API Documentation",
  })
);

// CSRF token endpoint (must be before CSRF protection)
app.get("/api/csrf-token", getCsrfToken);

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/auth", loginRoutes);
app.use("/api/products", productRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/coupons", couponsRoutes);
app.use("/api/currency", currencyRoutes);
app.use("/api/debug", debugRoutes); // Debug endpoints
app.use("/api/inventory", inventoryRoutes);
app.use("/api/loyalty", loyaltyRoutes);
app.use("/api/notifications", notificationsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/reviews", reviewsRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/payment", paymentRoutes);
app.use("/api/payment/pesapal", paymentPesapalRoutes);
app.use("/api/payment/paypal", paymentPayPalRoutes);
app.use("/api/payment/manual-momo", paymentManualMomoRoutes);

app.use("/api/payment/mobile-money", paymentMobileMoneyRoutes); // Mobile money payments
app.use("/api/payment/munopay", paymentMunoPayRoutes); // MunoPay integration
app.use("/api/payment/cod", paymentCODRoutes); // Cash on Delivery
app.use("/api/delivery", deliveryUgandaRoutes); // Ugandan delivery zones
app.use("/api/sms", smsUgandaRoutes); // Ugandan SMS notifications
app.use("/api/admin", adminRoutes);
app.use("/api/admin", adminVendorRoutes); // Admin vendor management routes
app.use("/api/admin/commissions", adminCommissionRoutes); // Admin commission settings
app.use("/api/admin/payouts", adminPayoutRoutes); // Admin payout management
app.use("/api/admin/delivery-zones", adminDeliveryZoneRoutes); // Admin delivery zones
app.use("/api/admin/disputes", adminDisputeRoutes); // Admin dispute management
app.use("/api/admin/analytics", adminAnalyticsRoutes); // Admin analytics dashboard
app.use("/api/admin", adminReviewRoutes); // Admin review moderation
app.use("/api/user", userRoutes);
app.use("/api/vendor", vendorRoutes);
app.use("/api/vendor", vendorAnalyticsRoutes); // Vendor analytics
app.use("/api/vendor/payment-config", vendorPaymentConfigRoutes); // Vendor payment config
app.use("/api/payout", payoutsRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/uploads", express.static("uploads"));

// Apply CSRF protection to all /api routes except GET, HEAD, OPTIONS
app.use("/api", (req, res, next) => {
  // Skip CSRF for GET, HEAD, OPTIONS, and csrf-token endpoint
  if (
    ["GET", "HEAD", "OPTIONS"].includes(req.method) ||
    req.path === "/csrf-token" ||
    req.path.startsWith("/products") // Public product browsing
  ) {
    return next();
  }
  // Apply CSRF protection to state-changing methods
  csrfProtection(req, res, next);
});

// CSRF error handler
app.use(csrfErrorHandler);

// Global error handler
app.use((err, req, res, next) => {
  logger.error("Unhandled error:", err);
  res.status(err.status || 500).json({
    error:
      process.env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message,
  });
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "online",
    message: "Shopping Site Backend API",
    docs: `${process.env.BASE_URL || "http://localhost:5000"}/api-docs`,
  });
});

// Serve Frontend in Production (Unified Deployment)
if (process.env.NODE_ENV === 'production') {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const frontendPath = path.join(__dirname, '../../frontend/dist');

  app.use(express.static(frontendPath));

  // Handle SPA routing - return index.html for all non-API routes
  app.get('*', (req, res) => {
    res.sendFile(path.join(frontendPath, 'index.html'));
  });
}

if (process.env.NODE_ENV !== "test") {
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Socket.io enabled for real-time notifications`);
  });
}

export default app;
