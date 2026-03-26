/**
 * Player — represents a squad member of Ministros FC.
 *
 * A player can be:
 *  - REGISTERED: an official club member with a jersey number and contact info.
 *  - GUEST: an ad-hoc participant invited for a single match (no jersey, no account).
 *
 * Key fields:
 *  - `jerseyNumber` is unique among ACTIVE REGISTERED players.
 *  - `invitedById` links GUEST players to the REGISTERED player who brought them.
 *  - `status` INACTIVE means soft-deleted (hidden from public roster but retained for stats).
 */
import { prisma } from "../config/database";
import { PlayerStatus, PlayerType, Prisma } from "@prisma/client";

export interface PlayerFilters {
  status?: PlayerStatus;
  playerType?: PlayerType;
  position?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const PlayerModel = {
  async create(data: Prisma.PlayerCreateInput) {
    return prisma.player.create({ data, include: { contactInfo: true } });
  },

  async findById(id: string) {
    return prisma.player.findUnique({
      where: { id },
      include: {
        contactInfo: true,
        user: { select: { id: true, email: true, role: true } },
      },
    });
  },

  async findMany(filters: PlayerFilters = {}) {
    const {
      status = PlayerStatus.ACTIVE,
      playerType,
      position,
      search,
      page = 1,
      limit = 20,
    } = filters;
    const where: Prisma.PlayerWhereInput = {
      ...(status ? { status } : {}),
      ...(playerType ? { playerType } : {}),
      ...(position ? { position: position as any } : {}),
      ...(search
        ? {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { nickname: { contains: search, mode: "insensitive" } },
            ],
          }
        : {}),
    };

    const [players, total] = await Promise.all([
      prisma.player.findMany({
        where,
        include: { contactInfo: true },
        orderBy: [{ jerseyNumber: "asc" }, { firstName: "asc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.player.count({ where }),
    ]);

    return {
      players,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async update(id: string, data: Prisma.PlayerUpdateInput) {
    return prisma.player.update({
      where: { id },
      data,
      include: { contactInfo: true },
    });
  },

  async deactivate(id: string) {
    return prisma.player.update({
      where: { id },
      data: { status: PlayerStatus.INACTIVE },
    });
  },

  async reactivate(id: string) {
    return prisma.player.update({
      where: { id },
      data: { status: PlayerStatus.ACTIVE },
    });
  },

  async isJerseyNumberTaken(
    jerseyNumber: number,
    excludeId?: string,
  ): Promise<boolean> {
    const existing = await prisma.player.findFirst({
      where: {
        jerseyNumber,
        status: PlayerStatus.ACTIVE,
        playerType: PlayerType.REGISTERED,
        ...(excludeId ? { NOT: { id: excludeId } } : {}),
      },
    });
    return existing !== null;
  },

  async deleteById(id: string): Promise<void> {
    await prisma.player.delete({ where: { id } });
  },
};
