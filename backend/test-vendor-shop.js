import axios from "axios";
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config();

const API_URL = "http://localhost:5000/api";
let vendorId;
let productId;
let customerToken;
let vendorToken;

// Test Data
const testData = {
    vendor: {
        businessEmail: `shop_vendor_${Date.now()}@test.com`,
        password: "password123",
        businessName: "Shop Test Vendor",
        businessPhone: `256${Date.now().toString().slice(-9)}`,
        district: "Kampala",
        businessType: "individual",
    },
    customer: {
        name: "Shop Customer",
        email: `shop_customer_${Date.now()}@test.com`,
        password: "password123",
    },
    product: {
        name: "Shop Test Product",
        description: "A product for shop testing",
        price: 50000,
        category: "electronics",
        stock: 10,
    },
    review: {
        rating: 5,
        comment: "Great vendor! Fast shipping.",
    }
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
    console.log("VENDOR SHOP FEATURES TEST SUITE");
    console.log("==================================================");

    // 1. Setup: Register Vendor & Create Product
    console.log("\n🧪 Setup: Register Vendor & Create Product");
    let res = await apiCall("POST", "/vendor/register", testData.vendor);
    if (res.status === 201) {
        vendorId = res.data.vendor.id;
        vendorToken = res.data.token;
        console.log("✅ Vendor registered. ID:", vendorId);
        console.log("Response Data:", JSON.stringify(res.data, null, 2));
    } else {
        console.log("❌ Vendor registration failed", res.data);
        return;
    }

    res = await apiCall("POST", "/products", { ...testData.product, vendor: vendorId }, vendorToken);
    if (res.status === 201) {
        productId = res.data._id;
        console.log("✅ Product created");
    } else {
        console.log("❌ Product creation failed", res.data);
        return;
    }

    // 2. Setup: Register Customer
    console.log("\n🧪 Setup: Register Customer");
    res = await apiCall("POST", "/auth/register", testData.customer);
    if (res.status === 201) {
        console.log("✅ Customer registered");
        // Login to get token
        res = await apiCall("POST", "/auth/login", { email: testData.customer.email, password: testData.customer.password });
        customerToken = res.data.token;
        console.log("✅ Customer logged in. Token:", customerToken ? "Present" : "Missing");
        if (!customerToken) console.log("Login Response:", JSON.stringify(res.data, null, 2));
    } else {
        console.log("❌ Customer setup failed", res.data);
        return;
    }

    // 3. Test: Get Public Vendor Profile
    console.log("\n🧪 Test 1: Get Public Vendor Profile");
    res = await apiCall("GET", `/vendor/${vendorId}`);
    if (res.status === 200 && res.data.vendor.businessName === testData.vendor.businessName) {
        console.log("✅ PASS: Vendor profile retrieved");
    } else {
        console.log("❌ FAIL: Get profile failed", res.data);
    }

    // 4. Test: Get Vendor Products
    console.log("\n🧪 Test 2: Get Vendor Products");
    res = await apiCall("GET", `/vendor/${vendorId}/products`);
    if (res.status === 200 && res.data.products.length > 0) {
        console.log("✅ PASS: Vendor products retrieved");
    } else {
        console.log("❌ FAIL: Get products failed", res.data);
    }

    // 5. Test: Add Vendor Review
    console.log("\n🧪 Test 3: Add Vendor Review");
    res = await apiCall("POST", `/vendor/${vendorId}/reviews`, testData.review, customerToken);
    if (res.status === 201) {
        console.log("✅ PASS: Review added");
    } else {
        console.log("❌ FAIL: Add review failed", res.data);
    }

    // 6. Test: Get Vendor Reviews
    console.log("\n🧪 Test 4: Get Vendor Reviews");
    res = await apiCall("GET", `/vendor/${vendorId}/reviews`);
    if (res.status === 200 && res.data.reviews.length > 0 && res.data.reviews[0].comment === testData.review.comment) {
        console.log("✅ PASS: Vendor reviews retrieved");
    } else {
        console.log("❌ FAIL: Get reviews failed", res.data);
    }

    // 7. Test: Verify Vendor Rating Update
    console.log("\n🧪 Test 5: Verify Vendor Rating Update");
    res = await apiCall("GET", `/vendor/${vendorId}`);
    if (res.status === 200 && res.data.vendor.totalReviews === 1 && res.data.vendor.rating === 5) {
        console.log("✅ PASS: Vendor rating updated");
    } else {
        console.log("❌ FAIL: Rating update verification failed", res.data);
    }

    console.log("\n==================================================");
    console.log("TEST SUITE COMPLETE");
    console.log("==================================================");
}

runTests();
