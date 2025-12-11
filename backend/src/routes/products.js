import express from "express";
import { body, query, validationResult } from "express-validator";
import { authenticateJWT, authorizeRoles } from "../middleware/auth.js";
import Product from "../models/Product.js";
import Vendor from "../models/Vendor.js";
import { logger } from "../config/logger.js";

const router = express.Router();

// Advanced search with filters, sorting, and pagination
router.get(
  "/search",
  [
    query("q").optional().isString().trim(),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("category").optional().isString(),
    query("minPrice").optional().isFloat({ min: 0 }),
    query("maxPrice").optional().isFloat({ min: 0 }),
    query("vendor").optional().isMongoId(),
    query("inStock").optional().isBoolean(),
    query("featured").optional().isBoolean(),
    query("sortBy").optional().isIn(['price', 'createdAt', 'name', 'rating', 'sales']),
    query("sortOrder").optional().isIn(['asc', 'desc']),
    query("tags").optional().isString(), // Comma-separated tags
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        q = '',
        page = 1,
        limit = 20,
        category,
        minPrice,
        maxPrice,
        vendor,
        inStock,
        featured,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        tags,
      } = req.query;

      // Build query
      const query = { isActive: true };

      // Text search
      if (q && q.trim()) {
        query.$or = [
          { name: { $regex: q, $options: 'i' } },
          { description: { $regex: q, $options: 'i' } },
          { category: { $regex: q, $options: 'i' } },
          { tags: { $in: [new RegExp(q, 'i')] } }
        ];
      }

      // Category filter
      if (category) {
        query.category = { $regex: category, $options: 'i' };
      }

      // Vendor filter
      if (vendor) {
        query.vendor = vendor;
      }

      // Price range filter
      if (minPrice || maxPrice) {
        query.price = {};
        if (minPrice) query.price.$gte = parseFloat(minPrice);
        if (maxPrice) query.price.$lte = parseFloat(maxPrice);
      }

      // Stock filter
      if (inStock === 'true' || inStock === true) {
        query.stock = { $gt: 0 };
      }

      // Featured filter
      if (featured === 'true' || featured === true) {
        query.isFeatured = true;
      }

      // Tags filter
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        query.tags = { $in: tagArray };
      }

      // Build sort object
      const sort = {};
      if (sortBy === 'price') {
        sort.price = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'name') {
        sort.name = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'rating') {
        sort.averageRating = sortOrder === 'asc' ? 1 : -1;
      } else if (sortBy === 'sales') {
        sort.totalSales = sortOrder === 'asc' ? 1 : -1;
      } else {
        sort.createdAt = sortOrder === 'asc' ? 1 : -1;
      }

      // Execute query
      const products = await Product.find(query)
        .populate("vendor", "businessName businessEmail")
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .lean()
        .exec();

      const total = await Product.countDocuments(query);

      // Get filter options for faceted search
      const categories = await Product.distinct('category', { isActive: true });
      const priceRange = await Product.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: null, min: { $min: '$price' }, max: { $max: '$price' } } }
      ]);

      res.json({
        products,
        pagination: {
          total,
          totalPages: Math.ceil(total / limit),
          currentPage: parseInt(page),
          limit: parseInt(limit),
        },
        filters: {
          categories,
          priceRange: priceRange[0] || { min: 0, max: 0 },
        }
      });
    } catch (err) {
      logger.error("Product search error:", err);
      res.status(500).json({ error: "Server error during search" });
    }
  }
);

// Search suggestions/autocomplete
router.get(
  "/suggestions",
  [query("q").notEmpty().isString().trim()],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { q } = req.query;

      // Get product name suggestions
      const productSuggestions = await Product.find({
        isActive: true,
        name: { $regex: q, $options: 'i' }
      })
        .select('name category')
        .limit(5)
        .lean();

      // Get category suggestions
      const categorySuggestions = await Product.distinct('category', {
        isActive: true,
        category: { $regex: q, $options: 'i' }
      });

      // Get tag suggestions
      const tagSuggestions = await Product.aggregate([
        { $match: { isActive: true, tags: { $regex: q, $options: 'i' } } },
        { $unwind: '$tags' },
        { $match: { tags: { $regex: q, $options: 'i' } } },
        { $group: { _id: '$tags' } },
        { $limit: 5 }
      ]);

      res.json({
        products: productSuggestions.map(p => ({
          name: p.name,
          category: p.category
        })),
        categories: categorySuggestions.slice(0, 5),
        tags: tagSuggestions.map(t => t._id),
      });
    } catch (err) {
      logger.error("Search suggestions error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get all products with filtering and pagination (legacy endpoint)
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
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } }
        ];
      }

      const products = await Product.find(query)
        .populate("vendor", "businessName businessEmail")
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
      logger.error("Get products error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

// Get single product
router.get("/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate("vendor", "businessName businessEmail businessPhone")
      .lean();

    if (!product || !product.isActive) {
      return res.status(404).json({ error: "Product not found" });
    }

    res.json(product);
  } catch (err) {
    logger.error("Get product error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// Get related products
router.get("/:id/related", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Find related products by category and tags
    const relatedProducts = await Product.find({
      _id: { $ne: product._id },
      isActive: true,
      $or: [
        { category: product.category },
        { tags: { $in: product.tags || [] } }
      ]
    })
      .populate("vendor", "businessName")
      .limit(8)
      .lean();

    res.json(relatedProducts);
  } catch (err) {
    logger.error("Get related products error:", err);
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
      let vendorId = req.body.vendor;

      if (!vendorId) {
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

      if (productData.variants && productData.variants.length > 0) {
        productData.hasVariants = true;
      }

      const product = new Product(productData);
      await product.save();

      await product.populate("vendor", "businessName businessEmail");
      logger.info('Product created', { productId: product._id, vendor: vendorId });
      res.status(201).json(product);
    } catch (err) {
      logger.error("Create product error:", err);
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

      if (req.user.role !== "admin") {
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor || vendor._id.toString() !== product.vendor.toString()) {
          return res.status(403).json({ error: "Forbidden: You can only update your own products" });
        }
      }

      Object.assign(product, req.body);

      if (product.variants && product.variants.length > 0) {
        product.hasVariants = true;
      } else {
        product.hasVariants = false;
      }

      await product.save();

      await product.populate("vendor", "businessName businessEmail");
      logger.info('Product updated', { productId: product._id });
      res.json(product);
    } catch (err) {
      logger.error("Update product error:", err);
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

      if (req.user.role !== "admin") {
        const vendor = await Vendor.findOne({ user: req.user._id });
        if (!vendor || vendor._id.toString() !== product.vendor.toString()) {
          return res.status(403).json({ error: "Forbidden: You can only delete your own products" });
        }
      }

      await Product.findByIdAndDelete(req.params.id);
      logger.info('Product deleted', { productId: req.params.id });
      res.json({ message: "Product deleted successfully" });
    } catch (err) {
      logger.error("Delete product error:", err);
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
      logger.error("Get vendor products error:", err);
      res.status(500).json({ error: "Server error" });
    }
  }
);

export default router;
