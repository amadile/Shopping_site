import mongoose from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     Notification:
 *       type: object
 *       required:
 *         - user
 *         - type
 *         - title
 *         - message
 *       properties:
 *         _id:
 *           type: string
 *           description: Notification ID
 *         user:
 *           type: string
 *           description: User ID who receives the notification
 *         type:
 *           type: string
 *           enum: [order, stock, promotion, admin, vendor, review, loyalty, system]
 *           description: Type of notification
 *         title:
 *           type: string
 *           description: Notification title
 *         message:
 *           type: string
 *           description: Notification message content
 *         read:
 *           type: boolean
 *           default: false
 *           description: Whether notification has been read
 *         readAt:
 *           type: string
 *           format: date-time
 *           description: When notification was read
 *         data:
 *           type: object
 *           description: Additional metadata (order ID, product ID, etc.)
 *         priority:
 *           type: string
 *           enum: [low, normal, high, urgent]
 *           default: normal
 *           description: Notification priority level
 *         actionUrl:
 *           type: string
 *           description: URL to navigate when notification is clicked
 *         icon:
 *           type: string
 *           description: Icon identifier for the notification
 *         expiresAt:
 *           type: string
 *           format: date-time
 *           description: When notification expires (auto-deleted)
 *         channels:
 *           type: object
 *           properties:
 *             inApp:
 *               type: boolean
 *               default: true
 *             email:
 *               type: boolean
 *               default: false
 *             push:
 *               type: boolean
 *               default: false
 *           description: Delivery channels used
 *         emailSent:
 *           type: boolean
 *           default: false
 *         emailSentAt:
 *           type: string
 *           format: date-time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 */

const NotificationSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User is required"],
      index: true,
    },
    type: {
      type: String,
      enum: {
        values: [
          "order",
          "stock",
          "promotion",
          "admin",
          "vendor",
          "review",
          "loyalty",
          "system",
        ],
        message: "{VALUE} is not a valid notification type",
      },
      required: [true, "Notification type is required"],
      index: true,
    },
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    message: {
      type: String,
      required: [true, "Message is required"],
      trim: true,
      maxlength: [1000, "Message cannot exceed 1000 characters"],
    },
    read: {
      type: Boolean,
      default: false,
      index: true,
    },
    readAt: {
      type: Date,
      default: null,
    },
    data: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
      // Can contain: orderId, productId, vendorId, amount, etc.
    },
    priority: {
      type: String,
      enum: {
        values: ["low", "normal", "high", "urgent"],
        message: "{VALUE} is not a valid priority level",
      },
      default: "normal",
    },
    actionUrl: {
      type: String,
      trim: true,
      default: null,
    },
    icon: {
      type: String,
      trim: true,
      default: null,
    },
    expiresAt: {
      type: Date,
      default: null,
      index: true,
    },
    channels: {
      inApp: {
        type: Boolean,
        default: true,
      },
      email: {
        type: Boolean,
        default: false,
      },
      push: {
        type: Boolean,
        default: false,
      },
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    emailSentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
NotificationSchema.index({ user: 1, read: 1, createdAt: -1 });
NotificationSchema.index({ user: 1, type: 1, createdAt: -1 });
NotificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // TTL index

// Virtual for checking if notification is expired
NotificationSchema.virtual("isExpired").get(function () {
  if (!this.expiresAt) return false;
  return new Date() > this.expiresAt;
});

// Method to mark notification as read
NotificationSchema.methods.markAsRead = async function () {
  if (this.read) return this;

  this.read = true;
  this.readAt = new Date();
  await this.save();
  return this;
};

// Static method to get unread count for user
NotificationSchema.statics.getUnreadCount = async function (userId) {
  return await this.countDocuments({ user: userId, read: false });
};

// Static method to mark all as read for user
NotificationSchema.statics.markAllAsRead = async function (userId) {
  const result = await this.updateMany(
    { user: userId, read: false },
    {
      $set: {
        read: true,
        readAt: new Date(),
      },
    }
  );
  return result;
};

// Static method to delete old read notifications
NotificationSchema.statics.deleteOldNotifications = async function (
  daysOld = 30
) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const result = await this.deleteMany({
    read: true,
    readAt: { $lt: cutoffDate },
  });

  return result.deletedCount;
};

// Static method to get user notifications with pagination
NotificationSchema.statics.getUserNotifications = async function (
  userId,
  options = {}
) {
  const {
    page = 1,
    limit = 20,
    type = null,
    read = null,
    priority = null,
  } = options;

  const query = { user: userId };

  if (type) query.type = type;
  if (read !== null) query.read = read;
  if (priority) query.priority = priority;

  const skip = (page - 1) * limit;

  const [notifications, total] = await Promise.all([
    this.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    this.countDocuments(query),
  ]);

  return {
    notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  };
};

// Pre-save hook to set default icon based on type
NotificationSchema.pre("save", function (next) {
  if (this.isNew && !this.icon) {
    const iconMap = {
      order: "shopping-cart",
      stock: "box",
      promotion: "tag",
      admin: "shield",
      vendor: "store",
      review: "star",
      loyalty: "gift",
      system: "bell",
    };
    this.icon = iconMap[this.type] || "bell";
  }
  next();
});

const Notification = mongoose.model("Notification", NotificationSchema);

export default Notification;
