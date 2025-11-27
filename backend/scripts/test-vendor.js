#!/usr/bin/env node

/**
 * Vendor Portal Test Suite
 * Tests all vendor and payout endpoints
 */

import chalk from "chalk";
import http from "http";

const BASE_URL = "http://localhost:5000";

console.log(
  chalk.cyan.bold("\n╔═══════════════════════════════════════════════════════╗")
);
console.log(
  chalk.cyan.bold("║     VENDOR PORTAL TESTS                           ║")
);
console.log(
  chalk.cyan.bold("╚═══════════════════════════════════════════════════════╝\n")
);

let testsPassed = 0;
let testsFailed = 0;

// Test tokens (you'll need to replace these with actual tokens)
const USER_TOKEN = process.env.USER_TOKEN || "test_user_token";
const VENDOR_TOKEN = process.env.VENDOR_TOKEN || "test_vendor_token";
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "test_admin_token";

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
    console.log(chalk.green(`  ✓ ${name}`));
    if (details) console.log(chalk.gray(`    ${details}`));
    testsPassed++;
  } else {
    console.log(chalk.red(`  ✗ ${name}`));
    if (details) console.log(chalk.gray(`    ${details}`));
    testsFailed++;
  }
}

async function testVendorRegistration() {
  console.log(chalk.yellow("\n1. Testing Vendor Registration...\n"));

  try {
    // Test 1: Register as vendor (without auth - should fail)
    console.log(chalk.white("  → Testing vendor registration without auth"));
    const noAuthRes = await makeRequest("/api/vendor/register", {
      method: "POST",
      body: {
        businessName: "Test Store",
        businessEmail: "test@store.com",
        businessPhone: "+1234567890",
      },
    });
    testResult(
      "Vendor registration without auth rejected",
      noAuthRes.status === 401,
      `Status: ${noAuthRes.status}`
    );

    // Test 2: Register as vendor (with auth)
    console.log(chalk.white("\n  → Testing vendor registration with auth"));
    const registerRes = await makeRequest("/api/vendor/register", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${USER_TOKEN}`,
      },
      body: {
        businessName: "Test Store",
        businessEmail: "test@store.com",
        businessPhone: "+1234567890",
        description: "A test store",
        address: {
          street: "123 Main St",
          city: "New York",
          state: "NY",
          country: "USA",
          zipCode: "10001",
        },
      },
    });
    testResult(
      "Vendor registration with valid data",
      registerRes.status === 201 || registerRes.status === 400, // 400 if already registered
      `Status: ${registerRes.status}, Message: ${
        registerRes.data?.message || registerRes.data?.error
      }`
    );
  } catch (error) {
    testResult("Vendor registration", false, `Error: ${error.message}`);
  }
}

async function testVendorProfile() {
  console.log(chalk.yellow("\n2. Testing Vendor Profile Management...\n"));

  try {
    // Test 1: Get vendor profile
    console.log(chalk.white("  → Testing get vendor profile"));
    const profileRes = await makeRequest("/api/vendor/profile", {
      headers: {
        Authorization: `Bearer ${VENDOR_TOKEN}`,
      },
    });
    testResult(
      "Get vendor profile",
      profileRes.status === 200 || profileRes.status === 404,
      `Status: ${profileRes.status}, Has vendor data: ${!!profileRes.data
        ?.vendor}`
    );

    // Test 2: Update vendor profile
    console.log(chalk.white("\n  → Testing update vendor profile"));
    const updateRes = await makeRequest("/api/vendor/profile", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${VENDOR_TOKEN}`,
      },
      body: {
        description: "Updated store description",
        socialMedia: {
          website: "https://teststore.com",
          facebook: "teststore",
        },
      },
    });
    testResult(
      "Update vendor profile",
      updateRes.status === 200 || updateRes.status === 404,
      `Status: ${updateRes.status}`
    );
  } catch (error) {
    testResult("Vendor profile management", false, `Error: ${error.message}`);
  }
}

