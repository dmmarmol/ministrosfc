import { StatisticsService } from "../../src/services/StatisticsService";

// --- Mocks ---
jest.mock("../../src/models/Statistics");
jest.mock("../../src/models/Tournament");
jest.mock("../../src/models/Player");
jest.mock("../../src/config/redis");

import { StatisticsModel } from "../../src/models/Statistics";
import { TournamentModel } from "../../src/models/Tournament";
import { PlayerModel } from "../../src/models/Player";
import { getRedisClient } from "../../src/config/redis";

const mockRedis = {
  get: jest.fn().mockResolvedValue(null),
  setex: jest.fn().mockResolvedValue("OK"),
  del: jest.fn().mockResolvedValue(1),
  keys: jest.fn().mockResolvedValue([]),
};

(getRedisClient as jest.Mock).mockReturnValue(mockRedis);

const MockStatisticsModel = StatisticsModel as jest.Mocked<
  typeof StatisticsModel
>;
const MockTournamentModel = TournamentModel as jest.Mocked<
  typeof TournamentModel
>;
const MockPlayerModel = PlayerModel as jest.Mocked<typeof PlayerModel>;

const mockPlayer = {
  id: "player-1",
  firstName: "Test",
  lastName: "Player",
  nickname: null,
  jerseyNumber: 10,
  position: "STRIKER" as const,
  photoUrl: null,
  userId: null,
  status: "ACTIVE" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockTournament = {
  id: "tournament-1",
  name: "Copa Test",
  format: "LEAGUE" as const,
  status: "COMPLETED" as const,
  startDate: new Date("2024-01-01"),
  endDate: new Date("2024-06-01"),
  createdAt: new Date(),
  updatedAt: new Date(),
};

beforeEach(() => {
  jest.clearAllMocks();
  mockRedis.get.mockResolvedValue(null);
  mockRedis.setex.mockResolvedValue("OK");
  mockRedis.del.mockResolvedValue(1);
  mockRedis.keys.mockResolvedValue([]);
  (getRedisClient as jest.Mock).mockReturnValue(mockRedis);
});

describe("StatisticsService", () => {
  describe("getPlayerStats", () => {
    it("returns player with aggregated stats", async () => {
      MockPlayerModel.findById.mockResolvedValue(mockPlayer as any);
      const aggregated = {
        appearances: 10,
        goalsScored: 7,
        assists: 3,
        yellowCards: 1,
        redCards: 0,
        totalMinutes: 850,
      };
      MockStatisticsModel.aggregateForPlayer.mockResolvedValue(
        aggregated as any,
      );

      const result = await StatisticsService.getPlayerStats("player-1");

      expect(result.player).toEqual(mockPlayer);
      expect(result.stats).toEqual(aggregated);
      expect(MockStatisticsModel.aggregateForPlayer).toHaveBeenCalledWith(
        "player-1",
        undefined,
      );
    });

    it("filters by tournament when tournamentId is provided", async () => {
      MockPlayerModel.findById.mockResolvedValue(mockPlayer as any);
      const aggregated = {
        appearances: 4,
        goalsScored: 3,
        assists: 1,
        yellowCards: 0,
        redCards: 0,
        totalMinutes: 360,
      };
      MockStatisticsModel.aggregateForPlayer.mockResolvedValue(
        aggregated as any,
      );

      const result = await StatisticsService.getPlayerStats(
        "player-1",
        "tournament-1",
      );

      expect(result.stats.appearances).toBe(4);
      expect(MockStatisticsModel.aggregateForPlayer).toHaveBeenCalledWith(
        "player-1",
        "tournament-1",
      );
    });

    it("throws 404 when player not found", async () => {
      MockPlayerModel.findById.mockResolvedValue(null);

      await expect(
        StatisticsService.getPlayerStats("nonexistent"),
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("returns cached results on second call", async () => {
      MockPlayerModel.findById.mockResolvedValue(mockPlayer as any);
      const aggregated = {
        appearances: 5,
        goalsScored: 2,
        assists: 1,
        yellowCards: 0,
        redCards: 0,
        totalMinutes: 450,
      };
      MockStatisticsModel.aggregateForPlayer.mockResolvedValue(
        aggregated as any,
      );

      // First call — cache miss
      await StatisticsService.getPlayerStats("player-1");

      // Simulate cache hit
      mockRedis.get.mockResolvedValue(JSON.stringify(aggregated));
      await StatisticsService.getPlayerStats("player-1");

      // aggregateForPlayer should only have been called once (cache hit on second)
      expect(MockStatisticsModel.aggregateForPlayer).toHaveBeenCalledTimes(1);
    });
  });

  describe("getTopScorers", () => {
    it("returns top scorers sorted by goals", async () => {
      const topScorers = [
        {
          player: {
            id: "p1",
            firstName: "Top",
            lastName: "Scorer",
            nickname: null,
            jerseyNumber: 9,
            position: "STRIKER",
            photoUrl: null,
          },
          appearances: 12,
          goalsScored: 15,
          assists: 3,
        },
        {
          player: {
            id: "p2",
            firstName: "Second",
            lastName: "Scorer",
            nickname: null,
            jerseyNumber: 10,
            position: "CMF",
            photoUrl: null,
          },
          appearances: 10,
          goalsScored: 9,
          assists: 7,
        },
      ];
      MockStatisticsModel.getTopScorers.mockResolvedValue(topScorers as any);

      const result = await StatisticsService.getTopScorers();

      expect(result).toEqual(topScorers);
      expect(MockStatisticsModel.getTopScorers).toHaveBeenCalledWith(
        undefined,
        10,
      );
    });

    it("passes tournamentId and limit to the model", async () => {
      MockStatisticsModel.getTopScorers.mockResolvedValue([] as any);

      await StatisticsService.getTopScorers("tournament-1", 5);

      expect(MockStatisticsModel.getTopScorers).toHaveBeenCalledWith(
        "tournament-1",
        5,
      );
    });
  });

  describe("getTournamentStats", () => {
    it("returns tournament with record and player stats", async () => {
      MockTournamentModel.findById.mockResolvedValue(mockTournament as any);
      const record = {
        wins: 8,
        draws: 2,
        losses: 2,
        goalsFor: 24,
        goalsAgainst: 12,
      };
      const playerStats = [
        {
          player: {
            id: "p1",
            firstName: "Test",
            lastName: "Player",
            nickname: null,
            jerseyNumber: 10,
            position: "STRIKER",
          },
          appearances: 12,
          goalsScored: 10,
          assists: 5,
          yellowCards: 1,
          redCards: 0,
        },
      ];
      MockTournamentModel.calculateMinistrosRecord.mockResolvedValue(
        record as any,
      );
      MockStatisticsModel.aggregateForTournament.mockResolvedValue(
        playerStats as any,
      );

      const result = await StatisticsService.getTournamentStats("tournament-1");

      expect(result.tournament).toEqual(mockTournament);
      expect(result.ministrosRecord).toEqual(record);
      expect(result.playerStats).toEqual(playerStats);
    });

    it("throws 404 when tournament not found", async () => {
      MockTournamentModel.findById.mockResolvedValue(null);

      await expect(
        StatisticsService.getTournamentStats("nonexistent"),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("invalidateCacheFor", () => {
    it("deletes topscorers keys", async () => {
      mockRedis.keys.mockResolvedValue(["cache:stats:topscorers:all:10"]);

      await StatisticsService.invalidateCacheFor();

      expect(mockRedis.keys).toHaveBeenCalledWith("cache:stats:topscorers:*");
      expect(mockRedis.del).toHaveBeenCalledWith(
        "cache:stats:topscorers:all:10",
      );
    });

    it("deletes player and tournament keys when IDs provided", async () => {
      mockRedis.keys
        .mockResolvedValueOnce(["cache:stats:topscorers:all:10"])
        .mockResolvedValueOnce(["cache:stats:player:p1:all"])
        .mockResolvedValueOnce(["cache:stats:tournament:t1:record"]);

      await StatisticsService.invalidateCacheFor("p1", "t1");

      expect(mockRedis.keys).toHaveBeenCalledTimes(3);
    });
  });
});
