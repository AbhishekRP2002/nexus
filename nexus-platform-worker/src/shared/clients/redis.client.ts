import Redis from "ioredis";
import { envConfig } from "../../config/env.js";
import { logger } from "../utils/logger.js";

let _redis: Redis | null = null;

export function getRedisClient(): Redis {
  if (!_redis) {
    _redis = new Redis({
      host: envConfig.REDIS_HOST,
      port: envConfig.REDIS_PORT,
      maxRetriesPerRequest: null,
      retryStrategy(times) {
        const delay = Math.min(times * 200, 5000);
        return delay;
      },
    });

    _redis.on("connect", () => logger.info("Redis connected"));
    _redis.on("error", (err) =>
      logger.error({ err }, "Redis connection error"),
    );
  }
  return _redis;
}

export async function closeRedis(): Promise<void> {
  if (_redis) {
    await _redis.quit();
    _redis = null;
  }
}
