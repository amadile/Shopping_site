import mongoose from "mongoose";

const disputeSchema = new mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    type: {
      type: String,
      enum: [
        "product_quality",
        "late_delivery",
        "wrong_item",
        "missing_item",
        "damaged_item",
        "refund_request",
        "other",
      ],
      required: true,
    },
    status: {
      type: String,
      enum: ["open", "under_review", "resolved", "closed", "escalated"],
      default: "open",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
    },
    // Customer's dispute details
    customerDescription: {
      type: String,
      required: true,
    },
    customerEvidence: [
      {
        type: {
          type: String,
          enum: ["image", "document", "video"],
        },
        url: String,
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Vendor's response
    vendorResponse: {
      description: String,
      evidence: [
        {
          type: {
            type: String,
            enum: ["image", "document", "video"],
          },
          url: String,
          uploadedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
      respondedAt: Date,
    },
    // Admin handling
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Admin user
    },
    assignedAt: Date,
    // Resolution details
    resolution: {
      decision: {
        type: String,
        enum: [
          "refund_customer",
          "replace_item",
          "partial_refund",
          "favor_vendor",
          "no_action",
        ],
      },
      reason: String,
      refundAmount: Number,
      resolvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Admin user
      },
      resolvedAt: Date,
    },
    // Communication history
    messages: [
      {
        sender: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        senderType: {
          type: String,
          enum: ["customer", "vendor", "admin"],
          required: true,
        },
        message: {
          type: String,
          required: true,
        },
        attachments: [
          {
            type: String, // URLs to attachments
          },
        ],
        timestamp: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Escalation details
    escalation: {
      isEscalated: {
        type: Boolean,
        default: false,
      },
      escalatedAt: Date,
      escalatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      escalationReason: String,
    },
    // Internal notes (only visible to admins)
    internalNotes: [
      {
        note: String,
        addedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        addedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    // Timestamps for SLA tracking
    firstResponseAt: Date,
    closedAt: Date,
  },
  {
    timestamps: true,
  }
);

// Indexes
disputeSchema.index({ order: 1 });
disputeSchema.index({ customer: 1, status: 1 });
disputeSchema.index({ vendor: 1, status: 1 });
disputeSchema.index({ assignedTo: 1, status: 1 });
disputeSchema.index({ status: 1, priority: -1, createdAt: -1 });
disputeSchema.index({ type: 1 });
disputeSchema.index({ createdAt: -1 });

// Virtual for response time
disputeSchema.virtual("responseTimeHours").get(function () {
  if (this.firstResponseAt) {
    return (this.firstResponseAt - this.createdAt) / (1000 * 60 * 60);
  }
  return null;
});

// Virtual for resolution time
disputeSchema.virtual("resolutionTimeHours").get(function () {
  if (this.resolution && this.resolution.resolvedAt) {
    return (this.resolution.resolvedAt - this.createdAt) / (1000 * 60 * 60);
  }
  return null;
});

// Method to add message
disputeSchema.methods.addMessage = async function (
  senderId,
  senderType,
  message,
  attachments = []
) {
  this.messages.push({
    sender: senderId,
    senderType,
    message,
    attachments,
  });

  // Set first response time if this is the first message after dispute creation
  if (!this.firstResponseAt && this.messages.length > 1) {
    this.firstResponseAt = new Date();
  }

  await this.save();
};

// Method to assign to admin
disputeSchema.methods.assignToAdmin = async function (adminId) {
  this.assignedTo = adminId;
  this.assignedAt = new Date();
  this.status = "under_review";
  await this.save();
};

// Method to escalate dispute
disputeSchema.methods.escalate = async function (escalatedBy, reason) {
  this.escalation = {
    isEscalated: true,
    escalatedAt: new Date(),
    escalatedBy,
    escalationReason: reason,
  };
  this.status = "escalated";
  this.priority = "urgent";
  await this.save();
};

// Method to resolve dispute
disputeSchema.methods.resolve = async function (
  decision,
  reason,
  refundAmount,
  resolvedBy
) {
  this.resolution = {
    decision,
    reason,
    refundAmount,
    resolvedBy,
    resolvedAt: new Date(),
  };
  this.status = "resolved";
  await this.save();
};

// Method to close dispute
disputeSchema.methods.close = async function () {
  this.status = "closed";
  this.closedAt = new Date();
  await this.save();
};

// Static method to get dispute statistics
disputeSchema.statics.getDisputeStats = async function (period = "month") {
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
  }

  const stats = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate },
      },
    },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 },
        avgResolutionTime: {
          $avg: {
            $cond: [
              { $ifNull: ["$resolution.resolvedAt", false] },
              {
                $divide: [
                  { $subtract: ["$resolution.resolvedAt", "$createdAt"] },
                  1000 * 60 * 60, // Convert to hours
                ],
              },
              null,
            ],
          },
        },
      },
    },
  ]);

  return stats;
};

// Static method to get disputes by type
disputeSchema.statics.getDisputesByType = async function () {
  return this.aggregate([
    {
      $group: {
        _id: "$type",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);
};

const Dispute = mongoose.model("Dispute", disputeSchema);

export default Dispute;
