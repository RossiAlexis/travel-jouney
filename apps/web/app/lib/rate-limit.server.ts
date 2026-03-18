/**
 * In-memory sliding window rate limiter.
 * No external dependencies — uses a Map keyed by "identifier".
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

/** Remove entries whose window has already expired. */
function cleanExpired(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now >= entry.resetAt) {
      store.delete(key);
    }
  }
}

// Clean up expired entries every 5 minutes
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
setInterval(cleanExpired, CLEANUP_INTERVAL_MS).unref(); // .unref() so it doesn't block process exit

/**
 * Check whether the request identified by `key` is within the allowed rate.
 *
 * @param key       Unique identifier (e.g. "login:192.168.1.1")
 * @param limit     Maximum number of requests allowed within `windowMs`
 * @param windowMs  Window duration in milliseconds
 * @returns `true` if the request is allowed, `false` if it should be rejected
 */
export function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now >= entry.resetAt) {
    // First request in a new window
    store.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (entry.count >= limit) {
    return false;
  }

  entry.count += 1;
  return true;
}

/**
 * Extract the client IP address from the request.
 * Checks `X-Forwarded-For` first (reverse proxy), falls back to "unknown".
 */
export function getClientIp(request: Request): string {
  const forwarded = request.headers.get("X-Forwarded-For");
  if (forwarded) {
    // X-Forwarded-For can be a comma-separated list; take the first (leftmost) address
    const first = forwarded.split(",")[0].trim();
    if (first) return first;
  }
  return "unknown";
}

/** 5 requests per 60 seconds — for login / register endpoints */
export function checkAuthRateLimit(ip: string): boolean {
  return checkRateLimit(`auth:${ip}`, 5, 60_000);
}

/** 20 requests per 60 seconds — for token-refresh endpoint */
export function checkRefreshRateLimit(ip: string): boolean {
  return checkRateLimit(`refresh:${ip}`, 20, 60_000);
}
