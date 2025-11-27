import mongoose from "mongoose";

const stockReservationSchema = new mongoose.Schema(
  {
    inventory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inventory",
      required: true,
    },
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      // Reference to specific variant if applicable
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    status: {
      type: String,
      enum: ["active", "confirmed", "released", "expired"],
      default: "active",
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
    confirmedAt: {
      type: Date,
    },
    releasedAt: {
      type: Date,
    },
    reason: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

// TTL index to auto-delete old reservation records after 30 days
stockReservationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

// Indexes for efficient queries
stockReservationSchema.index({ inventory: 1, status: 1 });
stockReservationSchema.index({ product: 1, status: 1 });
stockReservationSchema.index({ user: 1, status: 1 });
stockReservationSchema.index({ order: 1 }); // Order-related reservations
stockReservationSchema.index({ status: 1, expiresAt: 1 }); // Active expired reservations
stockReservationSchema.index({ expiresAt: 1, status: 1 }); // Expired reservations cleanup

export default mongoose.model("StockReservation", stockReservationSchema);
