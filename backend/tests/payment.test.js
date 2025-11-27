import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/index.js";
import User from "../src/models/User.js";
import Product from "../src/models/Product.js";
import Cart from "../src/models/Cart.js";
import Order from "../src/models/Order.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

let mongoServer;
let token;
let userId;
let productId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  const hashedPassword = await bcrypt.hash("password123", 10);
  const user = await User.create({
    name: "Test User",
    email: "test@example.com",
    password: hashedPassword,
    role: "customer",
    isVerified: true,
  });
  userId = user._id;
  token = jwt.sign({ id: userId, role: "customer" }, process.env.JWT_SECRET);

  const vendor = await User.create({
    name: "Vendor",
    email: "vendor@example.com",
    password: hashedPassword,
    role: "vendor",
    isVerified: true,
  });

  const product = await Product.create({
    name: "Test Product",
    description: "Test description",
    price: 99.99,
    category: "test",
    stock: 10,
    vendor: vendor._id,
  });
  productId = product._id;
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

afterEach(async () => {
  await Cart.deleteMany({});
  await Order.deleteMany({});
});

describe("Payment API", () => {
  describe("POST /api/payment/create-payment-intent", () => {
    it("should create payment intent from cart", async () => {
      await Cart.create({
        user: userId,
        items: [{ product: productId, quantity: 2 }],
      });

      const res = await request(app)
        .post("/api/payment/create-payment-intent")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(res.body).toHaveProperty("clientSecret");
    });

    it("should return 400 for empty cart", async () => {
      const res = await request(app)
        .post("/api/payment/create-payment-intent")
        .set("Authorization", `Bearer ${token}`)
        .expect(400);

      expect(res.body.error).toBe("Cart is empty");
    });

    it("should require authentication", async () => {
      await request(app)
        .post("/api/payment/create-payment-intent")
        .expect(401);
    });
  });

  describe("POST /api/payment/confirm-payment", () => {
    it("should confirm payment and create order", async () => {
      await Cart.create({
        user: userId,
        items: [{ product: productId, quantity: 1 }],
      });

      const res = await request(app)
        .post("/api/payment/confirm-payment")
        .set("Authorization", `Bearer ${token}`)
        .send({ paymentIntentId: "pi_mock_123" })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty("order");

      const cart = await Cart.findOne({ user: userId });
      expect(cart.items.length).toBe(0);
    });

    it("should require authentication", async () => {
      await request(app)
        .post("/api/payment/confirm-payment")
        .send({ paymentIntentId: "pi_mock_123" })
        .expect(401);
    });
  });
});