export enum ConfirmationStatus {
  NOT_RESPONDED = "NOT_RESPONDED",
  CONFIRMED = "CONFIRMED",
  DECLINED = "DECLINED",
}

export interface GameParticipant {
  id: string;
  gameId: string;
  playerId: string;
  confirmationStatus: ConfirmationStatus;
  confirmedById?: string | null;
  confirmedAt?: string | null;
  notes?: string | null;
  goalsScored?: number | null;
  assists?: number | null;
  yellowCards?: number | null;
  redCards?: number | null;
  minutesPlayed?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ParticipantDTO {
  playerId: string;
  confirmationStatus?: ConfirmationStatus;
  notes?: string;
  /** Names of guest friends to add (creates GUEST player records) */
  friendNames?: string[];
}

export interface ParticipantStatsUpdateDTO {
  goalsScored?: number;
  assists?: number;
  yellowCards?: number;
  redCards?: number;
  minutesPlayed?: number;
}

// --- Feature 014: trimodal signup types ---

export interface SelfSignupDTO {
  mode: "self";
}

export interface GuestSignupDTO {
  mode: "guest";
  firstName: string;
  lastName: string;
  position?: string | null;
}

export interface ProxySignupDTO {
  mode: "proxy";
  targetPlayerId: string;
}

export type SignupRequestDTO = SelfSignupDTO | GuestSignupDTO | ProxySignupDTO;

export interface RosterEntry {
  participantId: string;
  confirmationStatus: ConfirmationStatus;
  confirmedById: string | null;
  confirmedByName: string | null;
  confirmedAt: string | null;
  player: {
    id: string;
    firstName: string;
    lastName: string | null;
    jerseyNumber: number | null;
    position: string | null;
    /** @TODO transform this into an enum and reuse it across the codebase */
    playerType: "REGISTERED" | "GUEST";
    invitedById: string | null;
    invitedByName: string | null;
  };
}

export type CurrentPlayerStatus =
  | "not_signed_up"
  | "signed_up"
  | "no_player_linked"
  | "not_player_role";

export interface GameSignupPageDTO {
  game: {
    id: string;
    slug: string | null;
    date: string;
    location: string | null;
    status: string;
    maxPlayers: number | null;
    lineup: string | null;
    opponentTeam: {
      id: string;
      name: string;
    };
    playground?: {
      id: string;
      name: string;
      address: string;
    } | null;
  };
  roster: RosterEntry[];
  confirmedCount: number;
  isFull: boolean;
  currentPlayerStatus: CurrentPlayerStatus;
  currentPlayerId: string | null;
}
