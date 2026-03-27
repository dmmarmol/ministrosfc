# Feature Specification: Data Hydration from Google Sheets

**Feature Branch**: `feature/data-hydration`
**Created**: March 23, 2026
**Status**: Approved for Planning — all clarifications resolved

---

## Overview

Import real Ministros FC team data from the `Ministros F.C. - Datos` Google Sheets spreadsheet into the PostgreSQL database. The spreadsheet is the current source of truth. The import process exports sheets as CSV files, transforms data to match the application schema, and loads it via Prisma with a Full Replace strategy.

This script will be run **multiple times** until the platform is deployed to a stable production domain. At that point the CMS becomes the sole source of truth and the import script is retired permanently.

**Trigger**: Manually executed by admin whenever the spreadsheet is updated and a database refresh is needed.

---

## Source Files (3 raw data CSVs)

All three CSVs are exported from specific tabs of `Ministros F.C. - Datos` spreadsheet.

### 1. `Historial.csv` (from the "Historial" tab)

One row per game. **Primary source** for `Game`, `OpponentTeam`, and `Tournament` records.

| #   | Column            | Example                           | Notes                                                         |
| --- | ----------------- | --------------------------------- | ------------------------------------------------------------- |
| 1   | Fecha             | `09/09/2023`                      | DD/MM/YYYY — game date                                        |
| 2   | Torneo            | `Liga`                            | Short tournament name (year prefix added during grouping)     |
| 3   | Comienzo          | `10:00`                           | Start time — stored in `game.notes`                           |
| 4   | Finalización      | `11:30`                           | End time — stored in `game.notes`                             |
| 5   | Equipo            | `Ministros`                       | Always constant — ignored                                     |
| 6   | Rival             | `La Cocina`                       | Opponent team name → `OpponentTeam.name`                      |
| 7   | Estadio           | `Club Social Y Deportivo Pintita` | Venue → `game.location`                                       |
| 8   | Goles Convertidos | `0`                               | Ministros goals → `game.homeTeamScore`                        |
| 9   | Goles Recibidos   | `4`                               | Opponent goals → `game.awayTeamScore`                         |
| 10  | Resultado         | `0-4`                             | Score string — used for validation only                       |
| 11  | Conclusión        | `P`                               | G=Win, P=Loss, E=Draw — used to set `game.status = COMPLETED` |
| 12  | Apariciones       | `TRUE`                            | Whether player appearance data was recorded for this game     |
| 13  | DT                | `Juan Pablo Garnero`              | Coach name — stored in `game.notes`                           |
| 14  | Comentarios       | `Eramos 11 justos`                | Game notes → appended to `game.notes`                         |
| 15  | Foto              | `TRUE`                            | Whether team photo taken — not stored                         |

**Tournament uniqueness**: Historial uses short names (e.g., `Amistoso`). Since the same short name recurs across years (2024 Amistoso, 2025 Amistoso), tournaments are identified by **`Torneo + year(Fecha)`** and stored with a year prefix: `"2024 Amistoso"`, `"2025 Amistoso"`, etc.

**Tournament dates**: Derived from min/max `Fecha` per `(Torneo + year)` group — no separate date source needed.

**~63 game records** total in the CSV.

### 2. `Jugadores.csv` (from the "Jugadores" tab)

One row per player (61 total). **Primary source** for `Player` and `Contact` records.

| #   | Column       | Example                      | Notes                                                                    |
| --- | ------------ | ---------------------------- | ------------------------------------------------------------------------ |
| 1   | Jugador      | `Diego Marmol`               | → `player.name`                                                          |
| 2   | Apodo        | `Dieguito`                   | → `player.nickname`; `??` → store as `null`                              |
| 3   | Nacimiento   | `1991`                       | Birth year → `player.dateOfBirth` as string (`"1991"`)                   |
| 4   | Edad         | `35`                         | Computed age — ignored                                                   |
| 5   | Altura       | `180`                        | → `player.height` (integer, cm)                                          |
| 6   | Numero       | `3`                          | → `player.jerseyNumber` (integer)                                        |
| 7   | Pie          | `Ambidiestro`                | → `player.dominantFoot` (see enum mapping)                               |
| 8   | Posición     | `LB,RB,CB,SMF`               | First valid position → `player.position`; multiples logged and discarded |
| 9   | DNI          | `12345678`                   | → `player.nationalId`                                                    |
| 10  | Telefono     | `+54 9 11 5120-6894`         | → `Contact.phone` (contact row only created if non-empty)                |
| 11  | Imagen (URL) | _(Brave search placeholder)_ | Ignored — overridden by `https://placehold.co/200x200?text=Player`       |

