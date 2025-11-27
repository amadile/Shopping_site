import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import { logger } from "./logger.js";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Verify configuration
if (process.env.NODE_ENV !== "test") {
  if (
    !process.env.CLOUDINARY_CLOUD_NAME ||
    !process.env.CLOUDINARY_API_KEY ||
    !process.env.CLOUDINARY_API_SECRET
  ) {
    logger.warn(
      "Cloudinary credentials not configured. Image uploads will use local storage."
    );
  } else {
    logger.info("Cloudinary configured successfully");
  }
}

// Cloudinary storage configuration for Multer
export const cloudinaryStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "shopping-site",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
    transformation: [
      {
        width: 1200,
        height: 1200,
        crop: "limit",
        quality: "auto:good",
        fetch_format: "auto",
      },
    ],
  },
});

/**
 * Upload image to Cloudinary with optimization
 * @param {Buffer} imageBuffer - Image buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Cloudinary upload result
 */
export async function uploadImage(imageBuffer, options = {}) {
  const {
    folder = "shopping-site/products",
    width = 1200,
    height = 1200,
    crop = "limit",
    quality = "auto:good",
  } = options;

  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        transformation: [
          { width, height, crop, quality, fetch_format: "auto" },
        ],
        resource_type: "image",
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );

    uploadStream.end(imageBuffer);
  });
}

/**
 * Upload multiple images
 * @param {Array<Buffer>} imageBuffers - Array of image buffers
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} - Array of upload results
 */
export async function uploadMultipleImages(imageBuffers, options = {}) {
  const uploadPromises = imageBuffers.map((buffer) =>
    uploadImage(buffer, options)
  );
  return Promise.all(uploadPromises);
}

/**
 * Delete image from Cloudinary
 * @param {string} publicId - Cloudinary public ID
 * @returns {Promise<Object>} - Deletion result
 */
export async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    logger.info(`Image deleted from Cloudinary: ${publicId}`);
    return result;
  } catch (error) {
    logger.error(`Error deleting image from Cloudinary: ${error.message}`);
    throw error;
  }
}

/**
 * Delete multiple images
 * @param {Array<string>} publicIds - Array of Cloudinary public IDs
 * @returns {Promise<Array>} - Array of deletion results
 */
export async function deleteMultipleImages(publicIds) {
  const deletePromises = publicIds.map((id) => deleteImage(id));
  return Promise.all(deletePromises);
}

/**
 * Get optimized image URL with transformations
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} transformations - Transformation options
 * @returns {string} - Optimized image URL
 */
export function getOptimizedImageUrl(publicId, transformations = {}) {
  const {
    width = 800,
    height = 800,
    crop = "fill",
    quality = "auto:good",
    format = "auto",
  } = transformations;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality,
    fetch_format: format,
  });
}

/**
 * Get responsive image URLs (multiple sizes)
 * @param {string} publicId - Cloudinary public ID
 * @returns {Object} - URLs for different sizes
 */
export function getResponsiveImageUrls(publicId) {
  return {
    thumbnail: getOptimizedImageUrl(publicId, {
      width: 150,
      height: 150,
      crop: "fill",
    }),
    small: getOptimizedImageUrl(publicId, {
      width: 400,
      height: 400,
      crop: "fill",
    }),
    medium: getOptimizedImageUrl(publicId, {
      width: 800,
      height: 800,
      crop: "limit",
    }),
    large: getOptimizedImageUrl(publicId, {
      width: 1200,
      height: 1200,
      crop: "limit",
    }),
    original: cloudinary.url(publicId),
  };
}

/**
 * Generate WebP version of image
 * @param {string} publicId - Cloudinary public ID
 * @param {Object} options - Transformation options
 * @returns {string} - WebP image URL
 */
export function getWebPImageUrl(publicId, options = {}) {
  const { width = 800, height = 800, crop = "limit" } = options;

  return cloudinary.url(publicId, {
    width,
    height,
    crop,
    quality: "auto:good",
    fetch_format: "webp",
  });
}

export default cloudinary;
