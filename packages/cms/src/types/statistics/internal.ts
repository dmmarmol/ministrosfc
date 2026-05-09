/**
 * Internal types used within Statistics model and service.
 * These are not exported to the API; they support internal aggregation logic.
 */

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
  goalsScored: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  totalMinutes: number;
}

/**
 * Player stats row used in getAllPlayerStats aggregation.
 */
export interface AllPlayersStatsRow {
  playerId: string;
  playerName: string;
  playerNickname?: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  draws: number;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  winRate: number;
  goalRate: number;
  participationRate: number;
}
