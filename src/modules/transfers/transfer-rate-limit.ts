import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";
import { AppError } from "@/shared/errors/app-error";

// ---------------------------------------------------------------------------
// Rate Limiter Configuration
// ---------------------------------------------------------------------------

// 10 requests per 1 minute (sliding window)
const rateLimiter = redis
  ? new Ratelimit({
      redis: redis,
      limiter: Ratelimit.slidingWindow(10, "1 m"),
      analytics: true,
      // prefix keys to separate from other rate limiters
      prefix: "@upstash/ratelimit/zmex",
    })
  : null;

// ---------------------------------------------------------------------------
// Rate Limit Check
// ---------------------------------------------------------------------------

/**
 * Check if the authenticated user is allowed to make another transfer request.
 *
 * If Redis is not configured, or if Redis temporarily fails, this fails OPEN.
 * This is because Redis is only for rate limiting — it is not part of financial
 * correctness. A Redis outage must not corrupt or block legitimate transfers
 * if PostgreSQL is still healthy.
 */
export async function checkTransferRateLimit(userId: string): Promise<void> {
  // If Redis is not configured (local dev), just skip rate limiting.
  if (!rateLimiter) {
    return;
  }

  const identifier = `transfer:${userId}`;

  try {
    const { success } = await rateLimiter.limit(identifier);

    if (!success) {
      throw new AppError(
        "Too many transfer attempts. Please try again shortly.",
        429,
        "RATE_LIMIT_EXCEEDED",
      );
    }
  } catch (error) {
    // If the error is OUR AppError (meaning they exceeded the limit), re-throw it.
    if (error instanceof AppError) {
      throw error;
    }

    // Otherwise, it's a Redis network/connection error.
    // Fail OPEN so we don't break financial features just because Redis hiccupped.
    console.error("[ZMEX] Redis rate limiting failed, bypassing:", error);
  }
}
