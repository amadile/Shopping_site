import { Queue, Worker } from "bullmq";
import { redisClient } from "./redis.js";
import { logger } from "./logger.js";
import { sendOrderConfirmation, sendOrderStatusUpdate } from "../services/emailService.js";

const connection = redisClient
  ? {
      host: process.env.REDIS_URL?.split("://")[1]?.split(":")[0] || "localhost",
      port: parseInt(process.env.REDIS_URL?.split(":")[2]) || 6379,
    }
  : null;

export const emailQueue = connection
  ? new Queue("email", { connection })
  : {
      add: async (name, data) => {
        logger.info(`Mock queue: ${name}`, data);
        if (name === "orderConfirmation") {
          await sendOrderConfirmation(data.user, data.order);
        } else if (name === "orderStatusUpdate") {
          await sendOrderStatusUpdate(data.user, data.order);
        }
      },
    };

if (connection) {
  const emailWorker = new Worker(
    "email",
    async (job) => {
      logger.info(`Processing email job: ${job.name}`, job.data);

      switch (job.name) {
        case "orderConfirmation":
          await sendOrderConfirmation(job.data.user, job.data.order);
          break;
        case "orderStatusUpdate":
          await sendOrderStatusUpdate(job.data.user, job.data.order);
          break;
        default:
          logger.warn(`Unknown email job: ${job.name}`);
      }
    },
    { connection }
  );

  emailWorker.on("completed", (job) => {
    logger.info(`Email job ${job.id} completed`);
  });

  emailWorker.on("failed", (job, err) => {
    logger.error(`Email job ${job.id} failed:`, err);
  });
}

export default emailQueue;