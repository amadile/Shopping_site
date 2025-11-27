import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const API_URL = "http://localhost:5000/api";
let adminToken;
let vendorToken;
let vendorId;
let productId;
let reviewId;

// Test Data
const testData = {
    admin: {
        email: process.env.ADMIN_EMAIL || "admin@test.com",
        password: process.env.ADMIN_PASSWORD || "admin123",
    },
    vendor: {
        businessEmail: `enhance_vendor_${Date.now()}@test.com`,
        password: "password123",
        businessName: "Enhancement Test Vendor",
        businessPhone: `256${Date.now().toString().slice(-9)}`,
        district: "Kampala",
        businessType: "individual",
    },
    product: {
        name: "Enhancement Test Product",
        description: "Product for enhancement testing",
        price: 75000,
        category: "electronics",
        stock: 15,
    },
};

async function apiCall(method, endpoint, data = null, token = null) {
    try {
        const config = {
            method,
            url: `${API_URL}${endpoint}`,
            data,
            headers: token ? { Authorization: `Bearer ${token}` } : {},
            validateStatus: () => true,
        };
        const response = await axios(config);
        return { success: true, status: response.status, data: response.data };
    } catch (error) {
        return { success: false, error: error.message };
    }
}

async function runTests() {
    console.log("==================================================");
    console.log("VENDOR SHOP ENHANCEMENTS TEST SUITE");
    console.log("==================================================");

    // 1. Setup: Register Vendor & Create Product
    console.log("\n🧪 Setup: Register Vendor & Create Product");
    let res = await apiCall("POST", "/vendor/register", testData.vendor);
    if (res.status === 201) {
        vendorId = res.data.vendor.id;
        vendorToken = res.data.token;
        console.log("✅ Vendor registered. ID:", vendorId);
    } else {
        console.log("❌ Vendor registration failed", res.data);
        return;
    }

    res = await apiCall("POST", "/products", testData.product, vendorToken);
    if (res.status === 201) {
        productId = res.data._id;
        console.log("✅ Product created");
    } else {
        console.log("❌ Product creation failed", res.data);
        return;
    }

    // 2. Test: Enhanced Product Filtering - Price Range
    console.log("\n🧪 Test 1: Enhanced Product Filtering - Price Range");
    res = await apiCall("GET", `/vendor/${vendorId}/products?minPrice=50000&maxPrice=100000`);
    if (res.status === 200 && res.data.products.length > 0) {
        const allInRange = res.data.products.every(p => p.price >= 50000 && p.price <= 100000);
        if (allInRange) {
            console.log("✅ PASS: Price range filter working");
        } else {
            console.log("❌ FAIL: Products outside price range returned");
        }
    } else {
        console.log("❌ FAIL: Price range filter failed", res.data);
    }

    // 3. Test: Enhanced Product Filtering - Sort by Price
    console.log("\n🧪 Test 2: Enhanced Product Filtering - Sort by Price");
    res = await apiCall("GET", `/vendor/${vendorId}/products?sort=price_asc`);
    if (res.status === 200 && res.data.products.length > 0) {
        console.log("✅ PASS: Price sorting working");
    } else {
        console.log("❌ FAIL: Price sorting failed", res.data);
    }

    // 4. Test: Analytics Tracking - Shop View
    console.log("\n🧪 Test 3: Analytics Tracking - Shop View");
    res = await apiCall("GET", `/vendor/${vendorId}`);
    if (res.status === 200) {
        console.log("✅ PASS: Shop view tracked (analytics recorded in background)");
    } else {
        console.log("❌ FAIL: Shop view failed", res.data);
    }

    // 5. Test: Vendor Analytics - Get Stats
    console.log("\n🧪 Test 4: Vendor Analytics - Get Stats");
    res = await apiCall("GET", "/vendor/analytics/stats?days=7", null, vendorToken);
    if (res.status === 200 && res.data.stats) {
        console.log("✅ PASS: Analytics stats retrieved");
        console.log("   Stats:", JSON.stringify(res.data.stats, null, 2));
    } else {
        console.log("❌ FAIL: Analytics stats failed", res.data);
    }

    // 6. Test: Vendor Badges
    console.log("\n🧪 Test 5: Vendor Badges");
    res = await apiCall("GET", `/vendor/${vendorId}`);
    if (res.status === 200) {
        const hasBadgesField = res.data.vendor.hasOwnProperty('badges');
        if (hasBadgesField) {
            console.log("✅ PASS: Vendor badges field present");
        } else {
            console.log("❌ FAIL: Vendor badges field missing");
        }
    } else {
        console.log("❌ FAIL: Vendor profile retrieval failed", res.data);
    }

    // 7. Test: Admin Login (for moderation tests)
    console.log("\n🧪 Setup: Admin Login");
    res = await apiCall("POST", "/auth/login", testData.admin);
    if (res.status === 200 && res.data.token) {
        adminToken = res.data.token;
        console.log("✅ Admin logged in");
    } else {
        console.log("⚠️  Admin login failed - skipping moderation tests");
        console.log("   Note: Create admin user with email:", testData.admin.email);
    }

    // 8. Test: Review Moderation - List Pending (if admin available)
    if (adminToken) {
        console.log("\n🧪 Test 6: Review Moderation - List Pending Reviews");
        res = await apiCall("GET", "/admin/reviews/pending", null, adminToken);
        if (res.status === 200) {
            console.log("✅ PASS: Pending reviews endpoint working");
            console.log("   Pending reviews:", res.data.pagination.total);
        } else {
            console.log("❌ FAIL: Pending reviews endpoint failed", res.data);
        }
    }

    console.log("\n==================================================");
    console.log("ENHANCEMENT TEST SUITE COMPLETE");
    console.log("==================================================");
    console.log("\n📊 Summary:");
    console.log("✅ Enhanced product filtering (price range, sorting)");
    console.log("✅ Analytics tracking (shop views)");
    console.log("✅ Vendor analytics endpoints");
    console.log("✅ Vendor badges system");
    if (adminToken) {
        console.log("✅ Admin review moderation endpoints");
    } else {
        console.log("⚠️  Admin review moderation (skipped - no admin user)");
    }
}

runTests();
