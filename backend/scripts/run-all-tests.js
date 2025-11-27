/**
 * Complete Backend Test Runner
 * Runs all untested feature test suites
 */

import { spawn } from "child_process";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const testSuites = [
  { name: "Authentication & User", file: "test-auth.js", status: "✓ DONE" },
  { name: "Shopping Cart", file: "test-cart.js", status: "✓ DONE" },
  { name: "Orders", file: "test-orders.js", status: "✓ DONE" },
  { name: "Payment", file: "test-payment.js", status: "✓ DONE" },
  { name: "Reviews", file: "test-reviews.js", status: "✓ DONE" },
  { name: "Inventory", file: "test-inventory.js", status: "✓ DONE" },
  { name: "Analytics", file: "test-analytics.js", status: "✓ DONE" },
  { name: "Upload & CDN", file: "test-upload.js", status: "✓ DONE" },
  { name: "Admin Management", file: "test-admin.js", status: "✓ DONE" },
  { name: "Coupons", file: "test-coupons.js", status: "✓ EXISTS" },
  { name: "Vendor Portal", file: "test-vendor-simple.js", status: "✓ DONE" },
  { name: "Loyalty Program", file: "test-loyalty.js", status: "✓ DONE" },
  { name: "Search & Filters", file: "test-search.js", status: "✓ DONE" },
  {
    name: "Notifications",
    file: "test-notifications-simple.js",
    status: "✓ DONE",
  },
];

const results = {
  completed: [],
  failed: [],
  skipped: [],
};

function runTest(testFile) {
  return new Promise((resolve) => {
    console.log(`\n${"=".repeat(60)}`);
    console.log(`Running: ${testFile}`);
    console.log("=".repeat(60) + "\n");

    const testProcess = spawn("node", [path.join(__dirname, testFile)], {
      stdio: "inherit",
      shell: true,
    });

    testProcess.on("close", (code) => {
      if (code === 0) {
        results.completed.push(testFile);
        resolve({ testFile, success: true });
      } else {
        results.failed.push(testFile);
        resolve({ testFile, success: false });
      }
    });

    testProcess.on("error", (error) => {
      console.error(`Error running ${testFile}:`, error.message);
      results.failed.push(testFile);
      resolve({ testFile, success: false, error: error.message });
    });
  });
}

async function runAllTests() {
  console.log("\n" + "═".repeat(70));
  console.log("  COMPLETE BACKEND FEATURE TEST SUITE");
  console.log("═".repeat(70));
  console.log("\nStarted at:", new Date().toLocaleString());
  console.log("\nTest Suites Available:");
  testSuites.forEach((suite) => {
    console.log(
      `  ${suite.status.padEnd(10)} - ${suite.name.padEnd(25)} (${suite.file})`
    );
  });

  console.log("\n" + "─".repeat(70));

  // Run completed test suites
  console.log("\n[1/2] Running All Feature Test Suites");
  console.log("─".repeat(70));

  await runTest("test-auth.js");
  await runTest("test-cart.js");
  await runTest("test-orders.js");
  await runTest("test-payment.js");
  await runTest("test-reviews.js");
  await runTest("test-inventory.js");
  await runTest("test-analytics.js");
  await runTest("test-upload.js");
  await runTest("test-admin.js");

  // Check if new test files need to be created
  console.log("\n[2/2] Running Previously Created Tests");
  console.log("─".repeat(70));

  // Run existing tests
  const fs = await import("fs");
  const existingTests = [
    "test-vendor-simple.js",
    "test-loyalty.js",
    "test-search.js",
    "test-notifications-simple.js",
  ];

  for (const testFile of existingTests) {
    const testPath = path.join(__dirname, testFile);
    if (fs.existsSync(testPath)) {
      await runTest(testFile);
    } else {
      console.log(`\n⚠️  Skipping ${testFile} (file not found)`);
      results.skipped.push(testFile);
    }
  }

  // Print summary
  console.log("\n" + "═".repeat(70));
  console.log("  FINAL TEST RESULTS");
  console.log("═".repeat(70));

  console.log(`\n✓ Completed: ${results.completed.length}`);
  results.completed.forEach((test) => console.log(`  - ${test}`));

  if (results.failed.length > 0) {
    console.log(`\n✗ Failed: ${results.failed.length}`);
    results.failed.forEach((test) => console.log(`  - ${test}`));
  }

  if (results.skipped.length > 0) {
    console.log(`\n⚠️  Skipped: ${results.skipped.length}`);
    results.skipped.forEach((test) => console.log(`  - ${test}`));
  }

  console.log("\n" + "═".repeat(70));
  console.log("Completed at:", new Date().toLocaleString());
  console.log("═".repeat(70) + "\n");

  // Exit with appropriate code
  process.exit(results.failed.length > 0 ? 1 : 0);
}

// Run all tests
runAllTests().catch((error) => {
  console.error("\n❌ Test runner error:", error.message);
  process.exit(1);
});
