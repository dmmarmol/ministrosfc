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

  it("POST /api/v1/auth/register → 201 with tokens and PLAYER role", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(validPayload);

    expect(res.status).toBe(201);
    expect(res.body.data.accessToken).toBeTruthy();
    expect(res.body.data.refreshToken).toBeTruthy();
    expect(res.body.data.user.role).toBe("PLAYER");
    expect(res.body.data.user.firstName).toBe("Juan");
    expect(res.body.data.user.lastName).toBe("Pérez");
    expect(res.body.data.user.email).toBe("nuevo@ministrosfc.test");
  });

  it("auto-creates Player record with ACTIVE status and REGISTERED type", async () => {
    const res = await request(app)
      .post("/api/v1/auth/register")
      .send(validPayload);

    expect(res.status).toBe(201);

    const user = await prisma.user.findUnique({
      where: { email: validPayload.email },
      include: { player: true },
    });

    expect(user).not.toBeNull();
    expect(user!.player).not.toBeNull();
    expect(user!.player!.status).toBe("ACTIVE");
    expect(user!.player!.playerType).toBe("REGISTERED");
    expect(user!.player!.firstName).toBe("Juan");
    expect(user!.player!.lastName).toBe("Pérez");
  });

  it("auto-creates Contact record linked to Player", async () => {
    await request(app).post("/api/v1/auth/register").send(validPayload);

    const player = await prisma.player.findFirst({
      where: { firstName: "Juan", lastName: "Pérez" },
      include: { contactInfo: true },
    });

    expect(player).not.toBeNull();
    expect(player!.contactInfo).not.toBeNull();
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

  it("registered user can login with same credentials", async () => {
    await request(app).post("/api/v1/auth/register").send(validPayload);

    const res = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: validPayload.email, password: validPayload.password });

    expect(res.status).toBe(200);
    expect(res.body.data.user.firstName).toBe("Juan");
    expect(res.body.data.user.lastName).toBe("Pérez");
  });
});
