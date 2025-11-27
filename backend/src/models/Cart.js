import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
    min: 1,
    default: 1,
  },
  variantId: {
    type: mongoose.Schema.Types.ObjectId,
    // Reference to specific product variant (if product has variants)
  },
  // Store variant details for quick access (denormalized)
  variantDetails: {
    sku: String,
    size: String,
    color: String,
    material: String,
    style: String,
    price: Number,
  },
});

const cartSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    unique: true,
  },
  items: [cartItemSchema],
  // Applied coupon
  appliedCoupon: {
    couponId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Coupon",
    },
    code: String,
    discountType: String,
    discountValue: Number,
    discountAmount: Number, // Calculated discount
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

cartSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Performance indexes for cart queries
cartSchema.index({ user: 1 }); // Already enforced by unique, but explicit for clarity
cartSchema.index({ "items.product": 1 }); // Product lookups in carts
cartSchema.index({ "appliedCoupon.couponId": 1 }, { sparse: true }); // Coupon usage tracking (sparse)
cartSchema.index({ updatedAt: 1 }); // Abandoned cart cleanup

const Cart = mongoose.model("Cart", cartSchema);
export default Cart;
