import { parse } from "csv-parse/sync";
import type { JugadorRow } from "../types";

// The parsed row normalises the dynamic "Jugador (N)" header to stable `firstName`/`lastName` fields.
// Both "firstName"/"lastName" and "Apodo" are omitted from the base type so they can be redefined.
export type ParsedJugadorRow = Omit<
  JugadorRow,
  "firstName" | "lastName" | "Apodo"
> & {
  firstName: string;
  lastName: string;
  Apodo: string | null;
};

/**
 * Parse Jugadores.csv content into structured rows.
 *
 * - Detects the player name column by finding the key that starts with "Jugador"
 * - Coerces "??" Apodo to null
 * - Skips rows where the player name is empty
 */
export function parseJugadores(csvContent: string): ParsedJugadorRow[] {
  const rawRows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string>>;

  const results: ParsedJugadorRow[] = [];

  for (const row of rawRows) {
    // Detect the dynamic-header name column and split into first/last
    const nameKey = Object.keys(row).find((k) => k.startsWith("Jugador"));
    const fullName = nameKey ? row[nameKey]?.trim() : "";

    if (!fullName) continue;

    const spaceIdx = fullName.indexOf(" ");
    const firstName = spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName;
    const lastName = spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : "";

    const rawApodo = row["Apodo"]?.trim() ?? "";
    const apodo = rawApodo === "" || rawApodo === "??" ? null : rawApodo;

    results.push({
      firstName,
      lastName,
      Apodo: apodo,
      Nacimiento: row["Nacimiento"] ?? "",
      Edad: row["Edad"] ?? "",
      Altura: row["Altura"] ?? "",
      Numero: row["Numero"] ?? "",
      Pie: row["Pie"] ?? "",
      Posición: row["Posición"] ?? "",
      DNI: row["DNI"] ?? "",
      Telefono: row["Telefono"] ?? "",
      "Imagen (URL)": row["Imagen (URL)"] ?? "",
    });
  }

  return results;
}
