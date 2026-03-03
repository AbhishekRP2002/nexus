import { createMiddleware } from "hono/factory";

interface RateLimitEntry {
  timestamps: number[];
}

interface InFlightEntry {
  promise: Promise<Response> | Response;
}

const store = new Map<string, RateLimitEntry>();
const inFlight = new Map<string, InFlightEntry>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 30;

/**
 * Sliding-window rate limiter per userId.
 * Also deduplicates identical in-flight requests (same userId + query).
 */
export const rateLimiter = createMiddleware(async (c, next) => {
  const userId = c.req.query("userId");
  if (!userId) {
    return c.json({ error: "userId query parameter is required" }, 400);
  }

  // Rate limiting
  const now = Date.now();
  const entry = store.get(userId) || { timestamps: [] };
  entry.timestamps = entry.timestamps.filter((t) => now - t < WINDOW_MS);

  if (entry.timestamps.length >= MAX_REQUESTS) {
    return c.json({ error: "Rate limit exceeded. Try again later." }, 429);
  }

  entry.timestamps.push(now);
  store.set(userId, entry);

  await next();
});

/**
 * Request deduplication — if an identical search is already in-flight,
 * reuse its response instead of making a new one.
 */
export function getDeduplicationKey(userId: string, query: string): string {
  return `${userId}:${query.toLowerCase().trim()}`;
}

export function getInFlight(key: string): InFlightEntry | undefined {
  return inFlight.get(key);
}

export function setInFlight(
  key: string,
  promise: Promise<Response> | Response,
): void {
  inFlight.set(key, { promise });
  // Clean up after completion
  Promise.resolve(promise).finally(() => inFlight.delete(key));
}
