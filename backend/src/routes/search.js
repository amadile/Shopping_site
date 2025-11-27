import express from "express";
import { query, validationResult } from "express-validator";
import { logger } from "../config/logger.js";
import searchService from "../services/searchService.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Search
 *   description: Advanced product search and filtering
 */

/**
 * @swagger
 * /api/search:
 *   get:
 *     summary: Advanced product search with filters
 *     description: Search products with comprehensive filtering, facets, and sorting
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query (product name, description, tags)
 *       - in: query
 *         name: categories
 *         schema:
 *           type: string
 *         description: Comma-separated category names
 *       - in: query
 *         name: brands
 *         schema:
 *           type: string
 *         description: Comma-separated brand (vendor) IDs
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price filter
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price filter
 *       - in: query
 *         name: minRating
 *         schema:
 *           type: number
 *         description: Minimum rating filter (0-5)
 *       - in: query
 *         name: tags
 *         schema:
 *           type: string
 *         description: Comma-separated tags
 *       - in: query
 *         name: hasVariants
 *         schema:
 *           type: boolean
 *         description: Filter products with/without variants
 *       - in: query
 *         name: inStock
 *         schema:
 *           type: boolean
 *           default: true
 *         description: Only show in-stock products
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [relevance, price_asc, price_desc, rating, newest, popular]
 *           default: relevance
 *         description: Sort order
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *           maximum: 100
 *         description: Results per page
 *     responses:
 *       200:
 *         description: Search results with facets
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.get(
  "/",
  [
    query("q").optional().isString().trim(),
    query("categories").optional().isString(),
    query("brands").optional().isString(),
    query("minPrice").optional().isFloat({ min: 0 }),
    query("maxPrice").optional().isFloat({ min: 0 }),
    query("minRating").optional().isFloat({ min: 0, max: 5 }),
    query("tags").optional().isString(),
    query("hasVariants").optional().isBoolean(),
    query("inStock").optional().isBoolean(),
    query("sortBy")
      .optional()
      .isIn([
        "relevance",
        "price_asc",
        "price_desc",
        "rating",
        "newest",
        "popular",
      ]),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const {
        q: query,
        categories,
        brands,
        minPrice,
        maxPrice,
        minRating,
        tags,
        hasVariants,
        inStock = true,
        sortBy = "relevance",
        page = 1,
        limit = 20,
      } = req.query;

      // Parse comma-separated values
      const parsedCategories = categories
        ? categories.split(",").map((c) => c.trim())
        : [];
      const parsedBrands = brands ? brands.split(",").map((b) => b.trim()) : [];
      const parsedTags = tags ? tags.split(",").map((t) => t.trim()) : [];

      const searchParams = {
        query,
        categories: parsedCategories,
        brands: parsedBrands,
        minPrice,
        maxPrice,
        minRating,
        tags: parsedTags,
        hasVariants,
        inStock,
        sortBy,
        page,
        limit,
      };

      const results = await searchService.searchProducts(searchParams);

      // Track search analytics
      const userId = req.user?._id || null;
      await searchService.trackSearch(
        query || "",
        results.pagination.total,
        userId
      );

      res.json({
        success: true,
        ...results,
      });
    } catch (error) {
      logger.error("Search error:", error);
      res.status(500).json({
        success: false,
        error: req.t ? req.t("serverError") : "Server error",
      });
    }
  }
);

/**
 * @swagger
 * /api/search/suggestions:
 *   get:
 *     summary: Get search suggestions (autocomplete)
 *     description: Get product, category, and tag suggestions for autocomplete
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *           minLength: 2
 *         description: Search query (minimum 2 characters)
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 20
 *         description: Maximum suggestions
 *     responses:
 *       200:
 *         description: Search suggestions
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.get(
  "/suggestions",
  [
    query("q").notEmpty().isString().trim().isLength({ min: 2 }),
    query("limit").optional().isInt({ min: 1, max: 20 }),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const { q: query, limit = 10 } = req.query;

      const suggestions = await searchService.getSuggestions(query, limit);

      res.json({
        success: true,
        query,
        suggestions,
      });
    } catch (error) {
      logger.error("Suggestions error:", error);
      res.status(500).json({
        success: false,
        error: req.t ? req.t("serverError") : "Server error",
      });
    }
  }
);

/**
 * @swagger
 * /api/search/facets:
 *   get:
 *     summary: Get search facets for filters
 *     description: Get available categories, brands, price ranges, etc. for filter UI
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter facets by category
 *     responses:
 *       200:
 *         description: Search facets
 *       500:
 *         description: Server error
 */
router.get("/facets", async (req, res) => {
  try {
    const { category } = req.query;

    const baseQuery = { isActive: true };
    if (category) {
      baseQuery.category = category;
    }

    const facets = await searchService.getFacets(baseQuery);

    res.json({
      success: true,
      facets,
    });
  } catch (error) {
    logger.error("Facets error:", error);
    res.status(500).json({
      success: false,
      error: req.t ? req.t("serverError") : "Server error",
    });
  }
});

/**
 * @swagger
 * /api/search/popular:
 *   get:
 *     summary: Get popular search queries
 *     description: Get most popular search queries from analytics
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *           maximum: 20
 *         description: Number of popular searches
 *     responses:
 *       200:
 *         description: Popular searches
 *       500:
 *         description: Server error
 */
router.get(
  "/popular",
  [query("limit").optional().isInt({ min: 1, max: 20 })],
  async (req, res) => {
    try {
      const { limit = 10 } = req.query;

      const popularSearches = await searchService.getPopularSearches(limit);

      res.json({
        success: true,
        searches: popularSearches,
      });
    } catch (error) {
      logger.error("Popular searches error:", error);
      res.status(500).json({
        success: false,
        error: req.t ? req.t("serverError") : "Server error",
      });
    }
  }
);

/**
 * @swagger
 * /api/search/related/{productId}:
 *   get:
 *     summary: Get related products
 *     description: Get products related to a specific product
 *     tags: [Search]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *         description: Product ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 8
 *           maximum: 20
 *         description: Number of related products
 *     responses:
 *       200:
 *         description: Related products
 *       400:
 *         description: Invalid product ID
 *       500:
 *         description: Server error
 */
router.get("/related/:productId", async (req, res) => {
  try {
    const { productId } = req.params;
    const { limit = 8 } = req.query;

    const relatedProducts = await searchService.getRelatedProducts(
      productId,
      limit
    );

    res.json({
      success: true,
      products: relatedProducts,
    });
  } catch (error) {
    logger.error("Related products error:", error);
    res.status(500).json({
      success: false,
      error: req.t ? req.t("serverError") : "Server error",
    });
  }
});

/**
 * @swagger
 * /api/search/price-ranges:
 *   get:
 *     summary: Get suggested price ranges for filtering
 *     description: Get price bucket suggestions based on category
 *     tags: [Search]
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Category to get price ranges for
 *     responses:
 *       200:
 *         description: Price range buckets
 *       500:
 *         description: Server error
 */
router.get("/price-ranges", async (req, res) => {
  try {
    const { category } = req.query;

    const priceRanges = await searchService.getPriceRanges(category);

    res.json({
      success: true,
      ranges: priceRanges,
    });
  } catch (error) {
    logger.error("Price ranges error:", error);
    res.status(500).json({
      success: false,
      error: req.t ? req.t("serverError") : "Server error",
    });
  }
});

export default router;
