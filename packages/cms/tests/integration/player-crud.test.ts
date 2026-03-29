/**
 * Integration test: Player CRUD
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
jest.mock("../../src/utils/object-storage", () => ({
  validatePhotoFile: jest.fn(),
  uploadPlayerPhoto: jest
    .fn()
    .mockResolvedValue("https://res.cloudinary.com/test/image/upload/test.jpg"),
  deletePlayerPhoto: jest.fn().mockResolvedValue(undefined),
}));

const app = createApp();

describe("Player CRUD (integration)", () => {
  let adminToken: string;
  let editorToken: string;
  let playerId: string;

  const adminEmail = `admin-player-${Date.now()}@ministrosfc.test`;
  const editorEmail = `editor-player-${Date.now()}@ministrosfc.test`;

  beforeAll(async () => {
    // Register admin user and manually elevate role
    const reg = await request(app).post("/api/v1/auth/register").send({
      email: adminEmail,
      password: "Admin!Secret99",
      firstName: "Admin",
      lastName: "Player Test",
    });
    expect(reg.status).toBe(201);

    await prisma.user.update({
      where: { email: adminEmail },
      data: { role: "ADMIN" },
    });

    const loginAdmin = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: adminEmail, password: "Admin!Secret99" });
    adminToken = loginAdmin.body.data.accessToken;

    // Register editor user
    const regEditor = await request(app).post("/api/v1/auth/register").send({
      email: editorEmail,
      password: "Editor!Secret99",
      firstName: "Editor",
      lastName: "Player Test",
    });
    expect(regEditor.status).toBe(201);

    await prisma.user.update({
      where: { email: editorEmail },
      data: { role: "EDITOR" },
    });

    const loginEditor = await request(app)
      .post("/api/v1/auth/login")
      .send({ email: editorEmail, password: "Editor!Secret99" });
    editorToken = loginEditor.body.data.accessToken;
  });

  it("POST /api/v1/players → 201 creates player (admin)", async () => {
    const res = await request(app)
      .post("/api/v1/players")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("firstName", "Integration Test")
      .field("lastName", "Player")
      .field("jerseyNumber", "77")
      .field("position", "CF")
      .field("playerType", "REGISTERED");

    expect(res.status).toBe(201);
    expect(res.body.data.firstName).toBe("Integration Test");
    expect(res.body.data.lastName).toBe("Player");
    expect(res.body.data.jerseyNumber).toBe(77);
    playerId = res.body.data.id;
  });

  it("GET /api/v1/players → 200 returns player list (public)", async () => {
    const res = await request(app).get("/api/v1/players");

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty("total");
  });

  it("GET /api/v1/players/:id → 200 returns player detail", async () => {
    const res = await request(app).get(`/api/v1/players/${playerId}`);

    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(playerId);
    expect(res.body.data.firstName).toBe("Integration Test");
  });

  it("PATCH /api/v1/players/:id → 200 updates player (admin)", async () => {
    const res = await request(app)
      .patch(`/api/v1/players/${playerId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .field("nickname", "Integrator");

    expect(res.status).toBe(200);
    expect(res.body.data.nickname).toBe("Integrator");
  });

  it("PATCH /api/v1/players/:id → 403 for editor (requires ADMIN)", async () => {
    const res = await request(app)
      .patch(`/api/v1/players/${playerId}`)
      .set("Authorization", `Bearer ${editorToken}`)
      .field("nickname", "EditorNick");

    expect(res.status).toBe(403);
  });

  it("POST /api/v1/players → 409 on duplicate jersey number", async () => {
    const res = await request(app)
      .post("/api/v1/players")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("firstName", "Duplicate")
      .field("lastName", "Jersey")
      .field("jerseyNumber", "77")
      .field("playerType", "REGISTERED");

    expect(res.status).toBe(409);
  });

  it("PATCH /api/v1/players/:id/status → 200 deactivates player (admin)", async () => {
    const res = await request(app)
      .patch(`/api/v1/players/${playerId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "INACTIVE" });

    expect(res.status).toBe(200);
    expect(res.body.data.status).toBe("INACTIVE");
  });

  it("GET /api/v1/players → inactive player not returned by default", async () => {
    const res = await request(app).get("/api/v1/players");
    const ids = res.body.data.map((p: any) => p.id);
    expect(ids).not.toContain(playerId);
  });

  it("GET /api/v1/players?status=INACTIVE → shows inactive player (auth required)", async () => {
    const res = await request(app)
      .get("/api/v1/players?status=INACTIVE")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    const found = res.body.data.find((p: any) => p.id === playerId);
    expect(found).toBeTruthy();
  });

  it("GET /api/v1/players/:id → 404 for nonexistent player", async () => {
    const res = await request(app).get(
      "/api/v1/players/00000000-0000-0000-0000-000000000000",
    );
    expect(res.status).toBe(404);
  });

  it("DELETE /api/v1/players/:id → 204 deletes player (admin)", async () => {
    // Create a fresh player to delete so we don't break remaining tests
    const createRes = await request(app)
      .post("/api/v1/players")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("firstName", "Player To")
      .field("lastName", "Delete")
      .field("playerType", "REGISTERED");
    expect(createRes.status).toBe(201);
    const deleteId = createRes.body.data.id;

    const res = await request(app)
      .delete(`/api/v1/players/${deleteId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(204);
    expect(res.body).toEqual({});
  });

  it("DELETE /api/v1/players/:id → player absent on follow-up GET after delete", async () => {
    const createRes = await request(app)
      .post("/api/v1/players")
      .set("Authorization", `Bearer ${adminToken}`)
      .field("firstName", "To Be")
      .field("lastName", "Deleted")
      .field("playerType", "REGISTERED");
    const deleteId = createRes.body.data.id;

    await request(app)
      .delete(`/api/v1/players/${deleteId}`)
      .set("Authorization", `Bearer ${adminToken}`);

    const getRes = await request(app).get(`/api/v1/players/${deleteId}`);
    expect(getRes.status).toBe(404);
  });

  it("DELETE /api/v1/players/:id → 404 for unknown UUID", async () => {
    const res = await request(app)
      .delete("/api/v1/players/f47ac10b-58cc-4372-a567-0e02b2c3d479")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(404);
  });

  it("DELETE /api/v1/players/:id → 400 for invalid UUID format", async () => {
    const res = await request(app)
      .delete("/api/v1/players/not-a-uuid")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(400);
  });
});
