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
  async getGameYearsForPlayer(playerId: string): Promise<number[]> {
    const participants = await prisma.gameParticipant.findMany({
      where: { playerId, game: { status: GameStatus.COMPLETED } },
      select: { game: { select: { date: true } } },
    });
    const years = [
      ...new Set(
        participants
          .map((p) =>
            p.game.date ? new Date(p.game.date).getFullYear() : null,
          )
          .filter((y): y is number => y !== null),
      ),
    ];
    return years.sort((a, b) => b - a);
  },

  async aggregateForPlayer(
    playerId: string,
    tournamentId?: string,
    year?: number,
  ) {
    // Sum from GameParticipant records for completed games
    const where: any = {
      playerId,
      game: { status: GameStatus.COMPLETED },
    };
    if (tournamentId) where.game.tournamentId = tournamentId;
    if (year) {
      where.game.date = {
        gte: new Date(`${year}-01-01`),
        lt: new Date(`${year + 1}-01-01`),
      };
    }

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

  // ── Team stat aggregations (Feature 017) ────────────────────────────────────

  async aggregateTeamByYear(filters?: {
    tournamentId?: string;
    rivalId?: string;
  }) {
    const gameWhere: any = { status: GameStatus.COMPLETED };
    if (filters?.tournamentId) gameWhere.tournamentId = filters.tournamentId;
    if (filters?.rivalId) gameWhere.opponentTeamId = filters.rivalId;

    const games = await prisma.game.findMany({
      where: gameWhere,
      select: { date: true, homeTeamScore: true, awayTeamScore: true },
    });

    return groupTeamStatsByKey(games, (g) =>
      String(new Date(g.date).getUTCFullYear()),
    );
  },

  async aggregateTeamByTournament(filters?: {
    year?: number;
    rivalId?: string;
  }) {
    const gameWhere: any = { status: GameStatus.COMPLETED };
    if (filters?.rivalId) gameWhere.opponentTeamId = filters.rivalId;

    const games = await prisma.game.findMany({
      where: gameWhere,
      select: {
        date: true,
        homeTeamScore: true,
        awayTeamScore: true,
        tournament: {
          select: { id: true, name: true, startDate: true, endDate: true },
        },
      },
    });

    const filtered = filters?.year
      ? games.filter((g) => new Date(g.date).getUTCFullYear() === filters.year)
      : games;

    return groupTeamStatsByKey(
      filtered,
      (g) => g.tournament?.name ?? "Sin torneo",
      (g) => ({
        periodStart: g.tournament?.startDate
          ? new Date(g.tournament.startDate).toISOString()
          : undefined,
        periodEnd: g.tournament?.endDate
          ? new Date(g.tournament.endDate).toISOString()
          : undefined,
      }),
    );
  },

  async aggregateTeamByRival(filters?: {
    year?: number;
    tournamentId?: string;
  }) {
    const gameWhere: any = { status: GameStatus.COMPLETED };
    if (filters?.tournamentId) gameWhere.tournamentId = filters.tournamentId;

    const games = await prisma.game.findMany({
      where: gameWhere,
      select: {
        date: true,
        homeTeamScore: true,
        awayTeamScore: true,
        opponentTeam: { select: { id: true, name: true } },
      },
    });

    const filtered = filters?.year
      ? games.filter((g) => new Date(g.date).getUTCFullYear() === filters.year)
      : games;

    return groupTeamStatsByKey(filtered, (g) => g.opponentTeam?.name ?? "?");
  },

  async getRivalBreakdown(rivalId: string, filters?: { year?: number }) {
    const gameWhere: any = {
      status: GameStatus.COMPLETED,
      opponentTeamId: rivalId,
    };

    const games = await prisma.game.findMany({
      where: gameWhere,
      select: { date: true, homeTeamScore: true, awayTeamScore: true },
    });

    const filtered = filters?.year
      ? games.filter((g) => new Date(g.date).getUTCFullYear() === filters.year)
      : games;

    return groupTeamStatsByKey(filtered, (g) =>
      String(new Date(g.date).getUTCFullYear()),
    );
  },

  async getTeamSummaryHeader() {
    const games = await prisma.game.findMany({
      where: { status: GameStatus.COMPLETED },
      select: {
        date: true,
        homeTeamScore: true,
        awayTeamScore: true,
        opponentTeam: { select: { id: true, name: true } },
        tournament: { select: { name: true } },
      },
    });

    const totals = { games: 0, wins: 0, losses: 0, draws: 0, gf: 0, ga: 0 };
    const rivalStats: Record<
      string,
      {
        name: string;
        games: number;
        wins: number;
        losses: number;
        draws: number;
        gf: number;
        ga: number;
      }
    > = {};

    let bestWinDiff = -Infinity;
    let worstLossDiff = Infinity;
    let bestWin: any = null;
    let worstLoss: any = null;

    for (const g of games) {
      const gf = g.homeTeamScore ?? 0;
      const ga = g.awayTeamScore ?? 0;
      totals.games++;
      totals.gf += gf;
      totals.ga += ga;

      const rid = g.opponentTeam?.id ?? "?";
      if (!rivalStats[rid]) {
        rivalStats[rid] = {
          name: g.opponentTeam?.name ?? "?",
          games: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          gf: 0,
          ga: 0,
        };
      }
      rivalStats[rid]!.games++;
      rivalStats[rid]!.gf += gf;
      rivalStats[rid]!.ga += ga;

      if (gf > ga) {
        totals.wins++;
        rivalStats[rid]!.wins++;
        const diff = gf - ga;
        if (diff > bestWinDiff) {
          bestWinDiff = diff;
          bestWin = {
            rival: g.opponentTeam?.name ?? "?",
            tournament: g.tournament?.name ?? "",
            date: new Date(g.date).toISOString().slice(0, 10),
            score: `${gf}-${ga}`,
          };
        }
      } else if (ga > gf) {
        totals.losses++;
        rivalStats[rid]!.losses++;
        const diff = ga - gf;
        if (diff > -worstLossDiff) {
          worstLossDiff = -diff;
          worstLoss = {
            rival: g.opponentTeam?.name ?? "?",
            tournament: g.tournament?.name ?? "",
            date: new Date(g.date).toISOString().slice(0, 10),
            score: `${gf}-${ga}`,
          };
        }
      } else {
        totals.draws++;
        rivalStats[rid]!.draws++;
      }
    }

    const rivalList = Object.values(rivalStats);

    const byGames = [...rivalList].sort((a, b) => b.games - a.games)[0];
    const byWins = [...rivalList].sort((a, b) => b.wins - a.wins)[0];
    const byLosses = [...rivalList].sort((a, b) => b.losses - a.losses)[0];
    const byDraws = [...rivalList].sort((a, b) => b.draws - a.draws)[0];
    const byGf = [...rivalList].sort((a, b) => b.gf - a.gf)[0];
    const byGa = [...rivalList].sort((a, b) => b.ga - a.ga)[0];

    // Top scorer
    const topScorerData = await prisma.gameParticipant.groupBy({
      by: ["playerId"],
      where: { game: { status: GameStatus.COMPLETED } },
      _sum: { goalsScored: true },
      orderBy: { _sum: { goalsScored: "desc" } },
      take: 1,
    });

    let topScorerName = "";
    let topScorerGoals = 0;
    if (topScorerData[0]?.playerId) {
      const p = await prisma.player.findUnique({
        where: { id: topScorerData[0].playerId },
        select: { firstName: true, lastName: true },
      });
      topScorerName = p ? `${p.firstName} ${p.lastName}` : "";
      topScorerGoals = topScorerData[0]._sum?.goalsScored ?? 0;
    }

    return {
      totalGames: totals.games,
      totalWins: totals.wins,
      totalLosses: totals.losses,
      totalDraws: totals.draws,
      totalGoalsFor: totals.gf,
      totalGoalsAgainst: totals.ga,
      winRate:
        totals.games > 0
          ? Math.round((totals.wins / totals.games) * 1000) / 10
          : 0,
      rivalMostPlayed: {
        name: byGames?.name ?? "",
        count: byGames?.games ?? 0,
      },
      rivalMostWins: { name: byWins?.name ?? "", count: byWins?.wins ?? 0 },
      rivalMostLosses: {
        name: byLosses?.name ?? "",
        count: byLosses?.losses ?? 0,
      },
      rivalMostDraws: { name: byDraws?.name ?? "", count: byDraws?.draws ?? 0 },
      bestWin: bestWin ?? { rival: "", tournament: "", date: "", score: "" },
      worstLoss: worstLoss ?? {
        rival: "",
        tournament: "",
        date: "",
        score: "",
      },
      rivalMostGoalsFor: { name: byGf?.name ?? "", totalGoals: byGf?.gf ?? 0 },
      rivalMostGoalsAgainst: {
        name: byGa?.name ?? "",
        totalGoals: byGa?.ga ?? 0,
      },
      topScorer: { name: topScorerName, goals: topScorerGoals },
    };
  },

  async aggregatePlayersAll(filters?: { year?: number; rivalId?: string }) {
    const gameWhere: any = { status: GameStatus.COMPLETED };
    if (filters?.rivalId) gameWhere.opponentTeamId = filters.rivalId;

    const allCompletedGames = await prisma.game.count({ where: gameWhere });

    const participants = await prisma.gameParticipant.findMany({
      where: { game: gameWhere },
      select: {
        playerId: true,
        goalsScored: true,
        assists: true,
        yellowCards: true,
        redCards: true,
        game: {
          select: {
            date: true,
            homeTeamScore: true,
            awayTeamScore: true,
          },
        },
      },
    });

    const filtered = filters?.year
      ? participants.filter(
          (p) => new Date(p.game.date).getUTCFullYear() === filters.year,
        )
      : participants;

    const byPlayer: Record<
      string,
      {
        games: number;
        wins: number;
        losses: number;
        draws: number;
        goals: number;
        assists: number;
        yc: number;
        rc: number;
      }
    > = {};

    for (const p of filtered) {
      if (!p.playerId) continue;
      if (!byPlayer[p.playerId]) {
        byPlayer[p.playerId] = {
          games: 0,
          wins: 0,
          losses: 0,
          draws: 0,
          goals: 0,
          assists: 0,
          yc: 0,
          rc: 0,
        };
      }
      const s = byPlayer[p.playerId]!;
      s.games++;
      s.goals += p.goalsScored ?? 0;
      s.assists += p.assists ?? 0;
      s.yc += p.yellowCards ?? 0;
      s.rc += p.redCards ?? 0;
      const gf = p.game.homeTeamScore ?? 0;
      const ga = p.game.awayTeamScore ?? 0;
      if (gf > ga) s.wins++;
      else if (ga > gf) s.losses++;
      else s.draws++;
    }

    const playerIds = Object.keys(byPlayer);
    const players = await prisma.player.findMany({
      where: { id: { in: playerIds } },
      select: { id: true, firstName: true, lastName: true, nickname: true },
    });
    const playerMap = new Map(players.map((p) => [p.id, p]));

    return playerIds.map((pid) => {
      const s = byPlayer[pid]!;
      const p = playerMap.get(pid);
      return {
        playerId: pid,
        playerName: p ? `${p.firstName} ${p.lastName}` : pid,
        playerNickname: p?.nickname ?? undefined,
        gamesPlayed: s.games,
        wins: s.wins,
        losses: s.losses,
        draws: s.draws,
        goals: s.goals,
        assists: s.assists,
        yellowCards: s.yc,
        redCards: s.rc,
        winRate: s.games > 0 ? Math.round((s.wins / s.games) * 1000) / 10 : 0,
        goalRate: s.games > 0 ? Math.round((s.goals / s.games) * 100) / 100 : 0,
        participationRate:
          allCompletedGames > 0
            ? Math.round((s.games / allCompletedGames) * 1000) / 10
            : 0,
      };
    });
  },
};

