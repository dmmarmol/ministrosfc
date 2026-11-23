import {
  createError,
  defineEventHandler,
  getRequestHeader,
  getRequestURL,
  setHeader,
} from "h3";
import {
  createRateLimiter,
  isBlockedUserAgent,
  isExemptPath,
} from "../utils/bot-protection";

const DEFAULT_LIMIT_PER_MINUTE = 120;
const limitFromEnv = Number.parseInt(
  process.env.RATE_LIMIT_PER_MINUTE ?? "",
  10,
);

const limiter = createRateLimiter({
  limit:
    Number.isFinite(limitFromEnv) && limitFromEnv > 0
      ? limitFromEnv
      : DEFAULT_LIMIT_PER_MINUTE,
  windowMs: 60_000,
});

/**
 * Runs before every page render:
 *  - non-production environments are marked noindex/nofollow;
 *  - abusive crawlers get 403 without any API or database work;
 *  - each client IP is limited to a generous number of page requests per minute (429).
 *
 * The client IP comes from `Fly-Client-IP`, which the platform sets and clients cannot spoof
 * (unlike X-Forwarded-For). Without it (local development) the limiter is skipped.
 */
export default defineEventHandler((event) => {
  if (process.env.APP_ENV !== "production") {
    setHeader(event, "X-Robots-Tag", "noindex, nofollow");
  }

  if (isExemptPath(getRequestURL(event).pathname)) return;

  if (isBlockedUserAgent(getRequestHeader(event, "user-agent"))) {
    throw createError({ statusCode: 403, statusMessage: "Forbidden" });
  }

  const clientIp = getRequestHeader(event, "fly-client-ip");
  if (!clientIp) return;

  const result = limiter.hit(clientIp);
  if (!result.allowed) {
    setHeader(event, "Retry-After", String(result.retryAfterSeconds));
    throw createError({ statusCode: 429, statusMessage: "Too Many Requests" });
  }
});
