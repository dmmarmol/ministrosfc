/**
 * Integration test: Admin role management
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

async function registerAndLogin(
  email: string,
  /** @TODO try to use existing types or type values to enforce typing here */
  role: "ADMIN" | "EDITOR" | "DT" | "PLAYER" = "PLAYER",
  { createPlayer = false }: { createPlayer?: boolean } = {},
) {
  const password = "Segura123!";
  await request(app).post("/api/v1/auth/register").send({
    email,
    password,
    passwordConfirmation: password,
    firstName: "Test",
    lastName: role,
  });
  if (role !== "PLAYER") {
    await prisma.user.update({ where: { email }, data: { role } });
  }
  const user = await prisma.user.findUnique({ where: { email } });
  if (createPlayer) {
    await prisma.player.create({
      data: {
        firstName: "Test",
        lastName: role,
        user: { connect: { id: user!.id } },
      },
    });
  }
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email, password });
  return { token: res.body.data.accessToken, userId: user!.id };
}

describe("Admin role management (integration)", () => {
  let admin: { token: string; userId: string };
  let editor: { token: string; userId: string };
  let player: { token: string; userId: string };
  let player2: { token: string; userId: string };

  beforeEach(async () => {
    await cleanDatabase();
    admin = await registerAndLogin("admin@ministrosfc.test", "ADMIN");
    editor = await registerAndLogin("editor@ministrosfc.test", "EDITOR");
    player = await registerAndLogin("player@ministrosfc.test", "PLAYER", {
      createPlayer: true,
    });
    player2 = await registerAndLogin("player2@ministrosfc.test", "PLAYER", {
      createPlayer: true,
    });
  });

  describe("GET /api/v1/admin/users", () => {
    it("returns paginated user list for ADMIN", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(4);
      expect(res.body.meta).toHaveProperty("total", 4);
      expect(res.body.meta).toHaveProperty("page", 1);
    });

    it("returns paginated user list for EDITOR", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${editor.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBe(4);
      expect(res.body.meta).toHaveProperty("total", 4);
      expect(res.body.meta).toHaveProperty("page", 1);
    });
    describe("PATCH /api/v1/admin/users/:id", () => {
      it("allows ADMIN to edit user profile fields", async () => {
        const res = await request(app)
          .patch(`/api/v1/admin/users/${player.userId}`)
          .set("Authorization", `Bearer ${admin.token}`)
          .send({
            firstName: "Nuevo",
            lastName: "Apellido",
            email: "nuevo@ministrosfc.test",
          });

        expect(res.status).toBe(200);
        expect(res.body.data.firstName).toBe("Nuevo");
        expect(res.body.data.lastName).toBe("Apellido");
        expect(res.body.data.email).toBe("nuevo@ministrosfc.test");
      });

      it("allows EDITOR to edit user profile fields", async () => {
        const res = await request(app)
          .patch(`/api/v1/admin/users/${player2.userId}`)
          .set("Authorization", `Bearer ${editor.token}`)
          .send({
            firstName: "Editado",
            lastName: "PorEditor",
            email: "editado@ministrosfc.test",
          });

        expect(res.status).toBe(200);
        expect(res.body.data.firstName).toBe("Editado");
        expect(res.body.data.lastName).toBe("PorEditor");
        expect(res.body.data.email).toBe("editado@ministrosfc.test");
      });

      it("rejects non-Editor+ users", async () => {
        const res = await request(app)
          .patch(`/api/v1/admin/users/${admin.userId}`)
          .set("Authorization", `Bearer ${player.token}`)
          .send({ firstName: "Hacker" });
        expect(res.status).toBe(403);
      });

      it("validates email uniqueness", async () => {
        // Try to set player2's email to admin's email
        const res = await request(app)
          .patch(`/api/v1/admin/users/${player2.userId}`)
          .set("Authorization", `Bearer ${admin.token}`)
          .send({ email: "admin@ministrosfc.test" });
        expect(res.status).toBe(409);
      });
    });

    it("filters by role", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users?role=PLAYER")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBe(2);
      expect(res.body.data.every((u: any) => u.role === "PLAYER")).toBe(true);
    });

    it("searches by name or email", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users?search=editor")
        .set("Authorization", `Bearer ${admin.token}`);

      expect(res.status).toBe(200);
      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it("returns 200 for EDITOR (Editor+ access)", async () => {
      const res = await request(app)
        .get("/api/v1/admin/users")
        .set("Authorization", `Bearer ${editor.token}`);

      expect(res.status).toBe(200);
    });

    it("returns 401 without auth", async () => {
      const res = await request(app).get("/api/v1/admin/users");
      expect(res.status).toBe(401);
    });
  });

  describe("PATCH /api/v1/admin/users/:id/role", () => {
    it("promotes PLAYER to DT", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${player.userId}/role`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ role: "DT" });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("DT");
    });

    it("promotes PLAYER to EDITOR", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${player.userId}/role`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ role: "EDITOR" });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("EDITOR");
    });

    it("demotes EDITOR to PLAYER", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${editor.userId}/role`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ role: "PLAYER" });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("PLAYER");
    });

    it("allows ADMIN to demote another ADMIN", async () => {
      // Create another admin
      const admin2 = await registerAndLogin("admin2@ministrosfc.test", "ADMIN");

      const res = await request(app)
        .patch(`/api/v1/admin/users/${admin2.userId}/role`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ role: "PLAYER" });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("PLAYER");
    });

    it("rejects changing own role", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${admin.userId}/role`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ role: "PLAYER" });

      expect(res.status).toBe(403);
      expect(res.body.message).toBe("Cannot demote yourself");
    });

    it("allows ADMIN to promote user to ADMIN role", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${editor.userId}/role`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ role: "ADMIN" });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("ADMIN");
    });

    it("returns success for idempotent role change", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${player.userId}/role`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ role: "PLAYER" });

      expect(res.status).toBe(200);
      expect(res.body.data.role).toBe("PLAYER");
    });

    it("rejects non-ADMIN caller", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${player.userId}/role`)
        .set("Authorization", `Bearer ${editor.token}`)
        .send({ role: "DT" });

      expect(res.status).toBe(403);
    });

    it("returns 404 for unknown user", async () => {
      const res = await request(app)
        .patch("/api/v1/admin/users/00000000-0000-0000-0000-000000000000/role")
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ role: "DT" });

      expect(res.status).toBe(404);
    });

    it("rejects invalid role value", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${player.userId}/role`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ role: "SUPERADMIN" });

      expect(res.status).toBe(400);
    });
  });

  describe("PATCH /api/v1/admin/users/:id/player-status", () => {
    it("deactivates a player (EDITOR+)", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${player.userId}/player-status`)
        .set("Authorization", `Bearer ${editor.token}`)
        .send({ status: "INACTIVE" });

      expect(res.status).toBe(200);
      expect(res.body.data.player.status).toBe("INACTIVE");
    });

    it("reactivates a player", async () => {
      // First deactivate
      await request(app)
        .patch(`/api/v1/admin/users/${player.userId}/player-status`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ status: "INACTIVE" });

      const res = await request(app)
        .patch(`/api/v1/admin/users/${player.userId}/player-status`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ status: "ACTIVE" });

      expect(res.status).toBe(200);
      expect(res.body.data.player.status).toBe("ACTIVE");
    });

    it("returns 403 for PLAYER role", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${player2.userId}/player-status`)
        .set("Authorization", `Bearer ${player.token}`)
        .send({ status: "INACTIVE" });

      expect(res.status).toBe(403);
    });

    it("returns 404 when user has no linked player", async () => {
      // Create user without player
      const userOnly = await prisma.user.create({
        data: {
          email: "noPlayer@ministrosfc.test",
          passwordHash: "irrelevant",
          firstName: "No",
          lastName: "Player",
          role: "PLAYER",
        },
      });

      const res = await request(app)
        .patch(`/api/v1/admin/users/${userOnly.id}/player-status`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ status: "INACTIVE" });

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/v1/admin/users/:id/player", () => {
    it("hard-deletes player (ADMIN only)", async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/users/${player.userId}/player`)
        .set("Authorization", `Bearer ${admin.token}`);

      expect(res.status).toBe(204);

      // Verify player was actually deleted
      const user = await prisma.user.findUnique({
        where: { id: player.userId },
        include: { player: true },
      });
      expect(user!.playerId).toBeNull();
    });

    it("returns 403 for EDITOR", async () => {
      const res = await request(app)
        .delete(`/api/v1/admin/users/${player.userId}/player`)
        .set("Authorization", `Bearer ${editor.token}`);

      expect(res.status).toBe(403);
    });

    it("returns 404 when user has no linked player", async () => {
      // Delete player first
      await request(app)
        .delete(`/api/v1/admin/users/${player.userId}/player`)
        .set("Authorization", `Bearer ${admin.token}`);

      // Try again
      const res = await request(app)
        .delete(`/api/v1/admin/users/${player.userId}/player`)
        .set("Authorization", `Bearer ${admin.token}`);

      expect(res.status).toBe(404);
    });

    it("T022 integrity: Player record is removed from DB after hard-delete", async () => {
      // Capture the player record id before deletion
      const userBefore = await prisma.user.findUniqueOrThrow({
        where: { id: player2.userId },
        include: { player: true },
      });
      const playerRecordId = userBefore.player!.id;

      const res = await request(app)
        .delete(`/api/v1/admin/users/${player2.userId}/player`)
        .set("Authorization", `Bearer ${admin.token}`);

      expect(res.status).toBe(204);

      // Player row must be gone
      const gone = await prisma.player.findUnique({
        where: { id: playerRecordId },
      });
      expect(gone).toBeNull();

      // User still exists but has no linked player
      const userAfter = await prisma.user.findUniqueOrThrow({
        where: { id: player2.userId },
      });
      expect(userAfter.playerId).toBeNull();
    });
  });

  // T030 regression: duplicate-email and stale-write conflict
  describe("T030 regression: profile edit edge cases", () => {
    it("returns 409 on duplicate-email conflict with specific error message", async () => {
      const res = await request(app)
        .patch(`/api/v1/admin/users/${player.userId}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ email: "editor@ministrosfc.test" });

      expect(res.status).toBe(409);
      expect(res.body.message).toMatch(
        /email already in use|conflict|ya está en uso/i,
      );
    });

    it("returns 409 on stale-write conflict when expectedUpdatedAt is outdated", async () => {
      const outdatedTimestamp = new Date(0).toISOString(); // epoch = clearly stale

      const res = await request(app)
        .patch(`/api/v1/admin/users/${player.userId}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({ firstName: "Stale", expectedUpdatedAt: outdatedTimestamp });

      expect(res.status).toBe(409);
    });

    it("succeeds when expectedUpdatedAt matches current updatedAt", async () => {
      const current = await prisma.user.findUniqueOrThrow({
        where: { id: player.userId },
      });

      const res = await request(app)
        .patch(`/api/v1/admin/users/${player.userId}`)
        .set("Authorization", `Bearer ${admin.token}`)
        .send({
          firstName: "Concurrente",
          expectedUpdatedAt: current.updatedAt.toISOString(),
        });

      expect(res.status).toBe(200);
      expect(res.body.data.firstName).toBe("Concurrente");
    });
  });
});
