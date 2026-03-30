/**
 * Integration test: Google OAuth flow
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

// Mock google-auth-library
const mockFns = {
  getToken: jest.fn(),
  verifyIdToken: jest.fn(),
};
jest.mock("google-auth-library", () => ({
  OAuth2Client: jest.fn().mockImplementation(() => ({
    generateAuthUrl: jest.fn().mockImplementation((opts: any) => {
      const state = opts?.state ?? "";
      return `https://accounts.google.com/o/oauth2/v2/auth?mock=true&state=${state}`;
    }),
    getToken: (...args: any[]) => mockFns.getToken(...args),
    verifyIdToken: (...args: any[]) => mockFns.verifyIdToken(...args),
  })),
}));

const app = createApp();

describe("Google OAuth (integration)", () => {
  beforeEach(async () => {
    await cleanDatabase();
    jest.clearAllMocks();
  });

  describe("GET /api/v1/auth/google", () => {
    it("redirects to Google consent URL with state cookie", async () => {
      const res = await request(app).get("/api/v1/auth/google");

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("accounts.google.com");
      // Should set a state cookie
      const cookies = res.headers["set-cookie"];
      expect(cookies).toBeDefined();
      const stateCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith("google_oauth_state="))
        : cookies?.includes("google_oauth_state=")
          ? cookies
          : undefined;
      expect(stateCookie).toBeDefined();
    });
  });

  describe("GET /api/v1/auth/google/callback", () => {
    const mockGooglePayload = {
      sub: "google-subject-123",
      email: "google@ministrosfc.test",
      given_name: "Carlos",
      family_name: "Gómez",
    };

    function setupMockGoogleResponse() {
      mockFns.getToken.mockResolvedValue({
        tokens: { id_token: "mock-id-token", access_token: "mock-access" },
      });
      mockFns.verifyIdToken.mockResolvedValue({
        getPayload: () => mockGooglePayload,
      });
    }

    it("creates new user without player on first-time Google sign-in (onboarding pending)", async () => {
      setupMockGoogleResponse();

      // First get the state cookie
      const initRes = await request(app).get("/api/v1/auth/google");
      const cookies = initRes.headers["set-cookie"];
      const stateCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith("google_oauth_state="))
        : cookies;

      // Extract state value from the redirect URL
      const stateMatch = initRes.headers.location?.match(/state=([^&]+)/);
      const state = stateMatch ? stateMatch[1] : "mock-state";

      const res = await request(app)
        .get(`/api/v1/auth/google/callback?code=mock-code&state=${state}`)
        .set("Cookie", stateCookie || "");

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("token=");
      expect(res.headers.location).toContain("refresh=");

      // Verify user was created
      const user = await prisma.user.findFirst({
        where: { googleSubjectId: "google-subject-123" },
        include: { player: true },
      });
      expect(user).not.toBeNull();
      expect(user!.firstName).toBe("Carlos");
      expect(user!.lastName).toBe("Gómez");
      expect(user!.role).toBe("PLAYER");
      expect(user!.passwordHash).toBeNull();
      // No Player created — onboarding handles that
      expect(user!.player).toBeNull();
      expect(user!.onboardingCompletedAt).toBeNull();
    });

    it("signs in existing user when googleSubjectId matches", async () => {
      setupMockGoogleResponse();

      // Create user with google subject ID first
      const player = await prisma.player.create({
        data: {
          firstName: "Carlos",
          lastName: "Gómez",
          status: "ACTIVE",
          playerType: "REGISTERED",
        },
      });
      await prisma.user.create({
        data: {
          email: "google@ministrosfc.test",
          firstName: "Carlos",
          lastName: "Gómez",
          role: "PLAYER",
          googleSubjectId: "google-subject-123",
          playerId: player.id,
        },
      });

      const initRes = await request(app).get("/api/v1/auth/google");
      const cookies = initRes.headers["set-cookie"];
      const stateCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith("google_oauth_state="))
        : cookies;
      const stateMatch = initRes.headers.location?.match(/state=([^&]+)/);
      const state = stateMatch ? stateMatch[1] : "";

      const res = await request(app)
        .get(`/api/v1/auth/google/callback?code=mock-code&state=${state}`)
        .set("Cookie", stateCookie || "");

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("token=");

      // Should not have created a second user
      const count = await prisma.user.count({
        where: { email: "google@ministrosfc.test" },
      });
      expect(count).toBe(1);
    });

    it("links Google account when email matches existing user", async () => {
      setupMockGoogleResponse();

      // Create email-only user
      const player = await prisma.player.create({
        data: {
          firstName: "Carlos",
          lastName: "Gómez",
          status: "ACTIVE",
          playerType: "REGISTERED",
        },
      });
      await prisma.user.create({
        data: {
          email: "google@ministrosfc.test",
          firstName: "Carlos",
          lastName: "Gómez",
          role: "PLAYER",
          passwordHash: "$2b$12$fakehash",
          playerId: player.id,
        },
      });

      const initRes = await request(app).get("/api/v1/auth/google");
      const cookies = initRes.headers["set-cookie"];
      const stateCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith("google_oauth_state="))
        : cookies;
      const stateMatch = initRes.headers.location?.match(/state=([^&]+)/);
      const state = stateMatch ? stateMatch[1] : "";

      const res = await request(app)
        .get(`/api/v1/auth/google/callback?code=mock-code&state=${state}`)
        .set("Cookie", stateCookie || "");

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("token=");

      // Verify googleSubjectId was linked
      const user = await prisma.user.findUnique({
        where: { email: "google@ministrosfc.test" },
      });
      expect(user!.googleSubjectId).toBe("google-subject-123");
    });

    it("redirects to login with error when consent is cancelled", async () => {
      const res = await request(app).get(
        "/api/v1/auth/google/callback?error=access_denied",
      );

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("/login?error=google_cancelled");
    });

    it("redirects to login with error when token exchange fails", async () => {
      mockFns.getToken.mockRejectedValue(new Error("Token exchange failed"));
      mockFns.verifyIdToken.mockResolvedValue({ getPayload: () => null });

      const initRes = await request(app).get("/api/v1/auth/google");
      const cookies = initRes.headers["set-cookie"];
      const stateCookie = Array.isArray(cookies)
        ? cookies.find((c: string) => c.startsWith("google_oauth_state="))
        : cookies;
      const stateMatch = initRes.headers.location?.match(/state=([^&]+)/);
      const state = stateMatch ? stateMatch[1] : "";

      const res = await request(app)
        .get(`/api/v1/auth/google/callback?code=bad-code&state=${state}`)
        .set("Cookie", stateCookie || "");

      expect(res.status).toBe(302);
      expect(res.headers.location).toContain("/login?error=google_failed");
    });
  });
});
