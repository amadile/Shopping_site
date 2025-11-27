import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from './src/models/User.js';
import Vendor from './src/models/Vendor.js';
import Product from './src/models/Product.js';
import Order from './src/models/Order.js';
import Cart from './src/models/Cart.js';
import { calculateOrderCommissions } from './src/services/commissionService.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

async function runTest() {
    console.log('🧪 Starting Commission Calculation Test...');

    try {
        // Connect to MongoDB
        const mongoUri = process.env.MONGO_URI || 'mongodb+srv://shopping_site:shopping_site123@cluster0.vbrumea.mongodb.net/shopping_site?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // 1. Setup Test Data
        const timestamp = Date.now();

        // Create Vendor User
        const vendorUser = await User.create({
            name: `Test Vendor ${timestamp}`,
            email: `vendor${timestamp}@test.com`,
            password: 'password123',
            role: 'vendor',
            isVerified: true
        });
        console.log(`✅ Created Vendor User: ${vendorUser.email}`);

        // Create Vendor Profile
        const vendor = await Vendor.create({
            user: vendorUser._id,
            businessName: `Test Business ${timestamp}`,
            businessEmail: `vendor${timestamp}@test.com`,
            businessPhone: `+256700000000`,
            commissionRate: 10, // 10% commission
            verificationStatus: 'approved',
            isVerified: true
        });
        console.log(`✅ Created Vendor Profile: ${vendor.businessName} (10% Commission)`);

        // Create Product
        const product = await Product.create({
            name: `Test Product ${timestamp}`,
            description: 'Test Description',
            price: 100000, // 100k UGX
            category: 'electronics',
            vendor: vendor._id,
            stock: 10,
            isActive: true
        });
        console.log(`✅ Created Product: ${product.name} (100,000 UGX)`);

        // Create Customer User
        const customer = await User.create({
            name: `Test Customer ${timestamp}`,
            email: `customer${timestamp}@test.com`,
            password: 'password123',
            role: 'customer'
        });
        console.log(`✅ Created Customer: ${customer.email}`);

        // 2. Create Order Manually (Simulating Checkout)
        const order = await Order.create({
            user: customer._id,
            items: [{
                product: product._id,
                quantity: 1,
                price: 100000
            }],
            subtotal: 100000,
            tax: 0,
            total: 100000,
            shippingAddress: {
                fullName: 'Test Customer',
                phone: '+256700000000',
                addressLine1: 'Test Address',
                district: 'Kampala'
            },
            paymentMethod: 'cod',
            status: 'pending'
        });
        console.log(`✅ Created Order: ${order._id}`);

        // 3. Trigger Commission Calculation
        console.log('🔄 Triggering Commission Calculation...');
        const result = await calculateOrderCommissions(order);
        console.log('📊 Calculation Result:', result);

        // 4. Verify Results

        // Check Order
        const updatedOrder = await Order.findById(order._id);
        console.log(`\n🔍 Verification Results:`);
        console.log(`Order Vendor Commission: ${updatedOrder.vendorCommission} (Expected: 10000)`);
        console.log(`Order Platform Commission: ${updatedOrder.platformCommission} (Expected: 10000)`);

        if (updatedOrder.vendorCommission === 10000) {
            console.log('✅ Order Commission Verified');
        } else {
            console.error('❌ Order Commission Mismatch');
        }

        // Check Vendor Stats
        const updatedVendor = await Vendor.findById(vendor._id);
        console.log(`Vendor Total Revenue: ${updatedVendor.totalRevenue} (Expected: 100000)`);
        console.log(`Vendor Total Commission: ${updatedVendor.totalCommission} (Expected: 10000)`);
        console.log(`Vendor Net Revenue: ${updatedVendor.netRevenue} (Expected: 90000)`);
        console.log(`Vendor Pending Payout: ${updatedVendor.pendingPayout} (Expected: 90000)`);

        if (updatedVendor.totalRevenue === 100000 && updatedVendor.totalCommission === 10000) {
            console.log('✅ Vendor Stats Verified');
        } else {
            console.error('❌ Vendor Stats Mismatch');
        }

        // Cleanup
        await Order.deleteMany({ _id: order._id });
        await Product.deleteMany({ _id: product._id });
        await Vendor.deleteMany({ _id: vendor._id });
        await User.deleteMany({ _id: { $in: [vendorUser._id, customer._id] } });
        console.log('\n🧹 Cleanup Complete');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
}

runTest();
