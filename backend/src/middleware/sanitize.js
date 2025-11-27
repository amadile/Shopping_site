import { createWindow } from "domino";
import createDOMPurify from "dompurify";
import mongoSanitize from "express-mongo-sanitize";

// Create DOMPurify instance for server-side
const window = createWindow("<!DOCTYPE html>");
const DOMPurify = createDOMPurify(window);

/**
 * NoSQL injection prevention middleware
 * Removes any keys that start with $ or contain .
 */
export const preventNoSQLInjection = mongoSanitize({
  replaceWith: "_",
  onSanitize: ({ req, key }) => {
    console.warn(`NoSQL injection attempt detected: ${key} in ${req.path}`);
  },
});

/**
 * XSS sanitization middleware
 * Sanitizes all string values in req.body, req.query, and req.params
 */
export const sanitizeInput = (req, res, next) => {
  try {
    // Sanitize body
    if (req.body && typeof req.body === "object") {
      req.body = sanitizeObject(req.body);
    }

    // Sanitize query parameters
    if (req.query && typeof req.query === "object") {
      req.query = sanitizeObject(req.query);
    }

    // Sanitize URL parameters
    if (req.params && typeof req.params === "object") {
      req.params = sanitizeObject(req.params);
    }

    next();
  } catch (err) {
    console.error("Sanitization error:", err);
    res.status(400).json({ error: "Invalid input data" });
  }
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj) {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === "string") {
        return sanitizeString(item);
      } else if (typeof item === "object") {
        return sanitizeObject(item);
      }
      return item;
    });
  }

  const sanitized = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (typeof value === "object" && value !== null) {
      sanitized[key] = sanitizeObject(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Sanitize string for XSS prevention
 */
function sanitizeString(str) {
  if (typeof str !== "string") return str;

  // Use DOMPurify to clean HTML/script tags
  return DOMPurify.sanitize(str, {
    ALLOWED_TAGS: [], // Strip all HTML tags
    ALLOWED_ATTR: [], // Strip all attributes
    KEEP_CONTENT: true, // Keep text content
  });
}

/**
 * Sanitize HTML content (for rich text fields)
 * Allows safe HTML tags while removing dangerous content
 */
export function sanitizeHTML(html) {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ["b", "i", "em", "strong", "p", "br", "ul", "ol", "li", "a"],
    ALLOWED_ATTR: ["href", "target", "rel"],
    ALLOW_DATA_ATTR: false,
  });
}
