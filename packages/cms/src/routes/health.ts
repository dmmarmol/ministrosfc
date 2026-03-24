import { Router, type Request, type Response } from "express";
import { prisma } from "../config/database";
import { getRedisClient } from "../config/redis";

const router = Router();

// GET /api/v1/health
router.get("/", async (_req: Request, res: Response) => {
  const health: {
    status: string;
    database: string;
    redis: string;
    uptime: number;
  } = {
    status: "ok",
    database: "disconnected",
    redis: "disconnected",
    uptime: process.uptime(),
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    health.database = "connected";
  } catch {
    health.database = "disconnected";
    health.status = "degraded";
  }

  try {
    const redis = getRedisClient();
    await redis.ping();
    health.redis = "connected";
  } catch {
    health.redis = "disconnected";
    health.status = "degraded";
  }

  const statusCode = health.status === "ok" ? 200 : 503;
  res.status(statusCode).json(health);
});

export { router as healthRouter };
