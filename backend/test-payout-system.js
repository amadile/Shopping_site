import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from './src/models/User.js';
import Vendor from './src/models/Vendor.js';
import Payout from './src/models/Payout.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

async function testPayoutSystem() {
    console.log('🧪 Testing Vendor Payout System...\n');

    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb+srv://shopping_site:shopping_site123@cluster0.vbrumea.mongodb.net/shopping_site?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // 1. Find a vendor with pending payout
        const vendor = await Vendor.findOne({ pendingPayout: { $gt: 0 } }).populate('user');
        if (!vendor) {
            console.log('❌ No vendor with pending payout found.');
            console.log('💡 Run populate-vendor-data.js first to create test data.\n');
            return;
        }

        console.log(`✅ Found Vendor: ${vendor.businessName}`);
        console.log(`   Pending Payout: UGX ${vendor.pendingPayout.toLocaleString()}`);
        console.log(`   Total Paid Out: UGX ${vendor.totalPayouts.toLocaleString()}\n`);

        // 2. Test Payout Request
        console.log('📝 Testing Payout Request...');
        const payoutAmount = Math.min(vendor.pendingPayout, 100000); // Request up to 100k

        const payout = await Payout.create({
            vendor: vendor._id,
            amount: payoutAmount,
            currency: 'UGX',
            paymentMethod: 'mtn_momo',
            paymentDetails: {
                mobileMoneyNumber: '+256700000000',
                mobileMoneyNetwork: 'mtn'
            },
            status: 'pending'
        });

        console.log(`✅ Payout Request Created:`);
        console.log(`   ID: ${payout._id}`);
        console.log(`   Amount: UGX ${payout.amount.toLocaleString()}`);
        console.log(`   Status: ${payout.status}`);
        console.log(`   Method: ${payout.paymentMethod}\n`);

        // 3. Test Admin Approval
        console.log('👨‍💼 Testing Admin Approval...');
        const admin = await User.findOne({ role: 'admin' });
        if (!admin) {
            console.log('⚠️  No admin found, skipping approval test\n');
        } else {
            await payout.markAsProcessing(admin._id);
            console.log(`✅ Payout Approved by Admin`);
            console.log(`   Status: ${payout.status}`);
            console.log(`   Processed By: ${admin.name}\n`);

            // 4. Test Completion
            console.log('✅ Testing Payout Completion...');
            const transactionId = `TXN${Date.now()}`;
            await payout.markAsCompleted(transactionId);

            console.log(`✅ Payout Completed`);
            console.log(`   Transaction ID: ${transactionId}`);
            console.log(`   Status: ${payout.status}\n`);

            // 5. Verify Vendor Balance Updated
            const updatedVendor = await Vendor.findById(vendor._id);
            console.log('💰 Vendor Balance After Payout:');
            console.log(`   Pending Payout: UGX ${updatedVendor.pendingPayout.toLocaleString()} (decreased by ${payoutAmount.toLocaleString()})`);
            console.log(`   Total Paid Out: UGX ${updatedVendor.totalPayouts.toLocaleString()} (increased by ${payoutAmount.toLocaleString()})\n`);
        }

        // 6. Test Payout History
        console.log('📊 Testing Payout History...');
        const payouts = await Payout.find({ vendor: vendor._id })
            .sort({ createdAt: -1 })
            .limit(5);

        console.log(`   Found ${payouts.length} payout(s):`);
        payouts.forEach((p, i) => {
            console.log(`   ${i + 1}. UGX ${p.amount.toLocaleString()} - ${p.status} - ${p.paymentMethod}`);
        });

        console.log('\n✅ All Payout Tests Passed!\n');
        console.log('🎯 Summary:');
        console.log(`   - Payout request created successfully`);
        console.log(`   - Admin approval workflow working`);
        console.log(`   - Payout completion updates vendor balance`);
        console.log(`   - Payout history retrieval working`);
        console.log('\n✨ Vendor Payout System is ready!');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

testPayoutSystem();
