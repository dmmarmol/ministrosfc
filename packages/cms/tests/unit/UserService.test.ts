import { UserService } from "../../src/services/UserService";

// Mock dependencies
jest.mock("../../src/config/database", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    player: {
      update: jest.fn(),
      delete: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

jest.mock("../../src/config/redis", () => ({
  getRedisClient: () => ({
    del: jest.fn(),
    keys: jest.fn().mockResolvedValue([]),
  }),
  redisKeys: {},
}));

import { prisma } from "../../src/config/database";

const mockPrisma = prisma as any;

describe("UserService — role management", () => {
  beforeEach(() => jest.resetAllMocks());

  describe("changeRole", () => {
    it("promotes PLAYER to DT", async () => {
      const target = {
        id: "target-1",
        email: "p@test.com",
        firstName: "Juan",
        lastName: "Pérez",
        role: "PLAYER",
        passwordHash: null,
      };
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({
          id: "admin-1",
          role: "ADMIN",
        }) // caller
        .mockResolvedValueOnce(target); // target
      mockPrisma.user.update.mockResolvedValue({ ...target, role: "DT" });

      const result = await UserService.changeRole("admin-1", "target-1", "DT");

      expect(result.role).toBe("DT");
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "target-1" },
        data: { role: "DT" },
      });
    });

    it("rejects changing another ADMIN's role", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: "admin-1", role: "ADMIN" })
        .mockResolvedValueOnce({ id: "admin-2", role: "ADMIN" });

      await expect(
        UserService.changeRole("admin-1", "admin-2", "PLAYER"),
      ).rejects.toThrow();
    });

    it("rejects changing own role", async () => {
      mockPrisma.user.findUnique.mockResolvedValueOnce({
        id: "admin-1",
        role: "ADMIN",
      });

      await expect(
        UserService.changeRole("admin-1", "admin-1", "PLAYER"),
      ).rejects.toThrow();
    });

    it("throws 404 when target not found", async () => {
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: "admin-1", role: "ADMIN" })
        .mockResolvedValueOnce(null);

      await expect(
        UserService.changeRole("admin-1", "missing-id", "DT"),
      ).rejects.toThrow();
    });
  });

  describe("updatePlayerStatus", () => {
    it("deactivates a player", async () => {
      const user = {
        id: "u-1",
        email: "x@test.com",
        firstName: "X",
        lastName: "Y",
        role: "PLAYER",
        playerId: "p-1",
        player: { id: "p-1", status: "ACTIVE" },
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.player.update.mockResolvedValue({
        id: "p-1",
        status: "INACTIVE",
      });

      const result = await UserService.updatePlayerStatus("u-1", "INACTIVE");

      expect(result.status).toBe("INACTIVE");
      expect(mockPrisma.player.update).toHaveBeenCalledWith({
        where: { id: "p-1" },
        data: { status: "INACTIVE" },
      });
    });

    it("throws 404 when user has no player", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "u-1",
        playerId: null,
        player: null,
      });

      await expect(
        UserService.updatePlayerStatus("u-1", "INACTIVE"),
      ).rejects.toThrow();
    });
  });

  describe("deletePlayer", () => {
    it("hard-deletes player and unlinks from user", async () => {
      const user = {
        id: "u-1",
        playerId: "p-1",
        player: { id: "p-1" },
      };
      mockPrisma.user.findUnique.mockResolvedValue(user);
      mockPrisma.player.delete.mockResolvedValue({ id: "p-1" });
      mockPrisma.user.update.mockResolvedValue({ ...user, playerId: null });

      await UserService.deletePlayer("u-1");

      expect(mockPrisma.player.delete).toHaveBeenCalledWith({
        where: { id: "p-1" },
      });
      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "u-1" },
        data: { player: { disconnect: true } },
      });
    });

    it("throws 404 when user has no player", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "u-1",
        playerId: null,
        player: null,
      });

      await expect(UserService.deletePlayer("u-1")).rejects.toThrow();
    });
  });
});
