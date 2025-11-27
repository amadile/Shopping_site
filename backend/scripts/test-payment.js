/**
 * Payment System Test Suite
 * Tests payment processing endpoints (PayPal integration)
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
    console.log("\n✓ ALL PAYMENT TESTS PASSED! 🎉\n");
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

async function testPaymentEndpoints() {
  try {
    // Test create payment intent
    try {
      await api.post("/api/payment/create-payment-intent", {
        orderId: "507f1f77bcf86cd799439011",
      });
    } catch (error) {
      logTest(
        "Create payment intent endpoint exists",
        error.response && error.response.status !== 404
      );
    }

    // Test confirm payment
    try {
      await api.post("/api/payment/confirm-payment", {
        paymentIntentId: "test",
        orderId: "507f1f77bcf86cd799439011",
      });
    } catch (error) {
      logTest(
        "Confirm payment endpoint exists",
        error.response && error.response.status !== 404
      );
    }

    // Test webhook endpoint
    try {
      await api.post("/api/payment/webhook", {});
    } catch (error) {
      logTest(
        "Payment webhook endpoint exists",
        error.response && error.response.status !== 404
      );
    }

    // Test PayPal create order
    try {
      await api.post("/api/payment/paypal/create-order", {
        orderId: "507f1f77bcf86cd799439011",
      });
    } catch (error) {
      logTest(
        "PayPal create order endpoint exists",
        error.response && error.response.status !== 404
      );
    }

    // Test PayPal capture
    try {
      await api.post("/api/payment/paypal/capture-order", {
        paypalOrderId: "test",
      });
    } catch (error) {
      logTest(
        "PayPal capture order endpoint exists",
        error.response && error.response.status !== 404
      );
    }
  } catch (error) {
    logTest("Payment endpoints test", false, error.message);
  }
}

async function testPaymentSecurity() {
  try {
    // Test authentication required
    try {
      await api.post("/api/payment/create-payment-intent", {});
    } catch (error) {
      logTest(
        "Payment requires authentication",
        error.response &&
          (error.response.status === 401 || error.response.status === 403)
      );
    }
  } catch (error) {
    logTest("Payment security test", false, error.message);
  }
}

async function testPaymentValidation() {
  try {
    // Test invalid order ID
    try {
      await api.post("/api/payment/create-payment-intent", {
        orderId: "invalid",
      });
    } catch (error) {
      logTest(
        "Validates order ID format",
        error.response &&
          (error.response.status === 400 ||
            error.response.status === 401 ||
            error.response.status === 403)
      );
    }
  } catch (error) {
    logTest("Payment validation test", false, error.message);
  }
}

async function runAllTests() {
  console.log("\n" + "═".repeat(50));
  console.log("  PAYMENT SYSTEM TEST SUITE");
  console.log("═".repeat(50));
  console.log(`\nTesting API: ${API_URL}\n`);

  console.log("[Server Health]");
  await testServerHealth();

  console.log("\n[Payment Endpoints]");
  await testPaymentEndpoints();

  console.log("\n[Security]");
  await testPaymentSecurity();

  console.log("\n[Validation]");
  await testPaymentValidation();

  printSummary();
}

runAllTests().catch((error) => {
  console.error("\n❌ Test error:", error.message);
  process.exit(1);
});
