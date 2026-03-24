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

export interface TournamentCreateDTO {
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  competitionType?: CompetitionType;
}

export interface TournamentUpdateDTO extends Partial<TournamentCreateDTO> {}

/** Ministros FC record within a tournament (MVP scope: no full league standings) */
export interface MinistrosRecord {
  tournamentId: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
