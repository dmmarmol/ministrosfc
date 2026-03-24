/**
 * Integration test: Auth flow
 * Requires: TEST_DATABASE_URL env pointing at a test PostgreSQL database
 */
import request from "supertest";
import { createApp } from "../../src/config/server";

// Ensure rate limiter doesn't interfere in tests
jest.mock("../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

const app = createApp();

describe("Auth flow (integration)", () => {
  const email = `test-${Date.now()}@ministrosfc.test`;
  const password = "SecurePass!123";
  let accessToken: string;
  let refreshToken: string;

  it("POST /api/v1/auth/register → 201 with tokens", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ email, password, name: "Test User" });

    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.user.role).toBe("PLAYER");
  });

  it("POST /api/v1/auth/login → 200 with tokens", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it("GET /api/v1/players with valid token → 200", async () => {
    const res = await request(app)
      .get("/api/v1/players")
      .set("Authorization", `Bearer ${accessToken}`);
    expect(res.status).toBe(200);
  });

  it("POST /api/v1/auth/refresh → 200 with new access token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken });

    expect(res.status).toBe(200);
    expect(res.body.data.accessToken).toBeTruthy();
    accessToken = res.body.data.accessToken;
    refreshToken = res.body.data.refreshToken;
  });

  it("POST /api/v1/auth/logout → 204, invalidates refresh token", async () => {
    const res = await request(app)
      .post("/api/v1/auth/logout")
      .set("Authorization", `Bearer ${accessToken}`)
      .send({ refreshToken });
    expect(res.status).toBe(204);
  });

  it("POST /api/v1/auth/refresh with invalidated token → 401", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken });
    expect(res.status).toBe(401);
  });

  it("POST /api/v1/auth/login with wrong password → 401", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "wrongpassword" });
    expect(res.status).toBe(401);
  });
});