**Field mappings:**

Foot enum:

| CSV value     | Schema enum    |
| ------------- | -------------- |
| `Zurdo`       | `LEFT`         |
| `Diestro`     | `RIGHT`        |
| `Ambidiestro` | `AMBIDEXTROUS` |

Position unmapped values (not in schema enum):

| CSV value | Resolution                                         |
| --------- | -------------------------------------------------- |
| `SMF`     | Map to `CMF` (side-mid treated as central for now) |
| `LIB`     | Map to `CB` (libero is a sweeper-center back role) |

**Guest player detection** — `playerType = GUEST` if **either** of:

- `player.name` contains `"Amigo de"` or `"Amigo del"` (case-insensitive)
- `player.nickname` contains `"Amigo de"` or `"Amigo del"` (case-insensitive)

All other players → `playerType = REGISTERED`.

All imported players → `status = ACTIVE`.

### 3. `Apariciones.csv` (from the "Apariciones" tab)

One row per player-game appearance. **Primary source** for `GameParticipant` records.

| #   | Column             | Example            | Notes                                                             |
| --- | ------------------ | ------------------ | ----------------------------------------------------------------- |
| 1   | Fecha              | `2023/09/09`       | YYYY/MM/DD format — used as game lookup key                       |
| 2   | Rival              | `La Cocina`        | Opponent name — used as game lookup key                           |
| 3   | Torneo             | `Liga`             | Tournament name — not used for lookup (Fecha+Rival is sufficient) |
| 4   | Resultado          | `0-4`              | Score string — validation only                                    |
| 5   | (Conclusión)       | `P`                | 5th column has G/P/E — validation only                            |
| 6   | Jugador (name)     | `Diego Marmol`     | → `player.name` lookup key                                        |
| 7   | Jugador (nickname) | `Dieguito`         | Secondary lookup fallback                                         |
| 8   | Goles              | `0`                | → `GameParticipant.goalsScored`                                   |
| 9   | Amarilla           | `0`                | → `GameParticipant.yellowCards`                                   |
| 10  | Roja               | `0`                | → `GameParticipant.redCards`                                      |
| 11  | Titular/Suplente   | `Titular`          | Not stored in current schema — logged and discarded               |
| 12  | Comentarios        | `Lesion: Tirón...` | → `GameParticipant.notes`                                         |

**Game lookup key**: `Fecha (YYYY/MM/DD) + Rival`. During processing, the game lookup map is keyed by `YYYY-MM-DD:RivalName` (Apariciones dates are already YYYY/MM/DD; Historial dates are converted from DD/MM/YYYY during game import).

**Player lookup**: by `name` (case-insensitive trim). If not found, fallback to `nickname` match.

**`confirmationStatus`**: Always `CONFIRMED` for all imported rows (appearing in this sheet = confirmed attendance).

---

## Clarifications

### SC-001 — Spreadsheet Structure ✅ FULLY RESOLVED

Three raw data tabs confirmed and exported as CSV:

1. **Historial** (game records) — one row per game, ~63 records
2. **Jugadores** (player roster) — one row per player, 61 records
3. **Apariciones** (player appearances) — one row per player-game, ~700+ records

A separate summary tab (`Estadisticas_Generales`) exists but contains only aggregated statistics and is **not used** for import. All data needed is in the three raw tabs above.

### SC-002 — Data Formats ✅ RESOLVED

| Source          | Date format  | Parse strategy                             |
| --------------- | ------------ | ------------------------------------------ |
| Historial.csv   | `DD/MM/YYYY` | `dd/MM/yyyy` → UTC DateTime                |
| Apariciones.csv | `YYYY/MM/DD` | `yyyy/MM/dd` → UTC DateTime (or ISO-parse) |

Other formats:

