import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "./src/models/Product.js";
import User from "./src/models/User.js";
import Vendor from "./src/models/Vendor.js";

dotenv.config();

// Real product images from Unsplash (free to use)
const sampleProducts = [
  {
    name: "Wireless Bluetooth Headphones",
    description:
      "High-quality wireless headphones with noise cancellation and 30-hour battery life. Premium sound quality with deep bass and crystal clear highs.",
    price: 79.99,
    category: "Electronics",
    subcategory: "Audio",
    stock: 50,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=600&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1545127398-14699f92334b?w=600&h=600&fit=crop&q=80"
    ],
    featured: true,
    tags: ["wireless", "bluetooth", "audio", "headphones", "noise-cancellation"],
    specifications: {
      brand: "TechSound",
      model: "TS-1000",
      color: "Black",
      connectivity: "Bluetooth 5.0",
      batteryLife: "30 hours",
      weight: "250g"
    },
  },
  {
    name: "Smart Watch Pro",
    description:
      "Advanced smartwatch with fitness tracking, heart rate monitor, GPS, and 7-day battery life. Perfect companion for your active lifestyle.",
    price: 199.99,
    category: "Electronics",
    subcategory: "Wearables",
    stock: 35,
    images: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=600&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&h=600&fit=crop&q=80"
    ],
    featured: true,
    tags: ["smartwatch", "fitness", "wearable", "gps", "health"],
    specifications: {
      brand: "FitTech",
      model: "FT-Pro",
      display: "1.4 inch AMOLED",
      waterResistance: "5ATM",
      batteryLife: "7 days",
      compatibility: "iOS & Android"
    },
  },
  {
    name: "Laptop Backpack",
    description:
      "Durable and water-resistant backpack with padded laptop compartment, fits up to 15.6 inch laptops. Multiple pockets for organization.",
    price: 49.99,
    category: "Accessories",
    subcategory: "Bags",
    stock: 100,
    images: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=600&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=600&h=600&fit=crop&q=80"
    ],
    featured: false,
    tags: ["backpack", "laptop", "travel", "bag", "waterproof"],
    specifications: {
      brand: "TravelGear",
      material: "Waterproof Nylon",
      capacity: "25L",
      laptopSize: "Up to 15.6 inch",
      weight: "800g"
    },
  },
  {
    name: "Wireless Gaming Mouse",
    description:
      "Precision gaming mouse with customizable RGB lighting, 16000 DPI sensor, and programmable buttons. Perfect for competitive gaming.",
    price: 59.99,
    category: "Electronics",
    subcategory: "Gaming",
    stock: 75,
    images: [
      "https://images.unsplash.com/photo-1527814050087-3793815479db?w=600&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?w=600&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1612287230202-1ff1d85d1bdf?w=600&h=600&fit=crop&q=80"
    ],
    featured: true,
    tags: ["gaming", "mouse", "wireless", "rgb", "ergonomic"],
    specifications: {
      brand: "GamePro",
      model: "GP-M500",
      dpi: "16000",
      buttons: "8 programmable",
      batteryLife: "70 hours",
      connectivity: "2.4GHz Wireless"
    },
  },
  {
    name: "Portable SSD 1TB",
    description:
      "Ultra-fast portable SSD with USB-C connectivity, read speeds up to 1050 MB/s. Compact and durable design for professionals on the go.",
    price: 129.99,
    category: "Electronics",
    subcategory: "Storage",
    stock: 60,
    images: [
      "https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=600&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1531492746076-161ca9bcad58?w=600&h=600&fit=crop&q=80"
    ],
    featured: false,
    tags: ["ssd", "storage", "portable", "usb-c", "fast"],
    specifications: {
      brand: "DataStore",
      capacity: "1TB",
      readSpeed: "1050 MB/s",
      writeSpeed: "1000 MB/s",
      interface: "USB 3.2 Gen 2",
      warranty: "5 years"
    },
  },
  {
    name: "4K Webcam",
    description:
      "Professional 4K webcam with auto-focus, built-in dual microphone, and wide-angle lens. Perfect for streaming and video calls.",
    price: 89.99,
    category: "Electronics",
    subcategory: "Cameras",
    stock: 40,
    images: [
      "https://images.unsplash.com/photo-1587826080692-f439cd0b70da?w=600&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1614624532983-4ce03382d63d?w=600&h=600&fit=crop&q=80"
    ],
    featured: true,
    tags: ["webcam", "4k", "streaming", "video", "conference"],
    specifications: {
      brand: "StreamCam",
      resolution: "4K 30fps",
      fieldOfView: "90 degrees",
      microphone: "Dual stereo",
      mountType: "Universal clip",
      compatibility: "Windows, Mac, Linux"
    },
  },
  {
    name: "Mechanical Keyboard RGB",
    description:
      "Premium mechanical keyboard with Cherry MX Red switches and per-key RGB lighting. Designed for gaming and productivity.",
    price: 149.99,
    category: "Electronics",
    subcategory: "Gaming",
    stock: 45,
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1595225476474-87563907a212?w=600&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1511467687858-23d96c32e4ae?w=600&h=600&fit=crop&q=80"
    ],
    featured: true,
    tags: ["keyboard", "mechanical", "gaming", "rgb", "cherry-mx"],
    specifications: {
      brand: "KeyMaster",
      switchType: "Cherry MX Red",
      layout: "Full-size (104 keys)",
      backlighting: "RGB per-key",
      connectivity: "Wired USB-C",
      keyrollover: "N-Key Rollover"
    },
  },
  {
    name: "Wireless Charger Pad",
    description:
      "Fast wireless charging pad with 15W output, compatible with all Qi-enabled devices. LED indicator and foreign object detection.",
    price: 29.99,
    category: "Electronics",
    subcategory: "Accessories",
    stock: 150,
    images: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&h=600&fit=crop&q=80",
      "https://images.unsplash.com/photo-1591290619762-c588134293e6?w=600&h=600&fit=crop&q=80"
    ],
    featured: false,
    tags: ["charger", "wireless", "qi", "fast-charging", "accessory"],
    specifications: {
      brand: "PowerMax",
      maxOutput: "15W",
      compatibility: "Qi-enabled devices",
      features: "LED indicator, Foreign object detection",
      dimensions: "10cm diameter",
      color: "Black"
    },
  },
];

