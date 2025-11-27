import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import app from "../src/index.js";
import User from "../src/models/User.js";

let mongoServer;

describe("Auth Endpoints", () => {
  beforeAll(async () => {
    console.log("Starting test setup...");
    // Disconnect any existing connection
    if (mongoose.connection.readyState !== 0) {
      console.log("Disconnecting existing connection...");
      await mongoose.disconnect();
    }

    console.log("Starting MongoDB Memory Server...");
    // Start in-memory MongoDB server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    console.log("MongoDB Memory Server started at:", mongoUri);

    // Connect to the in-memory database
    console.log("Connecting to in-memory database...");
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("Connected to in-memory database");
  }, 60000);

  afterEach(async () => {
    // Clean up after each test
    await User.deleteMany({});
  });

  afterAll(async () => {
    console.log("Cleaning up test data...");
    await User.deleteMany({});
    console.log("Closing database connection...");
    await mongoose.connection.close();
    console.log("Stopping MongoDB Memory Server...");
    await mongoServer.stop();
    console.log("Test cleanup completed");
  }, 30000);

  it("should register a new user", async () => {
    console.log("Running registration test...");
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "testuser@example.com",
      password: "password123",
    });
    console.log("Registration response:", res.statusCode, res.body);
    expect(res.statusCode).toEqual(201);
    expect(res.body.message).toMatch(/verify your email/i);
  }, 5000);

  it("should not register with existing email", async () => {
    await User.create({
      name: "Test User",
      email: "testuser@example.com",
      password: "hashed",
      isVerified: true,
    });
    const res = await request(app).post("/api/auth/register").send({
      name: "Test User",
      email: "testuser@example.com",
      password: "password123",
    });
    expect(res.statusCode).toEqual(400);
    expect(res.body.error).toMatch(/already registered/i);
  }, 10000);

  it("should not login unverified user", async () => {
    await User.create({
      name: "Unverified",
      email: "unverified@example.com",
      password: "$2b$10$abcdefghijk",
      isVerified: false,
    });
    const res = await request(app).post("/api/auth/login").send({
      email: "unverified@example.com",
      password: "password123",
    });
    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toMatch(/not verified/i);
  }, 10000);
});
