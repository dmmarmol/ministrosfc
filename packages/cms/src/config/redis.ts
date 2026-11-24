import Redis from "ioredis";
import { logger } from "../utils/logger";

let redisClient: Redis | null = null;

// In development, return a no-op stub so every cache read is a miss and
// writes are silently discarded — no Redis instance required locally.
function createNoopClient(): Redis {
  const noop = new Proxy({} as Redis, {
    get(_target, prop) {
      if (prop === "get") return async () => null;
      if (prop === "setex") return async () => "OK";
      if (prop === "keys") return async () => [];
      if (prop === "del") return async () => 0;
      if (prop === "on") return () => noop;
      if (prop === "status") return "ready";
      if (prop === "quit") return async () => "OK";
      if (prop === "disconnect") return () => undefined;
      if (prop === "removeAllListeners") return () => noop;
      return async () => null;
    },
  });
  return noop;
}

/**
 * Decides whether the cache should be a no-op.
 *
 * - Always in development, test and Jest workers.
 * - In a deployed development app (APP_ENV is not "production") when
 *   REDIS_DISABLED=true, so DEV needs no Redis instance.
 * - Never in production: REDIS_DISABLED is ignored when APP_ENV=production
 *   (and rejected by env validation).
 */
export function shouldUseNoopRedis(
  env: Record<string, string | undefined> = process.env,
): boolean {
  if (
    env.NODE_ENV === "development" ||
    env.NODE_ENV === "test" ||
    env.JEST_WORKER_ID != null
  ) {
    return true;
  }
  const disabled = env.REDIS_DISABLED?.trim().toLowerCase() === "true";
  return disabled && env.APP_ENV !== "production";
}

/** True when the cache was deliberately turned off (DEV deployments only). */
export function isRedisDisabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return (
    env.REDIS_DISABLED?.trim().toLowerCase() === "true" &&
    env.APP_ENV !== "production"
  );
}

export function getRedisClient(): Redis {
  if (shouldUseNoopRedis()) {
    return createNoopClient();
  }
  if (!redisClient) {
    // REDIS_URL takes precedence (Upstash / any provider that gives a full
    // rediss:// or redis:// connection string — used in all deployed environments).
    // Fall back to individual host/port/password vars for local Docker Compose.
    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        retryStrategy: (times: number) => {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
      });
    } else {
      redisClient = new Redis({
        host: process.env.REDIS_HOST ?? "localhost",
        port: parseInt(process.env.REDIS_PORT ?? "5101", 10),
        password: process.env.REDIS_PASSWORD || undefined,
        lazyConnect: true,
        retryStrategy: (times: number) => {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
      });
    }

    redisClient.on("error", (err: Error) => {
      logger.error({ err }, "Redis connection error");
    });

    redisClient.on("connect", () => {
      logger.info("Redis connected");
    });
  }
  return redisClient;
}

export const redisKeys = {
  session: (userId: string) => `session:${userId}`,
  statsCache: (playerId: string) => `cache:stats:${playerId}`,
  tournamentCache: (tournamentId: string) => `cache:tournament:${tournamentId}`,
} as const;

export async function disconnectRedis(): Promise<void> {
  if (redisClient) {
    try {
      if (redisClient.status === "ready" || redisClient.status === "connect") {
        await redisClient.quit();
      } else {
        redisClient.disconnect();
      }
    } catch {
      // Ensure tests can still tear down even if Redis is unavailable
      redisClient.disconnect();
    } finally {
      redisClient.removeAllListeners();
      redisClient = null;
    }
  }
}
