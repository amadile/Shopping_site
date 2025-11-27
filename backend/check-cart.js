import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const CartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantity: { type: Number, required: true, min: 1 },
    variantId: mongoose.Schema.Types.Mixed, // Accept any type to see what's there
    variantDetails: mongoose.Schema.Types.Mixed, // Accept any type to see what's there
  }],
  appliedCoupon: {
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon' },
    code: String,
    discountType: String,
    discountValue: Number,
    discountAmount: Number,
  },
}, { timestamps: true });

const Cart = mongoose.model('Cart', CartSchema);

async function checkCart() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB\n');

    const carts = await Cart.find({});
    console.log(`Found ${carts.length} cart(s)\n`);

    for (const cart of carts) {
      console.log(`Cart ID: ${cart._id}`);
      console.log(`User ID: ${cart.user}`);
      console.log(`Items count: ${cart.items.length}\n`);
      
      cart.items.forEach((item, index) => {
        console.log(`Item ${index}:`);
        console.log(`  Product: ${item.product}`);
        console.log(`  Quantity: ${item.quantity}`);
        console.log(`  variantId: ${item.variantId} (type: ${typeof item.variantId}, is null: ${item.variantId === null})`);
        console.log(`  variantDetails: ${JSON.stringify(item.variantDetails)} (type: ${typeof item.variantDetails}, is null: ${item.variantDetails === null})`);
        console.log(`  Raw variantDetails:`, item.variantDetails);
        console.log('');
      });
    }

    await mongoose.connection.close();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkCart();
