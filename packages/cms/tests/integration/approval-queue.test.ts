/**
 * Integration test: Approval queue
 * Tests the pending approval queue, orphan player listing,
 * approve-without-merge, deny (hard-delete), and optimistic locking.
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

const editorEmail = `editor-approval-${Date.now()}@ministrosfc.test`;
const editorPassword = "Editor!Appr99";

async function getEditorToken(): Promise<string> {
  await request(app).post("/api/v1/auth/register").send({
    email: editorEmail,
    password: editorPassword,
    passwordConfirmation: editorPassword,
    firstName: "Editor",
    lastName: "Approvals",
  });
  await prisma.user.update({
    where: { email: editorEmail },
    data: { role: "EDITOR", registrationStatus: "APPROVED" },
  });
  const loginRes = await request(app)
    .post("/api/v1/auth/login")
    .send({ email: editorEmail, password: editorPassword });

  if (loginRes.status !== 200) {
    throw new Error(
      `Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.body)}`,
    );
  }

  if (!loginRes.body?.data?.accessToken) {
    throw new Error(
      `No accessToken in login response: ${JSON.stringify(loginRes.body)}`,
    );
  }

  return loginRes.body.data.accessToken;
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

describe("Approval queue (integration)", () => {
  let editorToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    editorToken = await getEditorToken();
  });

  beforeEach(async () => {
    // Remove pending users between tests (but keep editor and other approved users)
    await prisma.user.deleteMany({
      where: { registrationStatus: "PENDING_APPROVAL" },
    });
    await prisma.player.deleteMany({});
  });

  describe("GET /api/v1/users/pending-approvals", () => {
    it("returns 200 with empty list when no pending users", async () => {
      const res = await request(app)
        .get("/api/v1/users/pending-approvals")
        .set("Authorization", `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(0);
      expect(res.body.data.meta.total).toBe(0);
    });

    it("lists pending users with suggestions", async () => {
      await registerPendingUser(
        `pending-${Date.now()}@ministrosfc.test`,
        "Carlos",
        "García",
      );

      const res = await request(app)
        .get("/api/v1/users/pending-approvals")
        .set("Authorization", `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.data).toHaveLength(1);
      const item = res.body.data.data[0];
      expect(item.firstName).toBe("Carlos");
      expect(item.lastName).toBe("García");
      expect(Array.isArray(item.suggestions)).toBe(true);
    });

    it("returns 403 for unauthenticated requests", async () => {
      const res = await request(app).get("/api/v1/users/pending-approvals");
      expect(res.status).toBe(401);
    });

    it("returns 403 for PLAYER role", async () => {
      const playerEmail = `player-appr-${Date.now()}@ministrosfc.test`;
      await request(app).post("/api/v1/auth/register").send({
        email: playerEmail,
        password: "Player!99",
        passwordConfirmation: "Player!99",
        firstName: "Player",
        lastName: "Noauth",
      });
      await prisma.user.update({
        where: { email: playerEmail },
        data: { registrationStatus: "APPROVED" },
      });
      const loginRes = await request(app)
        .post("/api/v1/auth/login")
        .send({ email: playerEmail, password: "Player!99" });
      const playerToken = loginRes.body.data.accessToken;

      const res = await request(app)
        .get("/api/v1/users/pending-approvals")
        .set("Authorization", `Bearer ${playerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe("GET /api/v1/users/pending-approvals/:userId/orphan-players", () => {
    it("returns orphan players list for a pending user", async () => {
      const pending = await registerPendingUser(
        `pending-orphan-${Date.now()}@ministrosfc.test`,
        "Mario",
        "Rossi",
      );

      await prisma.player.create({
        data: { firstName: "Mario", lastName: "Rossi", status: "ACTIVE" },
      });

      const res = await request(app)
        .get(`/api/v1/users/pending-approvals/${pending.id}/orphan-players`)
        .set("Authorization", `Bearer ${editorToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data.data)).toBe(true);
    });

    it("returns 404 for non-existent user", async () => {
      const res = await request(app)
        .get("/api/v1/users/pending-approvals/non-existent-id/orphan-players")
        .set("Authorization", `Bearer ${editorToken}`);

      expect(res.status).toBe(404);
    });

    it("returns 409 if user is not pending", async () => {
      const approvedUser = await prisma.user.findUnique({
        where: { email: editorEmail },
      });

      const res = await request(app)
        .get(
          `/api/v1/users/pending-approvals/${approvedUser!.id}/orphan-players`,
        )
        .set("Authorization", `Bearer ${editorToken}`);

      expect(res.status).toBe(409);
    });
  });

  describe("POST /api/v1/users/pending-approvals/:userId/approve", () => {
    it("approves a pending user (no merge)", async () => {
      const pending = await registerPendingUser(
        `pending-approve-${Date.now()}@ministrosfc.test`,
      );

      const res = await request(app)
        .post(`/api/v1/users/pending-approvals/${pending.id}/approve`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({});

      expect(res.status).toBe(200);
      expect(res.body.data.registrationStatus).toBe("APPROVED");

      const updated = await prisma.user.findUnique({
        where: { id: pending.id },
      });
      expect(updated!.registrationStatus).toBe("APPROVED");
    });

    it("returns 409 (CONFLICT) on optimistic lock conflict", async () => {
      const pending = await registerPendingUser(
        `pending-lock-${Date.now()}@ministrosfc.test`,
      );

      const res = await request(app)
        .post(`/api/v1/users/pending-approvals/${pending.id}/approve`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({ expectedUpdatedAt: "2000-01-01T00:00:00.000Z" });

      expect(res.status).toBe(409);
      expect(res.body.code).toBe("CONFLICT");
    });

    it("returns 409 if user already decided", async () => {
      const pending = await registerPendingUser(
        `pending-dup-${Date.now()}@ministrosfc.test`,
      );

      // Approve once
      await request(app)
        .post(`/api/v1/users/pending-approvals/${pending.id}/approve`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({});

      // Try to approve again
      const res = await request(app)
        .post(`/api/v1/users/pending-approvals/${pending.id}/approve`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({});

      expect(res.status).toBe(409);
    });
  });

  describe("POST /api/v1/users/pending-approvals/:userId/deny", () => {
    it("hard-deletes the pending user on deny", async () => {
      const pending = await registerPendingUser(
        `pending-deny-${Date.now()}@ministrosfc.test`,
      );

      const res = await request(app)
        .post(`/api/v1/users/pending-approvals/${pending.id}/deny`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({ reason: "Duplicate account detected" });

      expect(res.status).toBe(200);

      // User should be deleted
      const deleted = await prisma.user.findUnique({
        where: { id: pending.id },
      });
      expect(deleted).toBeNull();
    });

    it("returns 400 if reason is missing", async () => {
      const pending = await registerPendingUser(
        `pending-noreason-${Date.now()}@ministrosfc.test`,
      );

      const res = await request(app)
        .post(`/api/v1/users/pending-approvals/${pending.id}/deny`)
        .set("Authorization", `Bearer ${editorToken}`)
        .send({ reason: "" });

      expect(res.status).toBe(400);
    });
  });
});
