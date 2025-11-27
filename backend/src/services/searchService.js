import { logger } from "../config/logger.js";
import Product from "../models/Product.js";

/**
 * Advanced Search Service
 * Provides comprehensive product search with filters, facets, and suggestions
 */

class SearchService {
  /**
   * Advanced product search with multiple filters
   * @param {Object} params - Search parameters
   * @returns {Object} - Search results with facets and metadata
   */
  async searchProducts(params) {
    try {
      const {
        query = "",
        categories = [],
        brands = [],
        minPrice,
        maxPrice,
        minRating,
        tags = [],
        hasVariants,
        inStock = true,
        sortBy = "relevance", // relevance, price_asc, price_desc, rating, newest, popular
        page = 1,
        limit = 20,
      } = params;

      // Build MongoDB query
      const mongoQuery = { isActive: true };

      // Text search
      if (query && query.trim()) {
        mongoQuery.$text = { $search: query };
      }

      // Category filter (multi-select)
      if (categories && categories.length > 0) {
        mongoQuery.category = { $in: categories };
      }

      // Brand filter (vendor names - multi-select)
      if (brands && brands.length > 0) {
        // Need to populate vendor first or search by vendor IDs
        // For now, we'll handle this in the aggregation pipeline
      }

      // Price range filter
      if (minPrice !== undefined || maxPrice !== undefined) {
        mongoQuery.price = {};
        if (minPrice !== undefined)
          mongoQuery.price.$gte = parseFloat(minPrice);
        if (maxPrice !== undefined)
          mongoQuery.price.$lte = parseFloat(maxPrice);
      }

      // Rating filter
      if (minRating !== undefined) {
        mongoQuery.rating = { $gte: parseFloat(minRating) };
      }

      // Tags filter (multi-select)
      if (tags && tags.length > 0) {
        mongoQuery.tags = { $in: tags };
      }

      // Has variants filter
      if (hasVariants !== undefined) {
        mongoQuery.hasVariants = hasVariants === "true" || hasVariants === true;
      }

      // Stock filter
      if (inStock) {
        mongoQuery.stock = { $gt: 0 };
      }

      // Determine sort order
      let sortOptions = {};
      switch (sortBy) {
        case "price_asc":
          sortOptions = { price: 1 };
          break;
        case "price_desc":
          sortOptions = { price: -1 };
          break;
        case "rating":
          sortOptions = { rating: -1, reviewCount: -1 };
          break;
        case "newest":
          sortOptions = { createdAt: -1 };
          break;
        case "popular":
          sortOptions = { reviewCount: -1, rating: -1 };
          break;
        case "relevance":
        default:
          if (query && query.trim()) {
            sortOptions = { score: { $meta: "textScore" } };
          } else {
            sortOptions = { createdAt: -1 }; // Default to newest
          }
          break;
      }

      // Add text score projection if searching by relevance
      const projection = {};
      if (sortBy === "relevance" && query && query.trim()) {
        projection.score = { $meta: "textScore" };
      }

      // Execute query with pagination
      const skip = (page - 1) * limit;

      const products = await Product.find(mongoQuery, projection)
        .populate("vendor", "businessName name email")
        .sort(sortOptions)
        .limit(parseInt(limit))
        .skip(skip)
        .lean()
        .exec();

      // Get total count
      const total = await Product.countDocuments(mongoQuery);

      // Get facets (for filter UI)
      const facets = await this.getFacets(mongoQuery);

      return {
        products,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
        facets,
        query: {
          searchQuery: query,
          filters: {
            categories,
            brands,
            priceRange: { min: minPrice, max: maxPrice },
            minRating,
            tags,
            hasVariants,
            inStock,
          },
          sortBy,
        },
      };
    } catch (error) {
      logger.error("Search products error:", error);
      throw error;
    }
  }