async function seedProducts() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    // Check if products exist
    const count = await Product.countDocuments();
    console.log(`📊 Current products in database: ${count}`);

    if (count > 0) {
      console.log("\n⚠️  Products already exist. Do you want to:");
      console.log("   1. Keep existing products");
      console.log("   2. Update existing products with new images");
      console.log("\n   To update, delete all products first and run this script again.");
      console.log("   Or run: node update-product-images-real.js");
      
      await mongoose.disconnect();
      process.exit(0);
    }

    console.log("🌱 No products found. Seeding database with real images...");

    // Create or get default vendor
    let vendor = await Vendor.findOne();

    if (!vendor) {
      console.log("📝 Creating default vendor...");

      // Create a default admin user for the vendor if doesn't exist
      let adminUser = await User.findOne({
        email: "admin@shopping-site.com",
      });

      if (!adminUser) {
        adminUser = await User.create({
          name: "Admin Store",
          email: "admin@shopping-site.com",
          password: "Admin123!",
          role: "vendor",
          isVerified: true,
        });
        console.log("   ✅ Created admin user for vendor");
      }

      vendor = await Vendor.create({
        user: adminUser._id,
        businessName: "Shopping Site Official Store",
        businessEmail: "store@shopping-site.com",
        businessPhone: "+1-555-0100",
        description:
          "Official store offering quality products across all categories",
        isVerified: true,
        verificationStatus: "approved",
        storeSettings: {
          isActive: true,
          allowReturns: true,
          returnPeriod: 30,
        },
      });
      console.log("   ✅ Created default vendor");
    }

    // Add vendor to all sample products
    const productsWithVendor = sampleProducts.map((product) => ({
      ...product,
      vendor: vendor._id,
    }));

    // Insert sample products
    const result = await Product.insertMany(productsWithVendor);
    console.log(`\n✅ Successfully added ${result.length} products with REAL IMAGES!`);

    // Update vendor product count
    vendor.totalProducts = result.length;
    await vendor.save();

    // Display added products
    console.log("\n📦 Products added:");
    result.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - $${product.price}`);
      console.log(`      📸 ${product.images.length} real image(s)`);
    });

    console.log("\n🎉 Database seeded successfully with real product images from Unsplash!");
    console.log("💡 All images are high-quality, professional product photos.");

    await mongoose.disconnect();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    process.exit(1);
  }
}

seedProducts();
