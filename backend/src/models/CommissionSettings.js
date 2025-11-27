import mongoose from "mongoose";

const commissionSettingsSchema = new mongoose.Schema(
  {
    // Default platform commission rates
    defaultCommissionRate: {
      type: Number,
      default: 15,
      min: 0,
      max: 100,
    },
    // Category-specific commission rates
    categoryRates: [
      {
        category: {
          type: String,
          required: true,
        },
        commissionRate: {
          type: Number,
          required: true,
          min: 0,
          max: 100,
        },
      },
    ],
    // Vendor tier-based commission rates
    tierRates: {
      bronze: {
        type: Number,
        default: 15,
        min: 0,
        max: 100,
      },
      silver: {
        type: Number,
        default: 12,
        min: 0,
        max: 100,
      },
      gold: {
        type: Number,
        default: 10,
        min: 0,
        max: 100,
      },
      platinum: {
        type: Number,
        default: 8,
        min: 0,
        max: 100,
      },
    },
    // Payment method fees
    paymentMethodFees: {
      mtn_momo: {
        type: Number,
        default: 1.5, // 1.5% fee for MTN Mobile Money
      },
      airtel_money: {
        type: Number,
        default: 1.5, // 1.5% fee for Airtel Money
      },
      cod: {
        type: Number,
        default: 0, // No fee for Cash on Delivery
      },
      bank_transfer: {
        type: Number,
        default: 0.5, // 0.5% fee for bank transfer
      },
    },
    // Delivery zone-based fees
    deliveryZoneFees: [
      {
        zone: String,
        district: String,
        baseFee: Number,
        perKmFee: Number,
      },
    ],
    // Minimum payout threshold
    minPayoutAmount: {
      type: Number,
      default: 50000, // 50,000 UGX minimum payout
    },
    // Platform settings
    platformFee: {
      type: Number,
      default: 500, // Fixed platform fee per order in UGX
    },
    taxRate: {
      type: Number,
      default: 18, // 18% VAT in Uganda
    },
    // Last updated by
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Static method to get current commission rate for a vendor
commissionSettingsSchema.statics.getCommissionRate = async function (
  vendorId,
  category = null
) {
  const settings = await this.findOne().sort({ updatedAt: -1 });
  if (!settings) {
    return 15; // Default fallback
  }

  const Vendor = mongoose.model("Vendor");
  const vendor = await Vendor.findById(vendorId);

  if (!vendor) {
    return settings.defaultCommissionRate;
  }

  // Priority: Category rate > Tier rate > Default rate
  if (category) {
    const categoryRate = settings.categoryRates.find(
      (cr) => cr.category === category
    );
    if (categoryRate) {
      return categoryRate.commissionRate;
    }
  }

  if (vendor.tier && settings.tierRates[vendor.tier]) {
    return settings.tierRates[vendor.tier];
  }

  return settings.defaultCommissionRate;
};

// Static method to calculate total fees for an order
commissionSettingsSchema.statics.calculateOrderFees = async function (
  orderAmount,
  paymentMethod,
  deliveryZone = null
) {
  const settings = await this.findOne().sort({ updatedAt: -1 });
  if (!settings) {
    return {
      platformFee: 500,
      paymentFee: 0,
      deliveryFee: 0,
      tax: orderAmount * 0.18,
      totalFees: 500 + orderAmount * 0.18,
    };
  }

  const platformFee = settings.platformFee;
  const paymentFee =
    (orderAmount * (settings.paymentMethodFees[paymentMethod] || 0)) / 100;

  let deliveryFee = 0;
  if (deliveryZone && settings.deliveryZoneFees) {
    const zoneFee = settings.deliveryZoneFees.find(
      (dzf) => dzf.zone === deliveryZone || dzf.district === deliveryZone
    );
    if (zoneFee) {
      deliveryFee = zoneFee.baseFee;
    }
  }

  const tax = (orderAmount * settings.taxRate) / 100;

  return {
    platformFee,
    paymentFee,
    deliveryFee,
    tax,
    totalFees: platformFee + paymentFee + deliveryFee + tax,
  };
};

const CommissionSettings = mongoose.model(
  "CommissionSettings",
  commissionSettingsSchema
);

export default CommissionSettings;
