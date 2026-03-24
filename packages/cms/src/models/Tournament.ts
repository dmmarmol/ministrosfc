/**
 * Tournament — a named competition that groups multiple games for Ministros FC.
 *
 * MVP scope (owner-team only): tracks ONLY Ministros FC's own record within the
 * tournament (wins, draws, losses, goals). No full league table with other teams.
 *
 * Examples of use:
 *  - A full weekend cup: one Tournament, several Game records.
 *  - A league season: one Tournament (type SEASON/LEAGUE), many Games over months.
 *  - Standalone friendly matches do NOT require a Tournament.
 *
 * `competitionType` mirrors the CompetitionType enum used on Game — both concepts
 * were originally split (TournamentFormat vs CompetitionType) but are now unified.
 */
import { prisma } from "../config/database";
import type { Tournament, Prisma } from "@prisma/client";

export interface MinistrosRecord {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

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
    if (options.competitionType) where.competitionType = options.competitionType as any;

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

  async hasGames(id: string): Promise<boolean> {
    const count = await prisma.game.count({ where: { tournamentId: id } });
    return count > 0;
  },

  async calculateMinistrosRecord(
    tournamentId: string,
  ): Promise<MinistrosRecord> {
    const completedGames = await prisma.game.findMany({
      where: { tournamentId, status: "COMPLETED" },
      select: { homeTeamScore: true, awayTeamScore: true },
    });

    const record: MinistrosRecord = {
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
    };

    for (const game of completedGames) {
      if (game.homeTeamScore === null || game.awayTeamScore === null) continue;
      record.played++;
      record.goalsFor += game.homeTeamScore;
      record.goalsAgainst += game.awayTeamScore;
      if (game.homeTeamScore > game.awayTeamScore) record.wins++;
      else if (game.homeTeamScore === game.awayTeamScore) record.draws++;
      else record.losses++;
    }

    record.goalDifference = record.goalsFor - record.goalsAgainst;
    return record;
  },
};

export { TournamentModel };
