import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

// User Schema (simplified version)
const userSchema = new mongoose.Schema({
    name: String,
    email: { type: String, unique: true },
    password: String,
    role: { type: String, enum: ['customer', 'vendor', 'admin'], default: 'customer' },
    isVerified: { type: Boolean, default: false },
    phone: String,
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);

async function createAdminAccount() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        // Admin account details
        const adminData = {
            name: 'Admin User',
            email: 'admin@shopping.com',
            password: 'Admin@123',  // Change this to a secure password
            role: 'admin',
            isVerified: true,
            phone: '+256700000000'
        };

        // Check if admin already exists
        const existingAdmin = await User.findOne({ email: adminData.email });

        if (existingAdmin) {
            console.log('⚠️  Admin account already exists!');
            console.log('📧 Email:', adminData.email);

            // Ask if they want to reset the password
            console.log('\n💡 To reset password, delete the existing admin and run this script again.');
            console.log('   Or update the password directly in MongoDB.\n');

            await mongoose.disconnect();
            process.exit(0);
        }

        // Hash the password
        console.log('🔐 Hashing password...');
        const hashedPassword = await bcrypt.hash(adminData.password, 10);

        // Create admin user
        const admin = new User({
            ...adminData,
            password: hashedPassword
        });

        await admin.save();

        console.log('✅ Admin account created successfully!\n');
        console.log('═'.repeat(50));
        console.log('📋 ADMIN LOGIN CREDENTIALS');
        console.log('═'.repeat(50));
        console.log('📧 Email:    ', adminData.email);
        console.log('🔑 Password: ', adminData.password);
        console.log('👤 Role:     ', adminData.role);
        console.log('═'.repeat(50));
        console.log('\n💡 IMPORTANT: Change the password after first login!');
        console.log('🌐 Login at: http://localhost:3000/login\n');

        await mongoose.disconnect();
        console.log('✅ Database connection closed');
        process.exit(0);

    } catch (error) {
        console.error('❌ Error creating admin account:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the script
createAdminAccount();
