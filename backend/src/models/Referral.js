import mongoose from "mongoose";

/**
 * Referral Schema
 * Tracks referral program and rewards
 */
const referralSchema = new mongoose.Schema(
  {
    // User who referred
    referrer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // User who was referred
    referred: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    // Referral code used
    referralCode: {
      type: String,
      required: true,
      index: true,
    },
    // Status of referral
    status: {
      type: String,
      enum: ["pending", "completed", "rewarded", "cancelled"],
      default: "pending",
      index: true,
    },
    // Points awarded to referrer
    referrerPoints: {
      type: Number,
      default: 0,
    },
    // Points awarded to referred user
    referredPoints: {
      type: Number,
      default: 0,
    },
    // Order that completed the referral (if applicable)
    completedOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    // When referral was completed
    completedAt: Date,
    // When rewards were issued
    rewardedAt: Date,
    // Additional metadata
    metadata: {
      referrerTier: String,
      campaignId: String,
      source: String, // web, mobile, email, etc.
    },
  },
  { timestamps: true }
);

// Referral reward configuration
const REFERRAL_REWARDS = {
  referrerPoints: 200, // Points for referrer
  referredPoints: 100, // Points for new user (referred)
  minimumPurchase: 50, // Minimum purchase amount to complete referral
};

/**
 * Complete referral (when referred user makes first purchase)
 */
referralSchema.methods.complete = async function (orderId, orderAmount) {
  if (this.status !== "pending") {
    throw new Error("Referral already completed or cancelled");
  }

  if (orderAmount < REFERRAL_REWARDS.minimumPurchase) {
    throw new Error(
      `Order amount must be at least $${REFERRAL_REWARDS.minimumPurchase} to complete referral`
    );
  }

  this.status = "completed";
  this.completedOrder = orderId;
  this.completedAt = new Date();
  await this.save();

  return this;
};

/**
 * Award referral points to both users
 */
referralSchema.methods.awardPoints = async function () {
  if (this.status !== "completed") {
    throw new Error("Referral must be completed before awarding points");
  }

  if (this.status === "rewarded") {
    throw new Error("Points already awarded for this referral");
  }

  const LoyaltyPoints = mongoose.model("LoyaltyPoints");

  // Award points to referrer
  const referrerLoyalty = await LoyaltyPoints.findOne({
    user: this.referrer,
  });
  if (referrerLoyalty) {
    await referrerLoyalty.addPoints(
      REFERRAL_REWARDS.referrerPoints,
      "earned_referral",
      "Referral bonus - Friend signed up!",
      { referralId: this._id }
    );
    this.referrerPoints = REFERRAL_REWARDS.referrerPoints;
    referrerLoyalty.referralsCount += 1;
    await referrerLoyalty.save();
  }

  // Award points to referred user
  const referredLoyalty = await LoyaltyPoints.findOne({
    user: this.referred,
  });
  if (referredLoyalty) {
    await referredLoyalty.addPoints(
      REFERRAL_REWARDS.referredPoints,
      "earned_referral",
      "Welcome bonus - Referred by a friend!",
      { referralId: this._id }
    );
    this.referredPoints = REFERRAL_REWARDS.referredPoints;
  }

  this.status = "rewarded";
  this.rewardedAt = new Date();
  await this.save();

  return this;
};

/**
 * Cancel referral
 */
referralSchema.methods.cancel = async function (reason) {
  if (this.status === "rewarded") {
    throw new Error("Cannot cancel referral after points are awarded");
  }

  this.status = "cancelled";
  this.metadata = { ...this.metadata, cancellationReason: reason };
  await this.save();

  return this;
};

/**
 * Static method: Get referral statistics for a user
 */
referralSchema.statics.getReferralStats = async function (userId) {
  const stats = await this.aggregate([
    {
      $match: { referrer: userId },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        totalPoints: { $sum: "$referrerPoints" },
      },
    },
  ]);

  const total = await this.countDocuments({ referrer: userId });
  const pending = await this.countDocuments({
    referrer: userId,
    status: "pending",
  });
  const completed = await this.countDocuments({
    referrer: userId,
    status: { $in: ["completed", "rewarded"] },
  });

  return {
    total,
    pending,
    completed,
    conversionRate: total > 0 ? (completed / total) * 100 : 0,
    breakdown: stats,
  };
};

/**
 * Static method: Get top referrers
 */
referralSchema.statics.getTopReferrers = async function (limit = 10) {
  return this.aggregate([
    {
      $match: { status: "rewarded" },
    },
    {
      $group: {
        _id: "$referrer",
        totalReferrals: { $sum: 1 },
        totalPoints: { $sum: "$referrerPoints" },
      },
    },
    {
      $sort: { totalReferrals: -1 },
    },
    {
      $limit: limit,
    },
    {
      $lookup: {
        from: "users",
        localField: "_id",
        foreignField: "_id",
        as: "user",
      },
    },
    {
      $unwind: "$user",
    },
    {
      $project: {
        _id: 1,
        totalReferrals: 1,
        totalPoints: 1,
        "user.name": 1,
        "user.email": 1,
      },
    },
  ]);
};

/**
 * Static method: Check if referral code is valid
 */
referralSchema.statics.validateReferralCode = async function (code) {
  const LoyaltyPoints = mongoose.model("LoyaltyPoints");
  const loyalty = await LoyaltyPoints.findOne({ referralCode: code });
  return !!loyalty;
};

// Indexes
referralSchema.index({ createdAt: -1 });
referralSchema.index({ referrer: 1, status: 1 });
referralSchema.index({ referred: 1 });

// Compound index for tracking referral completion
referralSchema.index({ status: 1, completedAt: -1 });

const Referral = mongoose.model("Referral", referralSchema);

export default Referral;
export { REFERRAL_REWARDS };
