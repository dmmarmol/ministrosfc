/**
 * Integration test: Auth flow
 * Requires: TEST_DATABASE_URL env pointing at a test PostgreSQL database
 */
import request from "supertest";
import { createApp } from "../../src/config/server";

// Ensure rate limiter doesn't interfere in tests
jest.mock("../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  registerLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

const app = createApp();

describe("Auth Flow (integration)", () => {
  const email = `test-${Date.now()}@ministrosfc.test`;
  const password = "SecurePass!123";

  it("POST /api/v1/auth/register → 202 pending", async () => {
    const res = await request(app).post("/api/v1/auth/register").send({
      email,
      password,
      passwordConfirmation: password,
      firstName: "Test",
      lastName: "User",
    });

    expect(res.status).toBe(202);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.accessToken).toBeUndefined();
  });

  it("POST /api/v1/auth/login → 403 while pending approval", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("PENDING_APPROVAL");
  });

  it("POST /api/v1/auth/refresh without login token → 401", async () => {
    const res = await request(app)
      .post("/api/v1/auth/refresh")
      .send({ refreshToken: "non-existent-token" });
    expect(res.status).toBe(401);
  });

  it("POST /api/v1/auth/login with wrong password → 401", async () => {
    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email, password: "wrongpassword" });
    expect(res.status).toBe(401);
  });
});
