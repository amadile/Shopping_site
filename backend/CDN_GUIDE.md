# CDN Integration Guide - Cloudinary

## Overview

This shopping site uses **Cloudinary** as a CDN (Content Delivery Network) for optimized image storage, transformation, and delivery. The system supports automatic fallback to local storage if Cloudinary is not configured.

## Features

✅ **Cloud-based image storage** with Cloudinary  
✅ **Automatic local fallback** if CDN unavailable  
✅ **Responsive image URLs** (5 sizes: thumbnail to original)  
✅ **WebP conversion** for better compression  
✅ **Sharp preprocessing** for additional optimization  
✅ **Automatic image optimization** (quality, format)  
✅ **Secure image deletion** with cleanup  
✅ **Backward compatible** with existing Product model

## Architecture

### Dual-Mode Storage System

```
┌─────────────────────────────────────────────┐
│         Image Upload Request                │
└──────────────┬──────────────────────────────┘
               │
               ▼
       ┌───────────────┐
       │ Check Config  │
       └───────┬───────┘
               │
       ┌───────┴────────┐
       │                │
       ▼                ▼
┌──────────────┐  ┌──────────────┐
│  Cloudinary  │  │Local Storage │
│   (Primary)  │  │  (Fallback)  │
└──────────────┘  └──────────────┘
       │                │
       │                │
       ▼                ▼
┌──────────────────────────────────┐
│   Responsive URLs Generated      │
│   - thumbnail (150x150)          │
│   - small (400x400)              │
│   - medium (800x800)             │
│   - large (1200x1200)            │
│   - original                     │
└──────────────────────────────────┘
```

## Configuration

### Environment Variables

Add to your `.env` file:

```env
# Cloudinary Configuration (Optional)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Getting Cloudinary Credentials

1. **Sign up** at [cloudinary.com](https://cloudinary.com)
2. Go to **Dashboard**
3. Copy your credentials:
   - Cloud Name
   - API Key
   - API Secret
4. Add to `.env` file

**Note:** If not configured, the system automatically falls back to local storage.

## File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── cloudinary.js          # Cloudinary configuration & helpers
│   └── routes/
│       └── upload.js               # Image upload endpoints
└── uploads/                        # Local storage fallback
```

## API Endpoints

### 1. Upload Single Image

**Endpoint:** `POST /api/upload/:id/image`

**Description:** Upload a single product image with automatic optimization

**Request:**

```bash
POST /api/upload/12345/image
Content-Type: multipart/form-data

image: [binary file]
```

**Response (Cloudinary):**

```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "https://res.cloudinary.com/demo/image/upload/products/abc123.jpg",
  "publicId": "products/abc123",
  "responsive": {
    "thumbnail": "https://res.cloudinary.com/.../w_150,h_150,c_fill/products/abc123.jpg",
    "small": "https://res.cloudinary.com/.../w_400,h_400,c_fill/products/abc123.jpg",
    "medium": "https://res.cloudinary.com/.../w_800,h_800,c_fill/products/abc123.jpg",
    "large": "https://res.cloudinary.com/.../w_1200,h_1200,c_fill/products/abc123.jpg",
    "original": "https://res.cloudinary.com/demo/image/upload/products/abc123.jpg"
  },
  "cdn": "cloudinary"
}
```

**Response (Local Fallback):**

```json
{
  "message": "Image uploaded successfully",
  "imageUrl": "http://localhost:5000/uploads/products/12345-1234567890.jpg",
  "responsive": {
    "thumbnail": "http://localhost:5000/uploads/products/12345-1234567890.jpg",
    "small": "http://localhost:5000/uploads/products/12345-1234567890.jpg",
    "medium": "http://localhost:5000/uploads/products/12345-1234567890.jpg",
    "large": "http://localhost:5000/uploads/products/12345-1234567890.jpg",
    "original": "http://localhost:5000/uploads/products/12345-1234567890.jpg"
  },
  "cdn": "local"
}
```

### 2. Upload Multiple Images

**Endpoint:** `POST /api/upload/:id/images`

**Description:** Upload up to 10 product images at once

**Request:**

```bash
POST /api/upload/12345/images
Content-Type: multipart/form-data

images: [file1, file2, file3, ...]
```

**Response:**

```json
{
  "message": "3 images uploaded successfully",
  "images": [
    {
      "url": "https://res.cloudinary.com/.../products/abc123.jpg",
      "publicId": "products/abc123",
      "responsive": { ... }
    },
    {
      "url": "https://res.cloudinary.com/.../products/def456.jpg",
      "publicId": "products/def456",
      "responsive": { ... }
    },
    {
      "url": "https://res.cloudinary.com/.../products/ghi789.jpg",
      "publicId": "products/ghi789",
      "responsive": { ... }
    }
  ],
  "cdn": "cloudinary"
}
```

### 3. Upload Optimized Image (Sharp Preprocessing)

**Endpoint:** `POST /api/upload/:id/image-optimized`

**Description:** Upload with Sharp preprocessing (WebP, compression, resize)

**Request:**

