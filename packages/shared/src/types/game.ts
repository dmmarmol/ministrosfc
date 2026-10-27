import type { OptionItem, SelectItem } from "./api";
import type { ConfirmationStatus } from "./game-participant";
import type { OpponentTeam } from "./opponent-team";
import type { PlayerType, Position } from "./player";
import type { PlaygroundOption } from "./playground";

export enum GameStatus {
  SCHEDULED = "SCHEDULED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export enum GameResult {
  WIN = "WIN",
  LOSS = "LOSS",
  DRAW = "DRAW",
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

export const competitionTypeItems: SelectItem[] = [
  { value: CompetitionType.LEAGUE, label: "Liga" },
  { value: CompetitionType.CUP, label: "Copa" },
  { value: CompetitionType.PLAYOFF, label: "Playoff" },
  { value: CompetitionType.SEASON, label: "Temporada" },
  { value: CompetitionType.FRIENDLY, label: "Amistoso" },
];

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
  opponentTeam: OpponentTeam;
  opponentTeamId: string;
  tournamentId?: string | null;
  date: string;
  time?: string | null;
  location?: string | null;
  playgroundId?: string | null;
  playground?: PlaygroundOption | null;
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
  participants: GameParticipant[];
  slug: string;
  lineup: FormationCode | null;
  endDate: string;
  /** Server-computed for PLAYER callers; absent for guests and non-PLAYER roles. Never in DTOs. */
  currentPlayerStatus?: GameSignupState | null;
  createdAt: string;
  updatedAt: string;
}

export interface GameParticipant {
  assists: number;
  confirmationStatus: ConfirmationStatus;
  confirmedAt: string | null;
  confirmedBy: string | null;
  confirmedById: string | null;
  createdAt: string;
  gameId: string;
  goalsScored: number;
  id: string;
  invitedByName: string | null;
  isStarter: boolean | null;
  minutesPlayed: number | null;
  notes: string | null;
  player: {
    firstName: string;
    id: string;
    invitedById: string;
    invitedByName?: string;
    jerseyNumber: number | null;
    lastName: string;
    nickname: string;
    playerType: PlayerType;
    position: Position | null;
  };
  playerId: string;
  redCards: number;
  updatedAt: string;
  yellowCards: number;
}

export type AdminGame = Omit<Game, "opponentTeam"> & {
  opponentTeam: OptionItem | null;
  tournament: OptionItem | null;
  confirmedCount: number | null;
};

export interface GameCreatePayload {
  opponentTeamId: string;
  tournamentId?: string;
  date: string;
  time?: string;
  location?: string;
  competitionType?: CompetitionType;
  lineup?: FormationCode;
  notes?: string;
  playgroundId?: string | null;
  maxPlayers?: number | null;
  participants?: GameParticipant[];
  // endDate is server-generated (date + 100 min) — do NOT include in payloads
}

export interface GameUpdatePayload {
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
  opponentTeamId?: string;
  playgroundId?: string | null;
  // endDate is server-generated (date + 100 min) — do NOT include in payloads
}
