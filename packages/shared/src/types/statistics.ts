export interface Statistics {
  id: string;
  playerId: string;
  tournamentId?: string | null;
  gameId?: string | null;
  goalsScored: number;
  assists: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
  totalMinutes: number;
  goalsPerGame: number;
  passAccuracy?: number | null;
  createdAt: string;
  lastCalculatedAt: string;
}

export interface PlayerStatisticsDTO {
  playerId: string;
  playerName: string;
  tournamentId?: string;
  goalsScored: number;
  assists: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
  totalMinutes: number;
  goalsPerGame: number;
}

export interface TournamentStatisticsDTO {
  tournamentId: string;
  tournamentName: string;
  topScorers: PlayerStatisticsDTO[];
  topAssists: PlayerStatisticsDTO[];
  mostAppearances: PlayerStatisticsDTO[];
}

// Team stats for a single period (year, tournament, or rival)
export interface TeamStatPeriodDTO {
  label: string;
  periodStart?: string;
  periodEnd?: string;
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

// All-time team summary header
export interface TeamSummaryHeaderDTO {
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
  topScorer: { name: string; goals: number };
}

// Per-player stats row for "All Players" and "Single Player" focus modes
export interface PlayerStatRowDTO {
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

// CSV import result summary
export interface CsvImportResultDTO {
  players: { created: number; updated: number; skipped: number };
  games: { created: number; updated: number; skipped: number };
  appearances: { created: number; updated: number; skipped: number };
  playgrounds: { created: number; updated: number; skipped: number };
  warnings: string[];
}