  /**
   * Get facets for filter UI
   * @param {Object} baseQuery - Base query to apply before aggregation
   * @returns {Object} - Facet data
   */
  async getFacets(baseQuery = { isActive: true }) {
    try {
      const facets = await Product.aggregate([
        { $match: baseQuery },
        {
          $facet: {
            // Category facet
            categories: [
              { $group: { _id: "$category", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $project: { name: "$_id", count: 1, _id: 0 } },
            ],
            // Price range facet
            priceRange: [
              {
                $group: {
                  _id: null,
                  min: { $min: "$price" },
                  max: { $max: "$price" },
                  avg: { $avg: "$price" },
                },
              },
            ],
            // Rating distribution
            ratings: [
              {
                $group: {
                  _id: { $floor: "$rating" },
                  count: { $sum: 1 },
                },
              },
              { $sort: { _id: -1 } },
              { $project: { rating: "$_id", count: 1, _id: 0 } },
            ],
            // Popular tags
            tags: [
              { $unwind: "$tags" },
              { $group: { _id: "$tags", count: { $sum: 1 } } },
              { $sort: { count: -1 } },
              { $limit: 20 },
              { $project: { name: "$_id", count: 1, _id: 0 } },
            ],
            // Brands (vendors)
            brands: [
              {
                $lookup: {
                  from: "vendors",
                  localField: "vendor",
                  foreignField: "_id",
                  as: "vendorInfo",
                },
              },
              { $unwind: "$vendorInfo" },
              {
                $group: {
                  _id: {
                    id: "$vendorInfo._id",
                    name: "$vendorInfo.businessName",
                  },
                  count: { $sum: 1 },
                },
              },
              { $sort: { count: -1 } },
              {
                $project: {
                  vendorId: "$_id.id",
                  name: "$_id.name",
                  count: 1,
                  _id: 0,
                },
              },
            ],
            // Stock availability
            availability: [
              {
                $group: {
                  _id: null,
                  inStock: {
                    $sum: { $cond: [{ $gt: ["$stock", 0] }, 1, 0] },
                  },
                  outOfStock: {
                    $sum: { $cond: [{ $eq: ["$stock", 0] }, 1, 0] },
                  },
                },
              },
            ],
          },
        },
      ]);

      return {
        categories: facets[0].categories || [],
        priceRange: facets[0].priceRange[0] || { min: 0, max: 0, avg: 0 },
        ratings: facets[0].ratings || [],
        tags: facets[0].tags || [],
        brands: facets[0].brands || [],
        availability: facets[0].availability[0] || {
          inStock: 0,
          outOfStock: 0,
        },
      };
    } catch (error) {
      logger.error("Get facets error:", error);
      throw error;
    }
  }

  /**
   * Get search suggestions (autocomplete)
   * @param {String} query - Partial search query
   * @param {Number} limit - Maximum suggestions
   * @returns {Array} - Suggested products and categories
   */
  async getSuggestions(query, limit = 10) {
    try {
      if (!query || query.trim().length < 2) {
        return { products: [], categories: [], tags: [] };
      }

      // Convert limit to integer
      const numLimit = parseInt(limit, 10);

      const searchRegex = new RegExp(query, "i");

      // Get product name suggestions
      const products = await Product.find({
        isActive: true,
        name: searchRegex,
      })
        .select("name category price images")
        .limit(numLimit)
        .lean()
        .exec();

      // Get category suggestions
      const categories = await Product.distinct("category", {
        isActive: true,
        category: searchRegex,
      });

      // Get tag suggestions
      const tags = await Product.aggregate([
        { $match: { isActive: true } },
        { $unwind: "$tags" },
        { $match: { tags: searchRegex } },
        { $group: { _id: "$tags", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: numLimit },
        { $project: { tag: "$_id", count: 1, _id: 0 } },
      ]);

      return {
        products: products.map((p) => ({
          id: p._id,
          name: p.name,
          category: p.category,
          price: p.price,
          image: p.images?.[0],
        })),
        categories: categories.slice(0, 5),
        tags: tags.map((t) => t.tag).slice(0, 5),
      };
    } catch (error) {
      logger.error("Get suggestions error:", error);
      throw error;
    }
  }

  /**
   * Track search analytics
   * @param {String} query - Search query
   * @param {Number} resultsCount - Number of results found
   * @param {String} userId - Optional user ID
   */
  async trackSearch(query, resultsCount, userId = null) {
    try {
      // This could be stored in a SearchAnalytics model
      // For now, just log it
      logger.info("Search tracked:", {
        query,
        resultsCount,
        userId,
        timestamp: new Date(),
      });

      // TODO: Implement SearchAnalytics model and storage
      // const searchLog = new SearchAnalytics({
      //   query,
      //   resultsCount,
      //   user: userId,
      //   timestamp: new Date(),
      // });
      // await searchLog.save();
    } catch (error) {
      logger.error("Track search error:", error);
      // Don't throw - analytics should not break the search
    }
  }

  /**
   * Get popular searches
   * @param {Number} limit - Number of popular searches to return
   * @returns {Array} - Popular search queries
   */
  async getPopularSearches(limit = 10) {
    try {
      // TODO: Implement with SearchAnalytics model
      // For now, return empty array
      return [];

      // Future implementation:
      // return await SearchAnalytics.aggregate([
      //   {
      //     $group: {
      //       _id: "$query",
      //       count: { $sum: 1 },
      //       lastSearched: { $max: "$timestamp" },
      //     },
      //   },
      //   { $sort: { count: -1, lastSearched: -1 } },
      //   { $limit: limit },
      //   { $project: { query: "$_id", count: 1, _id: 0 } },
      // ]);
    } catch (error) {
      logger.error("Get popular searches error:", error);
      return [];
    }
  }

  /**
   * Get related products
   * @param {String} productId - Product ID
   * @param {Number} limit - Number of related products
   * @returns {Array} - Related products
   */
  async getRelatedProducts(productId, limit = 8) {
    try {
      const product = await Product.findById(productId)
        .select("category tags vendor")
        .lean();

      if (!product) {
        return [];
      }

      // Find products with same category or tags
      const related = await Product.find({
        _id: { $ne: productId },
        isActive: true,
        $or: [
          { category: product.category },
          { tags: { $in: product.tags || [] } },
          { vendor: product.vendor },
        ],
      })
        .populate("vendor", "businessName name")
        .limit(limit)
        .lean()
        .exec();

      return related;
    } catch (error) {
      logger.error("Get related products error:", error);
      return [];
    }
  }

  /**
   * Get price range suggestions based on category
   * @param {String} category - Product category
   * @returns {Object} - Price buckets for filtering
   */
  async getPriceRanges(category = null) {
    try {
      const query = { isActive: true };
      if (category) query.category = category;

      const result = await Product.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            min: { $min: "$price" },
            max: { $max: "$price" },
          },
        },
      ]);

      if (result.length === 0) {
        return [];
      }

      const { min, max } = result[0];
      const range = max - min;
      const bucketSize = range / 5; // 5 price ranges

      // Generate price buckets
      const buckets = [];
      for (let i = 0; i < 5; i++) {
        const bucketMin = Math.floor(min + bucketSize * i);
        const bucketMax = Math.floor(min + bucketSize * (i + 1));
        buckets.push({
          label: `$${bucketMin} - $${bucketMax}`,
          min: bucketMin,
          max: bucketMax,
        });
      }

      return buckets;
    } catch (error) {
      logger.error("Get price ranges error:", error);
      return [];
    }
  }
}

export default new SearchService();
