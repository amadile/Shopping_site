import mongoose from "mongoose";

const vendorSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
    },
    businessEmail: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    businessPhone: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      maxlength: 1000,
    },
    logo: {
      type: String, // CDN URL or local path
    },
    banner: {
      type: String, // CDN URL or local path
    },
    address: {
      street: String,
      city: String,
      state: String,
      country: String,
      zipCode: String,
      // Uganda-specific fields
      district: String,
      zone: String, // Kampala zones like Nakawa, Kawempe, etc.
      landmark: String, // For landmark-based addressing
    },
    // Verification and status
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ["pending", "approved", "rejected", "suspended"],
      default: "pending",
    },
    verificationDocuments: [
      {
        url: {
          type: String, // URLs to verification documents
          required: true
        },
        documentType: {
          type: String,
          enum: ["business_license", "tax_id", "identity", "other"],
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Commission and payment
    commissionRate: {
      type: Number,
      default: 15, // Default 15% commission
      min: 0,
      max: 100,
    },
    payoutInfo: {
      bankName: String,
      accountNumber: String,
      accountHolderName: String,
      routingNumber: String,
      paypalEmail: String,
      preferredMethod: {
        type: String,
        enum: ["bank", "paypal", "stripe", "mtn_momo", "airtel_money", "manual_momo"],
        default: "bank",
      },
      // Uganda-specific mobile money numbers
      mobileMoneyNumbers: {
        mtn: String,
        mtnAccountName: String,
        airtel: String,
        airtelAccountName: String,
      },
    },
    // Sales statistics
    totalSales: {
      type: Number,
      default: 0,
    },
    totalRevenue: {
      type: Number,
      default: 0,
    },
    totalCommission: {
      type: Number,
      default: 0,
    },
    totalOrders: {
      type: Number,
      default: 0,
    },
    totalProducts: {
      type: Number,
      default: 0,
    },
    // Ratings and reviews
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    // Payout information
    pendingPayout: {
      type: Number,
      default: 0,
    },
    lastPayoutDate: Date,
    totalPayouts: {
      type: Number,
      default: 0,
    },
    // Vendor badges
    badges: [{
      type: {
        type: String,
        enum: ["verified", "top_seller", "featured", "new", "trusted"],
      },
      awardedAt: {
        type: Date,
        default: Date.now,
      },
    }],
    // Store settings
    storeSettings: {
      isActive: {
        type: Boolean,
        default: true,
      },
      allowReturns: {
        type: Boolean,
        default: true,
      },
      returnPeriod: {
        type: Number,
        default: 30, // days
      },
      shippingOptions: [
        {
          name: String,
          price: Number,
          estimatedDays: Number,
          // Uganda-specific delivery options
          deliveryPartner: {
            type: String,
            enum: ["safeboda", "jumia_express", "fraine", "tugende", "customer_pickup", "other"],
          },
        },
      ],
      currencies: [
        {
          type: String,
          default: ["UGX"], // Default to Ugandan Shillings
        },
      ],
      languages: [
        {
          type: String,
          default: ["en", "lg"], // English and Luganda
        },
      ],
    },
    // Notification preferences
    notifications: {
      newOrder: {
        type: Boolean,
        default: true,
      },
      lowStock: {
        type: Boolean,
        default: true,
      },
      newReview: {
        type: Boolean,
        default: true,
      },
      payoutProcessed: {
        type: Boolean,
        default: true,
      },
      emailNotifications: {
        type: Boolean,
        default: true,
      },
      smsNotifications: {
        type: Boolean,
        default: true, // Default to SMS for Uganda
      },
    },
    // Social media links
    socialMedia: {
      website: String,
      facebook: String,
      instagram: String,
      twitter: String,
      linkedin: String,
    },
    // Performance metrics
    metrics: {
      averageResponseTime: {
        type: Number,
        default: 0, // in hours
      },
      orderFulfillmentRate: {
        type: Number,
        default: 100, // percentage
      },
      returnRate: {
        type: Number,
        default: 0, // percentage
      },
    },
    // Uganda-specific fields
    businessType: {
      type: String,
      enum: ["individual", "company"],
      default: "individual",
    },
    registrationNumber: String, // Uganda Business Registration
    tinNumber: String, // Tax ID
    phoneNumbers: [String], // Additional phone numbers (MTN, Airtel)
    tier: {
      type: String,
      enum: ["bronze", "silver", "gold", "platinum"],
      default: "bronze",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for performance
vendorSchema.index({ user: 1 });
vendorSchema.index({ businessName: "text", description: "text" });
vendorSchema.index({ verificationStatus: 1 });
vendorSchema.index({ isVerified: 1 });
vendorSchema.index({ rating: -1 });
vendorSchema.index({ totalSales: -1 });
vendorSchema.index({ "address.district": 1 });
vendorSchema.index({ "address.zone": 1 });

// Virtual for net revenue (after commission)
vendorSchema.virtual("netRevenue").get(function () {
  return this.totalRevenue - this.totalCommission;
});

// Method to calculate commission
vendorSchema.methods.calculateCommission = function (amount) {
  return (amount * this.commissionRate) / 100;
};

// Method to update sales statistics
vendorSchema.methods.updateSalesStats = async function (
  orderAmount,
  commission
) {
  this.totalSales += 1;
  this.totalRevenue += orderAmount;
  this.totalCommission += commission;
  this.pendingPayout += orderAmount - commission;
  this.totalOrders += 1;
  await this.save();
};

// Method to process payout
vendorSchema.methods.processPayout = async function (amount) {
  if (amount > this.pendingPayout) {
    throw new Error("Insufficient payout balance");
  }
  this.pendingPayout -= amount;
  this.totalPayouts += amount;
  this.lastPayoutDate = new Date();
  await this.save();
};

// Static method to get top vendors
vendorSchema.statics.getTopVendors = function (limit = 10) {
  return this.find({ isVerified: true, "storeSettings.isActive": true })
    .sort({ rating: -1, totalSales: -1 })
    .limit(limit)
    .populate("user", "name email");
};

// Static method to get vendor analytics
vendorSchema.statics.getVendorAnalytics = async function (vendorId, period) {
  const startDate = new Date();
  switch (period) {
    case "week":
      startDate.setDate(startDate.getDate() - 7);
      break;
    case "month":
      startDate.setMonth(startDate.getMonth() - 1);
      break;
    case "year":
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate.setMonth(startDate.getMonth() - 1);
  }

  const vendor = await this.findById(vendorId);
  if (!vendor) return null;

  return {
    vendor: {
      id: vendor._id,
      businessName: vendor.businessName,
      rating: vendor.rating,
      totalReviews: vendor.totalReviews,
    },
    sales: {
      total: vendor.totalSales,
      revenue: vendor.totalRevenue,
      commission: vendor.totalCommission,
      netRevenue: vendor.netRevenue,
      orders: vendor.totalOrders,
      products: vendor.totalProducts,
    },
    payout: {
      pending: vendor.pendingPayout,
      total: vendor.totalPayouts,
      lastDate: vendor.lastPayoutDate,
    },
    performance: {
      averageResponseTime: vendor.metrics.averageResponseTime,
      orderFulfillmentRate: vendor.metrics.orderFulfillmentRate,
      returnRate: vendor.metrics.returnRate,
    },
  };
};

// Static method to get vendors by district/zone for Uganda
vendorSchema.statics.getByLocation = function (district, zone) {
  const query = {};
  if (district) query["address.district"] = district;
  if (zone) query["address.zone"] = zone;

  return this.find(query)
    .populate("user", "name email");
};

const Vendor = mongoose.model("Vendor", vendorSchema);

export default Vendor;