import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import app from "../src/index.js";
import Cart from "../src/models/Cart.js";
import Product from "../src/models/Product.js";
import User from "../src/models/User.js";

let mongoServer;
let userToken = "mock-user-token";
let userId;
let productId;
let mockUserId;

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

describe("Cart API", () => {
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
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  it("should add item to cart", async () => {
    const res = await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 2 });
    expect(res.statusCode).toBe(200);
    // Defensive: handle both populated and unpopulated product field
    const productField = res.body.items[0].product;
    const productIdValue =
      typeof productField === "string" ? productField : productField._id;
    expect(productIdValue).toBe(productId.toString());
    expect(res.body.items[0].quantity).toBe(2);
  });

  it("should get current user's cart", async () => {
    await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1 });
    const res = await request(app)
      .get("/api/cart")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBe(1);
    const productField = res.body.items[0].product;
    const productIdValue =
      typeof productField === "string" ? productField : productField._id;
    expect(productIdValue).toBe(productId.toString());
  });

  it("should update item quantity", async () => {
    await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1 });
    const res = await request(app)
      .put("/api/cart/update")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 5 });
    expect(res.statusCode).toBe(200);
    expect(res.body.items[0].quantity).toBe(5);
  });

  it("should remove item from cart", async () => {
    await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1 });
    const res = await request(app)
      .delete(`/api/cart/remove/${productId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBe(0);
  });

  it("should clear cart", async () => {
    await request(app)
      .post("/api/cart/add")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, quantity: 1 });
    const res = await request(app)
      .delete("/api/cart/clear")
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.items.length).toBe(0);
  });
});
