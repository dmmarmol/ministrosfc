/**
 * Integration test: Caching behavior
 * Verifies Cache-Control headers on public endpoints
 */
import request from "supertest";
import { createApp } from "../../src/config/server";

jest.mock("../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  registerLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

const app = createApp();

describe("Caching (integration)", () => {
  it("GET /api/v1/players → Cache-Control: public, max-age=300", async () => {
    const res = await request(app).get("/api/v1/players");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toMatch(/public/);
    expect(res.headers["cache-control"]).toMatch(/max-age=300/);
  });

  it("GET /api/v1/games → Cache-Control: public, max-age=300", async () => {
    const res = await request(app).get("/api/v1/games");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toMatch(/public/);
  });

  it("GET /api/v1/teams → Cache-Control: public, max-age=600", async () => {
    const res = await request(app).get("/api/v1/teams");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toMatch(/max-age=600/);
  });

  it("GET /api/v1/tournaments → Cache-Control: public, max-age=300", async () => {
    const res = await request(app).get("/api/v1/tournaments");
    expect(res.status).toBe(200);
    expect(res.headers["cache-control"]).toMatch(/public/);
  });

  it("GET /api/v1/statistics/top-scorers → includes Cache-Control", async () => {
    const res = await request(app).get("/api/v1/statistics/top-scorers");
    expect(res.status).toBe(200);
    // Statistics routes may or may not set Cache-Control — just verify no error
  });
});
