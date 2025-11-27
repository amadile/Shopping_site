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

async function checkAnalytics() {
    console.log('🔍 Checking Analytics Data...');

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
        console.log(`✅ Found User: ${user.email} (${user._id})`);

        // Find vendor by user ID
        const vendor = await Vendor.findOne({ user: user._id });
        if (!vendor) {
            console.error('❌ No vendor found for this user!');
            return;
        }
        console.log(`✅ Found Vendor: ${vendor.businessName} (${vendor._id})`);

        // Check Analytics Count
        const count = await VendorAnalytics.countDocuments({ vendor: vendor._id });
        console.log(`📊 Total Analytics Records: ${count}`);

        if (count > 0) {
            const sample = await VendorAnalytics.findOne({ vendor: vendor._id }).sort({ date: -1 });
            console.log('📝 Latest Record:', JSON.stringify(sample, null, 2));

            // Check Aggregation
            const stats = await VendorAnalytics.getAggregatedStats(vendor._id, 30);
            console.log('📈 Aggregated Stats (30 days):', JSON.stringify(stats, null, 2));
        } else {
            console.log('⚠️ No analytics records found. Population script might have failed or targeted wrong vendor.');
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
}

checkAnalytics();
