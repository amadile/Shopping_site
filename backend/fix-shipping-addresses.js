import dotenv from "dotenv";
import mongoose from "mongoose";
import Order from "./src/models/Order.js";

// Load environment variables
dotenv.config();

const fixShippingAddresses = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✓ Connected to MongoDB\n");

    // Find all orders with shippingAddress
    const orders = await Order.find({ shippingAddress: { $exists: true } });
    console.log(`Found ${orders.length} orders with shippingAddress\n`);

    let fixedCount = 0;

    for (const order of orders) {
      let needsUpdate = false;
      const address = order.shippingAddress;

      // Check if all fields are empty or just whitespace
      const hasValidData =
        (address.fullName && address.fullName.trim()) ||
        (address.phone && address.phone.trim()) ||
        (address.addressLine1 && address.addressLine1.trim()) ||
        (address.addressLine2 && address.addressLine2.trim()) ||
        (address.city && address.city.trim()) ||
        (address.state && address.state.trim()) ||
        (address.postalCode && address.postalCode.trim()) ||
        (address.country && address.country.trim());

      if (!hasValidData) {
        console.log(
          `Order ${order._id}: Removing empty placeholder shippingAddress`
        );
        order.shippingAddress = undefined;
        needsUpdate = true;
      }

      if (needsUpdate) {
        await order.save();
        console.log(`✓ Updated order ${order._id}`);
        fixedCount++;
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} orders out of ${orders.length}`);
    console.log("✓ Database connection closed");
  } catch (error) {
    console.error("❌ Error:", error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
  }
};

fixShippingAddresses();
