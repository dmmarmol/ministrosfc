export interface OpponentTeam {
  name: string;
  shortName?: string;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  city?: string;
  country?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type OpponentTeamCreatePayload = Omit<
  OpponentTeam,
  "createdAt" | "updatedAt"
>;

export interface OpponentTeamUpdatePayload extends Partial<OpponentTeamCreatePayload> {}
