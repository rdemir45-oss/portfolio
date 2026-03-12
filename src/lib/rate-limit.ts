import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

// ─────────────────────────── Upstash Redis (çok instance) ───────────────────
// UPSTASH_REDIS_REST_URL ve UPSTASH_REDIS_REST_TOKEN env var'ları tanımlıysa
// Upstash Redis kullanılır — Railway'de ölçekleme sonrası da tutarlı çalışır.
// Tanımlı değilse in-memory fallback devreye girer (tek instance / geliştirme).

let redis: Redis | null = null;
if (
  process.env.UPSTASH_REDIS_REST_URL &&
  process.env.UPSTASH_REDIS_REST_TOKEN
) {
  redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });
}

// Her benzersiz (limit, windowSec) kombinasyonu için Ratelimit instance'ı önbelleğe al
const limiterCache = new Map<string, Ratelimit>();

function getUpstashLimiter(limit: number, windowSec: number): Ratelimit {
  const key = `${limit}:${windowSec}`;
  if (!limiterCache.has(key)) {
    limiterCache.set(
      key,
      new Ratelimit({
        redis: redis!,
        limiter: Ratelimit.slidingWindow(limit, `${windowSec} s`),
        analytics: false,
        prefix: "rl",
      })
    );
  }
  return limiterCache.get(key)!;
}

// ─────────────────────────── In-memory fallback ──────────────────────────────

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}, 60_000);

function inMemoryRateLimit(
  identifier: string,
  limit: number,
  windowMs: number
): RateLimitResult {
  const now = Date.now();
  let entry = store.get(identifier);
  if (!entry || entry.resetAt <= now) {
    entry = { count: 1, resetAt: now + windowMs };
    store.set(identifier, entry);
    return { success: true, remaining: limit - 1, resetAt: entry.resetAt };
  }
  entry.count += 1;
  return {
    success: entry.count <= limit,
    remaining: Math.max(0, limit - entry.count),
    resetAt: entry.resetAt,
  };
}

// ─────────────────────────── Public API ──────────────────────────────────────

export interface RateLimitOptions {
  /** Pencere içinde izin verilen maksimum istek sayısı */
  limit: number;
  /** Pencere boyutu (saniye) */
  windowSec: number;
}

export interface RateLimitResult {
  success: boolean;
  remaining: number;
  /** Unix ms — Retry-After hesaplaması için */
  resetAt: number;
}

export async function rateLimit(
  identifier: string,
  options: RateLimitOptions
): Promise<RateLimitResult> {
  if (redis) {
    const limiter = getUpstashLimiter(options.limit, options.windowSec);
    const result = await limiter.limit(identifier);
    return {
      success: result.success,
      remaining: result.remaining,
      resetAt: result.reset, // Upstash: Unix ms
    };
  }
  return inMemoryRateLimit(identifier, options.limit, options.windowSec * 1000);
}

/**
 * İstemci IP adresini Next.js istek başlıklarından alır.
 */
export function getClientIp(req: { headers: { get(name: string): string | null } }): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}

