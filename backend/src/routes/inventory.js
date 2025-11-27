import express from "express";
import { logger } from "../config/logger.js";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import Inventory from "../models/Inventory.js";
import Product from "../models/Product.js";
import inventoryService from "../services/inventoryService.js";

const router = express.Router();

/**
 * @swagger
 * /api/inventory/check-availability:
 *   post:
 *     summary: Check stock availability for a product (public)
 *     tags: [Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               productId:
 *                 type: string
 *               variantId:
 *                 type: string
 *               quantity:
 *                 type: integer
 */
router.post("/check-availability", async (req, res) => {
  try {
    const { productId, variantId, quantity = 1 } = req.body;

    if (!productId) {
      return res.status(400).json({ error: "Product ID is required" });
    }

    const result = await inventoryService.checkAvailability(
      productId,
      variantId,
      parseInt(quantity)
    );

    res.json(result);
  } catch (error) {
    logger.error("Error checking availability:", error);
    res.status(500).json({ error: "Failed to check availability" });
  }
});

// All other inventory routes require authentication and admin/vendor roles
router.use(authenticateJWT);
router.use(authorizeRoles("admin", "vendor"));

/**
 * @swagger
 * /api/inventory:
 *   get:
 *     summary: Get all inventory items
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Items per page
 *       - in: query
 *         name: lowStock
 *         schema:
 *           type: boolean
 *         description: Filter low stock items
 *       - in: query
 *         name: outOfStock
 *         schema:
 *           type: boolean
 *         description: Filter out of stock items
 */
