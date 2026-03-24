# Quickstart: Running the Data Import

**Feature**: 003-data-hydration | **Updated**: March 23, 2026

This guide explains how to export data from Google Sheets and import it into the local PostgreSQL database.

---

## Prerequisites

1. **Docker / Podman containers running**:
   ```bash
   npm run docker:up
   ```
   Verify: `ministrosfc-postgres` is healthy on port 5100.

2. **Prisma schema applied**:
   ```bash
   npm run gen:prisma
   ```

3. **`packages/cms/.env` configured** with a valid `DATABASE_URL`:
   ```
   DATABASE_URL="postgresql://ministrosfc:ministrosfc@localhost:5100/ministrosfc?schema=public"
   ```

4. **Node.js 20+ and npm** installed (via nvm: `nvm use`).

5. **Import directory exists** (created by the script on first run, but verify):
   ```bash
   ls packages/cms/data/imports/
   ```

---

## Step 1 — Export CSVs from Google Sheets

Open `Ministros F.C. - Datos` in Google Sheets.

Export **each of these three tabs** as a separate CSV file:

| Tab name | Download as | Save as |
|---|---|---|
| `Historial` | File → Download → CSV | `Historial.csv` |
| `Jugadores` | File → Download → CSV | `Jugadores.csv` |
| `Apariciones` | File → Download → CSV | `Apariciones.csv` |

> **Note**: Google Sheets CSV export preserves the exact column names and formats the script expects. Do not modify the exported files before importing.

---

## Step 2 — Place CSVs in the Import Directory

Copy (or move) all three files to:

```
packages/cms/data/imports/
├── Historial.csv
├── Jugadores.csv
└── Apariciones.csv
```

These files are `.gitignore`d — they will never be committed.

---

## Step 3 — Dry Run (Recommended)

Preview what will be imported without touching the database:

```bash
npm run seed:import -- --dry-run
```

Expected console output:
```
[dry-run] OpponentTeams: 26 records would be inserted
[dry-run] Tournaments:   9 records would be inserted
[dry-run] Players:       61 records would be inserted
[dry-run] Contacts:      ~30 records would be inserted
[dry-run] Games:         ~63 records would be inserted
[dry-run] GameParticipants: ~700+ records would be inserted
[dry-run] Rows skipped:  0
```

---

## Step 4 — Run the Full Import

```bash
npm run seed:import
```

Expected console output:
```
[import] Truncating tables...
[import] Inserting OpponentTeams... 26 inserted
[import] Inserting Tournaments...   9 inserted
[import] Inserting Players...       61 inserted
[import] Inserting Contacts...      29 inserted
[import] Inserting Games...         63 inserted
[import] Inserting GameParticipants... 703 inserted (2 skipped)
[import] ✅ Import complete in 4.2s
```

---

## Step 5 — Verify via API

With the CMS running (`npm run dev:all`), verify the data:

```bash
# All players
curl http://localhost:5102/api/v1/players | jq 'length'
# → 61

# All opponent teams
curl http://localhost:5102/api/v1/teams | jq 'length'
# → 26

# All games
curl http://localhost:5102/api/v1/games | jq 'length'
# → ~63
```

---

## Re-running the Import

The import is **idempotent via Full Replace**: running it again with the same files produces an identical database state.

```bash
# After updating the spreadsheet and re-exporting CSVs:
npm run seed:import
```

> ⚠️ **Warning**: This truncates and re-inserts ALL data. Any records created directly in the CMS since the last import will be **permanently lost**. Run this only while the CMS is not yet in active production use. See SC-006 in the spec for the retirement rule.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `DATABASE_URL missing` | Check `packages/cms/.env` exists and has the correct value |
| `Cannot find module '@prisma/client'` | Run `npm run gen:prisma` to regenerate the Prisma client |
| `ENOENT: no such file` for CSV | Confirm all three CSV files are in `packages/cms/data/imports/` |
| Game not found for date+rival | Check the Apariciones.csv `Fecha` column format is `YYYY/MM/DD` |
| `connect ECONNREFUSED :5100` | Run `npm run docker:up` to start the PostgreSQL container |

---

## Alternative Invocation

Run the script directly without going through the root workspace:

```bash
cd packages/cms
npx ts-node --project tsconfig.json -r dotenv/config src/scripts/seed-import.ts
```

Or with `--dry-run`:

```bash
cd packages/cms
npx ts-node --project tsconfig.json -r dotenv/config src/scripts/seed-import.ts --dry-run
```
