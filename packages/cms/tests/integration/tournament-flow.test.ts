/**
 * Integration test: Tournament flow
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

describe("Tournament flow (integration)", () => {
  let adminToken: string;
  let tournamentId: string;
  let opponentTeamId: string;

  const adminEmail = `admin-tourn-${Date.now()}@ministrosfc.test`;

  beforeAll(async () => {
    await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "Admin!Tourn99",
      firstName: "Admin",
      lastName: "Tourn Test",
    });
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN" },
    });
    const loginRes = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: "Admin!Tourn99" });
    adminToken = loginRes.body.data.accessToken;

    const teamRes = await request(app)
      .post("/api/v1/teams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "Tournament Opponent FC" });
    opponentTeamId = teamRes.body.data.id;
  });

  it("POST /api/v1/tournaments → 201 creates tournament", async () => {
    const res = await request(app)
      .post("/api/v1/tournaments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Liga de Verano 2024",
        competitionType: "LEAGUE",
        startDate: "2024-01-01",
        endDate: "2024-06-30",
      });

    expect(res.status).toBe(201);
    expect(res.body.data.name).toBe("Liga de Verano 2024");
    tournamentId = res.body.data.id;
  });

  it("POST /api/v1/tournaments → 400 when endDate before startDate", async () => {
    const res = await request(app)
      .post("/api/v1/tournaments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Invalid Dates",
        competitionType: "CUP",
        startDate: "2024-06-30",
        endDate: "2024-01-01",
      });

    expect(res.status).toBe(400);
  });

  it("GET /api/v1/tournaments → 200 returns tournament list", async () => {
    const res = await request(app).get("/api/v1/tournaments");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    const found = res.body.data.find((t: any) => t.id === tournamentId);
    expect(found).toBeTruthy();
  });

  it("GET /api/v1/tournaments/:id → 200 with ministrosRecord", async () => {
    const res = await request(app).get(`/api/v1/tournaments/${tournamentId}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(tournamentId);
    expect(res.body.data.ministrosRecord).toBeDefined();
    expect(res.body.data.ministrosRecord).toHaveProperty("wins");
    expect(res.body.data.ministrosRecord).toHaveProperty("draws");
    expect(res.body.data.ministrosRecord).toHaveProperty("losses");
  });

  it("ministrosRecord shows correct W/D/L after completed games", async () => {
    // Create 2 games in the tournament
    const pastDate = "2024-03-01T18:00:00.000Z";
    const g1 = await request(app)
      .post("/api/v1/games")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        date: pastDate,
        opponentTeamId,
        tournamentId,
        competitionType: "LEAGUE",
      });
    const g2 = await request(app)
      .post("/api/v1/games")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        date: pastDate,
        opponentTeamId,
        tournamentId,
        competitionType: "LEAGUE",
      });

    // Win + Draw
    await request(app)
      .patch(`/api/v1/games/${g1.body.data.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ homeTeamScore: 3, awayTeamScore: 1, status: "COMPLETED" });
    await request(app)
      .patch(`/api/v1/games/${g2.body.data.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ homeTeamScore: 1, awayTeamScore: 1, status: "COMPLETED" });

    const res = await request(app).get(`/api/v1/tournaments/${tournamentId}`);
    const record = res.body.data.ministrosRecord;

    expect(record.wins).toBeGreaterThanOrEqual(1);
    expect(record.draws).toBeGreaterThanOrEqual(1);
    expect(record.goalsFor).toBeGreaterThanOrEqual(4);
  });

  it("DELETE /api/v1/tournaments/:id → 204 deletes tournament (admin)", async () => {
    const createRes = await request(app)
      .post("/api/v1/tournaments")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: "Delete Me",
        competitionType: "CUP",
        startDate: "2024-01-01",
        endDate: "2024-03-01",
      });
    const id = createRes.body.data.id;

    const deleteRes = await request(app)
      .delete(`/api/v1/tournaments/${id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(deleteRes.status).toBe(204);
  });
});