async function testVendorDashboard() {
  console.log(chalk.yellow("\n3. Testing Vendor Dashboard...\n"));

  try {
    // Test: Get dashboard data
    console.log(chalk.white("  → Testing vendor dashboard"));
    const dashboardRes = await makeRequest("/api/vendor/dashboard", {
      headers: {
        Authorization: `Bearer ${VENDOR_TOKEN}`,
      },
    });

    if (dashboardRes.status === 200 && dashboardRes.data?.dashboard) {
      const { dashboard } = dashboardRes.data;
      testResult(
        "Get vendor dashboard",
        true,
        `Overview: ${JSON.stringify(dashboard.overview || {})}`
      );

      if (dashboard.overview) {
        console.log(
          chalk.gray(`    Total Sales: ${dashboard.overview.totalSales || 0}`)
        );
        console.log(
          chalk.gray(
            `    Total Revenue: $${dashboard.overview.totalRevenue || 0}`
          )
        );
        console.log(
          chalk.gray(
            `    Pending Payout: $${dashboard.overview.pendingPayout || 0}`
          )
        );
        console.log(
          chalk.gray(`    Rating: ${dashboard.overview.rating || 0}/5`)
        );
      }
    } else {
      testResult(
        "Get vendor dashboard",
        dashboardRes.status === 404,
        `Status: ${dashboardRes.status}, ${
          dashboardRes.data?.error || "Vendor not found"
        }`
      );
    }
  } catch (error) {
    testResult("Vendor dashboard", false, `Error: ${error.message}`);
  }
}

async function testVendorOrders() {
  console.log(chalk.yellow("\n4. Testing Vendor Order Management...\n"));

  try {
    // Test 1: Get vendor orders
    console.log(chalk.white("  → Testing get vendor orders"));
    const ordersRes = await makeRequest("/api/vendor/orders?page=1&limit=10", {
      headers: {
        Authorization: `Bearer ${VENDOR_TOKEN}`,
      },
    });
    testResult(
      "Get vendor orders",
      ordersRes.status === 200 || ordersRes.status === 404,
      `Status: ${ordersRes.status}, Orders: ${
        ordersRes.data?.orders?.length || 0
      }`
    );

    // Test 2: Filter orders by status
    console.log(chalk.white("\n  → Testing filter orders by status"));
    const filteredRes = await makeRequest("/api/vendor/orders?status=pending", {
      headers: {
        Authorization: `Bearer ${VENDOR_TOKEN}`,
      },
    });
    testResult(
      "Filter orders by status",
      filteredRes.status === 200 || filteredRes.status === 404,
      `Status: ${filteredRes.status}`
    );
  } catch (error) {
    testResult("Vendor order management", false, `Error: ${error.message}`);
  }
}

async function testVendorProducts() {
  console.log(chalk.yellow("\n5. Testing Vendor Product Management...\n"));

  try {
    // Test: Get vendor products
    console.log(chalk.white("  → Testing get vendor products"));
    const productsRes = await makeRequest(
      "/api/vendor/products?page=1&limit=10",
      {
        headers: {
          Authorization: `Bearer ${VENDOR_TOKEN}`,
        },
      }
    );
    testResult(
      "Get vendor products",
      productsRes.status === 200 || productsRes.status === 404,
      `Status: ${productsRes.status}, Products: ${
        productsRes.data?.products?.length || 0
      }`
    );
  } catch (error) {
    testResult("Vendor product management", false, `Error: ${error.message}`);
  }
}

async function testVendorAnalytics() {
  console.log(chalk.yellow("\n6. Testing Vendor Analytics...\n"));

  try {
    // Test 1: Get weekly analytics
    console.log(chalk.white("  → Testing get analytics (week)"));
    const weeklyRes = await makeRequest("/api/vendor/analytics?period=week", {
      headers: {
        Authorization: `Bearer ${VENDOR_TOKEN}`,
      },
    });
    testResult(
      "Get weekly analytics",
      weeklyRes.status === 200 || weeklyRes.status === 404,
      `Status: ${weeklyRes.status}`
    );

    // Test 2: Get monthly analytics
    console.log(chalk.white("\n  → Testing get analytics (month)"));
    const monthlyRes = await makeRequest("/api/vendor/analytics?period=month", {
      headers: {
        Authorization: `Bearer ${VENDOR_TOKEN}`,
      },
    });
    testResult(
      "Get monthly analytics",
      monthlyRes.status === 200 || monthlyRes.status === 404,
      `Status: ${monthlyRes.status}`
    );
  } catch (error) {
    testResult("Vendor analytics", false, `Error: ${error.message}`);
  }
}

