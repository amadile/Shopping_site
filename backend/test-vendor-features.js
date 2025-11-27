import "dotenv/config";
/**
 * Vendor Features Test Runner
 * 
 * This script tests all vendor features one by one
 * Run with: node test-vendor-features.js
 */

import mongoose from "mongoose";
import axios from "axios";
import User from "./src/models/User.js";
import Vendor from "./src/models/Vendor.js";
import Product from "./src/models/Product.js";
import Order from "./src/models/Order.js";
import Cart from "./src/models/Cart.js";
import Payout from "./src/models/Payout.js";

const BASE_URL = process.env.API_URL || "http://localhost:5000/api";
let vendorToken, customerToken, adminToken;
let vendorId, productId, orderId, payoutId;

// Generate unique test data
const timestamp = Date.now();
const testData = {
  vendor: {
    businessName: "Test Vendor Store",
    businessEmail: `vendor${timestamp}@test.com`,
    businessPhone: `+256700${timestamp.toString().slice(-6)}`,
    password: "Test123456",
    district: "Kampala",
    zone: "Nakawa",
    businessType: "company",
  },
  customer: {
    name: "Test Customer",
    email: `customer${timestamp}@test.com`,
    password: "Test123456",
    phone: `+256700${(timestamp + 1).toString().slice(-6)}`,
  },
  admin: {
    name: "Admin User",
    email: `admin${timestamp}@test.com`,
    password: "Test123456",
  },
};

// Cleanup function
async function cleanupTestData() {
  try {
    if (mongoose.connection.readyState === 0) {
      console.log("Connecting to MongoDB...", process.env.MONGODB_URI ? "URI found" : "URI missing");
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shopping_test");
      console.log("Connected to MongoDB");
    }

    // Clean up test data
    await User.deleteMany({ email: { $regex: /@test\.com$/ } });
    await Vendor.deleteMany({ businessEmail: { $regex: /@test\.com$/ } });
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});
    await Payout.deleteMany({});

    console.log("🧹 Cleaned up test data");
  } catch (error) {
    console.log("⚠️  Cleanup warning:", error.message);
  }
}

// Helper function to make API calls
async function apiCall(method, endpoint, data = null, token = null) {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        "Content-Type": "application/json",
      },
    };

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    if (data) {
      config.data = data;
    }

    const response = await axios(config);
    return { success: true, data: response.data, status: response.status };
  } catch (error) {
    return {
      success: false,
      error: error.response?.data || error.message,
      status: error.response?.status || 500,
    };
  }
}

