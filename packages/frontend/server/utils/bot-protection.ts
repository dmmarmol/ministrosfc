/**
 * Helpers for the bot-protection middleware: crawler deny-list, exempt paths and a small
 * in-memory per-client rate limiter. Pure (no h3 / Nuxt imports) so they are easy to test.
 *
 * Why: every public page view makes the API (and so the scale-to-zero database) do work, and a
 * small club site must not let crawlers or scripts burn the free compute allowance.
 */

/** Aggressive SEO/scraping crawlers with no value for a club site. Search engines are not listed. */
const BLOCKED_USER_AGENTS: readonly RegExp[] = [
  /AhrefsBot/i,
  /SemrushBot/i,
  /MJ12bot/i,
  /DotBot/i,
  /BLEXBot/i,
  /PetalBot/i,
  /Bytespider/i,
  /DataForSeoBot/i,
  /MegaIndex/i,
  /Barkrowler/i,
  /SeekportBot/i,
];

export function isBlockedUserAgent(userAgent: string | undefined): boolean {
  if (!userAgent) return false;
  return BLOCKED_USER_AGENTS.some((pattern) => pattern.test(userAgent));
}

const EXEMPT_PREFIXES = [
  "/_nuxt/",
  "/__nuxt",
  "/_ipx/",
  "/favicon",
  "/robots.txt",
];
const ASSET_EXTENSION =
  /\.(?:js|mjs|css|map|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|txt|xml|json)$/i;

/** Static assets and the health-probe path never count toward the rate limit. */
export function isExemptPath(pathname: string): boolean {
  return (
    EXEMPT_PREFIXES.some((prefix) => pathname.startsWith(prefix)) ||
    ASSET_EXTENSION.test(pathname)
  );
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

export interface RateLimiterOptions {
  limit: number;
  windowMs: number;
  now?: () => number;
}

const MAX_TRACKED_CLIENTS = 5_000;

/** Fixed-window per-key limiter. Memory is bounded: expired windows are pruned when it grows. */
export function createRateLimiter({
  limit,
  windowMs,
  now = Date.now,
}: RateLimiterOptions) {
  const windows = new Map<string, { count: number; resetAt: number }>();

  function prune(current: number): void {
    for (const [key, entry] of windows) {
      if (entry.resetAt <= current) windows.delete(key);
    }
  }

  return {
    hit(key: string): RateLimitResult {
      const current = now();
      if (windows.size > MAX_TRACKED_CLIENTS) prune(current);

      let entry = windows.get(key);
      if (!entry || entry.resetAt <= current) {
        entry = { count: 0, resetAt: current + windowMs };
        windows.set(key, entry);
      }
      entry.count += 1;

      const allowed = entry.count <= limit;
      return {
        allowed,
        remaining: Math.max(0, limit - entry.count),
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((entry.resetAt - current) / 1000),
        ),
      };
    },
  };
}
