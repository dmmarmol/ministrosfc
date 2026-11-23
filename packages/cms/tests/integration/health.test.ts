/**
 * Integration tests: liveness (/health) and readiness (/health/ready).
 *
 * Liveness must never touch the database or Redis (Fly health checks call it
 * continuously and must not wake a suspended Neon compute). Readiness checks
 * both, and caches its answer so repeated calls cannot keep the database awake.
 */
import request from "supertest";
import { createApp } from "../../src/config/server";
import { prisma } from "../../src/config/database";
import { resetReadinessCache } from "../../src/routes/health";

jest.mock("../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  registerLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

describe("Health endpoints (integration)", () => {
  let app: ReturnType<typeof createApp>;
  let querySpy: jest.SpyInstance;
  let nowSpy: jest.SpyInstance | undefined;

  beforeAll(() => {
    app = createApp();
  });

  beforeEach(() => {
    resetReadinessCache();
    querySpy = jest
      .spyOn(prisma, "$queryRaw")
      .mockResolvedValue([{ "?column?": 1 }] as never);
  });

  afterEach(() => {
    querySpy.mockRestore();
    nowSpy?.mockRestore();
    nowSpy = undefined;
    delete process.env.REDIS_DISABLED;
    delete process.env.APP_ENV;
  });

  describe("GET /api/v1/health (liveness)", () => {
    it("returns ok with uptime and no dependency fields", async () => {
      const res = await request(app).get("/api/v1/health");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(typeof res.body.uptime).toBe("number");
      expect(res.body).not.toHaveProperty("database");
      expect(res.body).not.toHaveProperty("redis");
    });

    it("never queries the database", async () => {
      await request(app).get("/api/v1/health");
      await request(app).get("/api/v1/health");

      expect(querySpy).not.toHaveBeenCalled();
    });
  });

  describe("GET /api/v1/health/ready (readiness)", () => {
    it("reports database and redis as connected", async () => {
      const res = await request(app).get("/api/v1/health/ready");

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        status: "ok",
        database: "connected",
        redis: "connected",
      });
    });

    it("reports redis as disabled when REDIS_DISABLED=true outside production", async () => {
      process.env.REDIS_DISABLED = "true";
      process.env.APP_ENV = "development";

      const res = await request(app).get("/api/v1/health/ready");

      expect(res.status).toBe(200);
      expect(res.body.redis).toBe("disabled");
    });

    it("returns 503 when the database check fails", async () => {
      querySpy.mockRejectedValue(new Error("db down"));

      const res = await request(app).get("/api/v1/health/ready");

      expect(res.status).toBe(503);
      expect(res.body).toMatchObject({ status: "degraded", database: "disconnected" });
    });

    it("serves a cached result for 30 seconds without querying again", async () => {
      await request(app).get("/api/v1/health/ready");
      await request(app).get("/api/v1/health/ready");

      expect(querySpy).toHaveBeenCalledTimes(1);
    });

    it("queries again after the cache window", async () => {
      const start = Date.now();
      nowSpy = jest.spyOn(Date, "now").mockReturnValue(start);
      await request(app).get("/api/v1/health/ready");

      nowSpy.mockReturnValue(start + 31_000);
      await request(app).get("/api/v1/health/ready");

      expect(querySpy).toHaveBeenCalledTimes(2);
    });
  });
});
