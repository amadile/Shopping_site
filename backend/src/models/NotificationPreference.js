import mongoose from "mongoose";

/**
 * @swagger
 * components:
 *   schemas:
 *     NotificationPreference:
 *       type: object
 *       required:
 *         - user
 *       properties:
 *         _id:
 *           type: string
 *           description: Preference ID
 *         user:
 *           type: string
 *           description: User ID
 *         preferences:
 *           type: object
 *           properties:
 *             order:
 *               $ref: '#/components/schemas/ChannelPreference'
 *             stock:
 *               $ref: '#/components/schemas/ChannelPreference'
 *             promotion:
 *               $ref: '#/components/schemas/ChannelPreference'
 *             admin:
 *               $ref: '#/components/schemas/ChannelPreference'
 *             vendor:
 *               $ref: '#/components/schemas/ChannelPreference'
 *             review:
 *               $ref: '#/components/schemas/ChannelPreference'
 *             loyalty:
 *               $ref: '#/components/schemas/ChannelPreference'
 *             system:
 *               $ref: '#/components/schemas/ChannelPreference'
 *         globalMute:
 *           type: boolean
 *           default: false
 *           description: Mute all notifications
 *         muteUntil:
 *           type: string
 *           format: date-time
 *           description: Temporarily mute until this time
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *     ChannelPreference:
 *       type: object
 *       properties:
 *         inApp:
 *           type: boolean
 *           default: true
 *         email:
 *           type: boolean
 *           default: true
 *         push:
 *           type: boolean
 *           default: true
 */

const ChannelPreferenceSchema = new mongoose.Schema(
  {
    inApp: {
      type: Boolean,
      default: true,
    },
    email: {
      type: Boolean,
      default: true,
    },
    push: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false }
);

const NotificationPreferenceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    preferences: {
      order: {
        type: ChannelPreferenceSchema,
        default: () => ({
          inApp: true,
          email: true,
          push: true,
        }),
      },
      stock: {
        type: ChannelPreferenceSchema,
        default: () => ({
          inApp: true,
          email: true,
          push: false,
        }),
      },
      promotion: {
        type: ChannelPreferenceSchema,
        default: () => ({
          inApp: true,
          email: false,
          push: false,
        }),
      },
      admin: {
        type: ChannelPreferenceSchema,
        default: () => ({
          inApp: true,
          email: true,
          push: true,
        }),
      },
      vendor: {
        type: ChannelPreferenceSchema,
        default: () => ({
          inApp: true,
          email: true,
          push: true,
        }),
      },
      review: {
        type: ChannelPreferenceSchema,
        default: () => ({
          inApp: true,
          email: false,
          push: false,
        }),
      },
      loyalty: {
        type: ChannelPreferenceSchema,
        default: () => ({
          inApp: true,
          email: false,
          push: false,
        }),
      },
      system: {
        type: ChannelPreferenceSchema,
        default: () => ({
          inApp: true,
          email: true,
          push: false,
        }),
      },
    },
    globalMute: {
      type: Boolean,
      default: false,
    },
    muteUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Method to check if notifications are currently muted
NotificationPreferenceSchema.methods.isMuted = function () {
  if (this.globalMute) return true;
  if (this.muteUntil && new Date() < this.muteUntil) return true;
  return false;
};

// Method to check if specific notification type should be sent via channel
NotificationPreferenceSchema.methods.shouldSend = function (type, channel) {
  if (this.isMuted()) return false;

  const typePreference = this.preferences[type];
  if (!typePreference) return true; // Default to sending if preference not found

  return typePreference[channel] === true;
};

// Static method to get or create preferences for user
NotificationPreferenceSchema.statics.getOrCreate = async function (userId) {
  let preference = await this.findOne({ user: userId });

  if (!preference) {
    preference = await this.create({ user: userId });
  }

  return preference;
};

// Static method to update user preferences
NotificationPreferenceSchema.statics.updatePreferences = async function (
  userId,
  updates
) {
  const preference = await this.findOneAndUpdate(
    { user: userId },
    { $set: updates },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  return preference;
};

const NotificationPreference = mongoose.model(
  "NotificationPreference",
  NotificationPreferenceSchema
);

export default NotificationPreference;
