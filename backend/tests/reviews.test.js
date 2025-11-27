import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import app from "../src/index.js";
import Product from "../src/models/Product.js";
import Review from "../src/models/Review.js";
import User from "../src/models/User.js";

let mongoServer;
let userToken = "mock-user-token";
let userId;
let productId;
let mockUserId;
let reviewId;

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

describe("Review API", () => {
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
    await Review.deleteMany({});
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Product.deleteMany({});
    await mongoose.connection.close();
    await mongoServer.stop();
  });

  it("should add a review and update product rating", async () => {
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, rating: 5, comment: "Great product!" });
    expect(res.statusCode).toBe(201);
    expect(res.body.product).toBe(productId.toString());
    expect(res.body.rating).toBe(5);
    // Check product rating
    const productRes = await Product.findById(productId);
    expect(productRes.rating).toBe(5);
    expect(productRes.reviewCount).toBe(1);
    reviewId = res.body._id;
  });

  it("should not allow duplicate review by same user", async () => {
    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, rating: 4, comment: "Nice!" });
    const res = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, rating: 3, comment: "Second review" });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/already reviewed/);
  });

  it("should get reviews for a product", async () => {
    await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, rating: 5, comment: "Great!" });
    const res = await request(app).get(`/api/reviews/${productId}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].product).toBe(productId.toString());
  });

  it("should delete a review and update product rating", async () => {
    const reviewRes = await request(app)
      .post("/api/reviews")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ productId, rating: 5, comment: "Delete me" });
    const reviewId = reviewRes.body._id;
    const res = await request(app)
      .delete(`/api/reviews/${reviewId}`)
      .set("Authorization", `Bearer ${userToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.message).toMatch(/deleted/);
    // Check product rating
    const productRes = await Product.findById(productId);
    expect(productRes.rating).toBe(0);
    expect(productRes.reviewCount).toBe(0);
  });
});
