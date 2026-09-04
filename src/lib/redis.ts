import { Redis } from "@upstash/redis";
import { env } from "@/config/env";

/**
 * Singleton Redis client.
 * Null if Upstash credentials are not provided in the environment.
 * This ensures the application can still boot without Redis configured.
 */
function createRedisClient(): Redis | null {
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    return new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return null;
}

// Attach to globalThis to prevent multiple instances during hot-reloads in development.
const globalForRedis = globalThis as unknown as { redis: Redis | null };

export const redis = globalForRedis.redis || createRedisClient();

if (process.env.NODE_ENV !== "production") {
  globalForRedis.redis = redis;
}
