import mongoose from "mongoose";

const vendorAnalyticsSchema = new mongoose.Schema({
    vendor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Vendor",
        required: true,
        index: true,
    },
    date: {
        type: Date,
        required: true,
        index: true,
    },
    // Shop metrics
    shopViews: {
        type: Number,
        default: 0,
    },
    uniqueVisitors: {
        type: [String], // Array of user IDs
        default: [],
    },
    // Product metrics
    productViews: {
        type: Number,
        default: 0,
    },
    productClicks: {
        type: Number,
        default: 0,
    },
    // Engagement metrics
    reviewsReceived: {
        type: Number,
        default: 0,
    },
    addToCartActions: {
        type: Number,
        default: 0,
    },
    // Conversion metrics
    orders: {
        type: Number,
        default: 0,
    },
    revenue: {
        type: Number,
        default: 0,
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

// Compound index for efficient queries
vendorAnalyticsSchema.index({ vendor: 1, date: -1 });

// Pre-save hook to update timestamp
vendorAnalyticsSchema.pre("save", function (next) {
    this.updatedAt = Date.now();
    next();
});

// Method to get unique visitor count
vendorAnalyticsSchema.methods.getUniqueVisitorCount = function () {
    return this.uniqueVisitors ? this.uniqueVisitors.length : 0;
};

// Static method to record shop view
vendorAnalyticsSchema.statics.recordShopView = async function (vendorId, userId = null) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await this.findOneAndUpdate(
        { vendor: vendorId, date: today },
        {
            $inc: { shopViews: 1 },
            $addToSet: userId ? { uniqueVisitors: userId.toString() } : {},
        },
        { upsert: true, new: true }
    );

    return analytics;
};

// Static method to record product click
vendorAnalyticsSchema.statics.recordProductClick = async function (vendorId) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const analytics = await this.findOneAndUpdate(
        { vendor: vendorId, date: today },
        { $inc: { productClicks: 1 } },
        { upsert: true, new: true }
    );

    return analytics;
};

// Static method to get analytics for date range
vendorAnalyticsSchema.statics.getAnalytics = async function (vendorId, startDate, endDate) {
    return this.find({
        vendor: vendorId,
        date: { $gte: startDate, $lte: endDate },
    }).sort({ date: -1 });
};

// Static method to get aggregated stats
vendorAnalyticsSchema.statics.getAggregatedStats = async function (vendorId, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    startDate.setHours(0, 0, 0, 0);

    const stats = await this.aggregate([
        {
            $match: {
                vendor: new mongoose.Types.ObjectId(vendorId),
                date: { $gte: startDate },
            },
        },
        {
            $group: {
                _id: null,
                totalShopViews: { $sum: "$shopViews" },
                totalProductClicks: { $sum: "$productClicks" },
                totalReviews: { $sum: "$reviewsReceived" },
                totalAddToCart: { $sum: "$addToCartActions" },
                totalOrders: { $sum: "$orders" },
                totalRevenue: { $sum: "$revenue" },
            },
        },
    ]);

    return stats.length > 0 ? stats[0] : null;
};

const VendorAnalytics = mongoose.model("VendorAnalytics", vendorAnalyticsSchema);

export default VendorAnalytics;
