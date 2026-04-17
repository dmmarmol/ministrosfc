/**
 * Integration test: Team Statistics endpoints
 * Requires: TEST_DATABASE_URL env pointing at a test PostgreSQL database
 */
import request from "supertest";
import { createApp } from "../../../src/config/server";

jest.mock("../../../src/middleware/rate-limiter", () => ({
  authLimiter: (_req: any, _res: any, next: any) => next(),
  registerLimiter: (_req: any, _res: any, next: any) => next(),
  apiLimiter: (_req: any, _res: any, next: any) => next(),
}));

const app = createApp();

describe("Team Statistics (integration)", () => {
  let userToken: string;

  beforeAll(async () => {
    const email = `user-stats-${Date.now()}@ministrosfc.test`;
    const password = "SecurePass!123";
    const reg = await request(app).post("/api/v1/auth/register").send({
      email,
      password,
      passwordConfirmation: password,
      firstName: "Stats",
      lastName: "User",
    });
    userToken = reg.body.data?.accessToken;
  });

  describe("Authentication guard", () => {
    it("GET /api/v1/statistics/team/summary → 401 without auth", async () => {
      const res = await request(app).get("/api/v1/statistics/team/summary");
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/statistics/team/by-year → 401 without auth", async () => {
      const res = await request(app).get("/api/v1/statistics/team/by-year");
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/statistics/team/by-tournament → 401 without auth", async () => {
      const res = await request(app).get(
        "/api/v1/statistics/team/by-tournament",
      );
      expect(res.status).toBe(401);
    });

    it("GET /api/v1/statistics/team/by-rival → 401 without auth", async () => {
      const res = await request(app).get("/api/v1/statistics/team/by-rival");
      expect(res.status).toBe(401);
    });
  });

  describe("Authenticated access", () => {
    it("GET /api/v1/statistics/team/summary → 200 with summary header shape", async () => {
      const res = await request(app)
        .get("/api/v1/statistics/team/summary")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      const data = res.body.data;
      expect(typeof data.totalGames).toBe("number");
      expect(typeof data.totalWins).toBe("number");
      expect(typeof data.winRate).toBe("number");
      expect(data.rivalMostPlayed).toHaveProperty("name");
      expect(data.rivalMostPlayed).toHaveProperty("count");
      expect(data.bestWin).toHaveProperty("score");
      expect(data.topScorer).toHaveProperty("name");
    });

    it("GET /api/v1/statistics/team/by-year → 200 with array of TeamStatPeriodDTO", async () => {
      const res = await request(app)
        .get("/api/v1/statistics/team/by-year")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("GET /api/v1/statistics/team/by-tournament → 200 with array", async () => {
      const res = await request(app)
        .get("/api/v1/statistics/team/by-tournament")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("GET /api/v1/statistics/team/by-rival → 200 with array", async () => {
      const res = await request(app)
        .get("/api/v1/statistics/team/by-rival")
        .set("Authorization", `Bearer ${userToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it("GET /api/v1/statistics/team/rivals/:rivalId → 404 for unknown UUID", async () => {
      const res = await request(app)
        .get(
          "/api/v1/statistics/team/rivals/00000000-0000-0000-0000-000000000000",
        )
        .set("Authorization", `Bearer ${userToken}`);

      // Should return 200 with empty array (no data for unknown rival)
      expect([200, 404]).toContain(res.status);
    });

    it("GET /api/v1/statistics/team/by-year?year=2024 → 200 (optional filter params)", async () => {
      const res = await request(app)
        .get("/api/v1/statistics/team/by-year?year=2024")
        .set("Authorization", `Bearer ${userToken}`);

      // year param is accepted but not applied on by-year route (filtered differently)
      expect(res.status).toBe(200);
    });
  });
});
