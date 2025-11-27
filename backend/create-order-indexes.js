import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

async function createIndexes() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✓ Connected to MongoDB\n');

    const db = mongoose.connection.db;
    const ordersCollection = db.collection('orders');

    console.log('Creating indexes for orders collection...\n');

    // Drop existing indexes except _id
    const existingIndexes = await ordersCollection.indexes();
    console.log('Existing indexes:');
    existingIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });
    console.log('');

    // Create performance indexes
    const indexes = [
      {
        key: { user: 1, createdAt: -1 },
        name: 'user_createdAt',
        background: true
      },
      {
        key: { status: 1, createdAt: -1 },
        name: 'status_createdAt',
        background: true
      },
      {
        key: { createdAt: -1 },
        name: 'createdAt_desc',
        background: true
      }
    ];

    for (const index of indexes) {
      try {
        await ordersCollection.createIndex(index.key, {
          name: index.name,
          background: index.background
        });
        console.log(`✓ Created index: ${index.name}`);
      } catch (err) {
        if (err.code === 85) {
          console.log(`⚠ Index ${index.name} already exists, skipping`);
        } else {
          console.error(`✗ Error creating index ${index.name}:`, err.message);
        }
      }
    }

    console.log('\n✅ Index creation completed');

    // Show final indexes
    const finalIndexes = await ordersCollection.indexes();
    console.log('\nFinal indexes:');
    finalIndexes.forEach(idx => {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}`);
    });

    await mongoose.connection.close();
    console.log('\n✓ Database connection closed');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createIndexes();
