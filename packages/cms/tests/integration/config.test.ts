/**
 * Integration test: GET /api/v1/config (public capability flags).
 */
import request from "supertest";
import { createApp } from "../../src/config/server";
import { prisma } from "../../src/config/database";

jest.mock("../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  registerLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

const PHOTO_VARS = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

describe("GET /api/v1/config (integration)", () => {
  const app = createApp();
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of PHOTO_VARS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of PHOTO_VARS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
    jest.restoreAllMocks();
  });

  it("reports photo uploads as disabled when photo storage is not configured", async () => {
    const res = await request(app).get("/api/v1/config");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ photoUploadsEnabled: false });
  });

  it("reports photo uploads as enabled when all three credentials are set", async () => {
    process.env.CLOUDINARY_CLOUD_NAME = "my-cloud";
    process.env.CLOUDINARY_API_KEY = "key";
    process.env.CLOUDINARY_API_SECRET = "secret";

    const res = await request(app).get("/api/v1/config");

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ photoUploadsEnabled: true });
  });

  it("reports photo uploads as disabled when the configuration is partial", async () => {
    process.env.CLOUDINARY_CLOUD_NAME = "my-cloud";

    const res = await request(app).get("/api/v1/config");

    expect(res.body.photoUploadsEnabled).toBe(false);
  });

  it("does not touch the database", async () => {
    const spy = jest.spyOn(prisma, "$queryRaw");
    const spyPlayers = jest.spyOn(prisma.player, "findMany");

    await request(app).get("/api/v1/config");

    expect(spy).not.toHaveBeenCalled();
    expect(spyPlayers).not.toHaveBeenCalled();
  });
});
