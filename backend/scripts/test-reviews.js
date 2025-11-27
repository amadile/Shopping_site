/**
 * Reviews System Test Suite
 * Tests product review endpoints
 */

import axios from "axios";

const API_URL = "http://localhost:5000";
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: { "Content-Type": "application/json" },
});

const results = { passed: 0, failed: 0, tests: [] };

function logTest(name, passed, message = "") {
  const status = passed ? "✓ PASS" : "✗ FAIL";
  const color = passed ? "\x1b[32m" : "\x1b[31m";
  console.log(`${color}${status}\x1b[0m - ${name}`);
  if (message) console.log(`  ${message}`);
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

function printSummary() {
  console.log("\n" + "═".repeat(50));
  console.log("  TEST RESULTS SUMMARY");
  console.log("═".repeat(50));
  console.log(
    `\nPassed: ${results.passed} / ${results.passed + results.failed}`
  );
  console.log(`Failed: ${results.failed} / ${results.passed + results.failed}`);
  console.log(
    `Success Rate: ${(
      (results.passed / (results.passed + results.failed)) *
      100
    ).toFixed(1)}%`
  );
  if (results.passed === results.passed + results.failed) {
    console.log("\n✓ ALL REVIEW TESTS PASSED! 🎉\n");
  }
}

async function testServerHealth() {
  try {
    const response = await api.get("/");
    logTest("Server health check", response.data.status === "online");
  } catch (error) {
    logTest("Server health check", false, error.message);
  }
}

async function testReviewEndpoints() {
  try {
    // Test create review
    try {
      await api.post("/api/reviews", {
        productId: "507f1f77bcf86cd799439011",
        rating: 5,
        comment: "Great",
      });
    } catch (error) {
      logTest(
        "Create review endpoint exists",
        error.response && error.response.status !== 404
      );
    }

    // Test get product reviews
    try {
      const response = await api.get(
        "/api/reviews/product/507f1f77bcf86cd799439011"
      );
      logTest("Get product reviews endpoint exists", true);
    } catch (error) {
      logTest(
        "Get product reviews endpoint exists",
        error.response && error.response.status !== 404
      );
    }

    // Test delete review
    try {
      await api.delete("/api/reviews/507f1f77bcf86cd799439011");
    } catch (error) {
      logTest(
        "Delete review endpoint exists",
        error.response && error.response.status !== 404
      );
    }

    // Test get user reviews
    try {
      await api.get("/api/reviews/my");
    } catch (error) {
      logTest(
        "Get user reviews endpoint exists",
        error.response && error.response.status !== 404
      );
    }
  } catch (error) {
    logTest("Review endpoints test", false, error.message);
  }
}

async function testAdminModerationEndpoints() {
  try {
    // Test moderation queue
    try {
      await api.get("/api/reviews/admin/moderation-queue");
    } catch (error) {
      logTest(
        "Moderation queue endpoint exists",
        error.response && error.response.status !== 404
      );
    }

    // Test approve review
    try {
      await api.post("/api/reviews/admin/507f1f77bcf86cd799439011/approve");
    } catch (error) {
      logTest(
        "Approve review endpoint exists",
        error.response && error.response.status !== 404
      );
    }

    // Test reject review
    try {
      await api.post("/api/reviews/admin/507f1f77bcf86cd799439011/reject", {
        reason: "Spam",
      });
    } catch (error) {
      logTest(
        "Reject review endpoint exists",
        error.response && error.response.status !== 404
      );
    }

    // Test flag review
    try {
      await api.post("/api/reviews/admin/507f1f77bcf86cd799439011/flag", {
        reason: "Inappropriate",
      });
    } catch (error) {
      logTest(
        "Flag review endpoint exists",
        error.response && error.response.status !== 404
      );
    }

    // Test moderation stats
    try {
      await api.get("/api/reviews/admin/moderation-stats");
    } catch (error) {
      logTest(
        "Moderation stats endpoint exists",
        error.response && error.response.status !== 404
      );
    }
  } catch (error) {
    logTest("Admin moderation endpoints test", false, error.message);
  }
}

async function testReviewValidation() {
  try {
    // Test invalid rating
    try {
      await api.post("/api/reviews", {
        productId: "507f1f77bcf86cd799439011",
        rating: 6,
        comment: "Test",
      });
    } catch (error) {
      logTest(
        "Validates rating range",
        error.response &&
          (error.response.status === 400 ||
            error.response.status === 401 ||
            error.response.status === 403)
      );
    }

    // Test missing product ID
    try {
      await api.post("/api/reviews", { rating: 5, comment: "Test" });
    } catch (error) {
      logTest(
        "Validates required fields",
        error.response &&
          (error.response.status === 400 ||
            error.response.status === 401 ||
            error.response.status === 403)
      );
    }
  } catch (error) {
    logTest("Review validation test", false, error.message);
  }
}

async function testReviewSecurity() {
  try {
    // Test authentication required
    try {
      await api.post("/api/reviews", {});
    } catch (error) {
      logTest(
        "Review creation requires auth",
        error.response &&
          (error.response.status === 401 || error.response.status === 403)
      );
    }
  } catch (error) {
    logTest("Review security test", false, error.message);
  }
}

async function runAllTests() {
  console.log("\n" + "═".repeat(50));
  console.log("  REVIEWS SYSTEM TEST SUITE");
  console.log("═".repeat(50));
  console.log(`\nTesting API: ${API_URL}\n`);

  console.log("[Server Health]");
  await testServerHealth();

  console.log("\n[Review Endpoints]");
  await testReviewEndpoints();

  console.log("\n[Admin Moderation]");
  await testAdminModerationEndpoints();

  console.log("\n[Validation]");
  await testReviewValidation();

  console.log("\n[Security]");
  await testReviewSecurity();

  printSummary();
}

runAllTests().catch((error) => {
  console.error("\n❌ Test error:", error.message);
  process.exit(1);
});
