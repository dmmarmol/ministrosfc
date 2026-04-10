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
  LEAGUE = "LEAGUE",
  CUP = "CUP",
  PLAYOFF = "PLAYOFF",
  SEASON = "SEASON",
}

export const FORMATIONS = [
  "4-4-2",
  "4-3-3",
  "4-2-3-1",
  "4-5-1",
  "4-1-4-1",
  "4-3-2-1",
  "4-4-1-1",
  "3-4-3",
  "3-5-2",
  "3-4-2-1",
  "5-3-2",
  "5-4-1",
  "5-2-3",
  "4-2-4",
] as const;

export type FormationCode = (typeof FORMATIONS)[number];

/** Server-computed signup state returned in `GET /api/v1/games` for PLAYER callers only. */
export type GameSignupState = "available" | "signed_up" | "full";

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
  // Feature 014: game signup fields (read-only, server-generated)
  maxPlayers: number | null;
  slug: string;
  lineup: FormationCode | null;
  endDate: string;
  /** Server-computed for PLAYER callers; absent for guests and non-PLAYER roles. Never in DTOs. */
  currentPlayerStatus?: GameSignupState | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameCreateDTO {
  opponentTeamId: string;
  tournamentId?: string;
  date: string;
  location?: string;
  competitionType?: CompetitionType;
  maxPlayers?: number;
  lineup?: FormationCode;
  // endDate is server-generated (date + 100 min) — do NOT include in payloads
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
  maxPlayers?: number | null;
  lineup?: FormationCode | null;
  // endDate is server-generated (date + 100 min) — do NOT include in payloads
}
