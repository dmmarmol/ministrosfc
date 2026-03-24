import { AuthService } from "../../src/services/AuthService";
import { UserModel } from "../../src/models/User";
import jwt from "jsonwebtoken";

// Mock Redis to avoid needing a running Redis in unit tests
jest.mock("../../src/config/redis", () => ({
  getRedisClient: () => ({
    setex: jest.fn().mockResolvedValue("OK"),
    get: jest.fn().mockResolvedValue(null),
    del: jest.fn().mockResolvedValue(1),
  }),
}));

jest.mock("../../src/models/User");

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
        name: "Admin",
        role: "ADMIN" as const,
        passwordHash: "hashed",
      };
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(mockUser);
      (UserModel.verifyPassword as jest.Mock).mockResolvedValue(true);
      (UserModel.update as jest.Mock).mockResolvedValue(mockUser);

      const res = await AuthService.login("admin@test.com", "correct");
      expect(res.accessToken).toBeTruthy();
      expect(res.user.email).toBe("admin@test.com");
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
    it("creates a PLAYER role user by default", async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue(null);
      const created = {
        id: "u2",
        email: "new@test.com",
        name: "New",
        role: "PLAYER" as const,
      };
      (UserModel.create as jest.Mock).mockResolvedValue(created);

      const res = await AuthService.register({
        email: "new@test.com",
        password: "pass123",
        name: "New",
      });
      expect(res.user.role).toBe("PLAYER");
      expect((UserModel.create as jest.Mock).mock.calls[0][0].role).toBe(
        "PLAYER",
      );
    });

    it("throws 409 when email already in use", async () => {
      (UserModel.findByEmail as jest.Mock).mockResolvedValue({
        id: "existing",
      });
      await expect(
        AuthService.register({
          email: "existing@test.com",
          password: "pw",
          name: "X",
        }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });
});
