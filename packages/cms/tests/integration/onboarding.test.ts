/**
 * Integration test: Onboarding flow
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

async function registerUser(overrides: Record<string, unknown> = {}) {
  const payload = {
    email: "onboard@ministrosfc.test",
    password: "Segura123!",
    passwordConfirmation: "Segura123!",
    firstName: "Test",
    lastName: "User",
    ...overrides,
  };
  const res = await request(app).post("/api/v1/auth/register").send(payload);
  return res.body.data;
}

describe("Onboarding (integration)", () => {
  beforeEach(() => cleanDatabase());

  describe("GET /api/v1/onboarding/status", () => {
    it("returns needsOnboarding=true for new user", async () => {
      const { accessToken } = await registerUser();

      const res = await request(app)
        .get("/api/v1/onboarding/status")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.needsOnboarding).toBe(true);
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app).get("/api/v1/onboarding/status");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/onboarding/complete", () => {
    it("creates Player when isPlayer=true with position and jerseyNumber", async () => {
      const { accessToken, user } = await registerUser();

      const res = await request(app)
        .post("/api/v1/onboarding/complete")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ isPlayer: true, position: "CMF", jerseyNumber: 10 });

      expect(res.status).toBe(200);
      expect(res.body.data.user.playerId).toBeTruthy();
      expect(res.body.data.user.onboardingCompletedAt).toBeTruthy();
      expect(res.body.data.nextStep).toBe("/profile");

      // Verify Player was created in DB
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { player: true },
      });
      expect(dbUser!.player).not.toBeNull();
      expect(dbUser!.player!.position).toBe("CMF");
      expect(dbUser!.player!.jerseyNumber).toBe(10);
      expect(dbUser!.player!.status).toBe("ACTIVE");
      expect(dbUser!.player!.playerType).toBe("REGISTERED");
    });

    it("skips Player creation when isPlayer=false", async () => {
      const { accessToken, user } = await registerUser();

      const res = await request(app)
        .post("/api/v1/onboarding/complete")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ isPlayer: false });

      expect(res.status).toBe(200);
      expect(res.body.data.user.playerId).toBeNull();
      expect(res.body.data.user.onboardingCompletedAt).toBeTruthy();

      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: { player: true },
      });
      expect(dbUser!.player).toBeNull();
    });

    it("returns 409 for duplicate jersey number", async () => {
      // Create first user with jersey 10
      const first = await registerUser({ email: "first@ministrosfc.test" });
      await request(app)
        .post("/api/v1/onboarding/complete")
        .set("Authorization", `Bearer ${first.accessToken}`)
        .send({ isPlayer: true, position: "CF", jerseyNumber: 10 });

      // Try to claim same jersey
      const second = await registerUser({ email: "second@ministrosfc.test" });
      const res = await request(app)
        .post("/api/v1/onboarding/complete")
        .set("Authorization", `Bearer ${second.accessToken}`)
        .send({ isPlayer: true, position: "GK", jerseyNumber: 10 });

      expect(res.status).toBe(409);
    });

    it("is idempotent — returns same result on second call", async () => {
      const { accessToken } = await registerUser();

      await request(app)
        .post("/api/v1/onboarding/complete")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ isPlayer: true, position: "CMF", jerseyNumber: 5 });

      const res = await request(app)
        .post("/api/v1/onboarding/complete")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ isPlayer: false }); // different payload, should be ignored

      expect(res.status).toBe(200);
      expect(res.body.data.user.playerId).toBeTruthy(); // still linked
      expect(res.body.data.nextStep).toBe("/profile");
    });

    it("returns needsOnboarding=false after completion", async () => {
      const { accessToken } = await registerUser();

      await request(app)
        .post("/api/v1/onboarding/complete")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ isPlayer: false });

      const res = await request(app)
        .get("/api/v1/onboarding/status")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.needsOnboarding).toBe(false);
    });

    it("returns 400 when isPlayer=true but position is missing", async () => {
      const { accessToken } = await registerUser();

      const res = await request(app)
        .post("/api/v1/onboarding/complete")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ isPlayer: true, jerseyNumber: 7 });

      expect(res.status).toBe(400);
    });

    it("returns 401 without auth token", async () => {
      const res = await request(app)
        .post("/api/v1/onboarding/complete")
        .send({ isPlayer: false });
      expect(res.status).toBe(401);
    });
  });
});
