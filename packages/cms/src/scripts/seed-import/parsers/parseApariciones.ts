import { parse } from "csv-parse/sync";
import type { AparicionRow } from "../types";

export interface ParsedAparicionRow {
  /** Composite game lookup key: "YYYY-MM-DD:rival-trimmed-lowercase" */
  gameKey: string;
  raw: AparicionRow;
}

// Column indices for Apariciones.csv (0-based)
const COL = {
  FECHA: 0,
  RIVAL: 1,
  TORNEO: 2,
  RESULTADO: 3,
  // col 4: unnamed — match result type (G/P/E) — not stored
  JUGADOR_NAME: 5,
  JUGADOR_NICKNAME: 6,
  GOLES: 7,
  AMARILLA: 8,
  ROJA: 9,
  TITULAR_SUPLENTE: 10,
  COMENTARIOS: 11,
};

/**
 * Parse Apariciones.csv content into structured rows.
 *
 * Uses columns:false (array mode) to handle the two duplicate "Jugador" column
 * headers correctly. When columns:true is used, csv-parse merges duplicate
 * headers and only retains the last value — losing the player name (col 5).
 * Accessing by positional index sidesteps this limitation entirely.
 *
 * Column layout (0-indexed):
 *   0: Fecha (YYYY/MM/DD), 1: Rival, 2: Torneo, 3: Resultado,
 *   4: (unnamed — G/P/E), 5: Jugador (name), 6: Jugador (nickname),
 *   7: Goles, 8: Amarilla, 9: Roja, 10: Titular/Suplente, 11: Comentarios
 *
 * Skips: the header row, rows where player name column is empty.
 */
export function parseApariciones(csvContent: string): ParsedAparicionRow[] {
  const allRows = parse(csvContent, {
    columns: false,
    skip_empty_lines: true,
    trim: true,
  }) as string[][];

  const results: ParsedAparicionRow[] = [];

  // Skip the header row (first row)
  for (let i = 1; i < allRows.length; i++) {
    const row = allRows[i];
    if (!row) continue;

    const playerName = (row[COL.JUGADOR_NAME] ?? "").trim();
    if (!playerName) continue;

    const rawDate = (row[COL.FECHA] ?? "").trim();
    // YYYY/MM/DD → YYYY-MM-DD
    const isoDate = rawDate.replace(/\//g, "-");
    const rival = (row[COL.RIVAL] ?? "").trim().toLowerCase();
    const gameKey = `${isoDate}:${rival}`;

    const typed: AparicionRow = {
      Fecha: rawDate,
      Rival: (row[COL.RIVAL] ?? "").trim(),
      Torneo: (row[COL.TORNEO] ?? "").trim(),
      Resultado: (row[COL.RESULTADO] ?? "").trim(),
      Jugador: playerName,
      nickname: (row[COL.JUGADOR_NICKNAME] ?? "").trim(),
      Goles: (row[COL.GOLES] ?? "0").trim(),
      Amarilla: (row[COL.AMARILLA] ?? "0").trim(),
      Roja: (row[COL.ROJA] ?? "0").trim(),
      "Titular/Suplente": (row[COL.TITULAR_SUPLENTE] ?? "").trim(),
      Comentarios: (row[COL.COMENTARIOS] ?? "").trim(),
    };

    results.push({ gameKey, raw: typed });
  }

  return results;
}
