# Tasks: Data Hydration from Google Sheets

**Feature**: 003-data-hydration
**Input**: `specs/003-data-hydration/` — plan.md, spec.md, data-model.md, research.md, contracts/cli-contract.md, quickstart.md
**Implementation target**: `packages/cms/src/scripts/seed-import/`
**Test target**: `packages/cms/tests/unit/scripts/seed-import/` + `packages/cms/tests/integration/`

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable — different files, no dependency on an incomplete sibling task
- **[US1]** / **[US2]**: User story label from spec.md
- **TDD (Constitution v1.1.0)**: Write tests FIRST, confirm they FAIL, then implement

---

## Phase 1: Setup

**Purpose**: Install dependencies, register npm scripts, create input directory and gitignore rules

- [X] T001 Install `csv-parse` and `dotenv` as devDependencies in packages/cms: `npm install csv-parse dotenv --save-dev --workspace=@ministrosfc/cms`
- [X] T002 Add `"seed:import"` script to packages/cms/package.json: `"seed:import": "ts-node --project tsconfig.json -r dotenv/config src/scripts/seed-import.ts"`
- [X] T003 Add `"seed:import"` delegating script to root package.json: `"seed:import": "npm run seed:import --workspace=@ministrosfc/cms"`
- [X] T004 [P] Create packages/cms/data/imports/.gitkeep to track the imports directory in git while keeping CSV contents excluded
- [X] T005 [P] Add `packages/cms/data/imports/*.csv` to packages/cms/.gitignore (CSV files must never be committed per NFR-003)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared TypeScript types and entry-point shim that every other module depends on

**⚠️ CRITICAL**: No user story work can begin until T006 (types) is complete

- [X] T006 Create TypeScript row interfaces `HistorialRow`, `JugadorRow`, `AparicionRow`, and `type IdMap = Record<string, string>` in packages/cms/src/scripts/seed-import/types.ts — include all CSV columns per data-model.md column tables
- [X] T007 [P] Create thin entry-point shim at packages/cms/src/scripts/seed-import.ts that imports and calls `run()` from packages/cms/src/scripts/seed-import/index.ts

**Checkpoint**: Types available; shim wired — all user story work can now begin in parallel

---

## Phase 3: User Story 1 — Admin Seeds the Database from CSVs (Priority: P1) 🎯 MVP

**Goal**: Admin places three CSV files in `packages/cms/data/imports/`, runs `npm run seed:import`, and all 6 entity types (OpponentTeam, Tournament, Player, Contact, Game, GameParticipant) are created with correct field values in a single atomic transaction

**Independent Test**: Run `npm run seed:import --dry-run` — console shows entity counts, zero DB writes. Run `npm run seed:import` — Prisma Studio or direct query confirms ~26 teams, 9 tournaments, 61 players, ~63 games, ~700 participants. Re-run produces identical counts (idempotency).

### Tests for User Story 1

> **TDD: Write these tests FIRST. Run them. Confirm they FAIL (modules do not exist yet). Then implement.**

