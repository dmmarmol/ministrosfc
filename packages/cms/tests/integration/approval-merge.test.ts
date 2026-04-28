/**
 * Integration test: Approval merge flow
 * Tests approve-merge (with immediate merge) and post-approval merge
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

const editorEmail = `editor-merge-${Date.now()}@ministrosfc.test`;
const editorPassword = "Editor!Mrg99";

async function getEditorToken(): Promise<string> {
  await request(app).post("/api/v1/auth/register").send({
    email: editorEmail,
    password: editorPassword,
    passwordConfirmation: editorPassword,
    firstName: "Editor",
    lastName: "Merge",
  });
  await prisma.user.update({
    where: { email: editorEmail },
    data: { role: "EDITOR", registrationStatus: "APPROVED" },
  });
  const res = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: editorEmail, password: editorPassword });
  return res.body.data.accessToken;
}

async function registerPendingUser(
  email: string,
  firstName = "Pending",
  lastName = "User",
) {
  await request(app).post("/api/v1/auth/register").send({
    email,
    password: "Pending!Pass99",
    passwordConfirmation: "Pending!Pass99",
    firstName,
    lastName,
  });
  const user = await prisma.user.findUnique({ where: { email } });
  return user!;
}

describe("Approval merge flow (integration)", () => {
  let editorToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    editorToken = await getEditorToken();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({
      where: { registrationStatus: "PENDING_APPROVAL" },
    });
    await prisma.player.deleteMany({});
  });

  describe("POST /api/v1/users/pending-approvals/:userId/approve-merge", () => {
    it("approves and merges in one operation", async () => {
      const pending = await registerPendingUser(
        `pending-merge-${Date.now()}@ministrosfc.test`,
        "Mario",
        "Rossi",
      );

      const orphan = await prisma.player.create({
        data: { firstName: "Mario", lastName: "Rossi", status: "ACTIVE" },
      });

      const res = await request(app)
        .post(`/api/v1/users/pending-approvals/${pending.id}/approve-merge`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({ mergePlayerId: orphan.id });

      expect(res.status).toBe(200);
      expect(res.body.data.registrationStatus).toBe("APPROVED");
      expect(res.body.data.playerId).toBe(orphan.id);

      const updated = await prisma.user.findUnique({
        where: { id: pending.id },
      });
      expect(updated!.registrationStatus).toBe("APPROVED");
      expect(updated!.playerId).toBe(orphan.id);

      const mergedPlayer = await prisma.player.findUnique({
        where: { id: orphan.id },
        include: { user: true },
      });
      expect(mergedPlayer!.user?.id).toBe(pending.id);
    });

    it("returns 404 if orphan player not found", async () => {
      const pending = await registerPendingUser(
        `pending-noorphan-${Date.now()}@ministrosfc.test`,
      );

      const res = await request(app)
        .post(`/api/v1/users/pending-approvals/${pending.id}/approve-merge`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({ mergePlayerId: "non-existent-id" });

      expect(res.status).toBe(404);

      // User should still be pending
      const updated = await prisma.user.findUnique({
        where: { id: pending.id },
      });
      expect(updated!.registrationStatus).toBe("PENDING_APPROVAL");
    });

    it("returns 400 if player is already linked to a user", async () => {
      const pending = await registerPendingUser(
        `pending-linked-${Date.now()}@ministrosfc.test`,
      );
      const linkedUser = await registerPendingUser(
        `linked-user-${Date.now()}@ministrosfc.test`,
      );

      const player = await prisma.player.create({
        data: {
          firstName: "Already",
          lastName: "Linked",
          status: "ACTIVE",
          user: { connect: { id: linkedUser.id } },
        },
      });

      const res = await request(app)
        .post(`/api/v1/users/pending-approvals/${pending.id}/approve-merge`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({ mergePlayerId: player.id });

      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it("returns 409 on optimistic lock conflict", async () => {
      const pending = await registerPendingUser(
        `pending-lock-merge-${Date.now()}@ministrosfc.test`,
        "Luigi",
        "Verdi",
      );

      const orphan = await prisma.player.create({
        data: { firstName: "Luigi", lastName: "Verdi", status: "ACTIVE" },
      });

      const res = await request(app)
        .post(`/api/v1/users/pending-approvals/${pending.id}/approve-merge`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({
          mergePlayerId: orphan.id,
          expectedUpdatedAt: "2000-01-01T00:00:00.000Z",
        });

      expect(res.status).toBe(409);
    });
  });

  describe("GET /api/v1/orphan-players (post-approval merge)", () => {
    it("lists all orphan players (no user association)", async () => {
      await prisma.player.create({
        data: { firstName: "Orphan", lastName: "One", status: "ACTIVE" },
      });
      await prisma.player.create({
        data: { firstName: "Orphan", lastName: "Two", status: "ACTIVE" },
      });

      const res = await request(app)
        .get("/api/v1/orphan-players")
        .set("Authorization", `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBeGreaterThanOrEqual(2);
    });

    it("returns 403 for unauthenticated requests", async () => {
      const res = await request(app).get("/api/v1/orphan-players");
      expect(res.status).toBe(401);
    });
  });

  describe("POST /api/v1/users/:userId/merge-player", () => {
    it("merges an already-approved user with an orphan player", async () => {
      const user = await registerPendingUser(
        `approved-user-${Date.now()}@ministrosfc.test`,
        "Paolo",
        "Bianchi",
      );
      await prisma.user.update({
        where: { id: user.id },
        data: { registrationStatus: "APPROVED" },
      });

      const orphan = await prisma.player.create({
        data: { firstName: "Paolo", lastName: "Bianchi", status: "ACTIVE" },
      });

      const res = await request(app)
        .post(`/api/v1/users/${user.id}/merge-player`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({ mergePlayerId: orphan.id });

      expect(res.status).toBe(200);
      expect(res.body.data.playerId).toBe(orphan.id);

      const updated = await prisma.user.findUnique({ where: { id: user.id } });
      expect(updated!.playerId).toBe(orphan.id);
    });

    it("returns 404 if user not found", async () => {
      const res = await request(app)
        .post("/api/v1/users/non-existent-id/merge-player")
        .set("Authorization", `Bearer ${editorToken}`)
        .send({ mergePlayerId: "any-id" });

      expect(res.status).toBe(404);
    });
  });
});
