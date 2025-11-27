import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from './src/models/User.js';
import Vendor from './src/models/Vendor.js';
import VendorAnalytics from './src/models/VendorAnalytics.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

async function populateAnalytics() {
    console.log('📊 Populating Analytics Data...');

    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb+srv://shopping_site:shopping_site123@cluster0.vbrumea.mongodb.net/shopping_site?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Find user by email
        const user = await User.findOne({ email: 'dramaniamir@gmail.com' });
        if (!user) {
            console.error('❌ User dramaniamir@gmail.com not found!');
            return;
        }

        // Find vendor by user ID
        const vendor = await Vendor.findOne({ user: user._id });
        if (!vendor) {
            console.error('❌ No vendor found!');
            return;
        }
        console.log(`✅ Found Vendor: ${vendor.businessName} (${vendor._id})`);

        // Clear existing analytics for this vendor
        await VendorAnalytics.deleteMany({ vendor: vendor._id });
        console.log('🧹 Cleared existing analytics');

        // Generate 30 days of data
        const analyticsData = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);

            // Random data generation
            const orders = Math.floor(Math.random() * 10); // 0-9 orders
            const revenue = orders * (Math.floor(Math.random() * 50000) + 10000); // Random revenue
            const shopViews = Math.floor(Math.random() * 50) + orders * 5; // Views correlated with orders
            const productViews = Math.floor(Math.random() * 100) + shopViews;
            const productClicks = Math.floor(productViews * 0.3);
            const addToCart = Math.floor(productClicks * 0.2);

            analyticsData.push({
                vendor: vendor._id,
                date: date,
                shopViews,
                productViews,
                productClicks,
                addToCartActions: addToCart,
                orders,
                revenue,
                reviewsReceived: Math.floor(Math.random() * 2)
            });
        }

        await VendorAnalytics.insertMany(analyticsData);
        console.log(`✅ Inserted ${analyticsData.length} days of analytics data`);

        // Update vendor totals
        const totalRevenue = analyticsData.reduce((sum, day) => sum + day.revenue, 0);
        const totalOrders = analyticsData.reduce((sum, day) => sum + day.orders, 0);

        vendor.totalRevenue = totalRevenue;
        vendor.totalOrders = totalOrders;
        vendor.netRevenue = totalRevenue * 0.85; // Assuming 15% commission
        vendor.totalCommission = totalRevenue * 0.15;
        await vendor.save();
        console.log('✅ Updated vendor totals');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
}

populateAnalytics();
