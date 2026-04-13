/**
 * Integration test: Profile endpoints
 * Requires: TEST_DATABASE_URL env pointing at a test PostgreSQL database
 */
import request from "supertest";
import { createApp } from "../../src/config/server";
import { cleanDatabase } from "../setup";
import { prisma } from "../../src/config/database";

jest.mock("../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  registerLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../src/utils/object-storage", () => ({
  uploadPhoto: jest.fn().mockResolvedValue("https://cloudinary.com/photo.jpg"),
  uploadPlayerPhoto: jest
    .fn()
    .mockResolvedValue("https://cloudinary.com/photo.jpg"),
  deletePlayerPhoto: jest.fn().mockResolvedValue(undefined),
  validatePhotoFile: jest.fn(),
}));

const app = createApp();

describe("Profile endpoints (integration)", () => {
  let accessToken: string;

  beforeEach(async () => {
    await cleanDatabase();

    // Register a user to get an authenticated token
    const res = await request(app).post("/api/v1/auth/register").send({
      email: "profile@ministrosfc.test",
      password: "Segura123!",
      passwordConfirmation: "Segura123!",
      firstName: "Juan",
      lastName: "Pérez",
    });
    accessToken = res.body.data.accessToken;

    const user = await prisma.user.findUnique({
      where: { email: "profile@ministrosfc.test" },
    });
    const player = await prisma.player.create({
      data: {
        firstName: "Juan",
        lastName: "Pérez",
        status: "ACTIVE",
      },
    });
    await prisma.user.update({
      where: { id: user!.id },
      data: { playerId: player.id },
    });
  });

  describe("GET /api/v1/profile", () => {
    it("returns full profile for authenticated user", async () => {
      const res = await request(app)
        .get("/api/v1/profile")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.user.email).toBe("profile@ministrosfc.test");
      expect(res.body.data.user.firstName).toBe("Juan");
      expect(res.body.data.user.lastName).toBe("Pérez");
      expect(res.body.data.user.hasPassword).toBe(true);
      expect(res.body.data.user.hasGoogle).toBe(false);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get("/api/v1/profile");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/v1/profile/player", () => {
    it("updates profile fields", async () => {
      const res = await request(app)
        .patch("/api/v1/profile/player")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ nickname: "Juanchi", position: "CMF" });

      expect(res.status).toBe(200);
      expect(res.body.data.player.nickname).toBe("Juanchi");
    });

    it("updates firstName/lastName on both User and Player", async () => {
      const res = await request(app)
        .patch("/api/v1/profile/player")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ firstName: "Carlos", lastName: "García" });

      expect(res.status).toBe(200);
      expect(res.body.data.user.firstName).toBe("Carlos");
      expect(res.body.data.player.firstName).toBe("Carlos");
    });

    it("returns 409 for duplicate jersey number", async () => {
      // Register another user with jersey 10
      const otherRes = await request(app).post("/api/v1/auth/register").send({
        email: "other@ministrosfc.test",
        password: "Segura123!",
        passwordConfirmation: "Segura123!",
        firstName: "Pedro",
        lastName: "López",
      });
      const otherToken = otherRes.body.data.accessToken;

      const otherUser = await prisma.user.findUnique({
        where: { email: "other@ministrosfc.test" },
      });
      const otherPlayer = await prisma.player.create({
        data: {
          firstName: "Pedro",
          lastName: "López",
          status: "ACTIVE",
        },
      });
      await prisma.user.update({
        where: { id: otherUser!.id },
        data: { playerId: otherPlayer.id },
      });

      // Set jersey 10 on other user
      await request(app)
        .patch("/api/v1/profile/player")
        .set("Authorization", `Bearer ${otherToken}`)
        .send({ jerseyNumber: 10 });

      // Try to set jersey 10 on first user
      const res = await request(app)
        .patch("/api/v1/profile/player")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ jerseyNumber: 10 });

      expect(res.status).toBe(409);
    });

    it("returns 401 without token", async () => {
      const res = await request(app)
        .patch("/api/v1/profile/player")
        .send({ nickname: "Test" });
      expect(res.status).toBe(401);
    });
  });

  describe("GET /api/v1/profile/player/jersey-availability", () => {
    it("returns taken jersey numbers", async () => {
      // Set a jersey number first
      await request(app)
        .patch("/api/v1/profile/player")
        .set("Authorization", `Bearer ${accessToken}`)
        .send({ jerseyNumber: 7 });

      const res = await request(app)
        .get("/api/v1/profile/player/jersey-availability")
        .set("Authorization", `Bearer ${accessToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.taken).toContain(7);
    });

    it("returns 401 without token", async () => {
      const res = await request(app).get(
        "/api/v1/profile/player/jersey-availability",
      );
      expect(res.status).toBe(401);
    });
  });
});
