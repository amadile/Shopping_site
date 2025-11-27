import mongoose from "mongoose";

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
  },
  price: {
    type: Number,
    required: true,
    min: 0,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    // Reference to specific product variant (if product has variants)
  },
  // Store variant details snapshot at time of order
  variantDetails: {
    sku: String,
    size: String,
    color: String,
    material: String,
    style: String,
  },
});

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  items: [orderItemSchema],
  subtotal: {
    type: Number,
    required: true,
    min: 0,
  },
  // Tax information
  tax: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Shipping cost
  shippingFee: {
    type: Number,
    default: 0,
    min: 0,
  },
  // Shipping and payment information
  shippingAddress: {
    fullName: String,
    phone: String,
    addressLine1: String,
    addressLine2: String,
    city: String,
    state: String,
    postalCode: String,
    country: String,
    // Uganda-specific fields
    district: String,
    zone: String, // Kampala zones like Nakawa, Kawempe, etc.
    landmark: String, // For landmark-based addressing
  },
  paymentMethod: {
    type: String,
    enum: ["card", "paypal", "cod", "mtn_momo", "airtel_money", "bank_transfer", "pesapal", "manual_momo"],
    default: "cod", // Default to Cash on Delivery for Uganda
  },
  // Uganda-specific mobile money fields
  mobileMoneyNumber: String,
  // Manual mobile money transaction ID (submitted by customer)
  manualTransactionId: String,
  // Notes field for delivery coordination
  notes: String,
  // Coupon/discount information
  appliedCoupon: {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    code: String,
    discountType: String,
    discountValue: Number,
    discountAmount: Number,
  },
  total: {
    type: Number,
    required: true,
    min: 0,
  },
  // Multi-currency support
  currency: {
    type: String,
    default: "UGX", // Default to Ugandan Shillings
    uppercase: true,
  },
  // Store original amounts in base currency for reporting
  baseCurrency: {
    type: String,
    default: "UGX",
  },
  baseTotal: {
    type: Number,
  },
  baseSubtotal: {
    type: Number,
  },
  exchangeRate: {
    type: Number,
    default: 1,
  },
  status: {
    type: String,
    enum: ["pending", "paid", "shipped", "delivered", "cancelled"],
    default: "pending",
  },
  paymentIntentId: {
    type: String,
    sparse: true,
  },
  // Cancellation fields
  cancellationReason: {
    type: String,
  },
  cancelledAt: {
    type: Date,
  },
  cancelledBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  // Shipping tracking information
  tracking: {
    trackingNumber: {
      type: String,
      sparse: true,
    },
    carrier: {
      type: String,
      enum: ["fedex", "ups", "dhl", "usps", "safeboda", "jumia_express", "fraine", "tugende", "other"],
    },
    trackingUrl: {
      type: String,
    },
    estimatedDelivery: {
      type: Date,
    },
    actualDelivery: {
      type: Date,
    },
    // Tracking history/events
    history: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        status: String,
        location: String,
        description: String,
        carrier: String,
      },
    ],
    lastUpdated: {
      type: Date,
    },
  },
  // Loyalty points tracking
  loyaltyPoints: {
    earned: {
      type: Number,
      default: 0,
    },
    redeemed: {
      type: Number,
      default: 0,
    },
    awarded: {
      type: Boolean,
      default: false,
    },
    awardedAt: Date,
  },
  // Referral tracking (if this is a referred user's first order)
  referralId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Referral",
  },
  // Vendor-specific fields
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
  },
  vendorCommission: {
    type: Number,
    default: 0,
  },
  platformCommission: {
    type: Number,
    default: 0,
  },
  // SMS notifications preference
  smsNotifications: {
    type: Boolean,
    default: true, // Default to SMS for Uganda
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

orderSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Performance indexes for common queries
orderSchema.index({ user: 1, createdAt: -1 }); // User's orders sorted by date
orderSchema.index({ status: 1, createdAt: -1 }); // Orders by status and date
orderSchema.index({ paymentIntentId: 1 }, { sparse: true }); // Payment lookup (sparse - not all orders have payment intent)
orderSchema.index({ "appliedCoupon.couponId": 1 }, { sparse: true }); // Coupon usage tracking (sparse)
orderSchema.index({ createdAt: -1 }); // Recent orders
orderSchema.index({ cancelledAt: -1 }, { sparse: true }); // Cancelled orders
orderSchema.index({ "tracking.trackingNumber": 1 }, { sparse: true }); // Tracking number lookup
orderSchema.index({ "shippingAddress.district": 1 }); // District-based queries
orderSchema.index({ "shippingAddress.zone": 1 }); // Zone-based queries
orderSchema.index({ vendor: 1 }); // Vendor-based queries

const Order = mongoose.model("Order", orderSchema);
export default Order;