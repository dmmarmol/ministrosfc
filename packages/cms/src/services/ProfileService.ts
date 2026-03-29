import { prisma } from "../config/database";
import { getRedisClient } from "../config/redis";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";
import {
  uploadPhoto,
  deletePlayerPhoto,
  validatePhotoFile,
  type UploadedFile,
} from "../utils/object-storage";

export const ProfileService = {
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        player: {
          include: { contactInfo: true },
        },
      },
    });

    if (!user || !user.player) {
      throw createError("Profile not found", 404, ErrorCode.NOT_FOUND);
    }

    const invitedGuests = await prisma.player.findMany({
      where: {
        invitedById: user.player.id,
        playerType: "GUEST",
      },
      include: {
        gameParticipants: {
          include: {
            game: {
              include: { opponentTeam: true },
            },
          },
          take: 1,
        },
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        hasPassword: user.passwordHash != null,
        hasGoogle: user.googleSubjectId != null,
        createdAt: user.createdAt,
      },
      player: {
        id: user.player.id,
        firstName: user.player.firstName,
        lastName: user.player.lastName,
        nickname: user.player.nickname,
        position: user.player.position,
        jerseyNumber: user.player.jerseyNumber,
        dateOfBirth: user.player.dateOfBirth,
        address: user.player.address,
        photoUrl: user.player.photoUrl,
        status: user.player.status,
        playerType: user.player.playerType,
      },
      contact: user.player.contactInfo
        ? {
            phone: user.player.contactInfo.phone,
            whatsapp: user.player.contactInfo.whatsapp,
            emergencyContact: user.player.contactInfo.emergencyContact,
          }
        : { phone: null, whatsapp: null, emergencyContact: null },
      invitedGuests: invitedGuests.map((g) => ({
        id: g.id,
        firstName: g.firstName,
        lastName: g.lastName,
        game: g.gameParticipants[0]?.game
          ? {
              id: g.gameParticipants[0].game.id,
              date: g.gameParticipants[0].game.date,
              opponent: g.gameParticipants[0].game.opponentTeam?.name ?? null,
            }
          : null,
      })),
    };
  },

  async updateProfile(
    userId: string,
    /** @TODO try to use existing PlayerData types to enforce typing here and maintain sync */
    data: {
      firstName?: string;
      lastName?: string;
      nickname?: string;
      position?: string;
      jerseyNumber?: number | null;
      dateOfBirth?: string | null;
      address?: string | null;
      phone?: string | null;
      whatsapp?: string | null;
      emergencyContact?: string | null;
    },
  ) {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: { player: true },
      });

      if (!user || !user.player) {
        throw createError("Profile not found", 404, ErrorCode.NOT_FOUND);
      }

      // Jersey uniqueness check
      if (data.jerseyNumber != null) {
        /** @TODO try to use existing PlayerData types to enforce typing here */
        const conflict = await tx.player.findFirst({
          where: {
            jerseyNumber: data.jerseyNumber,
            status: "ACTIVE",
            playerType: "REGISTERED",
            id: { not: user.player.id },
          },
        });
        if (conflict) {
          throw createError(
            "Ese número de camiseta ya está en uso",
            409,
            "DUPLICATE_JERSEY_NUMBER",
          );
        }
      }

      // Update User fields
      const userUpdate: Record<string, unknown> = {};
      if (data.firstName !== undefined) userUpdate.firstName = data.firstName;
      if (data.lastName !== undefined) userUpdate.lastName = data.lastName;

      if (Object.keys(userUpdate).length > 0) {
        await tx.user.update({ where: { id: userId }, data: userUpdate });
      }

      // Update Player fields
      const playerUpdate: Record<string, unknown> = {};
      if (data.firstName !== undefined) playerUpdate.firstName = data.firstName;
      if (data.lastName !== undefined) playerUpdate.lastName = data.lastName;
      if (data.nickname !== undefined) playerUpdate.nickname = data.nickname;
      if (data.position !== undefined) playerUpdate.position = data.position;
      if (data.jerseyNumber !== undefined)
        playerUpdate.jerseyNumber = data.jerseyNumber;
      if (data.dateOfBirth !== undefined)
        playerUpdate.dateOfBirth = data.dateOfBirth
          ? new Date(data.dateOfBirth)
          : null;
      if (data.address !== undefined) playerUpdate.address = data.address;

      if (Object.keys(playerUpdate).length > 0) {
        await tx.player.update({
          where: { id: user.player.id },
          data: playerUpdate,
        });
      }

      // Update/create Contact
      const contactUpdate: Record<string, unknown> = {};
      if (data.phone !== undefined) contactUpdate.phone = data.phone;
      if (data.whatsapp !== undefined) contactUpdate.whatsapp = data.whatsapp;
      if (data.emergencyContact !== undefined)
        contactUpdate.emergencyContact = data.emergencyContact;

      if (Object.keys(contactUpdate).length > 0) {
        await tx.contact.upsert({
          where: { playerId: user.player.id },
          create: { playerId: user.player.id, ...contactUpdate },
          update: contactUpdate,
        });
      }

      // Invalidate cache
      try {
        const redis = getRedisClient();
        const keys = await redis.keys("players:search:*");
        if (keys.length > 0) await redis.del(...keys);
      } catch {
        // Non-critical
      }

      return ProfileService.getProfile(userId);
    });
  },

  async updatePhoto(userId: string, file: UploadedFile) {
    validatePhotoFile(file);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { player: true },
    });

    if (!user || !user.player) {
      throw createError("Profile not found", 404, ErrorCode.NOT_FOUND);
    }

    // Delete old photo (best effort)
    if (user.player.photoUrl) {
      await deletePlayerPhoto(user.player.photoUrl);
    }

    const photoUrl = await uploadPhoto(file, "users", userId);

    await prisma.player.update({
      where: { id: user.player.id },
      data: { photoUrl },
    });

    // Invalidate cache
    try {
      const redis = getRedisClient();
      const keys = await redis.keys("players:search:*");
      if (keys.length > 0) await redis.del(...keys);
    } catch {
      // Non-critical
    }

    return { photoUrl };
  },

  async getJerseyAvailability(excludePlayerId?: string) {
    /** @TODO try to use existing PlayerData types to enforce typing here */
    const where: Record<string, unknown> = {
      status: "ACTIVE",
      playerType: "REGISTERED",
      jerseyNumber: { not: null },
    };
    if (excludePlayerId) {
      where.id = { not: excludePlayerId };
    }

    const players = await prisma.player.findMany({
      where,
      select: { jerseyNumber: true },
    });

    return {
      taken: players
        .map((p) => p.jerseyNumber)
        .filter((n): n is number => n != null),
    };
  },
};
