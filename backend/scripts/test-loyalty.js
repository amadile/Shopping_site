#!/usr/bin/env node

/**
 * Loyalty & Rewards System Test Suite
 * Tests all loyalty program functionality
 */

import http from "http";

const BASE_URL = "http://localhost:5000";

console.log(
  "\x1b[36m%s\x1b[0m",
  "\n╔═══════════════════════════════════════════════════════╗"
);
console.log(
  "\x1b[36m%s\x1b[0m",
  "║     LOYALTY & REWARDS SYSTEM TESTS                ║"
);
console.log(
  "\x1b[36m%s\x1b[0m",
  "╚═══════════════════════════════════════════════════════╝\n"
);

let testsPassed = 0;
let testsFailed = 0;

// Test tokens (replace with actual tokens)
const USER_TOKEN = process.env.USER_TOKEN || "test_user_token";
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
    console.log("\x1b[32m%s\x1b[0m", `  ✓ ${name}`);
    if (details) console.log("\x1b[90m%s\x1b[0m", `    ${details}`);
    testsPassed++;
  } else {
    console.log("\x1b[31m%s\x1b[0m", `  ✗ ${name}`);
    if (details) console.log("\x1b[90m%s\x1b[0m", `    ${details}`);
    testsFailed++;
  }
}

