import express from "express";
import { body, param, query, validationResult } from "express-validator";
import logger from "../config/logger.js";
import { authenticateJWT } from "../middleware/auth.js";
import NotificationPreference from "../models/NotificationPreference.js";
import notificationService from "../services/notificationService.js";

const router = express.Router();

// Validation middleware
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: req.__("validation.failed"),
      errors: errors.array(),
    });
  }
  next();
};

/**
 * @swagger
 * tags:
 *   name: Notifications
 *   description: Real-time notification management
 */

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications with pagination
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [order, stock, promotion, admin, vendor, review, loyalty, system]
 *         description: Filter by notification type
 *       - in: query
 *         name: read
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *         description: Filter by priority
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get(
  "/",
  authenticateJWT,
  [
    query("page").optional().isInt({ min: 1 }).toInt(),
    query("limit").optional().isInt({ min: 1, max: 100 }).toInt(),
    query("type")
      .optional()
      .isIn([
        "order",
        "stock",
        "promotion",
        "admin",
        "vendor",
        "review",
        "loyalty",
        "system",
      ]),
    query("read").optional().isBoolean().toBoolean(),
    query("priority").optional().isIn(["low", "normal", "high", "urgent"]),
  ],
  validate,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const options = {
        page: req.query.page || 1,
        limit: req.query.limit || 20,
        type: req.query.type || null,
        read: req.query.read !== undefined ? req.query.read : null,
        priority: req.query.priority || null,
      };

      const result = await notificationService.getUserNotifications(
        userId,
        options
      );

      res.json({
        success: true,
        message: req.__("notifications.retrieved"),
        ...result,
      });
    } catch (error) {
      logger.error("Error getting notifications:", error);
      res.status(500).json({
        success: false,
        message: req.__("error.server"),
        error:
          process.env.NODE_ENV === "production" ? undefined : error.message,
      });
    }
  }
);

/**
 * @swagger
 * /api/notifications/unread-count:
 *   get:
 *     summary: Get unread notification count
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Unread count retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/unread-count", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const count = await notificationService.getUnreadCount(userId);

    res.json({
      success: true,
      count,
    });
  } catch (error) {
    logger.error("Error getting unread count:", error);
    res.status(500).json({
      success: false,
      message: req.__("error.server"),
    });
  }
});

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   patch:
 *     summary: Mark notification as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */
router.patch(
  "/:id/read",
  authenticateJWT,
  [param("id").isMongoId()],
  validate,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const notificationId = req.params.id;

      const notification = await notificationService.markAsRead(
        notificationId,
        userId
      );

      res.json({
        success: true,
        message: req.__("notifications.marked_read"),
        notification,
      });
    } catch (error) {
      logger.error("Error marking notification as read:", error);

      if (error.message === "Notification not found") {
        return res.status(404).json({
          success: false,
          message: req.__("notifications.not_found"),
        });
      }

      res.status(500).json({
        success: false,
        message: req.__("error.server"),
      });
    }
  }
);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   patch:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read
 *       401:
 *         description: Unauthorized
 */
router.patch("/mark-all-read", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const result = await notificationService.markAllAsRead(userId);

    res.json({
      success: true,
      message: req.__("notifications.all_marked_read"),
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    logger.error("Error marking all notifications as read:", error);
    res.status(500).json({
      success: false,
      message: req.__("error.server"),
    });
  }
});

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Notification ID
 *     responses:
 *       200:
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 *       401:
 *         description: Unauthorized
 */
router.delete(
  "/:id",
  authenticateJWT,
  [param("id").isMongoId()],
  validate,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const notificationId = req.params.id;

      await notificationService.deleteNotification(notificationId, userId);

      res.json({
        success: true,
        message: req.__("notifications.deleted"),
      });
    } catch (error) {
      logger.error("Error deleting notification:", error);

      if (error.message === "Notification not found") {
        return res.status(404).json({
          success: false,
          message: req.__("notifications.not_found"),
        });
      }

      res.status(500).json({
        success: false,
        message: req.__("error.server"),
      });
    }
  }
);

/**
 * @swagger
 * /api/notifications/preferences:
 *   get:
 *     summary: Get notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Preferences retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get("/preferences", authenticateJWT, async (req, res) => {
  try {
    const userId = req.user._id;
    const preferences = await NotificationPreference.getOrCreate(userId);

    res.json({
      success: true,
      preferences,
    });
  } catch (error) {
    logger.error("Error getting preferences:", error);
    res.status(500).json({
      success: false,
      message: req.__("error.server"),
    });
  }
});

/**
 * @swagger
 * /api/notifications/preferences:
 *   put:
 *     summary: Update notification preferences
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               preferences:
 *                 type: object
 *               globalMute:
 *                 type: boolean
 *               muteUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Preferences updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put(
  "/preferences",
  authenticateJWT,
  [
    body("preferences").optional().isObject(),
    body("globalMute").optional().isBoolean(),
    body("muteUntil").optional().isISO8601(),
  ],
  validate,
  async (req, res) => {
    try {
      const userId = req.user._id;
      const updates = {};

      if (req.body.preferences) updates.preferences = req.body.preferences;
      if (req.body.globalMute !== undefined)
        updates.globalMute = req.body.globalMute;
      if (req.body.muteUntil) updates.muteUntil = req.body.muteUntil;

      const preferences = await NotificationPreference.updatePreferences(
        userId,
        updates
      );

      res.json({
        success: true,
        message: req.__("notifications.preferences_updated"),
        preferences,
      });
    } catch (error) {
      logger.error("Error updating preferences:", error);
      res.status(500).json({
        success: false,
        message: req.__("error.server"),
      });
    }
  }
);

/**
 * @swagger
 * /api/notifications/admin/broadcast:
 *   post:
 *     summary: Broadcast admin message to all users (Admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - message
 *             properties:
 *               title:
 *                 type: string
 *               message:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [low, normal, high, urgent]
 *     responses:
 *       200:
 *         description: Message broadcasted successfully
 *       403:
 *         description: Forbidden - Admin only
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/admin/broadcast",
  authenticateJWT,
  [
    body("title").notEmpty().trim().isLength({ max: 200 }),
    body("message").notEmpty().trim().isLength({ max: 1000 }),
    body("priority").optional().isIn(["low", "normal", "high", "urgent"]),
  ],
  validate,
  async (req, res) => {
    try {
      // Check if user is admin
      if (req.user.role !== "admin") {
        return res.status(403).json({
          success: false,
          message: req.__("error.forbidden"),
        });
      }

      const { title, message, priority = "normal" } = req.body;

      await notificationService.broadcastAdminMessage(title, message, priority);

      res.json({
        success: true,
        message: req.__("notifications.broadcast_sent"),
      });
    } catch (error) {
      logger.error("Error broadcasting message:", error);
      res.status(500).json({
        success: false,
        message: req.__("error.server"),
      });
    }
  }
);

export default router;
