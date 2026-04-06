import { OnboardingService } from "../../src/services/OnboardingService";
import { UserModel } from "../../src/models/User";

const mockPlayerFindFirst = jest.fn();
const mockPlayerCreate = jest.fn();

jest.mock("../../src/config/database", () => ({
  prisma: {
    player: {
      get findFirst() {
        return mockPlayerFindFirst;
      },
      get create() {
        return mockPlayerCreate;
      },
    },
  },
}));

jest.mock("../../src/models/User");

describe("OnboardingService", () => {
  afterEach(() => jest.clearAllMocks());

  describe("getStatus", () => {
    it("returns needsOnboarding=true when onboardingCompletedAt is null", async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        id: "u1",
        onboardingCompletedAt: null,
      });

      const result = await OnboardingService.getStatus("u1");
      expect(result.needsOnboarding).toBe(true);
    });

    it("returns needsOnboarding=false when onboardingCompletedAt is set", async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue({
        id: "u1",
        onboardingCompletedAt: new Date("2026-01-01"),
      });

      const result = await OnboardingService.getStatus("u1");
      expect(result.needsOnboarding).toBe(false);
    });

    it("throws 404 when user not found", async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        OnboardingService.getStatus("nonexistent"),
      ).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("complete", () => {
    const baseUser = {
      id: "u1",
      email: "user@test.com",
      firstName: "Juan",
      lastName: "Pérez",
      role: "PLAYER" as const,
      playerId: null,
      onboardingCompletedAt: null,
    };

    it("creates Player and links to User when isPlayer=true", async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(baseUser);
      mockPlayerFindFirst.mockResolvedValue(null); // no jersey conflict
      mockPlayerCreate.mockResolvedValue({
        id: "p1",
        firstName: "Juan",
        lastName: "Pérez",
      });
      (UserModel.update as jest.Mock).mockResolvedValue({
        ...baseUser,
        playerId: "p1",
        onboardingCompletedAt: new Date(),
      });

      const result = await OnboardingService.complete("u1", {
        isPlayer: true,
        position: "CMF" as any,
        jerseyNumber: 10,
      });

      expect(result.user.playerId).toBe("p1");
      expect(result.user.onboardingCompletedAt).toBeTruthy();
      expect(result.nextStep).toBe("/profile");
      expect(mockPlayerCreate).toHaveBeenCalled();
    });

    it("leaves playerId null when isPlayer=false", async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(baseUser);
      (UserModel.update as jest.Mock).mockResolvedValue({
        ...baseUser,
        onboardingCompletedAt: new Date(),
      });

      const result = await OnboardingService.complete("u1", {
        isPlayer: false,
      });

      expect(result.user.playerId).toBeNull();
      expect(result.user.onboardingCompletedAt).toBeTruthy();
      expect(mockPlayerCreate).not.toHaveBeenCalled();
    });

    it("throws 409 when jersey number is taken", async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(baseUser);
      mockPlayerFindFirst.mockResolvedValue({ id: "existing" });

      await expect(
        OnboardingService.complete("u1", {
          isPlayer: true,
          position: "CF" as any,
          jerseyNumber: 10,
        }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("is idempotent for already-completed onboarding", async () => {
      const completedUser = {
        ...baseUser,
        playerId: "p1",
        onboardingCompletedAt: new Date("2026-01-01"),
      };
      (UserModel.findById as jest.Mock).mockResolvedValue(completedUser);

      const result = await OnboardingService.complete("u1", {
        isPlayer: true,
        position: "GK" as any,
      });

      expect(result.user.playerId).toBe("p1");
      expect(result.nextStep).toBe("/profile");
      expect(mockPlayerCreate).not.toHaveBeenCalled();
      expect(UserModel.update).not.toHaveBeenCalled();
    });

    it("throws 404 when user not found", async () => {
      (UserModel.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        OnboardingService.complete("nonexistent", { isPlayer: false }),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