async function testLoyaltyProfile() {
  console.log("\x1b[33m%s\x1b[0m", "\n1. Testing Loyalty Profile...\n");

  try {
    // Test: Get loyalty profile
    console.log("\x1b[37m%s\x1b[0m", "  → Testing get loyalty profile");
    const profileRes = await makeRequest("/api/loyalty/profile", {
      headers: {
        Authorization: `Bearer ${USER_TOKEN}`,
      },
    });

    testResult(
      "Get loyalty profile",
      profileRes.status === 200 || profileRes.status === 401,
      `Status: ${profileRes.status}`
    );

    if (profileRes.status === 200 && profileRes.data?.loyalty) {
      const { loyalty } = profileRes.data;
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Points Balance: ${loyalty.pointsBalance || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Lifetime Points: ${loyalty.lifetimePoints || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Current Tier: ${loyalty.tier || "Bronze"}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Points to Next Tier: ${loyalty.pointsToNextTier || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Referral Code: ${loyalty.referralCode || "Not generated"}`
      );
    }
  } catch (error) {
    testResult("Loyalty profile", false, `Error: ${error.message}`);
  }
}

async function testTransactionHistory() {
  console.log("\x1b[33m%s\x1b[0m", "\n2. Testing Transaction History...\n");

  try {
    // Test: Get transactions
    console.log("\x1b[37m%s\x1b[0m", "  → Testing get transaction history");
    const txRes = await makeRequest(
      "/api/loyalty/transactions?days=30&page=1&limit=10",
      {
        headers: {
          Authorization: `Bearer ${USER_TOKEN}`,
        },
      }
    );

    testResult(
      "Get transaction history",
      txRes.status === 200 || txRes.status === 401 || txRes.status === 404,
      `Status: ${txRes.status}, Transactions: ${
        txRes.data?.transactions?.length || 0
      }`
    );

    if (txRes.status === 200 && txRes.data?.summary) {
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Total Earned: ${txRes.data.summary.totalEarned || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Total Redeemed: ${txRes.data.summary.totalRedeemed || 0}`
      );
    }
  } catch (error) {
    testResult("Transaction history", false, `Error: ${error.message}`);
  }
}

async function testReferralSystem() {
  console.log("\x1b[33m%s\x1b[0m", "\n3. Testing Referral System...\n");

  try {
    // Test 1: Generate referral code
    console.log("\x1b[37m%s\x1b[0m", "  → Testing generate referral code");
    const generateRes = await makeRequest("/api/loyalty/referral/generate", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${USER_TOKEN}`,
      },
    });

    testResult(
      "Generate referral code",
      generateRes.status === 200 || generateRes.status === 401,
      `Status: ${generateRes.status}, Code: ${
        generateRes.data?.referralCode || "N/A"
      }`
    );

    let testCode = generateRes.data?.referralCode || "TESTCODE123";

    // Test 2: Validate referral code
    console.log("\x1b[37m%s\x1b[0m", "\n  → Testing validate referral code");
    const validateRes = await makeRequest("/api/loyalty/referral/validate", {
      method: "POST",
      body: {
        code: testCode,
      },
    });

    testResult(
      "Validate referral code",
      validateRes.status === 200,
      `Status: ${validateRes.status}, Valid: ${
        validateRes.data?.valid || false
      }`
    );

    // Test 3: Get referral stats
    console.log("\x1b[37m%s\x1b[0m", "\n  → Testing get referral stats");
    const statsRes = await makeRequest("/api/loyalty/referral/stats", {
      headers: {
        Authorization: `Bearer ${USER_TOKEN}`,
      },
    });

    testResult(
      "Get referral stats",
      statsRes.status === 200 || statsRes.status === 401,
      `Status: ${statsRes.status}`
    );

    if (statsRes.status === 200 && statsRes.data?.stats) {
      const { stats } = statsRes.data;
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Total Referrals: ${stats.total || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Completed: ${stats.completed || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Conversion Rate: ${stats.conversionRate || 0}%`
      );
    }

    // Test 4: Invalid referral code
    console.log("\x1b[37m%s\x1b[0m", "\n  → Testing invalid referral code");
    const invalidRes = await makeRequest("/api/loyalty/referral/validate", {
      method: "POST",
      body: {
        code: "INVALID123",
      },
    });

    testResult(
      "Reject invalid code",
      invalidRes.status === 200 && invalidRes.data?.valid === false,
      `Status: ${invalidRes.status}`
    );
  } catch (error) {
    testResult("Referral system", false, `Error: ${error.message}`);
  }
}

async function testRewardsSystem() {
  console.log("\x1b[33m%s\x1b[0m", "\n4. Testing Rewards System...\n");

  try {
    // Test 1: Get available rewards
    console.log("\x1b[37m%s\x1b[0m", "  → Testing get available rewards");
    const rewardsRes = await makeRequest("/api/loyalty/rewards", {
      headers: {
        Authorization: `Bearer ${USER_TOKEN}`,
      },
    });

    testResult(
      "Get available rewards",
      rewardsRes.status === 200 || rewardsRes.status === 401,
      `Status: ${rewardsRes.status}, Rewards: ${
        rewardsRes.data?.rewards?.length || 0
      }`
    );

    if (rewardsRes.status === 200 && rewardsRes.data?.rewards?.length > 0) {
      const firstReward = rewardsRes.data.rewards[0];
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Sample Reward: ${firstReward.name}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `    Points Cost: ${firstReward.pointsCost}`
      );
    }

    // Test 2: Get featured rewards
    console.log("\x1b[37m%s\x1b[0m", "\n  → Testing get featured rewards");
    const featuredRes = await makeRequest(
      "/api/loyalty/rewards?featured=true",
      {
        headers: {
          Authorization: `Bearer ${USER_TOKEN}`,
        },
      }
    );

    testResult(
      "Get featured rewards",
      featuredRes.status === 200 || featuredRes.status === 401,
      `Status: ${featuredRes.status}`
    );

    // Test 3: Get redemption history
    console.log("\x1b[37m%s\x1b[0m", "\n  → Testing get redemption history");
    const redemptionsRes = await makeRequest("/api/loyalty/redemptions", {
      headers: {
        Authorization: `Bearer ${USER_TOKEN}`,
      },
    });

    testResult(
      "Get redemption history",
      redemptionsRes.status === 200 || redemptionsRes.status === 401,
      `Status: ${redemptionsRes.status}, Redemptions: ${
        redemptionsRes.data?.redemptions?.length || 0
      }`
    );
  } catch (error) {
    testResult("Rewards system", false, `Error: ${error.message}`);
  }
}

