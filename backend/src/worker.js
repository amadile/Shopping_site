import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import { logger } from "./config/logger.js";
import "./config/queue.js";
import { scheduleInventoryJobs } from "./services/inventoryScheduler.js";
import "./workers/inventoryWorker.js"; // Import inventory workers

logger.info("Worker process starting...");

if (process.env.MONGO_URI) {
  mongoose
    .connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    .then(async () => {
      logger.info("Worker: MongoDB connected");

      // Schedule inventory jobs
      try {
        await scheduleInventoryJobs();
        logger.info("Worker: Inventory jobs scheduled");
      } catch (error) {
        logger.error("Worker: Failed to schedule inventory jobs:", error);
      }
    })
    .catch((err) => {
      logger.error("Worker: MongoDB connection error:", err);
      process.exit(1);
    });
}

process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down worker gracefully");
  await mongoose.connection.close();
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("SIGINT received, shutting down worker gracefully");
  await mongoose.connection.close();
  process.exit(0);
});
