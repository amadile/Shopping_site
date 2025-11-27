import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function fixOrders() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');

    // Find all orders
    const orders = await ordersCollection.find({}).toArray();
    console.log(`Found ${orders.length} orders\n`);

    let fixedCount = 0;
    for (const order of orders) {
      const updates = {};
      let needsUpdate = false;

      // Add tax field if missing (calculate as 10% of subtotal)
      if (order.tax === undefined || order.tax === null) {
        const subtotal = order.subtotal || 0;
        updates.tax = subtotal * 0.10;
        needsUpdate = true;
        console.log(`Order ${order._id}: Adding tax = ${updates.tax}`);
      }

      // Add default paymentMethod if missing
      if (!order.paymentMethod) {
        updates.paymentMethod = 'paypal';
        needsUpdate = true;
        console.log(`Order ${order._id}: Adding default paymentMethod = paypal`);
      }

      // Initialize shippingAddress if missing
      if (!order.shippingAddress) {
        updates.shippingAddress = {
          fullName: 'N/A',
          phone: 'N/A',
          addressLine1: 'N/A',
          city: 'N/A',
          state: 'N/A',
          postalCode: 'N/A',
          country: 'N/A'
        };
        needsUpdate = true;
        console.log(`Order ${order._id}: Adding placeholder shippingAddress`);
      }

      if (needsUpdate) {
        await ordersCollection.updateOne(
          { _id: order._id },
          { $set: updates }
        );
        fixedCount++;
        console.log(`✓ Updated order ${order._id}\n`);
      }
    }

    console.log(`\n✅ Fixed ${fixedCount} orders out of ${orders.length}`);

    await mongoose.connection.close();
    console.log('✓ Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

fixOrders();
