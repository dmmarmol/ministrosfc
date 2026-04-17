/**
 * Column mapping definitions for each CSV file.
 *
 * Each `*_COLUMN_MAP` object documents the relationship between the CSV
 * column header (key) and the target database field (value).
 *
 * Each `*Cols` object holds the CSV column header strings as typed constants
 * so they can be used directly as row accessors — e.g. `row[JugadoresCols.apodo]`.
 * This eliminates magic strings in service logic and ensures a single source of truth.
 */

// ─── jugadores.csv ────────────────────────────────────────────────────────────

/**
 * Maps every jugadores.csv column header to the Player / Contact DB field it populates.
 * "Edad" is intentionally absent — age is derived at read-time from dateOfBirth, never stored.
 */
export type JugadoresColumn =
  | "ID"
  | "Nombre"
  | "Apodo"
  | "Invitado Por"
  | "Nacimiento"
  | "Altura"
  | "Numero"
  | "Pie"
  | "Posición"
  | "DNI"
  | "Telefono"
  | "Imagen (URL)";

export const JUGADORES_COLUMN_MAP: Record<JugadoresColumn, string> = {
  ID: "Player.externalId", // stable UUID assigned in CSV
  Nombre: "firstName + lastName", // split on first space
  Apodo: "Player.nickname",
  "Invitado Por": "Player.invitedById", // resolved via name lookup (second pass)
  Nacimiento: "Player.dateOfBirth", // DD/MM/YYYY → YYYY-MM-DD
  Altura: "Player.height", // integer cm
  Numero: "Player.jerseyNumber", // integer
  Pie: "Player.dominantFoot", // Diestro|Zurdo|Ambidiestro → Foot enum
  Posición: "Player.position", // first comma-separated value only
  DNI: "Player.nationalId",
  Telefono: "Contact.phone + Contact.whatsapp",
  "Imagen (URL)": "Player.photoUrl",
} as const;

/** jugadores.csv column header enum — values are enforced against JugadoresColumn. */
export enum JugadoresCols {
  id = "ID",
  nombre = "Nombre",
  apodo = "Apodo",
  invitadoPor = "Invitado Por",
  nacimiento = "Nacimiento",
  // "Edad" intentionally omitted — age is auto-derived from dateOfBirth at read-time
  altura = "Altura",
  numero = "Numero",
  pie = "Pie",
  posicion = "Posición",
  dni = "DNI",
  telefono = "Telefono",
  imagenUrl = "Imagen (URL)",
}
// Compile-time guard: every enum value must be a valid JugadoresColumn
void (Object.values(JugadoresCols) satisfies JugadoresColumn[]);

// ─── historial.csv ────────────────────────────────────────────────────────────

/**
 * Maps every historial.csv column header to the Game / Tournament / OpponentTeam DB field.
 * "Equipo", "Resultado", and "Apariciones" are intentionally absent — they are ignored during import.
 */
export type HistorialColumn =
  | "Fecha"
  | "Torneo"
  | "Comienzo"
  | "Finalización"
  | "Rival"
  | "Estadio"
  | "Goles Convertidos"
  | "Goles Recibidos"
  | "Conclusión"
  | "DT"
  | "Comentarios"
  | "Foto";

export const HISTORIAL_COLUMN_MAP: Record<HistorialColumn, string> = {
  Fecha: "Game.date", // DD/MM/YYYY → DateTime
  Torneo: "Tournament.name", // upsert by name
  Comienzo: "Game.startTime", // string HH:MM
  Finalización: "Game.endTime", // string HH:MM
  Rival: "OpponentTeam.name", // upsert by name
  Estadio: "Game.location", // free-text; also used for playgroundId linking
  "Goles Convertidos": "Game.homeTeamScore", // integer
  "Goles Recibidos": "Game.awayTeamScore", // integer
  Conclusión: "(validation only)", // G/P/E cross-checked vs scores, not stored
  DT: "Game.coach",
  Comentarios: "Game.notes",
  Foto: "Game.photoUrl",
} as const;

