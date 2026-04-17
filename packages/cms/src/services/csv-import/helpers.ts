/**
 * Pure helper functions for CSV parsing and value transformation.
 * No side-effects, no DB access.
 */
import { parse } from "csv-parse/sync";
import { randomUUID } from "crypto";
import { Foot } from "@prisma/client";
import { Position } from "@ministrosfc/shared";

// ─── CSV parsing ──────────────────────────────────────────────────────────────

export function parseCsv(buffer: Buffer): Record<string, string>[] {
  return parse(buffer, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    relax_column_count: true,
  }) as Record<string, string>[];
}

/**
 * Ensures every data row in a CSV buffer has a stable UUID in `idColumn`.
 *
 * - If `idColumn` is absent from the header, it is prepended.
 * - If a row already has a non-empty UUID in that column, it is preserved.
 * - Empty/missing values are filled with a freshly generated UUID.
 *
 * The function also handles the special case of *duplicate column names*
 * (e.g. two "Jugador" columns in apariciones.csv): when `resolveColumns` is
 * provided, each entry maps an ambiguous header to a stable replacement name
 * before ID injection — so the returned buffer has unambiguous headers
 * that downstream `parseCsv` calls can address correctly.
 *
 * @param buf             Raw CSV buffer (any encoding parseable by csv-parse).
 * @param idColumn        Header name for the UUID column (e.g. "ID", "JugadorID").
 * @param resolveColumns  Optional map of { originalHeader → newHeader } for
 *                        duplicate-column disambiguation. Applied left-to-right,
 *                        so later occurrences of the same header get a different name.
 *                        Example: { "Jugador": { occurrenceIndex: 1, newName: "JugadorNickname" } }
 *
 * @returns A new Buffer with the CSV content including the ID column.
 */
export function ensureExternalIds(
  buf: Buffer,
  idColumn: string,
  resolveColumns?: Array<{
    header: string;
    occurrenceIndex: number;
    newName: string;
  }>,
): Buffer {
  const raw = buf.toString("utf8");
  const lines = raw.split(/\r?\n/);
  if (lines.length === 0) return buf;

  // Parse header — handle duplicate names
  const headerLine = lines[0]!;
  const headerCols = splitCsvLine(headerLine);

  // Apply column renames (disambiguation)
  if (resolveColumns) {
    const seen: Record<string, number> = {};
    for (let i = 0; i < headerCols.length; i++) {
      const col = headerCols[i]!;
      seen[col] = (seen[col] ?? -1) + 1;
      const rule = resolveColumns.find(
        (r) => r.header === col && r.occurrenceIndex === seen[col],
      );
      if (rule) headerCols[i] = rule.newName;
    }
  }

  const idIdx = headerCols.indexOf(idColumn);
  const hasIdCol = idIdx !== -1;

  // Build output header
  const outHeader = hasIdCol ? headerCols : [idColumn, ...headerCols];
  const outLines: string[] = [outHeader.join(",")];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    if (!line.trim()) {
      outLines.push(line);
      continue;
    }

    const cols = splitCsvLine(line);

    if (hasIdCol) {
      const existing = cols[idIdx]?.trim();
      if (!existing || !/^[0-9a-f-]{36}$/i.test(existing)) {
        cols[idIdx] = randomUUID();
      }
      outLines.push(cols.join(","));
    } else {
      outLines.push([randomUUID(), ...cols].join(","));
    }
  }

  return Buffer.from(outLines.join("\n"), "utf8");
}

/** Minimal CSV line splitter that handles double-quoted fields. */
function splitCsvLine(line: string): string[] {
  const result: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]!;
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else inQuotes = !inQuotes;
    } else if (ch === "," && !inQuotes) {
      result.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  result.push(cur);
  return result;
}

// ─── Date helpers ─────────────────────────────────────────────────────────────

/** Parse DD/MM/YYYY or YYYY/MM/DD → JS Date. Returns null for blank/invalid. */
export function parseDate(raw: string): Date | null {
  if (!raw || raw.trim() === "") return null;
  const s = raw.trim();
  // DD/MM/YYYY
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) {
    const [d, m, y] = s.split("/");
    return new Date(`${y}-${m}-${d}T00:00:00.000Z`);
  }
  // YYYY/MM/DD
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(s)) {
    const [y, m, d] = s.split("/");
    return new Date(`${y}-${m}-${d}T00:00:00.000Z`);
  }
  return null;
}

/** Parse a date of birth string → "YYYY-MM-DD" string, or null. */
export function parseDOB(raw: string): string | null {
  const d = parseDate(raw);
  if (!d) return null;
  return d.toISOString().slice(0, 10);
}

// ─── String helpers ───────────────────────────────────────────────────────────

/** "Jugador (62)" → "Jugador" */
export function stripCountAnnotation(header: string): string {
  return header.replace(/\s*\(\d+\)\s*$/, "").trim();
}

/**
 * Split a full name into firstName + lastName.
 * First whitespace-separated token → firstName; remainder → lastName.
 * Example: "Juan García López" → { firstName: "Juan", lastName: "García López" }
 */
export function splitName(full: string): {
  firstName: string;
  lastName: string;
} {
  const parts = full.trim().split(/\s+/);
  if (parts.length === 1) return { firstName: parts[0]!, lastName: "-" };
  const firstName = parts[0]!;
  const lastName = parts.slice(1).join(" ");
  return { firstName, lastName };
}

// ─── Value mappers ────────────────────────────────────────────────────────────

/** "Diestro" | "Zurdo" | "Ambidiestro" → Foot enum, null if unrecognised. */
export function mapFoot(raw: string): Foot | null {
  const v = raw?.trim().toLowerCase();
  if (v === "diestro") return Foot.RIGHT;
  if (v === "zurdo") return Foot.LEFT;
  if (v === "ambidiestro" || v === "ambidextro") return Foot.AMBIDEXTROUS;
  return null;
}
const positionMap: Record<Position, string> = {
  [Position.GK]: "GK",
  [Position.CB]: "CB",
  [Position.RB]: "RB",
  [Position.LB]: "LB",
  [Position.RWB]: "RWB",
  [Position.LWB]: "LWB",
  [Position.DMF]: "DMF",
  [Position.CMF]: "CMF",
  [Position.AMF]: "AMF",
  [Position.RMF]: "RMF",
  [Position.LMF]: "LMF",
  [Position.SS]: "SS",
  [Position.CF]: "CF",
  [Position.RWF]: "RWF",
  [Position.LWF]: "LWF",
};

/**
 * Map a raw position string to a position code.
 * Accepts a comma-separated list — only the first value is used.
 * Example: "Delantero, Mediocampista" → "CF"
 */
export function mapPosition(raw: string): string | null {
  const first = raw?.split(",")[0] ?? "";
  const v = first.trim() as Position;

  return positionMap[v] ?? null;
}
