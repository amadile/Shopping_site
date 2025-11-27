import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "./src/models/User.js";

dotenv.config();

async function checkUser() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB\n");

    // Find the user
    const user = await User.findOne({ email: "andimashafiq8@gmail.com" });
    
    if (!user) {
      console.log("❌ User not found!");
    } else {
      console.log("✅ User found:");
      console.log("  Email:", user.email);
      console.log("  Name:", user.name);
      console.log("  isVerified:", user.isVerified);
      console.log("  Role:", user.role);
      console.log("  Created:", user.createdAt);
      console.log("\n  Full user object:");
      console.log(JSON.stringify(user, null, 2));
    }

    await mongoose.disconnect();
  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkUser();
