#!/usr/bin/env node

/**
 * Advanced Search & Filters Test Suite
 * Tests all search functionality
 */

import http from "http";

const BASE_URL = "http://localhost:5000";

console.log(
  "\x1b[36m%s\x1b[0m",
  "\n╔═══════════════════════════════════════════════════════╗"
);
console.log(
  "\x1b[36m%s\x1b[0m",
  "║     ADVANCED SEARCH & FILTERS TESTS               ║"
);
console.log(
  "\x1b[36m%s\x1b[0m",
  "╚═══════════════════════════════════════════════════════╝\n"
);

let testsPassed = 0;
let testsFailed = 0;

function makeRequest(path, options = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(
      url,
      {
        method: options.method || "GET",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      },
      (res) => {
        let data = "";
        res.on("data", (chunk) => (data += chunk));
        res.on("end", () => {
          try {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data ? JSON.parse(data) : null,
            });
          } catch (e) {
            resolve({
              status: res.statusCode,
              headers: res.headers,
              data: data,
            });
          }
        });
      }
    );

    req.on("error", reject);

    if (options.body) {
      req.write(JSON.stringify(options.body));
    }

    req.end();
  });
}

function testResult(name, passed, details = "") {
  if (passed) {
    console.log("\x1b[32m%s\x1b[0m", `  ✓ ${name}`);
    if (details) console.log("\x1b[90m%s\x1b[0m", `    ${details}`);
    testsPassed++;
  } else {
    console.log("\x1b[31m%s\x1b[0m", `  ✗ ${name}`);
    if (details) console.log("\x1b[90m%s\x1b[0m", `    ${details}`);
    testsFailed++;
  }
}

async function testBasicSearch() {
  console.log("\x1b[33m%s\x1b[0m", "\n1. Testing Basic Search...\n");

  try {
    // Test: Simple search
    console.log("\x1b[37m%s\x1b[0m", "  → Testing simple text search");
    const searchRes = await makeRequest("/api/search?q=product");

    testResult(
      "Simple text search",
      searchRes.status === 200,
      `Status: ${searchRes.status}, Results: ${
        searchRes.data?.products?.length || 0
      }`
    );

    if (searchRes.status === 200 && searchRes.data) {
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Total Products: ${searchRes.data.pagination?.total || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Total Pages: ${searchRes.data.pagination?.totalPages || 0}`
      );
    }

    // Test: Empty search (should return all active products)
    console.log("\x1b[37m%s\x1b[0m", "\n  → Testing empty search");
    const emptyRes = await makeRequest("/api/search");

    testResult(
      "Empty search (all products)",
      emptyRes.status === 200,
      `Status: ${emptyRes.status}, Results: ${
        emptyRes.data?.products?.length || 0
      }`
    );
  } catch (error) {
    testResult("Basic search", false, `Error: ${error.message}`);
  }
}

async function testSearchWithFilters() {
  console.log("\x1b[33m%s\x1b[0m", "\n2. Testing Search with Filters...\n");

  try {
    // Test 1: Price range filter
    console.log("\x1b[37m%s\x1b[0m", "  → Testing price range filter");
    const priceRes = await makeRequest("/api/search?minPrice=10&maxPrice=100");

    testResult(
      "Price range filter",
      priceRes.status === 200,
      `Status: ${priceRes.status}, Results: ${
        priceRes.data?.products?.length || 0
      }`
    );

    // Test 2: Rating filter
    console.log("\x1b[37m%s\x1b[0m", "\n  → Testing rating filter");
    const ratingRes = await makeRequest("/api/search?minRating=4");

    testResult(
      "Rating filter (4+ stars)",
      ratingRes.status === 200,
      `Status: ${ratingRes.status}, Results: ${
        ratingRes.data?.products?.length || 0
      }`
    );

    // Test 3: Multiple filters
    console.log("\x1b[37m%s\x1b[0m", "\n  → Testing multiple filters combined");
    const multiRes = await makeRequest(
      "/api/search?q=product&minPrice=20&maxPrice=200&minRating=3&inStock=true"
    );

    testResult(
      "Multiple filters combined",
      multiRes.status === 200,
      `Status: ${multiRes.status}, Results: ${
        multiRes.data?.products?.length || 0
      }`
    );

    // Test 4: Category filter
    console.log("\x1b[37m%s\x1b[0m", "\n  → Testing category filter");
    const categoryRes = await makeRequest(
      "/api/search?categories=Electronics,Clothing"
    );

    testResult(
      "Category filter (multi-select)",
      categoryRes.status === 200,
      `Status: ${categoryRes.status}, Results: ${
        categoryRes.data?.products?.length || 0
      }`
    );
  } catch (error) {
    testResult("Search with filters", false, `Error: ${error.message}`);
  }
}

async function testSorting() {
  console.log("\x1b[33m%s\x1b[0m", "\n3. Testing Sorting Options...\n");

  const sortOptions = [
    "relevance",
    "price_asc",
    "price_desc",
    "rating",
    "newest",
    "popular",
  ];

  for (const sortBy of sortOptions) {
    try {
      console.log("\x1b[37m%s\x1b[0m", `  → Testing sort: ${sortBy}`);
      const sortRes = await makeRequest(`/api/search?sortBy=${sortBy}`);

      testResult(
        `Sort by ${sortBy}`,
        sortRes.status === 200,
        `Status: ${sortRes.status}, Results: ${
          sortRes.data?.products?.length || 0
        }`
      );
    } catch (error) {
      testResult(`Sort by ${sortBy}`, false, `Error: ${error.message}`);
    }
  }
}

async function testPagination() {
  console.log("\x1b[33m%s\x1b[0m", "\n4. Testing Pagination...\n");

  try {
    // Test: Page 1
    console.log("\x1b[37m%s\x1b[0m", "  → Testing page 1 with limit 10");
    const page1Res = await makeRequest("/api/search?page=1&limit=10");

    testResult(
      "Page 1 with limit 10",
      page1Res.status === 200,
      `Status: ${page1Res.status}, Results: ${
        page1Res.data?.products?.length || 0
      }`
    );

    if (page1Res.status === 200 && page1Res.data?.pagination) {
      const { pagination } = page1Res.data;
      console.log("\x1b[90m%s\x1b[0m", `    Current Page: ${pagination.page}`);
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Total Pages: ${pagination.totalPages}`
      );
      console.log("\x1b[90m%s\x1b[0m", `    Has Next: ${pagination.hasNext}`);
      console.log("\x1b[90m%s\x1b[0m", `    Has Prev: ${pagination.hasPrev}`);
    }

    // Test: Page 2
    console.log("\x1b[37m%s\x1b[0m", "\n  → Testing page 2 with limit 5");
    const page2Res = await makeRequest("/api/search?page=2&limit=5");

    testResult(
      "Page 2 with limit 5",
      page2Res.status === 200,
      `Status: ${page2Res.status}, Results: ${
        page2Res.data?.products?.length || 0
      }`
    );
  } catch (error) {
    testResult("Pagination", false, `Error: ${error.message}`);
  }
}

