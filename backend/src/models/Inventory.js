import mongoose from "mongoose";

// Stock transaction schema for history tracking
const stockTransactionSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["restock", "sale", "return", "adjustment", "reserved"],
    required: true,
  },
  quantity: {
    type: Number,
    required: true,
  },
  previousStock: {
    type: Number,
    required: true,
  },
  newStock: {
    type: Number,
    required: true,
  },
  reason: {
    type: String,
    trim: true,
  },
  orderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Order",
  },
  performedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const inventorySchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    variantId: {
      type: mongoose.Schema.Types.ObjectId,
      // Reference to specific variant if applicable
    },
    sku: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    currentStock: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    reservedStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    availableStock: {
      type: Number,
      default: 0,
      min: 0,
    },
    lowStockThreshold: {
      type: Number,
      default: 10,
      min: 0,
    },
    reorderPoint: {
      type: Number,
      default: 5,
      min: 0,
    },
    maxStockLevel: {
      type: Number,
      default: 1000,
    },
    isLowStock: {
      type: Boolean,
      default: false,
    },
    isOutOfStock: {
      type: Boolean,
      default: false,
    },
    lastRestockedAt: {
      type: Date,
    },
    lastRestockedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    location: {
      warehouse: String,
      aisle: String,
      shelf: String,
      bin: String,
    },
    supplier: {
      name: String,
      contactEmail: String,
      contactPhone: String,
      leadTimeDays: Number,
    },
    transactions: [stockTransactionSchema],
  },
  { timestamps: true }
);

// Virtual for available stock calculation
inventorySchema.virtual("actualAvailableStock").get(function () {
  return this.currentStock - this.reservedStock;
});

// Pre-save middleware to update stock status
inventorySchema.pre("save", function (next) {
  this.availableStock = this.currentStock - this.reservedStock;
  this.isOutOfStock = this.availableStock <= 0;
  this.isLowStock =
    !this.isOutOfStock && this.availableStock <= this.lowStockThreshold;
  next();
});

// Method to add stock
inventorySchema.methods.addStock = async function (
  quantity,
  performedBy,
  reason = "Restock"
) {
  const previousStock = this.currentStock;
  this.currentStock += quantity;
  this.lastRestockedAt = new Date();
  this.lastRestockedBy = performedBy;

  this.transactions.push({
    type: "restock",
    quantity,
    previousStock,
    newStock: this.currentStock,
    reason,
    performedBy,
  });

  await this.save();
  return this;
};

// Method to remove stock (for sales)
inventorySchema.methods.removeStock = async function (
  quantity,
  performedBy,
  orderId,
  reason = "Sale"
) {
  if (this.availableStock < quantity) {
    throw new Error("Insufficient stock available");
  }

  const previousStock = this.currentStock;
  this.currentStock -= quantity;

  this.transactions.push({
    type: "sale",
    quantity: -quantity,
    previousStock,
    newStock: this.currentStock,
    reason,
    orderId,
    performedBy,
  });

  await this.save();
  return this;
};

// Method to reserve stock (for pending orders)
inventorySchema.methods.reserveStock = async function (
  quantity,
  performedBy,
  orderId
) {
  if (this.availableStock < quantity) {
    throw new Error("Insufficient stock to reserve");
  }

  const previousReserved = this.reservedStock;
  this.reservedStock += quantity;

  this.transactions.push({
    type: "reserved",
    quantity,
    previousStock: this.currentStock,
    newStock: this.currentStock,
    reason: `Reserved for order`,
    orderId,
    performedBy,
  });

  await this.save();
  return this;
};

// Method to release reserved stock
inventorySchema.methods.releaseReservedStock = async function (
  quantity,
  performedBy,
  orderId,
  reason = "Order cancelled"
) {
  this.reservedStock = Math.max(0, this.reservedStock - quantity);

  this.transactions.push({
    type: "adjustment",
    quantity: 0,
    previousStock: this.currentStock,
    newStock: this.currentStock,
    reason: `Released reservation: ${reason}`,
    orderId,
    performedBy,
  });

  await this.save();
  return this;
};

// Method to adjust stock (manual correction)
inventorySchema.methods.adjustStock = async function (
  newQuantity,
  performedBy,
  reason
) {
  const previousStock = this.currentStock;
  const difference = newQuantity - this.currentStock;
  this.currentStock = newQuantity;

  this.transactions.push({
    type: "adjustment",
    quantity: difference,
    previousStock,
    newStock: this.currentStock,
    reason,
    performedBy,
  });

  await this.save();
  return this;
};

// Performance indexes
inventorySchema.index({ product: 1, variantId: 1 });
inventorySchema.index({ sku: 1 }, { unique: true });
inventorySchema.index({ isLowStock: 1 });
inventorySchema.index({ isOutOfStock: 1 });
inventorySchema.index({ "supplier.name": 1 });
inventorySchema.index({ lastRestockedAt: -1 });

export default mongoose.model("Inventory", inventorySchema);
