import rateLimit from "express-rate-limit";
import { redisClient } from "../config/redis.js";

export const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: "Too many requests from this IP, please try again later.",
  standardHeaders: true,
  legacyHeaders: false,
  ...(redisClient && {
    store: {
      async increment(key) {
        const current = await redisClient.incr(key);
        if (current === 1) {
          await redisClient.expire(
            key,
            Math.floor(
              (parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000) / 1000
            )
          );
        }
        return { totalHits: current, resetTime: null };
      },
      async decrement(key) {
        await redisClient.decr(key);
      },
      async resetKey(key) {
        await redisClient.del(key);
      },
    },
  }),
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50, // Increased for development/testing
  message: "Too many authentication attempts, please try again later.",
  skipSuccessfulRequests: true,
});