import request from "supertest";
import mongoose from "mongoose";
import app from "../src/index.js";
import User from "../src/models/User.js";
import Vendor from "../src/models/Vendor.js";
import Product from "../src/models/Product.js";
import Order from "../src/models/Order.js";
import Cart from "../src/models/Cart.js";
import Payout from "../src/models/Payout.js";

describe("Vendor System - Backend Features Testing", () => {
  let vendorToken;
  let customerToken;
  let adminToken;
  let vendorUser;
  let customerUser;
  let adminUser;
  let vendorId;
  let productId;
  let orderId;

  beforeAll(async () => {
    // Connect to test database
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/shopping_test");
    }

    // Clean up test data
    await User.deleteMany({ email: { $regex: /^test.*@test\.com$/ } });
    await Vendor.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});
    await Payout.deleteMany({});
  });

  afterAll(async () => {
    // Clean up
    await User.deleteMany({ email: { $regex: /^test.*@test\.com$/ } });
    await Vendor.deleteMany({});
    await Product.deleteMany({});
    await Order.deleteMany({});
    await Cart.deleteMany({});
    await Payout.deleteMany({});
    await mongoose.connection.close();
  });

  describe("1. Vendor Registration", () => {
    test("POST /api/vendor/register - Should register a new vendor", async () => {
      const response = await request(app)
        .post("/api/vendor/register")
        .send({
          businessName: "Test Vendor Store",
          businessEmail: "testvendor@test.com",
          businessPhone: "+256700000000",
          password: "Test123456",
          district: "Kampala",
          zone: "Nakawa",
          landmark: "Near Shell Station",
          businessType: "company",
          tinNumber: "TIN123456",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("vendor");
      expect(response.body.vendor.businessName).toBe("Test Vendor Store");
      expect(response.body.vendor.status).toBe("pending");

      vendorToken = response.body.token;
      vendorUser = await User.findOne({ email: "testvendor@test.com" });
      expect(vendorUser).toBeTruthy();
      expect(vendorUser.role).toBe("vendor");

      vendorId = response.body.vendor.id;
    });

    test("POST /api/vendor/register - Should reject duplicate email", async () => {
      const response = await request(app)
        .post("/api/vendor/register")
        .send({
          businessName: "Duplicate Vendor",
          businessEmail: "testvendor@test.com",
          businessPhone: "+256700000001",
          password: "Test123456",
          district: "Kampala",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("2. Vendor Login", () => {
    test("POST /api/vendor/login - Should login vendor", async () => {
      const response = await request(app)
        .post("/api/vendor/login")
        .send({
          email: "testvendor@test.com",
          password: "Test123456",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("token");
      expect(response.body).toHaveProperty("user");
      expect(response.body.user.role).toBe("vendor");
      expect(response.body.user.vendorProfile).toBeTruthy();

      vendorToken = response.body.token;
    });

    test("POST /api/vendor/login - Should reject invalid credentials", async () => {
      const response = await request(app)
        .post("/api/vendor/login")
        .send({
          email: "testvendor@test.com",
          password: "WrongPassword",
        });

      expect(response.status).toBe(401);
    });
  });

  describe("3. Vendor Profile Management", () => {
    test("GET /api/vendor/profile - Should get vendor profile", async () => {
      const response = await request(app)
        .get("/api/vendor/profile")
        .set("Authorization", `Bearer ${vendorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("vendor");
      expect(response.body.vendor.businessName).toBe("Test Vendor Store");
      expect(response.body.vendor.address.district).toBe("Kampala");
    });

    test("PUT /api/vendor/profile - Should update vendor profile", async () => {
      const response = await request(app)
        .put("/api/vendor/profile")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send({
          description: "Updated store description",
          payoutInfo: {
            preferredMethod: "mtn_momo",
            mobileMoneyNumbers: {
              mtn: "+256700000000",
              airtel: "+256700000001",
            },
          },
        });

      expect(response.status).toBe(200);
      expect(response.body.vendor.description).toBe("Updated store description");
      expect(response.body.vendor.payoutInfo.preferredMethod).toBe("mtn_momo");
    });
  });

  describe("4. Product Creation (Bug Fix #1)", () => {
    test("POST /api/products - Should create product with correct vendor ID", async () => {
      const response = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send({
          name: "Test Product",
          description: "Test product description",
          price: 50000,
          category: "Electronics",
          stock: 100,
          images: ["https://example.com/image.jpg"],
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("vendor");
      expect(response.body.vendor).toBeTruthy();
      
      // Verify vendor is a Vendor document, not User
      const product = await Product.findById(response.body._id).populate("vendor");
      expect(product.vendor).toBeTruthy();
      expect(product.vendor.businessName).toBe("Test Vendor Store");
      
      productId = response.body._id;
    });

    test("GET /api/vendor/products - Should list vendor products", async () => {
      const response = await request(app)
        .get("/api/vendor/products")
        .set("Authorization", `Bearer ${vendorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("products");
      expect(response.body.products.length).toBeGreaterThan(0);
      expect(response.body.products[0].vendor.toString()).toBe(vendorId);
    });
  });

  describe("5. Customer Registration & Order Creation", () => {
    test("POST /api/auth/register - Register customer", async () => {
      const response = await request(app)
        .post("/api/auth/register")
        .send({
          name: "Test Customer",
          email: "testcustomer@test.com",
          password: "Test123456",
          phone: "+256700000002",
        });

      expect(response.status).toBe(201);
      customerToken = response.body.token;
      customerUser = await User.findOne({ email: "testcustomer@test.com" });
    });

    test("POST /api/cart/add - Add product to cart", async () => {
      const response = await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          productId: productId,
          quantity: 2,
        });

      expect(response.status).toBe(200);
    });

    test("POST /api/orders/checkout - Create order", async () => {
      const response = await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: "Test Customer",
            phone: "+256700000002",
            addressLine1: "Test Address",
            city: "Kampala",
            state: "Central",
            zipCode: "00000",
            country: "Uganda",
            district: "Kampala",
            zone: "Nakawa",
            landmark: "Near Shell Station",
          },
          paymentMethod: "cod",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("_id");
      orderId = response.body._id;
    });
  });

  describe("6. Commission Calculation (Bug Fix #2)", () => {
    test("POST /api/payment/cod/confirm - Should calculate commissions on COD confirmation", async () => {
      const response = await request(app)
        .post("/api/payment/cod/confirm")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: orderId,
        });

      expect(response.status).toBe(200);

      // Verify order has commission fields
      const order = await Order.findById(orderId);
      expect(order.vendorCommission).toBeGreaterThan(0);
      expect(order.platformCommission).toBeGreaterThan(0);
      expect(order.vendor).toBeTruthy();
      expect(order.status).toBe("paid");

      // Verify vendor statistics updated
      const vendor = await Vendor.findById(vendorId);
      expect(vendor.totalRevenue).toBeGreaterThan(0);
      expect(vendor.totalCommission).toBeGreaterThan(0);
      expect(vendor.pendingPayout).toBeGreaterThan(0);
      expect(vendor.totalOrders).toBe(1);
    });
  });

  describe("7. Vendor Orders Query (Bug Fix #3)", () => {
    test("GET /api/vendor/dashboard - Should show vendor orders", async () => {
      const response = await request(app)
        .get("/api/vendor/dashboard")
        .set("Authorization", `Bearer ${vendorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.dashboard).toHaveProperty("recentOrders");
      expect(response.body.dashboard.recentOrders.length).toBeGreaterThan(0);
      expect(response.body.dashboard.overview.totalOrders).toBe(1);
      expect(response.body.dashboard.overview.totalRevenue).toBeGreaterThan(0);
    });

    test("GET /api/vendor/orders - Should list vendor orders", async () => {
      const response = await request(app)
        .get("/api/vendor/orders")
        .set("Authorization", `Bearer ${vendorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("orders");
      expect(response.body.orders.length).toBeGreaterThan(0);
      expect(response.body.orders[0]).toHaveProperty("items");
    });

    test("GET /api/vendor/orders?status=paid - Should filter by status", async () => {
      const response = await request(app)
        .get("/api/vendor/orders?status=paid")
        .set("Authorization", `Bearer ${vendorToken}`);

      expect(response.status).toBe(200);
      expect(response.body.orders.every(order => order.status === "paid")).toBe(true);
    });
  });

  describe("8. Vendor Analytics", () => {
    test("GET /api/vendor/analytics - Should return analytics", async () => {
      const response = await request(app)
        .get("/api/vendor/analytics?period=month")
        .set("Authorization", `Bearer ${vendorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("analytics");
      expect(response.body).toHaveProperty("topProducts");
      expect(response.body).toHaveProperty("salesTrend");
    });
  });

  describe("9. Order Status Update", () => {
    test("PUT /api/vendor/orders/:orderId/status - Should update order status", async () => {
      const response = await request(app)
        .put(`/api/vendor/orders/${orderId}/status`)
        .set("Authorization", `Bearer ${vendorToken}`)
        .send({
          status: "shipped",
          trackingNumber: "TRACK123456",
        });

      expect(response.status).toBe(200);
      
      const order = await Order.findById(orderId);
      expect(order.status).toBe("shipped");
      expect(order.tracking.trackingNumber).toBe("TRACK123456");
    });
  });

  describe("10. Mobile Money Payout (Bug Fix #4 & #5)", () => {
    test("POST /api/vendor/payout/request - Should request mobile money payout", async () => {
      // First, approve vendor
      const vendor = await Vendor.findById(vendorId);
      vendor.verificationStatus = "approved";
      vendor.isVerified = true;
      await vendor.save();

      const response = await request(app)
        .post("/api/vendor/payout/request")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send({
          amount: 50000, // Minimum payout
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("payout");
      expect(response.body.payout.paymentMethod).toBe("mtn_momo");
      expect(response.body.payout.status).toBe("pending");
    });

    test("GET /api/vendor/payouts - Should list payout history", async () => {
      const response = await request(app)
        .get("/api/vendor/payouts")
        .set("Authorization", `Bearer ${vendorToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("payouts");
      expect(response.body).toHaveProperty("summary");
    });
  });

  describe("11. Admin Vendor Management", () => {
    beforeAll(async () => {
      // Create admin user
      adminUser = new User({
        name: "Admin User",
        email: "testadmin@test.com",
        password: await require("bcrypt").hash("Test123456", 10),
        role: "admin",
      });
      await adminUser.save();

      const loginResponse = await request(app)
        .post("/api/auth/login")
        .send({
          email: "testadmin@test.com",
          password: "Test123456",
        });
      adminToken = loginResponse.body.token;
    });

    test("GET /api/admin/vendors - Should list all vendors", async () => {
      const response = await request(app)
        .get("/api/admin/vendors")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("vendors");
      expect(response.body.vendors.length).toBeGreaterThan(0);
    });

    test("GET /api/admin/vendors/pending - Should list pending vendors", async () => {
      const response = await request(app)
        .get("/api/admin/vendors/pending")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("vendors");
    });

    test("PUT /api/admin/vendors/:vendorId/verify - Should approve vendor", async () => {
      const response = await request(app)
        .put(`/api/admin/vendors/${vendorId}/verify`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          status: "approved",
          reason: "All documents verified",
        });

      expect(response.status).toBe(200);
      
      const vendor = await Vendor.findById(vendorId);
      expect(vendor.verificationStatus).toBe("approved");
      expect(vendor.isVerified).toBe(true);
    });

    test("PUT /api/admin/vendors/:vendorId/commission - Should update commission rate", async () => {
      const response = await request(app)
        .put(`/api/admin/vendors/${vendorId}/commission`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          commissionRate: 12,
        });

      expect(response.status).toBe(200);
      
      const vendor = await Vendor.findById(vendorId);
      expect(vendor.commissionRate).toBe(12);
    });
  });

  describe("12. Admin Payout Management", () => {
    test("GET /api/payout/admin/pending - Should list pending payouts", async () => {
      const response = await request(app)
        .get("/api/payout/admin/pending")
        .set("Authorization", `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("payouts");
    });

    test("PUT /api/payout/admin/:payoutId/process - Should process payout", async () => {
      const payout = await Payout.findOne({ vendor: vendorId });
      if (payout) {
        const response = await request(app)
          .put(`/api/payout/admin/${payout._id}/process`)
          .set("Authorization", `Bearer ${adminToken}`);

        expect(response.status).toBe(200);
        expect(response.body.payout.status).toBe("processing");
      }
    });
  });

  describe("13. Integration Test - Complete Flow", () => {
    test("Complete vendor workflow", async () => {
      // 1. Vendor creates product
      const productResponse = await request(app)
        .post("/api/products")
        .set("Authorization", `Bearer ${vendorToken}`)
        .send({
          name: "Integration Test Product",
          description: "Testing complete flow",
          price: 100000,
          category: "Test",
          stock: 50,
        });

      expect(productResponse.status).toBe(201);
      const newProductId = productResponse.body._id;

      // 2. Customer adds to cart
      await request(app)
        .post("/api/cart/add")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          productId: newProductId,
          quantity: 1,
        });

      // 3. Customer creates order
      const orderResponse = await request(app)
        .post("/api/orders/checkout")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          shippingAddress: {
            fullName: "Test Customer",
            phone: "+256700000002",
            addressLine1: "Test Address",
            city: "Kampala",
            district: "Kampala",
            zone: "Nakawa",
          },
          paymentMethod: "mtn_momo",
        });

      expect(orderResponse.status).toBe(201);
      const newOrderId = orderResponse.body._id;

      // 4. Confirm payment (mobile money)
      const paymentResponse = await request(app)
        .post("/api/payment/mobile-money/initiate")
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          orderId: newOrderId,
          phoneNumber: "+256700000002",
          network: "mtn",
        });

      expect(paymentResponse.status).toBe(200);

      // 5. Verify commissions calculated
      const order = await Order.findById(newOrderId);
      expect(order.vendorCommission).toBeGreaterThan(0);
      expect(order.vendor).toBeTruthy();

      // 6. Vendor sees order
      const vendorOrders = await request(app)
        .get("/api/vendor/orders")
        .set("Authorization", `Bearer ${vendorToken}`);

      expect(vendorOrders.body.orders.some(o => o._id === newOrderId)).toBe(true);
    });
  });
});

