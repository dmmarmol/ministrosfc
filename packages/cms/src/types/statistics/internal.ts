/**
 * Internal types used within Statistics model and service.
 * These are not exported to the API; they support internal aggregation logic.
 */

export type { AllPlayersStatsRow } from "@ministrosfc/shared";

/**
 * Represents aggregated team statistics for a single period/group.
 */
export interface TeamStatRow {
  key: string;
  label: string;
  periodStart?: string;
  periodEnd?: string;
  playgroundName: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  goalRateFor: number;
  goalRateAgainst: number;
  winRate: number;
  pointsEarned: number;
}

/**
 * Aggregated stats for a single player (internal use in aggregation).
 */
export interface PlayerAggregateStats {
  appearances: number;
  wins: number;
  losses: number;
  draws: number;
  goalsScored: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  totalMinutes: number;
}
