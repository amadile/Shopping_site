it("should delete a product successfully", async () => {
  const product = await Product.create({
    name: "Delete Me",
    description: "To be deleted",
    category: "Electronics",
    price: 50,
    stock: 2,
    vendor: mockVendorId,
  });
  const res = await request(app)
    .delete(`/api/products/${product._id}`)
    .set("Authorization", `Bearer ${adminToken}`);
  expect(res.statusCode).toBe(200);
  expect(res.body.message).toMatch(/deleted/i);
  const found = await Product.findById(product._id);
  expect(found).toBeNull();
});
it("should update a product with valid data", async () => {
  const product = await Product.create({
    name: "Old Name",
    description: "Old description",
    category: "Electronics",
    price: 100,
    stock: 5,
    vendor: mockVendorId,
  });
  const updateData = {
    name: "Updated Name",
    description: "Updated description",
    price: 150,
  };
  const res = await request(app)
    .put(`/api/products/${product._id}`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send(updateData);
  expect(res.statusCode).toBe(200);
  expect(res.body.product.name).toBe(updateData.name);
  expect(res.body.product.description).toBe(updateData.description);
  expect(res.body.product.price).toBe(updateData.price);
});
it("should create a product with valid data", async () => {
  const productData = {
    name: "New Product",
    description: "A valid product",
    category: "Electronics",
    price: 199.99,
    stock: 10,
    vendor: mockVendorId,
  };
  const res = await request(app)
    .post("/api/products")
    .set("Authorization", `Bearer ${adminToken}`)
    .send(productData);
  expect(res.statusCode).toBe(201);
  expect(res.body.product).toMatchObject(productData);
  expect(res.body.product).toHaveProperty("_id");
});
jest.setTimeout(60000);

// ✅ Move mock to top level
jest.mock("../src/middleware/auth.js", () => ({
  authenticateJWT: (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.substring(7);
      if (token === "mock-vendor-token") {
        req.user = { _id: "mockVendorId", role: "vendor" };
      } else if (token === "mock-admin-token") {
        req.user = { _id: "mockAdminId", role: "admin" };
      } else if (token === "other-token") {
        req.user = { _id: "mockOtherId", role: "vendor" };
      }
    }
    next();
  },
  authorizeRoles: (...roles) => {
    return (req, res, next) => next();
  },
}));

import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import request from "supertest";
import app from "../src/index.js";
import Product from "../src/models/Product.js";
import User from "../src/models/User.js";

let mockVendorId, mockAdminId, mockOtherId;
let vendorToken = "mock-vendor-token";
let adminToken = "mock-admin-token";
let mongoServer;

beforeAll(async () => {
  console.log("Starting product test setup...");
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }

  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();

  await mongoose.connect(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  const vendor = new User({
    name: "Test Vendor",
    email: "vendor@test.com",
    password: "hashedpass",
    role: "vendor",
    isVerified: true,
  });
  await vendor.save();
  mockVendorId = vendor._id.toString();

  const admin = new User({
    name: "Test Admin",
    email: "admin@test.com",
    password: "hashedpass",
    role: "admin",
    isVerified: true,
  });
  await admin.save();
  mockAdminId = admin._id.toString();
});

afterAll(async () => {
  await User.deleteMany({});
  await mongoose.connection.close();
  await mongoServer.stop();
});

describe("Product API", () => {
  it("should return paginated and sorted product list", async () => {
    await Product.create([
      {
        name: "A",
        description: "desc",
        category: "Cat",
        price: 10,
        stock: 1,
        vendor: mockVendorId,
      },
      {
        name: "B",
        description: "desc",
        category: "Cat",
        price: 20,
        stock: 2,
        vendor: mockVendorId,
      },
      {
        name: "C",
        description: "desc",
        category: "Cat",
        price: 30,
        stock: 3,
        vendor: mockVendorId,
      },
      {
        name: "D",
        description: "desc",
        category: "Cat",
        price: 40,
        stock: 4,
        vendor: mockVendorId,
      },
    ]);
    // Page 1, size 2, sort by price descending
    const res = await request(app)
      .get("/api/products?page=1&limit=2&sort=price:desc")
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.products).toHaveLength(2);
    expect(res.body.products[0].price).toBe(40);
    expect(res.body.products[1].price).toBe(30);
    expect(res.body.total).toBeGreaterThanOrEqual(4);
  });
  afterEach(async () => {
    await Product.deleteMany({});
  });

  it("should search products by text", async () => {
    await Product.create([
      {
        name: "iPhone",
        description: "Smart phone",
        category: "Electronics",
        price: 1000,
        stock: 5,
        vendor: mockVendorId,
      },
      {
        name: "Android",
        description: "Mobile device",
        category: "Electronics",
        price: 800,
        stock: 10,
        vendor: mockVendorId,
      },
    ]);
    const res = await request(app).get("/api/products?search=phone");
    expect(res.statusCode).toEqual(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toEqual("iPhone");
  });

  it("should filter products by category", async () => {
    await Product.create([
      {
        name: "Phone",
        description: "Smart phone",
        category: "Electronics",
        price: 500,
        stock: 5,
        vendor: mockVendorId,
      },
      {
        name: "Shirt",
        description: "Cotton shirt",
        category: "Clothing",
        price: 50,
        stock: 10,
        vendor: mockVendorId,
      },
    ]);
    const res = await request(app).get("/api/products?category=Electronics");
    expect(res.statusCode).toEqual(200);
    expect(res.body.products).toHaveLength(1);
    expect(res.body.products[0].name).toEqual("Phone");
  });

  it("should forbid image upload by non-owner non-admin", async () => {
    const other = new User({
      name: "Other User",
      email: "other@test.com",
      password: "hashedpass",
      role: "vendor",
      isVerified: true,
    });
    await other.save();
    mockOtherId = other._id.toString();

    const product = new Product({
      name: "Other's Product",
      description: "Should not allow upload",
      price: 50,
      category: "Test",
      stock: 5,
      vendor: mockVendorId,
    });
    await product.save();

    const imageBuffer = Buffer.from([0xff, 0xd8, 0xff, 0xdb]);
    const res = await request(app)
      .post(`/api/upload/${product._id}/image`)
      .set("Authorization", `Bearer other-token`)
      .attach("image", imageBuffer, "test.jpg");

    expect(res.statusCode).toEqual(403);
    expect(res.body.error).toMatch(/Forbidden/);
  });
});

describe("POST /api/products validation", () => {
  it("should return 400 if required fields are missing", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "", price: "", description: "" });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 400 if price is not a number", async () => {
    const res = await request(app)
      .post("/api/products")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test", price: "not-a-number", description: "desc" });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("PUT /api/products/:id validation", () => {
  it("should return 400 if updating with invalid price", async () => {
    const product = await Product.create({
      name: "Test",
      price: 10,
      description: "desc",
      category: "Misc",
      stock: 5,
      vendor: mockVendorId,
    });
    const res = await request(app)
      .put(`/api/products/${product._id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ price: "invalid" });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty("error");
  });
});

describe("Product API - Non-existent ID", () => {
  const fakeId = "507f1f77bcf86cd799439011";

  it("should return 404 for GET /api/products/:id with non-existent ID", async () => {
    const res = await request(app)
      .get(`/api/products/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 404 for PUT /api/products/:id with non-existent ID", async () => {
    const res = await request(app)
      .put(`/api/products/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Updated", price: 100 });
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error");
  });

  it("should return 404 for DELETE /api/products/:id with non-existent ID", async () => {
    const res = await request(app)
      .delete(`/api/products/${fakeId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(404);
    expect(res.body).toHaveProperty("error");
  });
});
