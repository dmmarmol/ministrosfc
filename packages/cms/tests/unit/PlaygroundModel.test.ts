import { PlaygroundModel } from "../../src/models/Playground";

// Mock Prisma client
jest.mock("../../src/config/database", () => ({
  prisma: {
    playground: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    game: {
      count: jest.fn(),
    },
  },
}));

import { prisma } from "../../src/config/database";

describe("PlaygroundModel", () => {
  afterEach(() => jest.clearAllMocks());

  describe("findAll", () => {
    it("returns records with gameCount mapped from _count.games", async () => {
      const mockRecord = {
        id: "pg-1",
        name: "Cancha Norte",
        address: "Av. 1234",
        latitude: -34.6,
        longitude: -58.3,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: "user-1",
        updatedById: null,
        _count: { games: 3 },
      };
      (prisma.playground.findMany as jest.Mock).mockResolvedValue([mockRecord]);

      const result = await PlaygroundModel.findAll();

      expect(result).toHaveLength(1);
      expect(result[0]!.gameCount).toBe(3);
      expect(result[0]).not.toHaveProperty("_count");
    });
  });

  describe("findById", () => {
    it("returns a single record with gameCount", async () => {
      const mockRecord = {
        id: "pg-1",
        name: "Cancha Norte",
        address: "Av. 1234",
        latitude: -34.6,
        longitude: -58.3,
        createdAt: new Date(),
        updatedAt: new Date(),
        createdById: "user-1",
        updatedById: null,
        _count: { games: 2 },
      };
      (prisma.playground.findUnique as jest.Mock).mockResolvedValue(mockRecord);

      const result = await PlaygroundModel.findById("pg-1");

      expect(result?.id).toBe("pg-1");
      expect(result?.gameCount).toBe(2);
    });

    it("returns null when record does not exist", async () => {
      (prisma.playground.findUnique as jest.Mock).mockResolvedValue(null);
      const result = await PlaygroundModel.findById("non-existent");
      expect(result).toBeNull();
    });
  });

  describe("create", () => {
    it("calls prisma.playground.create with the correct payload", async () => {
      const payload = {
        name: "Cancha Sur",
        address: "Av. Sur 99",
        latitude: -34.7,
        longitude: -58.4,
        createdBy: { connect: { id: "user-1" } },
      };
      const mockCreated = { id: "pg-2", ...payload, createdAt: new Date(), updatedAt: new Date(), updatedById: null };
      (prisma.playground.create as jest.Mock).mockResolvedValue({ ...mockCreated, _count: { games: 0 } });

      await PlaygroundModel.create(payload as any);

      expect(prisma.playground.create).toHaveBeenCalledWith(
        expect.objectContaining({ data: payload }),
      );
    });
  });

  describe("update", () => {
    it("applies a partial update to the correct record", async () => {
      (prisma.playground.update as jest.Mock).mockResolvedValue({
        id: "pg-1", name: "Updated", address: "Av. 1234", latitude: -34.6, longitude: -58.3,
        createdAt: new Date(), updatedAt: new Date(), createdById: "u1", updatedById: "u2",
        _count: { games: 0 },
      });

      await PlaygroundModel.update("pg-1", { name: "Updated" } as any);

      expect(prisma.playground.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: "pg-1" } }),
      );
    });
  });

  describe("delete", () => {
    it("calls prisma.playground.delete with the correct id", async () => {
      (prisma.playground.delete as jest.Mock).mockResolvedValue({ id: "pg-1" });

      await PlaygroundModel.delete("pg-1");

      expect(prisma.playground.delete).toHaveBeenCalledWith({ where: { id: "pg-1" } });
    });
  });

  describe("countGames", () => {
    it("returns the game count for a given playground id", async () => {
      (prisma.game.count as jest.Mock).mockResolvedValue(5);

      const count = await PlaygroundModel.countGames("pg-1");

      expect(count).toBe(5);
      expect(prisma.game.count).toHaveBeenCalledWith({ where: { playgroundId: "pg-1" } });
    });
  });
});
