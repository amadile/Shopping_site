import { Worker } from "bullmq";
import { logger } from "../config/logger.js";
import { redisClient as redisConnection } from "../config/redis.js";
import inventoryService from "../services/inventoryService.js";

/**
 * Inventory Workers
 * Background jobs for inventory management
 */

// Worker to release expired stock reservations
export const expiredReservationWorker = new Worker(
  "expired-reservations",
  async (job) => {
    try {
      logger.info("Starting expired reservation cleanup job");
      const result = await inventoryService.releaseExpiredReservations();
      logger.info(`Released ${result.releasedCount} expired reservations`);
      return result;
    } catch (error) {
      logger.error("Error in expired reservation worker:", error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1, // Only one cleanup job at a time
    limiter: {
      max: 1,
      duration: 60000, // Maximum 1 job per minute
    },
  }
);

// Worker to check and create low stock alerts
export const lowStockAlertWorker = new Worker(
  "low-stock-alerts",
  async (job) => {
    try {
      logger.info("Starting low stock alert check");
      const result = await inventoryService.getLowStockProducts(100);

      if (result.count > 0) {
        logger.warn(`Found ${result.count} low stock items`);
        // Here you can trigger notifications to admins/vendors
        // e.g., send emails, push notifications, etc.
      }

      return result;
    } catch (error) {
      logger.error("Error in low stock alert worker:", error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

// Worker to check and create out of stock alerts
export const outOfStockAlertWorker = new Worker(
  "out-of-stock-alerts",
  async (job) => {
    try {
      logger.info("Starting out of stock alert check");
      const result = await inventoryService.getOutOfStockProducts(100);

      if (result.count > 0) {
        logger.warn(`Found ${result.count} out of stock items`);
        // Here you can trigger notifications to admins/vendors
      }

      return result;
    } catch (error) {
      logger.error("Error in out of stock alert worker:", error);
      throw error;
    }
  },
  {
    connection: redisConnection,
    concurrency: 1,
  }
);

// Worker event handlers
expiredReservationWorker.on("completed", (job) => {
  logger.info(`Expired reservation job ${job.id} completed`);
});

expiredReservationWorker.on("failed", (job, err) => {
  logger.error(`Expired reservation job ${job.id} failed:`, err);
});

lowStockAlertWorker.on("completed", (job) => {
  logger.info(`Low stock alert job ${job.id} completed`);
});

lowStockAlertWorker.on("failed", (job, err) => {
  logger.error(`Low stock alert job ${job.id} failed:`, err);
});

outOfStockAlertWorker.on("completed", (job) => {
  logger.info(`Out of stock alert job ${job.id} completed`);
});

outOfStockAlertWorker.on("failed", (job, err) => {
  logger.error(`Out of stock alert job ${job.id} failed:`, err);
});

logger.info("Inventory workers initialized");
