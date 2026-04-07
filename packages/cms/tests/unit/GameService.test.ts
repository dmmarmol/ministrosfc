import { GameService } from "../../src/services/GameService";
import { GameModel } from "../../src/models/Game";
import { OpponentTeamModel } from "../../src/models/OpponentTeam";

jest.mock("../../src/models/Game");
jest.mock("../../src/models/OpponentTeam");
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

describe("GameService", () => {
  afterEach(() => jest.clearAllMocks());

  describe("createGame", () => {
    it("creates a game when opponentTeamId is valid", async () => {
      (OpponentTeamModel.findById as jest.Mock).mockResolvedValue({
        id: "team-1",
        name: "Rivals",
      });
      const mockGame = {
        id: "g1",
        opponentTeamId: "team-1",
        status: "SCHEDULED",
      };
      (GameModel.create as jest.Mock).mockResolvedValue(mockGame);

      const result = await GameService.createGame({
        opponentTeamId: "team-1",
        date: "2026-06-01",
        competitionType: "FRIENDLY",
      } as any);
      expect(result.id).toBe("g1");
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
      (GameModel.findById as jest.Mock).mockResolvedValue({
        id: "g1",
        status: "SCHEDULED",
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
      (GameModel.findById as jest.Mock).mockResolvedValue({
        id: "g1",
        status: "SCHEDULED",
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

  describe("searchGames", () => {
    it("returns games with pagination", async () => {
      const expected = {
        data: [{ id: "g1", status: "SCHEDULED" }],
        pagination: { total: 1, page: 1, limit: 20 },
      };
      (GameModel.findMany as jest.Mock).mockResolvedValue(expected);

      const result = await GameService.searchGames({
        status: "SCHEDULED",
      } as any);
      expect(result.data).toHaveLength(1);
      expect(GameModel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ status: "SCHEDULED" }),
      );
    });
  });
});
