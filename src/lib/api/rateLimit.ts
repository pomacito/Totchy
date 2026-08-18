/**
 * Спрощений in-memory rate limiter (token bucket per IP) для MVP.
 *
 * Відоме обмеження: стан не розділяється між інстансами процесу, тому за
 * горизонтального масштабування кожен інстанс рахує ліміт незалежно. Для
 * production з кількома інстансами варто замінити на Redis-backed рахунок
 * (документовано в docs/KNOWN_LIMITATIONS.md).
 */
type Bucket = { tokens: number; lastRefillMs: number };

const buckets = new Map<string, Bucket>();

const MAX_TOKENS = 60; // максимум запитів
const REFILL_WINDOW_MS = 60_000; // за хвилину

export function checkRateLimit(key: string): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { tokens: MAX_TOKENS, lastRefillMs: now };

  const elapsed = now - bucket.lastRefillMs;
  if (elapsed > REFILL_WINDOW_MS) {
    bucket.tokens = MAX_TOKENS;
    bucket.lastRefillMs = now;
  }

  if (bucket.tokens <= 0) {
    buckets.set(key, bucket);
    return { allowed: false, remaining: 0 };
  }

  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return { allowed: true, remaining: bucket.tokens };
}

export function getClientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() ?? "unknown";
}
