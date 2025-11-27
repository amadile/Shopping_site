#!/usr/bin/env node

/**
 * Simple Vendor Portal Endpoint Test
 * Tests that all endpoints exist and return proper status codes
 */

import http from "http";

const BASE_URL = "http://localhost:5000";

console.log("\n🧪 VENDOR PORTAL - ENDPOINT AVAILABILITY TEST\n");
console.log("Testing at:", BASE_URL);
console.log("─".repeat(60), "\n");

function makeRequest(path) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const req = http.request(url, { method: "GET" }, (res) => {
      resolve(res.statusCode);
    });
    req.on("error", reject);
    req.end();
  });
}

async function testEndpoints() {
  const endpoints = [
    "/api/vendor/profile",
    "/api/vendor/dashboard",
    "/api/vendor/orders",
    "/api/vendor/products",
    "/api/vendor/analytics",
    "/api/vendor/payouts",
    "/api/vendor/sales-report",
    "/api/vendor/admin/all",
    "/api/payout/admin/pending",
    "/api/payout/admin/all",
    "/api/payout/admin/statistics",
  ];

  let allExist = true;

  for (const endpoint of endpoints) {
    try {
      const status = await makeRequest(endpoint);
      const exists = status !== 404;
      const symbol = exists ? "✅" : "❌";
      const color = exists ? "\x1b[32m" : "\x1b[31m";
      const reset = "\x1b[0m";

      console.log(
        `${color}${symbol}${reset} ${endpoint.padEnd(45)} (${status})`
      );

      if (!exists) allExist = false;
    } catch (error) {
      console.log(`❌ ${endpoint.padEnd(45)} (ERROR)`);
      allExist = false;
    }
  }

  console.log("\n" + "─".repeat(60));

  if (allExist) {
    console.log("\n✅ SUCCESS: All Vendor Portal endpoints are available!\n");
    console.log("Status codes explained:");
    console.log("  • 401 = Unauthorized (correct - needs auth token)");
    console.log("  • 403 = Forbidden (correct - needs admin role)");
    console.log("  • 200 = OK (would need valid authentication)\n");
    console.log("Next steps:");
    console.log("  1. Create user account and get JWT token");
    console.log("  2. Register as vendor");
    console.log("  3. Test full functionality with valid tokens\n");
    console.log("View API docs: http://localhost:5000/api-docs\n");
    return true;
  } else {
    console.log("\n❌ FAILURE: Some endpoints are missing!\n");
    return false;
  }
}

testEndpoints()
  .then((success) => process.exit(success ? 0 : 1))
  .catch((error) => {
    console.error("\n❌ ERROR:", error.message);
    console.log("\nMake sure the server is running: npm start\n");
    process.exit(1);
  });
