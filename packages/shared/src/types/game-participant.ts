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
