/**
 * Integration test: Registration flow
 * Requires: TEST_DATABASE_URL env pointing at a test PostgreSQL database
 */
import request from "supertest";
import { createApp } from "../../src/config/server";
import { cleanDatabase, prisma } from "../setup";

jest.mock("../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  registerLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

const app = createApp();

describe("Auth register (integration)", () => {
  beforeEach(() => cleanDatabase());

  const validPayload = {
    email: "nuevo@ministrosfc.test",
    password: "Segura123!",
    passwordConfirmation: "Segura123!",
    firstName: "Juan",
    lastName: "Pérez",
  };

  it("POST /api/v1/auth/register → 202 pending without tokens", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(validPayload);

    expect(res.status).toBe(202);
    expect(res.body.data.status).toBe("pending");
    expect(res.body.data.message).toContain("pendiente de aprobación");
    expect(res.body.data.accessToken).toBeUndefined();
    expect(res.body.data.refreshToken).toBeUndefined();
  });

  it("does NOT auto-create Player record (deferred to onboarding)", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(validPayload);

    expect(res.status).toBe(202);

    const user = await prisma.user.findUnique({
      where: { email: validPayload.email },
      include: { player: true },
    });

    expect(user).not.toBeNull();
    expect(user!.playerId).toBeNull();
    expect(user!.player).toBeNull();
    expect(user!.onboardingCompletedAt).toBeNull();
  });

  it("accepts optional isPlayer field in request body", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...validPayload, isPlayer: false });

    expect(res.status).toBe(202);
    expect(res.body.data.status).toBe("pending");
  });

  it("returns 409 for duplicate email", async () => {
    await request(app).post("/api/v1/auth/register").send(validPayload);

    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(validPayload);

    expect(res.status).toBe(409);
  });

  it("returns 400 for weak password", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({
        ...validPayload,
        password: "weak",
        passwordConfirmation: "weak",
      });

    expect(res.status).toBe(400);
  });

  it("returns 400 for mismatched passwords", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...validPayload, passwordConfirmation: "Diferente123!" });

    expect(res.status).toBe(400);
  });

  it("returns 400 for missing firstName", async () => {
    const { firstName: _, ...noFirst } = validPayload;
    const res = await request(app).post("/api/v1/auth/register").send(noFirst);

    expect(res.status).toBe(400);
  });

  it("returns 400 for missing lastName", async () => {
    const { lastName: _, ...noLast } = validPayload;
    const res = await request(app).post("/api/v1/auth/register").send(noLast);

    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send({ ...validPayload, email: "not-an-email" });

    expect(res.status).toBe(400);
  });

  it("registered user cannot login until approved", async () => {
    await request(app).post("/api/v1/auth/register").send(validPayload);

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: validPayload.email, password: validPayload.password });

    expect(res.status).toBe(403);
    expect(res.body.code).toBe("PENDING_APPROVAL");
  });
});
