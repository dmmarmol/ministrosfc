# Feature Specification: Data Hydration from Google Sheets

**Feature Branch**: `003-data-hydration`
**Created**: March 23, 2026
**Status**: Draft — One open question (SC-001b); all others resolved

---

## Overview

Import real Ministros FC team data from the `Ministros F.C. - Datos` Google Sheets spreadsheet into the PostgreSQL database. The spreadsheet is the current source of truth. The import process exports sheets as CSV files, transforms data to match the application schema, and loads it via Prisma with a Full Replace strategy.

This script will be run **multiple times** until the platform is deployed to a stable production domain. At that point the CMS becomes the sole source of truth and the import script is retired permanently. See SC-006.

**Trigger**: Manually executed by admin whenever the spreadsheet is updated and a database refresh is needed.

---

## Clarifications

### SC-001 — Spreadsheet Structure ✅ PARTIALLY RESOLVED

The `Estadisticas_Generales` tab has been analyzed. It is a **statistics dashboard** with 5 aggregated sub-tables sitting side-by-side horizontally (not a raw-records sheet):

| Sub-table | Raw columns | Maps to |
|---|---|---|
| Torneos | Año, Torneo, Duracion (`MM/YYYY – MM/YYYY`), J, G, P, E, Pts, Gol+, Gol-, Diff | `Tournament` — 9 records |
| Historial por Rival | Equipo Rival, J, G, P, E, Historial | `OpponentTeam` — 26 records |
| Goleadores | Jugador, Apodo, Goles, Partidos, Prom. | `Player` name + career goals — 10 in table |
| Apariciones | Jugador, Apariciones, % Apariciones | `Player` name + career appearances — 30 total |
| Resumen por Año | Año, J, G, P, E, % Victorias | Derived — no entity created |

**Importable from this file:** 26 `OpponentTeam` records (name only), 9 `Tournament` records, ~30 `Player` records (name + nickname only — no positions, jersey numbers, or DOBs available), aggregate career stats per player.

**Not present:** Individual game records. This tab only has tournament-level totals (e.g., "Liga 2023: 9 games, 1W 5L 3D"). No specific match dates, per-match scores, locations, or game-by-game participant data.

### SC-001b — Do Individual Game Records Exist? ⚠️ NEEDS CLARIFICATION

Does the spreadsheet have a separate **Partidos** (or similar) tab with one row per game containing: date, opponent, location, scores, competition type?

- **If yes** → export it as CSV. Individual `Game` records can be imported. The import covers all 5 entities.
- **If no** → individual games must be entered manually via CMS after launch. The import only seeds reference data: teams, tournaments, players, aggregate stats. **This is the most likely scenario** given the statistics-only structure observed.

This is the only remaining scope question.

### SC-002 — Data Formats ✅ RESOLVED

Confirmed from the `Estadisticas_Generales` file:

| Field | Format | Parse strategy |
|---|---|---|
| Dates (milestones) | `DD/MM/YYYY` — e.g., `15/11/2025` | `dd/MM/yyyy`, convert to UTC |
| Tournament duration | `MM/YYYY – MM/YYYY` — e.g., `09/2023 – 11/2023` | Split on ` – `, parse as first-of-month |
| Match scores (milestone col) | `7-2` — goals-goals | Split on `-`; left = Ministros, right = opponent |
| Spanish decimal numbers | `"11,11%"`, `"1,00"`, `"28,8%"` | Strip `%`, replace `,` with `.`, parseFloat |

**Tournament type mapping** (raw Torneo value → `TournamentFormat` enum):

| Raw value | Schema enum |
|---|---|
| `Liga` | `LEAGUE` |
| `Torneo Apertura` | `SEASON` |
| `Torneo Clausura` | `SEASON` |
| `Torneo Mundialito` | `CUP` |
| `Copa de Oro` | `CUP` |
| `Amistoso` | `FRIENDLY_SERIES` |

### SC-003 — Photos ✅ RESOLVED

No player photos in the spreadsheet. All `Player.photoUrl` fields will be set to a free placeholder: `https://placehold.co/200x200?text=Player`. Admin fills in real photos via CMS later.

