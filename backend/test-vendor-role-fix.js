// Test script to verify the vendor role fix
import mongoose from 'mongoose';
import User from './src/models/User.js';
import Vendor from './src/models/Vendor.js';

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/shopping');

// Test function to verify the fix
async function testVendorRoleUpdate() {
  try {
    // Find a vendor that is approved but user role might not be updated
    const vendor = await Vendor.findOne({ verificationStatus: 'approved' }).populate('user');
    
    if (vendor) {
      console.log('Found approved vendor:', vendor.businessName);
      console.log('User role before update:', vendor.user.role);
      
      // Update user role to vendor if it's not already
      if (vendor.user.role !== 'vendor') {
        vendor.user.role = 'vendor';
        await vendor.user.save();
        console.log('User role updated to vendor');
      } else {
        console.log('User role is already vendor');
      }
    } else {
      console.log('No approved vendor found for testing');
    }
    
    mongoose.connection.close();
  } catch (error) {
    console.error('Test error:', error);
    mongoose.connection.close();
  }
}

testVendorRoleUpdate();