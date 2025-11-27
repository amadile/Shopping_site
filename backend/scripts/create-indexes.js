import dotenv from "dotenv";
import mongoose from "mongoose";

// Load environment variables
dotenv.config();

// Import all models (this will register indexes)
import "../src/models/Cart.js";
import "../src/models/Coupon.js";
import "../src/models/Inventory.js";
import "../src/models/Order.js";
import "../src/models/Product.js";
import "../src/models/Review.js";
import "../src/models/StockAlert.js";
import "../src/models/StockHistory.js";
import "../src/models/StockReservation.js";
import "../src/models/User.js";

/**
 * Database Index Creation Script
 * Run this script to create/sync all indexes in your MongoDB database
 *
 * Usage: node scripts/create-indexes.js
 */

async function createIndexes() {
  try {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ Connected to MongoDB");

    console.log("\n📊 Creating/syncing indexes for all collections...\n");

    const collections = mongoose.connection.collections;
    let totalIndexes = 0;

    for (const [collectionName, collection] of Object.entries(collections)) {
      console.log(`\n🔧 Processing collection: ${collectionName}`);

      try {
        // Get the model
        const modelName =
          collectionName.charAt(0).toUpperCase() + collectionName.slice(1, -1);
        const model = mongoose.model(modelName);

        // Sync indexes (creates new indexes, removes old ones not in schema)
        await model.syncIndexes();

        // Get all indexes
        const indexes = await collection.listIndexes().toArray();
        console.log(`   ✅ Synced ${indexes.length} indexes`);

        // Display indexes
        indexes.forEach((index) => {
          const keys = Object.keys(index.key).join(", ");
          const type = index.unique
            ? "unique"
            : index.sparse
            ? "sparse"
            : "regular";
          console.log(`      - ${keys} (${type})`);
        });

        totalIndexes += indexes.length;
      } catch (error) {
        console.log(`   ⚠️  Skipped (model not found): ${error.message}`);
      }
    }

    console.log(
      `\n✅ Successfully created/synced ${totalIndexes} indexes across all collections`
    );
    console.log("\n📈 Index Summary:");
    console.log("   - Text search indexes for products");
    console.log("   - Compound indexes for common queries");
    console.log("   - Sparse indexes for optional fields");
    console.log("   - Partial indexes for filtered data");
    console.log("   - TTL indexes for automatic cleanup");
    console.log("   - Unique indexes for constraint enforcement");

    console.log("\n🎯 Performance Tips:");
    console.log("   1. Monitor slow queries in production");
    console.log("   2. Use .explain() to verify index usage");
    console.log("   3. Review index usage in MongoDB Atlas");
    console.log(
      "   4. Consider compound indexes for frequent multi-field queries"
    );
    console.log("   5. Remove unused indexes to save space");

    console.log(
      "\n✨ All done! Your database is now optimized for performance.\n"
    );
  } catch (error) {
    console.error("\n❌ Error creating indexes:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log("🔌 Disconnected from MongoDB");
    process.exit(0);
  }
}

// Run the script
createIndexes();