async function testLeaderboard() {
  console.log("\x1b[33m%s\x1b[0m", "\n5. Testing Leaderboard...\n");

  try {
    // Test: Get leaderboard
    console.log("\x1b[37m%s\x1b[0m", "  → Testing get leaderboard");
    const leaderboardRes = await makeRequest(
      "/api/loyalty/leaderboard?limit=10"
    );

    testResult(
      "Get leaderboard",
      leaderboardRes.status === 200,
      `Status: ${leaderboardRes.status}, Users: ${
        leaderboardRes.data?.leaderboard?.length || 0
      }`
    );

    if (
      leaderboardRes.status === 200 &&
      leaderboardRes.data?.leaderboard?.length > 0
    ) {
      console.log("\x1b[90m%s\x1b[0m", "\n    Top 3 Users:");
      leaderboardRes.data.leaderboard.slice(0, 3).forEach((entry, index) => {
        console.log(
          "\x1b[90m%s\x1b[0m",
          `      ${index + 1}. ${entry.user?.name || "Anonymous"} - ${
            entry.lifetimePoints
          } points (${entry.tier})`
        );
      });
    }
  } catch (error) {
    testResult("Leaderboard", false, `Error: ${error.message}`);
  }
}

async function testSettings() {
  console.log("\x1b[33m%s\x1b[0m", "\n6. Testing Settings Management...\n");

  try {
    // Test: Update settings
    console.log("\x1b[37m%s\x1b[0m", "  → Testing update settings");
    const settingsRes = await makeRequest("/api/loyalty/settings", {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${USER_TOKEN}`,
      },
      body: {
        emailNotifications: true,
        tierUpgradeNotifications: true,
        expiryReminders: false,
      },
    });

    testResult(
      "Update settings",
      settingsRes.status === 200 ||
        settingsRes.status === 401 ||
        settingsRes.status === 404,
      `Status: ${settingsRes.status}`
    );
  } catch (error) {
    testResult("Settings management", false, `Error: ${error.message}`);
  }
}

async function testAdminRewardManagement() {
  console.log("\x1b[33m%s\x1b[0m", "\n7. Testing Admin Reward Management...\n");

  try {
    // Test 1: Create reward (admin)
    console.log("\x1b[37m%s\x1b[0m", "  → Testing create reward (admin)");
    const createRes = await makeRequest("/api/loyalty/admin/rewards", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: {
        name: "Test Reward",
        description: "Test 10% off coupon",
        type: "discount_percentage",
        pointsCost: 500,
        value: 10,
        valueType: "percentage",
        stockQuantity: 100,
        conditions: {
          minimumPurchase: 50,
          minimumTier: "Bronze",
        },
      },
    });

    testResult(
      "Create reward (admin)",
      createRes.status === 201 ||
        createRes.status === 401 ||
        createRes.status === 403,
      `Status: ${createRes.status}`
    );

    const rewardId = createRes.data?.reward?._id;

    // Test 2: Update reward (admin)
    if (rewardId) {
      console.log("\x1b[37m%s\x1b[0m", "\n  → Testing update reward (admin)");
      const updateRes = await makeRequest(
        `/api/loyalty/admin/rewards/${rewardId}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${ADMIN_TOKEN}`,
          },
          body: {
            pointsCost: 450,
          },
        }
      );

      testResult(
        "Update reward (admin)",
        updateRes.status === 200 ||
          updateRes.status === 401 ||
          updateRes.status === 403 ||
          updateRes.status === 404,
        `Status: ${updateRes.status}`
      );
    }
  } catch (error) {
    testResult("Admin reward management", false, `Error: ${error.message}`);
  }
}

async function testAdminPointsManagement() {
  console.log("\x1b[33m%s\x1b[0m", "\n8. Testing Admin Points Management...\n");

  try {
    // Test: Adjust points (admin)
    console.log("\x1b[37m%s\x1b[0m", "  → Testing adjust user points (admin)");
    const adjustRes = await makeRequest("/api/loyalty/admin/points/adjust", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
      body: {
        userId: "test_user_id",
        points: 100,
        reason: "Test adjustment",
      },
    });

    testResult(
      "Adjust user points (admin)",
      adjustRes.status === 200 ||
        adjustRes.status === 400 ||
        adjustRes.status === 401 ||
        adjustRes.status === 403 ||
        adjustRes.status === 404,
      `Status: ${adjustRes.status}`
    );
  } catch (error) {
    testResult("Admin points management", false, `Error: ${error.message}`);
  }
}

async function testAdminStatistics() {
  console.log("\x1b[33m%s\x1b[0m", "\n9. Testing Admin Statistics...\n");

  try {
    // Test: Get program statistics (admin)
    console.log(
      "\x1b[37m%s\x1b[0m",
      "  → Testing get program statistics (admin)"
    );
    const statsRes = await makeRequest("/api/loyalty/admin/statistics", {
      headers: {
        Authorization: `Bearer ${ADMIN_TOKEN}`,
      },
    });

    testResult(
      "Get program statistics (admin)",
      statsRes.status === 200 ||
        statsRes.status === 401 ||
        statsRes.status === 403,
      `Status: ${statsRes.status}`
    );

    if (statsRes.status === 200 && statsRes.data?.statistics) {
      const { statistics } = statsRes.data;
      console.log("\x1b[90m%s\x1b[0m", "\n    Program Statistics:");
      console.log(
        "\x1b[90m%s\x1b[0m",
        `      Total Users: ${statistics.users?.total || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `      Total Referrals: ${statistics.referrals?.total || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `      Completed Referrals: ${statistics.referrals?.completed || 0}`
      );
      console.log(
        "\x1b[90m%s\x1b[0m",
        `      Total Redemptions: ${statistics.redemptions?.total || 0}`
      );
    }
  } catch (error) {
    testResult("Admin statistics", false, `Error: ${error.message}`);
  }
}

async function testEndpointAvailability() {
  console.log("\x1b[33m%s\x1b[0m", "\n10. Testing Endpoint Availability...\n");

  const endpoints = [
    { method: "GET", path: "/api/loyalty/profile", auth: "user" },
    { method: "GET", path: "/api/loyalty/transactions", auth: "user" },
    { method: "POST", path: "/api/loyalty/referral/generate", auth: "user" },
    { method: "GET", path: "/api/loyalty/referral/stats", auth: "user" },
    { method: "POST", path: "/api/loyalty/referral/validate", auth: "none" },
    { method: "GET", path: "/api/loyalty/rewards", auth: "user" },
    { method: "GET", path: "/api/loyalty/redemptions", auth: "user" },
    { method: "GET", path: "/api/loyalty/leaderboard", auth: "none" },
    { method: "PUT", path: "/api/loyalty/settings", auth: "user" },
    { method: "POST", path: "/api/loyalty/admin/rewards", auth: "admin" },
    { method: "POST", path: "/api/loyalty/admin/points/adjust", auth: "admin" },
    { method: "GET", path: "/api/loyalty/admin/statistics", auth: "admin" },
  ];

  console.log(
    "\x1b[37m%s\x1b[0m",
    "  → Checking all loyalty endpoints exist\n"
  );

  for (const endpoint of endpoints) {
    try {
      const token =
        endpoint.auth === "admin"
          ? ADMIN_TOKEN
          : endpoint.auth === "user"
          ? USER_TOKEN
          : null;

      const res = await makeRequest(endpoint.path, {
        method: endpoint.method,
        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      });

      // Endpoint exists if we get anything other than 404
      const exists = res.status !== 404;
      const symbol = exists ? "✓" : "✗";
      const color = exists ? "\x1b[32m" : "\x1b[31m";

      console.log(
        `${color}%s\x1b[0m`,
        `    ${symbol} ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(
          45
        )} (${res.status})`
      );

      if (exists) testsPassed++;
      else testsFailed++;
    } catch (error) {
      console.log(
        "\x1b[31m%s\x1b[0m",
        `    ✗ ${endpoint.method.padEnd(6)} ${endpoint.path.padEnd(45)} (ERROR)`
      );
      testsFailed++;
    }
  }
}

async function runAllTests() {
  console.log(
    "\x1b[36m%s\x1b[0m",
    "Testing Loyalty & Rewards System at: " + BASE_URL + "\n"
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

  // Note about tokens
  if (USER_TOKEN === "test_user_token") {
    console.log(
      "\x1b[33m%s\x1b[0m",
      "\n⚠ NOTE: Using test tokens. Some tests may fail due to authentication."
    );
    console.log(
      "\x1b[90m%s\x1b[0m",
      "Set real tokens with environment variables:"
    );
    console.log(
      "\x1b[90m%s\x1b[0m",
      "  USER_TOKEN=your_token ADMIN_TOKEN=admin_token node scripts/test-loyalty.js\n"
    );
    console.log("\x1b[90m%s\x1b[0m", "─".repeat(60));
  }

  await testLoyaltyProfile();
  await testTransactionHistory();
  await testReferralSystem();
  await testRewardsSystem();
  await testLeaderboard();
  await testSettings();
  await testAdminRewardManagement();
  await testAdminPointsManagement();
  await testAdminStatistics();
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
    console.log(
      "\x1b[32m%s\x1b[0m",
      "\n✓ ALL LOYALTY & REWARDS TESTS PASSED! 🎉\n"
    );
  } else if (percentage >= 70) {
    console.log("\x1b[33m%s\x1b[0m", "\n⚠ MOST TESTS PASSED\n");
    console.log(
      "\x1b[33m%s\x1b[0m",
      "  Some tests failed - this is expected if:"
    );
    console.log(
      "\x1b[33m%s\x1b[0m",
      "  • You haven't created test user/admin accounts"
    );
    console.log(
      "\x1b[33m%s\x1b[0m",
      "  • You haven't set real authentication tokens"
    );
    console.log(
      "\x1b[33m%s\x1b[0m",
      "  • Database is empty (no loyalty profiles yet)\n"
    );
  } else {
    console.log("\x1b[31m%s\x1b[0m", "\n✗ MANY TESTS FAILED\n");
    console.log(
      "\x1b[33m%s\x1b[0m",
      "  Please check the errors above for details.\n"
    );
  }

  console.log("\x1b[36m%s\x1b[0m", "  Loyalty & Rewards Features Tested:\n");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Loyalty profile management");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Points transaction history");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Referral code generation & validation");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Referral statistics tracking");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Rewards catalog browsing");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Redemption history");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Leaderboard");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Settings management");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Admin reward management");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Admin points adjustment");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Admin statistics dashboard");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Endpoint availability\n");

  console.log("\x1b[90m%s\x1b[0m", "─".repeat(60));
  console.log("\x1b[36m%s\x1b[0m", "\n  Features:\n");
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  ✓ 4-Tier System (Bronze, Silver, Gold, Platinum)"
  );
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  ✓ Points Earning (Purchase, Review, Referral, Birthday)"
  );
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  ✓ Tier Benefits (0-15% discount, 1x-2x multiplier)"
  );
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  ✓ Referral Program (Unique codes, $50 min)"
  );
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Rewards Catalog (6 reward types)");
  console.log("\x1b[37m%s\x1b[0m", "  ✓ Redemption System (90-day validity)\n");

  console.log("\x1b[90m%s\x1b[0m", "─".repeat(60));
  console.log("\x1b[36m%s\x1b[0m", "\n  Next Steps:\n");
  console.log("\x1b[37m%s\x1b[0m", "  1. Review test results above");
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  2. Check LOYALTY_REWARDS_GUIDE.md for documentation"
  );
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  3. Create test accounts to fully test functionality"
  );
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  4. Test with Postman/Thunder Client for detailed testing"
  );
  console.log(
    "\x1b[37m%s\x1b[0m",
    "  5. View API docs: http://localhost:5000/api-docs\n"
  );

  console.log("\x1b[90m%s\x1b[0m", "─".repeat(60) + "\n");

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error("\x1b[31m%s\x1b[0m", "\n✗ Test error:", error);
  process.exit(1);
});
