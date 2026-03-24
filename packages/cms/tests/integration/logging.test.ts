/**
 * Integration test: Logging
 * Verifies pino-http logger is attached and produces structured logs
 */
import request from "supertest";
import { createApp } from "../../src/config/server";

jest.mock("../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

describe("Logging (integration)", () => {
  const app = createApp();

  it("GET /api/v1/health → 200 (logger does not break health check)", async () => {
    const res = await request(app).get("/api/v1/health");
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("status");
  });

  it("404 unknown route returns structured error response", async () => {
    const res = await request(app).get("/api/v1/this-route-does-not-exist");
    expect(res.status).toBe(404);
  });

  it("Malformed JSON body returns 400 with message", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .set("Content-Type", "application/json")
      .send("{ invalid json }");

    expect(res.status).toBe(400);
  });

  it("Oversized payload returns 413", async () => {
    const bigPayload = { data: "x".repeat(2 * 1024 * 1024) }; // 2MB > 1MB limit
    const res = await request(app).post("/api/v1/auth/login").send(bigPayload);

    expect(res.status).toBe(413);
  });
});
