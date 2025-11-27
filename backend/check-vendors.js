import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from './src/models/User.js';
import Vendor from './src/models/Vendor.js';

dotenv.config();

async function checkVendors() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✓ Connected to MongoDB\n');

        // Find all vendors
        const vendors = await Vendor.find().populate('user', 'email name role');

        console.log(`Found ${vendors.length} vendor(s):\n`);

        vendors.forEach((vendor, index) => {
            console.log(`${index + 1}. ${vendor.businessName}`);
            console.log(`   ID: ${vendor._id}`);
            console.log(`   Email: ${vendor.user?.email || vendor.businessEmail}`);
            console.log(`   Status: ${vendor.verificationStatus}`);
            console.log(`   Approved: ${vendor.isVerified ? 'Yes' : 'No'}`);
            console.log('');
        });

        if (vendors.length === 0) {
            console.log('⚠️  No vendors found in database');
            console.log('\nTo create a test vendor, you can:');
            console.log('1. Register through the frontend at /vendor/register');
            console.log('2. Or use the API:');
            console.log('   POST http://localhost:5000/api/vendor/register');
            console.log('   Body: { businessName, businessEmail, businessPhone, password, district, businessType }');
        } else {
            console.log('📋 To get a vendor token for testing:');
            console.log(`node get-vendor-token.js <vendor-email> <password>`);
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await mongoose.disconnect();
    }
}

checkVendors();
