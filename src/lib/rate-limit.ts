interface RateLimitEntry {
  count: number;
  resetAt: number;
}

// In-memory store — works for single-instance deployments (Railway)
const store = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 60_000);

export interface RateLimitOptions {
  /** Max requests allowed within the window */
  limit: number;
  /** Window size in seconds */
  windowSec: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  resetAt: number;
}

export function rateLimit(
  identifier: string,
  options: RateLimitOptions
): RateLimitResult {
  const now = Date.now();
  const windowMs = options.windowSec * 1000;

  let entry = store.get(identifier);

  if (!entry || entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(identifier, entry);
    return { success: true, remaining: options.limit - 1, resetAt: entry.resetAt };
  }

  entry.count += 1;
  const remaining = Math.max(0, options.limit - entry.count);
  const success = entry.count <= options.limit;

  return { success, remaining, resetAt: entry.resetAt };
}

/**
 * Get the real client IP from Next.js request headers.
 * Falls back to a fixed string if nothing is available.
 */
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
