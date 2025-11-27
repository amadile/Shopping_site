import express from "express";
import { body, query, validationResult } from "express-validator";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";

const router = express.Router();

// Get all products with filtering and pagination
router.get(
  "/",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("category").optional().isString(),
    query("minPrice").optional().isFloat({ min: 0 }),
    query("maxPrice").optional().isFloat({ min: 0 }),
    query("search").optional().isString(),
    query("vendor").optional().isMongoId(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        page = 1,
        limit = 10,
        category,
        minPrice,
        maxPrice,
        search,
        vendor,
      } = req.query;

      const query = { isActive: true };

      if (category) query.category = category;
      if (vendor) query.vendor = vendor;
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
      }
      if (search) {
        query.$text = { $search: search };
      }

      const products = await Product.find(query)
        .populate("vendor", "name email")
        .sort({ createdAt: -1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .exec();

      const total = await Product.countDocuments(query);

      res.json({
        products,
        totalPages: Math.ceil(total / limit),
        currentPage: page,
        total,
      });
    } catch (err) {
      console.error("Get products error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate(
      "vendor",
      "name email"
    );

    if (!product || !product.isActive) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    console.error("Get product error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Create product (Vendor/Admin only)
router.post(
  "/",
  authenticateJWT,
  authorizeRoles("vendor", "admin"),
  [
    body("name").notEmpty().trim(),
    body("description").notEmpty().trim(),
    body("price").isFloat({ min: 0 }),
    body("category").notEmpty().trim(),
    body("stock").isInt({ min: 0 }),
    body("images").optional().isArray(),
    body("tags").optional().isArray(),
    body("variants").optional().isArray(),
    body("hasVariants").optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      // Get vendor document from user
      // For vendors, find the Vendor document linked to this user
      // For admins, allow them to specify vendor or use their own if they're also a vendor
      let vendorId = req.body.vendor; // Allow admin to specify vendor

      if (!vendorId) {
        // If no vendor specified, find vendor linked to current user
        const vendor = await Vendor.findOne({ user: req.user._id });

        if (!vendor) {
          return res.status(404).json({
            error: "Vendor profile not found. Please complete your vendor registration first."
          });
        }
        vendorId = vendor._id;
      }

      const productData = {
        ...req.body,
        vendor: vendorId,
      };

      // Set hasVariants flag if variants array provided
      if (productData.variants && productData.variants.length > 0) {
        productData.hasVariants = true;
      }

      const product = new Product(productData);
      await product.save();

      await product.populate("vendor", "businessName businessEmail");
      res.status(201).json(product);
    } catch (err) {
      console.error("Create product error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Update product (Vendor/Admin only)
router.put(
  "/:id",
  authenticateJWT,
  authorizeRoles("vendor", "admin"),
  [
    body("name").optional().notEmpty().trim(),
    body("description").optional().notEmpty().trim(),
    body("price").optional().isFloat({ min: 0 }),
    body("category").optional().notEmpty().trim(),
    body("stock").optional().isInt({ min: 0 }),
    body("images").optional().isArray(),
    body("tags").optional().isArray(),
    body("isActive").optional().isBoolean(),
    body("variants").optional().isArray(),
    body("hasVariants").optional().isBoolean(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Check if user owns the product or is admin
      // For vendors, check if their vendor profile matches product vendor
      if (req.user.role !== "admin") {
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor || vendor._id.toString() !== product.vendor.toString()) {
          return res.status(403).json({ error: "Forbidden: You can only update your own products" });
        }
      }

      Object.assign(product, req.body);

      // Update hasVariants flag
      if (product.variants && product.variants.length > 0) {
        product.hasVariants = true;
      } else {
        product.hasVariants = false;
      }

      await product.save();

      await product.populate("vendor", "businessName businessEmail");
      res.json(product);
    } catch (err) {
      console.error("Update product error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Delete product (Vendor/Admin only)
router.delete(
  "/:id",
  authenticateJWT,
  authorizeRoles("vendor", "admin"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);

      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Check if user owns the product or is admin
      if (req.user.role !== "admin") {
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor || vendor._id.toString() !== product.vendor.toString()) {
          return res.status(403).json({ error: "Forbidden: You can only delete your own products" });
        }
      }

      await Product.findByIdAndDelete(req.params.id);
      res.json({ message: "Product deleted successfully" });
    } catch (err) {
      console.error("Delete product error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get vendor's products
router.get(
  "/vendor/my-products",
  authenticateJWT,
  authorizeRoles("vendor", "admin"),
  async (req, res) => {
    try {
      const products = await Product.find({ vendor: req.user._id }).sort({
        createdAt: -1,
      });

      res.json(products);
    } catch (err) {
      console.error("Get vendor products error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Add variant to product (Vendor/Admin only)
router.post(
  "/:id/variants",
  authenticateJWT,
  authorizeRoles("vendor", "admin"),
  [
    body("sku").notEmpty().trim(),
    body("size").optional().trim(),
    body("color").optional().trim(),
    body("material").optional().trim(),
    body("style").optional().trim(),
    body("price").optional().isFloat({ min: 0 }),
    body("stock").isInt({ min: 0 }),
    body("images").optional().isArray(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Check ownership
      if (
        product.vendor.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Check if SKU already exists
      const skuExists = product.variants.some((v) => v.sku === req.body.sku);
      if (skuExists) {
        return res
          .status(400)
          .json({ error: "SKU already exists for this product" });
      }

      product.variants.push(req.body);
      product.hasVariants = true;
      await product.save();

      res.status(201).json(product);
    } catch (err) {
      console.error("Add variant error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Update variant (Vendor/Admin only)
router.put(
  "/:productId/variants/:variantId",
  authenticateJWT,
  authorizeRoles("vendor", "admin"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Check ownership
      if (
        product.vendor.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const variant = product.variants.id(req.params.variantId);
      if (!variant) {
        return res.status(404).json({ error: "Variant not found" });
      }

      Object.assign(variant, req.body);
      await product.save();

      res.json(product);
    } catch (err) {
      console.error("Update variant error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Delete variant (Vendor/Admin only)
router.delete(
  "/:productId/variants/:variantId",
  authenticateJWT,
  authorizeRoles("vendor", "admin"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.productId);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      // Check ownership
      if (
        product.vendor.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }

      product.variants.pull(req.params.variantId);

      // Update hasVariants flag
      if (product.variants.length === 0) {
        product.hasVariants = false;
      }

      await product.save();

      res.json({ message: "Variant deleted successfully", product });
    } catch (err) {
      console.error("Delete variant error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
