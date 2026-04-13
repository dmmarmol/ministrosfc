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
import { PlayerStatus, PlayerType, Position, Prisma } from "@prisma/client";

/** Rank used for sorting: GK → Defenders → Midfielders → Forwards → unset */
const POSITION_GROUP_RANK: Record<Position, number> = {
  [Position.GK]: 0,
  [Position.CB]: 1,
  [Position.RB]: 1,
  [Position.LB]: 1,
  [Position.RWB]: 2,
  [Position.LWB]: 2,
  [Position.DMF]: 2,
  [Position.CMF]: 2,
  [Position.AMF]: 2,
  [Position.RMF]: 2,
  [Position.LMF]: 2,
  [Position.SS]: 3,
  [Position.CF]: 3,
  [Position.RWF]: 3,
  [Position.LWF]: 3,
};
function posGroupRank(pos: string | null | undefined): number {
  return pos != null ? (POSITION_GROUP_RANK[pos as Position] ?? 4) : 4;
}

export interface PlayerFilters {
  status?: PlayerStatus | null;
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
      status,
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

    const orderBy: Prisma.PlayerOrderByWithRelationInput[] = [
      { jerseyNumber: "asc" },
      { firstName: "asc" },
    ];

    const [rawPlayers, total] = await Promise.all([
      prisma.player.findMany({
        where,
        include: { contactInfo: true },
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.player.count({ where }),
    ]);

    // Sort: status (ACTIVE first) → position group (GK → DEF → MID → FWD) → jerseyNumber → firstName
    const players = rawPlayers.slice().sort((a, b) => {
      const sA = a.status === PlayerStatus.ACTIVE ? 0 : 1;
      const sB = b.status === PlayerStatus.ACTIVE ? 0 : 1;
      if (sA !== sB) return sA - sB;
      const pA = posGroupRank(a.position);
      const pB = posGroupRank(b.position);
      if (pA !== pB) return pA - pB;
      const jA = a.jerseyNumber ?? 999;
      const jB = b.jerseyNumber ?? 999;
      if (jA !== jB) return jA - jB;
      return a.firstName.localeCompare(b.firstName);
    });

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
