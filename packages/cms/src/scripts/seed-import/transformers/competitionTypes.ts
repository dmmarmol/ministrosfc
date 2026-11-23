import { CompetitionType } from "@ministrosfc/shared";

export const COMPETITION_TYPE_MAP: Record<string, CompetitionType> = {
  Liga: CompetitionType.LEAGUE,
  Amistoso: CompetitionType.FRIENDLY,
  "Torneo Apertura": CompetitionType.LEAGUE,
  "Torneo Clausura": CompetitionType.LEAGUE,
  "Torneo Mundialito": CompetitionType.CUP,
  "Copa de Oro": CompetitionType.CUP,
};
