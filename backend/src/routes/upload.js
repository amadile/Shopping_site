import express from "express";
import fs from "fs";
import multer from "multer";
import path from "path";
import { cloudinaryStorage } from "../config/cloudinary.js";
import { authenticateJWT } from "../middleware/auth.js";
import Product from "../models/Product.js";

const router = express.Router();

// Use Cloudinary storage if configured, fallback to local storage
const useCloudinary =
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET;

// Fallback local storage config
const localStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage: useCloudinary ? cloudinaryStorage : localStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Memory storage for advanced processing
const uploadMemory = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// Simple upload route (without product ID for testing)
router.post(
  "/image",
  authenticateJWT,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file uploaded" });
      }

      let imageUrl;
      if (useCloudinary) {
        imageUrl = req.file.path;
      } else {
        imageUrl = `/uploads/${req.file.filename}`;
      }

      res.status(200).json({
        imageUrl,
        message: "Image uploaded successfully",
        cdn: useCloudinary ? "cloudinary" : "local",
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Server error" });
    }
  }
);

// Simple multiple upload route (without product ID for testing)
router.post(
  "/images",
  authenticateJWT,
  upload.array("images", 10),
  async (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
      }

      const uploadedImages = req.files.map((file) => ({
        url: useCloudinary ? file.path : `/uploads/${file.filename}`,
      }));

      res.status(200).json({
        message: `${req.files.length} images uploaded successfully`,
        images: uploadedImages,
        cdn: useCloudinary ? "cloudinary" : "local",
      });
    } catch (err) {
      res.status(500).json({ error: err.message || "Server error" });
    }
  }
);

// Simple delete route (without product ID for testing)
router.delete("/image/:filename", authenticateJWT, async (req, res) => {
  try {
    const { filename } = req.params;

    if (!useCloudinary) {
      const filepath = path.join(process.cwd(), "uploads", filename);
      try {
        fs.unlinkSync(filepath);
      } catch (e) {
        // File might not exist, that's okay
      }
    }

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message || "Server error" });
  }
});

// Upload product image (Cloudinary-optimized)
router.post(
  "/:id/image",
  authenticateJWT,
  upload.single("image"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        logger.error("Product not found for image upload");
        return res.status(404).json({ error: "Product not found" });
      }

      if (!req.file) {
        logger.error("No file uploaded or Multer error");
        return res
          .status(400)
          .json({ error: "No image file uploaded or invalid file type" });
      }

      if (!req.user) {
        logger.error("No user context for image upload");
        if (req.file && !useCloudinary) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {
            logger.error("File deletion error (unauthenticated):", e);
          }
        }
        return res.status(401).json({ error: "Authentication required" });
      }

      // Only vendor or admin can upload
      if (
        product.vendor.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        if (req.file && !useCloudinary) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {
            logger.error("File deletion error (forbidden):", e);
          }
        } else if (req.file && useCloudinary) {
          // Delete from Cloudinary
          try {
            await deleteImage(req.file.filename);
          } catch (e) {
            logger.error("Cloudinary deletion error (forbidden):", e);
          }
        }
        return res.status(403).json({ error: "Forbidden" });
      }

      let imageUrl;
      let responsiveUrls;

      if (useCloudinary) {
        // Cloudinary path
        imageUrl = req.file.path;
        responsiveUrls = getResponsiveImageUrls(req.file.filename);

        product.images.push({
          url: imageUrl,
          publicId: req.file.filename,
          responsive: responsiveUrls,
        });
      } else {
        // Local storage path
        imageUrl = `/uploads/${req.file.filename}`;
        product.images.push(imageUrl);
      }

      await product.save();

      logger.info(`Image uploaded for product ${product._id}`);

      res.status(200).json({
        imageUrl,
        responsive: responsiveUrls,
        message: "Image uploaded successfully",
        cdn: useCloudinary ? "cloudinary" : "local",
      });
    } catch (err) {
      logger.error("Image upload error:", err);

      if (
        err instanceof multer.MulterError ||
        err.message === "Only image files are allowed!"
      ) {
        return res.status(400).json({ error: err.message });
      }

      if (err.message && err.message.includes("Forbidden")) {
        return res.status(403).json({ error: "Forbidden" });
      }

      res.status(500).json({ error: err.message || "Server error" });
    }
  }
);

