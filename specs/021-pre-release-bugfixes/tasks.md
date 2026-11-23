# Tasks: Pre-release bugfixes

**Input**: Design documents from `specs/021-pre-release-bugfixes/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `quickstart.md`, and `contracts/`

**Tests**: Tests are included because the constitution requires TDD for testable code. Add the focused regression tests before the corresponding implementation tasks.

**Organization**: Tasks are grouped by the user stories in `spec.md`. The specification's distinct “User Story 2b” is kept as `[US2b]`; subsequent labels follow the specification's story numbers.

## Phase 1: Setup

**Purpose**: No project initialization or dependency changes are required; this feature uses the existing npm workspace and package tooling described in `plan.md`.

## Phase 2: Foundational

**Purpose**: Implement and verify one safe, shared `returnUrl` resolver before navigation stories use it.

- [x] T001 Add failing unit tests for internal-path acceptance, malformed/protocol-relative/external/backslash rejection, and configured fallback behavior in `packages/frontend/src/utils/__tests__/returnUrl.test.ts`
- [x] T002 Implement the shared `returnUrl` validation and fallback helper in `packages/frontend/src/utils/returnUrl.ts`; callers must access route query state only through `packages/frontend/src/composables/useQueryParams.ts`

**Checkpoint**: Shared route validation is ready; all user-story work can begin after T002.

## Phase 3: User Story 1 - Admin game save refreshes the list correctly (Priority: P1) 🎯 MVP

**Goal**: Save create/edit game forms, return to a valid internal destination or the admin games index, and fetch fresh list data after save.

**Independent Test**: Save a created and edited game with valid, missing, and invalid `returnUrl` values; confirm the destination is correct and the latest game appears when `/admin/games` is opened without a manual refresh.

### Tests for User Story 1

- [x] T003 [P] [US1] Add failing tests for create/edit save destinations with valid, missing, and invalid `returnUrl` values in `packages/frontend/src/pages/admin/games/__tests__/game-save-navigation.test.ts`
- [x] T004 [P] [US1] Add a failing regression test that reopening the games index after a save fetches current CMS data rather than cached data in `packages/frontend/src/pages/admin/games/__tests__/games-index-freshness.test.ts`

### Implementation for User Story 1

- [x] T005 [US1] Route successful game create and edit saves through the shared return-path helper, falling back to `/admin/games`, in `packages/frontend/src/pages/admin/games/create.vue` and `packages/frontend/src/pages/admin/games/[id]/index.vue`
- [x] T006 [US1] Ensure the games index fetches fresh CMS data when opened after a save and preserves compatible active filters in `packages/frontend/src/pages/admin/games/index.vue`

**Checkpoint**: Create/edit saves and the fresh games index can be verified independently.

## Phase 4: User Story 2 - Cross-application returnUrl navigation preserves context (Priority: P1)

**Goal**: Carry valid internal `returnUrl` context across nested form flows and restore the unfinished game form when creating an opponent team.

**Independent Test**: Open nested create/edit flows from another route and verify valid internal return destinations are restored; from game creation, create a team and confirm the original game details and participants return with the new team selected, the game still unsaved, and the draft consumed.

### Tests for User Story 2

- [x] T007 [P] [US2] Add failing tests for round-tripping a game draft and participant identifiers through team creation, selecting the returned team, not submitting the game, and consuming the session draft in `packages/frontend/src/pages/admin/games/__tests__/game-team-return.test.ts`

### Implementation for User Story 2

- [x] T008 [US2] Persist only the in-progress game fields and participant identifiers in tab-scoped `sessionStorage`, restore once on return, select the newly created opponent, and clear the draft in `packages/frontend/src/pages/admin/games/create.vue`
- [x] T009 [US2] After successful team creation, persist its returned ID with the pending draft and navigate through validated `returnUrl` with `/admin/teams` as the configured fallback in `packages/frontend/src/pages/admin/teams/create.vue`
- [x] T010 [US2] Propagate validated `returnUrl` from admin list/detail entry points through player, playground, and tournament create/edit flows in `packages/frontend/src/pages/admin/players/index.vue`, `packages/frontend/src/pages/admin/players/create.vue`, `packages/frontend/src/pages/admin/players/[id]/edit.vue`, `packages/frontend/src/pages/admin/playgrounds/index.vue`, `packages/frontend/src/pages/admin/playgrounds/create.vue`, `packages/frontend/src/pages/admin/tournaments/index.vue`, `packages/frontend/src/pages/admin/tournaments/create.vue`, and `packages/frontend/src/pages/admin/tournaments/[tournamentId].vue`

**Checkpoint**: Nested flows preserve route context, and game-to-team creation restores but does not submit the game.

## Phase 5: User Story 2b - Shared back navigation standardizes admin flows (Priority: P2)

**Goal**: Use one reusable back-navigation component for admin back actions, honoring a valid return path or the component's configured destination.

**Independent Test**: Exercise `BackButton` with valid, missing, and invalid return paths, then inspect admin routes to confirm their main back actions use the shared component rather than duplicated raw links.

### Tests for User Story 2b

- [x] T011 [P] [US2b] Add failing component tests for `BackButton` return-path handling and configured fallback behavior in `packages/frontend/src/components/ui/__tests__/BackButton.test.ts`

### Implementation for User Story 2b

- [x] T012 [US2b] Implement `BackButton` navigation using the shared return-path resolver and its configured `to` fallback in `packages/frontend/src/components/ui/BackButton.vue`
- [x] T013 [US2b] Replace main admin back-action links with the shared `BackButton` while retaining each page's configured fallback in `packages/frontend/src/pages/admin/**/*.vue`

**Checkpoint**: Admin back actions consistently use the shared component and safely preserve route context.

## Phase 6: User Story 3 - Public roster and player filtering behave consistently and clearly (Priority: P1)

**Goal**: Show player status labels for “Todos”, search registered players across statuses, and keep guests out of the public roster.

**Independent Test**: Select a specific status and search; verify the selector switches to “Todos”, results include matching registered players across statuses but no guests, and clearing search leaves “Todos” selected. Select “Todos” directly and verify status labels appear on cards.

### Tests for User Story 3

- [x] T014 [P] [US3] Add failing roster tests for search across registered-player statuses, guest exclusion, automatic “Todos” selection, and retaining “Todos” after clearing search in `packages/frontend/src/pages/__tests__/roster.test.ts`
- [x] T015 [P] [US3] Add a failing test that selecting `OPTION_FILTER_ALL` emits the `selected` event in `packages/frontend/src/components/ui/Player/Status/__tests__/Select.test.ts`

### Implementation for User Story 3

- [x] T016 [US3] Emit the `selected` event when the status selector changes, including when `OPTION_FILTER_ALL` is selected, in `packages/frontend/src/components/ui/Player/Status/Select.vue`
- [x] T017 [US3] Make non-empty search select “Todos”, retain it when search is cleared, exclude `PlayerType.GUEST`, and show `Sin estado` or the supported Spanish status label above each card when appropriate in `packages/frontend/src/pages/roster.vue`

**Checkpoint**: Public roster filters, search, guest exclusion, and status labels work without relying on other stories.

## Phase 7: User Story 4 - Forms, labels, and dashboard surfaces are localized and accessible (Priority: P1)

**Goal**: Use static Spanish labels from canonical competition/status values, migrate existing `SEASON` records to `LEAGUE`, remove `SEASON` from supported types and imports, and standardize the dashboard recent-games table.

**Independent Test**: Verify forms and UI expose only `FRIENDLY`, `LEAGUE`, `CUP`, and `PLAYOFF`; requests and imports no longer accept/emit `SEASON`; a disposable database migration changes matching Game and Tournament types to `LEAGUE` without changing other row data; and dashboard rows use `UTable` with edit links to `/admin/games/:id`.

### Tests for User Story 4

- [x] T018 [P] [US4] Add failing tests that CMS game/tournament validation rejects `SEASON` and both import transformers map legacy Apertura/Clausura labels to `LEAGUE` in `packages/cms/tests/unit/competition-type-routes.test.ts`
- [x] T019 [P] [US4] Add failing tests for canonical Spanish competition labels and safe missing/unknown display fallbacks in `packages/frontend/src/components/ui/__tests__/competition-type.test.ts`
- [x] T020 [P] [US4] Add failing tests for dashboard recent-game columns, empty results, and edit actions targeting `/admin/games/:id` in `packages/frontend/src/pages/admin/__tests__/dashboard-recent-games.test.ts`

### Implementation for User Story 4

- [x] T021 [US4] Update the canonical shared `CompetitionType` to exactly `FRIENDLY`, `LEAGUE`, `CUP`, and `PLAYOFF`—the data-model constraint is “`competitionType` must be one of the canonical supported values (`FRIENDLY`, `LEAGUE`, `CUP`, `PLAYOFF`)”—in `packages/shared/src/types/game.ts`
- [x] T022 [US4] Update the Prisma enum to the four canonical values and create a migration that converts every Game and Tournament `SEASON` value to `LEAGUE` before replacing the PostgreSQL enum, preserving each row's other fields, in `packages/cms/prisma/schema.prisma` and `packages/cms/prisma/migrations/<timestamp>_remove_season_competition_type/migration.sql`
- [x] T023 [US4] Reject `SEASON` and validate only the canonical enum in the existing game and tournament API routes without changing response envelopes in `packages/cms/src/routes/games.ts` and `packages/cms/src/routes/tournaments.ts`
- [x] T024 [P] [US4] Map legacy Apertura and Clausura import labels to `LEAGUE` and ensure neither importer emits `SEASON` in `packages/cms/src/scripts/seed-import/transformers/games.ts` and `packages/cms/src/scripts/seed-import/transformers/tournaments.ts`
- [x] T025 [US4] Derive competition-type labels from the canonical enum, remove `SEASON` from game/tournament forms, use static Spanish display strings, and render `Sin tipo` or `Sin estado` for missing/unknown values in `packages/frontend/src/components/ui/TournamentCompetitionType.vue`, `packages/frontend/src/components/pages/games/GameStatusBadge.vue`, `packages/frontend/src/pages/admin/games/create.vue`, `packages/frontend/src/pages/admin/games/[id]/index.vue`, and `packages/frontend/src/components/pages/admin/tournaments/TournamentForm.vue`
- [x] T026 [US4] Render dashboard recent games with the admin `UTable` and `cellActions` pattern, support an empty result state, and link edit actions to `/admin/games/:id` in `packages/frontend/src/pages/admin/dashboard.vue`

**Checkpoint**: Canonical types are aligned across shared types, database, API, importers, forms, and dashboard; migration validation is performed against a disposable or staging database.

## Phase 8: User Story 5 - Dark mode and shared frontend composition improve release stability (Priority: P2)

**Goal**: Improve contrast when the root element has `.dark` and keep dashboard API transport in existing shared composables.

**Independent Test**: With `.dark` on the root HTML element, inspect public and admin surfaces for legible theme-token colors; verify dashboard data uses `useGames` and a shared `usePlayers` wrapper for existing CMS endpoints rather than duplicating `$api` calls.

### Tests for User Story 5

- [x] T027 [P] [US5] Add a failing test that theme tokens activate for the root `.dark` class in `packages/frontend/src/assets/__tests__/theme.test.ts`
- [x] T028 [P] [US5] Add failing tests for `usePlayers` list/create/update/delete requests, shared DTO usage, and existing CMS response envelopes in `packages/frontend/src/composables/__tests__/usePlayers.test.ts`

### Implementation for User Story 5

- [x] T029 [US5] Apply the existing Tailwind v4 theme tokens to root `.dark` across public and private surfaces without hard-coded component colors or a separate theme system in `packages/frontend/src/assets/theme.css`
- [x] T030 [US5] Implement a `usePlayers` composable for existing CMS player endpoints, reusing shared `Player`, `PlayerCreateDTO`, and `PlayerUpdateDTO` contracts in `packages/frontend/src/composables/usePlayers.ts`
- [x] T031 [US5] Use `useGames` and `usePlayers` for dashboard game/player data where their existing endpoint contracts support the required queries, removing duplicate direct `$api` transport in `packages/frontend/src/pages/admin/dashboard.vue`

**Checkpoint**: Root `.dark` uses existing theme tokens and dashboard API requests follow the shared composable layer.

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Validate the complete increment and migration using the feature's documented checks.

- [ ] T032 Run the focused frontend/CMS/shared checks and complete the admin, roster, theme, dashboard, and disposable-database migration scenarios in `specs/021-pre-release-bugfixes/quickstart.md`

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No setup tasks; the existing workspace and dependencies are reused.
- **Foundational (Phase 2)**: T001 precedes T002; T002 blocks all user-story navigation work.
- **User Stories (Phases 3–8)**: Begin after T002. Stories can otherwise proceed independently except for the noted same-file dashboard dependency.
- **Polish (Phase 9)**: Depends on the desired stories being complete.

### User Story Dependencies

- **US1 (P1)**: Starts after T002; T003/T004 may run in parallel, with T005 after T003 and T006 after T004.
- **US2 (P1)**: Starts after T002; T007 precedes T008/T009; T008 follows T005 because both update `packages/frontend/src/pages/admin/games/create.vue`. T010 may proceed after T002.
- **US2b (P2)**: Starts after T002; T011 precedes T012, which precedes T013. T013 follows T010 because both update admin route files.
- **US3 (P1)**: Starts after T002; T014/T015 may run in parallel; T016 follows T015 and T017 follows T014 and T016.
- **US4 (P1)**: Starts after T002; T018/T019/T020 may run in parallel. T021 precedes T022, T023, T024, and T025; T020 precedes T026. T025 follows T005 and T008 because it also updates the game create/edit pages.
- **US5 (P2)**: Starts after T002; T027/T028 may run in parallel; T029 follows T027 and T030 follows T028. T031 follows T030 and T026 because it updates the same dashboard page as the US4 table work.

### Within Each User Story

- Write and run the focused regression test(s) before implementing the behavior they cover.
- Keep migration ordering explicit: update the schema and data migration so both database columns are converted before the enum variant is removed.
- Shared competition enum changes precede API validation, importer, and display-map updates.
- The game form draft is restored and consumed before later submission; team creation must never submit a game.

### Parallel Opportunities

- T003 and T004 can run in parallel; T005/T006 then follow their corresponding tests. Sequence T008 after T005 and T025 after T008 to avoid conflicting edits to the game form pages.
- T014 and T015 are independent test files; T018, T019, and T020 are independent test files; T024 can run independently from the Prisma migration after T021.
- T027 and T028 are independent test files. Once foundational T002 is complete, independent work in US1, US2, US2b, US3, and US4 can proceed concurrently; sequence shared-file work T005 → T008 → T025 and T010 → T013. US5 dark-mode and composable work can also proceed independently until T031 integrates into the dashboard modified by T026.

## Parallel Example: User Story 1

```text
Task T003: Add save-navigation regression tests in packages/frontend/src/pages/admin/games/__tests__/game-save-navigation.test.ts
Task T004: Add games-index freshness regression tests in packages/frontend/src/pages/admin/games/__tests__/games-index-freshness.test.ts
```

## Parallel Example: User Story 4

```text
Task T018: Add CMS API/import competition-type tests in packages/cms/src/routes/__tests__/competition-type.test.ts
Task T019: Add canonical display/fallback tests in packages/frontend/src/components/ui/__tests__/competition-type.test.ts
Task T020: Add dashboard table/action tests in packages/frontend/src/pages/admin/__tests__/dashboard-recent-games.test.ts
```

## Implementation Strategy

### MVP First (User Story 1)

1. Complete T001–T002 to establish safe shared navigation validation.
2. Complete T003–T006 for admin game saves and fresh index data.
3. Stop and validate US1 independently using its test criterion and the game-save scenarios in `specs/021-pre-release-bugfixes/quickstart.md`.

### Incremental Delivery

1. Add US2 and US2b for nested return context and standardized admin back navigation.
2. Add US3 for public roster filtering and search.
3. Add US4 for canonical competition types, data migration, Spanish display, and dashboard table behavior.
4. Add US5 for dark mode and shared dashboard composables, then run T032.

### Parallel Team Strategy

Complete the shared return-path foundation first. After T002, assign navigation (US1/US2/US2b), roster (US3), and competition/dashboard (US4) work independently; assign dark-mode/composable work (US5) in parallel, sequencing its dashboard integration after T026.

## Notes

- Every task uses the required checkbox, sequential ID, optional `[P]`, applicable story label, and explicit repository file path.
- No `useI18n()`/`useLocale()` API, translation framework, new dependency, new API endpoint, or persistent entity is in scope.
- The source CSV is outside this repository; its owner must align it separately. The in-repository import transformers are covered by T024 and must not emit `SEASON`.
- The setup script was not run; task inputs were loaded directly from the feature artifacts and `.specify/templates/tasks-template.md`.
