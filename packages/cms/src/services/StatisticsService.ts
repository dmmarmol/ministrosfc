import { StatisticsModel } from "../models/Statistics";
import { TournamentModel } from "../models/Tournament";
import { PlayerModel } from "../models/Player";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";
import { getRedisClient } from "../config/redis";

const CACHE_TTL = 300; // 5 min

async function withCache<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const redis = getRedisClient();
  try {
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached) as T;
  } catch {
    /* cache miss */
  }
  const result = await fn();
  try {
    await redis.setex(key, CACHE_TTL, JSON.stringify(result));
  } catch {
    /* non-fatal */
  }
  return result;
}

const StatisticsService = {
  async getPlayerStats(playerId: string, tournamentId?: string) {
    const player = await PlayerModel.findById(playerId);
    if (!player)
      throw createError("Player not found", 404, ErrorCode.PLAYER_NOT_FOUND);

    const cacheKey = `cache:stats:player:${playerId}:${tournamentId ?? "all"}`;
    const stats = await withCache(cacheKey, () =>
      StatisticsModel.aggregateForPlayer(playerId, tournamentId),
    );
    return { player, stats };
  },

  async getTopScorers(tournamentId?: string, limit = 10) {
    const cacheKey = `cache:stats:topscorers:${tournamentId ?? "all"}:${limit}`;
    return withCache(cacheKey, () =>
      StatisticsModel.getTopScorers(tournamentId, limit),
    );
  },

  async getTournamentStats(tournamentId: string) {
    const tournament = await TournamentModel.findById(tournamentId);
    if (!tournament)
      throw createError(
        "Tournament not found",
        404,
        ErrorCode.TOURNAMENT_NOT_FOUND,
      );

    const cacheKey = `cache:stats:tournament:${tournamentId}`;
    const [record, playerStats] = await Promise.all([
      withCache(`${cacheKey}:record`, () =>
        TournamentModel.calculateMinistrosRecord(tournamentId),
      ),
      withCache(`${cacheKey}:players`, () =>
        StatisticsModel.aggregateForTournament(tournamentId),
      ),
    ]);

    return { tournament, ministrosRecord: record, playerStats };
  },

  async invalidateCacheFor(playerId?: string, tournamentId?: string) {
    const redis = getRedisClient();
    try {
      const patterns: string[] = ["cache:stats:topscorers:*"];
      if (playerId) patterns.push(`cache:stats:player:${playerId}:*`);
      if (tournamentId)
        patterns.push(`cache:stats:tournament:${tournamentId}*`);

      for (const pattern of patterns) {
        const keys = await redis.keys(pattern);
        if (keys.length > 0) await redis.del(...keys);
      }
    } catch {
      /* non-fatal */
    }
  },
};

export { StatisticsService };
