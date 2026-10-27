import { GameService } from "../../src/services/GameService";
import { GameModel } from "../../src/models/Game";

jest.mock("../../src/models/Game");
jest.mock("../../src/config/database", () => ({
  prisma: {
    opponentTeam: {
      findUnique: jest.fn(),
    },
    gameParticipant: {
      update: jest.fn(),
    },
  },
}));
jest.mock("../../src/utils/slug", () => ({
  generateGameSlug: jest.fn().mockResolvedValue("mock-game-slug"),
}));
jest.mock("../../src/config/redis", () => ({
  getRedisClient: () => ({
    del: jest.fn().mockResolvedValue(1),
    get: jest.fn().mockResolvedValue(null),
    setex: jest.fn().mockResolvedValue("OK"),
    keys: jest.fn().mockResolvedValue([]),
  }),
  redisKeys: {
    statsCache: jest
      .fn()
      .mockImplementation((key: string) => `cache:stats:${key}`),
    session: jest.fn().mockImplementation((id: string) => `session:${id}`),
    tournamentCache: jest
      .fn()
      .mockImplementation((id: string) => `cache:tournament:${id}`),
  },
}));

import { prisma } from "../../src/config/database";

describe("GameService", () => {
  afterEach(() => jest.clearAllMocks());

  describe("getGameById", () => {
    it("adds invitedByName to each participant", async () => {
      (GameModel.findById as jest.Mock).mockResolvedValue({
        id: "g1",
        participants: [
          {
            id: "gp-1",
            player: {
              id: "guest-1",
              invitedById: "inv-1",
              invitedBy: {
                id: "inv-1",
                firstName: "Carlos",
                lastName: "Invitador",
              },
            },
          },
          {
            id: "gp-2",
            player: {
              id: "reg-1",
              invitedById: null,
              invitedBy: null,
            },
          },
        ],
      });

      const result = await GameService.getGameById("g1");

      expect(result.participants[0].invitedByName).toBe("Carlos Invitador");
      expect(result.participants[1].invitedByName).toBeNull();
    });
  });

  describe("createGame", () => {
    it("creates a game when opponentTeamId is valid", async () => {
      (prisma.opponentTeam.findUnique as jest.Mock).mockResolvedValue({
        name: "Rivals",
      });
      const mockGame = {
        id: "g1",
        opponentTeamId: "team-1",
        status: "SCHEDULED",
      };
      (GameModel.create as jest.Mock).mockResolvedValue(mockGame);
      (GameModel.findById as jest.Mock).mockResolvedValue({
        ...mockGame,
        participants: [],
      });

      const result = await GameService.createGame({
        opponentTeamId: "team-1",
        date: "2026-06-01",
        competitionType: "FRIENDLY",
      } as any);
      expect(result.id).toBe("g1");
      expect(GameModel.findById).toHaveBeenCalledWith("g1");
    });

    it("serializes invitedByName on participants in create response", async () => {
      (prisma.opponentTeam.findUnique as jest.Mock).mockResolvedValue({
        name: "Rivals",
      });

      (GameModel.create as jest.Mock).mockResolvedValue({
        id: "g2",
        opponentTeamId: "team-1",
      });

      (GameModel.findById as jest.Mock).mockResolvedValue({
        id: "g2",
        participants: [
          {
            id: "gp-1",
            player: {
              id: "guest-1",
              invitedById: "inv-1",
              invitedBy: {
                id: "inv-1",
                firstName: "Carlos",
                lastName: "Invitador",
              },
            },
          },
        ],
      });

      const result = await GameService.createGame({
        opponentTeamId: "team-1",
        date: "2026-06-01",
        competitionType: "FRIENDLY",
      } as any);

      expect(result.participants[0].invitedByName).toBe("Carlos Invitador");
      expect(result.participants[0].player.invitedByName).toBe(
        "Carlos Invitador",
      );
    });

    it("does not pre-validate opponentTeamId (FK constraint is enforced by DB)", async () => {
      // GameService.createGame passes opponentTeamId directly to Prisma via connect;
      // validation happens at the DB level, not service level.
      (GameModel.create as jest.Mock).mockRejectedValue(
        new Error("Foreign key constraint"),
      );

      await expect(
        GameService.createGame({
          opponentTeamId: "bad",
          date: "2026-06-01",
          competitionType: "FRIENDLY",
        } as any),
      ).rejects.toThrow();
    });
  });

  describe("updateGame RBAC", () => {
    it("allows editor to update metadata fields", async () => {
      (GameModel.findById as jest.Mock)
        .mockResolvedValueOnce({
          id: "g1",
          status: "SCHEDULED",
          participants: [],
        })
        .mockResolvedValueOnce({
          id: "g1",
          status: "SCHEDULED",
          playgroundId: "pg-1",
          participants: [],
        });
      (GameModel.update as jest.Mock).mockResolvedValue({
        id: "g1",
        playgroundId: "pg-1",
      });

      const result = await GameService.updateGame(
        "g1",
        { playgroundId: "pg-1" },
        "EDITOR",
      );
      expect(result.playgroundId).toBe("pg-1");
      expect(GameModel.findById).toHaveBeenCalledTimes(2);
    });

    it("throws 403 when editor tries to update score", async () => {
      (GameModel.findById as jest.Mock).mockResolvedValue({
        id: "g1",
        status: "SCHEDULED",
      });

      await expect(
        GameService.updateGame("g1", { homeTeamScore: 3 } as any, "EDITOR"),
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("allows admin to update scores", async () => {
      (GameModel.findById as jest.Mock)
        .mockResolvedValueOnce({
          id: "g1",
          status: "SCHEDULED",
          participants: [],
        })
        .mockResolvedValueOnce({
          id: "g1",
          status: "COMPLETED",
          homeTeamScore: 3,
          awayTeamScore: 1,
          participants: [],
        });
      (GameModel.update as jest.Mock).mockResolvedValue({
        id: "g1",
        homeTeamScore: 3,
        awayTeamScore: 1,
        status: "COMPLETED",
      });

      const result = await GameService.updateGame(
        "g1",
        { homeTeamScore: 3, awayTeamScore: 1, status: "COMPLETED" } as any,
        "ADMIN",
      );
      expect(result.homeTeamScore).toBe(3);
    });
  });

  describe("addParticipantToGame", () => {
    it("creates a participant relation for a player and returns the refreshed game", async () => {
      (GameModel.findById as jest.Mock).mockResolvedValue({
        id: "g1",
        participants: [],
      });
      (GameModel.update as jest.Mock).mockResolvedValue({
        id: "g1",
      });
      (GameModel.findById as jest.Mock).mockResolvedValueOnce({
        id: "g1",
        participants: [],
      });
      (GameModel.findById as jest.Mock).mockResolvedValueOnce({
        id: "g1",
        participants: [{ id: "gp-1", playerId: "p-1" }],
      });

      const result = await GameService.addParticipantToGame("g1", "p-1");

      expect(GameModel.update).toHaveBeenCalledWith(
        "g1",
        expect.objectContaining({
          participants: {
            create: expect.objectContaining({
              playerId: "p-1",
              confirmationStatus: "CONFIRMED",
            }),
          },
        }),
      );
      expect(result.participants).toHaveLength(1);
    });
  });

  describe("removeParticipantFromGame", () => {
    it("deletes the participant relation when the row id is provided", async () => {
      (GameModel.findById as jest.Mock).mockResolvedValue({
        id: "g1",
        participants: [{ id: "gp-1", playerId: "p-1" }],
      });
      (GameModel.update as jest.Mock).mockResolvedValue({ id: "g1" });
      (GameModel.findById as jest.Mock).mockResolvedValueOnce({
        id: "g1",
        participants: [{ id: "gp-1", playerId: "p-1" }],
      });
      (GameModel.findById as jest.Mock).mockResolvedValueOnce({
        id: "g1",
        participants: [],
      });

      const result = await GameService.removeParticipantFromGame("g1", "gp-1");

      expect(GameModel.update).toHaveBeenCalledWith(
        "g1",
        expect.objectContaining({
          participants: {
            deleteMany: {
              OR: [{ id: "gp-1" }, { playerId: "p-1" }],
            },
          },
        }),
      );
      expect(result.participants).toEqual([]);
    });

    it("deletes the participant relation for the selected player", async () => {
      (GameModel.findById as jest.Mock).mockResolvedValue({
        id: "g1",
        participants: [{ id: "gp-1", playerId: "p-1" }],
      });
      (GameModel.update as jest.Mock).mockResolvedValue({ id: "g1" });
      (GameModel.findById as jest.Mock).mockResolvedValueOnce({
        id: "g1",
        participants: [{ id: "gp-1", playerId: "p-1" }],
      });
      (GameModel.findById as jest.Mock).mockResolvedValueOnce({
        id: "g1",
        participants: [],
      });

      const result = await GameService.removeParticipantFromGame("g1", "p-1");

      expect(GameModel.update).toHaveBeenCalledWith(
        "g1",
        expect.objectContaining({
          participants: {
            deleteMany: {
              OR: [{ id: "p-1" }, { playerId: "p-1" }],
            },
          },
        }),
      );
      expect(result.participants).toEqual([]);
    });
  });

  describe("updateParticipantStats", () => {
    it("updates the participant stat fields and accepts alias names", async () => {
      (GameModel.findById as jest.Mock)
        .mockResolvedValueOnce({
          id: "g1",
          participants: [{ id: "gp-1", playerId: "p-1" }],
        })
        .mockResolvedValueOnce({
          id: "g1",
          participants: [
            {
              id: "gp-1",
              playerId: "p-1",
              goalsScored: 2,
              assists: 1,
              yellowCards: 0,
              redCards: 0,
            },
          ],
        });
      (prisma.gameParticipant.update as jest.Mock).mockResolvedValue({
        id: "gp-1",
        goalsScored: 2,
        assists: 1,
      });

      const result = await GameService.updateParticipantStats("g1", "gp-1", {
        goalsScored: 2,
        assists: 1,
      });

      expect(prisma.gameParticipant.update).toHaveBeenCalledWith({
        where: { id: "gp-1" },
        data: {
          goalsScored: 2,
          assists: 1,
        },
      });
      expect(result.participants[0].goalsScored).toBe(2);
      expect(result.participants[0].assists).toBe(1);
    });

    it("rejects invalid stat payloads", async () => {
      (GameModel.findById as jest.Mock).mockResolvedValue({
        id: "g1",
        participants: [{ id: "gp-1", playerId: "p-1" }],
      });

      await expect(
        GameService.updateParticipantStats("g1", "gp-1", {
          goalsScored: -1,
        }),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("searchGames", () => {
    it("returns games with pagination", async () => {
      const expected = {
        results: [{ id: "g1", status: "SCHEDULED" }],
        total: 1,
        page: 1,
        limit: 20,
        totalPages: 1,
      };
      (GameModel.findMany as jest.Mock).mockResolvedValue(expected);

      const result = await GameService.searchGames({
        status: "SCHEDULED",
      } as any);
      expect(result.results).toHaveLength(1);
      expect(GameModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ status: "SCHEDULED" }),
      );
    });
  });
});
