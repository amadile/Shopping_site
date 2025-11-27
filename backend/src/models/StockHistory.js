import mongoose from "mongoose";

const stockHistorySchema = new mongoose.Schema(
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
      enum: [
        "restock",
        "sale",
        "return",
        "adjustment",
        "reservation",
        "reservation_release",
      ],
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      // Positive for additions, negative for deductions
    },
    previousStock: {
      type: Number,
      required: true,
    },
    newStock: {
      type: Number,
      required: true,
    },
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    reason: {
      type: String,
      trim: true,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      // Additional context (e.g., supplier info, return reason, etc.)
    },
  },
  { timestamps: true }
);

// Indexes for efficient queries
stockHistorySchema.index({ inventory: 1, createdAt: -1 }); // History for specific inventory
stockHistorySchema.index({ product: 1, createdAt: -1 }); // History for product
stockHistorySchema.index({ type: 1, createdAt: -1 }); // History by type
stockHistorySchema.index({ order: 1 }, { sparse: true }); // Order-related history
stockHistorySchema.index({ user: 1, createdAt: -1 }); // User actions
stockHistorySchema.index({ createdAt: -1 }); // Recent changes

export default mongoose.model("StockHistory", stockHistorySchema);
