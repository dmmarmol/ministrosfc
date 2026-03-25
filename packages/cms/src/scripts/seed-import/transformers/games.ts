import { randomUUID } from "crypto";
import type { ParsedHistorialRow } from "../parsers/parseHistorial";
import type { IdMap } from "../types";

type GameStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
type CompetitionType = "FRIENDLY" | "LEAGUE" | "CUP" | "PLAYOFF" | "SEASON";

const COMPETITION_TYPE_MAP: Record<string, CompetitionType> = {
  Liga: "LEAGUE",
  Amistoso: "FRIENDLY",
  "Torneo Apertura": "SEASON",
  "Torneo Clausura": "SEASON",
  "Torneo Mundialito": "CUP",
  "Copa de Oro": "CUP",
};

const COMPLETED_CONCLUSIONES = new Set(["G", "P", "E"]);

interface GameData {
  id: string;
  date: Date;
  opponentTeamId: string;
  tournamentId: string | null;
  location: string | null;
  competitionType: CompetitionType;
  homeTeamScore: number | null;
  awayTeamScore: number | null;
  status: GameStatus;
  notes: string | null;
  possession: null;
  shotsOnTarget: null;
  fouls: null;
}

interface BuildGamesResult {
  data: GameData[];
  gameMap: IdMap;
}

/**
 * Transform parsed Historial rows into Game records.
 * Resolves FKs from pre-built lookup maps.
 * Builds the gameMap keyed by "YYYY-MM-DD:rival-lowercase".
 */
export function buildGames(
  rows: ParsedHistorialRow[],
  opponentTeamMap: IdMap,
  tournamentMap: IdMap,
): BuildGamesResult {
  const data: GameData[] = [];
  const gameMap: IdMap = {};

  for (const row of rows) {
    const { raw, parsedDate } = row;

    const rival = raw.Rival.trim();
    const opponentTeamId = opponentTeamMap[rival];
    if (!opponentTeamId) continue; // should never happen given buildOpponentTeams ran first

    const year = parsedDate.getUTCFullYear();
    const torneo = raw.Torneo.trim();
    const tournamentKey = `${year} ${torneo}`;
    const tournamentId = tournamentMap[tournamentKey] ?? null;

    const competitionType: CompetitionType =
      COMPETITION_TYPE_MAP[torneo] ?? "FRIENDLY";

    const status: GameStatus = COMPLETED_CONCLUSIONES.has(
      raw["Conclusión"]?.trim(),
    )
      ? "COMPLETED"
      : "SCHEDULED";

    const notes = assembleNotes(
      raw.DT,
      raw.Comienzo,
      raw["Finalización"],
      raw.Comentarios,
    );

    const id = randomUUID();

    const isoDate = parsedDate.toISOString().slice(0, 10); // YYYY-MM-DD
    const gameKey = `${isoDate}:${rival.toLowerCase()}`;

    data.push({
      id,
      date: parsedDate,
      opponentTeamId,
      tournamentId,
      location: raw.Estadio?.trim() || null,
      competitionType,
      homeTeamScore: parseIntOrNull(raw["Goles Convertidos"]),
      awayTeamScore: parseIntOrNull(raw["Goles Recibidos"]),
      status,
      notes,
      possession: null,
      shotsOnTarget: null,
      fouls: null,
    });
    gameMap[gameKey] = id;
  }

  return { data, gameMap };
}

function parseIntOrNull(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const n = parseInt(value.trim(), 10);
  return isNaN(n) ? null : n;
}

function assembleNotes(
  dt: string,
  start: string,
  end: string,
  comentarios: string,
): string | null {
  const parts: string[] = [];
  if (dt?.trim()) parts.push(`DT: ${dt.trim()}`);
  if (start?.trim() && end?.trim())
    parts.push(`Horario: ${start.trim()}–${end.trim()}`);
  if (comentarios?.trim()) parts.push(comentarios.trim());
  return parts.length > 0 ? parts.join("\n") : null;
}
