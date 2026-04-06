/**
 * Raw CSV row types — one interface per source file.
 * All fields are strings as delivered by csv-parse (columns: true).
 * Coercion (parseInt, Date parsing, enum mapping) happens in the transformer layer.
 */

// ─────────────────────────────────────────────────────────────
// Historial.csv  (one row per game)
// Columns: Fecha, Torneo, Comienzo, Finalización, Equipo, Rival,
//          Estadio, Goles Convertidos, Goles Recibidos, Resultado,
//          Conclusión, Apariciones, DT, Comentarios, Foto
// ─────────────────────────────────────────────────────────────
export interface HistorialRow {
  Fecha: string; // DD/MM/YYYY
  Torneo: string;
  Comienzo: string; // HH:MM start time
  Finalización: string; // HH:MM end time
  Equipo: string; // Our team name (constant — not stored)
  Rival: string; // → OpponentTeam.name
  Estadio: string; // → Game.location
  "Goles Convertidos": string; // → Game.homeTeamScore
  "Goles Recibidos": string; // → Game.awayTeamScore
  Resultado: string; // "N-N" — validation only
  Conclusión: string; // G | P | E | FALSE | ""
  Apariciones: string; // count — not stored
  DT: string; // → Game.notes prefix
  Comentarios: string; // → Game.notes suffix
  Foto: string; // not stored
}

// ─────────────────────────────────────────────────────────────
// Jugadores.csv  (one row per player)
// Columns: Jugador (N), Apodo, Nacimiento, Edad, Altura,
//          Numero, Pie, Posición, DNI, Telefono, Imagen (URL)
// Note: the "N" in "Jugador (N)" is the current player count
//       and changes when players are added/removed.
// ─────────────────────────────────────────────────────────────
export interface JugadorRow {
  // The player column is keyed dynamically (startsWith "Jugador")
  // After normalisation the loader maps it to the standard field below.
  firstName: string; // → Player.firstName
  lastName: string; // → Player.lastName
  Apodo: string; // → Player.nickname  ("??" → null)
  Nacimiento: string; // DD/MM/YYYY or similar → Player.dateOfBirth
  Edad: string; // numeric string — not stored (derived from dateOfBirth)
  Altura: string; // numeric string (cm) → Player.height
  Numero: string; // numeric string → Player.jerseyNumber
  Pie: string; // Zurdo | Diestro | Ambidiestro → Player.dominantFoot
  Posición: string; // comma-separated list → Player.position (first valid)
  DNI: string; // → Player.nationalId
  Telefono: string; // → Contact.phone (only when non-empty)
  "Imagen (URL)": string; // always overridden with placeholder URL
}

// ─────────────────────────────────────────────────────────────
// Apariciones.csv  (one row per player-game appearance)
// Columns (by position):
//   0: Fecha        YYYY/MM/DD
//   1: Rival        opponent name
//   2: Torneo       tournament name — not used for lookup
//   3: Resultado    "N-N" — validation only
//   4: (unnamed)    G | P | E — validation only
//   5: Jugador      player name (primary lookup)
//   6: Jugador      player nickname (fallback lookup)
//   7: Goles
//   8: Amarilla
//   9: Roja
//  10: Titular/Suplente  — not stored
//  11: Comentarios
// ─────────────────────────────────────────────────────────────
export interface AparicionRow {
  Fecha: string; // YYYY/MM/DD
  Rival: string; // → game lookup key (rival part)
  Torneo: string; // validation — not used for lookup
  Resultado: string; // validation only
  // Column 4 has no header — accessed by positional index in the parser
  // and NOT included in this typed interface.
  Jugador: string; // player name column (col 5 / first "Jugador" header)
  nickname: string; // player nickname column (col 6 / second "Jugador" header)
  Goles: string; // → GameParticipant.goalsScored
  Amarilla: string; // → GameParticipant.yellowCards
  Roja: string; // → GameParticipant.redCards
  "Titular/Suplente": string; // not stored — logged and discarded
  Comentarios: string; // → GameParticipant.notes
}

// ─────────────────────────────────────────────────────────────
// In-memory lookup maps
// key  → Prisma record UUID pre-generated with crypto.randomUUID()
// ─────────────────────────────────────────────────────────────
export type IdMap = Record<string, string>;

// Shared lookup-map bundle used across transformer pipeline
export interface LookupMaps {
  opponentTeamMap: IdMap; // 'La Cocina' → uuid
  tournamentMap: IdMap; // '2024 Amistoso' → uuid
  playerMapByName: IdMap; // 'diego marmol' → uuid
  playerMapByNickname: IdMap; // 'dieguito' → uuid
  gameMap: IdMap; // '2023-09-09:la cocina' → uuid
}
