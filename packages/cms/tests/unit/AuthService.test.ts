import { AuthService } from "../../src/services/AuthService";
import { UserModel } from "../../src/models/User";
import jwt from "jsonwebtoken";

const mockRedis = {
  setex: jest.fn().mockResolvedValue("OK"),
  get: jest.fn().mockResolvedValue(null),
  del: jest.fn().mockResolvedValue(1),
  keys: jest.fn().mockResolvedValue([]),
};

jest.mock("../../src/config/redis", () => ({
  getRedisClient: () => mockRedis,
}));

jest.mock("../../src/models/User");

jest.mock("../../src/config/database", () => ({
  prisma: {
    player: {
      create: jest.fn().mockResolvedValue({
        id: "player-1",
        firstName: "New",
        lastName: "User",
        status: "ACTIVE",
        playerType: "REGISTERED",
      }),
    },
  },
}));

describe("AuthService", () => {
  afterEach(() => jest.clearAllMocks());

  describe("generateTokens", () => {
    it("generates a JWT access token and a random refresh token", () => {
      const { accessToken, refreshToken } = AuthService.generateTokens({
        userId: "user-1",
        role: "PLAYER",
      });
      expect(accessToken).toBeTruthy();
      expect(refreshToken).toHaveLength(80); // 40 bytes hex = 80 chars
      const decoded = jwt.decode(accessToken) as any;
      expect(decoded.userId).toBe("user-1");
      expect(decoded.role).toBe("PLAYER");
    });
  });

  describe("login", () => {
    it("returns tokens and user data for valid credentials", async () => {
      const mockUser = {
        id: "u1",
        email: "admin@test.com",
        firstName: "Admin",
        lastName: "User",
        role: "ADMIN" as const,
        passwordHash: "hashed",
      };
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.verifyPassword as jest.Mock).mockResolvedValue(true);
      (UserModel.update as jest.Mock).mockResolvedValue(mockUser);

      const res = await AuthService.login("admin@test.com", "correct");
      expect(res.accessToken).toBeTruthy();
      expect(res.user.email).toBe("admin@test.com");
      expect(res.user.firstName).toBe("Admin");
      expect(res.user.lastName).toBe("User");
      expect(res.user.role).toBe("ADMIN");
    });

    it("throws 401 when user not found", async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
      await expect(AuthService.login("no@one.com", "pw")).rejects.toMatchObject(
        { statusCode: 401 },
      );
    });

    it("throws 401 when password is wrong", async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        id: "u1",
        passwordHash: "h",
      });
      (UserModel.verifyPassword as jest.Mock).mockResolvedValue(false);
      await expect(
        AuthService.login("user@test.com", "wrong"),
      ).rejects.toMatchObject({ statusCode: 401 });
    });
  });

  describe("register", () => {
    it("creates a PLAYER role user with firstName/lastName", async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
      const created = {
        id: "u2",
        email: "new@test.com",
        firstName: "New",
        lastName: "User",
        role: "PLAYER" as const,
      };
      (UserModel.create as jest.Mock).mockResolvedValue(created);
      (UserModel.update as jest.Mock).mockResolvedValue(created);

      const res = await AuthService.register({
        email: "new@test.com",
        password: "Segura123!",
        passwordConfirmation: "Segura123!",
        firstName: "New",
        lastName: "User",
      });
      expect(res.user.role).toBe("PLAYER");
      expect(res.user.firstName).toBe("New");
      expect(res.user.lastName).toBe("User");
      expect((UserModel.create as jest.Mock).mock.calls[0][0].role).toBe(
        "PLAYER",
      );
    });

    it("stores refresh token in Redis", async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
      (UserModel.create as jest.Mock).mockResolvedValue({
        id: "u3",
        email: "redis@test.com",
        firstName: "Redis",
        lastName: "Test",
        role: "PLAYER",
      });
      (UserModel.update as jest.Mock).mockResolvedValue({});

      const res = await AuthService.register({
        email: "redis@test.com",
        password: "Segura123!",
        passwordConfirmation: "Segura123!",
        firstName: "Redis",
        lastName: "Test",
      });
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining("session:refresh:"),
        2592000,
        "u3",
      );
      expect(res.refreshToken).toBeTruthy();
    });

    it("throws 409 when email already in use", async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        id: "existing",
      });
      await expect(
        AuthService.register({
          email: "existing@test.com",
          password: "Segura123!",
          passwordConfirmation: "Segura123!",
          firstName: "X",
          lastName: "Y",
        }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe("googleAuth", () => {
    const googlePayload = {
      sub: "google-sub-123",
      email: "google@test.com",
      given_name: "Google",
      family_name: "User",
    };

    it("signs in existing user found by googleSubjectId", async () => {
      const existingUser = {
        id: "u-google",
        email: "google@test.com",
        firstName: "Google",
        lastName: "User",
        role: "PLAYER" as const,
        googleSubjectId: "google-sub-123",
      };
      (UserModel.findByGoogleSubjectId as jest.Mock).mockResolvedValue(
        existingUser,
      );
      (UserModel.update as jest.Mock).mockResolvedValue(existingUser);

      const res = await AuthService.googleAuth(googlePayload);
      expect(res.user.email).toBe("google@test.com");
      expect(res.accessToken).toBeTruthy();
      expect(UserModel.findByGoogleSubjectId).toHaveBeenCalledWith(
        "google-sub-123",
      );
    });

    it("links googleSubjectId when email matches existing user", async () => {
      const existingUser = {
        id: "u-email",
        email: "google@test.com",
        firstName: "Existing",
        lastName: "User",
        role: "PLAYER" as const,
        googleSubjectId: null,
      };
      (UserModel.findByGoogleSubjectId as jest.Mock).mockResolvedValue(null);
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(existingUser);
      (UserModel.update as jest.Mock).mockResolvedValue({
        ...existingUser,
        googleSubjectId: "google-sub-123",
      });

      const res = await AuthService.googleAuth(googlePayload);
      expect(res.user.email).toBe("google@test.com");
      expect(UserModel.update).toHaveBeenCalledWith("u-email", {
        googleSubjectId: "google-sub-123",
        lastLoginAt: expect.any(Date),
      });
    });

    it("creates new user + player when no match found", async () => {
      (UserModel.findByGoogleSubjectId as jest.Mock).mockResolvedValue(null);
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
      const created = {
        id: "u-new-google",
        email: "google@test.com",
        firstName: "Google",
        lastName: "User",
        role: "PLAYER" as const,
        googleSubjectId: "google-sub-123",
      };
      (UserModel.create as jest.Mock).mockResolvedValue(created);
      (UserModel.update as jest.Mock).mockResolvedValue(created);

      const res = await AuthService.googleAuth(googlePayload);
      expect(res.user.role).toBe("PLAYER");
      expect(res.accessToken).toBeTruthy();
      expect(UserModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "google@test.com",
          googleSubjectId: "google-sub-123",
          role: "PLAYER",
        }),
      );
    });
  });
});
