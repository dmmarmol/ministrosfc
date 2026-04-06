/**
 * Integration test: participation restrictions for inactive/unlinked players
 * Requires: TEST_DATABASE_URL env pointing at a test PostgreSQL database
 */
import request from "supertest";
import { createApp } from "../../src/config/server";
import { cleanDatabase, prisma } from "../setup";
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

describe("Participation restrictions (integration)", () => {
  beforeEach(async () => {
    await cleanDatabase();
  });

  it("rejects participation confirmation for user without linked player (playerId=null)", async () => {
    // Create user without a player
    const user = await prisma.user.create({
      data: {
        email: "noplayer@test.com",
        firstName: "No",
        lastName: "Player",
        role: "PLAYER",
        passwordHash: "$2b$12$fakehash",
      },
    });

    // Create a tournament, opponent team and game
    const tournament = await prisma.tournament.create({
      data: {
        name: "Test Tournament",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        competitionType: "LEAGUE",
      },
    });

    const opponent = await prisma.opponentTeam.create({
      data: { name: "Rival FC" },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const game = await prisma.game.create({
      data: {
        date: tomorrow,
        status: "SCHEDULED",
        tournamentId: tournament.id,
        opponentTeamId: opponent.id,
      },
    });

    const token = generateToken(user.id, "PLAYER");

    const res = await request(app)
      .post(`/api/v1/games/${game.id}/participants/confirm`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(404);
  });

  it("allows participation confirmation for user with linked active player", async () => {
    // Create player and user with linked player
    const player = await prisma.player.create({
      data: {
        firstName: "Carlos",
        lastName: "Gómez",
        status: "ACTIVE",
        playerType: "REGISTERED",
      },
    });

    const user = await prisma.user.create({
      data: {
        email: "active@test.com",
        firstName: "Carlos",
        lastName: "Gómez",
        role: "PLAYER",
        passwordHash: "$2b$12$fakehash",
        playerId: player.id,
      },
    });

    const tournament = await prisma.tournament.create({
      data: {
        name: "Test Tournament",
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-12-31"),
        competitionType: "LEAGUE",
      },
    });

    const opponent = await prisma.opponentTeam.create({
      data: { name: "Rival FC" },
    });

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const game = await prisma.game.create({
      data: {
        date: tomorrow,
        status: "SCHEDULED",
        tournamentId: tournament.id,
        opponentTeamId: opponent.id,
      },
    });

    const token = generateToken(user.id, "PLAYER");

    const res = await request(app)
      .post(`/api/v1/games/${game.id}/participants/confirm`)
      .set("Authorization", `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.data.confirmed).toBe(true);
  });
});
