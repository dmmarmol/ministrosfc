export interface OpponentTeam {
  id: string;
  name: string;
  logoUrl?: string | null;
  colors?: string | null;
  city?: string | null;
  country?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OpponentTeamCreateDTO {
  name: string;
  logoUrl?: string;
  colors?: string;
  city?: string;
  country?: string;
}

export interface OpponentTeamUpdateDTO extends Partial<OpponentTeamCreateDTO> {}
