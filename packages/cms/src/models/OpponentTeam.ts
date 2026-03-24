/**
 * OpponentTeam — a rival team that Ministros FC has played or is scheduled to play against.
 *
 * Not a full club model: it only stores metadata used for display purposes
 * (name, optional logo, optional short name). One OpponentTeam can be linked
 * to many Games over time.
 *
 * Deletion is blocked if the team has associated games (`hasGames()`).
 */
import { prisma } from "../config/database";
import type { OpponentTeam, Prisma } from "@prisma/client";

interface FindManyOptions {
  search?: string;
  page?: number;
  limit?: number;
}

const OpponentTeamModel = {
  async create(data: Prisma.OpponentTeamCreateInput): Promise<OpponentTeam> {
    return prisma.opponentTeam.create({ data });
  },

  async findById(id: string): Promise<OpponentTeam | null> {
    return prisma.opponentTeam.findUnique({ where: { id } });
  },

  async findMany(options: FindManyOptions = {}): Promise<{
    teams: OpponentTeam[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.OpponentTeamWhereInput = options.search
      ? { name: { contains: options.search, mode: "insensitive" as const } }
      : {};

    const [teams, total] = await Promise.all([
      prisma.opponentTeam.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: "asc" },
      }),
      prisma.opponentTeam.count({ where }),
    ]);

    return { teams, total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async update(
    id: string,
    data: Prisma.OpponentTeamUpdateInput,
  ): Promise<OpponentTeam> {
    return prisma.opponentTeam.update({ where: { id }, data });
  },

  async delete(id: string): Promise<OpponentTeam> {
    return prisma.opponentTeam.delete({ where: { id } });
  },

  async hasGames(id: string): Promise<boolean> {
    const count = await prisma.game.count({ where: { opponentTeamId: id } });
    return count > 0;
  },
};

export { OpponentTeamModel };
