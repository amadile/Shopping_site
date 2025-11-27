import mongoose from "mongoose";

const stockAlertSchema = new mongoose.Schema(
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
    type: {
      type: String,
      enum: ["low_stock", "out_of_stock", "reorder_point"],
      required: true,
    },
    threshold: {
      type: Number,
      required: true,
    },
    currentStock: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["active", "resolved", "acknowledged"],
      default: "active",
    },
    acknowledgedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    acknowledgedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    notificationSent: {
      type: Boolean,
      default: false,
    },
    notificationSentAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
stockAlertSchema.index({ inventory: 1, status: 1 });
stockAlertSchema.index({ product: 1, type: 1, status: 1 });
stockAlertSchema.index({ status: 1, createdAt: -1 }); // Active alerts sorted by date
stockAlertSchema.index({ type: 1, status: 1 }); // Filter by alert type and status
stockAlertSchema.index({ notificationSent: 1 }); // Unsent notifications

export default mongoose.model("StockAlert", stockAlertSchema);