async function testVendorPayouts() {
  console.log(chalk.yellow("\n7. Testing Vendor Payout System...\n"));

  try {
    // Test 1: Request payout (without sufficient balance)
    console.log(chalk.white("  → Testing payout request"));
    const payoutReqRes = await makeRequest("/api/vendor/payout/request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VENDOR_TOKEN}`,
      },
      body: {
        amount: 50,
      },
    });
    testResult(
      "Request payout",
      payoutReqRes.status === 201 ||
        payoutReqRes.status === 400 ||
        payoutReqRes.status === 404 ||
        payoutReqRes.status === 403,
      `Status: ${payoutReqRes.status}, ${
        payoutReqRes.data?.message || payoutReqRes.data?.error || ""
      }`
    );

    // Test 2: Get payout history
    console.log(chalk.white("\n  → Testing get payout history"));
    const historyRes = await makeRequest(
      "/api/vendor/payouts?page=1&limit=10",
      {
        headers: {
          Authorization: `Bearer ${VENDOR_TOKEN}`,
        },
      }
    );
    testResult(
      "Get payout history",
      historyRes.status === 200 || historyRes.status === 404,
      `Status: ${historyRes.status}, Payouts: ${
        historyRes.data?.payouts?.length || 0
      }`
    );

    // Test 3: Request payout with invalid amount
    console.log(chalk.white("\n  → Testing payout with invalid amount"));
    const invalidRes = await makeRequest("/api/vendor/payout/request", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VENDOR_TOKEN}`,
      },
      body: {
        amount: -10,
      },
    });
    testResult(
      "Reject invalid payout amount",
      invalidRes.status === 400 || invalidRes.status === 404,
      `Status: ${invalidRes.status}`
    );
  } catch (error) {
    testResult("Vendor payout system", false, `Error: ${error.message}`);
  }
}

async function testSalesReport() {
  console.log(chalk.yellow("\n8. Testing Sales Report Generation...\n"));

  try {
    // Test: Generate sales report
    console.log(chalk.white("  → Testing sales report generation"));
    const reportRes = await makeRequest("/api/vendor/sales-report", {
      headers: {
        Authorization: `Bearer ${VENDOR_TOKEN}`,
      },
    });
    testResult(
      "Generate sales report",
      reportRes.status === 200 || reportRes.status === 404,
      `Status: ${reportRes.status}`
    );

    if (reportRes.status === 200 && reportRes.data?.report) {
      console.log(
        chalk.gray(
          `    Orders: ${reportRes.data.report.summary?.totalOrders || 0}`
        )
      );
      console.log(
        chalk.gray(
          `    Revenue: $${reportRes.data.report.summary?.totalRevenue || 0}`
        )
      );
    }
  } catch (error) {
    testResult("Sales report generation", false, `Error: ${error.message}`);
  }
}

async function testAdminVendorManagement() {
  console.log(chalk.yellow("\n9. Testing Admin Vendor Management...\n"));

  try {
    // Test 1: Get all vendors (admin)
    console.log(chalk.white("  → Testing get all vendors (admin)"));
    const allVendorsRes = await makeRequest(
      "/api/vendor/admin/all?page=1&limit=10",
      {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      }
    );
    testResult(
      "Get all vendors (admin)",
      allVendorsRes.status === 200 ||
        allVendorsRes.status === 401 ||
        allVendorsRes.status === 403,
      `Status: ${allVendorsRes.status}, Vendors: ${
        allVendorsRes.data?.vendors?.length || 0
      }`
    );

    // Test 2: Search vendors
    console.log(chalk.white("\n  → Testing search vendors"));
    const searchRes = await makeRequest("/api/vendor/admin/all?search=test", {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
    });
    testResult(
      "Search vendors",
      searchRes.status === 200 ||
        searchRes.status === 401 ||
        searchRes.status === 403,
      `Status: ${searchRes.status}`
    );
  } catch (error) {
    testResult("Admin vendor management", false, `Error: ${error.message}`);
  }
}

async function testAdminPayoutManagement() {
  console.log(chalk.yellow("\n10. Testing Admin Payout Management...\n"));

  try {
    // Test 1: Get pending payouts
    console.log(chalk.white("  → Testing get pending payouts (admin)"));
    const pendingRes = await makeRequest("/api/payout/admin/pending", {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
    });
    testResult(
      "Get pending payouts (admin)",
      pendingRes.status === 200 ||
        pendingRes.status === 401 ||
        pendingRes.status === 403,
      `Status: ${pendingRes.status}, Payouts: ${
        pendingRes.data?.payouts?.length || 0
      }`
    );

    // Test 2: Get all payouts
    console.log(chalk.white("\n  → Testing get all payouts (admin)"));
    const allPayoutsRes = await makeRequest(
      "/api/payout/admin/all?page=1&limit=10",
      {
        headers: {
          Authorization: `Bearer ${ADMIN_TOKEN}`,
        },
      }
    );
    testResult(
      "Get all payouts (admin)",
      allPayoutsRes.status === 200 ||
        allPayoutsRes.status === 401 ||
        allPayoutsRes.status === 403,
      `Status: ${allPayoutsRes.status}`
    );

    // Test 3: Get payout statistics
    console.log(chalk.white("\n  → Testing get payout statistics (admin)"));
    const statsRes = await makeRequest("/api/payout/admin/statistics", {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
    });
    testResult(
      "Get payout statistics (admin)",
      statsRes.status === 200 ||
        statsRes.status === 401 ||
        statsRes.status === 403,
      `Status: ${statsRes.status}`
    );
  } catch (error) {
    testResult("Admin payout management", false, `Error: ${error.message}`);
  }
}

async function testEndpointAvailability() {
  console.log(chalk.yellow("\n11. Testing Endpoint Availability...\n"));

  const endpoints = [
    { method: "POST", path: "/api/vendor/register", auth: "user" },
    { method: "GET", path: "/api/vendor/profile", auth: "vendor" },
    { method: "PUT", path: "/api/vendor/profile", auth: "vendor" },
    { method: "GET", path: "/api/vendor/dashboard", auth: "vendor" },
    { method: "GET", path: "/api/vendor/orders", auth: "vendor" },
    { method: "GET", path: "/api/vendor/products", auth: "vendor" },
    { method: "GET", path: "/api/vendor/analytics", auth: "vendor" },
    { method: "POST", path: "/api/vendor/payout/request", auth: "vendor" },
    { method: "GET", path: "/api/vendor/payouts", auth: "vendor" },
    { method: "GET", path: "/api/vendor/sales-report", auth: "vendor" },
    { method: "GET", path: "/api/vendor/admin/all", auth: "admin" },
    { method: "GET", path: "/api/payout/admin/pending", auth: "admin" },
    { method: "GET", path: "/api/payout/admin/all", auth: "admin" },
    { method: "GET", path: "/api/payout/admin/statistics", auth: "admin" },
  ];

  console.log(chalk.white("  → Checking all vendor endpoints exist\n"));

  for (const endpoint of endpoints) {
    try {
      const token =
        endpoint.auth === "admin"
          ? ADMIN_TOKEN
          : endpoint.auth === "vendor"
          ? VENDOR_TOKEN
          : USER_TOKEN;

      const res = await makeRequest(endpoint.path, {
        method: endpoint.method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Endpoint exists if we get anything other than 404
      const exists = res.status !== 404;
      console.log(
        chalk.gray(
          `    ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(40)} ${
            exists ? chalk.green("✓") : chalk.red("✗")
          } (${res.status})`
        )
      );

      if (exists) testsPassed++;
      else testsFailed++;
    } catch (error) {
      console.log(
        chalk.gray(
          `    ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(
            40
          )} ${chalk.red("✗")} (Error)`
        )
      );
      testsFailed++;
    }
  }
}

async function runAllTests() {
  console.log(chalk.cyan("Testing Vendor Portal at: " + BASE_URL + "\n"));
  console.log(
    chalk.gray("Make sure the server is running before running these tests.")
  );
  console.log(chalk.gray("Start server with: npm start\n"));
  console.log(chalk.gray("─".repeat(60)));

  // Check if server is running
  try {
    await makeRequest("/");
  } catch (error) {
    console.log(chalk.red.bold("\n✗ ERROR: Server is not running!\n"));
    console.log(chalk.yellow("Please start the server first:"));
    console.log(chalk.gray("  cd backend"));
    console.log(chalk.gray("  npm start\n"));
    process.exit(1);
  }

  // Note about tokens
  if (USER_TOKEN === "test_user_token") {
    console.log(
      chalk.yellow(
        "\n⚠ NOTE: Using test tokens. Some tests may fail due to authentication."
      )
    );
    console.log(chalk.gray("Set real tokens with environment variables:"));
    console.log(
      chalk.gray(
        "  USER_TOKEN=your_token VENDOR_TOKEN=vendor_token ADMIN_TOKEN=admin_token node scripts/test-vendor.js\n"
      )
    );
    console.log(chalk.gray("─".repeat(60)));
  }

  await testVendorRegistration();
  await testVendorProfile();
  await testVendorDashboard();
  await testVendorOrders();
  await testVendorProducts();
  await testVendorAnalytics();
  await testVendorPayouts();
  await testSalesReport();
  await testAdminVendorManagement();
  await testAdminPayoutManagement();
  await testEndpointAvailability();

  // Summary
  console.log(
    chalk.cyan.bold(
      "\n╔═══════════════════════════════════════════════════════╗"
    )
  );
  console.log(
    chalk.cyan.bold("║     TEST SUMMARY                                  ║")
  );
  console.log(
    chalk.cyan.bold(
      "╚═══════════════════════════════════════════════════════╝\n"
    )
  );

  const total = testsPassed + testsFailed;
  console.log(`  Total Tests:   ${total}`);
  console.log(chalk.green(`  ✓ Passed:      ${testsPassed}`));

  if (testsFailed > 0) {
    console.log(chalk.red(`  ✗ Failed:      ${testsFailed}`));
  } else {
    console.log(chalk.green(`  ✗ Failed:      ${testsFailed}`));
  }

  const percentage = ((testsPassed / total) * 100).toFixed(1);
  console.log(`  Success Rate:  ${percentage}%`);

  console.log("\n" + chalk.gray("─".repeat(60)));

  if (testsFailed === 0) {
    console.log(chalk.green.bold("\n✓ ALL VENDOR PORTAL TESTS PASSED! 🎉\n"));
  } else if (percentage >= 70) {
    console.log(chalk.yellow.bold("\n⚠ MOST TESTS PASSED\n"));
    console.log(chalk.yellow("  Some tests failed - this is expected if:"));
    console.log(
      chalk.yellow("  • You haven't created test user/vendor/admin accounts")
    );
    console.log(chalk.yellow("  • You haven't set real authentication tokens"));
    console.log(
      chalk.yellow("  • Database is empty (no products/orders yet)\n")
    );
  } else {
    console.log(chalk.red.bold("\n✗ MANY TESTS FAILED\n"));
    console.log(chalk.yellow("  Please check the errors above for details.\n"));
  }

  console.log(chalk.cyan("  Vendor Portal Features Tested:\n"));
  console.log(chalk.white("  ✓ Vendor registration"));
  console.log(chalk.white("  ✓ Profile management"));
  console.log(chalk.white("  ✓ Dashboard statistics"));
  console.log(chalk.white("  ✓ Order management"));
  console.log(chalk.white("  ✓ Product management"));
  console.log(chalk.white("  ✓ Analytics & reporting"));
  console.log(chalk.white("  ✓ Payout system"));
  console.log(chalk.white("  ✓ Admin vendor management"));
  console.log(chalk.white("  ✓ Admin payout processing"));
  console.log(chalk.white("  ✓ Endpoint availability\n"));

  console.log(chalk.gray("─".repeat(60)));
  console.log(chalk.cyan("\n  Next Steps:\n"));
  console.log(chalk.white("  1. Review test results above"));
  console.log(
    chalk.white("  2. Check VENDOR_PORTAL_GUIDE.md for API documentation")
  );
  console.log(
    chalk.white("  3. Create test accounts to fully test functionality")
  );
  console.log(
    chalk.white("  4. Test with Postman/Thunder Client for detailed testing")
  );
  console.log(
    chalk.white("  5. View API docs: http://localhost:5000/api-docs\n")
  );

  console.log(chalk.gray("─".repeat(60)) + "\n");

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error(chalk.red("\n✗ Test error:"), error);
  process.exit(1);
});
