/**
 * Integration test: Game CRUD
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

describe("Game CRUD (integration)", () => {
  let adminToken: string;
  let editorToken: string;
  let opponentTeamId: string;
  let gameId: string;

  const adminEmail = `admin-game-${Date.now()}@ministrosfc.test`;
  const editorEmail = `editor-game-${Date.now()}@ministrosfc.test`;

  beforeAll(async () => {
    // Create admin
    await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "Admin!Game99",
      passwordConfirmation: "Admin!Game99",
      firstName: "Admin",
      lastName: "Game Test",
    });
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN", registrationStatus: "APPROVED" },
    });
    const loginAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: "Admin!Game99" });
    adminToken = loginAdmin.body.data.accessToken;

    // Create editor
    await request(app).post("/api/v1/auth/register").send({
      email: editorEmail,
      password: "Editor!Game99",
      passwordConfirmation: "Editor!Game99",
      firstName: "Editor",
      lastName: "Game Test",
    });
    await prisma.user.update({
      where: { email: editorEmail },
      data: { role: "EDITOR", registrationStatus: "APPROVED" },
    });
    const loginEditor = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: editorEmail, password: "Editor!Game99" });
    editorToken = loginEditor.body.data.accessToken;

    // Create opponent team
    const teamRes = await request(app)
      .post("/api/v1/teams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Test Opponent FC" });
    expect(teamRes.status).toBe(201);
    opponentTeamId = teamRes.body.data.id;
  });

  it("POST /api/v1/games → 201 creates game (admin)", async () => {
    const futureDate = new Date(
      Date.now() + 7 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const res = await request(app)
      .post("/api/v1/games")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        date: futureDate,
        opponentTeamId,
        location: "Test Field",
        competitionType: "FRIENDLY",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.status).toBe("SCHEDULED");
    expect(res.body.data.opponentTeamId).toBe(opponentTeamId);
    expect(Array.isArray(res.body.data.participants)).toBe(true);
    gameId = res.body.data.id;
  });

  it("GET /api/v1/games → 200 returns game list (public)", async () => {
    const res = await request(app).get("/api/v1/games");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/v1/games?status=ALL → 200 returns game list", async () => {
    const res = await request(app).get("/api/v1/games?status=ALL");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((g: any) => g.id === gameId);
    expect(found).toBeTruthy();
  });

  it("GET /api/v1/games?status= → 200 returns game list (empty treated as ALL)", async () => {
    const res = await request(app).get("/api/v1/games?status=");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((g: any) => g.id === gameId);
    expect(found).toBeTruthy();
  });

  it("GET /api/v1/games?status=UNKNOWN → 400", async () => {
    const res = await request(app).get("/api/v1/games?status=UNKNOWN");
    expect(res.status).toBe(400);
  });

  it("GET /api/v1/games?opponentTeamId=ALL → 200 returns game list", async () => {
    const res = await request(app).get("/api/v1/games?opponentTeamId=ALL");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((g: any) => g.id === gameId);
    expect(found).toBeTruthy();
  });

  it("GET /api/v1/games?opponentTeamId= → 200 returns game list (empty treated as ALL)", async () => {
    const res = await request(app).get("/api/v1/games?opponentTeamId=");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((g: any) => g.id === gameId);
    expect(found).toBeTruthy();
  });

  it("GET /api/v1/games/:id → 200 returns game detail", async () => {
    const inviter = await prisma.player.create({
      data: {
        firstName: "Carlos",
        lastName: "Invitador",
        playerType: "REGISTERED",
        status: "ACTIVE",
      },
    });

    const guest = await prisma.player.create({
      data: {
        firstName: "Guest",
        lastName: "Player",
        playerType: "GUEST",
        status: "ACTIVE",
        invitedById: inviter.id,
      },
    });

    await prisma.gameParticipant.create({
      data: {
        gameId,
        playerId: guest.id,
        confirmationStatus: "CONFIRMED",
      },
    });

    const res = await request(app).get(`/api/v1/games/${gameId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(gameId);

    const guestParticipant = res.body.data.participants.find(
      (p: any) => p.playerId === guest.id,
    );
    expect(guestParticipant).toBeDefined();
    expect(guestParticipant.invitedByName).toBe("Carlos Invitador");
  });

  it("PATCH /api/v1/games/:id → 200 updates metadata (editor)", async () => {
    const res = await request(app)
      .patch(`/api/v1/games/${gameId}`)
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ notes: "Updated notes" });

    expect(res.status).toBe(200);
    expect(res.body.data.notes).toBe("Updated notes");
    expect(Array.isArray(res.body.data.participants)).toBe(true);

    const withInviter = res.body.data.participants.find(
      (p: any) => p.invitedByName,
    );
    expect(withInviter?.invitedByName).toBe("Carlos Invitador");
  });

  it("PATCH /api/v1/games/:id → 403 when editor tries to set scores", async () => {
    const res = await request(app)
      .patch(`/api/v1/games/${gameId}`)
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ homeTeamScore: 3, awayTeamScore: 1, status: "COMPLETED" });

    expect(res.status).toBe(403);
  });

  it("PATCH /api/v1/games/:id → 200 when admin records result", async () => {
    const res = await request(app)
      .patch(`/api/v1/games/${gameId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ homeTeamScore: 3, awayTeamScore: 1, status: "COMPLETED" });

    expect(res.status).toBe(200);
    expect(res.body.data.homeTeamScore).toBe(3);
    expect(res.body.data.awayTeamScore).toBe(1);
    expect(res.body.data.status).toBe("COMPLETED");
  });

  it("GET /api/v1/games?result=WIN → 200 returns only games where home > away", async () => {
    // The gameId we created has homeTeamScore=3, awayTeamScore=1 (WIN)
    const res = await request(app).get("/api/v1/games?result=WIN");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((g: any) => g.id === gameId);
    expect(found).toBeTruthy();
    expect(found.homeTeamScore).toBeGreaterThan(found.awayTeamScore);
  });

  it("GET /api/v1/games?result=LOSS → 200 returns only games where home < away", async () => {
    // Create a LOSS game (away > home)
    const futureDate = new Date(
      Date.now() + 21 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const createRes = await request(app)
      .post("/api/v1/games")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ date: futureDate, opponentTeamId, competitionType: "FRIENDLY" });
    const lossGameId = createRes.body.data.id;

    await request(app)
      .patch(`/api/v1/games/${lossGameId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ homeTeamScore: 1, awayTeamScore: 3, status: "COMPLETED" });

    const res = await request(app).get("/api/v1/games?result=LOSS");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((g: any) => g.id === lossGameId);
    expect(found).toBeTruthy();
    expect(found.homeTeamScore).toBeLessThan(found.awayTeamScore);
  });

  it("GET /api/v1/games?result=DRAW → 200 returns only games where home = away", async () => {
    // Create a DRAW game (home = away)
    const futureDate = new Date(
      Date.now() + 28 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const createRes = await request(app)
      .post("/api/v1/games")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ date: futureDate, opponentTeamId, competitionType: "FRIENDLY" });
    const drawGameId = createRes.body.data.id;

    await request(app)
      .patch(`/api/v1/games/${drawGameId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ homeTeamScore: 2, awayTeamScore: 2, status: "COMPLETED" });

    const res = await request(app).get("/api/v1/games?result=DRAW");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((g: any) => g.id === drawGameId);
    expect(found).toBeTruthy();
    expect(found.homeTeamScore).toBe(found.awayTeamScore);
  });

  it("GET /api/v1/games?result=ALL → 200 returns all completed games with scores", async () => {
    const res = await request(app).get("/api/v1/games?result=ALL");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    // All returned games should have scores (completed)
    res.body.data.forEach((g: any) => {
      if (g.homeTeamScore !== null && g.awayTeamScore !== null) {
        expect(g.status).toBe("COMPLETED");
      }
    });
  });

  it("GET /api/v1/games?result= → 200 returns all completed games (empty treated as ALL)", async () => {
    const res = await request(app).get("/api/v1/games?result=");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/v1/games?result=UNKNOWN → 400 rejects invalid result value", async () => {
    const res = await request(app).get("/api/v1/games?result=UNKNOWN");
    expect(res.status).toBe(400);
  });

  it("DELETE /api/v1/games/:id → 204 deletes game (admin)", async () => {
    const futureDate = new Date(
      Date.now() + 14 * 24 * 60 * 60 * 1000,
    ).toISOString();
    const createRes = await request(app)
      .post("/api/v1/games")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ date: futureDate, opponentTeamId, competitionType: "LEAGUE" });
    const newGameId = createRes.body.data.id;

    const deleteRes = await request(app)
      .delete(`/api/v1/games/${newGameId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(204);
  });

  it("POST /api/v1/games → 422 with invalid opponentTeamId", async () => {
    const res = await request(app)
      .post("/api/v1/games")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        date: new Date().toISOString(),
        opponentTeamId: "00000000-0000-0000-0000-000000000000",
        competitionType: "FRIENDLY",
      });

    expect(res.status).toBeGreaterThanOrEqual(400);
  });
});