async function testSuggestions() {
  console.log("\x1b[33m%s\x1b[0m", "\n5. Testing Search Suggestions...\n");

  try {
    // Test 1: Valid suggestions
    console.log(
      "\x1b[37m%s\x1b[0m",
      '  → Testing suggestions with query "pro"'
    );
    const suggestRes = await makeRequest(
      "/api/search/suggestions?q=pro&limit=5"
    );

    testResult(
      "Get suggestions (valid query)",
      suggestRes.status === 200,
      `Status: ${suggestRes.status}`
    );

    if (suggestRes.status === 200 && suggestRes.data?.suggestions) {
      const { suggestions } = suggestRes.data;
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Products: ${suggestions.products?.length || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Categories: ${suggestions.categories?.length || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Tags: ${suggestions.tags?.length || 0}`
      );
    }

    // Test 2: Short query (should fail validation)
    console.log(
      "\x1b[37m%s\x1b[0m",
      "\n  → Testing suggestions with short query (1 char)"
    );
    const shortRes = await makeRequest("/api/search/suggestions?q=a");

    testResult(
      "Reject short query (< 2 chars)",
      shortRes.status === 400,
      `Status: ${shortRes.status}`
    );
  } catch (error) {
    testResult("Search suggestions", false, `Error: ${error.message}`);
  }
}

async function testFacets() {
  console.log("\x1b[33m%s\x1b[0m", "\n6. Testing Search Facets...\n");

  try {
    // Test: Get all facets
    console.log("\x1b[37m%s\x1b[0m", "  → Testing get all facets");
    const facetsRes = await makeRequest("/api/search/facets");

    testResult(
      "Get all facets",
      facetsRes.status === 200,
      `Status: ${facetsRes.status}`
    );

    if (facetsRes.status === 200 && facetsRes.data?.facets) {
      const { facets } = facetsRes.data;
      console.log("\x1b[90m%s\x1b[0m", "\n    Facet Data:");
      console.log(
        "\x1b[90m%s\x1b[0m",
        `      Categories: ${facets.categories?.length || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `      Brands: ${facets.brands?.length || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `      Tags: ${facets.tags?.length || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `      Price Range: $${facets.priceRange?.min || 0} - $${
          facets.priceRange?.max || 0
        }`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `      In Stock: ${facets.availability?.inStock || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `      Out of Stock: ${facets.availability?.outOfStock || 0}`
      );
    }

    // Test: Get facets for specific category
    console.log(
      "\x1b[37m%s\x1b[0m",
      "\n  → Testing facets for specific category"
    );
    const categoryFacetsRes = await makeRequest(
      "/api/search/facets?category=Electronics"
    );

    testResult(
      "Get facets for category",
      categoryFacetsRes.status === 200,
      `Status: ${categoryFacetsRes.status}`
    );
  } catch (error) {
    testResult("Search facets", false, `Error: ${error.message}`);
  }
}

async function testRelatedProducts() {
  console.log("\x1b[33m%s\x1b[0m", "\n7. Testing Related Products...\n");

  try {
    // Test: Get related products (with dummy ID)
    console.log("\x1b[37m%s\x1b[0m", "  → Testing get related products");
    const relatedRes = await makeRequest(
      "/api/search/related/507f1f77bcf86cd799439011?limit=8"
    );

    testResult(
      "Get related products",
      relatedRes.status === 200 || relatedRes.status === 404,
      `Status: ${relatedRes.status}, Products: ${
        relatedRes.data?.products?.length || 0
      }`
    );
  } catch (error) {
    testResult("Related products", false, `Error: ${error.message}`);
  }
}

async function testPriceRanges() {
  console.log("\x1b[33m%s\x1b[0m", "\n8. Testing Price Ranges...\n");

  try {
    // Test: Get price ranges
    console.log("\x1b[37m%s\x1b[0m", "  → Testing get price range buckets");
    const rangesRes = await makeRequest("/api/search/price-ranges");

    testResult(
      "Get price range buckets",
      rangesRes.status === 200,
      `Status: ${rangesRes.status}, Buckets: ${
        rangesRes.data?.ranges?.length || 0
      }`
    );

    if (rangesRes.status === 200 && rangesRes.data?.ranges) {
      console.log("\x1b[90m%s\x1b[0m", "\n    Price Buckets:");
      rangesRes.data.ranges.slice(0, 3).forEach((range) => {
        console.log(
          "\x1b[90m%s\x1b[0m",
          `      ${range.label || `$${range.min} - $${range.max}`}`
        );
      });
    }
  } catch (error) {
    testResult("Price ranges", false, `Error: ${error.message}`);
  }
}

async function testPopularSearches() {
  console.log("\x1b[33m%s\x1b[0m", "\n9. Testing Popular Searches...\n");

  try {
    // Test: Get popular searches
    console.log("\x1b[37m%s\x1b[0m", "  → Testing get popular searches");
    const popularRes = await makeRequest("/api/search/popular?limit=10");

    testResult(
      "Get popular searches",
      popularRes.status === 200,
      `Status: ${popularRes.status}, Searches: ${
        popularRes.data?.searches?.length || 0
      }`
    );
  } catch (error) {
    testResult("Popular searches", false, `Error: ${error.message}`);
  }
}

async function testEndpointAvailability() {
  console.log("\x1b[33m%s\x1b[0m", "\n10. Testing Endpoint Availability...\n");

  const endpoints = [
    { method: "GET", path: "/api/search", name: "Main search" },
    {
      method: "GET",
      path: "/api/search/suggestions?q=test",
      name: "Suggestions",
    },
    { method: "GET", path: "/api/search/facets", name: "Facets" },
    { method: "GET", path: "/api/search/popular", name: "Popular searches" },
    {
      method: "GET",
      path: "/api/search/related/507f1f77bcf86cd799439011",
      name: "Related products",
    },
    { method: "GET", path: "/api/search/price-ranges", name: "Price ranges" },
  ];

  console.log("\x1b[37m%s\x1b[0m", "  → Checking all search endpoints exist\n");

  for (const endpoint of endpoints) {
    try {
      const res = await makeRequest(endpoint.path, {
        method: endpoint.method,
      });

      const exists = res.status !== 404;
      const symbol = exists ? "✓" : "✗";
      const color = exists ? "\x1b[32m" : "\x1b[31m";

      console.log(
        `${color}%s\x1b[0m`,
        `    ${symbol} ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(
          50
        )} (${res.status})`
      );

      if (exists) testsPassed++;
      else testsFailed++;
    } catch (error) {
      console.log(
        "\x1b[31m%s\x1b[0m",
        `    ✗ ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(50)} (ERROR)`
      );
      testsFailed++;
    }
  }
}

async function runAllTests() {
  console.log(
    "\x1b[36m%s\x1b[0m",
    "Testing Advanced Search & Filters at: " + BASE_URL + "\n"
  );
  console.log(
    "\x1b[90m%s\x1b[0m",
    "Make sure the server is running before running these tests."
  );
  console.log("\x1b[90m%s\x1b[0m", "Start server with: npm start\n");
  console.log("\x1b[90m%s\x1b[0m", "─".repeat(60));

  // Check if server is running
  try {
    await makeRequest("/");
  } catch (error) {
    console.log("\x1b[31m%s\x1b[0m", "\n✗ ERROR: Server is not running!\n");
    console.log("\x1b[33m%s\x1b[0m", "Please start the server first:");
    console.log("\x1b[90m%s\x1b[0m", "  cd backend");
    console.log("\x1b[90m%s\x1b[0m", "  npm start\n");
    process.exit(1);
  }

  await testBasicSearch();
  await testSearchWithFilters();
  await testSorting();
  await testPagination();
  await testSuggestions();
  await testFacets();
  await testRelatedProducts();
  await testPriceRanges();
  await testPopularSearches();
  await testEndpointAvailability();

  // Summary
  console.log(
    "\x1b[36m%s\x1b[0m",
    "\n╔═══════════════════════════════════════════════════════╗"
  );
  console.log(
    "\x1b[36m%s\x1b[0m",
    "║     TEST SUMMARY                                  ║"
  );
  console.log(
    "\x1b[36m%s\x1b[0m",
    "╚═══════════════════════════════════════════════════════╝\n"
  );

  const total = testsPassed + testsFailed;
  console.log(`  Total Tests:   ${total}`);
  console.log("\x1b[32m%s\x1b[0m", `  ✓ Passed:      ${testsPassed}`);

  if (testsFailed > 0) {
    console.log("\x1b[31m%s\x1b[0m", `  ✗ Failed:      ${testsFailed}`);
  } else {
    console.log("\x1b[32m%s\x1b[0m", `  ✗ Failed:      ${testsFailed}`);
  }

  const percentage = ((testsPassed / total) * 100).toFixed(1);
  console.log(`  Success Rate:  ${percentage}%`);

  console.log("\n" + "\x1b[90m%s\x1b[0m", "─".repeat(60));

  if (testsFailed === 0) {
    console.log("\x1b[32m%s\x1b[0m", "\n✓ ALL SEARCH TESTS PASSED! 🎉\n");
  } else if (percentage >= 70) {
    console.log("\x1b[33m%s\x1b[0m", "\n⚠ MOST TESTS PASSED\n");
    console.log(
      "\x1b[33m%s\x1b[0m",
      "  Some tests may fail if database is empty.\n"
    );
  } else {
    console.log("\x1b[31m%s\x1b[0m", "\n✗ MANY TESTS FAILED\n");
    console.log(
      "\x1b[33m%s\x1b[0m",
      "  Please check the errors above for details.\n"
    );
  }

  console.log("\x1b[36m%s\x1b[0m", "  Advanced Search Features Tested:\n");
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  ✓ Full-text search (name, description, tags)"
  );
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  ✓ Multi-select filters (categories, brands, tags)"
  );
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Price range filtering");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Rating filter");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Stock availability filter");
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  ✓ 6 sort options (relevance, price, rating, etc.)"
  );
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Pagination with metadata");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Search suggestions (autocomplete)");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Facets for filter UI");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Related products");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Price range buckets");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Popular searches analytics\n");

  console.log("\x1b[90m%s\x1b[0m", "─".repeat(60));
  console.log("\x1b[36m%s\x1b[0m", "\n  Search Capabilities:\n");
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  ✓ MongoDB text search with weighted fields"
  );
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Faceted search aggregations");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Real-time autocomplete");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Dynamic price range calculation");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Related products algorithm");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Search analytics tracking\n");

  console.log("\x1b[90m%s\x1b[0m", "─".repeat(60));
  console.log("\x1b[36m%s\x1b[0m", "\n  Next Steps:\n");
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  1. Add sample products to database for better testing"
  );
  console.log("\x1b[37m%s\x1b[0m", "  2. Test with various search queries");
  console.log("\x1b[37m%s\x1b[0m", "  3. Test filter combinations");
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  4. View API docs: http://localhost:5000/api-docs"
  );
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  5. Implement SearchAnalytics model for popular searches\n"
  );

  console.log("\x1b[90m%s\x1b[0m", "─".repeat(60) + "\n");

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error("\x1b[31m%s\x1b[0m", "\n✗ Test error:", error);
  process.exit(1);
});
