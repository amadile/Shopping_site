import Redis from "ioredis";
import { logger } from "./logger.js";

let redisClient = null;

if (process.env.REDIS_URL && process.env.NODE_ENV !== "test") {
  redisClient = new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
      const delay = Math.min(times * 50, 2000);
      return delay;
    },
  });

  redisClient.on("connect", () => {
    logger.info("Redis connected successfully");
  });

  redisClient.on("error", (err) => {
    logger.error("Redis connection error:", err);
  });
} else {
  logger.info("Redis not configured, running without cache");
}

export { redisClient };

export const cacheGet = async (key) => {
  if (!redisClient) return null;
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch (err) {
    logger.error("Cache get error:", err);
    return null;
  }
};

export const cacheSet = async (key, value, ttl = 3600) => {
  if (!redisClient) return false;
  try {
    await redisClient.setex(key, ttl, JSON.stringify(value));
    return true;
  } catch (err) {
    logger.error("Cache set error:", err);
    return false;
  }
};

export const cacheDel = async (key) => {
  if (!redisClient) return false;
  try {
    await redisClient.del(key);
    return true;
  } catch (err) {
    logger.error("Cache delete error:", err);
    return false;
  }
};