- Scores: `N-N` string → split on `-` → `homeTeamScore` / `awayTeamScore`
- Game time: `HH:MM` → stored as string in `game.notes`

### SC-003 — Photos ✅ RESOLVED

All Jugadores.csv image URLs are the same Brave Search placeholder — not real player photos. All `Player.photoUrl` fields will be set to `https://placehold.co/200x200?text=Player`. Admin fills in real photos via CMS later.

### SC-004 — Idempotency Strategy ✅ RESOLVED

**Full Replace**: On each run, truncate all target tables in reverse FK order, then re-insert all records from the CSVs. Truncation order:

```
GameParticipant → Statistics → Game → Contact → Player → Tournament → OpponentTeam
```

> ⚠️ **Destructive by design**: Running this script will erase all CMS-entered data and restore only what is in the CSVs. See SC-006 for retirement rule.

### SC-005 — Data Quality ✅ RESOLVED

- **Missing fields**: `jerseyNumber`, `position`, `dateOfBirth`, `height`, `dominantFoot` are optional. Import what's available; rest stays `null`.
- **Row skipping**: Rows where minimum required field is empty (player name, opponent name) are skipped with a warning log.
- **Duplicate prevention**: After truncate, each CSV row generates a new record. No upsert needed.
- **`??` nicknames**: Store as `null` in `player.nickname`.
- **Phone field**: Only create `Contact` record if `Telefono` is non-empty.
- **`Titular/Suplente`** not in schema: log and discard (field not tracked currently).

### SC-006 — Recurrence & Deprecation ✅ CLARIFIED

Run the import script freely while the CMS has no manually-entered data. Once data entry begins through the CMS (new game results, updated players), the script must be permanently retired — running it with Full Replace will erase all CMS data.

**Cutoff signal**: Fly.io deployment to a stable production domain.

---

## User Scenarios & Testing

### User Story 1 — Admin Seeds the Database from CSVs (Priority: P1)

The admin places the three exported CSVs in `packages/cms/data/imports/`, then runs one command.

**Acceptance Scenarios**:

1. **Given** three CSVs are present, **When** the admin runs `npm run seed:import`, **Then** all opponent teams, tournaments, games, players, and game participants are created with correct field values
2. **Given** the script runs a second time with the same files, **When** it completes, **Then** the database has identical records (deterministic: truncate + re-insert)
3. **Given** the spreadsheet was updated (e.g., new game added), **When** the admin exports and re-runs, **Then** the database reflects the updated data
4. **Given** the admin runs with `--dry-run`, **When** it completes, **Then** the console shows counts of what would be inserted per entity with zero database writes

### User Story 2 — Admin Validates Import (Priority: P2)

1. **Given** import is complete, **When** admin calls `GET /api/v1/players`, **Then** all 61 players appear with guest players marked `playerType = GUEST`
2. **Given** import is complete, **When** admin calls `GET /api/v1/teams`, **Then** all 26 opponent teams appear
3. **Given** import is complete, **When** admin calls `GET /api/v1/games`, **Then** all ~63 games appear with correct scores and tournament FK
4. **Given** import finished, **When** admin reviews console output, **Then** summary shows records inserted per entity type and rows skipped

---

## Requirements

### Functional Requirements

