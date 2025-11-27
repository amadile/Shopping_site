import crypto from "crypto";
import { doubleCsrf } from "csrf-csrf";
import { logger } from "../config/logger.js";

// Configure CSRF protection with double submit cookie pattern
const isDevelopment = process.env.NODE_ENV !== "production";

let csrfProtection, generateToken;

try {
  const { doubleCsrfProtection, generateToken: genToken } = doubleCsrf({
    getSecret: () =>
      process.env.CSRF_SECRET || "default-csrf-secret-change-in-production",
    // Use different cookie name for dev (can't use __Host- prefix without HTTPS)
    cookieName: isDevelopment ? "csrf-token" : "__Host-psifi.x-csrf-token",
    cookieOptions: {
      sameSite: isDevelopment ? "lax" : "strict",
      path: "/",
      secure: !isDevelopment,
      httpOnly: true,
    },
    size: 64,
    ignoredMethods: ["GET", "HEAD", "OPTIONS"],
    getTokenFromRequest: (req) => req.headers["x-csrf-token"],
  });

  csrfProtection = doubleCsrfProtection;
  generateToken = genToken;

  logger.info(
    `CSRF protection initialized (${
      isDevelopment ? "development" : "production"
    } mode)`
  );
} catch (err) {
  logger.error("Failed to initialize CSRF protection:", err);
  // Fallback: Create a pass-through middleware
  csrfProtection = (req, res, next) => next();
  generateToken = () => crypto.randomBytes(32).toString("hex");
}

// Export CSRF protection middleware
export { csrfProtection };

// Generate and send CSRF token
export const getCsrfToken = (req, res) => {
  try {
    if (generateToken) {
      const csrfToken = generateToken(req, res);
      logger.info(`CSRF token generated for ${req.ip}`);
      res.json({ csrfToken });
    } else {
      // Fallback: generate a random token
      const csrfToken = crypto.randomBytes(32).toString("hex");
      res.json({ csrfToken });
    }
  } catch (err) {
    logger.error("CSRF token generation error:", err);
    // Return a test token
    res.json({ csrfToken: crypto.randomBytes(32).toString("hex") });
  }
};

// CSRF error handler
export const csrfErrorHandler = (err, req, res, next) => {
  if (err.code === "EBADCSRFTOKEN" || err.message?.includes("csrf")) {
    logger.warn(
      `CSRF validation failed for ${req.ip} on ${req.method} ${req.path}`
    );
    logger.debug(
      `CSRF Debug - Cookie: ${req.cookies?.["csrf-token"]}, Header: ${req.headers["x-csrf-token"]}`
    );
    return res.status(403).json({ error: "Invalid CSRF token" });
  }
  next(err);
};
