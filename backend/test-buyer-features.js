/**
 * Test script for Buyer Features - Feature 2: Browsing and Product Discovery
 * Tests: Search, Filters, Product Details, Related Products
 */

import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "./src/models/Product.js";
import searchService from "./src/services/searchService.js";

dotenv.config();

async function testBrowsingAndDiscovery() {
  console.log("\n🧪 Testing Feature 2: Browsing and Product Discovery\n");
  console.log("=".repeat(60));

  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB\n");

    // Test 1: Get All Products
    console.log("Test 1: Get All Products");
    console.log("-".repeat(60));
    const allProducts = await Product.find({ isActive: true })
      .select("name category price stock rating")
      .limit(5);
    console.log(`✅ Found ${allProducts.length} products`);
    allProducts.forEach((p) => {
      console.log(
        `  - ${p.name} | ${p.category} | $${p.price} | Stock: ${p.stock}`
      );
    });

    // Test 2: Search by Text Query
    console.log("\n\nTest 2: Search by Text Query (query: 'laptop')");
    console.log("-".repeat(60));
    const searchResults = await searchService.searchProducts({
      query: "laptop",
      limit: 5,
    });
    console.log(
      `✅ Found ${searchResults.products.length} products matching 'laptop'`
    );
    searchResults.products.forEach((p) => {
      console.log(`  - ${p.name} | ${p.category} | $${p.price}`);
    });

    // Test 3: Filter by Category
    console.log("\n\nTest 3: Filter by Category (Electronics)");
    console.log("-".repeat(60));
    const categoryResults = await searchService.searchProducts({
      categories: ["Electronics"],
      limit: 5,
    });
    console.log(
      `✅ Found ${categoryResults.products.length} Electronics products`
    );
    categoryResults.products.forEach((p) => {
      console.log(`  - ${p.name} | ${p.category} | $${p.price}`);
    });

    // Test 4: Filter by Price Range
    console.log("\n\nTest 4: Filter by Price Range ($50 - $500)");
    console.log("-".repeat(60));
    const priceResults = await searchService.searchProducts({
      minPrice: 50,
      maxPrice: 500,
      limit: 5,
    });
    console.log(
      `✅ Found ${priceResults.products.length} products in price range`
    );
    priceResults.products.forEach((p) => {
      console.log(`  - ${p.name} | $${p.price}`);
    });

    // Test 5: Filter by Rating
    console.log("\n\nTest 5: Filter by Rating (4+ stars)");
    console.log("-".repeat(60));
    const ratingResults = await searchService.searchProducts({
      minRating: 4,
      limit: 5,
    });
    console.log(
      `✅ Found ${ratingResults.products.length} products with 4+ rating`
    );
    ratingResults.products.forEach((p) => {
      console.log(`  - ${p.name} | Rating: ${p.rating || "N/A"}`);
    });

    // Test 6: Sort by Price (Ascending)
    console.log("\n\nTest 6: Sort by Price (Low to High)");
    console.log("-".repeat(60));
    const sortedResults = await searchService.searchProducts({
      sortBy: "price_asc",
      limit: 5,
    });
    console.log(`✅ Products sorted by price (ascending)`);
    sortedResults.products.forEach((p) => {
      console.log(`  - ${p.name} | $${p.price}`);
    });

    // Test 7: Combined Filters
    console.log(
      "\n\nTest 7: Combined Filters (Electronics, $100-$1000, 4+ rating)"
    );
    console.log("-".repeat(60));
    const combinedResults = await searchService.searchProducts({
      categories: ["Electronics"],
      minPrice: 100,
      maxPrice: 1000,
      minRating: 4,
      sortBy: "rating",
      limit: 5,
    });
    console.log(
      `✅ Found ${combinedResults.products.length} products matching all filters`
    );
    combinedResults.products.forEach((p) => {
      console.log(`  - ${p.name} | $${p.price} | Rating: ${p.rating || "N/A"}`);
    });

    // Test 8: Get Product Details
    console.log("\n\nTest 8: Get Product Details");
    console.log("-".repeat(60));
    const sampleProduct = await Product.findOne({ isActive: true }).populate(
      "vendor",
      "businessName businessEmail"
    );
    if (sampleProduct) {
      console.log(`✅ Product Details:`);
      console.log(`  Name: ${sampleProduct.name}`);
      console.log(`  Category: ${sampleProduct.category}`);
      console.log(`  Price: $${sampleProduct.price}`);
      console.log(
        `  Description: ${sampleProduct.description.substring(0, 100)}...`
      );
      console.log(`  Stock: ${sampleProduct.stock}`);
      console.log(`  Rating: ${sampleProduct.rating || "N/A"}`);
      console.log(`  Images: ${sampleProduct.images.length} image(s)`);
      console.log(`  Vendor: ${sampleProduct.vendor?.businessName || "N/A"}`);
      if (sampleProduct.specifications) {
        console.log(
          `  Specifications:`,
          Object.keys(sampleProduct.specifications).length,
          "specs"
        );
      }
    } else {
      console.log("❌ No products found");
    }

    // Test 9: Get Related Products
    console.log("\n\nTest 9: Get Related Products");
    console.log("-".repeat(60));
    if (sampleProduct) {
      const relatedProducts = await Product.find({
        _id: { $ne: sampleProduct._id },
        isActive: true,
        $or: [
          { category: sampleProduct.category },
          { tags: { $in: sampleProduct.tags || [] } },
        ],
      })
        .limit(4)
        .select("name category price");
      console.log(
        `✅ Found ${relatedProducts.length} related products for "${sampleProduct.name}"`
      );
      relatedProducts.forEach((p) => {
        console.log(`  - ${p.name} | ${p.category} | $${p.price}`);
      });
    }

    // Test 10: Get Search Facets
    console.log("\n\nTest 10: Get Search Facets (Filter Options)");
    console.log("-".repeat(60));
    const facets = await searchService.getSearchFacets();
    console.log(`✅ Available Filter Options:`);
    console.log(`  Categories: ${facets.categories.length} options`);
    facets.categories.slice(0, 5).forEach((c) => {
      console.log(`    - ${c.category} (${c.count} products)`);
    });
    console.log(
      `  Price Range: $${facets.priceRange.min} - $${facets.priceRange.max}`
    );
    if (facets.brands && facets.brands.length > 0) {
      console.log(`  Brands: ${facets.brands.length} brands`);
    }
    if (facets.tags && facets.tags.length > 0) {
      console.log(`  Tags: ${facets.tags.slice(0, 10).join(", ")}`);
    }

    // Test 11: Get Search Suggestions (Autocomplete)
    console.log("\n\nTest 11: Get Search Suggestions (Autocomplete for 'gam')");
    console.log("-".repeat(60));
    const suggestions = await searchService.getSuggestions("gam", 5);
    console.log(`✅ Autocomplete suggestions:`);
    suggestions.products.forEach((p) => {
      console.log(`  - ${p.name} | ${p.category}`);
    });
    if (suggestions.categories && suggestions.categories.length > 0) {
      console.log(`  Category suggestions:`, suggestions.categories.join(", "));
    }

    // Test 12: Get Price Ranges for Category
    console.log("\n\nTest 12: Get Price Ranges for Electronics");
    console.log("-".repeat(60));
    const priceRanges = await searchService.getPriceRanges("Electronics");
    console.log(`✅ Price range buckets:`);
    priceRanges.forEach((range) => {
      console.log(`  - ${range.label}`);
    });

    console.log("\n" + "=".repeat(60));
    console.log("✅ All Feature 2 tests completed successfully!");
    console.log("=".repeat(60) + "\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error.message);
    console.error(error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
}

// Run the tests
testBrowsingAndDiscovery();
