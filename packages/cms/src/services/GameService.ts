import { GameModel } from "../models/Game";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";
import { generateGameSlug } from "../utils/slug";
import { getRedisClient } from "../config/redis";
import { prisma } from "../config/database";
import { type Role, GameStatus } from "@prisma/client";
import {
  GameResult,
  type GameCreatePayload,
  type GameUpdatePayload,
} from "@ministrosfc/shared";

/** Elapsed milliseconds for one game (100 minutes). */
const GAME_DURATION_MS = 100 * 60 * 1000;

// Non-admin game editors are limited to metadata/tactical notes.
const NON_ADMIN_ALLOWED_FIELDS = new Set([
  "date",
  "notes",
  "tournamentId",
  "playgroundId",
  "lineup",
]);

interface SearchOptions {
  status?: GameStatus;
  result?: GameResult;
  tournamentId?: string;
  opponentTeamId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

const CACHE_TTL = 300; // 5 min

function buildInvitedByName(player: any): string | null {
  if (!player?.invitedBy) {
    return null;
  }

  return `${player.invitedBy.firstName} ${player.invitedBy.lastName}`.trim();
}

function serializeGameParticipants(game: any): any {
  if (!game || !Array.isArray(game.participants)) {
    return game;
  }

  return {
    ...game,
    participants: game.participants.map((participant: any) => {
      const invitedByName = buildInvitedByName(participant?.player);

      return {
        ...participant,
        invitedByName,
        player: participant?.player
          ? {
              ...participant.player,
              invitedByName,
            }
          : participant?.player,
      };
    }),
  };
}

const GameService = {
  async createGame(dto: GameCreatePayload) {
    const gameDate = new Date(dto.date);
    const endDate = new Date(gameDate.getTime() + GAME_DURATION_MS);

    // Fetch opponent name for slug generation
    const opponentTeam = await prisma.opponentTeam.findUnique({
      where: { id: dto.opponentTeamId },
      select: { name: true },
    });
    if (!opponentTeam) {
      throw createError(
        "Opponent team not found",
        404,
        ErrorCode.OPPONENT_NOT_FOUND,
      );
    }

    const slug = await generateGameSlug(gameDate, opponentTeam.name, prisma);

    const data: any = {
      date: gameDate,
      endDate,
      slug,
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
    if (dto.maxPlayers !== undefined) data.maxPlayers = dto.maxPlayers;
    if (dto.lineup !== undefined) data.lineup = dto.lineup;

    const game = await GameModel.create(data);
    await GameService.invalidateCache();
    return GameService.getGameById(game.id);
  },

  async getGameById(id: string) {
    const game = await GameModel.findById(id);
    if (!game)
      throw createError("Game not found", 404, ErrorCode.GAME_NOT_FOUND);
    return serializeGameParticipants(game);
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

  async updateGame(id: string, dto: GameUpdatePayload, requestingRole: Role) {
    const currentGame = await GameService.getGameById(id);

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
    if (dto.date) {
      const newDate = new Date(dto.date);
      data.date = newDate;
      data.endDate = new Date(newDate.getTime() + GAME_DURATION_MS);

      // T016: ADMIN updating date on IN_PROGRESS game to a future date → revert to SCHEDULED
      if (
        requestingRole === "ADMIN" &&
        currentGame.status === GameStatus.IN_PROGRESS &&
        newDate > new Date()
      ) {
        const result = await prisma.$transaction(async (tx) => {
          return tx.game.update({
            where: { id },
            data: {
              date: newDate,
              endDate: new Date(newDate.getTime() + GAME_DURATION_MS),
              status: GameStatus.SCHEDULED,
            },
          });
        });
        await GameService.invalidateCache();
        return result;
      }
    }
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
    if (dto.maxPlayers !== undefined) data.maxPlayers = dto.maxPlayers;
    if ("lineup" in dto) data.lineup = dto.lineup;

    const updated = await GameModel.update(id, data);

    // If result recorded, update player statistics
    if (
      dto.status === GameStatus.COMPLETED &&
      dto.homeTeamScore !== undefined &&
      dto.awayTeamScore !== undefined
    ) {
      await GameService.recalculateStats(id);
    }

    await GameService.invalidateCache();
    return GameService.getGameById(updated.id);
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
