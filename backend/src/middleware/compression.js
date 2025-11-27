import compression from "compression";

/**
 * Compression Middleware Configuration
 * Optimized for performance with intelligent filtering
 */

// Custom filter function to determine what to compress
function shouldCompress(req, res) {
  // Don't compress if explicitly disabled
  if (req.headers["x-no-compression"]) {
    return false;
  }

  // Don't compress responses with Cache-Control: no-transform
  const cacheControl = res.getHeader("Cache-Control");
  if (cacheControl && cacheControl.includes("no-transform")) {
    return false;
  }

  // Don't compress if response is already compressed
  if (res.getHeader("Content-Encoding")) {
    return false;
  }

  // Don't compress images, videos, and already compressed files
  const contentType = res.getHeader("Content-Type");
  if (contentType) {
    const noCompressTypes = [
      "image/",
      "video/",
      "audio/",
      "application/zip",
      "application/x-zip",
      "application/x-rar",
      "application/gzip",
      "application/x-gzip",
      "application/x-7z-compressed",
    ];

    if (noCompressTypes.some((type) => contentType.includes(type))) {
      return false;
    }
  }

  // Use compression default filter for everything else
  return compression.filter(req, res);
}

/**
 * Optimized compression middleware
 * - Compresses responses larger than 1KB
 * - Uses level 6 compression (balanced speed/ratio)
 * - Intelligently skips already compressed content
 */
export const compressionMiddleware = compression({
  // Only compress responses larger than 1KB (1024 bytes)
  threshold: 1024,

  // Compression level: 0 (no compression) to 9 (maximum compression)
  // Level 6 is a good balance between compression ratio and speed
  level: 6,

  // Custom filter function
  filter: shouldCompress,

  // Memory level (1-9): affects how much memory is allocated for compression
  // 8 is default and works well for most cases
  memLevel: 8,

  // Strategy: filtered strategy is good for text-like data
  strategy: compression.Z_DEFAULT_STRATEGY,

  // Chunk size: default 16KB is usually optimal
  chunkSize: 16 * 1024, // 16KB
});

/**
 * High compression middleware for specific routes (e.g., large JSON responses)
 */
export const highCompressionMiddleware = compression({
  threshold: 512, // Compress responses larger than 512 bytes
  level: 9, // Maximum compression
  filter: shouldCompress,
  memLevel: 9,
});

/**
 * Fast compression middleware for frequently accessed routes
 */
export const fastCompressionMiddleware = compression({
  threshold: 2048, // Only compress larger responses (2KB+)
  level: 3, // Lower compression for faster processing
  filter: shouldCompress,
  memLevel: 7,
});

export default compressionMiddleware;
