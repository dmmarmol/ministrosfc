/**
 * Response DTOs for statistics endpoints.
 * Most types are re-exported from @ministrosfc/shared; this file centralizes them.
 */

export type {
  TopScorerDTO,
  PlayerRivalMatchDTO,
  PlayerRivalPeriodDTO,
  TeamStatMatchDTO,
} from "@ministrosfc/shared";

/**
 * Response shape for GET /statistics/players/:id
 */
export interface PlayerStatsResponse {
  player: {
    id: string;
    firstName: string;
    lastName: string;
    nickname?: string | null;
    jerseyNumber?: number | null;
    position?: string | null;
    photoUrl?: string | null;
    playerType?: string | null;
    status: string;
  };
  stats: {
    appearances: number;
    goalsScored: number;
    assists: number;
    yellowCards: number;
    redCards: number;
    totalMinutes: number;
  };
  availableYears: number[];
}

/**
 * Response shape for GET /statistics/tournaments/:id
 */
export interface TournamentStatsResponse {
  tournament: {
    id: string;
    name: string;
    startDate: Date;
    endDate?: Date | null;
    playgroundId: string;
  };
  ministrosRecord: {
    wins: number;
    losses: number;
    draws: number;
  };
  playerStats: Array<{
    player?: {
      id: string;
      firstName: string;
      lastName: string;
      nickname?: string | null;
      jerseyNumber?: number | null;
      position?: string | null;
    };
    appearances: number;
    goalsScored: number;
    assists: number;
    yellowCards: number;
    redCards: number;
  }>;
}

/**
 * Response shape for GET /statistics/team/summary
 */
export interface TeamSummaryResponse {
  totalGames: number;
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  totalGoalsFor: number;
  totalGoalsAgainst: number;
  winRate: number;
  rivalMostPlayed: { name: string; count: number };
  rivalMostWins: { name: string; count: number };
  rivalMostLosses: { name: string; count: number };
  rivalMostDraws: { name: string; count: number };
  bestWin: { rival: string; tournament: string; date: string; score: string };
  worstLoss: { rival: string; tournament: string; date: string; score: string };
  rivalMostGoalsFor: { name: string; totalGoals: number };
  rivalMostGoalsAgainst: { name: string; totalGoals: number };
  topScorer: { id: string; name: string; goals: number };
}
