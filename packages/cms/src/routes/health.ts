import { Router, type Request, type Response } from "express";
import { prisma } from "../config/database";
import { getRedisClient, isRedisDisabled } from "../config/redis";

const router = Router();

/** Readiness answers are cached so repeated probes cannot keep the database awake. */
const READINESS_CACHE_MS = 30_000;

interface ReadinessResult {
  statusCode: number;
  body: {
    status: "ok" | "degraded";
    database: "connected" | "disconnected";
    redis: "connected" | "disconnected" | "disabled";
  };
}

let cachedReadiness: { at: number; result: ReadinessResult } | null = null;

/** Test helper: forget the cached readiness answer. */
export function resetReadinessCache(): void {
  cachedReadiness = null;
}

async function checkReadiness(): Promise<ReadinessResult> {
  const body: ReadinessResult["body"] = {
    status: "ok",
    database: "disconnected",
    redis: "disconnected",
  };

  try {
    await prisma.$queryRaw`SELECT 1`;
    body.database = "connected";
  } catch {
    body.status = "degraded";
  }

  if (isRedisDisabled()) {
    body.redis = "disabled";
  } else {
    try {
      await getRedisClient().ping();
      body.redis = "connected";
    } catch {
      body.status = "degraded";
    }
  }

  return { statusCode: body.status === "ok" ? 200 : 503, body };
}

// GET /api/v1/health — liveness. Dependency-free on purpose: platform health
// checks and uptime probes call it constantly and must never wake the database.
router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

// GET /api/v1/health/ready — readiness. Checks the database and Redis; used by
// deploy smoke tests. The result is cached for 30 seconds.
router.get("/ready", async (_req: Request, res: Response) => {
  const now = Date.now();
  if (cachedReadiness && now - cachedReadiness.at < READINESS_CACHE_MS) {
    res
      .status(cachedReadiness.result.statusCode)
      .json(cachedReadiness.result.body);
    return;
  }

  const result = await checkReadiness();
  cachedReadiness = { at: now, result };
  res.status(result.statusCode).json(result.body);
});

export { router as healthRouter };
