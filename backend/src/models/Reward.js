import mongoose from "mongoose";

/**
 * Reward Schema
 * Catalog of rewards that can be redeemed with points
 */
const rewardSchema = new mongoose.Schema(
  {
    // Reward details
    name: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    // Reward type
    type: {
      type: String,
      enum: [
        "discount_percentage", // X% off entire order
        "discount_fixed", // $X off order
        "free_shipping", // Free shipping on order
        "product_discount", // Discount on specific product
        "voucher", // Gift voucher
        "free_product", // Free product
      ],
      required: true,
      index: true,
    },
    // Points cost
    pointsCost: {
      type: Number,
      required: true,
      min: 0,
      index: true,
    },
    // Reward value
    value: {
      type: Number,
      required: true,
    },
    // Value type (percentage or fixed amount)
    valueType: {
      type: String,
      enum: ["percentage", "fixed"],
      default: "fixed",
    },
    // Availability
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    // Stock/quantity available
    stockQuantity: {
      type: Number,
      default: -1, // -1 means unlimited
    },
    // Redemption limits
    redemptionLimits: {
      maxPerUser: {
        type: Number,
        default: -1, // -1 means unlimited
      },
      maxPerOrder: {
        type: Number,
        default: 1,
      },
      maxTotal: {
        type: Number,
        default: -1, // -1 means unlimited
      },
    },
    // Conditions
    conditions: {
      minimumPurchase: {
        type: Number,
        default: 0,
      },
      minimumTier: {
        type: String,
        enum: ["Bronze", "Silver", "Gold", "Platinum"],
        default: "Bronze",
      },
      validFrom: Date,
      validUntil: Date,
      applicableCategories: [String],
      applicableProducts: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
        },
      ],
    },
    // Usage tracking
    totalRedemptions: {
      type: Number,
      default: 0,
    },
    // Image
    image: {
      url: String,
      publicId: String,
    },
    // Featured reward
    isFeatured: {
      type: Boolean,
      default: false,
    },
    // Display order
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

/**
 * Check if reward is available
 */
rewardSchema.methods.isAvailable = function () {
  if (!this.isActive) return false;

  // Check stock
  if (this.stockQuantity !== -1 && this.stockQuantity <= 0) return false;

  // Check date validity
  const now = new Date();
  if (this.conditions.validFrom && now < this.conditions.validFrom)
    return false;
  if (this.conditions.validUntil && now > this.conditions.validUntil)
    return false;

  // Check total redemption limit
  if (
    this.redemptionLimits.maxTotal !== -1 &&
    this.totalRedemptions >= this.redemptionLimits.maxTotal
  )
    return false;

  return true;
};

/**
 * Check if user can redeem this reward
 */
rewardSchema.methods.canRedeem = async function (userId, userTier) {
  if (!this.isAvailable())
    return { canRedeem: false, reason: "Reward not available" };

  // Check tier requirement
  const tierOrder = ["Bronze", "Silver", "Gold", "Platinum"];
  const userTierIndex = tierOrder.indexOf(userTier);
  const requiredTierIndex = tierOrder.indexOf(this.conditions.minimumTier);
  if (userTierIndex < requiredTierIndex) {
    return {
      canRedeem: false,
      reason: `Requires ${this.conditions.minimumTier} tier or higher`,
    };
  }

  // Check per-user redemption limit
  if (this.redemptionLimits.maxPerUser !== -1) {
    const RewardRedemption = mongoose.model("RewardRedemption");
    const userRedemptions = await RewardRedemption.countDocuments({
      user: userId,
      reward: this._id,
      status: { $in: ["pending", "redeemed"] },
    });
    if (userRedemptions >= this.redemptionLimits.maxPerUser) {
      return {
        canRedeem: false,
        reason: "Redemption limit reached for this reward",
      };
    }
  }

  return { canRedeem: true };
};

/**
 * Redeem reward (decrement stock, increment redemptions)
 */
rewardSchema.methods.redeem = async function () {
  if (this.stockQuantity > 0) {
    this.stockQuantity -= 1;
  }
  this.totalRedemptions += 1;
  await this.save();
  return this;
};

/**
 * Cancel redemption (restore stock)
 */
rewardSchema.methods.cancelRedemption = async function () {
  if (this.stockQuantity !== -1) {
    this.stockQuantity += 1;
  }
  this.totalRedemptions = Math.max(0, this.totalRedemptions - 1);
  await this.save();
  return this;
};

/**
 * Static method: Get available rewards for user
 */
