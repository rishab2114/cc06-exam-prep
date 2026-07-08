import { fail } from './http';

/**
 * In-process sliding-window rate limiter + short-window duplicate-submit
 * guard. Same pattern as events.ts: state on globalThis so it survives Next's
 * dev HMR. Single-instance only — the multi-instance upgrade is Redis with the
 * same key shape, no call-site changes.
 */
interface Bucket {
  hits: number[]; // timestamps within the current window
}

function withinWindow(hits: number[], now: number, windowMs: number): number[] {
  return hits.filter((t) => now - t < windowMs);
}

const g = globalThis as unknown as {
  __cbRateBuckets?: Map<string, Bucket>;
  __cbIdempotency?: Map<string, { at: number; result: unknown }>;
};
const buckets = g.__cbRateBuckets ?? (g.__cbRateBuckets = new Map());
const idempotency = g.__cbIdempotency ?? (g.__cbIdempotency = new Map());

/**
 * Throws 429 if `key` has exceeded `limit` hits in the last `windowMs`.
 * Call at the top of a mutation handler: rateLimit(`task:create:${session.sub}`, 20, 60_000).
 */
export function rateLimit(key: string, limit: number, windowMs: number): void {
  const now = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = withinWindow(bucket.hits, now, windowMs);
  if (bucket.hits.length >= limit) {
    fail(429, 'RATE_LIMITED', 'You’re doing that too fast — wait a moment and try again');
  }
  bucket.hits.push(now);
  buckets.set(key, bucket);
}

// Periodic sweep so the map doesn't grow unbounded on a long-running process.
setInterval(
  () => {
    const now = Date.now();
    for (const [key, bucket] of buckets) {
      bucket.hits = withinWindow(bucket.hits, now, 5 * 60_000);
      if (bucket.hits.length === 0) buckets.delete(key);
    }
    for (const [key, entry] of idempotency) {
      if (now - entry.at > 30_000) idempotency.delete(key);
    }
  },
  5 * 60_000,
).unref?.();

/**
 * Collapses an accidental double-submit (double-click, retry-on-timeout) of
 * the exact same action within `windowMs`: the first call's result is cached
 * and replayed for identical keys, so a repeat POST returns the same result
 * instead of creating a second row. Not a full idempotency-key protocol —
 * just enough to make double-clicking "Post" or "Send offer" safe.
 */
export async function withDedupe<T>(key: string, windowMs: number, fn: () => Promise<T>): Promise<T> {
  const now = Date.now();
  const cached = idempotency.get(key);
  if (cached && now - cached.at < windowMs) {
    return cached.result as T;
  }
  const result = await fn();
  idempotency.set(key, { at: now, result });
  return result;
}
