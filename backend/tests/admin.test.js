import request from "supertest";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import app from "../src/index.js";
import User from "../src/models/User.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

let mongoServer;
let adminToken;
let customerToken;
let customerId;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);

  const hashedPassword = await bcrypt.hash("password123", 10);

  const admin = await User.create({
    name: "Admin",
    email: "admin@example.com",
    password: hashedPassword,
    role: "admin",
    isVerified: true,
  });
  adminToken = jwt.sign({ id: admin._id, role: "admin" }, process.env.JWT_SECRET);

  const customer = await User.create({
    name: "Customer",
    email: "customer@example.com",
    password: hashedPassword,
    role: "customer",
    isVerified: true,
  });
  customerId = customer._id;
  customerToken = jwt.sign(
    { id: customer._id, role: "customer" },
    process.env.JWT_SECRET
  );
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

describe("Admin API", () => {
  describe("GET /api/admin/users", () => {
    it("should get all users for admin", async () => {
      const res = await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("users");
      expect(res.body.users.length).toBeGreaterThan(0);
    });

    it("should deny access to non-admin", async () => {
      await request(app)
        .get("/api/admin/users")
        .set("Authorization", `Bearer ${customerToken}`)
        .expect(403);
    });
  });

  describe("PUT /api/admin/users/:id", () => {
    it("should update user role", async () => {
      const res = await request(app)
        .put(`/api/admin/users/${customerId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ role: "vendor" })
        .expect(200);

      expect(res.body.role).toBe("vendor");
    });
  });

  describe("GET /api/admin/stats", () => {
    it("should get dashboard statistics", async () => {
      const res = await request(app)
        .get("/api/admin/stats")
        .set("Authorization", `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty("totalUsers");
      expect(res.body).toHaveProperty("totalProducts");
      expect(res.body).toHaveProperty("totalOrders");
      expect(res.body).toHaveProperty("totalRevenue");
    });
  });
});