import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import app from "../src/index.js";
import Cart from "../src/models/Cart.js";
import Order from "../src/models/Order.js";
import Product from "../src/models/Product.js";
import User from "../src/models/User.js";

let mongoServer;
let userToken = "mock-user-token";
let userId;
let productId;
let mockUserId;
let orderId;

// Mock JWT middleware
jest.mock("../src/middleware/auth.js", () => {
  return {
    authenticateJWT: function (req, res, next) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        if (token === userToken) {
          req.user = { _id: mockUserId, role: "customer" };
        }
      }
      next();
    },
    authorizeRoles: function (...roles) {
      return function (req, res, next) {
        if (!req.user) {
          return res.status(401).json({ error: "Authentication required" });
        }
        if (!roles.includes(req.user.role)) {
          return res.status(403).json({ error: "Insufficient permissions" });
        }
        next();
      };
    },
  };
});

describe("Order API", () => {
  beforeAll(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    // Create test user
    const user = new User({
      name: "Test User",
      email: "user@test.com",
      password: "hashedpass",
      role: "customer",
      isVerified: true,
    });
    await user.save();
    userId = user._id;
    mockUserId = user._id;
    // Create test product
    const product = new Product({
      name: "Test Product",
      description: "Test Description",
      price: 10,
      category: "Books",
      stock: 100,
      vendor: userId,
    });
    await product.save();
    productId = product._id;
  });

  afterEach(async () => {
    await Cart.deleteMany({});
    await Order.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  it("should place an order and clear cart", async () => {
    // Add item to cart
    await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 2 });
    // Place order
    const res = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(201);
    expect(res.body.items[0].product.toString()).toBe(productId.toString());
    expect(res.body.items[0].quantity).toBe(2);
    expect(res.body.total).toBe(20);
    orderId = res.body._id;
    // Cart should be empty
    const cartRes = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${userToken}`);
    expect(cartRes.body.items.length).toBe(0);
  });

  it("should get current user's orders", async () => {
    // Add item to cart and place order
    await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1 });
    await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${userToken}`);
    // Get orders
    const res = await request(app)
      .get("/api/orders/my")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].user).toBe(userId.toString());
  });

  it("should get order by ID", async () => {
    // Add item to cart and place order
    await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1 });
    const orderRes = await request(app)
      .post("/api/orders/checkout")
      .set("Authorization", `Bearer ${userToken}`);
    const orderId = orderRes.body._id;
    // Get order by ID
    const res = await request(app)
      .get(`/api/orders/${orderId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body._id).toBe(orderId);
    expect(res.body.user).toBe(userId.toString());
  });
});
