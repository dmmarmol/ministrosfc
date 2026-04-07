export enum GameStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

/**
 * The type of competition for a game or tournament.
 * Used on both Game.competitionType and Tournament.competitionType (replacing TournamentFormat).
 * FRIENDLY = amistoso; LEAGUE = liga; CUP = copa; PLAYOFF = playoff; SEASON = temporada completa.
 */
export enum CompetitionType {
  FRIENDLY = "FRIENDLY",
  LEAGUE   = "LEAGUE",
  CUP      = "CUP",
  PLAYOFF  = "PLAYOFF",
  SEASON   = "SEASON",
}

export interface AdvancedStats {
  possession?: number;
  shotsOnTarget?: number;
  fouls?: number;
}

export interface Game {
  id: string;
  opponentTeamId: string;
  tournamentId?: string | null;
  date: string;
  location?: string | null;
  playgroundId?: string | null;
  playground?: {
    id: string;
    name: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  } | null;
  competitionType: CompetitionType;
  status: GameStatus;
  homeTeamScore?: number | null;
  awayTeamScore?: number | null;
  possession?: number | null;
  shotsOnTarget?: number | null;
  fouls?: number | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameCreateDTO {
  opponentTeamId: string;
  tournamentId?: string;
  date: string;
  location?: string;
  competitionType?: CompetitionType;
}

export interface GameUpdateDTO {
  date?: string;
  location?: string;
  competitionType?: CompetitionType;
  status?: GameStatus;
  homeTeamScore?: number;
  awayTeamScore?: number;
  possession?: number;
  shotsOnTarget?: number;
  fouls?: number;
  notes?: string;
  tournamentId?: string;
}
