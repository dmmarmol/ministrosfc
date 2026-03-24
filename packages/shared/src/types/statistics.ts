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
