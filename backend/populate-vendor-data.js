import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import User from './src/models/User.js';
import Vendor from './src/models/Vendor.js';
import Product from './src/models/Product.js';
import Order from './src/models/Order.js';
import { calculateOrderCommissions } from './src/services/commissionService.js';

// Setup environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '.env') });

async function populateData() {
    console.log('🌱 Populating Vendor Data...');

    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb+srv://shopping_site:shopping_site123@cluster0.vbrumea.mongodb.net/shopping_site?retryWrites=true&w=majority&appName=Cluster0';
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB');

        // Target Vendor ID (from previous check)
        const vendorId = '6924ced01aa5e8fac4cfd98d';
        const vendor = await Vendor.findById(vendorId);

        if (!vendor) {
            console.error('❌ Vendor not found!');
            return;
        }
        console.log(`✅ Found Vendor: ${vendor.businessName}`);

        // 1. Create a Product
        const product = await Product.create({
            name: 'Premium Wireless Headphones',
            description: 'High-quality noise cancelling headphones with 30h battery life.',
            price: 250000,
            category: 'electronics',
            vendor: vendor._id,
            stock: 50,
            isActive: true,
            images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=500&q=80']
        });
        console.log(`✅ Created Product: ${product.name}`);

        // 2. Create a Customer
        const timestamp = Date.now();
        const customer = await User.create({
            name: `Shopper ${timestamp}`,
            email: `shopper${timestamp}@test.com`,
            password: 'password123',
            role: 'customer'
        });
        console.log(`✅ Created Customer: ${customer.email}`);

        // 3. Place an Order
        const order = await Order.create({
            user: customer._id,
            items: [{
                product: product._id,
                quantity: 2,
                price: 250000
            }],
            subtotal: 500000,
            tax: 0,
            total: 500000,
            shippingAddress: {
                fullName: 'Test Shopper',
                phone: '+256700000000',
                addressLine1: 'Kampala Road',
                district: 'Kampala'
            },
            paymentMethod: 'card',
            status: 'paid' // Paid status
        });
        console.log(`✅ Created Order: ${order._id}`);

        // 4. Calculate Commission
        await calculateOrderCommissions(order);
        console.log('✅ Calculated Commissions');

        console.log('\n🎉 Data Population Complete!');
        console.log('You can now verify:');
        console.log(`1. Vendor Shop Page: http://localhost:3001/shop/${vendorId}`);
        console.log('   - Should show "Premium Wireless Headphones"');
        console.log('2. Vendor Dashboard: http://localhost:3001/vendor');
        console.log('   - Should show Total Revenue: UGX 500,000');
        console.log('   - Should show Commission: UGX 50,000 (assuming 10%)');

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected');
    }
}

populateData();
