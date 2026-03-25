import { randomUUID } from "crypto";
import type { ParsedHistorialRow } from "../parsers/parseHistorial";
import type { IdMap } from "../types";

interface OpponentTeamData {
  id: string;
  name: string;
}

interface BuildOpponentTeamsResult {
  data: OpponentTeamData[];
  opponentTeamMap: IdMap;
}

/**
 * Extract unique opponent team names from game rows and pre-generate UUIDs.
 * The map is keyed by the original trimmed name (not lowercased) to match
 * the lookup in buildGames.
 */
export function buildOpponentTeams(
  rows: ParsedHistorialRow[],
): BuildOpponentTeamsResult {
  const seen = new Map<string, string>(); // trimmed name → uuid

  for (const row of rows) {
    const name = row.raw.Rival.trim();
    if (name && !seen.has(name)) {
      seen.set(name, randomUUID());
    }
  }

  const data: OpponentTeamData[] = [];
  const opponentTeamMap: IdMap = {};

  for (const [name, id] of seen) {
    data.push({ id, name });
    opponentTeamMap[name] = id;
  }

  return { data, opponentTeamMap };
}
