import dotenv from "dotenv";
import mongoose from "mongoose";
import Product from "./src/models/Product.js";
import User from "./src/models/User.js";
import Vendor from "./src/models/Vendor.js";

dotenv.config();

const sampleProducts = [
  {
    name: "Wireless Bluetooth Headphones",
    description:
      "High-quality wireless headphones with noise cancellation and 30-hour battery life.",
    price: 79.99,
    category: "Electronics",
    subcategory: "Audio",
    stock: 50,
    images: ["https://placehold.co/400x400/4F46E5/white?text=Headphones"],
    featured: true,
    tags: ["wireless", "bluetooth", "audio", "headphones"],
    specifications: {
      brand: "TechSound",
      model: "TS-1000",
      color: "Black",
      connectivity: "Bluetooth 5.0",
      batteryLife: "30 hours",
    },
  },
  {
    name: "Smart Watch Pro",
    description:
      "Advanced smartwatch with fitness tracking, heart rate monitor, and GPS.",
    price: 199.99,
    category: "Electronics",
    subcategory: "Wearables",
    stock: 35,
    images: ["https://placehold.co/400x400/059669/white?text=Smart+Watch"],
    featured: true,
    tags: ["smartwatch", "fitness", "wearable", "gps"],
    specifications: {
      brand: "FitTech",
      model: "FT-Pro",
      display: "1.4 inch AMOLED",
      waterResistance: "5ATM",
      batteryLife: "7 days",
    },
  },
  {
    name: "Laptop Backpack",
    description:
      "Durable backpack with padded laptop compartment, fits up to 15.6 inch laptops.",
    price: 49.99,
    category: "Accessories",
    subcategory: "Bags",
    stock: 100,
    images: ["https://placehold.co/400x400/DC2626/white?text=Backpack"],
    featured: false,
    tags: ["backpack", "laptop", "travel", "bag"],
    specifications: {
      brand: "TravelGear",
      material: "Waterproof Nylon",
      capacity: "25L",
      laptopSize: "Up to 15.6 inch",
    },
  },
  {
    name: "Wireless Gaming Mouse",
    description:
      "Precision gaming mouse with RGB lighting and programmable buttons.",
    price: 59.99,
    category: "Electronics",
    subcategory: "Gaming",
    stock: 75,
    images: ["https://placehold.co/400x400/7C3AED/white?text=Gaming+Mouse"],
    featured: true,
    tags: ["gaming", "mouse", "wireless", "rgb"],
    specifications: {
      brand: "GamePro",
      model: "GP-M500",
      dpi: "16000",
      buttons: "8 programmable",
      batteryLife: "70 hours",
    },
  },
  {
    name: "Portable SSD 1TB",
    description:
      "Ultra-fast portable SSD with USB-C, read speeds up to 1050 MB/s.",
    price: 129.99,
    category: "Electronics",
    subcategory: "Storage",
    stock: 60,
    images: ["https://placehold.co/400x400/0891B2/white?text=SSD"],
    featured: false,
    tags: ["ssd", "storage", "portable", "usb-c"],
    specifications: {
      brand: "DataStore",
      capacity: "1TB",
      readSpeed: "1050 MB/s",
      writeSpeed: "1000 MB/s",
      interface: "USB 3.2 Gen 2",
    },
  },
  {
    name: "4K Webcam",
    description:
      "Professional 4K webcam with auto-focus and built-in microphone.",
    price: 89.99,
    category: "Electronics",
    subcategory: "Cameras",
    stock: 40,
    images: ["https://placehold.co/400x400/EA580C/white?text=Webcam"],
    featured: true,
    tags: ["webcam", "4k", "streaming", "video"],
    specifications: {
      brand: "StreamCam",
      resolution: "4K 30fps",
      fieldOfView: "90 degrees",
      microphone: "Dual stereo",
      mountType: "Universal clip",
    },
  },
  {
    name: "Mechanical Keyboard RGB",
    description:
      "Premium mechanical keyboard with Cherry MX switches and customizable RGB lighting.",
    price: 149.99,
    category: "Electronics",
    subcategory: "Gaming",
    stock: 45,
    images: ["https://placehold.co/400x400/DB2777/white?text=Keyboard"],
    featured: true,
    tags: ["keyboard", "mechanical", "gaming", "rgb"],
    specifications: {
      brand: "KeyMaster",
      switchType: "Cherry MX Red",
      layout: "Full-size",
      backlighting: "RGB per-key",
      connectivity: "Wired USB",
    },
  },
  {
    name: "Wireless Charger Pad",
    description:
      "Fast wireless charging pad compatible with Qi-enabled devices.",
    price: 29.99,
    category: "Electronics",
    subcategory: "Accessories",
    stock: 150,
    images: ["https://placehold.co/400x400/16A34A/white?text=Charger"],
    featured: false,
    tags: ["charger", "wireless", "qi", "fast-charging"],
    specifications: {
      brand: "PowerMax",
      maxOutput: "15W",
      compatibility: "Qi-enabled devices",
      features: "LED indicator, Foreign object detection",
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

    if (count === 0) {
      console.log("🌱 No products found. Seeding database...");

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
      console.log(`✅ Successfully added ${result.length} products!`);

      // Update vendor product count
      vendor.totalProducts = result.length;
      await vendor.save();

      // Display added products
      result.forEach((product, index) => {
        console.log(`   ${index + 1}. ${product.name} - $${product.price}`);
      });
    } else {
      console.log("✅ Products already exist in database");

      // Display existing products
      const products = await Product.find()
        .select("name price stock")
        .limit(10);
      console.log("\n📦 Sample of existing products:");
      products.forEach((product, index) => {
        console.log(
          `   ${index + 1}. ${product.name} - $${product.price} (Stock: ${
            product.stock
          })`
        );
      });
    }

    await mongoose.disconnect();
    console.log("\n✅ Database connection closed");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    process.exit(1);
  }
}

seedProducts();
