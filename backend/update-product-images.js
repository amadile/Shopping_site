import mongoose from "mongoose";
import Product from "./src/models/Product.js";
import Vendor from "./src/models/Vendor.js";
import dotenv from "dotenv";

dotenv.config();

// Real professional products with matching images
const realProducts = [
  // Electronics
  { name: "Sony WH-1000XM5 Wireless Headphones", category: "electronics", price: 399000, stock: 25, description: "Industry-leading noise canceling headphones with premium sound quality", image: "https://images.unsplash.com/photo-1546435770-a3e426bf472b?w=800" },
  { name: "Apple Watch Series 9", category: "electronics", price: 1200000, stock: 15, description: "Advanced health and fitness tracking smartwatch", image: "https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800" },
  { name: "Logitech MX Master 3S Wireless Mouse", category: "electronics", price: 120000, stock: 40, description: "Advanced wireless mouse for productivity", image: "https://images.unsplash.com/photo-1527814050087-3793815479db?w=800" },
  { name: "Keychron K8 Mechanical Keyboard", category: "electronics", price: 180000, stock: 30, description: "Wireless mechanical keyboard with hot-swappable switches", image: "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800" },
  { name: "Samsung T7 Portable SSD 1TB", category: "electronics", price: 250000, stock: 50, description: "Fast and reliable portable storage", image: "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=800" },
  { name: "Logitech C920 HD Pro Webcam", category: "electronics", price: 95000, stock: 35, description: "Full HD 1080p webcam for video calls", image: "https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800" },
  { name: "iPhone 15 Pro Max", category: "electronics", price: 4500000, stock: 10, description: "Latest flagship smartphone with titanium design", image: "https://images.unsplash.com/photo-1592286927505-2fd0f2d0e7d1?w=800" },
  { name: "MacBook Pro 14-inch M3", category: "electronics", price: 6500000, stock: 8, description: "Powerful laptop for professionals", image: "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800" },

  // Fashion & Accessories
  { name: "Nike Air Max 270", category: "fashion", price: 350000, stock: 45, description: "Comfortable lifestyle sneakers", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" },
  { name: "Ray-Ban Aviator Sunglasses", category: "fashion", price: 180000, stock: 60, description: "Classic aviator sunglasses", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800" },
  { name: "Samsonite Business Backpack", category: "fashion", price: 220000, stock: 30, description: "Professional laptop backpack", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800" },
  { name: "Levi's 501 Original Jeans", category: "fashion", price: 120000, stock: 70, description: "Classic straight fit jeans", image: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=800" },

  // Home & Living
  { name: "Dyson V15 Cordless Vacuum", category: "home", price: 1800000, stock: 12, description: "Powerful cordless vacuum cleaner", image: "https://images.unsplash.com/photo-1558317374-067fb5f30001?w=800" },
  { name: "Philips Air Fryer XXL", category: "home", price: 450000, stock: 25, description: "Healthy cooking with rapid air technology", image: "https://images.unsplash.com/photo-1585515320310-259814833e62?w=800" },
  { name: "Nespresso Coffee Machine", category: "home", price: 380000, stock: 20, description: "Premium espresso and coffee maker", image: "https://images.unsplash.com/photo-1517668808822-9ebb02f2a0e6?w=800" },

  // Sports & Fitness
  { name: "Yoga Mat Premium Non-Slip", category: "sports", price: 45000, stock: 100, description: "Eco-friendly yoga mat with carrying strap", image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800" },
  { name: "Adjustable Dumbbell Set 20kg", category: "sports", price: 280000, stock: 35, description: "Space-saving adjustable dumbbells", image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800" },
  { name: "Fitbit Charge 6 Fitness Tracker", category: "sports", price: 320000, stock: 40, description: "Advanced fitness and health tracker", image: "https://images.unsplash.com/photo-1575311373937-040b8e1fd5b6?w=800" },

  // Books & Education
  { name: "Atomic Habits by James Clear", category: "books", price: 35000, stock: 80, description: "Bestselling book on building good habits", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800" },
  { name: "Kindle Paperwhite E-Reader", category: "electronics", price: 280000, stock: 30, description: "Waterproof e-reader with adjustable light", image: "https://images.unsplash.com/photo-1592496431122-2349e0fbc666?w=800" },
];

async function replaceWithRealProducts() {
  try {
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/shopping-site");
    console.log("✅ Connected to MongoDB\n");

    // Get first vendor to assign products to
    const vendor = await Vendor.findOne();
    if (!vendor) {
      console.log("⚠️  No vendor found. Creating products without vendor assignment.");
    }

    // Delete ALL existing products
    const deleteResult = await Product.deleteMany({});
    console.log(`🗑️  Deleted ${deleteResult.deletedCount} old products\n`);

    // Create real professional products
    console.log("📦 Creating professional products...\n");
    let created = 0;

    for (const productData of realProducts) {
      const product = new Product({
        name: productData.name,
        description: productData.description,
        price: productData.price,
        category: productData.category,
        stock: productData.stock,
        images: [
          productData.image,
          productData.image + "&sig=1",
          productData.image + "&sig=2"
        ],
        vendor: vendor?._id,
        isActive: true,
        rating: Math.floor(Math.random() * 2) + 4, // 4-5 stars
        totalReviews: Math.floor(Math.random() * 50) + 10,
      });

      await product.save();
      created++;
      console.log(`✅ ${product.name}`);
    }

    console.log(`\n🎉 Successfully created ${created} professional products!`);
    console.log(`📸 All products have real names and matching images`);
    console.log(`⭐ Products have realistic ratings and reviews`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  }
}

replaceWithRealProducts();
