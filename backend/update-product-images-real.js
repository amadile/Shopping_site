import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "./src/models/Product.js";

dotenv.config();

// Real product images from Unsplash
const imageMap = {
  "Wireless Bluetooth Headphones": [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1545127398-14699f92334b?w=600&h=600&fit=crop&q=80"
  ],
  "Smart Watch Pro": [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=600&fit=crop&q=80"
  ],
  "Laptop Backpack": [
    "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop&q=80"
  ],
  "Wireless Gaming Mouse": [
    "https://images.unsplash.com/photo-1527814050087-3793815479db?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&h=600&fit=crop&q=80"
  ],
  "Portable SSD 1TB": [
    "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=600&h=600&fit=crop&q=80"
  ],
  "4K Webcam": [
    "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=600&h=600&fit=crop&q=80"
  ],
  "Mechanical Keyboard RGB": [
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600&h=600&fit=crop&q=80"
  ],
  "Wireless Charger Pad": [
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=600&fit=crop&q=80",
    "https://images.unsplash.com/photo-1591290619762-c588134293e6?w=600&h=600&fit=crop&q=80"
  ],
};

async function updateProductImages() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log("\n🔄 Updating products with REAL images from Unsplash...\n");

    let updated = 0;

    for (const [name, imageUrls] of Object.entries(imageMap)) {
      const result = await Product.updateOne(
        { name },
        { $set: { images: imageUrls } }
      );

      if (result.modifiedCount > 0) {
        console.log(`   ✅ Updated: ${name}`);
        console.log(`      📸 ${imageUrls.length} real image(s) added`);
        updated++;
      } else {
        console.log(`   ⚠️  Product not found: ${name}`);
      }
    }

    console.log(`\n✅ Successfully updated ${updated} product(s) with REAL images!`);
    console.log("💡 All images are high-quality professional photos from Unsplash.");
    console.log("🌐 Images are served via CDN for fast loading worldwide.");

    await mongoose.disconnect();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error updating product images:", error);
    process.exit(1);
  }
}

updateProductImages();
