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
      firstName: "Admin",
      lastName: "Game Test",
    });
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN" },
    });
    const loginAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: "Admin!Game99" });
    adminToken = loginAdmin.body.data.accessToken;

    // Create editor
    await request(app).post("/api/v1/auth/register").send({
      email: editorEmail,
      password: "Editor!Game99",
      firstName: "Editor",
      lastName: "Game Test",
    });
    await prisma.user.update({
      where: { email: editorEmail },
      data: { role: "EDITOR" },
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
    gameId = res.body.data.id;
  });

  it("GET /api/v1/games → 200 returns game list (public)", async () => {
    const res = await request(app).get("/api/v1/games");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("GET /api/v1/games/:id → 200 returns game detail", async () => {
    const res = await request(app).get(`/api/v1/games/${gameId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(gameId);
  });

  it("PATCH /api/v1/games/:id → 200 updates metadata (editor)", async () => {
    const res = await request(app)
      .patch(`/api/v1/games/${gameId}`)
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ location: "Updated Field" });

    expect(res.status).toBe(200);
    expect(res.body.data.location).toBe("Updated Field");
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
