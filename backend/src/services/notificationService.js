import logger from "../config/logger.js";
import Notification from "../models/Notification.js";
import NotificationPreference from "../models/NotificationPreference.js";
import emailService from "./emailService.js";

class NotificationService {
  constructor() {
    this.io = null; // Will be set when Socket.io is initialized
  }

  /**
   * Set Socket.io instance
   */
  setSocketIO(io) {
    this.io = io;
    logger.info("Socket.IO instance set in NotificationService");
  }

  /**
   * Create and send a notification
   */
  async createNotification(data) {
    try {
      const {
        userId,
        type,
        title,
        message,
        data: metadata = {},
        priority = "normal",
        actionUrl = null,
        expiresAt = null,
        channels = null,
      } = data;

      // Get user preferences
      const preferences = await NotificationPreference.getOrCreate(userId);

      // Check if notifications are muted
      if (preferences.isMuted()) {
        logger.info(`Notifications muted for user ${userId}`);
        return null;
      }

      // Determine which channels to use
      const deliveryChannels = channels || {
        inApp: preferences.shouldSend(type, "inApp"),
        email: preferences.shouldSend(type, "email"),
        push: preferences.shouldSend(type, "push"),
      };

      // Create notification in database (for in-app notifications)
      let notification = null;
      if (deliveryChannels.inApp) {
        notification = await Notification.create({
          user: userId,
          type,
          title,
          message,
          data: metadata,
          priority,
          actionUrl,
          expiresAt,
          channels: deliveryChannels,
        });
      }

      // Send real-time notification via Socket.io
      if (deliveryChannels.inApp && notification && this.io) {
        this.emitToUser(userId, "notification", {
          id: notification._id,
          type,
          title,
          message,
          data: metadata,
          priority,
          actionUrl,
          createdAt: notification.createdAt,
        });
      }

      // Send email notification
      if (deliveryChannels.email) {
        this.sendEmailNotification(userId, type, title, message, actionUrl);
      }

      // TODO: Send push notification (requires push notification service)
      if (deliveryChannels.push) {
        logger.info(`Push notification would be sent to user ${userId}`);
      }

      return notification;
    } catch (error) {
      logger.error("Error creating notification:", error);
      throw error;
    }
  }

  /**
   * Send notification to specific user via Socket.io
   */
  emitToUser(userId, event, data) {
    if (!this.io) {
      logger.warn("Socket.io not initialized, cannot emit notification");
      return;
    }

    const room = `user_${userId}`;
    this.io.to(room).emit(event, data);
    logger.info(`Emitted ${event} to user ${userId}`);
  }

  /**
   * Broadcast notification to all connected users
   */
  broadcastToAll(event, data) {
    if (!this.io) {
      logger.warn("Socket.io not initialized, cannot broadcast");
      return;
    }

    this.io.emit(event, data);
    logger.info(`Broadcasted ${event} to all users`);
  }