// Upload multiple product images with optimization
router.post(
  "/:id/images",
  authenticateJWT,
  upload.array("images", 10),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ error: "No images uploaded" });
      }

      // Check permissions
      if (
        product.vendor.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }

      const uploadedImages = [];

      for (const file of req.files) {
        if (useCloudinary) {
          const responsiveUrls = getResponsiveImageUrls(file.filename);
          product.images.push({
            url: file.path,
            publicId: file.filename,
            responsive: responsiveUrls,
          });
          uploadedImages.push({
            url: file.path,
            responsive: responsiveUrls,
          });
        } else {
          const imageUrl = `/uploads/${file.filename}`;
          product.images.push(imageUrl);
          uploadedImages.push({ url: imageUrl });
        }
      }

      await product.save();

      logger.info(
        `${req.files.length} images uploaded for product ${product._id}`
      );

      res.status(200).json({
        message: `${req.files.length} images uploaded successfully`,
        images: uploadedImages,
        cdn: useCloudinary ? "cloudinary" : "local",
      });
    } catch (err) {
      logger.error("Multiple images upload error:", err);
      res.status(500).json({ error: err.message || "Server error" });
    }
  }
);

// Upload and optimize image with custom transformations
router.post(
  "/:id/image-optimized",
  authenticateJWT,
  uploadMemory.single("image"),
  async (req, res) => {
    try {
      const product = await Product.findById(req.params.id);
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }

      if (!req.file) {
        return res.status(400).json({ error: "No image uploaded" });
      }

      // Check permissions
      if (
        product.vendor.toString() !== req.user._id.toString() &&
        req.user.role !== "admin"
      ) {
        return res.status(403).json({ error: "Forbidden" });
      }

      // Optimize with Sharp
      const optimizedBuffer = await sharp(req.file.buffer)
        .resize(1200, 1200, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .webp({ quality: 85 })
        .toBuffer();

      if (useCloudinary) {
        // Upload optimized image to Cloudinary
        const result = await uploadImage(optimizedBuffer, {
          folder: `shopping-site/products/${product._id}`,
        });

        const responsiveUrls = getResponsiveImageUrls(result.public_id);

        product.images.push({
          url: result.secure_url,
          publicId: result.public_id,
          responsive: responsiveUrls,
        });

        await product.save();

        logger.info(`Optimized image uploaded for product ${product._id}`);

        res.status(200).json({
          imageUrl: result.secure_url,
          responsive: responsiveUrls,
          format: result.format,
          bytes: result.bytes,
          cdn: "cloudinary",
        });
      } else {
        // Save optimized image locally
        const filename = `${Date.now()}-optimized.webp`;
        const filepath = path.join("uploads", filename);

        await sharp(optimizedBuffer).toFile(filepath);

        const imageUrl = `/uploads/${filename}`;
        product.images.push(imageUrl);

        await product.save();

        logger.info(`Optimized image saved locally for product ${product._id}`);

        res.status(200).json({
          imageUrl,
          cdn: "local",
        });
      }
    } catch (err) {
      logger.error("Optimized image upload error:", err);
      res.status(500).json({ error: err.message || "Server error" });
    }
  }
);

// Delete product image
router.delete("/:id/image", authenticateJWT, async (req, res) => {
  try {
    const { imageUrl, publicId } = req.body;

    if (!imageUrl && !publicId) {
      return res.status(400).json({ error: "Image URL or public ID required" });
    }

    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check permissions
    if (
      product.vendor.toString() !== req.user._id.toString() &&
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (useCloudinary && publicId) {
      // Delete from Cloudinary
      await deleteImage(publicId);

      // Remove from product
      product.images = product.images.filter((img) =>
        typeof img === "object" ? img.publicId !== publicId : true
      );
    } else if (imageUrl) {
      // Delete local file
      if (!useCloudinary && imageUrl.startsWith("/uploads/")) {
        const filepath = path.join(process.cwd(), imageUrl);
        try {
          fs.unlinkSync(filepath);
        } catch (e) {
          logger.warn(`File not found for deletion: ${filepath}`);
        }
      }

      // Remove from product
      product.images = product.images.filter((img) =>
        typeof img === "string" ? img !== imageUrl : img.url !== imageUrl
      );
    }

    await product.save();

    logger.info(`Image deleted from product ${product._id}`);

    res.status(200).json({ message: "Image deleted successfully" });
  } catch (err) {
    logger.error("Image deletion error:", err);
    res.status(500).json({ error: err.message || "Server error" });
  }
});

export default router;
