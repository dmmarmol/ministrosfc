# Tasks: Team Statistics Views

**Input**: Design documents from `specs/017-team-stats-views/`
**Prerequisites**: plan.md ✓ spec.md ✓ research.md ✓ data-model.md ✓ contracts/statistics-contract.md ✓ quickstart.md ✓

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared TypeScript DTOs required by both CMS and frontend before any story work begins. This is the hard gate from constitution Principle VII.

- [x] T001 Extend `packages/shared/src/types/statistics.ts` with `TeamStatPeriodDTO`, `TeamSummaryHeaderDTO`, `PlayerStatRowDTO`, and `CsvImportResultDTO` (see data-model.md §Shared Type DTOs)
- [x] T002 Export new types from `packages/shared/src/types/index.ts`
- [x] T003 [P] Bump `packages/shared` package version and rebuild (`npm run build` in `packages/shared`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema migration and CSV import infrastructure that all user stories depend on — US2/US3/US4/US5 cannot show real data without the import, and US1 cannot show enriched stats without the schema additions.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T004 Add `startTime String?`, `endTime String?`, `coach String?`, `photoUrl String?` fields and `@@unique([date, opponentTeamId, tournamentId])` composite index to `Game` model in `packages/cms/prisma/schema.prisma`
- [x] T005 Add `isStarter Boolean?` field to `GameParticipant` model in `packages/cms/prisma/schema.prisma`
- [x] T006 Generate and apply Prisma migration: `npx prisma migrate dev --name add_game_import_fields` in `packages/cms`
- [x] T007 Install `csv-parse` dependency in `packages/cms` (`npm install csv-parse`)
- [x] T008 Create `packages/cms/src/services/CsvImportService.ts` implementing `parseAndImport(files: { historial, jugadores, apariciones })` → `CsvImportResultDTO`; import order: jugadores → historial → apariciones; upsert on natural keys per data-model.md; handle `Jugador (N)` header strip, `DD/MM/YYYY` and `YYYY/MM/DD` date parsing, quoted fields, `G/P/E` outcome mapping, `Titular/Suplente` → `isStarter` boolean
- [x] T009 Create `packages/cms/src/routes/import.ts` with `POST /` handler using `multer` for `historial`, `jugadores`, `apariciones` file fields; require `authenticate` + `requireRole("ADMIN")`; call `CsvImportService.parseAndImport`; return `CsvImportResultDTO` on success, 422 on parse error
- [x] T010 Register import router in `packages/cms/src/config/server.ts`: `app.use('/api/v1/import', importRouter)`
- [x] T011 Add Prisma aggregation query methods to `packages/cms/src/models/Statistics.ts`: `aggregateTeamByYear`, `aggregateTeamByTournament`, `aggregateTeamByRival`, `getRivalBreakdown`, `getTeamSummaryHeader` — each accepts optional filter params (`tournamentId`, `rivalId`, `year`) and returns typed arrays matching `TeamStatPeriodDTO` / `TeamSummaryHeaderDTO`
- [x] T012 Add team stat methods to `packages/cms/src/services/StatisticsService.ts`: `getTeamSummary`, `getTeamStatsByYear`, `getTeamStatsByTournament`, `getTeamStatsByRival`, `getRivalStats`; wrap each in `withCache` (Redis, 5-min TTL); extend `getTopScorers` and `getPlayerStats` to accept optional `year: number` and `rivalId: string` query params
- [x] T013 Extend `packages/cms/src/routes/statistics.ts` with 5 new authenticated routes per contracts/statistics-contract.md: `GET /team/summary`, `GET /team/by-year`, `GET /team/by-tournament`, `GET /team/by-rival`, `GET /team/rivals/:rivalId`; also extend existing `GET /players` and `GET /players/:id` to accept `year` and `rivalId` query params
- [x] T014 [P] Write integration tests in `packages/cms/tests/integration/import/csv-import.test.ts`: happy path (all 3 CSVs → correct counts), idempotency (re-import = 0 duplicates), missing optional fields (no 500), unknown player auto-create, malformed date (422 response)
- [x] T015 [P] Write integration tests in `packages/cms/tests/integration/statistics/team-stats.test.ts`: summary header, by-year, by-tournament, by-rival, single rival endpoints; 401 for unauthenticated requests; optional filter params

**Checkpoint**: Foundation ready — CSV import works, schema upgraded, all team stat endpoints live

---

## Phase 3: User Story 5 – Admin imports CSV to seed historical data (Priority: P2) 🎯 Seeding

**Goal**: Admin can upload three CSV files and the app stores all historical games, players, and appearances. This unlocks real data for all other user stories.

**Independent Test**: Upload `data/historial.csv`, `data/jugadores.csv`, `data/apariciones.csv` via `POST /api/v1/import/csv` (Admin token) → response shows ~997 games, ~61 players, ~887 appearances created; re-run → all counts 0 created, no duplicates.

- [x] T016 [US5] Manual smoke test: run import against dev DB with `data/*.csv`; verify counts in response match CSV row counts; check DB via Prisma Studio that games, players, appearances are populated
- [x] T017 [US5] Verify idempotency: re-run the same import; confirm no new records in DB

_Note: T008–T015 in Phase 2 deliver the implementation for US5. T016–T017 are the acceptance verification tasks._

---

## Phase 4: User Story 1 – Anonymous user views player public stats (Priority: P1) 🎯 MVP

**Goal**: Any visitor to `/players/{id}` sees that player's career stats including wins, losses, draws, and win rate — with a shareable URL. No login required.

**Independent Test**: Open `/players/{id}` without logging in → wins/losses/draws/winRate visible alongside goals/assists. Add `?year=2024` → stats update. Copy URL → open in incognito → same view.

- [x] T018 [P] [US1] Create `packages/frontend/src/composables/useStatsFilters.ts` with reactive filter state backed by `useRoute().query`; expose `{ mode, year, tournamentId, rivalId, playerId, setFilter, resetFilters }`; `setFilter` calls `navigateTo` with updated query (no full reload); on mount reads from `useRoute().query` to restore state
- [x] T019 [US1] Extend `packages/frontend/src/pages/players/[id].vue`: add `wins`, `losses`, `draws`, `winRate` to `statCards` computed; add a year `<select>` filter backed by `useRoute().query.year`; pass `year` param when calling `/api/v1/statistics/players/:id`
- [x] T020 [P] [US1] Write unit test `packages/frontend/tests/unit/composables/useStatsFilters.spec.ts`: init from URL params, `setFilter` updates URL, `resetFilters` clears params, invalid param ignored gracefully
- [x] T021 [P] [US1] Write Playwright E2E test `packages/frontend/tests/e2e/stats/player-public-stats.spec.ts`: anonymous access to player stats (SC-001), year filter updates URL (SC-003), shared URL restores filter (SC-004)

---

## Phase 5: User Story 2 – Authenticated user views team stats dashboard (Priority: P2)

**Goal**: Any logged-in user navigates to `/stats` and sees the all-time summary header plus a default "All Years" table. Apply year/tournament/rival filters — URL updates. Unauthenticated access redirects to login.

**Independent Test**: Log in → `/stats` → summary header shows all-time records + "All Years" table renders rows. Change focus mode → table changes. Unauthenticated → redirect to login.

- [x] T022 [P] [US2] Create `packages/frontend/src/components/pages/stats/StatsHeader.vue`: props `{ summary: TeamSummaryHeaderDTO }`; renders all 10 all-time records (rival most played, most wins, most losses, most draws, best win, worst loss, most goals for, most goals against, top scorer, all-time totals); graceful empty/zero state
- [x] T023 [P] [US2] Create `packages/frontend/src/components/pages/stats/StatsFocusSelector.vue`: props `{ modelValue: string }`, emits `update:modelValue`; renders focus mode options: All Years, All Tournaments, All Rivals, Specific Rival, All Players, Single Player
- [x] T024 [P] [US2] Create `packages/frontend/src/components/pages/stats/StatsFilters.vue`: props `{ mode, years, tournaments, rivals, players }`; shows relevant `<select>` dropdowns per mode (year always visible; tournament for tournament mode; rival for rival mode; player for player mode); emits filter change events
- [x] T025 [P] [US2] Create `packages/frontend/src/components/pages/stats/StatsTableByYear.vue`: props `{ rows: TeamStatPeriodDTO[], loading: boolean }`; columns: Year, Period, Games, W, L, D, GF, GA, GD, Pts, Win%; empty state: "Sin datos"
- [x] T026a [US2] Create `packages/frontend/src/pages/stats/index.vue`: `definePageMeta({ middleware: "auth", requiresAuth: true })`; redirect to `/stats/years` via `navigateTo('/stats/years', { replace: true })` in `<script setup>`
- [x] T026b [US2] Create `packages/frontend/src/pages/stats/years.vue`: `definePageMeta({ middleware: "auth", requiresAuth: true })`; inject `useStatsFilters()`; fetch `/api/v1/statistics/team/summary` (once) and `/api/v1/statistics/team/by-year` (reactive to year/tournament filter); render `<StatsHeader>`, `<StatsFilters mode="years">`, `<StatsTableByYear>`
- [x] T026c [US2] Create `packages/frontend/src/pages/stats/tournaments.vue`: `definePageMeta({ middleware: "auth", requiresAuth: true })`; fetch `/api/v1/statistics/team/by-tournament` reactive to year/rival filter; render `<StatsHeader>`, `<StatsFilters mode="tournaments">`, `<StatsTableByTournament>`
- [x] T027 [P] [US2] Write unit test `packages/frontend/tests/unit/components/pages/stats/StatsHeader.spec.ts`: renders all 10 record fields; handles zero/null values
- [x] T028 [P] [US2] Write unit test `packages/frontend/tests/unit/components/pages/stats/StatsTableByYear.spec.ts`: correct columns rendered, rows mapped, empty state message shown when rows=[]
- [x] T029 [P] [US2] Write Playwright E2E test `packages/frontend/tests/e2e/stats/auth-guard.spec.ts`: unauthenticated user navigating to any `/stats/*` sub-route is redirected to login; post-auth redirect returns to original URL (SC-006 regression check)

---

## Phase 6: User Story 3 – Authenticated user views rival-focused stats (Priority: P2)

**Goal**: From the stats dashboard, the user can switch to "All Rivals" view (one row per opponent, historical + yearly) and drill into a specific rival to see their per-year and per-tournament breakdown.

**Independent Test**: Log in → stats → select "All Rivals" focus → table shows one row per opponent. Select a specific rival → table shows per-year breakdown for that rival.

- [x] T030 [P] [US3] Create `packages/frontend/src/components/pages/stats/StatsTableByTournament.vue`: props `{ rows: TeamStatPeriodDTO[], loading: boolean }`; columns: Tournament, Year, Period (start–end), Games, W, L, D, GF, GA, GD, GRF, GRA, Pts, Win%; empty state
- [x] T030b [P] [US3] Write unit test `packages/frontend/tests/unit/components/pages/stats/StatsTableByTournament.spec.ts`: correct columns rendered, period dates displayed, rows mapped, empty state message (satisfies SC-002)
- [x] T031 [P] [US3] Create `packages/frontend/src/components/pages/stats/StatsTableByRival.vue`: props `{ rows: TeamStatPeriodDTO[], mode: 'all' | 'single', loading: boolean }`; in `all` mode: one row per rival; in `single` mode: breakdown by year + tournament for that rival; columns adapt per mode; empty state
- [x] T032 [US3] Create `packages/frontend/src/pages/stats/rivals/index.vue`: `definePageMeta({ middleware: "auth", requiresAuth: true })`; fetch `/api/v1/statistics/team/by-rival` reactive to year/tournament filter; render `<StatsHeader>`, `<StatsFilters mode="rivals">`, `<StatsTableByRival mode="all">`
- [x] T032b [US3] Create `packages/frontend/src/pages/stats/rivals/[id].vue`: `definePageMeta({ middleware: "auth", requiresAuth: true })`; read `rivalId` from route params; fetch `/api/v1/statistics/team/rivals/:rivalId` reactive to year filter; render `<StatsHeader>`, `<StatsFilters mode="rival">`, `<StatsTableByRival mode="single">`
- [x] T033 [P] [US3] Write unit test `packages/frontend/tests/unit/components/pages/stats/StatsTableByRival.spec.ts`: all-rivals mode columns, single-rival mode columns, empty state

---

## Phase 7: User Story 4 – Authenticated user views player-focused stats (Priority: P3)

**Goal**: From the stats dashboard, the user can switch to "All Players" view (one row per player with participation + win rate) and drill into a single player to see per-year/tournament/rival breakdown.

**Independent Test**: Log in → stats → select "All Players" → table shows one row per player with goals, wins, win rate. Click/select a specific player → table shows that player's stats by year.

- [x] T034 [P] [US4] Create `packages/frontend/src/components/pages/stats/StatsTableByPlayer.vue`: props `{ rows: PlayerStatRowDTO[], mode: 'all' | 'single', loading: boolean }`; in `all` mode: one row per player (name, games, W, L, D, goals, assists, winRate, goalRate, participationRate%); in `single` mode: per-year rows with same columns; empty state
- [x] T035 [US4] Create `packages/frontend/src/pages/stats/players/index.vue`: `definePageMeta({ middleware: "auth", requiresAuth: true })`; fetch `/api/v1/statistics/players` reactive to year/rival filter; render `<StatsHeader>`, `<StatsFilters mode="players">`, `<StatsTableByPlayer mode="all">`
- [x] T035b [US4] Create `packages/frontend/src/pages/stats/players/[id].vue`: `definePageMeta({ middleware: "auth", requiresAuth: true })`; read `playerId` from route params; fetch `/api/v1/statistics/players/:id` reactive to year/rival filter; render `<StatsHeader>`, `<StatsFilters mode="player">`, `<StatsTableByPlayer mode="single">`
- [x] T036 [P] [US4] Write unit test `packages/frontend/tests/unit/components/pages/stats/StatsTableByPlayer.spec.ts`: all-players mode columns, single-player mode columns, goalRate displayed as decimal, empty state

---

## Phase 8: User Story 4 (cont.) – URL-driven filter state and shareability (Priority: P4)

**Goal**: All filter selections in the stats dashboard encode into URL query params. Copying the URL and opening it (while authenticated) restores the identical view.

**Independent Test**: Apply any filter combination → URL updates without full reload. Copy URL → open in new authenticated tab → same view restored. Invalid param in URL → silently ignored, defaults applied.

- [x] T037 [US4] Verify that each stats sub-route URL is directly shareable and restores the correct view without redirect (e.g. `/stats/rivals/uuid` opens the single-rival view; `/stats/players/uuid` opens single-player view)
- [x] T038 [P] [US4] Write Playwright E2E test `packages/frontend/tests/e2e/stats/filter-url-roundtrip.spec.ts`: apply mode + year + rival → URL encodes all; reload → same filters restored (SC-003, SC-004); invalid year param → graceful fallback

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, regression check, and cleanup

- [x] T039 Run full CMS test suite (`cd packages/cms && npm test`) — all 31+ tests pass; confirm T014 + T015 integration tests pass
- [x] T040 [P] Run full frontend unit test suite (`cd packages/frontend && npm run test`) — all 79+ tests pass; confirm T020, T027, T028, T033, T036 pass
- [x] T041 [P] Verify zero regressions on existing `statistics.vue` (public scorers page) — still works without auth; existing player profile stats section still renders
- [x] T042 Manually verify all-time summary header shows correct totals matching imported CSV data (SC-007)
- [x] T043 [P] Verify re-import idempotency on dev DB: run import twice → record counts unchanged (SC-008)

---

## Dependencies

```
T001-T003 (shared types) → ALL other tasks
T004-T006 (schema migration) → T007-T015 (import + stats)
T007-T010 (import service + route) → T016-T017 (US5 acceptance)
T011-T013 (stats model + service + routes) → T026, T032, T035 (frontend pages)
T018 (useStatsFilters composable) → T019, T026, T032, T035 (all page/filter work)
T022-T025 (Phase 5 components) → T026 (stats.vue assembly)
T030-T031 (Phase 6 components) → T032
T034 (Phase 7 component) → T035
```

## Parallel Execution Examples

**During Phase 2 (after T006)**:

- T007+T014+T015 can proceed in parallel (install dep + write tests concurrently)
- T008 (CsvImportService) and T011 (Statistics model) can proceed in parallel

**During Phase 5**:

- T022, T023, T024, T025 (all 4 sub-components) can be built in parallel
- T027, T028, T029 (tests) can be written in parallel with component implementation

**During Phase 6**:

- T030 and T031 (two components) can be built in parallel
- T033 (tests) in parallel

**During Phase 7**:

- T034 and T036 (component + test) in parallel

## Implementation Strategy

**MVP Scope (deliverable after Phase 4)**:

- Public player stats with wins/losses/draws/winRate and year filter (US1, P1)
- CSV import working so dev data exists (US5, feeds everything)

**Full delivery order**:

1. Phases 1–2: infrastructure (shared types, migration, import, stats API)
2. Phase 3: US5 acceptance (smoke test import)
3. Phase 4: US1 MVP (public player stats)
4. Phase 5: US2 (team dashboard)
5. Phase 6: US3 (rival stats)
6. Phase 7: US4 (player comparison stats)
7. Phase 8: US4 URL sharing
8. Phase 9: polish + regression

**Total tasks**: 49  
**Tasks by user story**:

- Foundation/Setup: T001–T015 (15 tasks)
- US5 (CSV import acceptance): T016–T017 (2 tasks)
- US1 (public player stats): T018–T021 (4 tasks)
- US2 (team dashboard): T022–T029, T026a–T026c (10 tasks)
- US3 (rival stats): T030, T030b, T031–T033b (6 tasks)
- US4 (player comparison + URL): T034–T038, T035b (7 tasks)
- Polish: T039–T043 (5 tasks)

**Parallel opportunities**: 19 tasks marked `[P]` across all phases (original scope); T045 and T048 are parallelizable in US6 extension.

---

## Phase 10: User Story 6 – Admin imports canchas.csv to seed Playground records and link historical games (Priority: P2)

**Goal**: Admin uploads an optional `canchas.csv` file alongside the other CSVs. The system upserts `Playground` records by name and sets `Game.playgroundId` for any game whose `location` matches a playground name. Games with no match retain their `location` string and emit a warning.

**Independent Test**: POST `canchas.csv` + the three existing CSVs → response includes `playgrounds: { created: N, updated: 0, skipped: 0 }` → query DB — Playground rows exist, matched `Game` rows have `playgroundId` set. Re-upload → `created: 0, updated: N`. Upload without `canchas` → other imports unaffected.

- [x] T044 Update `packages/shared/src/types/statistics.ts`: add `playgrounds: { created: number; updated: number; skipped: number }` to `CsvImportResultDTO`; rebuild shared package (`npm run build` in `packages/shared`)
- [x] T045 [P] [US6] Add `importCanchas(buf: Buffer, adminUserId: string): Promise<Map<string, string>>` private method to `packages/cms/src/services/CsvImportService.ts`: parse `canchas.csv` columns `Cancha`, `Dirección`, `Latitud?`, `Longitud?`; upsert `Playground` by `name` case-insensitively trimmed (`findFirst` where `name ILIKE` then `create`/`update`); set `createdById = adminUserId` on create, `updatedById = adminUserId` on update; return `Map<string,string>` of lowercased trimmed name → playground ID
- [x] T046 [US6] Update `parseAndImport` signature in `packages/cms/src/services/CsvImportService.ts` to accept `{ historial, jugadores, apariciones, canchas?: Buffer, adminUserId: string }`; call `importCanchas` before `importHistorial` when `canchas` is provided; pass the resulting name→ID map into `importHistorial` so each `Game` upsert sets `playgroundId` when `game.location` (lowercased, trimmed) matches a key; for games with no match emit a warning `"game {date} vs {rival}: location '{location}' not found in canchas.csv"`; populate `result.playgrounds` counter; update import order comment to: jugadores → canchas → historial → apariciones
- [x] T047 [US6] Update `packages/cms/src/routes/import.ts`: add `{ name: 'canchas', maxCount: 1 }` to the multer `fields` array as an optional field; forward `req.user.userId` as `adminUserId` in the `parseAndImport` call
- [x] T048 [P] [US6] Update integration tests in `packages/cms/tests/integration/import/csv-import.test.ts`: (a) canchas happy path — POST all 4 CSVs → `playgrounds.created > 0`; matched games have `playgroundId` set in DB; (b) re-upload → `playgrounds.created === 0, updated > 0`; (c) game with no matching Estadio → `warnings` array contains location-mismatch message; (d) omit `canchas` → import completes without error, `playgrounds` counters all zero
- [ ] T049 [US6] Manual smoke test: run `POST /api/v1/import/csv` with `canchas.csv` against dev DB; verify Playground records created via Prisma Studio; verify at least one `Game` row has `playgroundId` populated; verify re-import is idempotent

---

## Phase 11: Bug Fix – jugadores.csv Column Mapping Corrections

**Root Cause**: The real `jugadores.csv` uses a `Nombre` column (not `Jugador (N)`), so the current `startsWith("Jugador")` lookup finds nothing — rows are silently skipped. Meanwhile `apariciones.csv` processing auto-creates minimal players from the `Jugador` column there, generating ghost records. Additionally, `Telefono` is never mapped to a `Contact` record, `Posición` can contain comma-separated values (only the first should be used), and `Edad` must be ignored (age is derived from `dateOfBirth`, not imported).

**Acceptance**: Upload `jugadores.csv` → each row creates exactly ONE player with correct firstName/lastName split, nickname set, position (first value only), height, dateOfBirth, nationalId, photoUrl; a Contact record is created/updated with phone + whatsapp; age is NOT stored directly; re-upload → updated count only, no duplicates, no ghost players from apariciones.

- [x] T050 Fix the name-column lookup in `CsvImportService.importJugadores` (or inline in `parseAndImport`): replace `Object.keys(row).find((k) => k.startsWith("Jugador"))` with a direct lookup on column `"Nombre"`; keep `stripCountAnnotation` as a fallback if `"Nombre"` is absent (backward-compat); preserve two-pass structure (upsert players first, then resolve `invitedById` second)
- [x] T051 Fix `mapPosition` call site: before passing the raw `"Posición"` value to `mapPosition`, split the string by `","` and take `[0]` — e.g. `"Delantero, Mediocampista"` → `"Delantero"` → `"CF"`; the `mapPosition` helper itself does not need to change
- [x] T052 [P] Add `Telefono` → `Contact` upsert in the jugadores first pass: after creating/updating the `Player` record, upsert a `Contact` row with `{ phone: row["Telefono"]?.trim() || null, whatsapp: row["Telefono"]?.trim() || null }` using `prisma.contact.upsert({ where: { playerId }, update: {...}, create: { playerId, ...} })`; if `Telefono` is blank skip the upsert
- [x] T053 Confirm `"Edad"` column is ignored (age must not be stored from CSV — it is derived at read-time from `dateOfBirth`); add an explicit comment in the import loop noting this column is intentionally skipped
- [x] T054 Add nickname to the `playerNameToId` map after each player upsert — `if (nickname) playerNameToId.set(nickname.toLowerCase(), playerId)` — so that `apariciones.csv` rows that reference a player by their apodo resolve to the correct existing player instead of creating a ghost record
- [x] T055 [P] Update integration tests in `packages/cms/tests/integration/import/csv-import.test.ts`: (a) player import with `Nombre` column → single player record, correct firstName/lastName split; (b) player with `Posición = "Delantero, Mediocampista"` → position is `CF`, no error; (c) player with `Telefono` → Contact record created with phone + whatsapp; (d) re-import → no duplicate Contact records; (e) apariciones referencing a known player nickname → no ghost player created
- [x] T056 Add `db:reset` npm script to `packages/cms/package.json` (`prisma migrate reset --force`) and document wipe→reimport workflow in `specs/017-team-stats-views/quickstart.md`; seed script creates `admin@ministrosfc.com` / `Admin1234!`

---

## Dependencies (updated)

```
T001-T003 (shared types) → ALL other tasks
T004-T006 (schema migration) → T007-T015 (import + stats)
T007-T010 (import service + route) → T016-T017 (US5 acceptance)
T011-T013 (stats model + service + routes) → T026, T032, T035 (frontend pages)
T018 (useStatsFilters composable) → T019, T026, T032, T035 (all page/filter work)
T022-T025 (Phase 5 components) → T026 (stats.vue assembly)
T030-T031 (Phase 6 components) → T032
T034 (Phase 7 component) → T035

--- US6 (canchas extension) ---
T044 (update CsvImportResultDTO) → T045, T046, T048
T045 (importCanchas method) → T046 (parseAndImport update)
T046 (parseAndImport update) → T047 (route update) → T048 (integration tests) → T049 (smoke test)

--- Phase 11 (jugadores bug fixes) ---
T050 (fix name column lookup) → T051 (fix position split) → T052 (Contact upsert) → T054 (nickname in map) → T055 (integration tests)
T053 (Edad comment) — standalone, no dependencies
T051 and T052 can proceed in parallel once T050 is done

--- Phase 12 (nav consolidation) ---
T057a (StatisticsSubNav component) → T057b (statistics layout)
T057b (layout) → T057c (statistics/index.vue) + T057d (top-scorers.vue)
T057c and T058 can proceed in parallel once T057b is complete
T059 (delete stats/ dir + grep check) → T057c + T058 complete
T060 (nav conditional redirect) standalone
T063 (index.vue API guard fix) → T057c complete
T061 + T062 (verify + E2E update) → T057c + T058 + T059 + T060 complete
```

---

## Phase 12: UI Nav Consolidation – Unify `statistics/` and `stats/` under one route (Priority: P2)

**Goal**: Merge all stats content under a single `/statistics` route prefix. The route split separates public top-scorers (`/statistics/top-scorers`) from the authenticated team-summary (`/statistics`). The main nav link redirects conditionally. A persistent side-nav shows two public links always and four auth-gated links when authenticated. The `/stats/` prefix is removed entirely — requests to `/stats/*` result in a 404.

**Amendment (2026-04-17)**: Original plan had top-scorers embedded in `statistics/index.vue`. During implementation a route split was adopted and the spec updated to reflect the new intended state (FR-024, FR-025, US7).

**Independent Test**: Anonymous → nav "Estadísticas" → `/statistics/top-scorers`, table visible, private sub-nav links hidden. Authenticated → nav "Estadísticas" → `/statistics`, summary header visible, all 6 sub-nav links visible. `/statistics/years` without auth → redirected to login → after login returned to `/statistics/years`. `/stats/years` → 404.

- [x] T057a [US7] Create `packages/frontend/src/components/pages/statistics/StatisticsSubNav.vue`: always-mounted `<nav>`; two public links visible unconditionally: "General" → `/statistics`, "Goleadores" → `/statistics/top-scorers`; four auth-gated links inside `v-if="authStore.isAuthenticated"`: "Por año" `/statistics/years`, "Por torneo" `/statistics/tournaments`, "Por rival" `/statistics/rivals`, "Por jugador" `/statistics/players`; `active-class` highlights active link
- [x] T057b [US7] Create `packages/frontend/src/layouts/statistics.vue`: two-column layout — left `<StatisticsSubNav>`, right `<slot />`; wraps `<CommonHeader>`, `<CommonNavigation>`, `<CommonFooter>`
- [x] T057c [US7] Convert `pages/statistics.vue` → `pages/statistics/index.vue`: `definePageMeta({ layout: 'statistics', public: true })`; shows `<StatsHeader>` gated by `authStore.isAuthenticated`; shows login CTA for anonymous users; team/summary API call MUST be guarded behind `authStore.isAuthenticated` to avoid 401 for anon users
- [x] T057d [US7] Create `packages/frontend/src/pages/statistics/top-scorers.vue`: `definePageMeta({ layout: 'statistics', public: true })`; always-visible top-scorers table with tournament filter and player search; fetches `/api/v1/statistics/top-scorers` with `{ server: false }`
- [x] T058 [US7] Move all files under `pages/stats/` to `pages/statistics/` preserving sub-directory structure; update `definePageMeta` to add `layout: 'statistics'` in each; update any `navigateTo('/stats/...')` calls to `/statistics/...`; no redirect rules for `/stats/` — 404 intentional
- [x] T059 [US7] Delete the now-empty `pages/stats/` directory; verify no remaining `/stats/` references in the codebase; confirm `pages/statistics.vue` (legacy root file) was deleted to avoid Nuxt routing conflict
- [x] T060 [US7] Update `components/common/Navigation.vue` "Estadísticas" link (desktop + mobile) to use `:to="authStore.isAuthenticated ? '/statistics' : '/statistics/top-scorers'"` (conditional redirect per FR-025)
- [x] T061 [P] [US7] Auth-guard regression check: confirmed `definePageMeta({ layout: 'statistics', middleware: 'auth', requiresAuth: true })` present in all 6 pages (`years.vue`, `tournaments.vue`, `rivals/index.vue`, `rivals/[id].vue`, `players/index.vue`, `players/[id].vue`); redirect-back behaviour relies on existing `auth.ts` middleware which passes original URL as `redirect` query param — no behavioural change needed; manual browser verification pending (T049-style)
- [x] T062 [P] [US7] Update Playwright E2E test `packages/frontend/tests/e2e/stats/auth-guard.spec.ts`: replace all `/stats/*` path strings with `/statistics/*` equivalents; update `filter-url-roundtrip.spec.ts` similarly; add assertion that `/stats/years` returns 404
- [x] T063 [US7] Fix `statistics/index.vue` E2 guard: wrap the `useAsyncData` team/summary fetch so it returns `Promise.resolve(null)` when `!authStore.isAuthenticated` — prevents 401 being triggered for anonymous visitors (was: always fetched unconditionally)