  /**
   * Broadcast notification to users with specific role
   */
  broadcastToRole(role, event, data) {
    if (!this.io) {
      logger.warn("Socket.io not initialized, cannot broadcast to role");
      return;
    }

    const room = `role_${role}`;
    this.io.to(room).emit(event, data);
    logger.info(`Broadcasted ${event} to role ${role}`);
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(userId, type, title, message, actionUrl) {
    try {
      // Get user details
      const User = (await import("../models/User.js")).default;
      const user = await User.findById(userId);

      if (!user) {
        logger.error(`User not found for email notification: ${userId}`);
        return;
      }

      // Create notification object for email
      const notificationData = {
        type,
        title,
        message,
        actionUrl,
        priority: "normal",
      };

      await emailService.sendNotificationEmail(user, notificationData);
    } catch (error) {
      logger.error("Error sending email notification:", error);
    }
  }

  /**
   * Get user notifications with pagination
   */
  async getUserNotifications(userId, options = {}) {
    try {
      return await Notification.getUserNotifications(userId, options);
    } catch (error) {
      logger.error("Error getting user notifications:", error);
      throw error;
    }
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId, userId) {
    try {
      const notification = await Notification.findOne({
        _id: notificationId,
        user: userId,
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      await notification.markAsRead();

      // Emit read status update via Socket.io
      if (this.io) {
        this.emitToUser(userId, "notification_read", {
          id: notificationId,
          readAt: notification.readAt,
        });
      }

      return notification;
    } catch (error) {
      logger.error("Error marking notification as read:", error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read for user
   */
  async markAllAsRead(userId) {
    try {
      const result = await Notification.markAllAsRead(userId);

      // Emit update via Socket.io
      if (this.io) {
        this.emitToUser(userId, "all_notifications_read", {
          timestamp: new Date(),
        });
      }

      return result;
    } catch (error) {
      logger.error("Error marking all notifications as read:", error);
      throw error;
    }
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId, userId) {
    try {
      const notification = await Notification.findOneAndDelete({
        _id: notificationId,
        user: userId,
      });

      if (!notification) {
        throw new Error("Notification not found");
      }

      // Emit deletion via Socket.io
      if (this.io) {
        this.emitToUser(userId, "notification_deleted", {
          id: notificationId,
        });
      }

      return notification;
    } catch (error) {
      logger.error("Error deleting notification:", error);
      throw error;
    }
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId) {
    try {
      return await Notification.getUnreadCount(userId);
    } catch (error) {
      logger.error("Error getting unread count:", error);
      throw error;
    }
  }

  /**
   * Delete old read notifications (cleanup task)
   */
  async cleanupOldNotifications(daysOld = 30) {
    try {
      const deletedCount = await Notification.deleteOldNotifications(daysOld);
      logger.info(`Deleted ${deletedCount} old notifications`);
      return deletedCount;
    } catch (error) {
      logger.error("Error cleaning up old notifications:", error);
      throw error;
    }
  }

  /**
   * Create order notification
   */
  async notifyOrderUpdate(userId, orderId, status, orderNumber) {
    const titles = {
      pending: "Order Placed",
      processing: "Order Processing",
      shipped: "Order Shipped",
      delivered: "Order Delivered",
      cancelled: "Order Cancelled",
      refunded: "Order Refunded",
    };

    const messages = {
      pending: `Your order #${orderNumber} has been placed successfully.`,
      processing: `Your order #${orderNumber} is being processed.`,
      shipped: `Your order #${orderNumber} has been shipped.`,
      delivered: `Your order #${orderNumber} has been delivered.`,
      cancelled: `Your order #${orderNumber} has been cancelled.`,
      refunded: `Your order #${orderNumber} has been refunded.`,
    };

    return await this.createNotification({
      userId,
      type: "order",
      title: titles[status] || "Order Update",
      message: messages[status] || `Order #${orderNumber} status: ${status}`,
      data: { orderId, status, orderNumber },
      priority: status === "delivered" ? "high" : "normal",
      actionUrl: `/orders/${orderId}`,
    });
  }

  /**
   * Create stock alert notification
   */
  async notifyStockAlert(userId, productId, productName, currentStock) {
    return await this.createNotification({
      userId,
      type: "stock",
      title: "Low Stock Alert",
      message: `Product "${productName}" is running low (${currentStock} left).`,
      data: { productId, productName, currentStock },
      priority: currentStock === 0 ? "urgent" : "high",
      actionUrl: `/products/${productId}`,
    });
  }

  /**
   * Create promotion notification
   */
  async notifyPromotion(userId, title, message, promoCode = null) {
    return await this.createNotification({
      userId,
      type: "promotion",
      title,
      message,
      data: { promoCode },
      priority: "low",
      actionUrl: promoCode ? `/promotions/${promoCode}` : "/promotions",
    });
  }

  /**
   * Create review notification
   */
  async notifyNewReview(userId, productId, productName, reviewerName) {
    return await this.createNotification({
      userId,
      type: "review",
      title: "New Review",
      message: `${reviewerName} reviewed your product "${productName}".`,
      data: { productId, productName, reviewerName },
      priority: "low",
      actionUrl: `/products/${productId}#reviews`,
    });
  }

  /**
   * Create loyalty points notification
   */
  async notifyLoyaltyPoints(userId, points, reason) {
    return await this.createNotification({
      userId,
      type: "loyalty",
      title: "Loyalty Points Earned",
      message: `You earned ${points} points! ${reason}`,
      data: { points, reason },
      priority: "low",
      actionUrl: "/loyalty",
    });
  }

  /**
   * Broadcast admin message to all users
   */
  async broadcastAdminMessage(title, message, priority = "normal") {
    try {
      // This would typically get all active users
      // For now, just broadcast via Socket.io
      if (this.io) {
        this.broadcastToAll("admin_message", {
          title,
          message,
          priority,
          timestamp: new Date(),
        });
      }

      logger.info("Broadcasted admin message to all users");
      return { success: true, message: "Message broadcasted" };
    } catch (error) {
      logger.error("Error broadcasting admin message:", error);
      throw error;
    }
  }
}

// Create singleton instance
const notificationService = new NotificationService();

export { NotificationService, notificationService };
export default notificationService;
