/**
 * Simple API Test for Buyer Features - Feature 2
 * Tests backend endpoints using HTTP requests
 */

import dotenv from "dotenv";
dotenv.config();

const API_URL = process.env.API_URL || "http://localhost:5000";

async function testAPI(endpoint, description) {
  try {
    console.log(`\nTesting: ${description}`);
    console.log(`Endpoint: GET ${endpoint}`);
    const response = await fetch(`${API_URL}${endpoint}`);
    const data = await response.json();

    if (response.ok) {
      console.log(`✅ SUCCESS - Status: ${response.status}`);
      if (data.products) {
        console.log(`   Found ${data.products.length} products`);
        if (data.products.length > 0) {
          console.log(
            `   First product: ${data.products[0].name} - $${data.products[0].price}`
          );
        }
      } else if (data.facets) {
        console.log(`   Categories: ${data.facets.categories?.length || 0}`);
        console.log(
          `   Price Range: $${data.facets.priceRange?.min} - $${data.facets.priceRange?.max}`
        );
      } else if (Array.isArray(data)) {
        console.log(`   Results: ${data.length} items`);
      } else {
        console.log(`   Data:`, Object.keys(data).join(", "));
      }
    } else {
      console.log(`❌ FAILED - Status: ${response.status}`);
      console.log(`   Error: ${data.error || data.message || "Unknown error"}`);
    }
    return { success: response.ok, data };
  } catch (error) {
    console.log(`❌ ERROR: ${error.message}`);
    return { success: false, error: error.message };
  }
}

async function runTests() {
  console.log(
    "\n🧪 Testing Feature 2: Browsing and Product Discovery (API Tests)\n"
  );
  console.log("=" + "=".repeat(70));
  console.log(`API Base URL: ${API_URL}`);
  console.log("=".repeat(71) + "\n");

  const tests = [
    // Test 1: Get all products
    {
      endpoint: "/api/products?limit=5",
      description: "Get all products (paginated)",
    },

    // Test 2: Search by text
    {
      endpoint: "/api/search?q=laptop&limit=5",
      description: "Search products by keyword 'laptop'",
    },

    // Test 3: Filter by category
    {
      endpoint: "/api/search?categories=Electronics&limit=5",
      description: "Filter by category (Electronics)",
    },

    // Test 4: Filter by price range
    {
      endpoint: "/api/search?minPrice=50&maxPrice=500&limit=5",
      description: "Filter by price range ($50-$500)",
    },

    // Test 5: Filter by rating
    {
      endpoint: "/api/search?minRating=4&limit=5",
      description: "Filter by minimum rating (4+ stars)",
    },

    // Test 6: Sort by price
    {
      endpoint: "/api/search?sortBy=price_asc&limit=5",
      description: "Sort by price (low to high)",
    },

    // Test 7: Combined filters
    {
      endpoint:
        "/api/search?categories=Electronics&minPrice=100&maxPrice=1000&minRating=4&sortBy=rating&limit=5",
      description: "Combined filters (Electronics, $100-$1000, 4+ rating)",
    },

    // Test 8: Get search facets
    {
      endpoint: "/api/search/facets",
      description: "Get available filter options (facets)",
    },

    // Test 9: Get autocomplete suggestions
    {
      endpoint: "/api/search/suggestions?q=gam&limit=5",
      description: "Autocomplete suggestions for 'gam'",
    },

    // Test 10: Get price ranges
    {
      endpoint: "/api/search/price-ranges?category=Electronics",
      description: "Get price range buckets for Electronics",
    },
  ];

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    const result = await testAPI(test.endpoint, test.description);
    if (result.success) {
      passed++;
    } else {
      failed++;
    }
    await new Promise((resolve) => setTimeout(resolve, 500)); // Small delay between tests
  }

  console.log("\n" + "=".repeat(71));
  console.log(
    `\n📊 Test Results: ${passed} passed, ${failed} failed out of ${tests.length} tests`
  );

  if (failed === 0) {
    console.log(
      "✅ All Feature 2 (Browsing & Product Discovery) tests PASSED!\n"
    );
  } else {
    console.log("⚠️  Some tests failed. Check the errors above.\n");
  }
  console.log("=".repeat(71) + "\n");
}

runTests();