- **FR-001**: The script MUST read CSV files from `packages/cms/data/imports/`; path overridable via `--input` CLI flag
- **FR-002**: The script MUST process entities in FK dependency order: `OpponentTeams → Tournaments → Players → Games → GameParticipants`
- **FR-003**: The script MUST truncate target tables in reverse FK order before inserting
- **FR-004**: The script MUST skip rows where the minimum required field is empty, log a warning with row index and field name, and continue
- **FR-005**: The script MUST print a summary on completion: records inserted per entity type, rows skipped (with reason)
- **FR-006**: The script MUST support `--dry-run`: parse and validate all CSVs, print the insertion plan, make zero database writes
- **FR-007**: Tournament names MUST include a year prefix derived from game dates (e.g., `"2024 Amistoso"`). Tournament `startDate`/`endDate` MUST be derived from the min/max game date per tournament group
- **FR-008**: All `Player.photoUrl` MUST be set to `https://placehold.co/200x200?text=Player`
- **FR-009**: Guest player detection MUST check both `name` and `nickname` for the pattern `"Amigo de"` or `"Amigo del"` (case-insensitive); matches → `playerType = GUEST`; others → `playerType = REGISTERED`
- **FR-010**: All imported players MUST have `status = ACTIVE`
- **FR-011**: Position `SMF` in CSV MUST map to `CMF`; position `LIB` MUST map to `CB`. If a player has multiple comma-separated positions, only the first valid one is stored
- **FR-012**: The script MUST be runnable via `npm run seed:import` (repo root) and via `npx ts-node packages/cms/src/scripts/seed-import.ts` directly
- **FR-013**: Each row in `Apariciones.csv` MUST be imported as a `GameParticipant` record. Game lookup uses composite key `YYYY-MM-DD` date + `Rival` name match against already-imported `Game` records. Player lookup uses player `name` (case-insensitive); nickname used as fallback
- **FR-014**: The Apariciones game lookup date MUST parse `YYYY/MM/DD` format (different from Historial's `DD/MM/YYYY`)
- **FR-015**: `Contact` records MUST only be created for players where `Telefono` is non-empty
- **FR-016**: `game.notes` MUST be assembled from: `"DT: {DT}"` (if DT non-empty) + `"Horario: {Comienzo}–{Finalización}"` + `"{Comentarios}"` (if non-empty), newline-separated

### Non-Functional Requirements

- **NFR-001**: Full import of ~61 players, ~26 teams, ~9 tournaments, ~63 games, ~700 game participants MUST complete in under 60 seconds
- **NFR-002**: `DATABASE_URL` MUST be read from `packages/cms/.env` — no hardcoded values
- **NFR-003**: `packages/cms/data/imports/` MUST be in `.gitignore` — CSV files are never committed
- **NFR-004**: Script MUST run without the CMS Express server running — direct Prisma client access only

---

## Key Entities and Source Mapping

| Entity            | Primary Source                             | Est. Records | Key fields populated                                                                                        |
| ----------------- | ------------------------------------------ | ------------ | ----------------------------------------------------------------------------------------------------------- |
| `OpponentTeam`    | Historial.csv (unique `Rival` values)      | 26           | `name` only                                                                                                 |
| `Tournament`      | Historial.csv (grouped by `Torneo + year`) | 9            | `name` (year-prefixed), `competitionType`, `startDate`, `endDate`                                           |
| `Player`          | Jugadores.csv                              | 61           | All available fields                                                                                        |
| `Contact`         | Jugadores.csv (`Telefono` column)          | ~30          | `phone` only                                                                                                |
| `Game`            | Historial.csv                              | ~63          | `date`, `opponent FK`, `tournament FK`, `homeTeamScore`, `awayTeamScore`, `status`, `notes`                 |
| `GameParticipant` | Apariciones.csv                            | ~700+        | `player FK`, `game FK`, `goalsScored`, `yellowCards`, `redCards`, `notes`, `confirmationStatus = CONFIRMED` |

**Tournament‐to-CompetitionType mapping:**

| Torneo (raw)        | CompetitionType |
| ------------------- | --------------- |
| `Liga`              | `LEAGUE`        |
| `Torneo Apertura`   | `SEASON`        |
| `Torneo Clausura`   | `SEASON`        |
| `Torneo Mundialito` | `CUP`           |
| `Copa de Oro`       | `CUP`           |
| `Amistoso`          | `FRIENDLY`      |

---

## Position in Task Plan

**After**: Phase 1 — Backend Foundation complete (Prisma schema + migrations stable, `npx prisma migrate dev` applied, DB container running)

**Before**: Phase 2A — Backend APIs Priority 1 (real data in DB makes API endpoint testing immediately meaningful)

---

## Out of Scope

- **Google Sheets API / OAuth** — manual CSV export only; no automation
- **User accounts** — created manually; not in any spreadsheet
- **Production database** — this script is local and pre-prod only
- **Photo downloads** — placeholder URL only; real photos uploaded via CMS
- **Starter/sub designation** — `Titular/Suplente` from Apariciones.csv not stored (schema gap, tracked as future enhancement)
- **Per-game assists** — not in Apariciones.csv; `assists` defaults to `0`
- **Statistics aggregations** — `Statistics` model not populated by this script; computed separately
