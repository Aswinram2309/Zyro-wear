/**
 * In-Memory Sliding Window Rate Limiter for Next.js API Routes.
 * Zero external dependencies, thread-safe for serverless runtimes.
 */

interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodic cleanup of expired rate limit keys every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    rateLimitStore.forEach((record, key) => {
      if (record.resetTime < now) {
        rateLimitStore.delete(key);
      }
    });
  }, 5 * 60 * 1000);
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
}

/**
 * Check and increment rate limit for a given key.
 * @param key Unique identifier (e.g., `ip:action`)
 * @param limit Maximum allowed hits in window
 * @param windowSeconds Time window in seconds
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): RateLimitResult {
  const now = Date.now();
  const windowMs = windowSeconds * 1000;
  const existing = rateLimitStore.get(key);

  if (!existing || existing.resetTime < now) {
    const resetTime = now + windowMs;
    rateLimitStore.set(key, { count: 1, resetTime });
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: Math.ceil(resetTime / 1000),
    };
  }

  if (existing.count >= limit) {
    return {
      success: false,
      limit,
      remaining: 0,
      reset: Math.ceil(existing.resetTime / 1000),
    };
  }

  existing.count += 1;
  return {
    success: true,
    limit,
    remaining: limit - existing.count,
    reset: Math.ceil(existing.resetTime / 1000),
  };
}

/**
 * Extract client IP address from standard reverse proxy headers.
 */
export function getClientIp(req: Request): string {
  const headers = req.headers;
  const forwardedFor = headers.get('x-forwarded-for');
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp.trim();
  }
  const cfIp = headers.get('cf-connecting-ip');
  if (cfIp) {
    return cfIp.trim();
  }
  return '127.0.0.1';
}
