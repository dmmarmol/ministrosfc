/**
 * Tournament — a named competition that groups multiple games for Ministros FC.
 *
 * MVP scope (owner-team only): tracks ONLY Ministros FC's own record within the
 * tournament (wins, draws, losses, goals). No full league table with other teams.
 *
 * Examples of use:
 *  - A full weekend cup: one Tournament, several Game records.
 *  - A league season: one Tournament (type LEAGUE), many Games over months.
 *  - Standalone friendly matches do NOT require a Tournament.
 *
 * `competitionType` mirrors the CompetitionType enum used on Game — both concepts
 * were originally split (TournamentFormat vs CompetitionType) but are now unified.
 */
import { prisma } from "../config/database";
import { type Tournament, type Prisma, GameStatus } from "@prisma/client";
import { tallyRecord, type MinistrosRecord } from "../utils/ministros-record";

export type { MinistrosRecord };

interface FindManyOptions {
  competitionType?: string;
  page?: number;
  limit?: number;
}

const TournamentModel = {
  async create(data: Prisma.TournamentCreateInput): Promise<Tournament> {
    return prisma.tournament.create({ data });
  },

  async findById(id: string): Promise<Tournament | null> {
    return prisma.tournament.findUnique({ where: { id } });
  },

  async findMany(options: FindManyOptions = {}): Promise<{
    tournaments: Tournament[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const page = options.page ?? 1;
    const limit = Math.min(options.limit ?? 20, 100);
    const skip = (page - 1) * limit;

    const where: Prisma.TournamentWhereInput = {};
    if (options.competitionType)
      where.competitionType = options.competitionType as any;

    const [tournaments, total] = await Promise.all([
      prisma.tournament.findMany({
        where,
        skip,
        take: limit,
        orderBy: { startDate: "desc" },
      }),
      prisma.tournament.count({ where }),
    ]);

    return {
      tournaments,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  },

  async update(
    id: string,
    data: Prisma.TournamentUpdateInput,
  ): Promise<Tournament> {
    return prisma.tournament.update({ where: { id }, data });
  },

  async delete(id: string): Promise<Tournament> {
    return prisma.tournament.delete({ where: { id } });
  },

  async findByNameAndYear(
    name: string,
    year?: number,
  ): Promise<Tournament | null> {
    const where: Prisma.TournamentWhereInput = {
      name: { equals: name, mode: "insensitive" },
    };
    if (year) {
      where.startDate = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      };
    }
    return prisma.tournament.findFirst({
      where,
      orderBy: { startDate: "desc" },
    });
  },

  async hasGames(id: string): Promise<boolean> {
    const count = await prisma.game.count({ where: { tournamentId: id } });
    return count > 0;
  },

  async calculateMinistrosRecord(
    tournamentId: string,
  ): Promise<MinistrosRecord> {
    const completedGames = await prisma.game.findMany({
      where: { tournamentId, status: GameStatus.COMPLETED },
      select: { homeTeamScore: true, awayTeamScore: true },
    });
    return tallyRecord(completedGames);
  },

  /** Records for many tournaments in one query; tournaments without games are absent from the map. */
  async calculateMinistrosRecords(
    tournamentIds: string[],
  ): Promise<Map<string, MinistrosRecord>> {
    if (!tournamentIds.length) return new Map();
    const completedGames = await prisma.game.findMany({
      where: { tournamentId: { in: tournamentIds }, status: GameStatus.COMPLETED },
      select: { tournamentId: true, homeTeamScore: true, awayTeamScore: true },
    });
    const byTournament = new Map<string, typeof completedGames>();
    for (const game of completedGames) {
      const id = game.tournamentId!;
      byTournament.set(id, [...(byTournament.get(id) ?? []), game]);
    }
    return new Map(
      [...byTournament].map(([id, games]) => [id, tallyRecord(games)]),
    );
  },
};

export { TournamentModel };