// ── helper ────────────────────────────────────────────────────────────────────

type GameRow = {
  date: Date;
  homeTeamScore: number | null;
  awayTeamScore: number | null;
  [key: string]: any;
};

function groupTeamStatsByKey(
  games: GameRow[],
  keyFn: (g: GameRow) => string,
  extraFn?: (g: GameRow) => { periodStart?: string; periodEnd?: string },
) {
  const map: Record<
    string,
    {
      games: number;
      wins: number;
      losses: number;
      draws: number;
      gf: number;
      ga: number;
      extra?: any;
    }
  > = {};

  for (const g of games) {
    const label = keyFn(g);
    if (!map[label]) {
      map[label] = { games: 0, wins: 0, losses: 0, draws: 0, gf: 0, ga: 0 };
      if (extraFn) map[label]!.extra = extraFn(g);
    }
    const s = map[label]!;
    const gf = g.homeTeamScore ?? 0;
    const ga = g.awayTeamScore ?? 0;
    s.games++;
    s.gf += gf;
    s.ga += ga;
    if (gf > ga) s.wins++;
    else if (ga > gf) s.losses++;
    else s.draws++;
  }

  return Object.entries(map).map(([label, s]) => ({
    label,
    periodStart: s.extra?.periodStart,
    periodEnd: s.extra?.periodEnd,
    gamesPlayed: s.games,
    wins: s.wins,
    losses: s.losses,
    draws: s.draws,
    goalsFor: s.gf,
    goalsAgainst: s.ga,
    goalDifference: s.gf - s.ga,
    goalRateFor: s.games > 0 ? Math.round((s.gf / s.games) * 100) / 100 : 0,
    goalRateAgainst: s.games > 0 ? Math.round((s.ga / s.games) * 100) / 100 : 0,
    winRate: s.games > 0 ? Math.round((s.wins / s.games) * 1000) / 10 : 0,
    pointsEarned: s.wins * 3 + s.draws,
  }));
}

export { StatisticsModel };
