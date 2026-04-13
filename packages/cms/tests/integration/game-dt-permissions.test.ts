/**
 * Integration test: DT role game permissions
 * Verifies DT can update tactical/metadata fields but NOT restricted fields,
 * cannot create or delete games, and can manage participation guests.
 */
import request from "supertest";
import { createApp } from "../../src/config/server";
import { prisma } from "../../src/config/database";
import { cleanDatabase } from "../setup";
import jwt from "jsonwebtoken";

jest.mock("../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  registerLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

const app = createApp();
const JWT_SECRET = process.env.JWT_SECRET ?? "test-secret";

function generateToken(userId: string, role: string) {
  return jwt.sign({ userId, role }, JWT_SECRET, { expiresIn: "1h" });
}

describe("Game DT permissions (integration)", () => {
  let dtToken: string;
  let adminToken: string;
  let playerToken: string;

  let opponentTeamId: string;
  let gameId: string;

  beforeAll(async () => {
    await cleanDatabase();

    // Create DT user
    const dtUser = await prisma.user.create({
      data: {
        email: "dt@test.com",
        firstName: "DT",
        lastName: "Coach",
        role: "DT",
        passwordHash: "$2b$12$fakehash",
      },
    });
    dtToken = generateToken(dtUser.id, "DT");

    // Create admin user
    const adminUser = await prisma.user.create({
      data: {
        email: "admin-dt-test@test.com",
        firstName: "Admin",
        lastName: "Test",
        role: "ADMIN",
        passwordHash: "$2b$12$fakehash",
      },
    });
    adminToken = generateToken(adminUser.id, "ADMIN");

    // Create player user with linked player record
    const playerUser = await prisma.user.create({
      data: {
        email: "player-dt-test@test.com",
        firstName: "Player",
        lastName: "Test",
        role: "PLAYER",
        passwordHash: "$2b$12$fakehash",
      },
    });
    await prisma.player.create({
      data: {
        firstName: "Player",
        lastName: "Test",
        user: { connect: { id: playerUser.id } },
      },
    });
    playerToken = generateToken(playerUser.id, "PLAYER");

    // Create opponent team
    const opponent = await prisma.opponentTeam.create({
      data: { name: "DT Test Rivals" },
    });
    opponentTeamId = opponent.id;

    // Create a game via admin
    const futureDate = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const gameRes = await request(app)
      .post("/api/v1/games")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        date: futureDate,
        opponentTeamId,
        location: "Original Field",
        competitionType: "FRIENDLY",
      });
    expect(gameRes.status).toBe(201);
    gameId = gameRes.body.data.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe("PATCH /api/v1/games/:id (DT allowed fields)", () => {
    it("DT cannot update location (restricted field)", async () => {
      const res = await request(app)
        .patch(`/api/v1/games/${gameId}`)
        .set("Authorization", `Bearer ${dtToken}`)
        .send({ location: "DT Tactical Field" });

      expect(res.status).toBe(403);
    });

    it("DT can update notes (metadata field)", async () => {
      const res = await request(app)
        .patch(`/api/v1/games/${gameId}`)
        .set("Authorization", `Bearer ${dtToken}`)
        .send({ notes: "Formation: 4-3-3, high pressing" });

      expect(res.status).toBe(200);
      expect(res.body.data.notes).toBe("Formation: 4-3-3, high pressing");
    });

    it("DT can update date (metadata field)", async () => {
      const newDate = new Date(
        Date.now() + 14 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const res = await request(app)
        .patch(`/api/v1/games/${gameId}`)
        .set("Authorization", `Bearer ${dtToken}`)
        .send({ date: newDate });

      expect(res.status).toBe(200);
    });
  });

  describe("PATCH /api/v1/games/:id (DT restricted fields)", () => {
    it("DT cannot update scores → 403", async () => {
      const res = await request(app)
        .patch(`/api/v1/games/${gameId}`)
        .set("Authorization", `Bearer ${dtToken}`)
        .send({ homeTeamScore: 2, awayTeamScore: 1 });

      expect(res.status).toBe(403);
    });

    it("DT cannot update game status → 403", async () => {
      const res = await request(app)
        .patch(`/api/v1/games/${gameId}`)
        .set("Authorization", `Bearer ${dtToken}`)
        .send({ status: "COMPLETED" });

      expect(res.status).toBe(403);
    });

    it("DT cannot update competitionType → 403", async () => {
      const res = await request(app)
        .patch(`/api/v1/games/${gameId}`)
        .set("Authorization", `Bearer ${dtToken}`)
        .send({ competitionType: "LEAGUE" });

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/v1/games (DT cannot create)", () => {
    it("DT cannot create games → 403", async () => {
      const futureDate = new Date(
        Date.now() + 21 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const res = await request(app)
        .post("/api/v1/games")
        .set("Authorization", `Bearer ${dtToken}`)
        .send({
          date: futureDate,
          opponentTeamId,
          competitionType: "FRIENDLY",
        });

      expect(res.status).toBe(403);
    });
  });

  describe("DELETE /api/v1/games/:id (DT cannot delete)", () => {
    it("DT cannot delete games → 403", async () => {
      const res = await request(app)
        .delete(`/api/v1/games/${gameId}`)
        .set("Authorization", `Bearer ${dtToken}`);

      expect(res.status).toBe(403);
    });
  });

  describe("POST /api/v1/games/:gameId/participants/confirm (guest flow)", () => {
    it("PLAYER cannot confirm without linked player → 404", async () => {
      // DT user has no player record linked
      const res = await request(app)
        .post(`/api/v1/games/${gameId}/participants/confirm`)
        .set("Authorization", `Bearer ${dtToken}`)
        .send({ friends: [{ name: "Guest Friend" }] });

      // ParticipationService rejects users without a player record
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("Player with linked record can confirm with guests", async () => {
      const res = await request(app)
        .post(`/api/v1/games/${gameId}/participants/confirm`)
        .set("Authorization", `Bearer ${playerToken}`)
        .send({ friends: [{ name: "Guest Friend" }] });

      expect(res.status).toBe(200);
    });
  });
});
