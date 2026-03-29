/**
 * Integration test: Participation flow
 * Requires: TEST_DATABASE_URL env pointing at a test PostgreSQL database
 */
import request from "supertest";
import { createApp } from "../../src/config/server";
import { prisma } from "../../src/config/database";

jest.mock("../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  registerLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

const app = createApp();

describe("Participation flow (integration)", () => {
  let adminToken: string;
  let playerToken: string;
  let playerId: string;
  let gameId: string;
  let opponentTeamId: string;

  const adminEmail = `admin-part-${Date.now()}@ministrosfc.test`;
  const playerEmail = `player-part-${Date.now()}@ministrosfc.test`;

  beforeAll(async () => {
    // Create admin
    await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "Admin!Part99",
      firstName: "Admin",
      lastName: "Part Test",
    });
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN" },
    });
    const loginAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: "Admin!Part99" });
    adminToken = loginAdmin.body.data.accessToken;

    // Create player user
    const regPlayer = await request(app).post("/api/v1/auth/register").send({
      email: playerEmail,
      password: "Player!Part99",
      firstName: "Player",
      lastName: "Part Test",
    });
    playerToken = regPlayer.body.data.accessToken;

    // Create a player record linked to this user
    const playerUser = await prisma.user.findUnique({
      where: { email: playerEmail },
    });

    // Create opponent team
    const teamRes = await request(app)
      .post("/api/v1/teams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Participation Opponent" });
    opponentTeamId = teamRes.body.data.id;

    // Create a game
    const futureDate = new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const gameRes = await request(app)
      .post("/api/v1/games")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ date: futureDate, opponentTeamId, competitionType: "FRIENDLY" });
    gameId = gameRes.body.data.id;

    // Create player record and link it to the user
    const playerRes = await prisma.player.create({
      data: {
        firstName: "Player",
        lastName: "Part Test",
        playerType: "REGISTERED",
        status: "ACTIVE",
      },
    });
    playerId = playerRes.id;

    // Link the user to this player record (FK is on User model)
    await prisma.user.update({
      where: { id: playerUser!.id },
      data: { playerId: playerRes.id },
    });
  });

  it("GET /api/v1/games/:gameId/participants → 200 empty list initially", async () => {
    const res = await request(app).get(`/api/v1/games/${gameId}/participants`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("POST /api/v1/games/:gameId/participants/confirm → 200 with 2 guests", async () => {
    const res = await request(app)
      .post(`/api/v1/games/${gameId}/participants/confirm`)
      .set("Authorization", `Bearer ${playerToken}`)
      .send({
        friends: [{ name: "Guest One" }, { name: "Guest Two" }],
      });

    expect(res.status).toBe(200);
    expect(res.body.data).toBeDefined();
  });

  it("GET /api/v1/games/:gameId/participants → shows registered player + guests", async () => {
    const res = await request(app).get(`/api/v1/games/${gameId}/participants`);
    expect(res.status).toBe(200);

    const participants = res.body.data;
    const registered = participants.filter(
      (p: any) => p.player?.playerType === "REGISTERED",
    );
    const guests = participants.filter(
      (p: any) => p.player?.playerType === "GUEST",
    );

    expect(registered.length).toBeGreaterThanOrEqual(1);
    expect(guests.length).toBe(2);
  });

  it("POST /api/v1/games/:gameId/participants/confirm → 401 without auth", async () => {
    const res = await request(app)
      .post(`/api/v1/games/${gameId}/participants/confirm`)
      .send({ friends: [] });

    expect(res.status).toBe(401);
  });

  it("PATCH /api/v1/games/:gameId/participants/:playerId/status → 200 updates status (admin)", async () => {
    const res = await request(app)
      .patch(`/api/v1/games/${gameId}/participants/${playerId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "DECLINED" });

    expect(res.status).toBe(200);
  });
});
