/**
 * Inventory Service Tests
 * Test suite for inventory management functionality
 */

import mongoose from "mongoose";
import Inventory from "../src/models/Inventory.js";
import Product from "../src/models/Product.js";
import StockHistory from "../src/models/StockHistory.js";
import StockReservation from "../src/models/StockReservation.js";
import User from "../src/models/User.js";
import inventoryService from "../src/services/inventoryService.js";

describe("Inventory Service", () => {
  let testUser;
  let testProduct;
  let testInventory;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      name: "Test User",
      email: "test@example.com",
      password: "hashedpassword",
      role: "admin",
    });

    // Create test product
    testProduct = await Product.create({
      name: "Test Product",
      description: "Test Description",
      price: 100,
      category: "Electronics",
      stock: 50,
      vendor: testUser._id,
      images: [],
    });

    // Create test inventory
    testInventory = await Inventory.create({
      product: testProduct._id,
      sku: "TEST-SKU-001",
      currentStock: 50,
      lowStockThreshold: 10,
      reorderPoint: 5,
    });
  });

  afterAll(async () => {
    // Cleanup
    await User.deleteMany({});
    await Product.deleteMany({});
    await Inventory.deleteMany({});
    await StockReservation.deleteMany({});
    await StockHistory.deleteMany({});
  });

  describe("checkAvailability", () => {
    test("should return available when stock is sufficient", async () => {
      const result = await inventoryService.checkAvailability(
        testProduct._id,
        null,
        10
      );

      expect(result.available).toBe(true);
      expect(result.stock).toBeGreaterThanOrEqual(10);
    });

    test("should return not available when stock is insufficient", async () => {
      const result = await inventoryService.checkAvailability(
        testProduct._id,
        null,
        1000
      );

      expect(result.available).toBe(false);
      expect(result.reason).toBe("Insufficient stock");
    });

    test("should return not available for non-existent product", async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const result = await inventoryService.checkAvailability(fakeId, null, 1);

      expect(result.available).toBe(false);
      expect(result.reason).toBe("Product not found in inventory");
    });
  });

  describe("reserveStock", () => {
    test("should successfully reserve stock", async () => {
      const result = await inventoryService.reserveStock(
        testProduct._id,
        null,
        5,
        testUser._id,
        new mongoose.Types.ObjectId(),
        15
      );

      expect(result.success).toBe(true);
      expect(result.reservation).toBeDefined();
      expect(result.expiresAt).toBeDefined();

      // Verify reservation was created
      const reservation = await StockReservation.findById(result.reservation);
      expect(reservation).toBeDefined();
      expect(reservation.quantity).toBe(5);
      expect(reservation.status).toBe("active");
    });

    test("should fail when insufficient stock", async () => {
      await expect(
        inventoryService.reserveStock(
          testProduct._id,
          null,
          10000,
          testUser._id,
          new mongoose.Types.ObjectId(),
          15
        )
      ).rejects.toThrow("Insufficient stock");
    });
  });

  describe("addStock", () => {
    test("should successfully add stock", async () => {
      const inventory = await Inventory.findOne({ product: testProduct._id });
      const previousStock = inventory.currentStock;

      const result = await inventoryService.addStock(
        testProduct._id,
        null,
        20,
        testUser._id,
        "Test restock"
      );

      expect(result.success).toBe(true);
      expect(result.newStock).toBe(previousStock + 20);

      // Verify history was created
      const history = await StockHistory.findOne({
        product: testProduct._id,
        type: "restock",
      });
      expect(history).toBeDefined();
      expect(history.quantity).toBe(20);
    });
  });

  describe("adjustStock", () => {
    test("should successfully adjust stock", async () => {
      const result = await inventoryService.adjustStock(
        testProduct._id,
        null,
        100,
        testUser._id,
        "Manual adjustment for testing"
      );

      expect(result.success).toBe(true);
      expect(result.newStock).toBe(100);

      // Verify inventory was updated
      const inventory = await Inventory.findOne({ product: testProduct._id });
      expect(inventory.currentStock).toBe(100);
    });
  });

  describe("releaseReservedStock", () => {
    test("should successfully release reservation", async () => {
      // First, create a reservation
      const reserveResult = await inventoryService.reserveStock(
        testProduct._id,
        null,
        5,
        testUser._id,
        new mongoose.Types.ObjectId(),
        15
      );

      // Then release it
      const result = await inventoryService.releaseReservedStock(
        reserveResult.reservation,
        "Test cancellation"
      );

      expect(result.success).toBe(true);

      // Verify reservation status changed
      const reservation = await StockReservation.findById(
        reserveResult.reservation
      );
      expect(reservation.status).toBe("released");
    });
  });

  describe("confirmReservation", () => {
    test("should successfully confirm reservation and deduct stock", async () => {
      const inventory = await Inventory.findOne({ product: testProduct._id });
      const previousStock = inventory.currentStock;

      // Create a reservation
      const reserveResult = await inventoryService.reserveStock(
        testProduct._id,
        null,
        3,
        testUser._id,
        new mongoose.Types.ObjectId(),
        15
      );

      // Confirm it
      const result = await inventoryService.confirmReservation(
        reserveResult.reservation,
        testUser._id
      );

      expect(result.success).toBe(true);
      expect(result.newStock).toBe(previousStock - 3);

      // Verify reservation status
      const reservation = await StockReservation.findById(
        reserveResult.reservation
      );
      expect(reservation.status).toBe("confirmed");
    });
  });

  describe("getLowStockProducts", () => {
    test("should return low stock items", async () => {
      // Create a low stock item
      const lowStockProduct = await Product.create({
        name: "Low Stock Product",
        description: "Test",
        price: 50,
        category: "Test",
        stock: 5,
        vendor: testUser._id,
        images: [],
      });

      await Inventory.create({
        product: lowStockProduct._id,
        sku: "LOW-STOCK-001",
        currentStock: 5,
        lowStockThreshold: 10,
        isLowStock: true,
      });

      const result = await inventoryService.getLowStockProducts(10);

      expect(result.success).toBe(true);
      expect(result.count).toBeGreaterThan(0);
      expect(result.items.length).toBeGreaterThan(0);

      // Cleanup
      await Product.findByIdAndDelete(lowStockProduct._id);
    });
  });

  describe("getStockHistory", () => {
    test("should return stock history", async () => {
      const result = await inventoryService.getStockHistory(
        testProduct._id,
        null,
        10
      );

      expect(result.success).toBe(true);
      expect(Array.isArray(result.history)).toBe(true);
    });
  });

  describe("releaseExpiredReservations", () => {
    test("should release expired reservations", async () => {
      // Create an expired reservation
      const expiredReservation = await StockReservation.create({
        inventory: testInventory._id,
        product: testProduct._id,
        quantity: 2,
        user: testUser._id,
        order: new mongoose.Types.ObjectId(),
        status: "active",
        expiresAt: new Date(Date.now() - 60000), // 1 minute ago
      });

      // Update inventory to reflect reservation
      testInventory.reservedStock += 2;
      await testInventory.save();

      const result = await inventoryService.releaseExpiredReservations();

      expect(result.success).toBe(true);
      expect(result.releasedCount).toBeGreaterThan(0);

      // Verify reservation was released
      const updatedReservation = await StockReservation.findById(
        expiredReservation._id
      );
      expect(updatedReservation.status).toBe("released");
    });
  });
});
