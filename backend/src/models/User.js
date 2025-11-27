import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ["customer", "admin", "vendor"],
      default: "customer",
    },
    isVerified: { type: Boolean, default: false },
    pendingPayout: { type: Number, default: 0 },
    totalPayouts: { type: Number, default: 0 },
    commissionRate: { type: Number, default: 15 },
    verificationToken: { type: String },
    resetPasswordToken: { type: String },
    resetPasswordExpires: { type: Date },
    refreshTokens: [{ type: String }],
    shippingAddresses: [
      {
        fullName: { type: String, required: true },
        addressLine1: { type: String, required: true },
        addressLine2: { type: String },
        city: { type: String, required: true },
        state: { type: String, required: true },
        zipCode: { type: String, required: true },
        country: { type: String, required: true, default: "USA" },
        phone: { type: String },
        isDefault: { type: Boolean, default: false },
      },
    ],
  },
  { timestamps: true }
);

// Performance indexes for user queries
userSchema.index({ email: 1 }); // Already enforced by unique, but explicit
userSchema.index({ role: 1 }); // Filter by role (admin, vendor, customer)
userSchema.index({ pendingPayout: 1 }); // Index for pending payout queries
userSchema.index({ totalPayouts: 1 }); // Index for total payouts
userSchema.index({ commissionRate: 1 }); // Index for commission queries
userSchema.index({ verificationToken: 1 }, { sparse: true }); // Email verification lookup (sparse - only indexed if present)
userSchema.index({ resetPasswordToken: 1 }, { sparse: true }); // Password reset lookup (sparse - only indexed if present)
userSchema.index({ resetPasswordExpires: 1 }, { expireAfterSeconds: 0 }); // TTL index - auto-delete expired reset tokens
userSchema.index({ refreshTokens: 1 }); // Token validation

export default mongoose.model("User", userSchema);