/** historial.csv column header enum — values are enforced against HistorialColumn. */
export enum HistorialCols {
  fecha = "Fecha",
  torneo = "Torneo",
  comienzo = "Comienzo",
  finalizacion = "Finalización",
  rival = "Rival",
  estadio = "Estadio",
  golesConvertidos = "Goles Convertidos",
  golesRecibidos = "Goles Recibidos",
  // "Equipo", "Resultado", "Apariciones" intentionally omitted — ignored during import
  dt = "DT",
  comentarios = "Comentarios",
  foto = "Foto",
}
// Compile-time guard: every enum value must be a valid HistorialColumn
void (Object.values(HistorialCols) satisfies HistorialColumn[]);

// ─── apariciones.csv ──────────────────────────────────────────────────────────

/**
 * Maps every apariciones.csv column header to the GameParticipant DB field.
 * Columns 1–4 are used as game-lookup keys, not stored directly.
 */
export type AparicionesColumn =
  | "Fecha"
  | "Rival"
  | "Torneo"
  | "Resultado"
  | "Jugador"
  | "JugadorID"
  | "Goles"
  | "Amarilla"
  | "Roja"
  | "Asistencia"
  | "Titular/Suplente"
  | "Comentarios";

export const APARICIONES_COLUMN_MAP: Record<AparicionesColumn, string> = {
  Fecha: "(game lookup key)", // YYYY/MM/DD
  Rival: "(game lookup key)",
  Torneo: "(game lookup key)",
  Resultado: "(game lookup key)", // cross-check only
  Jugador: "GameParticipant.playerId", // resolved via name lookup (fallback)
  JugadorID: "GameParticipant.playerId", // resolved via Player.externalId (preferred)
  Goles: "GameParticipant.goalsScored",
  Amarilla: "GameParticipant.yellowCards",
  Roja: "GameParticipant.redCards",
  Asistencia: "GameParticipant.assists",
  "Titular/Suplente": "GameParticipant.isStarter", // Titular→true, Suplente→false, blank→null
  Comentarios: "GameParticipant.notes",
} as const;

/** apariciones.csv column header enum — values are enforced against AparicionesColumn. */
export enum AparicionesCols {
  fecha = "Fecha",
  rival = "Rival",
  torneo = "Torneo",
  // "Resultado" intentionally omitted — used for cross-check only, not stored
  jugador = "Jugador",
  jugadorId = "JugadorID",
  goles = "Goles",
  amarilla = "Amarilla",
  roja = "Roja",
  asistencia = "Asistencia",
  titularSuplente = "Titular/Suplente",
  comentarios = "Comentarios",
}
// Compile-time guard: every enum value must be a valid AparicionesColumn
void (Object.values(AparicionesCols) satisfies AparicionesColumn[]);

// ─── canchas.csv ──────────────────────────────────────────────────────────────

/**
 * Maps every canchas.csv column header to the Playground DB field.
 * Latitud and Longitud are optional — the import proceeds without them.
 */
export type CanchasColumn = "Nombre" | "Dirección" | "Latitud" | "Longitud";

export const CANCHAS_COLUMN_MAP: Record<CanchasColumn, string> = {
  Nombre: "Playground.name", // upsert key (case-insensitive, trimmed)
  Dirección: "Playground.address",
  Latitud: "Playground.latitude", // optional Float
  Longitud: "Playground.longitude", // optional Float
} as const;

/** canchas.csv column header enum — values are enforced against CanchasColumn. */
export enum CanchasCols {
  cancha = "Nombre",
  direccion = "Dirección",
  latitud = "Latitud",
  longitud = "Longitud",
}
// Compile-time guard: every enum value must be a valid CanchasColumn
void (Object.values(CanchasCols) satisfies CanchasColumn[]);
