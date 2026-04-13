/**
 * Game — represents a single match played (or scheduled) by Ministros FC.
 *
 * Ministros FC always plays as the "home" team in the system:
 *  - `homeTeamScore` = goals scored by Ministros FC.
 *  - `awayTeamScore` = goals scored by the opponent.
 *
 * A game can be standalone (friendly, one-off league match) or belong to a
 * Tournament via `tournamentId`. Multiple games can share a tournament OR be
 * completely independent — the system supports both.
 *
 * Lifecycle: SCHEDULED → IN_PROGRESS → COMPLETED (or CANCELLED at any point).
 * Only COMPLETED games count towards player stats and the Ministros record.
 */
import { prisma } from "../config/database";
import type { Game, GameStatus, Prisma } from "@prisma/client";

export interface PaginatedResult<T> {
  results: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface FindManyOptions {
  status?: GameStatus;
  tournamentId?: string;
  opponentTeamId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

const GameModel = {
  async create(data: Prisma.GameCreateInput): Promise<Game> {
    return prisma.game.create({ data });
  },

  async findById(id: string): Promise<Game | null> {
    return prisma.game.findUnique({
      where: { id },
      include: {
        opponentTeam: true,
        tournament: true,
        playground: true,
        participants: {
          include: {
            player: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                nickname: true,
                jerseyNumber: true,
                position: true,
                playerType: true,
                invitedById: true,
              },
            },
            confirmedBy: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
          orderBy: { confirmedAt: "asc" },
        },
      },
    });
  },

  async findBySlug(slug: string): Promise<{ id: string; slug: string } | null> {
    const result = await prisma.game.findUnique({
      where: { slug },
      select: { id: true, slug: true },
    });
    if (!result) return null;
    return { id: result.id, slug: result.slug! };
  },

  /**
   * Returns a paginated list of games. The result shape is generic so callers
   * can type-narrow the `results` array to whatever include/select payload they
   * requested (e.g. `PaginatedResult<GameWithOpponent>`).
   */
  async findMany<T = Game>(options: FindManyOptions = {}): Promise<PaginatedResult<T>> {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.GameWhereInput = {};
    if (options.status) where.status = options.status;
    if (options.tournamentId) where.tournamentId = options.tournamentId;
    if (options.opponentTeamId) where.opponentTeamId = options.opponentTeamId;
    if (options.dateFrom || options.dateTo) {
      where.date = {};
      if (options.dateFrom)
        (where.date as Prisma.DateTimeFilter).gte = new Date(options.dateFrom);
      if (options.dateTo)
        (where.date as Prisma.DateTimeFilter).lte = new Date(options.dateTo);
    }

    const [games, total] = await Promise.all([
      prisma.game.findMany({
        where,
        skip,
        take: limit,
        orderBy: { date: "desc" },
        include: {
          opponentTeam: { select: { id: true, name: true, logoUrl: true } },
          tournament: { select: { id: true, name: true } },
          playground: {
            select: {
              id: true,
              name: true,
              address: true,
              latitude: true,
              longitude: true,
            },
          },
          _count: {
            select: {
              participants: { where: { confirmationStatus: "CONFIRMED" } },
            },
          },
        },
      }),
      prisma.game.count({ where }),
    ]);

    return { results: games as T[], total, page, limit, totalPages: Math.ceil(total / limit) };
  },

  async update(id: string, data: Prisma.GameUpdateInput): Promise<Game> {
    return prisma.game.update({ where: { id }, data });
  },

  async delete(id: string): Promise<Game> {
    return prisma.game.delete({ where: { id } });
  },
};

export { GameModel };
