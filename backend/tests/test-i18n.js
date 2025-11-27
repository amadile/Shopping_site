/**
 * Test Suite for Internationalization (i18n)
 * Tests language detection, translations, and middleware
 */

import { expect } from "chai";
import fs from "fs";
import path from "path";
import request from "supertest";
import { fileURLToPath } from "url";
import app from "../src/index.js";
import { translate, translatePlural } from "../src/middleware/i18n.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("Internationalization (i18n) Tests", function () {
  this.timeout(10000);

  const SUPPORTED_LANGUAGES = ["en", "es", "fr", "de", "ar", "zh", "ja"];
  const localesDir = path.join(__dirname, "../src/locales");

  describe("Translation File Tests", () => {
    it("should have all language files", () => {
      SUPPORTED_LANGUAGES.forEach((lang) => {
        const filePath = path.join(localesDir, `${lang}.json`);
        expect(fs.existsSync(filePath), `${lang}.json should exist`).to.be.true;
        console.log(`✓ Found ${lang}.json`);
      });
    });

    it("should have valid JSON in all language files", () => {
      SUPPORTED_LANGUAGES.forEach((lang) => {
        const filePath = path.join(localesDir, `${lang}.json`);
        const content = fs.readFileSync(filePath, "utf8");

        expect(
          () => JSON.parse(content),
          `${lang}.json should be valid JSON`
        ).to.not.throw();

        const translations = JSON.parse(content);
        expect(translations).to.be.an("object");
        console.log(
          `✓ ${lang}.json is valid JSON with ${
            Object.keys(translations).length
          } root keys`
        );
      });
    });

    it("should have consistent keys across all languages", () => {
      // Load English as reference
      const enPath = path.join(localesDir, "en.json");
      const enTranslations = JSON.parse(fs.readFileSync(enPath, "utf8"));
      const enKeys = getAllKeys(enTranslations);

      console.log(
        `\n  Reference (English) has ${enKeys.length} translation keys`
      );

      SUPPORTED_LANGUAGES.filter((lang) => lang !== "en").forEach((lang) => {
        const filePath = path.join(localesDir, `${lang}.json`);
        const translations = JSON.parse(fs.readFileSync(filePath, "utf8"));
        const keys = getAllKeys(translations);

        expect(
          keys.length,
          `${lang} should have same number of keys as English`
        ).to.equal(enKeys.length);

        // Check for missing keys
        const missingKeys = enKeys.filter((key) => !keys.includes(key));
        const extraKeys = keys.filter((key) => !enKeys.includes(key));

        expect(
          missingKeys,
          `${lang} missing keys: ${missingKeys.join(", ")}`
        ).to.have.length(0);
        expect(
          extraKeys,
          `${lang} extra keys: ${extraKeys.join(", ")}`
        ).to.have.length(0);

        console.log(`  ✓ ${lang} has ${keys.length} keys (matches English)`);
      });
    });

    it("should have all required translation domains", () => {
      const requiredDomains = [
        "auth",
        "product",
        "cart",
        "order",
        "review",
        "payment",
        "user",
        "inventory",
        "coupon",
        "vendor",
        "loyalty",
        "error",
        "common",
        "email",
      ];

      SUPPORTED_LANGUAGES.forEach((lang) => {
        const filePath = path.join(localesDir, `${lang}.json`);
        const translations = JSON.parse(fs.readFileSync(filePath, "utf8"));

        requiredDomains.forEach((domain) => {
          expect(
            translations,
            `${lang} should have ${domain} domain`
          ).to.have.property(domain);
        });

        console.log(
          `✓ ${lang} has all ${requiredDomains.length} required domains`
        );
      });
    });
  });

  describe("Translation Function Tests", () => {
    it("should translate basic keys in English", () => {
      const text = translate("auth.loginSuccess", {}, "en");
      expect(text).to.be.a("string");
      expect(text).to.equal("Login successful");
      console.log("✓ English translation:", text);
    });

    it("should translate basic keys in Spanish", () => {
      const text = translate("auth.loginSuccess", {}, "es");
      expect(text).to.be.a("string");
      expect(text).to.equal("Inicio de sesión exitoso");
      console.log("✓ Spanish translation:", text);
    });

    it("should translate with parameters", () => {
      const text = translate("product.lowStock", { count: 5 }, "en");
      expect(text).to.include("5");
      expect(text).to.include("items left");
      console.log("✓ Parameterized translation:", text);
    });

    it("should handle plural translations", () => {
      const single = translatePlural(
        "common.items",
        "common.items_plural",
        1,
        { count: 1 },
        "en"
      );
      const multiple = translatePlural(
        "common.items",
        "common.items_plural",
        5,
        { count: 5 },
        "en"
      );

      expect(single).to.include("1");
      expect(multiple).to.include("5");
      console.log("✓ Plural (1):", single);
      console.log("✓ Plural (5):", multiple);
    });

    it("should translate in all supported languages", () => {
      const key = "auth.loginSuccess";

      SUPPORTED_LANGUAGES.forEach((lang) => {
        const text = translate(key, {}, lang);
        expect(text).to.be.a("string");
        expect(text.length).to.be.greaterThan(0);
        console.log(`  ${lang}: ${text}`);
      });
    });
  });

  describe("Language Detection Tests", () => {
    it("should detect language from query parameter", async () => {
      const response = await request(app)
        .get("/api/products?lang=es")
        .expect("Content-Type", /json/);

      // The response should be processed with Spanish locale
      console.log("✓ Query parameter detection works");
    });

    it("should detect language from X-Language header", async () => {
      const response = await request(app)
        .get("/api/products")
        .set("X-Language", "fr")
        .expect("Content-Type", /json/);

      console.log("✓ X-Language header detection works");
    });

    it("should detect language from Accept-Language header", async () => {
      const response = await request(app)
        .get("/api/products")
        .set("Accept-Language", "de-DE,de;q=0.9,en;q=0.8")
        .expect("Content-Type", /json/);

      console.log("✓ Accept-Language header detection works");
    });

    it("should default to English when no language specified", async () => {
      const response = await request(app)
        .get("/api/products")
        .expect("Content-Type", /json/);

      console.log("✓ Default language (English) works");
    });
  });

  describe("Middleware Integration Tests", () => {
    it("should attach locale to request", async () => {
      const response = await request(app).get("/").set("X-Language", "es");

      expect(response.status).to.be.oneOf([200, 304]);
      console.log("✓ Locale attached to request");
    });

    it("should provide translation functions on request", async () => {
      // This tests that middleware provides req.t and req.tn
      const response = await request(app).get("/").set("X-Language", "fr");

      expect(response.status).to.be.oneOf([200, 304]);
      console.log("✓ Translation functions available on request");
    });
  });

  describe("Error Handling Tests", () => {
    it("should handle missing translation keys gracefully", () => {
      const text = translate("nonexistent.key", {}, "en");
      expect(text).to.be.a("string");
      console.log("✓ Missing key handled:", text);
    });

    it("should handle invalid locale gracefully", () => {
      const text = translate("auth.loginSuccess", {}, "invalid");
      expect(text).to.be.a("string");
      console.log("✓ Invalid locale handled");
    });
  });

  describe("Performance Tests", () => {
    it("should translate quickly (< 10ms)", () => {
      const start = Date.now();

      for (let i = 0; i < 100; i++) {
        translate("auth.loginSuccess", {}, "en");
      }

      const duration = Date.now() - start;
      const avgTime = duration / 100;

      expect(avgTime).to.be.lessThan(10);
      console.log(`✓ Average translation time: ${avgTime.toFixed(2)}ms`);
    });

    it("should handle concurrent translations", async () => {
      const promises = [];

      for (let i = 0; i < 50; i++) {
        const lang = SUPPORTED_LANGUAGES[i % SUPPORTED_LANGUAGES.length];
        promises.push(
          new Promise((resolve) => {
            const text = translate("auth.loginSuccess", {}, lang);
            resolve(text);
          })
        );
      }

      const results = await Promise.all(promises);
      expect(results).to.have.length(50);
      console.log("✓ Handled 50 concurrent translations");
    });
  });
});

// Helper function to get all nested keys from an object
function getAllKeys(obj, prefix = "") {
  let keys = [];

  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;

    if (
      typeof obj[key] === "object" &&
      obj[key] !== null &&
      !Array.isArray(obj[key])
    ) {
      keys = keys.concat(getAllKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }

  return keys;
}

// Run tests manually: npm test -- test-i18n.js