rewardSchema.statics.getAvailableRewards = async function (
  userTier = "Bronze",
  options = {}
) {
  const tierOrder = ["Bronze", "Silver", "Gold", "Platinum"];
  const userTierIndex = tierOrder.indexOf(userTier);
  const eligibleTiers = tierOrder.slice(0, userTierIndex + 1);

  const query = {
    isActive: true,
    "conditions.minimumTier": { $in: eligibleTiers },
    $or: [{ stockQuantity: { $gt: 0 } }, { stockQuantity: -1 }],
  };

  // Filter by type if specified
  if (options.type) {
    query.type = options.type;
  }

  // Check date validity
  const now = new Date();
  query.$and = [
    {
      $or: [
        { "conditions.validFrom": { $exists: false } },
        { "conditions.validFrom": { $lte: now } },
      ],
    },
    {
      $or: [
        { "conditions.validUntil": { $exists: false } },
        { "conditions.validUntil": { $gte: now } },
      ],
    },
  ];

  return this.find(query)
    .sort({ displayOrder: 1, pointsCost: 1 })
    .limit(options.limit || 50);
};

/**
 * Static method: Get featured rewards
 */
rewardSchema.statics.getFeaturedRewards = async function (limit = 5) {
  const now = new Date();
  return this.find({
    isActive: true,
    isFeatured: true,
    $or: [{ stockQuantity: { $gt: 0 } }, { stockQuantity: -1 }],
    $and: [
      {
        $or: [
          { "conditions.validFrom": { $exists: false } },
          { "conditions.validFrom": { $lte: now } },
        ],
      },
      {
        $or: [
          { "conditions.validUntil": { $exists: false } },
          { "conditions.validUntil": { $gte: now } },
        ],
      },
    ],
  })
    .sort({ displayOrder: 1 })
    .limit(limit);
};

/**
 * Reward Redemption Schema
 * Tracks when users redeem rewards
 */
const rewardRedemptionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Reward",
      required: true,
      index: true,
    },
    // Points spent
    pointsSpent: {
      type: Number,
      required: true,
    },
    // Status
    status: {
      type: String,
      enum: ["pending", "redeemed", "used", "expired", "cancelled"],
      default: "pending",
      index: true,
    },
    // Redemption code (unique)
    redemptionCode: {
      type: String,
      unique: true,
      index: true,
    },
    // When reward can be used
    validFrom: {
      type: Date,
      default: Date.now,
    },
    validUntil: Date,
    // Order where reward was used
    usedInOrder: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    usedAt: Date,
    // Expiry
    expiresAt: Date,
    // Metadata
    metadata: {
      rewardSnapshot: Object, // Snapshot of reward at redemption time
    },
  },
  { timestamps: true }
);

/**
 * Generate unique redemption code
 */
rewardRedemptionSchema.methods.generateRedemptionCode = async function () {
  const code = `RWD${Date.now().toString(36).toUpperCase()}${Math.random()
    .toString(36)
    .substring(2, 8)
    .toUpperCase()}`;
  this.redemptionCode = code;
  return code;
};

/**
 * Mark as used
 */
rewardRedemptionSchema.methods.markAsUsed = async function (orderId) {
  if (this.status === "used") {
    throw new Error("Reward already used");
  }

  if (this.status === "expired" || this.status === "cancelled") {
    throw new Error("Reward is expired or cancelled");
  }

  this.status = "used";
  this.usedInOrder = orderId;
  this.usedAt = new Date();
  await this.save();
  return this;
};

/**
 * Cancel redemption
 */
rewardRedemptionSchema.methods.cancel = async function () {
  if (this.status === "used") {
    throw new Error("Cannot cancel used reward");
  }

  this.status = "cancelled";
  await this.save();

  // Restore points to user
  const LoyaltyPoints = mongoose.model("LoyaltyPoints");
  const loyalty = await LoyaltyPoints.findOne({ user: this.user });
  if (loyalty) {
    await loyalty.addPoints(
      this.pointsSpent,
      "adjusted",
      "Reward redemption cancelled",
      { rewardId: this.reward }
    );
  }

  // Restore reward stock
  const Reward = mongoose.model("Reward");
  const reward = await Reward.findById(this.reward);
  if (reward) {
    await reward.cancelRedemption();
  }

  return this;
};

// Indexes
rewardSchema.index({ isActive: 1, isFeatured: 1 });
rewardSchema.index({ type: 1, pointsCost: 1 });
rewardSchema.index({ "conditions.minimumTier": 1 });
rewardRedemptionSchema.index({ createdAt: -1 });
rewardRedemptionSchema.index({ user: 1, status: 1 });
rewardRedemptionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const Reward = mongoose.model("Reward", rewardSchema);
const RewardRedemption = mongoose.model(
  "RewardRedemption",
  rewardRedemptionSchema
);

export default Reward;
export { RewardRedemption };
