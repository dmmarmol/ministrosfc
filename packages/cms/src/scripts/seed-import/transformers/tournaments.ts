import { randomUUID } from "crypto";
import type { ParsedHistorialRow } from "../parsers/parseHistorial";
import type { IdMap } from "../types";

type CompetitionType = "FRIENDLY" | "LEAGUE" | "CUP" | "PLAYOFF" | "SEASON";

const COMPETITION_TYPE_MAP: Record<string, CompetitionType> = {
  "Liga": "LEAGUE",
  "Amistoso": "FRIENDLY",
  "Torneo Apertura": "SEASON",
  "Torneo Clausura": "SEASON",
  "Torneo Mundialito": "CUP",
  "Copa de Oro": "CUP",
};

interface TournamentData {
  id: string;
  name: string;
  competitionType: CompetitionType;
  startDate: Date;
  endDate: Date;
}

interface BuildTournamentsResult {
  data: TournamentData[];
  tournamentMap: IdMap;
}

/**
 * Group game rows by (torneo + year) to derive unique tournaments.
 * Each tournament gets:
 *  - name: "${year} ${torneo}"
 *  - startDate: earliest game date in that group
 *  - endDate: latest game date in that group
 *  - competitionType: mapped from torneo name
 */
export function buildTournaments(rows: ParsedHistorialRow[]): BuildTournamentsResult {
  // group key → { id, torneo, dates[] }
  const groups = new Map<
    string,
    { id: string; torneo: string; dates: Date[] }
  >();

  for (const row of rows) {
    const torneo = row.raw.Torneo.trim();
    const year = row.parsedDate.getUTCFullYear();
    const key = `${year} ${torneo}`;

    if (!groups.has(key)) {
      groups.set(key, { id: randomUUID(), torneo, dates: [] });
    }
    groups.get(key)!.dates.push(row.parsedDate);
  }

  const data: TournamentData[] = [];
  const tournamentMap: IdMap = {};

  for (const [key, { id, torneo, dates }] of groups) {
    const startDate = new Date(Math.min(...dates.map((d) => d.getTime())));
    const endDate = new Date(Math.max(...dates.map((d) => d.getTime())));
    const competitionType: CompetitionType =
      COMPETITION_TYPE_MAP[torneo] ?? "FRIENDLY";

    data.push({ id, name: key, competitionType, startDate, endDate });
    tournamentMap[key] = id;
  }

  return { data, tournamentMap };
}
