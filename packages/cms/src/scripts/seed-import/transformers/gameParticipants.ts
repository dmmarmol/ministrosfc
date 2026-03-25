import type { ParsedAparicionRow } from "../parsers/parseApariciones";
import type { IdMap } from "../types";

type ConfirmationStatus = "NOT_RESPONDED" | "CONFIRMED" | "DECLINED";

interface GameParticipantData {
  gameId: string;
  playerId: string;
  goalsScored: number;
  yellowCards: number;
  redCards: number;
  notes: string | null;
  confirmationStatus: ConfirmationStatus;
  assists: number;
  minutesPlayed: null;
  confirmedById: null;
}

interface SkippedRow {
  reason: string;
  gameKey: string;
  playerName: string;
}

interface BuildGameParticipantsResult {
  data: GameParticipantData[];
  skipped: SkippedRow[];
}

/**
 * Transform parsed Apariciones rows into GameParticipant records.
 * - Resolves gameId from gameMap using the pre-computed gameKey
 * - Resolves playerId by name (lowercase+trim) with nickname fallback
 * - Skips and warns rows where either lookup fails
 */
export function buildGameParticipants(
  rows: ParsedAparicionRow[],
  gameMap: IdMap,
  playerMapByName: IdMap,
  playerMapByNickname: IdMap
): BuildGameParticipantsResult {
  const data: GameParticipantData[] = [];
  const skipped: SkippedRow[] = [];

  for (const row of rows) {
    const { gameKey, raw } = row;

    const gameId = gameMap[gameKey];
    if (!gameId) {
      const msg = `[warn] GameParticipant skipped — no game found for key "${gameKey}"\n`;
      process.stderr.write(msg);
      skipped.push({ reason: "game_not_found", gameKey, playerName: raw.Jugador });
      continue;
    }

    const nameKey = raw.Jugador.trim().toLowerCase();
    const nicknameKey = raw.nickname.trim().toLowerCase();

    const playerId =
      playerMapByName[nameKey] ?? playerMapByNickname[nicknameKey];

    if (!playerId) {
      const msg = `[warn] GameParticipant skipped — no player found: name="${raw.Jugador}" nickname="${raw.nickname}"\n`;
      process.stderr.write(msg);
      skipped.push({ reason: "player_not_found", gameKey, playerName: raw.Jugador });
      continue;
    }

    data.push({
      gameId,
      playerId,
      goalsScored: parseIntOrZero(raw.Goles),
      yellowCards: parseIntOrZero(raw.Amarilla),
      redCards: parseIntOrZero(raw.Roja),
      notes: raw.Comentarios?.trim() || null,
      confirmationStatus: "CONFIRMED",
      assists: 0,
      minutesPlayed: null,
      confirmedById: null,
    });
  }

  return { data, skipped };
}

function parseIntOrZero(value: string | undefined): number {
  if (!value?.trim()) return 0;
  const n = parseInt(value.trim(), 10);
  return isNaN(n) ? 0 : n;
}
