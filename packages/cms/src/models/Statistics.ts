/**
 * Statistics — aggregation layer: computes player and tournament stats on demand.
 *
 * No separate statistics table exists. All data is derived from GameParticipant
 * records filtered to COMPLETED games. This keeps the DB simple at MVP scale.
 *
 * Key queries:
 *  - `aggregateForPlayer(playerId, tournamentId?)` — career totals for one player.
 *  - `getTopScorers(tournamentId?, limit)` — ranked list by goals scored.
 *  - `aggregateForTournament(tournamentId)` — all players' stats within a tournament.
 */
import { prisma } from "../config/database";
import { GameStatus } from "@prisma/client";

const StatisticsModel = {
  async aggregateForPlayer(playerId: string, tournamentId?: string) {
    // Sum from GameParticipant records for completed games
    const where: any = {
      playerId,
      game: { status: GameStatus.COMPLETED },
    };
    if (tournamentId) where.game.tournamentId = tournamentId;

    const participants = await prisma.gameParticipant.findMany({
      where,
      select: {
        goalsScored: true,
        assists: true,
        yellowCards: true,
        redCards: true,
        minutesPlayed: true,
      },
    });

    return participants.reduce(
      (acc, p) => ({
        appearances: acc.appearances + 1,
        goalsScored: acc.goalsScored + (p.goalsScored ?? 0),
        assists: acc.assists + (p.assists ?? 0),
        yellowCards: acc.yellowCards + (p.yellowCards ?? 0),
        redCards: acc.redCards + (p.redCards ?? 0),
        totalMinutes: acc.totalMinutes + (p.minutesPlayed ?? 0),
      }),
      {
        appearances: 0,
        goalsScored: 0,
        assists: 0,
        yellowCards: 0,
        redCards: 0,
        totalMinutes: 0,
      },
    );
  },

  async getTopScorers(tournamentId?: string, limit = 10) {
    const gameWhere: any = { status: GameStatus.COMPLETED };
    if (tournamentId) gameWhere.tournamentId = tournamentId;

    const results = await prisma.gameParticipant.groupBy({
      by: ["playerId"],
      where: { game: gameWhere },
      _sum: { goalsScored: true, assists: true },
      _count: { id: true },
      orderBy: { _sum: { goalsScored: "desc" } },
      take: limit,
    });

    const playerIds = results
      .map((r) => r.playerId)
      .filter((id): id is string => id !== null);
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nickname: true,
        jerseyNumber: true,
        position: true,
        photoUrl: true,
      },
    });
    const playerMap = new Map(players.map((p) => [p.id, p]));

    return results.map((r) => ({
      player: r.playerId ? playerMap.get(r.playerId) : undefined,
      appearances: r._count.id,
      goalsScored: r._sum.goalsScored ?? 0,
      assists: r._sum.assists ?? 0,
    }));
  },

  async aggregateForTournament(tournamentId: string) {
    const results = await prisma.gameParticipant.groupBy({
      by: ["playerId"],
      where: { game: { tournamentId, status: GameStatus.COMPLETED } },
      _sum: {
        goalsScored: true,
        assists: true,
        yellowCards: true,
        redCards: true,
      },
      _count: { id: true },
      orderBy: { _sum: { goalsScored: "desc" } },
    });

    const playerIds = results
      .map((r) => r.playerId)
      .filter((id): id is string => id !== null);
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        nickname: true,
        jerseyNumber: true,
        position: true,
      },
    });
    const playerMap = new Map(players.map((p) => [p.id, p]));

    return results.map((r) => ({
      player: r.playerId ? playerMap.get(r.playerId) : undefined,
      appearances: r._count.id,
      goalsScored: r._sum.goalsScored ?? 0,
      assists: r._sum.assists ?? 0,
      yellowCards: r._sum.yellowCards ?? 0,
      redCards: r._sum.redCards ?? 0,
    }));
  },
};

export { StatisticsModel };
