# CLI Contract: seed-import script

**Feature**: 003-data-hydration | **Date**: March 23, 2026

This document defines the interface contract for the `seed-import` CLI script — its invocation syntax, input format, output format, and exit codes.

---

## Command

```
ts-node src/scripts/seed-import.ts [flags]
```

Via npm (preferred):

```bash
npm run seed:import              # full import
npm run seed:import -- --dry-run # dry run
npm run seed:import -- --input /custom/path
```

---

## Flags

| Flag             | Type    | Default                      | Description                                                        |
| ---------------- | ------- | ---------------------------- | ------------------------------------------------------------------ |
| `--dry-run`      | boolean | `false`                      | Parse and validate all CSVs; print plan; make zero DB writes       |
| `--input <path>` | string  | `packages/cms/data/imports/` | Directory containing the three CSV files                           |
| `--verbose`      | boolean | `false`                      | Print each row being processed (useful for debugging skipped rows) |

---

## Input Contract

### Required Files

The script expects exactly three files in the `--input` directory:

| Filename          | Required | Description                                  |
| ----------------- | -------- | -------------------------------------------- |
| `Historial.csv`   | ✅ Yes   | Game records — one row per game              |
| `Jugadores.csv`   | ✅ Yes   | Player roster — one row per player           |
| `Apariciones.csv` | ✅ Yes   | Player appearances — one row per player-game |

If any required file is missing, the script exits with code `1` and prints an error message before touching the database.

### File Format

- Encoding: **UTF-8**
- Delimiter: **comma** (`,`)
- Header row: **first row** (column names must exactly match expected headers)
- Quoted fields: standard CSV quoting (`"value with, comma"`)

### Expected Column Headers

**`Historial.csv`** (exact names, 15 named columns):

```
Fecha, Torneo, Comienzo, Finalización, Equipo, Rival, Estadio,
Goles Convertidos, Goles Recibidos, Resultado, Conclusión, Apariciones, DT, Comentarios, Foto
```

**`Jugadores.csv`** (exact names, 11 named columns):

```
Jugador (61), Apodo, Nacimiento, Edad, Altura, Numero, Pie, Posición, DNI, Telefono, Imagen (URL)
```

> Note: The "61" in `Jugador (61)` is the current player count embedded in the header. The script matches this column by detecting the key starting with `Jugador`. If the count changes, the column will still be resolved correctly.

**`Apariciones.csv`** (exact names for key columns):

```
Fecha, Rival, Torneo, Resultado, [col5], Jugador, Jugador, Goles, Amarilla, Roja, Titular/Suplente, Comentarios
```

> Note: Column 5 (index 4) has no header (empty) but contains the match result type (G/P/E). Column 7 is also named `Jugador` (nickname). The script accesses these by position index.

---

## Output Contract

### Standard (non-dry-run) output to `stdout`:

```
[import] Starting import from /path/to/imports/
[import] Reading Historial.csv... 63 rows
[import] Reading Jugadores.csv... 61 rows
[import] Reading Apariciones.csv... 703 rows

[import] Derived: 26 unique opponent teams
[import] Derived: 9 unique tournaments
[import] Truncating tables...

[import] Inserting OpponentTeams... ✓ 26 inserted
[import] Inserting Tournaments...   ✓ 9 inserted
[import] Inserting Players...       ✓ 61 inserted
[import] Inserting Contacts...      ✓ 29 inserted
[import] Inserting Games...         ✓ 63 inserted
[import] Inserting GameParticipants... ✓ 701 inserted (2 skipped)

[import] ✅ Import complete in 4.2s
```

### Dry-run output to `stdout`:

```
[dry-run] Parsing all files...
[dry-run] OpponentTeams:      26 records would be inserted
[dry-run] Tournaments:        9 records would be inserted
[dry-run] Players:            61 records would be inserted
[dry-run] Contacts:           29 records would be inserted
[dry-run] Games:              63 records would be inserted
[dry-run] GameParticipants:   701 records would be inserted (2 would be skipped)
[dry-run] No database writes performed.
```

### Warning output to `stderr`:

```
[warn] Row 42: player name "SMF" position discarded; "LB" used instead
[warn] Row 78: opponent "Unkn" not found in game map — GameParticipant row skipped
[warn] Row 103: player "Pepito" not found in player map — GameParticipant row skipped
```

---

## Exit Codes

| Code | Meaning                                                             |
| ---- | ------------------------------------------------------------------- |
| `0`  | Import completed successfully (or dry-run completed with no errors) |
| `1`  | Missing required input file(s)                                      |
| `2`  | CSV parsing error (malformed file)                                  |
| `3`  | Database connection error                                           |
| `4`  | Database transaction error (imported partially; rolled back)        |

---

## Environment Variables

| Variable       | Required | Description                                                                          |
| -------------- | -------- | ------------------------------------------------------------------------------------ |
| `DATABASE_URL` | ✅ Yes   | PostgreSQL connection string; read from `packages/cms/.env` (via `-r dotenv/config`) |

---

## Idempotency Guarantee

Running the script multiple times with identical input files produces identical database state. The Full Replace strategy (truncate + re-insert) ensures no duplicate data accumulates.

Side effects:

- All `OpponentTeam`, `Tournament`, `Player`, `Contact`, `Game`, `GameParticipant` records are replaced
- `Statistics` records are truncated (this import does not populate Statistics)
- `User`, `TeamInfo` records are NOT touched (not in scope of this import)