// Test functions
async function test0_AdminSetup() {
  console.log("\n🧪 Test 0: Admin Setup");
  console.log("=".repeat(50));

  // Try to login first
  let result = await apiCall("POST", "/auth/login", {
    email: testData.admin.email,
    password: testData.admin.password,
  });

  if (!result.success) {
    // Register if login fails
    console.log("   Admin not found, registering...");
    result = await apiCall("POST", "/auth/register", {
      ...testData.admin,
      role: "admin"
    });

    if (result.success) {
      // Login after registration
      result = await apiCall("POST", "/auth/login", {
        email: testData.admin.email,
        password: testData.admin.password,
      });
    }
  }

  if (result.success && result.status === 200) {
    adminToken = result.data.token;
    console.log("✅ PASS: Admin logged in");
    return true;
  } else {
    console.log("❌ FAIL: Admin setup failed");
    console.log(`   Error: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function test1_VendorRegistration() {
  console.log("\n🧪 Test 1: Vendor Registration");
  console.log("=".repeat(50));

  const result = await apiCall("POST", "/vendor/register", testData.vendor);

  if (result.success && result.status === 201) {
    vendorToken = result.data.token;
    vendorId = result.data.vendor.id;
    console.log("✅ PASS: Vendor registered successfully");
    console.log(`   Vendor ID: ${vendorId}`);
    console.log(`   Status: ${result.data.vendor.status}`);
    console.log(`   Email: ${testData.vendor.businessEmail}`);
    return true;
  } else {
    // If vendor already exists, try to login instead
    const errorMsg = JSON.stringify(result.error);
    if (errorMsg.includes("already exists")) {
      console.log("   ⚠️  Vendor already exists, attempting login...");
      const loginResult = await apiCall("POST", "/vendor/login", {
        email: testData.vendor.businessEmail,
        password: testData.vendor.password,
      });

      if (loginResult.success) {
        vendorToken = loginResult.data.token;
        vendorId = loginResult.data.user.vendorProfile.id;
        console.log("✅ PASS: Using existing vendor (logged in)");
        return true;
      }
    }

    console.log("❌ FAIL: Vendor registration failed");
    console.log(`   Error: ${errorMsg}`);
    return false;
  }
}

async function test2_VendorLogin() {
  console.log("\n🧪 Test 2: Vendor Login");
  console.log("=".repeat(50));

  // Skip if we already have a token from registration
  if (vendorToken) {
    console.log("✅ PASS: Already logged in from registration");
    return true;
  }

  const result = await apiCall("POST", "/vendor/login", {
    email: testData.vendor.businessEmail,
    password: testData.vendor.password,
  });

  if (result.success && result.status === 200) {
    vendorToken = result.data.token;
    if (!vendorId) {
      vendorId = result.data.user.vendorProfile?.id;
    }
    console.log("✅ PASS: Vendor login successful");
    console.log(`   Role: ${result.data.user.role}`);
    return true;
  } else {
    console.log("❌ FAIL: Vendor login failed");
    console.log(`   Error: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function test3_GetVendorProfile() {
  console.log("\n🧪 Test 3: Get Vendor Profile");
  console.log("=".repeat(50));

  const result = await apiCall("GET", "/vendor/profile", null, vendorToken);

  if (result.success && result.status === 200) {
    console.log("✅ PASS: Profile retrieved");
    console.log(`   Business: ${result.data.vendor.businessName}`);
    console.log(`   District: ${result.data.vendor.address?.district}`);
    return true;
  } else {
    console.log("❌ FAIL: Failed to get profile");
    console.log(`   Error: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function test4_UpdateVendorProfile() {
  console.log("\n🧪 Test 4: Update Vendor Profile");
  console.log("=".repeat(50));

  const result = await apiCall(
    "PUT",
    "/vendor/profile",
    {
      description: "Updated store description",
      payoutInfo: {
        preferredMethod: "mtn_momo",
        mobileMoneyNumbers: {
          mtn: "+256700000000",
          airtel: "+256700000001",
        },
      },
    },
    vendorToken
  );

  if (result.success && result.status === 200) {
    console.log("✅ PASS: Profile updated");
    console.log(`   Payment Method: ${result.data.vendor.payoutInfo?.preferredMethod}`);
    return true;
  } else {
    console.log("❌ FAIL: Failed to update profile");
    console.log(`   Error: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function test5_CreateProduct() {
  console.log("\n🧪 Test 5: Create Product (Bug Fix #1)");
  console.log("=".repeat(50));

  const result = await apiCall(
    "POST",
    "/products",
    {
      name: "Test Product",
      description: "Test product description",
      price: 50000,
      category: "Electronics",
      stock: 100,
    },
    vendorToken
  );

  if (result.success && result.status === 201) {
    productId = result.data._id;
    console.log("✅ PASS: Product created");
    console.log(`   Product ID: ${productId}`);
    console.log(`   Vendor: ${result.data.vendor?.businessName || result.data.vendor}`);

    // Verify vendor is Vendor document, not User
    if (result.data.vendor?.businessName) {
      console.log("   ✅ Vendor is correctly linked (Vendor document)");
    } else {
      console.log("   ⚠️  Warning: Vendor might not be populated correctly");
    }
    return true;
  } else {
    console.log("❌ FAIL: Product creation failed");
    console.log(`   Error: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function test6_ListVendorProducts() {
  console.log("\n🧪 Test 6: List Vendor Products");
  console.log("=".repeat(50));

  const result = await apiCall("GET", "/vendor/products", null, vendorToken);

  if (result.success && result.status === 200) {
    console.log("✅ PASS: Products listed");
    console.log(`   Count: ${result.data.products?.length || 0}`);
    if (result.data.products?.length > 0) {
      console.log(`   First product vendor: ${result.data.products[0].vendor}`);
    }
    return true;
  } else {
    console.log("❌ FAIL: Failed to list products");
    console.log(`   Error: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function test7_RegisterCustomer() {
  console.log("\n🧪 Test 7: Register Customer");
  console.log("=".repeat(50));

  const result = await apiCall("POST", "/auth/register", testData.customer);

  if (result.success && result.status === 201) {
    console.log("✅ PASS: Customer registered");

    // Auto-verify customer for testing (if email not configured, user is auto-verified)
    // Otherwise, manually verify the user via Admin API

    // Use Admin API to verify if auto-verify failed
    if (adminToken) {
      try {
        // Find user by email
        const usersResult = await apiCall("GET", `/admin/users?role=customer&limit=100`, null, adminToken);
        if (usersResult.success) {
          const user = usersResult.data.users.find(u => u.email === testData.customer.email);
          if (user) {
            await apiCall("PUT", `/admin/users/${user._id}`, { isVerified: true }, adminToken);
            console.log("   ✅ Customer verified via Admin API");
          } else {
            console.log("   ⚠️  Customer not found in admin list");
          }
        } else {
          console.log("   ⚠️  Failed to list users as admin");
        }
      } catch (e) {
        console.log("   ⚠️  Admin verification failed:", e.message);
      }
    }

    // Customer registration doesn't return token, need to login
    const loginResult = await apiCall("POST", "/auth/login", {
      email: testData.customer.email,
      password: testData.customer.password,
    });

    if (loginResult.success && loginResult.status === 200) {
      customerToken = loginResult.data.token;
      console.log("   ✅ Customer logged in");
      return true;
    } else {
      console.log("   ⚠️  Customer registered but login failed");
      console.log(`   Login Error: ${JSON.stringify(loginResult.error)}`);
      return false;
    }
  } else {
    console.log("❌ FAIL: Customer registration failed");
    console.log(`   Error: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function test8_AddToCart() {
  console.log("\n🧪 Test 8: Add Product to Cart");
  console.log("=".repeat(50));

  const result = await apiCall(
    "POST",
    "/cart/add",
    {
      productId: productId,
      quantity: 2,
    },
    customerToken
  );

  if (result.success && result.status === 200) {
    console.log("✅ PASS: Product added to cart");
    return true;
  } else {
    console.log("❌ FAIL: Failed to add to cart");
    console.log(`   Error: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function test9_CreateOrder() {
  console.log("\n🧪 Test 9: Create Order");
  console.log("=".repeat(50));

  const result = await apiCall(
    "POST",
    "/orders/checkout",
    {
      shippingAddress: {
        fullName: "Test Customer",
        phone: "+256700000002",
        addressLine1: "Test Address",
        city: "Kampala",
        district: "Kampala",
        zone: "Nakawa",
        country: "Uganda",
      },
      paymentMethod: "cod",
    },
    customerToken
  );

  if (result.success && result.status === 201) {
    orderId = result.data._id;
    console.log("✅ PASS: Order created");
    console.log(`   Order ID: ${orderId}`);
    console.log(`   Status: ${result.data.status}`);
    return true;
  } else {
    console.log("❌ FAIL: Order creation failed");
    console.log(`   Error: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function test10_CommissionCalculation() {
  console.log("\n🧪 Test 10: Commission Calculation (Bug Fix #2)");
  console.log("=".repeat(50));

  const result = await apiCall(
    "POST",
    "/payment/cod/confirm",
    {
      orderId: orderId,
    },
    customerToken
  );

  if (result.success && result.status === 200) {
    console.log("✅ PASS: COD confirmed");

    // Check order details
    const orderResult = await apiCall("GET", `/orders/${orderId}`, null, customerToken);
    if (orderResult.success) {
      const order = orderResult.data;
      console.log(`   Order Status: ${order.status}`);
      console.log(`   Vendor Commission: ${order.vendorCommission || 0}`);
      console.log(`   Platform Commission: ${order.platformCommission || 0}`);
      console.log(`   Vendor ID: ${order.vendor || "Not set"}`);

      if (order.vendorCommission > 0 && order.vendor) {
        console.log("   ✅ Commissions calculated correctly");
        return true;
      } else {
        console.log("   ⚠️  Warning: Commissions might not be calculated");
        return false;
      }
    }
    return true;
  } else {
    console.log("❌ FAIL: COD confirmation failed");
    console.log(`   Error: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function test11_VendorDashboard() {
  console.log("\n🧪 Test 11: Vendor Dashboard (Bug Fix #3)");
  console.log("=".repeat(50));

  const result = await apiCall("GET", "/vendor/dashboard", null, vendorToken);

  if (result.success && result.status === 200) {
    const dashboard = result.data.dashboard;
    console.log("✅ PASS: Dashboard retrieved");
    console.log(`   Total Orders: ${dashboard.overview?.totalOrders || 0}`);
    console.log(`   Total Revenue: ${dashboard.overview?.totalRevenue || 0}`);
    console.log(`   Recent Orders: ${dashboard.recentOrders?.length || 0}`);

    if (dashboard.recentOrders?.length > 0) {
      console.log("   ✅ Vendor can see their orders");
      return true;
    } else {
      console.log("   ⚠️  Warning: No orders found (might be query issue)");
      return false;
    }
  } else {
    console.log("❌ FAIL: Failed to get dashboard");
    console.log(`   Error: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function test12_ListVendorOrders() {
  console.log("\n🧪 Test 12: List Vendor Orders (Bug Fix #3)");
  console.log("=".repeat(50));

  const result = await apiCall("GET", "/vendor/orders", null, vendorToken);

  if (result.success && result.status === 200) {
    console.log("✅ PASS: Orders listed");
    console.log(`   Order Count: ${result.data.orders?.length || 0}`);

    if (result.data.orders?.length > 0) {
      console.log("   ✅ Vendor can see their orders");
      return true;
    } else {
      console.log("   ⚠️  Warning: No orders found");
      return false;
    }
  } else {
    console.log("❌ FAIL: Failed to list orders");
    console.log(`   Error: ${JSON.stringify(result.error)}`);
    return false;
  }
}

async function test13_MobileMoneyPayout() {
  console.log("\n🧪 Test 13: Mobile Money Payout Request (Bug Fix #4 & #5)");
  console.log("=".repeat(50));

  // First approve vendor
  await apiCall(
    "PUT",
    `/admin/vendors/${vendorId}/verify`,
    { status: "approved" },
    adminToken
  );

  const result = await apiCall(
    "POST",
    "/vendor/payout/request",
    {
      amount: 50000,
    },
    vendorToken
  );

  if (result.success && result.status === 201) {
    payoutId = result.data.payout.id;
    console.log("✅ PASS: Payout requested");
    console.log(`   Payment Method: ${result.data.payout.paymentMethod}`);
    console.log(`   Status: ${result.data.payout.status}`);

    if (result.data.payout.paymentMethod === "mtn_momo" || result.data.payout.paymentMethod === "airtel_money") {
      console.log("   ✅ Mobile money payout supported");
      return true;
    } else {
      console.log("   ⚠️  Warning: Not using mobile money");
      return false;
    }
  } else {
    console.log("❌ FAIL: Payout request failed");
    console.log(`   Error: ${JSON.stringify(result.error)}`);
    return false;
  }
}

// Main test runner
async function runAllTests() {
  console.log("\n" + "=".repeat(50));
  console.log("VENDOR FEATURES TEST SUITE");
  console.log("=".repeat(50));

  // Cleanup before starting
  await cleanupTestData();

  const results = {
    passed: 0,
    failed: 0,
    total: 0,
  };

  const tests = [
    { name: "Admin Setup", fn: test0_AdminSetup },
    { name: "Vendor Registration", fn: test1_VendorRegistration },
    { name: "Vendor Login", fn: test2_VendorLogin },
    { name: "Get Vendor Profile", fn: test3_GetVendorProfile },
    { name: "Update Vendor Profile", fn: test4_UpdateVendorProfile },
    { name: "Create Product", fn: test5_CreateProduct },
    { name: "List Vendor Products", fn: test6_ListVendorProducts },
    { name: "Register Customer", fn: test7_RegisterCustomer },
    { name: "Add to Cart", fn: test8_AddToCart },
    { name: "Create Order", fn: test9_CreateOrder },
    { name: "Commission Calculation", fn: test10_CommissionCalculation },
    { name: "Vendor Dashboard", fn: test11_VendorDashboard },
    { name: "List Vendor Orders", fn: test12_ListVendorOrders },
  ];

  // Note: Mobile money payout test requires admin token
  // You can add admin creation if needed

  for (const test of tests) {
    results.total++;
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      console.log(`\n❌ ERROR in ${test.name}:`, error.message);
      results.failed++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("TEST SUMMARY");
  console.log("=".repeat(50));
  console.log(`Total Tests: ${results.total}`);
  console.log(`✅ Passed: ${results.passed}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`Success Rate: ${((results.passed / results.total) * 100).toFixed(1)}%`);
  console.log("=".repeat(50) + "\n");

  // Cleanup after tests
  await cleanupTestData();

  // Close database connection
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
}

// Run tests
runAllTests().catch(async (error) => {
  console.error("Test suite error:", error);
  await cleanupTestData();
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
  process.exit(1);
});

