import jwt from "jsonwebtoken";
import User from "../models/User.js";
import logger from "./logger.js";

/**
 * Initialize Socket.io with authentication and event handlers
 */
export const initializeSocketIO = (io) => {
  // Middleware for Socket.io authentication
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth.token ||
        socket.handshake.headers.authorization?.replace("Bearer ", "");

      if (!token) {
        logger.warn("Socket connection attempt without token");
        return next(new Error("Authentication required"));
      }

      // Verify JWT token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from database (using 'id' to match the token payload from login.js)
      const userId = decoded.id || decoded.userId;
      const user = await User.findById(userId).select("-password");

      if (!user) {
        logger.warn(
          `Socket connection attempt with invalid user ID: ${userId}`
        );
        return next(new Error("User not found"));
      }

      // Attach user to socket
      socket.user = user;
      socket.userId = user._id.toString();
      socket.userRole = user.role;

      logger.info(`Socket authenticated for user: ${user._id} (${user.email})`);
      next();
    } catch (error) {
      // Only log unexpected errors, not JWT validation errors (invalid signature, expired tokens)
      if (
        error.name !== "JsonWebTokenError" &&
        error.name !== "TokenExpiredError"
      ) {
        logger.error("Socket authentication error:", error);
      }
      next(new Error("Authentication failed"));
    }
  });

  // Connection event
  io.on("connection", (socket) => {
    const userId = socket.userId;
    const userRole = socket.userRole;

    logger.info(`User connected: ${userId} via socket ${socket.id}`);

    // Join user-specific room
    socket.join(`user_${userId}`);

    // Join role-specific room
    socket.join(`role_${userRole}`);

    // Send connection confirmation
    socket.emit("connected", {
      message: "Connected to notification service",
      userId,
      socketId: socket.id,
      timestamp: new Date(),
    });

    // Handle subscribing to specific notification types
    socket.on("subscribe", (data) => {
      const { channels = [] } = data;

      channels.forEach((channel) => {
        socket.join(`channel_${channel}`);
        logger.info(`User ${userId} subscribed to channel: ${channel}`);
      });

      socket.emit("subscribed", {
        channels,
        timestamp: new Date(),
      });
    });

    // Handle unsubscribing from channels
    socket.on("unsubscribe", (data) => {
      const { channels = [] } = data;

      channels.forEach((channel) => {
        socket.leave(`channel_${channel}`);
        logger.info(`User ${userId} unsubscribed from channel: ${channel}`);
      });

      socket.emit("unsubscribed", {
        channels,
        timestamp: new Date(),
      });
    });

    // Handle notification read acknowledgment
    socket.on("notification_read", (data) => {
      const { notificationId } = data;
      logger.info(
        `User ${userId} marked notification ${notificationId} as read`
      );

      // Broadcast to other devices of the same user
      socket.to(`user_${userId}`).emit("notification_read", {
        notificationId,
        timestamp: new Date(),
      });
    });

    // Handle marking all as read
    socket.on("mark_all_read", () => {
      logger.info(`User ${userId} marked all notifications as read`);

      // Broadcast to other devices of the same user
      socket.to(`user_${userId}`).emit("all_notifications_read", {
        timestamp: new Date(),
      });
    });

    // Handle requesting unread count
    socket.on("get_unread_count", async () => {
      try {
        const Notification = (await import("../models/Notification.js"))
          .default;
        const count = await Notification.getUnreadCount(userId);

        socket.emit("unread_count", {
          count,
          timestamp: new Date(),
        });
      } catch (error) {
        logger.error("Error getting unread count:", error);
        socket.emit("error", {
          message: "Failed to get unread count",
        });
      }
    });

    // Handle typing indicators for chat (future feature)
    socket.on("typing", (data) => {
      const { recipientId } = data;
      socket.to(`user_${recipientId}`).emit("user_typing", {
        userId,
        timestamp: new Date(),
      });
    });

    // Handle stop typing
    socket.on("stop_typing", (data) => {
      const { recipientId } = data;
      socket.to(`user_${recipientId}`).emit("user_stop_typing", {
        userId,
        timestamp: new Date(),
      });
    });

    // Handle ping/pong for connection health check
    socket.on("ping", () => {
      socket.emit("pong", {
        timestamp: new Date(),
      });
    });

    // Disconnection event
    socket.on("disconnect", (reason) => {
      logger.info(`User disconnected: ${userId} (${reason})`);

      // Leave all rooms
      socket.leave(`user_${userId}`);
      socket.leave(`role_${userRole}`);
    });

    // Handle errors
    socket.on("error", (error) => {
      logger.error(`Socket error for user ${userId}:`, error);
    });
  });

  // Handle connection errors at io level
  io.engine.on("connection_error", (err) => {
    logger.error("Socket.io connection error:", {
      code: err.code,
      message: err.message,
      context: err.context,
    });
  });

  logger.info("Socket.io initialized successfully");

  return io;
};

/**
 * Emit event to specific user
 */
export const emitToUser = (io, userId, event, data) => {
  io.to(`user_${userId}`).emit(event, data);
};

/**
 * Emit event to all users with specific role
 */
export const emitToRole = (io, role, event, data) => {
  io.to(`role_${role}`).emit(event, data);
};

/**
 * Broadcast event to all connected clients
 */
export const broadcastToAll = (io, event, data) => {
  io.emit(event, data);
};

/**
 * Emit event to specific channel
 */
export const emitToChannel = (io, channel, event, data) => {
  io.to(`channel_${channel}`).emit(event, data);
};

/**
 * Get connected socket count
 */
export const getConnectedCount = (io) => {
  return io.engine.clientsCount;
};

/**
 * Get sockets in a room
 */
export const getSocketsInRoom = async (io, room) => {
  const sockets = await io.in(room).fetchSockets();
  return sockets.map((s) => ({
    id: s.id,
    userId: s.userId,
    userRole: s.userRole,
  }));
};
