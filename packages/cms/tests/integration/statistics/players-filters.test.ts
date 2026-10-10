/**
 * Integration tests: GET /api/v1/statistics/players status-filter behavior
 */
import request from "supertest";
import { createApp } from "../../../src/config/server";

jest.mock("../../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  registerLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

// Bypass Redis for deterministic tests
jest.mock("../../../src/config/redis", () => ({
  getRedisClient: () => ({
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue("OK"),
    del: jest.fn().mockResolvedValue(1),
    keys: jest.fn().mockResolvedValue([]),
  }),
}));

const app = createApp();

describe("GET /api/v1/statistics/players — status filter", () => {
  it("accepts status=ACTIVE", async () => {
    const res = await request(app).get(
      "/api/v1/statistics/players?status=ACTIVE",
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("accepts status=INACTIVE", async () => {
    const res = await request(app).get(
      "/api/v1/statistics/players?status=INACTIVE",
    );
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("accepts status=ALL (treated as no filter)", async () => {
    const res = await request(app).get("/api/v1/statistics/players?status=ALL");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("accepts empty status (treated as ALL)", async () => {
    const res = await request(app).get("/api/v1/statistics/players?status=");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("rejects invalid status with 400", async () => {
    const res = await request(app).get(
      "/api/v1/statistics/players?status=UNKNOWN",
    );
    expect(res.status).toBe(400);
  });
});
