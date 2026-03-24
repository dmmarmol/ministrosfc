/**
 * Integration test: CORS
 */
import request from "supertest";
import { createApp } from "../../src/config/server";

jest.mock("../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

describe("CORS (integration)", () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(() => {
    process.env.CORS_ORIGINS = "http://localhost:5103";
    app = createApp();
  });

  it("responds with Access-Control-Allow-Origin for allowed origin", async () => {
    const res = await request(app)
      .get("/api/v1/health")
      .set("Origin", "http://localhost:5103");

    expect(res.headers["access-control-allow-origin"]).toBe(
      "http://localhost:5103",
    );
  });

  it("responds without CORS header for disallowed origin", async () => {
    const res = await request(app)
      .get("/api/v1/health")
      .set("Origin", "http://malicious-site.com");

    // When origin is not allowed, cors omits the header or sets to false
    const corsHeader = res.headers["access-control-allow-origin"];
    expect(corsHeader).not.toBe("http://malicious-site.com");
  });

  it("handles preflight OPTIONS with allowed headers", async () => {
    const res = await request(app)
      .options("/api/v1/players")
      .set("Origin", "http://localhost:5103")
      .set("Access-Control-Request-Method", "POST")
      .set("Access-Control-Request-Headers", "Content-Type,Authorization");

    expect(res.status).toBe(204);
    expect(res.headers["access-control-allow-methods"]).toContain("POST");
    expect(res.headers["access-control-allow-headers"]).toMatch(
      /authorization/i,
    );
  });

  it("includes credentials in CORS response", async () => {
    const res = await request(app)
      .get("/api/v1/health")
      .set("Origin", "http://localhost:5103");

    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });
});