- [X] T008 [P] [US1] Write unit tests for `parseHistorial`: DD/MM/YYYY date parsing to ISO, column mapping to HistorialRow, skip on empty `Rival`, skip on empty `Fecha`, skip when `Conclusión` === `"FALSE"` in packages/cms/tests/unit/scripts/seed-import/parsers/parseHistorial.test.ts
- [X] T009 [P] [US1] Write unit tests for `parseJugadores`: full column mapping to JugadorRow, `??` nickname → null, skip row when name is empty, `Jugador (N)` header detected by `startsWith("Jugador")` in packages/cms/tests/unit/scripts/seed-import/parsers/parseJugadores.test.ts
- [X] T010 [P] [US1] Write unit tests for `parseApariciones`: YYYY/MM/DD format parsed correctly, composite lookup key is `"YYYY-MM-DD:rival-lowercase"`, skip row when player name column is empty in packages/cms/tests/unit/scripts/seed-import/parsers/parseApariciones.test.ts
- [X] T011 [P] [US1] Write unit tests for `buildOpponentTeams` transformer: extracts unique `Rival` values, assigns stable UUID per team, returns `{data, opponentTeamMap}` with correct map key casing in packages/cms/tests/unit/scripts/seed-import/transformers/opponentTeams.test.ts
- [X] T012 [P] [US1] Write unit tests for `buildTournaments` transformer: groups rows by `(Torneo + year(Fecha))`, produces `"2024 Amistoso"` name format, `startDate`/`endDate` from min/max game dates, `competitionType` mapping (Liga→LEAGUE, Amistoso→FRIENDLY, Torneo Apertura→SEASON, Torneo Clausura→SEASON, Torneo Mundialito→CUP, Copa de Oro→CUP) in packages/cms/tests/unit/scripts/seed-import/transformers/tournaments.test.ts
- [X] T013 [P] [US1] Write unit tests for `buildPlayers` transformer: `GUEST` when name or nickname contains `"amigo de"` / `"amigo del"` (case-insensitive), `REGISTERED` otherwise; position `SMF`→`CMF`, `LIB`→`CB`; multi-position value takes first valid; `photoUrl` always `"https://placehold.co/200x200?text=Player"`; `status` always `ACTIVE`; Contact created only when `Telefono` non-empty in packages/cms/tests/unit/scripts/seed-import/transformers/players.test.ts
- [X] T014 [P] [US1] Write unit tests for `buildGames` transformer: `opponentTeamId` resolved via `opponentTeamMap` lookup, `tournamentId` resolved via `tournamentMap` lookup, `notes` assembled as `"DT: {DT}\nHorario: {start}–{end}\n{Comentarios}"` with only present parts, `status`=`COMPLETED` for G/P/E, `status`=`SCHEDULED` for empty `Conclusión`, gameMap keyed `"YYYY-MM-DD:rival-lowercase"` in packages/cms/tests/unit/scripts/seed-import/transformers/games.test.ts
- [X] T015 [P] [US1] Write unit tests for `buildGameParticipants` transformer: game lookup by `"YYYY-MM-DD:rival-lowercase"` key, player lookup by name (trimmed lowercase), nickname fallback when name not found, warning logged and row skipped when neither game nor player resolves, `confirmationStatus`=`CONFIRMED`, `assists`=`0` in packages/cms/tests/unit/scripts/seed-import/transformers/gameParticipants.test.ts

### Implementation for User Story 1

