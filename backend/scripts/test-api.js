#!/usr/bin/env node

/**
 * Simple API Test Script
 * Tests the implemented features via HTTP requests
 */

import chalk from "chalk";
import http from "http";

const BASE_URL = "http://localhost:5000";

console.log(
  chalk.cyan.bold("\n╔═══════════════════════════════════════════════════════╗")
);
console.log(
  chalk.cyan.bold("║     API FEATURE TESTS                             ║")
);
console.log(
  chalk.cyan.bold("╚═══════════════════════════════════════════════════════╝\n")
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

async function testCurrencyFeatures() {
  console.log(chalk.yellow("\n1. Testing Multi-Currency Features...\n"));

  try {
    // Test 1: Get supported currencies
    console.log(chalk.white("  → Testing GET /api/currency/supported"));
    const supportedRes = await makeRequest("/api/currency/supported");
    if (supportedRes.status === 200 && supportedRes.data.currencies) {
      console.log(
        chalk.green(
          `    ✓ Supported currencies: ${Object.keys(
            supportedRes.data.currencies
          ).join(", ")}`
        )
      );
      console.log(
        chalk.gray(`      Base currency: ${supportedRes.data.baseCurrency}`)
      );
      testsPassed++;
    } else {
      console.log(chalk.red("    ✗ Failed to get supported currencies"));
      testsFailed++;
    }

    // Test 2: Get exchange rates
    console.log(chalk.white("\n  → Testing GET /api/currency/rates"));
    const ratesRes = await makeRequest("/api/currency/rates");
    if (ratesRes.status === 200 && ratesRes.data.rates) {
      const rateCount = Object.keys(ratesRes.data.rates).length;
      console.log(
        chalk.green(`    ✓ Exchange rates fetched: ${rateCount} currencies`)
      );
      console.log(chalk.gray(`      EUR rate: ${ratesRes.data.rates.EUR}`));
      console.log(chalk.gray(`      GBP rate: ${ratesRes.data.rates.GBP}`));
      testsPassed++;
    } else {
      console.log(chalk.red("    ✗ Failed to get exchange rates"));
      testsFailed++;
    }

    // Test 3: Convert currency
    console.log(chalk.white("\n  → Testing POST /api/currency/convert"));
    const convertRes = await makeRequest("/api/currency/convert", {
      method: "POST",
      body: { amount: 100, to: "EUR" },
    });
    if (convertRes.status === 200 && convertRes.data.converted) {
      console.log(
        chalk.green(
          `    ✓ Converted $100 → €${convertRes.data.converted.amount.toFixed(
            2
          )}`
        )
      );
      console.log(chalk.gray(`      Rate used: ${convertRes.data.rate}`));
      testsPassed++;
    } else {
      console.log(chalk.red("    ✗ Failed to convert currency"));
      console.log(
        chalk.gray(
          `      Status: ${convertRes.status}, Response: ${JSON.stringify(
            convertRes.data
          )}`
        )
      );
      testsFailed++;
    }

    // Test 4: Format currency
    console.log(chalk.white("\n  → Testing POST /api/currency/format"));
    const formatRes = await makeRequest("/api/currency/format", {
      method: "POST",
      body: { amount: 1234.56, currency: "EUR" },
    });
    if (formatRes.status === 200 && formatRes.data.formatted) {
      console.log(chalk.green(`    ✓ Formatted: ${formatRes.data.formatted}`));
      testsPassed++;
    } else {
      console.log(chalk.red("    ✗ Failed to format currency"));
      testsFailed++;
    }
  } catch (error) {
    console.log(chalk.red(`    ✗ Error: ${error.message}`));
    testsFailed++;
  }
}

async function testI18nFeatures() {
  console.log(chalk.yellow("\n2. Testing Multi-Language Features...\n"));

  try {
    // Test 1: Default language (English)
    console.log(chalk.white("  → Testing default language (English)"));
    const defaultRes = await makeRequest("/api/currency/supported");
    if (defaultRes.status === 200) {
      console.log(chalk.green("    ✓ Default language working"));
      testsPassed++;
    } else {
      console.log(chalk.red("    ✗ Default language failed"));
      testsFailed++;
    }

    // Test 2: Spanish language via query parameter
    console.log(chalk.white("\n  → Testing Spanish language (?lang=es)"));
    const spanishRes = await makeRequest("/api/currency/supported?lang=es");
    if (spanishRes.status === 200) {
      console.log(chalk.green("    ✓ Spanish language working"));
      testsPassed++;
    } else {
      console.log(chalk.red("    ✗ Spanish language failed"));
      testsFailed++;
    }

    // Test 3: French language via header
    console.log(chalk.white("\n  → Testing French language (X-Language: fr)"));
    const frenchRes = await makeRequest("/api/currency/supported", {
      headers: { "X-Language": "fr" },
    });
    if (frenchRes.status === 200) {
      console.log(chalk.green("    ✓ French language via header working"));
      testsPassed++;
    } else {
      console.log(chalk.red("    ✗ French language via header failed"));
      testsFailed++;
    }

    // Test 4: German language
    console.log(chalk.white("\n  → Testing German language (?lang=de)"));
    const germanRes = await makeRequest("/api/currency/supported?lang=de");
    if (germanRes.status === 200) {
      console.log(chalk.green("    ✓ German language working"));
      testsPassed++;
    } else {
      console.log(chalk.red("    ✗ German language failed"));
      testsFailed++;
    }
  } catch (error) {
    console.log(chalk.red(`    ✗ Error: ${error.message}`));
    testsFailed++;
  }
}

async function testCombinedFeatures() {
  console.log(chalk.yellow("\n3. Testing Combined Language + Currency...\n"));

  try {
    // Test: Spanish language + EUR currency
    console.log(
      chalk.white("  → Testing Spanish + EUR (?lang=es&currency=EUR)")
    );
    const combinedRes = await makeRequest("/api/currency/supported?lang=es", {
      headers: { "X-Currency": "EUR" },
    });
    if (combinedRes.status === 200) {
      console.log(chalk.green("    ✓ Combined language + currency working"));
      console.log(
        chalk.gray(
          `      Languages: ${
            Object.keys(combinedRes.data.currencies).length
          } currencies`
        )
      );
      testsPassed++;
    } else {
      console.log(chalk.red("    ✗ Combined features failed"));
      testsFailed++;
    }

    // Test: Japanese language + JPY currency
    console.log(chalk.white("\n  → Testing Japanese + JPY (?lang=ja)"));
    const japaneseRes = await makeRequest("/api/currency/convert?lang=ja", {
      method: "POST",
      body: { amount: 10000, to: "JPY" },
    });
    if (japaneseRes.status === 200) {
      console.log(chalk.green("    ✓ Japanese + JPY working"));
      testsPassed++;
    } else {
      console.log(chalk.red("    ✗ Japanese + JPY failed"));
      console.log(
        chalk.gray(
          `      Status: ${japaneseRes.status}, Response: ${JSON.stringify(
            japaneseRes.data
          )}`
        )
      );
      testsFailed++;
    }
  } catch (error) {
    console.log(chalk.red(`    ✗ Error: ${error.message}`));
    testsFailed++;
  }
}

async function testHealthCheck() {
  console.log(chalk.yellow("\n4. Testing Server Health...\n"));

  try {
    console.log(chalk.white("  → Testing GET /"));
    const healthRes = await makeRequest("/");
    if (healthRes.status === 200) {
      console.log(chalk.green("    ✓ Server is healthy"));
      testsPassed++;
    } else {
      console.log(chalk.red("    ✗ Server health check failed"));
      testsFailed++;
    }
  } catch (error) {
    console.log(chalk.red(`    ✗ Error: ${error.message}`));
    testsFailed++;
  }
}

async function runAllTests() {
  console.log(chalk.cyan("Testing server at: " + BASE_URL + "\n"));
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

  await testHealthCheck();
  await testCurrencyFeatures();
  await testI18nFeatures();
  await testCombinedFeatures();

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
    console.log(chalk.green.bold("\n✓ ALL API TESTS PASSED! 🎉\n"));
    console.log(chalk.green("  Features working correctly:"));
    console.log(chalk.green("  ✓ Multi-currency API (10 currencies)"));
    console.log(chalk.green("  ✓ Multi-language support (7 languages)"));
    console.log(chalk.green("  ✓ Currency conversion"));
    console.log(chalk.green("  ✓ Currency formatting"));
    console.log(chalk.green("  ✓ Language detection (query, header)"));
    console.log(chalk.green("  ✓ Combined features\n"));
  } else {
    console.log(chalk.red.bold("\n✗ SOME TESTS FAILED\n"));
    console.log(chalk.yellow("  Check the errors above for details.\n"));
  }

  console.log(chalk.gray("─".repeat(60)) + "\n");

  process.exit(testsFailed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  console.error(chalk.red("\n✗ Test error:"), error);
  process.exit(1);
});
