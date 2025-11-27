const crypto = require("crypto");

/**
 * Generate secure random secrets for environment variables
 * Usage: node scripts/generate-secrets.js
 */

console.log("=".repeat(70));
console.log("🔐 SECURE SECRET GENERATOR");
console.log("=".repeat(70));
console.log("\nGenerated Secrets (copy these to your .env file):\n");

const secrets = {
  JWT_SECRET: crypto.randomBytes(32).toString("hex"),
  JWT_REFRESH_SECRET: crypto.randomBytes(32).toString("hex"),
  CSRF_SECRET: crypto.randomBytes(32).toString("hex"),
};

for (const [key, value] of Object.entries(secrets)) {
  console.log(`${key}=${value}`);
}

console.log("\n" + "=".repeat(70));
console.log("⚠️  IMPORTANT:");
console.log("- Never commit these secrets to version control");
console.log("- Use different secrets for each environment (dev/staging/prod)");
console.log("- Store production secrets in a secure vault");
console.log("=".repeat(70));
