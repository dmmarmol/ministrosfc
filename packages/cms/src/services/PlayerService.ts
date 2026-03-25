import { PlayerModel, type PlayerFilters } from "../models/Player";
import {
  uploadPlayerPhoto,
  deletePlayerPhoto,
  type UploadedFile,
} from "../utils/object-storage";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";
import { PlayerType, PlayerStatus } from "@prisma/client";
import { getRedisClient, redisKeys } from "../config/redis";
import { logger } from "../utils/logger";

const CACHE_TTL_SECONDS = 600; // 10 minutes

export const PlayerService = {
  async createPlayer(
    dto: {
      name: string;
      nickname?: string;
      playerType?: PlayerType;
      position?: string;
      jerseyNumber?: number;
      dateOfBirth?: string;
      height?: number;
      dominantFoot?: string;
      nationalId?: string;
      invitedById?: string;
      contact?: {
        phone?: string;
        whatsapp?: string;
        emergencyContact?: string;
      };
    },
    photoFile?: UploadedFile,
  ) {
    const playerType = dto.playerType ?? PlayerType.REGISTERED;

    // Validate jersey uniqueness for REGISTERED players
    if (playerType === PlayerType.REGISTERED && dto.jerseyNumber != null) {
      const taken = await PlayerModel.isJerseyNumberTaken(dto.jerseyNumber);
      if (taken) {
        throw createError(
          `Jersey number ${dto.jerseyNumber} is already taken by an active registered player`,
          409,
          ErrorCode.DUPLICATE_JERSEY_NUMBER,
        );
      }
    }

    let photoUrl: string | undefined;
    const tempId = crypto.randomUUID();

    if (photoFile) {
      photoUrl = await uploadPlayerPhoto(photoFile, tempId);
    }

    const player = await PlayerModel.create({
      name: dto.name,
      nickname: dto.nickname,
      playerType,
      status: PlayerStatus.ACTIVE,
      position: dto.position as never,
      jerseyNumber: dto.jerseyNumber,
      dateOfBirth: dto.dateOfBirth,
      height: dto.height,
      dominantFoot: dto.dominantFoot as never,
      nationalId: dto.nationalId,
      photoUrl,
      ...(dto.invitedById
        ? { invitedBy: { connect: { id: dto.invitedById } } }
        : {}),
      ...(dto.contact
        ? {
            contactInfo: {
              create: {
                phone: dto.contact.phone,
                whatsapp: dto.contact.whatsapp,
                emergencyContact: dto.contact.emergencyContact,
              },
            },
          }
        : {}),
    });

    // If photo was uploaded with temp id, update with real player id
    if (photoFile && photoUrl) {
      const realPhotoUrl = await uploadPlayerPhoto(photoFile, player.id);
      await PlayerModel.update(player.id, { photoUrl: realPhotoUrl });
      // Best-effort delete old temp photo
      deletePlayerPhoto(photoUrl).catch(() => {});
      player.photoUrl = realPhotoUrl;
    }

    await PlayerService.invalidateCache();
    return player;
  },

  async updatePlayer(
    id: string,
    dto: {
      name?: string;
      nickname?: string;
      position?: string;
      jerseyNumber?: number;
      dateOfBirth?: string;
      height?: number;
      dominantFoot?: string;
      nationalId?: string;
      contact?: {
        phone?: string;
        whatsapp?: string;
        emergencyContact?: string;
      };
    },
    photoFile?: UploadedFile,
  ) {
    const existing = await PlayerModel.findById(id);
    if (!existing) {
      throw createError("Player not found", 404, ErrorCode.PLAYER_NOT_FOUND);
    }

    // Validate jersey uniqueness if changing jersey number
    if (
      dto.jerseyNumber != null &&
      dto.jerseyNumber !== existing.jerseyNumber
    ) {
      if (
        existing.playerType === PlayerType.REGISTERED &&
        existing.status === PlayerStatus.ACTIVE
      ) {
        const taken = await PlayerModel.isJerseyNumberTaken(
          dto.jerseyNumber,
          id,
        );
        if (taken) {
          throw createError(
            `Jersey number ${dto.jerseyNumber} is already taken by an active registered player`,
            409,
            ErrorCode.DUPLICATE_JERSEY_NUMBER,
          );
        }
      }
    }

    let photoUrl: string | undefined;
    if (photoFile) {
      photoUrl = await uploadPlayerPhoto(photoFile, id);
      // Delete old photo if exists
      if (existing.photoUrl) {
        deletePlayerPhoto(existing.photoUrl).catch(() => {});
      }
    }

    const updated = await PlayerModel.update(id, {
      ...(dto.name ? { name: dto.name } : {}),
      ...(dto.nickname !== undefined ? { nickname: dto.nickname } : {}),
      ...(dto.position ? { position: dto.position as never } : {}),
      ...(dto.jerseyNumber !== undefined
        ? { jerseyNumber: dto.jerseyNumber }
        : {}),
      ...(dto.dateOfBirth !== undefined
        ? { dateOfBirth: dto.dateOfBirth }
        : {}),
      ...(dto.height !== undefined ? { height: dto.height } : {}),
      ...(dto.dominantFoot ? { dominantFoot: dto.dominantFoot as never } : {}),
      ...(dto.nationalId !== undefined ? { nationalId: dto.nationalId } : {}),
      ...(photoUrl ? { photoUrl } : {}),
      ...(dto.contact
        ? {
            contactInfo: {
              upsert: {
                create: dto.contact,
                update: dto.contact,
              },
            },
          }
        : {}),
    });

    await PlayerService.invalidateCache();
    return updated;
  },

  async deactivatePlayer(id: string) {
    const existing = await PlayerModel.findById(id);
    if (!existing) {
      throw createError("Player not found", 404, ErrorCode.PLAYER_NOT_FOUND);
    }
    const updated = await PlayerModel.deactivate(id);
    await PlayerService.invalidateCache();
    return updated;
  },

  async reactivatePlayer(id: string) {
    const existing = await PlayerModel.findById(id);
    if (!existing) {
      throw createError("Player not found", 404, ErrorCode.PLAYER_NOT_FOUND);
    }
    const updated = await PlayerModel.reactivate(id);
    await PlayerService.invalidateCache();
    return updated;
  },

  async searchPlayers(filters: PlayerFilters) {
    const cacheKey = redisKeys.statsCache(
      `players:list:${JSON.stringify(filters)}`,
    );
    const redis = getRedisClient();

    try {
      const cached = await redis.get(cacheKey);
      if (cached) return JSON.parse(cached);
    } catch (err) {
      logger.warn({ err }, "Redis cache read failed, falling through to DB");
    }

    const result = await PlayerModel.findMany(filters);

    try {
      await redis.setex(cacheKey, CACHE_TTL_SECONDS, JSON.stringify(result));
    } catch (err) {
      logger.warn({ err }, "Redis cache write failed");
    }

    return result;
  },

  async getPlayerById(id: string) {
    const player = await PlayerModel.findById(id);
    if (!player) {
      throw createError("Player not found", 404, ErrorCode.PLAYER_NOT_FOUND);
    }
    return player;
  },

  async deletePlayer(id: string): Promise<void> {
    const player = await PlayerModel.findById(id);
    if (!player) {
      throw createError("Player not found", 404, ErrorCode.PLAYER_NOT_FOUND);
    }
    await PlayerModel.deleteById(id);
    if (player.photoUrl) {
      deletePlayerPhoto(player.photoUrl).catch(() => {});
    }
    await PlayerService.invalidateCache();
  },

  async invalidateCache() {
    const redis = getRedisClient();
    try {
      const keys = await redis.keys("cache:stats:players:list:*");
      if (keys.length > 0) {
        await redis.del(...keys);
      }
    } catch (err) {
      logger.warn({ err }, "Cache invalidation failed");
    }
  },
};
