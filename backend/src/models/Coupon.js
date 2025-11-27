import mongoose from "mongoose";

const couponSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },
    description: {
      type: String,
      required: true,
    },
    discountType: {
      type: String,
      enum: ["percentage", "fixed"],
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
      min: 0,
    },
    // Minimum order value required to use coupon
    minOrderValue: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Maximum discount amount (for percentage coupons)
    maxDiscountAmount: {
      type: Number,
      min: 0,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    // Usage limits
    usageLimit: {
      type: Number,
      default: null, // null = unlimited
      min: 1,
    },
    usageCount: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Per-user usage limit
    perUserLimit: {
      type: Number,
      default: 1,
      min: 1,
    },
    // Track which users have used this coupon
    usedBy: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        usedCount: {
          type: Number,
          default: 1,
        },
        lastUsedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    isActive: {
      type: Boolean,
      default: true,
    },
    // Applicable categories (empty = all categories)
    applicableCategories: [
      {
        type: String,
      },
    ],
    // Applicable products (empty = all products)
    applicableProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

// Method to check if coupon is valid
couponSchema.methods.isValid = function () {
  if (!this.isActive) return { valid: false, reason: "Coupon is inactive" };
  if (new Date() > this.expiresAt)
    return { valid: false, reason: "Coupon has expired" };
  if (this.usageLimit && this.usageCount >= this.usageLimit)
    return { valid: false, reason: "Coupon usage limit reached" };
  return { valid: true };
};

// Method to check if user can use this coupon
couponSchema.methods.canUserUse = function (userId) {
  const userUsage = this.usedBy.find(
    (u) => u.user.toString() === userId.toString()
  );
  if (userUsage && userUsage.usedCount >= this.perUserLimit) {
    return {
      valid: false,
      reason: "You have reached the usage limit for this coupon",
    };
  }
  return { valid: true };
};

// Method to calculate discount amount
couponSchema.methods.calculateDiscount = function (orderTotal) {
  if (orderTotal < this.minOrderValue) {
    return {
      valid: false,
      discount: 0,
      reason: `Minimum order value of $${this.minOrderValue} required`,
    };
  }

  let discount = 0;
  if (this.discountType === "percentage") {
    discount = (orderTotal * this.discountValue) / 100;
    // Apply max discount cap if set
    if (this.maxDiscountAmount && discount > this.maxDiscountAmount) {
      discount = this.maxDiscountAmount;
    }
  } else if (this.discountType === "fixed") {
    discount = this.discountValue;
    // Don't let discount exceed order total
    if (discount > orderTotal) {
      discount = orderTotal;
    }
  }

  return {
    valid: true,
    discount: Math.round(discount * 100) / 100, // Round to 2 decimals
    finalTotal: Math.max(0, orderTotal - discount),
  };
};

// Method to record usage
couponSchema.methods.recordUsage = async function (userId) {
  this.usageCount += 1;

  const userUsageIndex = this.usedBy.findIndex(
    (u) => u.user.toString() === userId.toString()
  );

  if (userUsageIndex > -1) {
    this.usedBy[userUsageIndex].usedCount += 1;
    this.usedBy[userUsageIndex].lastUsedAt = new Date();
  } else {
    this.usedBy.push({
      user: userId,
      usedCount: 1,
      lastUsedAt: new Date(),
    });
  }

  await this.save();
};

// Index for efficient lookups
couponSchema.index({ code: 1, isActive: 1 });
couponSchema.index({ expiresAt: 1 });
couponSchema.index({ applicableCategories: 1 }, { sparse: true }); // Category-specific coupons (sparse)
couponSchema.index({ applicableProducts: 1 }, { sparse: true }); // Product-specific coupons (sparse)
couponSchema.index({ createdBy: 1 }); // Admin's coupons

export default mongoose.model("Coupon", couponSchema);
