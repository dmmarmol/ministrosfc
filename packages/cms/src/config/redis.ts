import Redis from "ioredis";
import { logger } from "../utils/logger";

let redisClient: Redis | null = null;

export function getRedisClient(): Redis {
  if (!redisClient) {
    redisClient = new Redis({
      host: process.env.REDIS_HOST ?? "localhost",
      port: parseInt(process.env.REDIS_PORT ?? "5101", 10),
      lazyConnect: true,
      retryStrategy: (times) => {
        if (times > 3) return null;
        return Math.min(times * 200, 2000);
      },
    });

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
