import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

const CartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    items: [
      {
        product: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true, min: 1 },
        variantId: mongoose.Schema.Types.Mixed, // Mixed to handle any value
        variantDetails: mongoose.Schema.Types.Mixed, // Mixed to handle any value
      },
    ],
    appliedCoupon: {
      couponId: { type: mongoose.Schema.Types.ObjectId, ref: "Coupon" },
      code: String,
      discountType: String,
      discountValue: Number,
      discountAmount: Number,
    },
  },
  { timestamps: true, strict: false }
); // strict: false to allow modifications

const Cart = mongoose.model("Cart", CartSchema);

async function fixCartNulls() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all carts
    const carts = await Cart.find({});
    console.log(`Found ${carts.length} carts`);

    let fixedCount = 0;
    for (const cart of carts) {
      let needsSave = false;

      console.log(`Processing cart ${cart._id}...`);

      // Fix each item in the cart
      for (let i = 0; i < cart.items.length; i++) {
        const item = cart.items[i];

        console.log(
          `  Item ${i}: variantId=${item.variantId}, variantDetails=${item.variantDetails}`
        );

        // Remove null variantId - set to undefined
        if (item.variantId === null) {
          cart.items[i].variantId = undefined;
          delete cart.items[i].variantId; // Actually delete the field
          needsSave = true;
          console.log(`    ✓ Removed null variantId`);
        }

        // Remove null variantDetails - set to undefined
        if (item.variantDetails === null) {
          cart.items[i].variantDetails = undefined;
          delete cart.items[i].variantDetails; // Actually delete the field
          needsSave = true;
          console.log(`    ✓ Removed null variantDetails`);
        }
      }

      if (needsSave) {
        // Update directly in database
        await mongoose.connection.collection("carts").updateOne(
          { _id: cart._id },
          {
            $set: {
              items: cart.items.map((item) => {
                const cleanItem = {
                  product: item.product,
                  quantity: item.quantity,
                  _id: item._id,
                };
                // Only add variantId if it exists and is not null
                if (item.variantId !== null && item.variantId !== undefined) {
                  cleanItem.variantId = item.variantId;
                }
                // Only add variantDetails if it exists and is not null
                if (
                  item.variantDetails !== null &&
                  item.variantDetails !== undefined
                ) {
                  cleanItem.variantDetails = item.variantDetails;
                }
                return cleanItem;
              }),
            },
          }
        );
        fixedCount++;
        console.log(`  ✓ Saved cart ${cart._id}\n`);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} carts`);
    await mongoose.connection.close();
    console.log("Database connection closed");
  } catch (error) {
    console.error("Error fixing carts:", error);
    process.exit(1);
  }
}

fixCartNulls();
