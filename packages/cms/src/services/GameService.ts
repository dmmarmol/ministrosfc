import { GameModel } from "../models/Game";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";
import { getRedisClient } from "../config/redis";
import type { GameStatus, Role } from "@prisma/client";

// Non-admin game editors are limited to metadata/tactical notes.
const NON_ADMIN_ALLOWED_FIELDS = new Set([
  "date",
  "notes",
  "tournamentId",
  "playgroundId",
]);

interface GameCreateDTO {
  date: string;
  location?: string;
  notes?: string;
  opponentTeamId: string;
  tournamentId?: string;
  competitionType?: string;
  playgroundId?: string | null;
}

interface GameUpdateDTO {
  date?: string;
  location?: string;
  notes?: string;
  opponentTeamId?: string;
  tournamentId?: string;
  competitionType?: string;
  status?: GameStatus;
  homeTeamScore?: number;
  awayTeamScore?: number;
  playgroundId?: string | null;
}

interface SearchOptions {
  status?: GameStatus;
  tournamentId?: string;
  opponentTeamId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

const CACHE_TTL = 300; // 5 min

const GameService = {
  async createGame(dto: GameCreateDTO) {
    const data: any = {
      date: new Date(dto.date),
      location: dto.location,
      notes: dto.notes,
      opponentTeam: { connect: { id: dto.opponentTeamId } },
    };
    if (dto.tournamentId)
      data.tournament = { connect: { id: dto.tournamentId } };
    if (dto.competitionType) data.competitionType = dto.competitionType;
    if (dto.playgroundId !== undefined) {
      data.playground = dto.playgroundId
        ? { connect: { id: dto.playgroundId } }
        : { disconnect: true };
    }

    const game = await GameModel.create(data);
    await GameService.invalidateCache();
    return game;
  },

  async getGameById(id: string) {
    const game = await GameModel.findById(id);
    if (!game)
      throw createError("Game not found", 404, ErrorCode.GAME_NOT_FOUND);
    return game;
  },

  async searchGames(options: SearchOptions = {}) {
    const cacheKey = `cache:games:list:${JSON.stringify(options)}`;
    const redis = getRedisClient();

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch {
      // cache miss — continue
    }

    const result = await GameModel.findMany(options);

    try {
      await redis.setex(cacheKey, CACHE_TTL, JSON.stringify(result));
    } catch {
      // non-fatal
    }

    return result;
  },

  async updateGame(id: string, dto: GameUpdateDTO, requestingRole: Role) {
    await GameService.getGameById(id);

    // DT and EDITOR roles share the non-admin restrictions.
    if (requestingRole === "EDITOR" || requestingRole === "DT") {
      const disallowedFields = Object.keys(dto).filter(
        (k) => !NON_ADMIN_ALLOWED_FIELDS.has(k),
      );
      if (disallowedFields.length > 0) {
        throw createError(
          `Non-admin game editors cannot update fields: ${disallowedFields.join(", ")}`,
          403,
          ErrorCode.FORBIDDEN,
        );
      }
    }

    const data: any = {};
    if (dto.date) data.date = new Date(dto.date);
    // NOTE: 'location' is intentionally excluded from update payloads (legacy field,
    // superseded by playgroundId). Any location value in the DTO is silently dropped.
    if ("notes" in dto) data.notes = dto.notes;
    if (dto.status) data.status = dto.status;
    if (dto.competitionType) data.competitionType = dto.competitionType;
    if (dto.homeTeamScore !== undefined) data.homeTeamScore = dto.homeTeamScore;
    if (dto.awayTeamScore !== undefined) data.awayTeamScore = dto.awayTeamScore;
    if (dto.opponentTeamId)
      data.opponentTeam = { connect: { id: dto.opponentTeamId } };
    if (dto.tournamentId)
      data.tournament = { connect: { id: dto.tournamentId } };
    if (dto.playgroundId !== undefined) {
      data.playground = dto.playgroundId
        ? { connect: { id: dto.playgroundId } }
        : { disconnect: true };
    }

    const updated = await GameModel.update(id, data);

    // If result recorded, update player statistics
    if (
      dto.status === "COMPLETED" &&
      dto.homeTeamScore !== undefined &&
      dto.awayTeamScore !== undefined
    ) {
      await GameService.recalculateStats(id);
    }

    await GameService.invalidateCache();
    return updated;
  },

  async deleteGame(id: string) {
    await GameService.getGameById(id);
    const result = await GameModel.delete(id);
    await GameService.invalidateCache();
    return result;
  },

  async recalculateStats(_gameId: string) {
    // placeholder — full aggregation handled in Phase 2B
  },

  async invalidateCache() {
    const redis = getRedisClient();
    try {
      const keys = await redis.keys("cache:games:*");
      if (keys.length > 0) await redis.del(...keys);
    } catch {
      // non-fatal
    }
  },
};

export { GameService };
