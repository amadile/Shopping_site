import mongoose from "mongoose";

/**
 * Loyalty Points Schema
 * Tracks customer loyalty points, transactions, and tier status
 */
const loyaltyPointsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    // Current points balance
    pointsBalance: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Lifetime points earned
    lifetimePoints: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Current tier
    tier: {
      type: String,
      enum: ["Bronze", "Silver", "Gold", "Platinum"],
      default: "Bronze",
      index: true,
    },
    // Points needed for next tier
    pointsToNextTier: {
      type: Number,
      default: 500, // 500 points to reach Silver
    },
    // Tier benefits
    tierBenefits: {
      discountPercentage: {
        type: Number,
        default: 0,
      },
      pointsMultiplier: {
        type: Number,
        default: 1,
      },
      freeShipping: {
        type: Boolean,
        default: false,
      },
      prioritySupport: {
        type: Boolean,
        default: false,
      },
      earlyAccess: {
        type: Boolean,
        default: false,
      },
    },
    // Points transaction history
    transactions: [
      {
        type: {
          type: String,
          enum: [
            "earned_purchase",
            "earned_review",
            "earned_referral",
            "earned_birthday",
            "earned_bonus",
            "redeemed_discount",
            "redeemed_reward",
            "expired",
            "adjusted",
          ],
          required: true,
        },
        points: {
          type: Number,
          required: true,
        },
        description: String,
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        rewardId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Reward",
        },
        referralId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Referral",
        },
        balanceAfter: Number,
        createdAt: {
          type: Date,
          default: Date.now,
        },
        expiresAt: Date,
      },
    ],
    // Referral code (unique per user)
    referralCode: {
      type: String,
      unique: true,
      sparse: true,
      index: true,
    },
    // Number of successful referrals
    referralsCount: {
      type: Number,
      default: 0,
    },
    // Birthday for birthday rewards
    birthday: Date,
    // Last birthday reward date
    lastBirthdayReward: Date,
    // Points earning settings
    settings: {
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      tierUpgradeNotifications: {
        type: Boolean,
        default: true,
      },
      expiryReminders: {
        type: Boolean,
        default: true,
      },
    },
    // Tier upgrade history
    tierHistory: [
      {
        tier: String,
        achievedAt: {
          type: Date,
          default: Date.now,
        },
        lifetimePointsAtAchievement: Number,
      },
    ],
  },
  { timestamps: true }
);

// Tier thresholds
const TIER_THRESHOLDS = {
  Bronze: 0,
  Silver: 500,
  Gold: 2000,
  Platinum: 5000,
};

// Tier benefits configuration
const TIER_BENEFITS = {
  Bronze: {
    discountPercentage: 0,
    pointsMultiplier: 1,
    freeShipping: false,
    prioritySupport: false,
    earlyAccess: false,
  },
  Silver: {
    discountPercentage: 5,
    pointsMultiplier: 1.2,
    freeShipping: false,
    prioritySupport: false,
    earlyAccess: false,
  },
  Gold: {
    discountPercentage: 10,
    pointsMultiplier: 1.5,
    freeShipping: true,
    prioritySupport: true,
    earlyAccess: false,
  },
  Platinum: {
    discountPercentage: 15,
    pointsMultiplier: 2,
    freeShipping: true,
    prioritySupport: true,
    earlyAccess: true,
  },
};

/**
 * Add points to user's account
 */
loyaltyPointsSchema.methods.addPoints = async function (
  points,
  type,
  description,
  metadata = {}
) {
  // Apply tier multiplier
  const multiplier = this.tierBenefits.pointsMultiplier || 1;
  const finalPoints = Math.round(points * multiplier);

  this.pointsBalance += finalPoints;
  this.lifetimePoints += finalPoints;

  // Add transaction
  this.transactions.push({
    type,
    points: finalPoints,
    description,
    balanceAfter: this.pointsBalance,
    ...metadata,
  });

  // Check for tier upgrade
  await this.checkTierUpgrade();

  await this.save();
  return this;
};

/**
 * Redeem points
 */
loyaltyPointsSchema.methods.redeemPoints = async function (
  points,
  type,
  description,
  metadata = {}
) {
  if (this.pointsBalance < points) {
    throw new Error("Insufficient points balance");
  }

  this.pointsBalance -= points;

  // Add transaction
  this.transactions.push({
    type,
    points: -points,
    description,
    balanceAfter: this.pointsBalance,
    ...metadata,
  });

  await this.save();
  return this;
};

