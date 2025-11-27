import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    required: function () { return !this.vendor; }, // Required if vendor is not present
  },
  vendor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Vendor",
    required: function () { return !this.product; }, // Required if product is not present
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5,
  },
  comment: {
    type: String,
    trim: true,
    maxlength: 1000,
  },
  // Moderation fields
  moderationStatus: {
    type: String,
    enum: ["pending", "approved", "rejected", "flagged"],
    default: "pending",
  },
  moderatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  moderatedAt: {
    type: Date,
  },
  moderationReason: {
    type: String,
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

reviewSchema.pre("save", function (next) {
  this.updatedAt = Date.now();
  next();
});

// Performance indexes for review queries
reviewSchema.index({ product: 1, createdAt: -1 }); // Product reviews sorted by date
reviewSchema.index({ user: 1, createdAt: -1 }); // User's reviews
reviewSchema.index({ product: 1, user: 1 }, { unique: true, partialFilterExpression: { product: { $exists: true } } }); // One review per user per product
reviewSchema.index({ vendor: 1, user: 1 }, { unique: true, partialFilterExpression: { vendor: { $exists: true } } }); // One review per user per vendor
reviewSchema.index({ vendor: 1, moderationStatus: 1, createdAt: -1 }); // Vendor reviews by status and date
reviewSchema.index({ vendor: 1, moderationStatus: 1, rating: -1 }); // Vendor reviews by status and rating
reviewSchema.index({ moderationStatus: 1, createdAt: -1 }); // All reviews by moderation status
reviewSchema.index({ vendor: 1, createdAt: -1 }); // Vendor reviews sorted by date
reviewSchema.index({ rating: 1 }); // Filter by rating
reviewSchema.index({ moderationStatus: 1, createdAt: -1 }); // Moderation queue

const Review = mongoose.model("Review", reviewSchema);
export default Review;
