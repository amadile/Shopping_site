#!/usr/bin/env node

/**
 * Test Runner for Feature Testing
 * Runs all feature tests and generates a summary report
 */

import chalk from "chalk";
import { spawn } from "child_process";

console.log(
  chalk.cyan.bold("\n╔═══════════════════════════════════════════════════════╗")
);
console.log(
  chalk.cyan.bold("║     BACKEND FEATURE TEST SUITE                    ║")
);
console.log(
  chalk.cyan.bold("╚═══════════════════════════════════════════════════════╝\n")
);

const tests = [
  {
    name: "CDN Integration Tests",
    file: "tests/test-cdn.js",
    description: "Image upload, optimization, and responsive URLs",
  },
  {
    name: "Internationalization Tests",
    file: "tests/test-i18n.js",
    description: "Multi-language support and translations",
  },
  {
    name: "Multi-Currency Tests",
    file: "tests/test-currency.js",
    description: "Currency conversion and exchange rates",
  },
  {
    name: "Integration Tests",
    file: "tests/test-integration.js",
    description: "All features working together",
  },
];

let passedTests = 0;
let failedTests = 0;

async function runTest(test) {
  return new Promise((resolve) => {
    console.log(chalk.yellow(`\n▶ Running: ${test.name}`));
    console.log(chalk.gray(`  ${test.description}`));
    console.log(chalk.gray(`  File: ${test.file}\n`));

    const testProcess = spawn("npm", ["test", "--", test.file], {
      shell: true,
      stdio: "inherit",
    });

    testProcess.on("close", (code) => {
      if (code === 0) {
        console.log(chalk.green(`\n✓ ${test.name} PASSED\n`));
        passedTests++;
      } else {
        console.log(chalk.red(`\n✗ ${test.name} FAILED\n`));
        failedTests++;
      }
      resolve(code);
    });
  });
}

async function runAllTests() {
  console.log(chalk.blue("Starting test execution...\n"));
  console.log(chalk.gray("─".repeat(60)));

  for (const test of tests) {
    await runTest(test);
    console.log(chalk.gray("─".repeat(60)));
  }

  // Print summary
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

  console.log(`  Total Tests:   ${tests.length}`);
  console.log(chalk.green(`  ✓ Passed:      ${passedTests}`));
  if (failedTests > 0) {
    console.log(chalk.red(`  ✗ Failed:      ${failedTests}`));
  } else {
    console.log(chalk.green(`  ✗ Failed:      ${failedTests}`));
  }

  const percentage = ((passedTests / tests.length) * 100).toFixed(1);
  console.log(`  Success Rate:  ${percentage}%`);

  console.log("\n" + chalk.gray("─".repeat(60)));

  if (failedTests === 0) {
    console.log(chalk.green.bold("\n✓ ALL TESTS PASSED! 🎉\n"));
    console.log(chalk.green("  Features are working correctly:"));
    console.log(chalk.green("  • CDN Integration (Cloudinary)"));
    console.log(chalk.green("  • Multi-language Support (7 languages)"));
    console.log(chalk.green("  • Multi-currency Support (10 currencies)"));
    console.log(chalk.green("  • Image Optimization"));
    console.log(chalk.green("  • Middleware Integration\n"));
  } else {
    console.log(chalk.red.bold("\n✗ SOME TESTS FAILED\n"));
    console.log(
      chalk.yellow("  Please review the errors above and fix issues.\n")
    );
  }

  console.log(chalk.gray("─".repeat(60)));
  console.log(chalk.cyan("\n  Next Steps:"));
  console.log(chalk.white("  1. Review test results above"));
  console.log(chalk.white("  2. Fix any failing tests"));
  console.log(
    chalk.white("  3. Run individual tests: npm test -- tests/test-cdn.js")
  );
  console.log(chalk.white("  4. Start server: npm start"));
  console.log(chalk.white("  5. Test API endpoints manually\n"));

  process.exit(failedTests > 0 ? 1 : 0);
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error(chalk.red("\n✗ Unhandled error:"), error);
  process.exit(1);
});

// Run tests
runAllTests().catch((error) => {
  console.error(chalk.red("\n✗ Test runner error:"), error);
  process.exit(1);
});
