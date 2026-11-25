import { CompetitionType } from "./game";
export { CompetitionType };

export interface Tournament {
  id: string;
  name: string;
  description?: string | null;
  startDate: string;
  endDate: string;
  /** Uses the same CompetitionType enum as Game — TournamentFormat was a duplicate concept. */
  competitionType: CompetitionType;
  createdAt: string;
  updatedAt: string;
}

/** Ministros FC record within a tournament (MVP scope: no full league standings) */
export interface MinistrosRecord {
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
}

/** A row of GET /tournaments: the tournament plus Ministros FC's record in it. */
export interface TournamentWithRecord extends Tournament {
  ministrosRecord: MinistrosRecord;
}

export interface TournamentCreatePayload {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  competitionType?: CompetitionType;
}

export interface TournamentUpdatePayload {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  competitionType?: CompetitionType;
}
