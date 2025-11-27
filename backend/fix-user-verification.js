import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/models/User.js";

dotenv.config();

async function fixUserVerification() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Update the user
    const result = await User.updateOne(
      { email: "andimashafiq8@gmail.com" },
      { $set: { isVerified: true } }
    );

    console.log("Update result:", result);
    
    if (result.matchedCount > 0) {
      console.log("✅ User verified successfully!");
    } else {
      console.log("❌ User not found");
    }

    await mongoose.disconnect();
    console.log("Disconnected from MongoDB");
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

fixUserVerification();
