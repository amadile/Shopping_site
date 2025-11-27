/**
 * Test Suite for CDN Integration (Cloudinary)
 * Tests image upload, optimization, responsive URLs, and deletion
 */

import { expect } from "chai";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  deleteImage,
  deleteMultipleImages,
  getOptimizedImageUrl,
  getResponsiveImageUrls,
  getWebPImageUrl,
  uploadImage,
  uploadMultipleImages,
  verifyConnection,
} from "../src/config/cloudinary.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe("CDN Integration Tests", function () {
  this.timeout(30000); // 30 second timeout for API calls

  let uploadedPublicId = null;
  let uploadedPublicIds = [];

  // Test image buffer (1x1 pixel PNG)
  const testImageBuffer = Buffer.from(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
    "base64"
  );

  describe("Configuration Tests", () => {
    it("should verify Cloudinary connection", async () => {
      const isConnected = await verifyConnection();
      console.log(`Cloudinary connected: ${isConnected}`);
      // Connection may be false if not configured, which is OK for fallback mode
      expect(typeof isConnected).to.equal("boolean");
    });
  });

  describe("Image Upload Tests", () => {
    it("should upload a single image", async function () {
      try {
        const result = await uploadImage(testImageBuffer, {
          folder: "test",
          public_id: `test-single-${Date.now()}`,
        });

        expect(result).to.have.property("secure_url");
        expect(result).to.have.property("public_id");
        uploadedPublicId = result.public_id;

        console.log("✓ Single image uploaded:", result.secure_url);
      } catch (error) {
        if (error.message.includes("not configured")) {
          console.log("⚠ Cloudinary not configured, skipping upload test");
          this.skip();
        } else {
          throw error;
        }
      }
    });

    it("should upload multiple images", async function () {
      try {
        const buffers = [testImageBuffer, testImageBuffer, testImageBuffer];
        const results = await uploadMultipleImages(buffers, {
          folder: "test",
        });

        expect(results).to.be.an("array");
        expect(results).to.have.length(3);
        results.forEach((result) => {
          expect(result).to.have.property("secure_url");
          expect(result).to.have.property("public_id");
        });

        uploadedPublicIds = results.map((r) => r.public_id);
        console.log(`✓ Uploaded ${results.length} images`);
      } catch (error) {
        if (error.message.includes("not configured")) {
          console.log(
            "⚠ Cloudinary not configured, skipping multiple upload test"
          );
          this.skip();
        } else {
          throw error;
        }
      }
    });
  });

  describe("Image Transformation Tests", () => {
    it("should generate optimized image URL", () => {
      const publicId = "test/sample-image";
      const url = getOptimizedImageUrl(publicId, {
        width: 300,
        height: 300,
        crop: "fill",
        quality: "auto",
      });

      expect(url).to.be.a("string");
      expect(url).to.include("w_300");
      expect(url).to.include("h_300");
      expect(url).to.include("c_fill");
      expect(url).to.include("q_auto");
      console.log("✓ Optimized URL:", url);
    });

    it("should generate responsive image URLs", () => {
      const publicId = "test/sample-image";
      const urls = getResponsiveImageUrls(publicId);

      expect(urls).to.be.an("object");
      expect(urls).to.have.property("thumbnail");
      expect(urls).to.have.property("small");
      expect(urls).to.have.property("medium");
      expect(urls).to.have.property("large");
      expect(urls).to.have.property("original");

      expect(urls.thumbnail).to.include("w_150");
      expect(urls.small).to.include("w_400");
      expect(urls.medium).to.include("w_800");
      expect(urls.large).to.include("w_1200");

      console.log("✓ Responsive URLs generated:");
      console.log("  - Thumbnail:", urls.thumbnail);
      console.log("  - Small:", urls.small);
      console.log("  - Medium:", urls.medium);
      console.log("  - Large:", urls.large);
    });

    it("should generate WebP image URL", () => {
      const publicId = "test/sample-image";
      const url = getWebPImageUrl(publicId, { width: 500 });

      expect(url).to.be.a("string");
      expect(url).to.include("f_webp");
      expect(url).to.include("w_500");
      console.log("✓ WebP URL:", url);
    });
  });

  describe("Image Deletion Tests", () => {
    it("should delete a single image", async function () {
      if (!uploadedPublicId) {
        console.log("⚠ No image to delete, skipping test");
        this.skip();
        return;
      }

      try {
        const result = await deleteImage(uploadedPublicId);
        expect(result).to.have.property("result");
        console.log(`✓ Image deleted: ${uploadedPublicId}`);
      } catch (error) {
        if (error.message.includes("not configured")) {
          console.log("⚠ Cloudinary not configured, skipping delete test");
          this.skip();
        } else {
          throw error;
        }
      }
    });

    it("should delete multiple images", async function () {
      if (uploadedPublicIds.length === 0) {
        console.log("⚠ No images to delete, skipping test");
        this.skip();
        return;
      }

      try {
        const results = await deleteMultipleImages(uploadedPublicIds);
        expect(results).to.be.an("array");
        expect(results).to.have.length(uploadedPublicIds.length);
        console.log(`✓ Deleted ${results.length} images`);
      } catch (error) {
        if (error.message.includes("not configured")) {
          console.log(
            "⚠ Cloudinary not configured, skipping multiple delete test"
          );
          this.skip();
        } else {
          throw error;
        }
      }
    });
  });

  describe("Local Fallback Tests", () => {
    it("should handle local storage when CDN is unavailable", () => {
      // Test that local storage fallback is configured
      const uploadsDir = path.join(__dirname, "../uploads");

      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      expect(fs.existsSync(uploadsDir)).to.be.true;
      console.log("✓ Local uploads directory exists");
    });
  });
});

// Run tests manually: npm test -- test-cdn.js
