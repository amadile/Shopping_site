import mongoose from "mongoose";

const payoutSchema = new mongoose.Schema(
  {
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "completed", "failed", "cancelled"],
      default: "pending",
    },
    paymentMethod: {
      type: String,
      enum: ["bank", "paypal", "stripe", "mtn_momo", "airtel_money"],
      required: true,
    },
    paymentDetails: {
      transactionId: String,
      accountNumber: String, // Last 4 digits only
      accountHolderName: String,
      paypalEmail: String,
      // Mobile money fields for Uganda
      mobileMoneyNumber: String,
      mobileMoneyNetwork: String, // "mtn" or "airtel"
    },
    requestedDate: {
      type: Date,
      default: Date.now,
    },
    processedDate: Date,
    completedDate: Date,
    failureReason: String,
    notes: String,
    // Orders included in this payout
    orders: [
      {
        orderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Order",
        },
        amount: Number,
        commission: Number,
        netAmount: Number,
      },
    ],
    // Admin who processed the payout
    processedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
payoutSchema.index({ vendor: 1, status: 1 });
payoutSchema.index({ status: 1, requestedDate: -1 });
payoutSchema.index({ createdAt: -1 });

// Static method to calculate total payouts for a vendor
payoutSchema.statics.getVendorPayoutSummary = async function (vendorId) {
  const result = await this.aggregate([
    {
      $match: {
        vendor: new mongoose.Types.ObjectId(vendorId),
      },
    },
    {
      $group: {
        _id: "$status",
        totalAmount: { $sum: "$amount" },
        count: { $sum: 1 },
      },
    },
  ]);

  return result.reduce((acc, curr) => {
    acc[curr._id] = {
      amount: curr.totalAmount,
      count: curr.count,
    };
    return acc;
  }, {});
};

// Static method to get pending payouts
payoutSchema.statics.getPendingPayouts = function (limit = 50) {
  return this.find({ status: "pending" })
    .sort({ requestedDate: 1 })
    .limit(limit)
    .populate("vendor", "businessName businessEmail payoutInfo")
    .populate("processedBy", "name email");
};

// Method to mark as processing
payoutSchema.methods.markAsProcessing = async function (adminId) {
  this.status = "processing";
  this.processedDate = new Date();
  this.processedBy = adminId;
  await this.save();
};

// Method to mark as completed
payoutSchema.methods.markAsCompleted = async function (transactionId) {
  this.status = "completed";
  this.completedDate = new Date();
  this.paymentDetails.transactionId = transactionId;
  await this.save();

  // Update vendor payout balance
  const Vendor = mongoose.model("Vendor");
  await Vendor.findByIdAndUpdate(this.vendor, {
    $inc: {
      pendingPayout: -this.amount,
      totalPayouts: this.amount,
    },
    lastPayoutDate: new Date(),
  });
};

// Method to mark as failed
payoutSchema.methods.markAsFailed = async function (reason) {
  this.status = "failed";
  this.failureReason = reason;
  await this.save();
};

const Payout = mongoose.model("Payout", payoutSchema);

export default Payout;
