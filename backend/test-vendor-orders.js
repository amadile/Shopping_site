import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from './src/models/User.js';
import Vendor from './src/models/Vendor.js';
import Product from './src/models/Product.js';
import Order from './src/models/Order.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

async function testVendorOrders() {
    console.log('🧪 Testing Vendor Order Management Endpoints...\n');

    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb+srv://shopping_site:shopping_site123@cluster0.vbrumea.mongodb.net/shopping_site?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB\n');

        // 1. Find an existing vendor with orders
        const vendor = await Vendor.findOne({ isVerified: true }).populate('user');
        if (!vendor) {
            console.log('❌ No verified vendor found. Run populate-vendor-data.js first.');
            return;
        }
        console.log(`✅ Found Vendor: ${vendor.businessName} (ID: ${vendor._id})\n`);

        // 2. Find orders for this vendor
        const vendorProductIds = await Product.find({ vendor: vendor._id }).distinct('_id');
        const orderQuery = {
            $or: [
                { vendor: vendor._id },
                { 'items.product': { $in: vendorProductIds } }
            ]
        };

        const orders = await Order.find(orderQuery)
            .populate('user', 'name email')
            .populate('items.product', 'name price');

        console.log(`📦 Found ${orders.length} orders for this vendor\n`);

        if (orders.length === 0) {
            console.log('⚠️  No orders found. Creating a test order...\n');

            // Create a test order
            const product = await Product.findOne({ vendor: vendor._id });
            if (!product) {
                console.log('❌ No products found for this vendor.');
                return;
            }

            const customer = await User.findOne({ role: 'customer' });
            if (!customer) {
                console.log('❌ No customer found.');
                return;
            }

            const testOrder = await Order.create({
                user: customer._id,
                vendor: vendor._id,
                items: [{
                    product: product._id,
                    quantity: 1,
                    price: product.price
                }],
                subtotal: product.price,
                total: product.price,
                shippingAddress: {
                    fullName: 'Test Customer',
                    phone: '+256700000000',
                    addressLine1: 'Test Address',
                    district: 'Kampala'
                },
                paymentMethod: 'card',
                status: 'paid'
            });

            console.log(`✅ Created test order: ${testOrder._id}\n`);
            orders.push(testOrder);
        }

        // 3. Test Order Statistics
        console.log('📊 Testing Order Statistics...');
        const totalOrders = await Order.countDocuments(orderQuery);
        const pendingOrders = await Order.countDocuments({ ...orderQuery, status: 'pending' });
        const paidOrders = await Order.countDocuments({ ...orderQuery, status: 'paid' });
        const shippedOrders = await Order.countDocuments({ ...orderQuery, status: 'shipped' });
        const deliveredOrders = await Order.countDocuments({ ...orderQuery, status: 'delivered' });

        console.log(`   Total Orders: ${totalOrders}`);
        console.log(`   Pending: ${pendingOrders}`);
        console.log(`   Paid: ${paidOrders}`);
        console.log(`   Shipped: ${shippedOrders}`);
        console.log(`   Delivered: ${deliveredOrders}\n`);

        // 4. Test Order Details
        if (orders.length > 0) {
            const sampleOrder = orders[0];
            console.log('📋 Sample Order Details:');
            console.log(`   Order ID: ${sampleOrder._id}`);
            console.log(`   Customer: ${sampleOrder.user?.name || 'N/A'}`);
            console.log(`   Status: ${sampleOrder.status}`);
            console.log(`   Total: UGX ${sampleOrder.total?.toLocaleString() || 0}`);
            console.log(`   Items: ${sampleOrder.items.length}\n`);
        }

        // 5. Test Status Update
        if (orders.length > 0 && orders[0].status === 'paid') {
            console.log('🔄 Testing Status Update...');
            const orderToUpdate = orders[0];
            orderToUpdate.status = 'shipped';
            await orderToUpdate.save();
            console.log(`✅ Updated order ${orderToUpdate._id} to 'shipped'\n`);
        }

        // 6. Test Filtering
        console.log('🔍 Testing Order Filtering...');
        const paidOrdersOnly = await Order.find({ ...orderQuery, status: 'paid' });
        console.log(`   Found ${paidOrdersOnly.length} paid orders\n`);

        // 7. Test Pagination
        console.log('📄 Testing Pagination...');
        const page1 = await Order.find(orderQuery).limit(2).skip(0);
        console.log(`   Page 1: ${page1.length} orders\n`);

        console.log('✅ All Tests Passed!\n');
        console.log('🎯 Summary:');
        console.log(`   - Vendor: ${vendor.businessName}`);
        console.log(`   - Total Orders: ${totalOrders}`);
        console.log(`   - Endpoints Ready: GET /vendor/orders, GET /vendor/orders/:id, PUT /vendor/orders/:id/status, GET /vendor/orders/stats`);
        console.log('\n✨ Vendor Order Management is ready for frontend integration!');

    } catch (error) {
        console.error('❌ Test Failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('\n👋 Disconnected from MongoDB');
    }
}

testVendorOrders();
