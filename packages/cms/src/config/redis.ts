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

export function getRedisClient(): Redis {
  if (process.env.NODE_ENV === "development") {
    return createNoopClient();
  }
  if (!redisClient) {
    // REDIS_URL takes precedence (Upstash / any provider that gives a full
    // rediss:// or redis:// connection string — used in all deployed environments).
    // Fall back to individual host/port/password vars for local Docker Compose.
    if (process.env.REDIS_URL) {
      redisClient = new Redis(process.env.REDIS_URL, {
        lazyConnect: true,
        retryStrategy: (times) => {
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
        retryStrategy: (times) => {
          if (times > 3) return null;
          return Math.min(times * 200, 2000);
        },
      });
    }

    redisClient.on("error", (err) => {
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
