import { parse } from "csv-parse/sync";
import type { HistorialRow } from "../types";

export interface ParsedHistorialRow {
  raw: HistorialRow;
  parsedDate: Date;
}

/**
 * Parse Historial.csv content into structured rows.
 *
 * Skips rows where:
 * - Rival is empty
 * - Fecha is empty or cannot be parsed as DD/MM/YYYY
 * - Conclusión === "FALSE" (placeholder rows at the end of the sheet)
 */
export function parseHistorial(csvContent: string): ParsedHistorialRow[] {
  const rawRows = parse(csvContent, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  }) as Array<Record<string, string>>;

  const results: ParsedHistorialRow[] = [];

  for (const row of rawRows) {
    // Normalise the row — map actual CSV headers to our typed interface.
    // All fields are accessed by their exact CSV header name.
    const typed = row as unknown as HistorialRow;

    if (!typed.Rival?.trim()) continue;
    if (!typed.Fecha?.trim()) continue;
    if (typed["Conclusión"]?.trim() === "FALSE") continue;

    const parsedDate = parseDDMMYYYY(typed.Fecha.trim());
    if (!parsedDate) continue;

    results.push({ raw: typed, parsedDate });
  }

  return results;
}

/**
 * Parse a date string in DD/MM/YYYY format to a UTC Date.
 * Returns null for any unparseable input.
 */
export function parseDDMMYYYY(value: string): Date | null {
  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const dayStr = match[1];
  const monthStr = match[2];
  const yearStr = match[3];
  if (!dayStr || !monthStr || !yearStr) return null;
  const day = parseInt(dayStr, 10);
  const month = parseInt(monthStr, 10);
  const year = parseInt(yearStr, 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const d = new Date(Date.UTC(year, month - 1, day));
  // Guard against Date overflow (e.g. Feb 31)
  if (d.getUTCMonth() !== month - 1) return null;
  return d;
}