```bash
POST /api/upload/12345/image-optimized
Content-Type: multipart/form-data

image: [binary file]
```

**Features:**

- Converts to WebP format
- Resizes to max 1200x1200px
- 85% quality compression
- Removes metadata

**Response:** Same as single image upload

### 4. Delete Image

**Endpoint:** `DELETE /api/upload/:id/image`

**Description:** Delete a product image (from CDN or local storage)

**Request:**

```bash
DELETE /api/upload/12345/image?publicId=products/abc123

# Or for local:
DELETE /api/upload/12345/image?imageUrl=/uploads/products/12345-123.jpg
```

**Response:**

```json
{
  "message": "Image deleted successfully"
}
```

## Usage Examples

### Frontend Integration

#### Upload Single Image (JavaScript)

```javascript
async function uploadProductImage(productId, file) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`/api/upload/${productId}/image`, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  // Use responsive images
  const thumbnail = data.responsive.thumbnail;
  const fullSize = data.responsive.large;

  return data;
}
```

#### Display Responsive Images (HTML)

```html
<!-- Use srcset for responsive images -->
<img
  src="{{ product.image.responsive.medium }}"
  srcset="
    {{ product.image.responsive.thumbnail }} 150w,
    {{ product.image.responsive.small }} 400w,
    {{ product.image.responsive.medium }} 800w,
    {{ product.image.responsive.large }} 1200w
  "
  sizes="(max-width: 600px) 400px, (max-width: 1200px) 800px, 1200px"
  alt="{{ product.name }}"
/>
```

#### Upload Multiple Images

```javascript
async function uploadProductImages(productId, files) {
  const formData = new FormData();

  // Add multiple files
  files.forEach((file) => {
    formData.append("images", file);
  });

  const response = await fetch(`/api/upload/${productId}/images`, {
    method: "POST",
    body: formData,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();
  console.log(`Uploaded ${data.images.length} images`);

  return data.images;
}
```

#### Delete Image

```javascript
async function deleteProductImage(productId, publicId) {
  const response = await fetch(
    `/api/upload/${productId}/image?publicId=${publicId}`,
    {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  const data = await response.json();
  return data;
}
```

### Backend Integration

#### Using Cloudinary Service Directly

```javascript
import {
  uploadImage,
  deleteImage,
  getOptimizedImageUrl,
  getResponsiveImageUrls,
} from "../config/cloudinary.js";

// Upload from buffer
const result = await uploadImage(fileBuffer, {
  folder: "products",
  transformation: {
    width: 800,
    height: 800,
    crop: "fill",
    quality: "auto",
  },
});

// Get optimized URL
const optimizedUrl = getOptimizedImageUrl(publicId, {
  width: 600,
  height: 600,
  crop: "fill",
  quality: "auto:best",
  format: "webp",
});

// Get all responsive sizes
const responsiveUrls = getResponsiveImageUrls(publicId);
```

## Image Transformation Options

### Cloudinary URL Transformations

The system supports dynamic transformations via URL parameters:

```javascript
// Resize to specific dimensions
https://res.cloudinary.com/.../w_300,h_300,c_fill/image.jpg

// Convert to WebP
https://res.cloudinary.com/.../f_webp/image.jpg

// Auto quality
https://res.cloudinary.com/.../q_auto/image.jpg

// Crop modes
c_fill   // Fill (may crop)
c_fit    // Fit (no crop)
c_scale  // Scale (stretch)
c_pad    // Pad (with background)

// Quality levels
q_auto:low      // Low quality
q_auto:good     // Good quality
q_auto:best     // Best quality
q_auto:eco      // Economy mode
```

### Available Responsive Sizes

| Size      | Dimensions  | Use Case                 |
| --------- | ----------- | ------------------------ |
| Thumbnail | 150x150     | Grid thumbnails, icons   |
| Small     | 400x400     | Mobile view, small cards |
| Medium    | 800x800     | Tablet view, modals      |
| Large     | 1200x1200   | Desktop view, zoom       |
| Original  | As uploaded | Download, print          |

## Product Model Schema

### New Image Format (with CDN support)

```javascript
{
  images: [
    {
      url: "https://res.cloudinary.com/demo/products/abc123.jpg",
      publicId: "products/abc123",
      responsive: {
        thumbnail: "https://...",
        small: "https://...",
        medium: "https://...",
        large: "https://...",
        original: "https://...",
      },
    },
  ];
}
```

### Legacy Image Format (backward compatible)

```javascript
{
  images: [
    "http://localhost:5000/uploads/product1.jpg",
    "http://localhost:5000/uploads/product2.jpg",
  ];
}
```

Both formats are supported for seamless migration.

## Migration Guide

### Migrating Existing Images

To migrate existing local images to Cloudinary:

