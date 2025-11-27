import mongoose from "mongoose";

// Variant schema for product variations (size, color, etc.)
const variantSchema = new mongoose.Schema({
  sku: { type: String, required: true }, // Unique identifier for this variant
  name: { type: String }, // e.g., "Large / Red", "XL / Blue"
  size: { type: String }, // e.g., "S", "M", "L", "XL"
  color: { type: String }, // e.g., "Red", "Blue", "Black"
  material: { type: String }, // e.g., "Cotton", "Polyester"
  style: { type: String }, // e.g., "Regular", "Slim Fit"
  price: { type: Number, min: 0 }, // Override product price if different
  stock: { type: Number, required: true, min: 0, default: 0 },
  images: [{ type: String }], // Variant-specific images
  isActive: { type: Boolean, default: true },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 }, // Base price (or starting price)
    category: { type: String, required: true },
    stock: { type: Number, required: true, min: 0 }, // Total stock across all variants
    images: [{ type: String }], // Default product images
    vendor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
    },
    // Vendor-specific commission for this product
    vendorCommission: {
      type: Number,
      default: 15, // Default to vendor's commission rate
      min: 0,
      max: 100,
    },
    isVendorProduct: {
      type: Boolean,
      default: true,
    },
    isActive: { type: Boolean, default: true },
    tags: [{ type: String }],
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewCount: { type: Number, default: 0 },
    variants: [variantSchema], // Product variants (size, color, etc.)
    hasVariants: { type: Boolean, default: false }, // Quick check if product has variants
  },
  { timestamps: true }
);

// Index for search
productSchema.index(
  { name: "text", description: "text", tags: "text" },
  { weights: { name: 10, tags: 5, description: 1 } } // Prioritize name > tags > description
);
productSchema.index(
  { category: 1, price: 1 },
  { partialFilterExpression: { isActive: true } }
); // Partial index - only active products
productSchema.index({ vendor: 1 });
productSchema.index({ rating: -1 }); // Sort by rating
productSchema.index({ createdAt: -1 }); // New products
productSchema.index({ isActive: 1, category: 1 }); // Active products by category
productSchema.index({ hasVariants: 1 }); // Filter products with/without variants
productSchema.index({ "variants.sku": 1 }, { sparse: true }); // SKU lookup for variants (sparse)
productSchema.index({ "variants.isActive": 1 }); // Active variants

export default mongoose.model("Product", productSchema);