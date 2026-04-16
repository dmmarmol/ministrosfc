# Tasks: Team Statistics Views

**Input**: Design documents from `specs/017-team-stats-views/`
**Prerequisites**: plan.md ✓ spec.md ✓ research.md ✓ data-model.md ✓ contracts/statistics-contract.md ✓ quickstart.md ✓

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared TypeScript DTOs required by both CMS and frontend before any story work begins. This is the hard gate from constitution Principle VII.

- [ ] T001 Extend `packages/shared/src/types/statistics.ts` with `TeamStatPeriodDTO`, `TeamSummaryHeaderDTO`, `PlayerStatRowDTO`, and `CsvImportResultDTO` (see data-model.md §Shared Type DTOs)
- [ ] T002 Export new types from `packages/shared/src/types/index.ts`
- [ ] T003 [P] Bump `packages/shared` package version and rebuild (`npm run build` in `packages/shared`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Schema migration and CSV import infrastructure that all user stories depend on — US2/US3/US4/US5 cannot show real data without the import, and US1 cannot show enriched stats without the schema additions.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Add `startTime String?`, `endTime String?`, `coach String?`, `photoUrl String?` fields and `@@unique([date, opponentTeamId, tournamentId])` composite index to `Game` model in `packages/cms/prisma/schema.prisma`
- [ ] T005 Add `isStarter Boolean?` field to `GameParticipant` model in `packages/cms/prisma/schema.prisma`
- [ ] T006 Generate and apply Prisma migration: `npx prisma migrate dev --name add_game_import_fields` in `packages/cms`
- [ ] T007 Install `csv-parse` dependency in `packages/cms` (`npm install csv-parse`)
- [ ] T008 Create `packages/cms/src/services/CsvImportService.ts` implementing `parseAndImport(files: { historial, jugadores, apariciones })` → `CsvImportResultDTO`; import order: jugadores → historial → apariciones; upsert on natural keys per data-model.md; handle `Jugador (N)` header strip, `DD/MM/YYYY` and `YYYY/MM/DD` date parsing, quoted fields, `G/P/E` outcome mapping, `Titular/Suplente` → `isStarter` boolean
- [ ] T009 Create `packages/cms/src/routes/import.ts` with `POST /` handler using `multer` for `historial`, `jugadores`, `apariciones` file fields; require `authenticate` + `requireRole("ADMIN")`; call `CsvImportService.parseAndImport`; return `CsvImportResultDTO` on success, 422 on parse error
- [ ] T010 Register import router in `packages/cms/src/config/server.ts`: `app.use('/api/v1/import', importRouter)`
- [ ] T011 Add Prisma aggregation query methods to `packages/cms/src/models/Statistics.ts`: `aggregateTeamByYear`, `aggregateTeamByTournament`, `aggregateTeamByRival`, `getRivalBreakdown`, `getTeamSummaryHeader` — each accepts optional filter params (`tournamentId`, `rivalId`, `year`) and returns typed arrays matching `TeamStatPeriodDTO` / `TeamSummaryHeaderDTO`
- [ ] T012 Add team stat methods to `packages/cms/src/services/StatisticsService.ts`: `getTeamSummary`, `getTeamStatsByYear`, `getTeamStatsByTournament`, `getTeamStatsByRival`, `getRivalStats`; wrap each in `withCache` (Redis, 5-min TTL); extend `getTopScorers` and `getPlayerStats` to accept optional `year: number` and `rivalId: string` query params
- [ ] T013 Extend `packages/cms/src/routes/statistics.ts` with 5 new authenticated routes per contracts/statistics-contract.md: `GET /team/summary`, `GET /team/by-year`, `GET /team/by-tournament`, `GET /team/by-rival`, `GET /team/rivals/:rivalId`; also extend existing `GET /players` and `GET /players/:id` to accept `year` and `rivalId` query params
- [ ] T014 [P] Write integration tests in `packages/cms/tests/integration/import/csv-import.test.ts`: happy path (all 3 CSVs → correct counts), idempotency (re-import = 0 duplicates), missing optional fields (no 500), unknown player auto-create, malformed date (422 response)
- [ ] T015 [P] Write integration tests in `packages/cms/tests/integration/statistics/team-stats.test.ts`: summary header, by-year, by-tournament, by-rival, single rival endpoints; 401 for unauthenticated requests; optional filter params

**Checkpoint**: Foundation ready — CSV import works, schema upgraded, all team stat endpoints live

---

## Phase 3: User Story 5 – Admin imports CSV to seed historical data (Priority: P2) 🎯 Seeding

**Goal**: Admin can upload three CSV files and the app stores all historical games, players, and appearances. This unlocks real data for all other user stories.

**Independent Test**: Upload `data/historial.csv`, `data/jugadores.csv`, `data/apariciones.csv` via `POST /api/v1/import/csv` (Admin token) → response shows ~997 games, ~61 players, ~887 appearances created; re-run → all counts 0 created, no duplicates.

- [ ] T016 [US5] Manual smoke test: run import against dev DB with `data/*.csv`; verify counts in response match CSV row counts; check DB via Prisma Studio that games, players, appearances are populated
- [ ] T017 [US5] Verify idempotency: re-run the same import; confirm no new records in DB

_Note: T008–T015 in Phase 2 deliver the implementation for US5. T016–T017 are the acceptance verification tasks._

---

## Phase 4: User Story 1 – Anonymous user views player public stats (Priority: P1) 🎯 MVP

**Goal**: Any visitor to `/players/{id}` sees that player's career stats including wins, losses, draws, and win rate — with a shareable URL. No login required.

**Independent Test**: Open `/players/{id}` without logging in → wins/losses/draws/winRate visible alongside goals/assists. Add `?year=2024` → stats update. Copy URL → open in incognito → same view.

- [ ] T018 [P] [US1] Create `packages/frontend/src/composables/useStatsFilters.ts` with reactive filter state backed by `useRoute().query`; expose `{ mode, year, tournamentId, rivalId, playerId, setFilter, resetFilters }`; `setFilter` calls `navigateTo` with updated query (no full reload); on mount reads from `useRoute().query` to restore state
- [ ] T019 [US1] Extend `packages/frontend/src/pages/players/[id].vue`: add `wins`, `losses`, `draws`, `winRate` to `statCards` computed; add a year `<select>` filter backed by `useRoute().query.year`; pass `year` param when calling `/api/v1/statistics/players/:id`
- [ ] T020 [P] [US1] Write unit test `packages/frontend/tests/unit/composables/useStatsFilters.spec.ts`: init from URL params, `setFilter` updates URL, `resetFilters` clears params, invalid param ignored gracefully
- [ ] T021 [P] [US1] Write Playwright E2E test `packages/frontend/tests/e2e/stats/player-public-stats.spec.ts`: anonymous access to player stats (SC-001), year filter updates URL (SC-003), shared URL restores filter (SC-004)

---

## Phase 5: User Story 2 – Authenticated user views team stats dashboard (Priority: P2)

**Goal**: Any logged-in user navigates to `/stats` and sees the all-time summary header plus a default "All Years" table. Apply year/tournament/rival filters — URL updates. Unauthenticated access redirects to login.

**Independent Test**: Log in → `/stats` → summary header shows all-time records + "All Years" table renders rows. Change focus mode → table changes. Unauthenticated → redirect to login.

- [ ] T022 [P] [US2] Create `packages/frontend/src/components/pages/stats/StatsHeader.vue`: props `{ summary: TeamSummaryHeaderDTO }`; renders all 10 all-time records (rival most played, most wins, most losses, most draws, best win, worst loss, most goals for, most goals against, top scorer, all-time totals); graceful empty/zero state
- [ ] T023 [P] [US2] Create `packages/frontend/src/components/pages/stats/StatsFocusSelector.vue`: props `{ modelValue: string }`, emits `update:modelValue`; renders focus mode options: All Years, All Tournaments, All Rivals, Specific Rival, All Players, Single Player
- [ ] T024 [P] [US2] Create `packages/frontend/src/components/pages/stats/StatsFilters.vue`: props `{ mode, years, tournaments, rivals, players }`; shows relevant `<select>` dropdowns per mode (year always visible; tournament for tournament mode; rival for rival mode; player for player mode); emits filter change events
- [ ] T025 [P] [US2] Create `packages/frontend/src/components/pages/stats/StatsTableByYear.vue`: props `{ rows: TeamStatPeriodDTO[], loading: boolean }`; columns: Year, Period, Games, W, L, D, GF, GA, GD, Pts, Win%; empty state: "Sin datos"
- [ ] T026 [US2] Create `packages/frontend/src/pages/stats.vue`: `definePageMeta({ middleware: "auth", requiresAuth: true })`; inject `useStatsFilters()`; `useAsyncData` for summary header (once); `useAsyncData` with `watch` for table data reacting to filter changes; render `<StatsHeader>`, `<StatsFocusSelector>`, `<StatsFilters>`, and the active `<StatsTableBy*>` component based on `mode`
- [ ] T027 [P] [US2] Write unit test `packages/frontend/tests/unit/components/pages/stats/StatsHeader.spec.ts`: renders all 10 record fields; handles zero/null values
- [ ] T028 [P] [US2] Write unit test `packages/frontend/tests/unit/components/pages/stats/StatsTableByYear.spec.ts`: correct columns rendered, rows mapped, empty state message shown when rows=[]
- [ ] T029 [P] [US2] Write Playwright E2E test `packages/frontend/tests/e2e/stats/auth-guard.spec.ts`: unauthenticated user redirected to login; post-auth redirect back to `/stats` (SC-006 regression check)

---

## Phase 6: User Story 3 – Authenticated user views rival-focused stats (Priority: P2)

**Goal**: From the stats dashboard, the user can switch to "All Rivals" view (one row per opponent, historical + yearly) and drill into a specific rival to see their per-year and per-tournament breakdown.

**Independent Test**: Log in → stats → select "All Rivals" focus → table shows one row per opponent. Select a specific rival → table shows per-year breakdown for that rival.

- [ ] T030 [P] [US3] Create `packages/frontend/src/components/pages/stats/StatsTableByTournament.vue`: props `{ rows: TeamStatPeriodDTO[], loading: boolean }`; columns: Tournament, Year, Games, W, L, D, GF, GA, GD, Pts, Win%; empty state
- [ ] T031 [P] [US3] Create `packages/frontend/src/components/pages/stats/StatsTableByRival.vue`: props `{ rows: TeamStatPeriodDTO[], mode: 'all' | 'single', loading: boolean }`; in `all` mode: one row per rival; in `single` mode: breakdown by year + tournament for that rival; columns adapt per mode; empty state
- [ ] T032 [US3] Wire "All Rivals" and "Specific Rival" focus modes into `packages/frontend/src/pages/stats.vue`: map `mode=all-rivals` to `GET /api/v1/statistics/team/by-rival`; map `mode=rival` to `GET /api/v1/statistics/team/rivals/:rivalId`; show `<StatsTableByRival>` with appropriate `mode` prop
- [ ] T033 [P] [US3] Write unit test `packages/frontend/tests/unit/components/pages/stats/StatsTableByRival.spec.ts`: all-rivals mode columns, single-rival mode columns, empty state

---

## Phase 7: User Story 4 – Authenticated user views player-focused stats (Priority: P3)

**Goal**: From the stats dashboard, the user can switch to "All Players" view (one row per player with participation + win rate) and drill into a single player to see per-year/tournament/rival breakdown.

**Independent Test**: Log in → stats → select "All Players" → table shows one row per player with goals, wins, win rate. Click/select a specific player → table shows that player's stats by year.

- [ ] T034 [P] [US4] Create `packages/frontend/src/components/pages/stats/StatsTableByPlayer.vue`: props `{ rows: PlayerStatRowDTO[], mode: 'all' | 'single', loading: boolean }`; in `all` mode: one row per player (name, games, W, L, D, goals, assists, winRate, goalRate); in `single` mode: per-year rows with same columns; empty state
- [ ] T035 [US4] Wire "All Players" and "Single Player" focus modes into `packages/frontend/src/pages/stats.vue`: map `mode=all-players` to `GET /api/v1/statistics/players?year=&rivalId=`; map `mode=player` to `GET /api/v1/statistics/players/:id?year=&rivalId=`; show `<StatsTableByPlayer>` with appropriate `mode` prop
- [ ] T036 [P] [US4] Write unit test `packages/frontend/tests/unit/components/pages/stats/StatsTableByPlayer.spec.ts`: all-players mode columns, single-player mode columns, goalRate displayed as decimal, empty state

---

## Phase 8: User Story 4 (cont.) – URL-driven filter state and shareability (Priority: P4)

**Goal**: All filter selections in the stats dashboard encode into URL query params. Copying the URL and opening it (while authenticated) restores the identical view.

**Independent Test**: Apply any filter combination → URL updates without full reload. Copy URL → open in new authenticated tab → same view restored. Invalid param in URL → silently ignored, defaults applied.

- [ ] T037 [US4] Verify `useStatsFilters.ts` (T018) encodes all 5 filter dimensions: `mode`, `year`, `tournament`, `rival`, `player` as URL query params; double-check `navigateTo` is called with `replace: true` to avoid polluting browser history
- [ ] T038 [P] [US4] Write Playwright E2E test `packages/frontend/tests/e2e/stats/filter-url-roundtrip.spec.ts`: apply mode + year + rival → URL encodes all; reload → same filters restored (SC-003, SC-004); invalid year param → graceful fallback

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation, regression check, and cleanup

- [ ] T039 Run full CMS test suite (`cd packages/cms && npm test`) — all 31+ tests pass; confirm T014 + T015 integration tests pass
- [ ] T040 [P] Run full frontend unit test suite (`cd packages/frontend && npm run test`) — all 79+ tests pass; confirm T020, T027, T028, T033, T036 pass
- [ ] T041 [P] Verify zero regressions on existing `statistics.vue` (public scorers page) — still works without auth; existing player profile stats section still renders
- [ ] T042 Manually verify all-time summary header shows correct totals matching imported CSV data (SC-007)
- [ ] T043 [P] Verify re-import idempotency on dev DB: run import twice → record counts unchanged (SC-008)

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

**Total tasks**: 43  
**Tasks by user story**:
- Foundation/Setup: T001–T015 (15 tasks)
- US5 (CSV import acceptance): T016–T017 (2 tasks)
- US1 (public player stats): T018–T021 (4 tasks)
- US2 (team dashboard): T022–T029 (8 tasks)
- US3 (rival stats): T030–T033 (4 tasks)
- US4 (player comparison + URL): T034–T038 (5 tasks)
- Polish: T039–T043 (5 tasks)

**Parallel opportunities**: 18 tasks marked `[P]` across all phases
