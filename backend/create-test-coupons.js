/**
 * Create Test Coupons Script
 * Creates sample coupons for testing the coupon system
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Coupon from "./src/models/Coupon.js";
import User from "./src/models/User.js";

dotenv.config();

const testCoupons = [
  {
    code: "SAVE20",
    description: "20% off your entire order",
    discountType: "percentage",
    discountValue: 20,
    minOrderValue: 50,
    maxDiscountAmount: 100,
    expiresAt: new Date("2025-12-31"),
    usageLimit: 100,
    perUserLimit: 3,
    isActive: true,
  },
  {
    code: "FLAT50",
    description: "$50 off orders over $200",
    discountType: "fixed",
    discountValue: 50,
    minOrderValue: 200,
    expiresAt: new Date("2025-12-31"),
    usageLimit: 50,
    perUserLimit: 1,
    isActive: true,
  },
  {
    code: "WELCOME10",
    description: "10% off for new customers",
    discountType: "percentage",
    discountValue: 10,
    minOrderValue: 0,
    maxDiscountAmount: 25,
    expiresAt: new Date("2025-12-31"),
    usageLimit: null, // unlimited
    perUserLimit: 1, // one per user
    isActive: true,
  },
  {
    code: "EXPIRED",
    description: "Expired coupon for testing",
    discountType: "percentage",
    discountValue: 50,
    minOrderValue: 0,
    expiresAt: new Date("2024-01-01"), // expired
    usageLimit: 100,
    perUserLimit: 1,
    isActive: true,
  },
  {
    code: "INACTIVE",
    description: "Inactive coupon for testing",
    discountType: "fixed",
    discountValue: 25,
    minOrderValue: 0,
    expiresAt: new Date("2025-12-31"),
    usageLimit: 100,
    perUserLimit: 1,
    isActive: false, // inactive
  },
];

async function createTestCoupons() {
  try {
    console.log("\n🎟️  Creating Test Coupons...\n");

    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB\n");

    // Find an admin user to set as creator, or use any user
    let adminUser = await User.findOne({ role: "admin" });
    if (!adminUser) {
      console.log("⚠️  No admin user found, looking for any user...");
      adminUser = await User.findOne();
      if (!adminUser) {
        console.error("❌ No users found in database. Please create a user first.");
        process.exit(1);
      }
    }

    console.log(`Using user: ${adminUser.email}\n`);

    // Delete existing test coupons
    const existingCodes = testCoupons.map((c) => c.code);
    await Coupon.deleteMany({ code: { $in: existingCodes } });
    console.log("✓ Cleaned up existing test coupons\n");

    // Create new test coupons
    const created = [];
    for (const couponData of testCoupons) {
      const coupon = new Coupon({
        ...couponData,
        createdBy: adminUser._id,
      });
      await coupon.save();
      created.push(coupon);

      const status = coupon.isActive
        ? new Date() > coupon.expiresAt
          ? "⏰ EXPIRED"
          : "✓ ACTIVE"
        : "❌ INACTIVE";

      console.log(`${status} ${coupon.code}`);
      console.log(
        `   Type: ${
          coupon.discountType === "percentage"
            ? `${coupon.discountValue}%`
            : `$${coupon.discountValue}`
        }`
      );
      console.log(`   Min Order: $${coupon.minOrderValue}`);
      if (coupon.maxDiscountAmount) {
        console.log(`   Max Discount: $${coupon.maxDiscountAmount}`);
      }
      console.log(`   Per User Limit: ${coupon.perUserLimit}`);
      console.log(`   Total Limit: ${coupon.usageLimit || "Unlimited"}`);
      console.log(`   Expires: ${coupon.expiresAt.toLocaleDateString()}`);
      console.log();
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ Test Coupons Created Successfully!\n");

    console.log("📋 TESTING GUIDE:\n");
    console.log("1. SAVE20 - 20% off (min $50, max $100 discount)");
    console.log("   • Add items worth $50+");
    console.log("   • Apply coupon at cart");
    console.log("   • Should see 20% discount (capped at $100)\n");

    console.log("2. FLAT50 - $50 off (min $200)");
    console.log("   • Add items worth $200+");
    console.log("   • Apply coupon");
    console.log("   • Should see exactly $50 discount\n");

    console.log("3. WELCOME10 - 10% off (max $25)");
    console.log("   • No minimum order");
    console.log("   • One per user only");
    console.log("   • Max $25 discount\n");

    console.log("4. EXPIRED - Should fail validation");
    console.log("   • Expired date");
    console.log("   • Error: 'Coupon has expired'\n");

    console.log("5. INACTIVE - Should fail validation");
    console.log("   • Not active");
    console.log("   • Error: 'Coupon is inactive'\n");

    console.log("🧪 FRAUD PREVENTION TESTS:\n");
    console.log("• Try using WELCOME10 twice (should fail on 2nd use)");
    console.log("• Try SAVE20 4 times (should fail on 4th use)");
    console.log(
      "• Try FLAT50 with cart under $200 (should show min requirement)"
    );
    console.log("• Try SAVE20 on $1000 order (discount capped at $100)");
    console.log("• Try applying multiple coupons (only one allowed)");

    console.log("\n" + "=".repeat(60) + "\n");
  } catch (err) {
    console.error("❌ Error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  }
}

createTestCoupons();
