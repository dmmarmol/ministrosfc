/**
 * Integration test: RBAC (Role-Based Access Control)
 * Verifies the full permission matrix across endpoints
 */
import request from "supertest";
import { createApp } from "../../src/config/server";
import { prisma } from "../../src/config/database";

jest.mock("../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

jest.mock("../../src/utils/object-storage", () => ({
  validatePhotoFile: jest.fn(),
  uploadPlayerPhoto: jest
    .fn()
    .mockResolvedValue("https://res.cloudinary.com/test/image/upload/rbac.jpg"),
  deletePlayerPhoto: jest.fn().mockResolvedValue(undefined),
}));

const app = createApp();

describe("RBAC (integration)", () => {
  let adminToken: string;
  let editorToken: string;
  let playerToken: string;
  let opponentTeamId: string;

  const adminEmail = `admin-rbac-${Date.now()}@ministrosfc.test`;
  const editorEmail = `editor-rbac-${Date.now()}@ministrosfc.test`;
  const playerEmail = `player-rbac-${Date.now()}@ministrosfc.test`;

  beforeAll(async () => {
    // Admin
    await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: adminEmail,
        password: "Admin!Rbac99",
        name: "Admin RBAC",
      });
    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN" },
    });
    const la = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: "Admin!Rbac99" });
    adminToken = la.body.data.accessToken;

    // Editor
    await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: editorEmail,
        password: "Editor!Rbac99",
        name: "Editor RBAC",
      });
    await prisma.user.update({
      where: { email: editorEmail },
      data: { role: "EDITOR" },
    });
    const le = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: editorEmail, password: "Editor!Rbac99" });
    editorToken = le.body.data.accessToken;

    // Player
    const lp = await request(app)
      .post("/api/v1/auth/register")
      .send({
        email: playerEmail,
        password: "Player!Rbac99",
        name: "Player RBAC",
      });
    playerToken = lp.body.data.accessToken;

    // Opponent team (for game creation)
    const tr = await request(app)
      .post("/api/v1/teams")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ name: "RBAC Opponent" });
    opponentTeamId = tr.body.data.id;
  });

  describe("Unauthenticated access", () => {
    it("GET /api/v1/players → 200 (public)", async () => {
      const res = await request(app).get("/api/v1/players");
      expect(res.status).toBe(200);
    });

    it("GET /api/v1/games → 200 (public)", async () => {
      const res = await request(app).get("/api/v1/games");
      expect(res.status).toBe(200);
    });

    it("POST /api/v1/players → 401 (auth required)", async () => {
      const res = await request(app)
        .post("/api/v1/players")
        .field("name", "Unauth Player")
        .field("playerType", "REGISTERED");
      expect(res.status).toBe(401);
    });

    it("POST /api/v1/games → 401 (auth required)", async () => {
      const res = await request(app)
        .post("/api/v1/games")
        .send({ date: new Date().toISOString(), opponentTeamId });
      expect(res.status).toBe(401);
    });

    it("POST /api/v1/teams → 401 (auth required)", async () => {
      const res = await request(app)
        .post("/api/v1/teams")
        .send({ name: "Unauth Team" });
      expect(res.status).toBe(401);
    });
  });

  describe("PLAYER role access", () => {
    it("POST /api/v1/players → 403 (insufficient role)", async () => {
      const res = await request(app)
        .post("/api/v1/players")
        .set("Authorization", `Bearer ${playerToken}`)
        .field("name", "Sneaky Player")
        .field("playerType", "REGISTERED");
      expect(res.status).toBe(403);
    });

    it("POST /api/v1/games → 403 (insufficient role)", async () => {
      const res = await request(app)
        .post("/api/v1/games")
        .set("Authorization", `Bearer ${playerToken}`)
        .send({
          date: new Date().toISOString(),
          opponentTeamId,
          competitionType: "FRIENDLY",
        });
      expect(res.status).toBe(403);
    });

    it("DELETE /api/v1/players/:id → 403 (insufficient role for player role)", async () => {
      const res = await request(app)
        .delete("/api/v1/players/00000000-0000-0000-0000-000000000000")
        .set("Authorization", `Bearer ${playerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe("EDITOR role access", () => {
    it("POST /api/v1/players → 403 (editor cannot create players, requires ADMIN)", async () => {
      const res = await request(app)
        .post("/api/v1/players")
        .set("Authorization", `Bearer ${editorToken}`)
        .field("name", "Editor Created Player")
        .field("playerType", "REGISTERED");
      expect(res.status).toBe(403);
    });

    it("POST /api/v1/games → 201 (editor can create games)", async () => {
      const futureDate = new Date(
        Date.now() + 3 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const res = await request(app)
        .post("/api/v1/games")
        .set("Authorization", `Bearer ${editorToken}`)
        .send({
          date: futureDate,
          opponentTeamId,
          competitionType: "FRIENDLY",
        });
      expect(res.status).toBe(201);
    });

    it("DELETE /api/v1/games/:id → 403 (editor cannot delete)", async () => {
      const futureDate = new Date(
        Date.now() + 20 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const createRes = await request(app)
        .post("/api/v1/games")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          date: futureDate,
          opponentTeamId,
          competitionType: "FRIENDLY",
        });

      const res = await request(app)
        .delete(`/api/v1/games/${createRes.body.data.id}`)
        .set("Authorization", `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe("ADMIN role access", () => {
    it("POST /api/v1/tournaments → 201 (admin can create)", async () => {
      const res = await request(app)
        .post("/api/v1/tournaments")
        .set("Authorization", `Bearer ${adminToken}`)
        .send({
          name: "Admin RBAC Tourn",
          competitionType: "CUP",
          startDate: "2025-01-01",
          endDate: "2025-03-01",
        });
      expect(res.status).toBe(201);
    });

    it("POST /api/v1/tournaments → 403 (editor cannot create)", async () => {
      const res = await request(app)
        .post("/api/v1/tournaments")
        .set("Authorization", `Bearer ${editorToken}`)
        .send({
          name: "Editor RBAC Tourn",
          competitionType: "CUP",
          startDate: "2025-01-01",
          endDate: "2025-03-01",
        });
      expect(res.status).toBe(403);
    });
  });

  describe("Player DELETE RBAC (US2)", () => {
    let testPlayerId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post("/api/v1/players")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "RBAC Delete Target")
        .field("playerType", "REGISTERED");
      testPlayerId = res.body.data.id;
    });

    it("DELETE /api/v1/players/:id → 401 for unauthenticated request", async () => {
      const res = await request(app).delete(
        `/api/v1/players/${testPlayerId}`,
      );
      expect(res.status).toBe(401);
      // Verify player still exists
      const check = await request(app).get(`/api/v1/players/${testPlayerId}`);
      expect(check.status).toBe(200);
    });

    it("DELETE /api/v1/players/:id → 403 for EDITOR token", async () => {
      const res = await request(app)
        .delete(`/api/v1/players/${testPlayerId}`)
        .set("Authorization", `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
      // Verify player unchanged
      const check = await request(app).get(`/api/v1/players/${testPlayerId}`);
      expect(check.status).toBe(200);
    });

    it("DELETE /api/v1/players/:id → 404 on second Admin attempt (concurrent delete)", async () => {
      // Admin deletes the player
      const first = await request(app)
        .delete(`/api/v1/players/${testPlayerId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(first.status).toBe(204);

      // Second attempt returns 404
      const second = await request(app)
        .delete(`/api/v1/players/${testPlayerId}`)
        .set("Authorization", `Bearer ${adminToken}`);
      expect(second.status).toBe(404);
    });
  });

  describe("Player status toggle RBAC (US3)", () => {
    let statusPlayerId: string;

    beforeAll(async () => {
      const res = await request(app)
        .post("/api/v1/players")
        .set("Authorization", `Bearer ${adminToken}`)
        .field("name", "RBAC Status Toggle Player")
        .field("playerType", "REGISTERED");
      statusPlayerId = res.body.data.id;
    });

    it("PATCH /api/v1/players/:id/status → 200 for EDITOR token (INACTIVE)", async () => {
      const res = await request(app)
        .patch(`/api/v1/players/${statusPlayerId}/status`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({ status: "INACTIVE" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("INACTIVE");
    });

    it("PATCH /api/v1/players/:id/status → 200 for EDITOR token (ACTIVE)", async () => {
      const res = await request(app)
        .patch(`/api/v1/players/${statusPlayerId}/status`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({ status: "ACTIVE" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("ACTIVE");
    });

    it("PATCH /api/v1/players/:id/status → 200 for ADMIN token", async () => {
      const res = await request(app)
        .patch(`/api/v1/players/${statusPlayerId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "INACTIVE" });
      expect(res.status).toBe(200);
    });

    it("DELETE /api/v1/players/:id → 403 for EDITOR (cross-check from US2)", async () => {
      const res = await request(app)
        .delete(`/api/v1/players/${statusPlayerId}`)
        .set("Authorization", `Bearer ${editorToken}`);
      expect(res.status).toBe(403);
    });
  });
});