- [X] T016 [P] [US1] Implement `parseHistorial` parser: `loadCsv<HistorialRow>()` with csv-parse/sync `columns:true trim:true skip_empty_lines:true`, parse `Fecha` as `DD/MM/YYYY` → UTC ISO DateTime, filter out rows where `Rival` is empty, `Fecha` is empty/unparseable, or `Conclusión` === `"FALSE"` in packages/cms/src/scripts/seed-import/parsers/parseHistorial.ts
- [X] T017 [P] [US1] Implement `parseJugadores` parser: detect main player name column by key `startsWith("Jugador")`, map all fields to `JugadorRow`, coerce `"??"` nickname to `null`, skip rows where player name is empty in packages/cms/src/scripts/seed-import/parsers/parseJugadores.ts
- [X] T018 [P] [US1] Implement `parseApariciones` parser: `loadCsv<AparicionRow>()`, parse `Fecha` as `YYYY/MM/DD` (replace `/` with `-`), build composite game lookup key `"${isoDate}:${rival.trim().toLowerCase()}"`, skip rows with empty player name in packages/cms/src/scripts/seed-import/parsers/parseApariciones.ts
- [X] T019 [P] [US1] Implement `buildOpponentTeams` transformer: collect unique `Rival` names (trimmed), call `crypto.randomUUID()` per team, return `{ data: Prisma.OpponentTeamCreateManyInput[], opponentTeamMap: IdMap }` in packages/cms/src/scripts/seed-import/transformers/opponentTeams.ts
- [X] T020 [P] [US1] Implement `buildTournaments` transformer: group `HistorialRow[]` by `(row.Torneo + year(parsedDate))`, derive `name="${year} ${torneo}"`, `startDate`=min date, `endDate`=max date, `competitionType` via mapping table, return `{ data: Prisma.TournamentCreateManyInput[], tournamentMap: IdMap }` in packages/cms/src/scripts/seed-import/transformers/tournaments.ts
- [X] T021 [P] [US1] Implement `buildPlayers` transformer: `isGuest()` helper checks name+nickname for `"amigo de"/"amigo del"`; remap positions (`SMF`→`CMF`, `LIB`→`CB`), take first valid enum value; foot mapping (`Zurdo`→LEFT, `Diestro`→RIGHT, `Ambidiestro`→AMBIDEXTROUS); override `photoUrl`; set `status=ACTIVE`; extract Contact records only when `Telefono` non-empty; return `{ players, contacts, playerMapByName, playerMapByNickname }` in packages/cms/src/scripts/seed-import/transformers/players.ts
- [X] T022 [P] [US1] Implement `buildGames` transformer: lookup `opponentTeamId` from `opponentTeamMap`, lookup `tournamentId` from `tournamentMap` (null if missing), assemble `notes` from `DT`/`Comienzo`–`Finalización`/`Comentarios`, derive `status` from `Conclusión`, parse scores with `parseInt()`, build `gameMap` keyed by `"${toISO(date)}:${rival.toLowerCase()}"`, return `{ data, gameMap }` in packages/cms/src/scripts/seed-import/transformers/games.ts
- [X] T023 [P] [US1] Implement `buildGameParticipants` transformer: convert `Fecha` to ISO, build lookup key, resolve `gameId` from `gameMap`, resolve `playerId` from `playerMapByName` then `playerMapByNickname` fallback, warn to stderr and skip row if either unresolved, set `confirmationStatus=CONFIRMED` / `assists=0` / `minutesPlayed=null`, return `Prisma.GameParticipantCreateManyInput[]` in packages/cms/src/scripts/seed-import/transformers/gameParticipants.ts
- [X] T024 [US1] Implement `truncateAll(tx)` in packages/cms/src/scripts/seed-import/db/truncate.ts: executes `TRUNCATE "GameParticipant","Statistics","Game","Contact","Player","Tournament","OpponentTeam" CASCADE` via `tx.$executeRaw` template literal
- [X] T025 [US1] Implement `insertAll(tx, payload)` in packages/cms/src/scripts/seed-import/db/insert.ts: `chunk(arr, 500)` helper, `createMany` calls in FK dependency order (OpponentTeam → Tournament → Player → Contact → Game → GameParticipant), 500-row batches to stay under PostgreSQL bind-parameter limit
- [X] T026 [US1] Implement `run()` orchestrator in packages/cms/src/scripts/seed-import/index.ts: parse `--dry-run`, `--input <path>`, `--verbose` CLI flags; validate CSV files exist (exit 1 if missing); `try/catch` parse errors (exit 2), DB connection errors (exit 3), transaction errors (exit 4); call parsers → transformers → `prisma.$transaction(truncate+insert, {timeout:60_000})`; print stdout summary per cli-contract.md; print warnings to stderr; print `✅ Import complete in Xs` on success

**Checkpoint**: `npm run seed:import --dry-run` prints correct entity counts with zero DB writes; full run creates all records; second run produces identical counts

---

## Phase 4: User Story 2 — Admin Validates Import (Priority: P2)

**Goal**: After a successful import, all entities are queryable with correct field values — guest players marked as GUEST, scores parsed correctly, participants all CONFIRMED

**Independent Test**: Integration test spins up with fixture CSVs, calls `run()` directly, queries Prisma for entity counts and spot-checks field values, then runs a second time to verify idempotency

### Tests for User Story 2

> **TDD: Write test first. Create fixtures to make it pass.**