router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.lowStock === "true") {
      filter.isLowStock = true;
    }

    if (req.query.outOfStock === "true") {
      filter.isOutOfStock = true;
    }

    // Vendors can only see their own products
    if (req.user.role === "vendor") {
      const vendorProducts = await Product.find({
        vendor: req.user._id,
      }).select("_id");
      filter.product = { $in: vendorProducts.map((p) => p._id) };
    }

    const inventory = await Inventory.find(filter)
      .populate("product", "name images category")
      .populate("lastRestockedBy", "name email")
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Inventory.countDocuments(filter);

    res.json({
      inventory,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalItems: total,
        itemsPerPage: limit,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch inventory", error: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/alerts:
 *   get:
 *     summary: Get inventory alerts (low stock/out of stock)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.get("/alerts", async (req, res) => {
  try {
    const filter = {
      $or: [{ isLowStock: true }, { isOutOfStock: true }],
    };

    // Vendors can only see their own products
    if (req.user.role === "vendor") {
      const vendorProducts = await Product.find({
        vendor: req.user._id,
      }).select("_id");
      filter.product = { $in: vendorProducts.map((p) => p._id) };
    }

    const alerts = await Inventory.find(filter)
      .populate("product", "name images category price")
      .sort({ availableStock: 1 });

    res.json({
      alerts,
      summary: {
        outOfStock: alerts.filter((a) => a.isOutOfStock).length,
        lowStock: alerts.filter((a) => a.isLowStock && !a.isOutOfStock).length,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch alerts", error: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/{id}:
 *   get:
 *     summary: Get inventory details by ID
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id", async (req, res) => {
  try {
    const inventory = await Inventory.findById(req.params.id)
      .populate("product")
      .populate("lastRestockedBy", "name email")
      .populate("transactions.performedBy", "name email");

    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Vendors can only view their own products
    if (req.user.role === "vendor") {
      const product = await Product.findById(inventory.product._id);
      if (product.vendor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    res.json(inventory);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch inventory", error: error.message });
  }
});

/**
 * @swagger
 * /api/inventory:
 *   post:
 *     summary: Create new inventory record
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.post("/", async (req, res) => {
  try {
    const {
      product,
      variantId,
      sku,
      currentStock,
      lowStockThreshold,
      reorderPoint,
      location,
      supplier,
    } = req.body;

    // Verify product exists and user has permission
    const productDoc = await Product.findById(product);
    if (!productDoc) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (
      req.user.role === "vendor" &&
      productDoc.vendor.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Access denied" });
    }

    const inventory = new Inventory({
      product,
      variantId,
      sku,
      currentStock: currentStock || 0,
      lowStockThreshold: lowStockThreshold || 10,
      reorderPoint: reorderPoint || 5,
      location,
      supplier,
      lastRestockedBy: req.user._id,
      lastRestockedAt: new Date(),
    });

    // Add initial transaction
    inventory.transactions.push({
      type: "restock",
      quantity: currentStock || 0,
      previousStock: 0,
      newStock: currentStock || 0,
      reason: "Initial stock",
      performedBy: req.user._id,
    });

    await inventory.save();
    await inventory.populate("product", "name images");

    res.status(201).json(inventory);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "SKU already exists" });
    }
    res
      .status(500)
      .json({ message: "Failed to create inventory", error: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/{id}/restock:
 *   post:
 *     summary: Add stock to inventory
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/restock", async (req, res) => {
  try {
    const { quantity, reason } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: "Quantity must be positive" });
    }

    const inventory = await Inventory.findById(req.params.id).populate(
      "product"
    );

    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Vendors can only restock their own products
    if (req.user.role === "vendor") {
      const product = await Product.findById(inventory.product._id);
      if (product.vendor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    await inventory.addStock(quantity, req.user._id, reason || "Restock");

    res.json({
      message: "Stock added successfully",
      inventory,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to restock", error: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/{id}/adjust:
 *   post:
 *     summary: Adjust inventory stock (manual correction)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.post("/:id/adjust", async (req, res) => {
  try {
    const { newQuantity, reason } = req.body;

    if (newQuantity < 0) {
      return res.status(400).json({ message: "Quantity cannot be negative" });
    }

    if (!reason) {
      return res
        .status(400)
        .json({ message: "Reason is required for stock adjustment" });
    }

    const inventory = await Inventory.findById(req.params.id).populate(
      "product"
    );

    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Vendors can only adjust their own products
    if (req.user.role === "vendor") {
      const product = await Product.findById(inventory.product._id);
      if (product.vendor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    await inventory.adjustStock(newQuantity, req.user._id, reason);

    res.json({
      message: "Stock adjusted successfully",
      inventory,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to adjust stock", error: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/{id}:
 *   put:
 *     summary: Update inventory settings
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.put("/:id", async (req, res) => {
  try {
    const {
      lowStockThreshold,
      reorderPoint,
      maxStockLevel,
      location,
      supplier,
    } = req.body;

    const inventory = await Inventory.findById(req.params.id);

    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Vendors can only update their own products
    if (req.user.role === "vendor") {
      const product = await Product.findById(inventory.product);
      if (product.vendor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    if (lowStockThreshold !== undefined)
      inventory.lowStockThreshold = lowStockThreshold;
    if (reorderPoint !== undefined) inventory.reorderPoint = reorderPoint;
    if (maxStockLevel !== undefined) inventory.maxStockLevel = maxStockLevel;
    if (location) inventory.location = { ...inventory.location, ...location };
    if (supplier) inventory.supplier = { ...inventory.supplier, ...supplier };

    await inventory.save();
    await inventory.populate("product", "name images");

    res.json(inventory);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to update inventory", error: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/{id}/history:
 *   get:
 *     summary: Get stock transaction history
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.get("/:id/history", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const inventory = await Inventory.findById(req.params.id)
      .populate("product", "name")
      .populate("transactions.performedBy", "name email")
      .populate("transactions.orderId", "status");

    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    // Vendors can only view their own products
    if (req.user.role === "vendor") {
      const product = await Product.findById(inventory.product._id);
      if (product.vendor.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Access denied" });
      }
    }

    const transactions = inventory.transactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice((page - 1) * limit, page * limit);

    res.json({
      product: inventory.product,
      currentStock: inventory.currentStock,
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(inventory.transactions.length / limit),
        totalTransactions: inventory.transactions.length,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch history", error: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/{id}:
 *   delete:
 *     summary: Delete inventory record
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.delete("/:id", authorizeRoles("admin"), async (req, res) => {
  try {
    const inventory = await Inventory.findByIdAndDelete(req.params.id);

    if (!inventory) {
      return res.status(404).json({ message: "Inventory item not found" });
    }

    res.json({ message: "Inventory deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to delete inventory", error: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/reserve:
 *   post:
 *     summary: Reserve stock for a pending order
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.post("/reserve", authenticateJWT, async (req, res) => {
  try {
    const {
      productId,
      variantId,
      quantity,
      orderId,
      expiresInMinutes = 15,
    } = req.body;

    if (!productId || !quantity || !orderId) {
      return res.status(400).json({
        error: "Product ID, quantity, and order ID are required",
      });
    }

    const result = await inventoryService.reserveStock(
      productId,
      variantId,
      quantity,
      req.user._id,
      orderId,
      expiresInMinutes
    );

    res.json(result);
  } catch (error) {
    logger.error("Error reserving stock:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/reserve/{reservationId}/release:
 *   post:
 *     summary: Release reserved stock
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/reserve/:reservationId/release",
  authenticateJWT,
  async (req, res) => {
    try {
      const { reservationId } = req.params;
      const { reason = "Order cancelled" } = req.body;

      const result = await inventoryService.releaseReservedStock(
        reservationId,
        reason
      );

      res.json(result);
    } catch (error) {
      logger.error("Error releasing stock:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

// Alias: simpler release route
router.post("/release", authenticateJWT, async (req, res) => {
  try {
    const { reservationId, reason = "Order cancelled" } = req.body;

    if (!reservationId) {
      return res.status(400).json({ error: "Reservation ID is required" });
    }

    const result = await inventoryService.releaseReservedStock(
      reservationId,
      reason
    );

    res.json(result);
  } catch (error) {
    logger.error("Error releasing stock:", error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/reserve/{reservationId}/confirm:
 *   post:
 *     summary: Confirm stock reservation (deduct from inventory)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/reserve/:reservationId/confirm",
  authenticateJWT,
  async (req, res) => {
    try {
      const { reservationId } = req.params;

      const result = await inventoryService.confirmReservation(
        reservationId,
        req.user._id
      );

      res.json(result);
    } catch (error) {
      logger.error("Error confirming reservation:", error);
      res.status(400).json({ error: error.message });
    }
  }
);

// Alias: simpler confirm route
router.post("/confirm", authenticateJWT, async (req, res) => {
  try {
    const { reservationId } = req.body;

    if (!reservationId) {
      return res.status(400).json({ error: "Reservation ID is required" });
    }

    const result = await inventoryService.confirmReservation(
      reservationId,
      req.user._id
    );

    res.json(result);
  } catch (error) {
    logger.error("Error confirming reservation:", error);
    res.status(400).json({ error: error.message });
  }
});

// Alias routes for simpler testing - Add stock
router.post("/add-stock", async (req, res) => {
  try {
    const { productId, quantity, reason } = req.body;

    if (!productId || !quantity) {
      return res
        .status(400)
        .json({ message: "Product ID and quantity required" });
    }

    // Find inventory for product
    const inventory = await Inventory.findOne({ product: productId });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    await inventory.addStock(quantity, req.user._id, reason || "Stock added");

    res.json({
      message: "Stock added successfully",
      inventory,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to add stock", error: error.message });
  }
});

// Alias routes for simpler testing - Adjust stock
router.post("/adjust-stock", async (req, res) => {
  try {
    const { productId, quantity, reason } = req.body;

    if (!productId || quantity === undefined) {
      return res
        .status(400)
        .json({ message: "Product ID and quantity required" });
    }

    if (!reason) {
      return res.status(400).json({ message: "Reason is required" });
    }

    // Find inventory for product
    const inventory = await Inventory.findOne({ product: productId });

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    await inventory.adjustStock(quantity, req.user._id, reason);

    res.json({
      message: "Stock adjusted successfully",
      inventory,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to adjust stock", error: error.message });
  }
});

// Alias route for history by product ID
router.get("/history/:productId", async (req, res) => {
  try {
    const inventory = await Inventory.findOne({ product: req.params.productId })
      .populate("product", "name")
      .populate("transactions.performedBy", "name email");

    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found" });
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;

    const transactions = inventory.transactions
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice((page - 1) * limit, page * limit);

    res.json({
      product: inventory.product,
      currentStock: inventory.currentStock,
      transactions,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(inventory.transactions.length / limit),
        totalTransactions: inventory.transactions.length,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Failed to fetch history", error: error.message });
  }
});

/**
 * @swagger
 * /api/inventory/release-expired:
 *   post:
 *     summary: Release expired reservations (admin only)
 *     tags: [Inventory]
 *     security:
 *       - bearerAuth: []
 */
router.post(
  "/release-expired",
  authenticateJWT,
  authorizeRoles("admin"),
  async (req, res) => {
    try {
      const result = await inventoryService.releaseExpiredReservations();

      res.json(result);
    } catch (error) {
      logger.error("Error releasing expired reservations:", error);
      res.status(500).json({ error: "Failed to release expired reservations" });
    }
  }
);

export default router;