/**
 * Check and upgrade tier if eligible
 */
loyaltyPointsSchema.methods.checkTierUpgrade = async function () {
  const currentTierIndex = Object.keys(TIER_THRESHOLDS).indexOf(this.tier);
  const tiers = Object.keys(TIER_THRESHOLDS);

  // Check if eligible for upgrade
  for (let i = tiers.length - 1; i > currentTierIndex; i--) {
    const tier = tiers[i];
    if (this.lifetimePoints >= TIER_THRESHOLDS[tier]) {
      const oldTier = this.tier;
      this.tier = tier;
      this.tierBenefits = TIER_BENEFITS[tier];

      // Calculate points to next tier
      const nextTierIndex = i + 1;
      if (nextTierIndex < tiers.length) {
        this.pointsToNextTier =
          TIER_THRESHOLDS[tiers[nextTierIndex]] - this.lifetimePoints;
      } else {
        this.pointsToNextTier = 0; // Already at highest tier
      }

      // Add to tier history
      this.tierHistory.push({
        tier: this.tier,
        lifetimePointsAtAchievement: this.lifetimePoints,
      });

      return { upgraded: true, oldTier, newTier: this.tier };
    }
  }

  // Update points to next tier
  const nextTierIndex = currentTierIndex + 1;
  if (nextTierIndex < tiers.length) {
    this.pointsToNextTier =
      TIER_THRESHOLDS[tiers[nextTierIndex]] - this.lifetimePoints;
  }

  return { upgraded: false };
};

/**
 * Generate unique referral code
 */
loyaltyPointsSchema.methods.generateReferralCode = async function () {
  if (this.referralCode) {
    return this.referralCode;
  }

  // Generate code from user ID and random string
  const code = `REF${this.user
    .toString()
    .substring(18)
    .toUpperCase()}${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

  this.referralCode = code;
  await this.save();
  return code;
};

/**
 * Award birthday points
 */
loyaltyPointsSchema.methods.awardBirthdayPoints = async function () {
  const today = new Date();
  const lastReward = this.lastBirthdayReward;

  // Check if birthday is today and hasn't been awarded this year
  if (
    this.birthday &&
    this.birthday.getMonth() === today.getMonth() &&
    this.birthday.getDate() === today.getDate() &&
    (!lastReward || lastReward.getFullYear() < today.getFullYear())
  ) {
    const birthdayPoints = 100; // 100 points for birthday
    await this.addPoints(
      birthdayPoints,
      "earned_birthday",
      "Happy Birthday! 🎉"
    );
    this.lastBirthdayReward = today;
    await this.save();
    return true;
  }

  return false;
};

/**
 * Get points history for a specific period
 */
loyaltyPointsSchema.methods.getPointsHistory = function (days = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - days);

  return this.transactions.filter(
    (transaction) => transaction.createdAt >= cutoffDate
  );
};

/**
 * Static method: Get leaderboard
 */
loyaltyPointsSchema.statics.getLeaderboard = async function (limit = 10) {
  return this.find()
    .sort({ lifetimePoints: -1 })
    .limit(limit)
    .populate("user", "name email")
    .select("user lifetimePoints pointsBalance tier");
};

/**
 * Static method: Get tier distribution
 */
loyaltyPointsSchema.statics.getTierDistribution = async function () {
  return this.aggregate([
    {
      $group: {
        _id: "$tier",
        count: { $sum: 1 },
        avgPoints: { $avg: "$lifetimePoints" },
        totalPoints: { $sum: "$lifetimePoints" },
      },
    },
    {
      $sort: { _id: 1 },
    },
  ]);
};

/**
 * Static method: Calculate points for purchase
 */
loyaltyPointsSchema.statics.calculatePointsForPurchase = function (amount) {
  // 1 point per dollar spent (configurable)
  return Math.floor(amount);
};

// Indexes
loyaltyPointsSchema.index({ lifetimePoints: -1 });
loyaltyPointsSchema.index({ createdAt: -1 });
loyaltyPointsSchema.index({ "transactions.createdAt": -1 });

// Pre-save middleware to set tier benefits
loyaltyPointsSchema.pre("save", function (next) {
  if (this.isModified("tier")) {
    this.tierBenefits = TIER_BENEFITS[this.tier] || TIER_BENEFITS.Bronze;
  }
  next();
});

const LoyaltyPoints = mongoose.model("LoyaltyPoints", loyaltyPointsSchema);

export default LoyaltyPoints;
export { TIER_BENEFITS, TIER_THRESHOLDS };