### SC-004 — Idempotency Strategy ✅ RESOLVED

**Full Replace**: On each run, truncate all target tables in reverse FK order, then re-insert all records from the CSVs. Truncation order:
```
GameParticipant → Statistics → Game → Player → Tournament → OpponentTeam
```
(If SC-001b confirms no game records exist, only: `Player → Statistics → Tournament → OpponentTeam`.)

> ⚠️ **Destructive by design**: Once the CMS is used to enter new data, running this script will erase those CMS entries. The script must be retired at the moment described in SC-006.

### SC-005 — Data Quality ✅ RESOLVED (inferred from CSV)

- **Guest players confirmed**: `Amigo de Pipe` (9 appearances) and `Amigo de Fer` (Claudio Sánchez's nickname in Goleadores) are guest players — import with `playerType = GUEST`, no User account, `invitedById = null`.
- **Informal names**: `Marcos`, `Mauro`, `Jorge`, `Christian` appear with first name only — import as-is as `playerType = REGISTERED`.
- **Missing fields**: No jersey numbers, positions, or DOBs in this sheet. These remain `null` after import; admin fills them via CMS.
- **No inactive flag**: All ~30 players imported as `status = ACTIVE`. Admin deactivates retired players manually via CMS.
- **No per-game stats**: Only career totals (goals, appearances). `GameParticipant` records cannot be generated from this file alone.
- **No bad rows**: This sheet is a curated summary — no empty rows to skip. Row-skip logic still included for robustness if a Partidos sheet exists.

### SC-006 — Recurrence & Deprecation ✅ CLARIFIED

**In plain terms:**

Right now, the Google Sheets spreadsheet is where data lives. You update it, export a CSV, run the import script, and the database reflects those changes. This is fine while the site isn't live yet.

Once the site goes live on a stable domain and you start entering data **directly in the CMS** (adding new game results, new players, updating scores), the spreadsheet becomes stale. If you then run the import script again with Full Replace, it will **wipe everything you entered in the CMS** and restore only what was in the spreadsheet.

**The rule**: Stop running the import script permanently as soon as data starts being entered through the CMS. The two cannot coexist with a Full Replace strategy.

**Practical cutoff signal**: Fly.io deployment to a stable domain. After that event, the script is archived — never executed again.

**`--dry-run` flag**: Yes, included. Parses all CSVs, shows exactly what would be truncated and re-inserted (counts per entity), makes zero database writes.

---

## User Scenarios & Testing

### User Story 1 — Admin Seeds the Database from CSV (Priority: P1)

The admin exports sheets from Google Sheets as CSV(s) into `packages/cms/data/imports/`, then runs one command that truncates and re-seeds the database from those files.

**Acceptance Scenarios**:

1. **Given** CSV files are in the imports directory, **When** the admin runs `npm run seed:import`, **Then** opponent teams, tournaments, and players are created with correct field values
2. **Given** the script runs a second time with the same files, **When** it completes, **Then** the database has identical records to after the first run (deterministic: truncate + re-insert)
3. **Given** the spreadsheet data was updated (e.g., player name correction), **When** the admin exports and re-runs, **Then** the database reflects the updated values
4. **Given** the admin runs with `--dry-run`, **When** it completes, **Then** the console shows counts of what would be inserted per entity with zero database writes

### User Story 2 — Admin Validates Import (Priority: P2)

**Acceptance Scenarios**:

1. **Given** import is complete, **When** admin calls `GET /api/v1/players`, **Then** all ~30 players appear including guest players marked with `playerType = GUEST`
2. **Given** import is complete, **When** admin calls `GET /api/v1/teams`, **Then** all 26 opponent teams appear
3. **Given** import finished, **When** admin reviews console output, **Then** summary shows records inserted per entity type

---

## Requirements

### Functional Requirements

- **FR-001**: The script MUST read CSV files from `packages/cms/data/imports/` (default); path overridable via `--input` CLI flag
- **FR-002**: The script MUST process entities in FK dependency order: `OpponentTeams → Tournaments → Players → Statistics` (and `→ Games → GameParticipants` if SC-001b is yes)
- **FR-003**: The script MUST truncate target tables in reverse FK order before inserting (Full Replace)
- **FR-004**: The script MUST skip rows where the minimum required field is empty (e.g., player name, team name), log a warning with row index and field name, and continue
- **FR-005**: The script MUST print a summary on completion: records inserted per entity type, rows skipped (with reason)
- **FR-006**: The script MUST support `--dry-run`: parses and validates, prints the insertion plan, makes zero database writes
- **FR-007**: Tournament duration strings (`MM/YYYY – MM/YYYY`) MUST be parsed into `startDate` and `endDate` as first-of-month UTC timestamps
- **FR-008**: All `Player.photoUrl` MUST be set to `https://placehold.co/200x200?text=Player`
- **FR-009**: Players whose name matches the pattern `Amigo de ...` MUST be imported with `playerType = GUEST`; all others as `playerType = REGISTERED`
- **FR-010**: All imported players MUST have `status = ACTIVE`
- **FR-011**: Career stats MUST be merged from two sub-tables: goals from Goleadores, appearances from Apariciones (authoritative); players in one table but not the other default the missing stat to `0`
- **FR-012**: The script MUST be runnable via `npm run seed:import` (repo root) and via `npx ts-node packages/cms/src/scripts/seed-import.ts` directly
- **FR-013**: **PENDING SC-001b** — if a Partidos tab exists: each game row MUST be imported with date (parsed `DD/MM/YYYY`), opponentTeam (FK by name), tournament (FK by name, nullable), score (split on `-`), status (`COMPLETED` if scores present, `SCHEDULED` otherwise)

### Non-Functional Requirements

- **NFR-001**: Full import of ~30 players, 26 teams, 9 tournaments MUST complete in under 30 seconds
- **NFR-002**: `DATABASE_URL` MUST be read from `packages/cms/.env` — no hardcoded values
- **NFR-003**: `packages/cms/data/imports/` MUST be in `.gitignore` — CSV files are never committed
- **NFR-004**: Script MUST run without the CMS Express server running — direct Prisma client access only

---

## Key Entities and Source Mapping

| Entity | Source sub-table | Records | Notes |
|---|---|---|---|
| `OpponentTeam` | Historial por Rival | 26 | Name only; logoUrl = null |
| `Tournament` | Torneos | 9 | Name + format enum + start/end dates |
| `Player` | Goleadores ∪ Apariciones (merged) | ~30 | Name + nickname; position/jersey/DOB = null |
| `Statistics` | Goleadores (goals) + Apariciones (appearances) | ~30 | Career totals only |
| `Game` | **Pending SC-001b** | ? | Only if Partidos tab confirmed |
| `GameParticipant` | **Pending SC-001b** | ? | Only if Partidos tab confirmed |

**Player merge logic** (two source sub-tables):
- Build unified player map keyed by `nombre` lowercased + trimmed
- Goleadores contributes: `name`, `nickname`, `goals`, `appearances` (Partidos column)
- Apariciones contributes: `name`, `appearances` (authoritative for appearance count)
- Players only in Apariciones (no goals recorded): `goals = 0`
- Players only in Goleadores (not in Apariciones): rare edge case — use Goleadores appearances

---

## Position in Task Plan

**After**: Phase 1 — Backend Foundation complete (Prisma schema + migrations stable, Tasks T019–T019e done, DB container running, `npx prisma migrate dev` applied)

**Before**: Phase 2A — Backend APIs Priority 1 (real reference data in DB makes API endpoint testing immediately meaningful)

---

## Out of Scope

- **Google Sheets API / OAuth** — manual CSV export only; no automation
- **User accounts** — created manually via CMS or `seed-db.ts`; not in any spreadsheet sheet
- **Individual game records** — only if SC-001b confirms a Partidos tab; otherwise entered via CMS
- **Production database** — this script is local and pre-prod only
- **Photo downloads** — placeholder URL only; real photos uploaded via CMS
- **Jersey number / position assignment** — not available in the spreadsheet; manual CMS entry after import
