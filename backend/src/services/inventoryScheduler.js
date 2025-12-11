import { Queue } from "bullmq";
import { logger } from "../config/logger.js";
import { redisClient as redisConnection } from "../config/redis.js";

/**
 * Inventory Job Scheduler
 * Schedules recurring inventory management jobs
 */

// Create queues
export const expiredReservationQueue = new Queue("expired-reservations", {
  connection: redisConnection,
});

export const lowStockAlertQueue = new Queue("low-stock-alerts", {
  connection: redisConnection,
});

export const outOfStockAlertQueue = new Queue("out-of-stock-alerts", {
  connection: redisConnection,
});

/**
 * Schedule repeating jobs
 */
export async function scheduleInventoryJobs() {
  try {
    // Release expired reservations every 5 minutes
    await expiredReservationQueue.add(
      "cleanup-expired-reservations",
      {},
      {
        repeat: {
          pattern: "*/5 * * * *", // Every 5 minutes
        },
        jobId: "cleanup-expired-reservations", // Prevent duplicates
      }
    );
    logger.info("Scheduled: Release expired reservations (every 5 minutes)");

    // Check low stock alerts daily at 9 AM
    await lowStockAlertQueue.add(
      "check-low-stock",
      {},
      {
        repeat: {
          pattern: "0 9 * * *", // Daily at 9 AM
        },
        jobId: "check-low-stock-daily",
      }
    );
    logger.info("Scheduled: Low stock alert check (daily at 9 AM)");

    // Check out of stock alerts daily at 9 AM
    await outOfStockAlertQueue.add(
      "check-out-of-stock",
      {},
      {
        repeat: {
          pattern: "0 9 * * *", // Daily at 9 AM
        },
        jobId: "check-out-of-stock-daily",
      }
    );
    logger.info("Scheduled: Out of stock alert check (daily at 9 AM)");

    logger.info("All inventory jobs scheduled successfully");
  } catch (error) {
    logger.error("Error scheduling inventory jobs:", error);
    throw error;
  }
}

/**
 * Manually trigger jobs (useful for testing or admin panel)
 */
export async function triggerExpiredReservationCleanup() {
  try {
    const job = await expiredReservationQueue.add("manual-cleanup", {});
    logger.info(`Manually triggered expired reservation cleanup: ${job.id}`);
    return job;
  } catch (error) {
    logger.error("Error triggering manual cleanup:", error);
    throw error;
  }
}

export async function triggerLowStockCheck() {
  try {
    const job = await lowStockAlertQueue.add("manual-low-stock-check", {});
    logger.info(`Manually triggered low stock check: ${job.id}`);
    return job;
  } catch (error) {
    logger.error("Error triggering low stock check:", error);
    throw error;
  }
}

export async function triggerOutOfStockCheck() {
  try {
    const job = await outOfStockAlertQueue.add("manual-out-of-stock-check", {});
    logger.info(`Manually triggered out of stock check: ${job.id}`);
    return job;
  } catch (error) {
    logger.error("Error triggering out of stock check:", error);
    throw error;
  }
}

/**
 * Get queue statistics
 */
export async function getInventoryQueueStats() {
  try {
    const [expiredStats, lowStockStats, outOfStockStats] = await Promise.all([
      expiredReservationQueue.getJobCounts(),
      lowStockAlertQueue.getJobCounts(),
      outOfStockAlertQueue.getJobCounts(),
    ]);

    return {
      expiredReservations: expiredStats,
      lowStock: lowStockStats,
      outOfStock: outOfStockStats,
    };
  } catch (error) {
    logger.error("Error getting queue stats:", error);
    throw error;
  }
}

/**
 * Clean completed jobs older than 7 days
 */
export async function cleanOldJobs() {
  try {
    const grace = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

    await Promise.all([
      expiredReservationQueue.clean(grace, 100, "completed"),
      expiredReservationQueue.clean(grace, 100, "failed"),
      lowStockAlertQueue.clean(grace, 100, "completed"),
      lowStockAlertQueue.clean(grace, 100, "failed"),
      outOfStockAlertQueue.clean(grace, 100, "completed"),
      outOfStockAlertQueue.clean(grace, 100, "failed"),
    ]);

    logger.info("Cleaned old completed and failed jobs");
  } catch (error) {
    logger.error("Error cleaning old jobs:", error);
    throw error;
  }
}

export default {
  scheduleInventoryJobs,
  triggerExpiredReservationCleanup,
  triggerLowStockCheck,
  triggerOutOfStockCheck,
  getInventoryQueueStats,
  cleanOldJobs,
};