```javascript
import Product from "./models/Product.js";
import { uploadImage } from "./config/cloudinary.js";
import fs from "fs";

async function migrateProductImages() {
  const products = await Product.find({ images: { $type: "string" } });

  for (const product of products) {
    const newImages = [];

    for (const imageUrl of product.images) {
      // Read local file
      const localPath = imageUrl.replace("http://localhost:5000", ".");
      const buffer = fs.readFileSync(localPath);

      // Upload to Cloudinary
      const result = await uploadImage(buffer, {
        folder: "products",
        public_id: `product-${product._id}-${Date.now()}`,
      });

      newImages.push({
        url: result.secure_url,
        publicId: result.public_id,
        responsive: getResponsiveImageUrls(result.public_id),
      });
    }

    // Update product
    product.images = newImages;
    await product.save();

    console.log(`Migrated ${product.name}`);
  }
}
```

## Performance Optimization

### 1. Image Compression

All images are automatically compressed:

- **Quality:** Auto-adjusted based on content
- **Format:** WebP preferred (30% smaller than JPEG)
- **Metadata:** Removed to reduce file size

### 2. CDN Caching

Cloudinary provides global CDN with:

- **Cache duration:** 1 year
- **Edge locations:** 200+ worldwide
- **Auto-retry:** Automatic failover
- **Smart compression:** Context-aware

### 3. Lazy Loading

Implement lazy loading in frontend:

```html
<img
  src="{{ product.image.responsive.thumbnail }}"
  data-src="{{ product.image.responsive.large }}"
  loading="lazy"
  alt="{{ product.name }}"
/>
```

### 4. Progressive JPEG

Enable progressive loading for better UX:

```javascript
const url = getOptimizedImageUrl(publicId, {
  flags: "progressive",
  quality: "auto",
});
```

## Security

### 1. Upload Validation

- **File size limit:** 5MB per image
- **Allowed formats:** JPEG, PNG, WebP, GIF
- **MIME type check:** Validates actual file content
- **Total limit:** 10 images per upload

### 2. Signed URLs

For private images, generate signed URLs:

```javascript
import cloudinary from "./config/cloudinary.js";

const signedUrl = cloudinary.url(publicId, {
  sign_url: true,
  type: "authenticated",
});
```

### 3. Access Control

- **Authentication required** for uploads/deletes
- **Public read access** for product images
- **Admin-only** for bulk operations

## Error Handling

### Common Errors

1. **Cloudinary credentials missing**

   - System automatically falls back to local storage
   - No errors thrown, works seamlessly

2. **File size too large**

   ```json
   {
     "error": "File size exceeds 5MB limit"
   }
   ```

3. **Invalid file format**

   ```json
   {
     "error": "Only image files are allowed"
   }
   ```

4. **Upload failed**
   ```json
   {
     "error": "Image upload failed",
     "details": "Network timeout"
   }
   ```

## Monitoring

### Check CDN Status

```javascript
import { verifyConnection } from "./config/cloudinary.js";

const status = await verifyConnection();
console.log(status); // true if connected, false otherwise
```

### Usage Statistics

Monitor your Cloudinary usage:

- **Dashboard:** cloudinary.com/console
- **Transformations:** Count of image transformations
- **Bandwidth:** Data transfer metrics
- **Storage:** Total storage used

## Cost Optimization

### Free Tier Limits

- **Storage:** 25GB
- **Bandwidth:** 25GB/month
- **Transformations:** 25,000/month

### Tips to Stay Within Limits

1. **Use caching:** Browser + CDN caching reduces requests
2. **Lazy load:** Only load images when needed
3. **Responsive images:** Serve appropriate sizes
4. **WebP format:** Reduces bandwidth by 30%
5. **Auto quality:** Cloudinary optimizes automatically

## Troubleshooting

### Images not uploading to Cloudinary

1. Check environment variables:

   ```bash
   echo $CLOUDINARY_CLOUD_NAME
   echo $CLOUDINARY_API_KEY
   ```

2. Verify credentials in Cloudinary dashboard

3. Check server logs for errors:
   ```bash
   tail -f logs/app.log | grep cloudinary
   ```

### Images not displaying

1. Check CORS settings in Cloudinary
2. Verify image URL is accessible (test in browser)
3. Check Content Security Policy headers

### Slow image loading

1. Use appropriate responsive size
2. Enable lazy loading
3. Check CDN cache hit rate
4. Use WebP format

## Best Practices

### ✅ DO

- Use responsive images with srcset
- Convert to WebP for better compression
- Implement lazy loading
- Cache aggressively
- Use thumbnails for lists/grids
- Delete unused images regularly

### ❌ DON'T

- Upload uncompressed images
- Use original size for thumbnails
- Store large files in database
- Skip image validation
- Ignore error handling
- Forget to cleanup deleted products

## Future Enhancements

- [ ] Automatic image tagging (AI)
- [ ] Face detection for profile pics
- [ ] Background removal
- [ ] Automatic cropping
- [ ] Video upload support
- [ ] Advanced analytics dashboard

## Support

For issues with CDN integration:

1. Check this guide
2. Review `src/config/cloudinary.js`
3. Test with local storage fallback
4. Check Cloudinary status page

---

**Last Updated:** 2024
**Cloudinary SDK Version:** ^2.0.0
**Supported Formats:** JPEG, PNG, WebP, GIF
