import { ProfileService } from "../../src/services/ProfileService";

type MockPrisma = {
  user: { findUnique: jest.Mock; update: jest.Mock };
  player: {
    findFirst: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    update: jest.Mock;
  };
  contact: { upsert: jest.Mock };
  $transaction: jest.Mock;
};

jest.mock("../../src/config/database", () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    player: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
    },
    contact: {
      upsert: jest.fn(),
    },
    $transaction: jest.fn((cb: (tx: unknown) => unknown) => {
      const mod = jest.requireMock("../../src/config/database") as {
        prisma: unknown;
      };
      return cb(mod.prisma);
    }),
  },
}));

const mockPrisma = (
  jest.requireMock("../../src/config/database") as { prisma: MockPrisma }
).prisma;

jest.mock("../../src/config/redis", () => ({
  getRedisClient: () => ({
    keys: jest.fn().mockResolvedValue([]),
    del: jest.fn().mockResolvedValue(1),
  }),
}));

jest.mock("../../src/utils/object-storage", () => ({
  uploadPhoto: jest
    .fn()
    .mockResolvedValue("https://cloudinary.com/new-photo.jpg"),
  deletePlayerPhoto: jest.fn().mockResolvedValue(undefined),
  validatePhotoFile: jest.fn(),
}));

describe("ProfileService", () => {
  afterEach(() => jest.clearAllMocks());

  describe("getProfile", () => {
    it("returns user, player, contact, and invited guests", async () => {
      const mockUser = {
        id: "u1",
        email: "test@test.com",
        firstName: "Juan",
        lastName: "Pérez",
        role: "PLAYER",
        passwordHash: "$2b$12$hash",
        googleSubjectId: null,
        createdAt: new Date(),
        player: {
          id: "p1",
          firstName: "Juan",
          lastName: "Pérez",
          nickname: "Juanchi",
          position: "CMF",
          jerseyNumber: 10,
          dateOfBirth: null,
          address: null,
          photoUrl: null,
          status: "ACTIVE",
          playerType: "REGISTERED",
          contactInfo: { phone: null, whatsapp: null, emergencyContact: null },
        },
      };
      mockPrisma.user.findUnique.mockResolvedValue(mockUser);
      mockPrisma.player.findMany.mockResolvedValue([]);

      const result = await ProfileService.getProfile("u1");

      expect(result.user.email).toBe("test@test.com");
      expect(result.user.hasPassword).toBe(true);
      expect(result.user.hasGoogle).toBe(false);
      expect(result.player.firstName).toBe("Juan");
      expect(result.invitedGuests).toEqual([]);
    });
  });

  describe("updateProfile", () => {
    const fullMockUser = {
      id: "u1",
      email: "test@test.com",
      firstName: "Carlos",
      lastName: "Pérez",
      role: "PLAYER",
      passwordHash: null,
      googleSubjectId: null,
      createdAt: new Date(),
      player: {
        id: "p1",
        firstName: "Carlos",
        lastName: "Pérez",
        nickname: null,
        position: null,
        jerseyNumber: null,
        dateOfBirth: null,
        address: null,
        photoUrl: null,
        status: "ACTIVE",
        playerType: "REGISTERED",
        contactInfo: null,
      },
    };

    it("updates user and player fields in transaction", async () => {
      mockPrisma.user.update.mockResolvedValue({
        id: "u1",
        firstName: "Carlos",
        lastName: "Pérez",
      });
      mockPrisma.player.update.mockResolvedValue({
        id: "p1",
        firstName: "Carlos",
        lastName: "Pérez",
      });
      mockPrisma.contact.upsert.mockResolvedValue({});
      // First call: inside transaction (needs id+playerId+player)
      // Second call: inside getProfile after transaction (needs full user)
      mockPrisma.user.findUnique
        .mockResolvedValueOnce({ id: "u1", playerId: "p1", player: { id: "p1" } })
        .mockResolvedValueOnce(fullMockUser);
      mockPrisma.player.findFirst.mockResolvedValue(null); // no jersey conflict
      mockPrisma.player.findMany.mockResolvedValue([]); // no invited guests

      mockPrisma.$transaction.mockImplementation(async (cb: any) =>
        cb(mockPrisma),
      );

      await ProfileService.updateProfile("u1", { firstName: "Carlos" });

      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it("validates jersey uniqueness and throws 409 on conflict", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "u1",
        playerId: "p1",
        player: { id: "p1" },
      });
      mockPrisma.player.findFirst.mockResolvedValue({
        id: "p-other",
        jerseyNumber: 10,
      });

      mockPrisma.$transaction.mockImplementation(async (cb: any) =>
        cb(mockPrisma),
      );

      await expect(
        ProfileService.updateProfile("u1", { jerseyNumber: 10 }),
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe("updatePhoto", () => {
    it("uploads photo and updates player record", async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: "u1",
        playerId: "p1",
        player: { id: "p1", photoUrl: null },
      });
      mockPrisma.player.update.mockResolvedValue({
        photoUrl: "https://cloudinary.com/new-photo.jpg",
      });

      const file = {
        buffer: Buffer.from("fake"),
        mimetype: "image/jpeg",
        originalname: "photo.jpg",
        size: 1000,
      };

      const result = await ProfileService.updatePhoto("u1", file);
      expect(result.photoUrl).toBe("https://cloudinary.com/new-photo.jpg");
    });
  });
});