- [X] T027 [US2] Write integration test: load fixture CSVs via `--input fixtures/seed-import/`, call `run()`, assert `OpponentTeam` count = fixture team count, `Player` count = fixture player count with ≥1 `GUEST`, `Game` count correct, `GameParticipant` count correct with all `confirmationStatus=CONFIRMED`; call `run()` a second time and assert identical counts (idempotency) in packages/cms/tests/integration/seed-import.integration.test.ts

### Implementation for User Story 2

- [X] T028 [P] [US2] Create minimal fixture CSV files covering: 1 guest player, 1 player with SMF position, 1 player with phone (→ Contact), 2 games across 2 tournaments, 3+ participant appearances in packages/cms/tests/integration/fixtures/seed-import/Historial.csv, packages/cms/tests/integration/fixtures/seed-import/Jugadores.csv, and packages/cms/tests/integration/fixtures/seed-import/Apariciones.csv

**Checkpoint**: Integration test passes; guest marking, score parsing, and CONFIRMED status all verified; re-run idempotency confirmed

---

## Phase 5: Polish & Cross-Cutting Concerns

- [X] T029 [P] Add `packages/cms/data/imports/*.csv` to root `.gitignore` as backup coverage (monorepo root .gitignore catches any git operations run from repo root that might bypass the package-level .gitignore)
- [X] T030 [P] Add `seed:import` usage section to packages/cms/README.md: command variants (`--dry-run`, `--input`, `--verbose`), required file names, prerequisite `.env` note, and link to `specs/003-data-hydration/quickstart.md`

---

## Dependencies

```
Phase 1: T001 → T002 → T003
         T004, T005 (parallel)
              ↓
Phase 2: T006 (types — all story work depends on this)
         T007 (shim — parallel with story tests)
              ↓
Phase 3: T008–T015 (unit tests — all parallel, write before implementation)
              ↓
         T016–T023 (implementations — all parallel, after tests FAIL confirmed)
              ↓
         T024, T025 (db layer — parallel pair, after transformers exist)
              ↓
         T026 (orchestrator — requires all above: parsers, transformers, db)
              ↓
Phase 4: T027 (integration test), T028 (fixtures — parallel with T027)
              ↓
Phase 5: T029, T030 (polish — independent of each other)
```

**User story sequencing**: US2 (T027–T028) requires US1 (T026) to be complete.

---

## Parallel Execution Plan

### US1 — maximum parallelism

After T006 is complete, all of the following batches can run simultaneously:

| Batch | Tasks | What |
|-------|-------|------|
| Batch A | T008, T009, T010, T011, T012, T013, T014, T015 | Write all unit tests in parallel |
| Batch B | T016, T017, T018, T019, T020, T021, T022, T023 | Implement all parsers + transformers in parallel |
| Batch C | T024, T025 | Implement db/truncate.ts and db/insert.ts in parallel |
| Sequential | T026 | Orchestrator (depends on all Batch B + C) |

### US2

T027 and T028 can be drafted in parallel (write the test referencing fixture paths; create fixtures to make them work).

---

## Implementation Strategy

| Scope | Tasks | Deliverable |
|-------|-------|-------------|
| MVP | T001–T026 | Working `npm run seed:import` command; dry-run; idempotent full import |
| V1 | T027–T028 | Integration test coverage for import pipeline |
| Polish | T029–T030 | Git hygiene + developer documentation |

**Suggested first PR**: Complete MVP scope (T001–T026) — delivers the working seed import script without requiring DB at test time (unit tests use pure transformer functions).

---

## Format Validation

All 30 tasks follow the required checklist format:

- ✅ Every task starts with `- [ ]`
- ✅ Every task has a sequential ID (T001–T030)
- ✅ Parallelizable tasks are marked `[P]`
- ✅ User-story tasks are labeled `[US1]` or `[US2]`
- ✅ Every task includes an exact file path
- ✅ Setup/Foundational/Polish phases have no story label
