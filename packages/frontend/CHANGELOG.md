# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/) at the project level.

---

## [0.10.0] — 2026-04-20

### Added

- **Spec 017 — Team Statistics Views**: full statistics system for team, player, and historical data.
  - CMS `POST /api/v1/import/csv` endpoint: batch-imports `historial.csv`, `jugadores.csv`, `apariciones.csv` (and optional `canchas.csv`) via multipart upload; idempotent upsert on natural keys; maps `G/P/E` outcome codes, `DD/MM/YYYY` and `YYYY/MM/DD` date formats, `Titular/Suplente` → `isStarter`.
  - `canchas.csv` import: upserts Playground records by name (case-insensitive) and links historical games to their playground via `Game.playgroundId`; unmatched games emit a warning in `CsvImportResultDTO`.
  - CMS statistics endpoints: `GET /api/v1/statistics/team/summary`, `/team/by-year`, `/team/by-tournament`, `/team/by-rival`, `/team/rivals/:rivalId`, `/players` (optional `year`, `rivalId`, `status` params), `/players/:id` — all backed by Redis cache (5-min TTL).
  - `TeamStatPeriodDTO`, `TeamSummaryHeaderDTO`, `PlayerStatRowDTO`, `CsvImportResultDTO` shared TypeScript types in `@ministrosfc/shared`.
  - Frontend `/statistics` route with persistent side-nav (`statistics` Nuxt layout): two public links ("General" → `/statistics`, "Goleadores" → `/statistics/top-scorers`) always visible; four auth-gated links ("Por año", "Por torneo", "Por rival", "Por jugador") shown only when authenticated.
  - `/statistics/top-scorers`: publicly accessible all-time top-scorers table — no login required.
  - `/statistics`: authenticated team-summary dashboard showing `StatsHeader` with 10 all-time records; anonymous users see a login prompt and the summary API is not called.
  - Private sub-pages: `/statistics/years`, `/statistics/tournaments`, `/statistics/rivals`, `/statistics/rivals/:rivalId`, `/statistics/players`, `/statistics/players/:playerId` — all require authentication.
  - `StatsHeader.vue`: renders all 10 all-time records (rival most played/won/lost/drawn, best victory, worst defeat, top scorer, all-time totals).
  - `StatsFilters.vue`: self-loads option lists via `useStatisticsAvailableYears`, `useStatisticsAvailableTournaments`, `useStatisticsAvailableRivals`, `useStatisticsAvailablePlayers` composables; `mode` prop controls which controls are shown.
  - `StatsFocusSelector.vue`, `StatsTableByYear.vue`, `StatsTableByTournament.vue`, `StatsTableByRival.vue`, `StatsTableByPlayer.vue` components.
  - `useStatsFilters.ts` composable: reactive filter state backed by URL query params; `setFilter` updates URL without a full page reload; restores state on mount from `useRoute().query`.
  - `useQueryParams.ts` composable: single mutation point for URL query params — exposes `get`, `set`, `remove`; direct `router.push({ query })` calls outside this composable are a constitution violation.
  - Player public profile (`/players/:id`) extended with career stats (wins, losses, draws, win rate) and a year filter — publicly visible without authentication.
  - Main nav "Estadísticas" link: routes authenticated users to `/statistics`, anonymous users to `/statistics/top-scorers`.
  - `GET /api/v1/statistics/players` extended with optional `status` query param (`ACTIVE` | `INACTIVE`); frontend defaults to `status=ACTIVE`; "Estado" filter in `StatsFilters` constrains the player dropdown.
  - Prisma schema: `startTime`, `endTime`, `coach`, `photoUrl` added to `Game`; `isStarter` added to `GameParticipant`; `@@unique([date, opponentTeamId, tournamentId])` composite index on `Game`.

### Changed

- **Statistics route prefix**: `/stats/*` removed entirely; all statistics content now lives under `/statistics/*`. Requests to `/stats/*` return 404.
- **`winRate` API format**: returned as a percentage float (e.g. `60.0` = 60%), not a decimal fraction. Frontend renders with `.toFixed(1)%` — no `* 100` multiplication.
- **`StatsFilters` sub-components**: renamed from `*Filter.vue` to `*Select.vue` (e.g. `PlayerFilter.vue` → `PlayerSelect.vue`) for naming consistency.

### Tests

- CMS integration: `csv-import.test.ts` (happy path, idempotency, missing optional fields, unknown player auto-create, malformed date 422) and `team-stats.test.ts` (summary header, by-year, by-tournament, by-rival, single rival, 401 for unauthenticated).
- Frontend unit: `useStatsFilters.spec.ts` (URL param init, `setFilter`, `resetFilters`, invalid param guard); `StatsHeader.spec.ts`, `StatsFilters.spec.ts`, stats table component specs.
- Frontend E2E: `player-public-stats.spec.ts` (anonymous access, year filter URL update, shared URL restore).

---

## [0.9.0] — 2026-04-16

### Added

- **Spec 016 — User Promotion Governance**: full admin role management system.
  - CMS `PATCH /api/v1/admin/users/:id/role` endpoint with optimistic-concurrency guard (`expectedUpdatedAt`), self-demotion protection (403), and transactional player-record hard-delete on demotion.
  - Duplicate-email and stale-write conflicts return 409 with distinct error codes.
  - Rate-limiter middleware on sensitive admin endpoints.
  - `UserRoleManager.vue` frontend component: role `<select>` per user row, `ConfirmationModal` gate before every change, self-row disabled.
  - `BackButton.vue` reusable component; back-navigation added to `/login` (→ `/`) and `/auth/onboarding` (→ `/login?redirect=…` with open-redirect prevention).
  - `isUserSignedUp` computed exported from `useGameSignup` composable.
  - `useGameBySlug(slug)` composable consolidating slug resolution + game + participants fetch into a single `useAsyncData` call.

### Changed

- **`@ministrosfc/shared` utils**: `formatDate`, `formatDateTime`, `formatTime` (date formatting) and `getInitials` (string initials) moved from frontend-local utils into `packages/shared/src/utils/datetime.ts` and `strings.ts` and re-exported from `@ministrosfc/shared`. Deleted `packages/frontend/src/utils/formatDate.ts` and `initials.ts`.
- **Game detail pages** (`games/[slug]/index.vue`, `signup.vue`): replaced ad-hoc `useAsyncData` chains with `useGameBySlug` composable.

### Fixed

- Nuxt composable context loss: `useGameBySlug` is now synchronous (single `useAsyncData` handler) to avoid "called outside of Vue setup" warnings caused by `async` composables losing the Nuxt instance after `await`.

### Tests

- CMS integration: 31 tests including T022 (player record integrity on hard-delete) and T030 regression suite (duplicate email 409, stale write 409, concurrent success).
- Frontend unit: 79 tests across 14 files, including 33 for `UserRoleManager` and 13 for auth back-button navigation.

---

## [0.8.1] — 2026-04-13

### Added

- **Spec 015 completed**: introduced reusable `ConfirmationModal` based on `@nuxt/ui` and applied it to sensitive admin actions.
- **Shared datetime utility**: added `toISOWithOffset` in `@ministrosfc/shared` for consistent API datetime payload formatting.

### Changed

- **Admin confirmation UX**: standardized modal copy to Spanish across admin flows and kept focus-return behavior from invoking controls.
- **Spec lifecycle**: marked `specs/015-confirmation-modal/spec.md` as Implemented.

### Fixed

- **Players API filtering/sorting**: `status=ALL` now returns combined results with deterministic ordering (status first, then position group).
- **Game edit payload validation**: date/time submission now sends ISO 8601 datetime with timezone offset, resolving PATCH validation errors.

---

## [0.8.0] — 2026-04-13

### Added

- **Game signup/public capacity indicators (FR-044)**: public game detail and signup experiences now show a unified "Confirmados (X/Y)" header with a green "Equipo completo" state indicator when capacity is reached.
- **Game creation default capacity (FR-043)**: `/admin/games/create` now initializes `maxPlayers` with `DEFAULT_MAX_PLAYERS` and preserves clear-to-null behavior for unlimited games.
- **Position UI atoms**: introduced reusable position label/number presentation components for roster and admin player surfaces.

### Changed

- **Signup flow UX (Wave 3/4)**: `SignupAddPlayer`, signup header/table, and related pages were updated for improved roster clarity and invitation flow behavior.
- **Shared contracts/constants**: added exported shared constants and tightened participant typing around position values.
- **Frontend test suite alignment**: onboarding, auth, jersey rendering, signup table, middleware, and regression tests updated to match current runtime behavior and route contracts.

### Fixed

- **CMS test teardown reliability**: Redis disconnect and global test teardown handling improved, eliminating lingering open-handle warnings in Jest runs.
- **CMS API/test compatibility**: integration/unit tests and related service expectations aligned with current auth/register, profile, game, and participation contracts.

---

## [0.7.1] — 2026-04-09

### Added — Spec 013: DropdownAddMore Component

- **`DropdownAddMore.vue`**: New generic reusable dropdown component wrapping `vue-select@beta` with an `inline-create` scoped slot. Supports option selection, inline entry creation, loading/empty/error states, and searchable filtering.
- **`PlaygroundSelect.vue` refactored**: Hand-rolled `<select>` + inline form replaced by a thin adapter over `DropdownAddMore`. Public API unchanged — both game create/edit pages continue to work without modification.
- **CSS alignment**: vue-select visual theme overridden via CSS custom properties (`--vs-border-color`, `--vs-border-radius`, `--vs-font-size`, `--vs-dropdown-box-shadow`) to match the Tailwind design system.
- **24 unit tests** for `DropdownAddMore` covering all four user stories (select, inline create, search, loading/empty/error states).
- **6 unit tests** for the `PlaygroundSelect` adapter (composable wiring, option mapping, v-model, inline creation).

### Fixed

- `ProfileEditForm.test.ts`: Added functional stubs for `JerseyNumberInput` and `AddressAutocompleteInput` to prevent timer leaks and `useRuntimeConfig` errors in the test runner.

---

## [0.7.0] — 2026-04-07

### Added — Spec 012: Playground Entity (Game Locations)

- **Playground CRUD**: New `Playground` entity (name, address, geocoded lat/lng, audit fields). Admins and Editors can list, create, and edit playgrounds at `/admin/playgrounds`.
- **Admin map view**: Split-panel layout — 4-col table + 8-col interactive Leaflet.js / OpenStreetMap map. Clicking a table row centres the map; clicking a pin highlights the row.
- **Game location dropdown**: The free-text "Ubicación" field in game create/edit forms is replaced by a `PlaygroundSelect` dropdown listing all playgrounds alphabetically. Supports inline creation of a new playground without leaving the form.
- **Legacy location fallback**: Existing games with free-text `location` data continue to display correctly on public pages and in the edit form (read-only context above the dropdown).
- **Public display**: Schedule and game detail pages show `playground.name` when a playground is linked, falling back to the legacy `location` text field.
- **Address autocomplete (US5)**: All address fields — Playground create, Playground edit, and User Profile — use a new `AddressAutocompleteInput` combobox backed by a server-side Nominatim proxy (`GET /api/v1/address/search`). Debounced at 400ms, minimum 3 chars, country-biased to Argentina. Selecting a suggestion forwards pre-geocoded coordinates to the server, skipping a redundant Nominatim round-trip.
- **OSM attribution**: "© OpenStreetMap contributors" displayed in the autocomplete dropdown and on the admin map tile layer, satisfying ODbL license requirements.
- **Layout `noPadding` meta**: Admin layout now supports `noPadding: true` in `definePageMeta` for pages that need edge-to-edge content (e.g. the map page).

### Changed

- `Game` entity gains an optional `playgroundId` FK; legacy `location` text field is preserved.
- Admin sidebar includes a new "Canchas" navigation link (visible to Admins and Editors per FR-002).
- Leaflet zoom controls repositioned to bottom-right.
- Leaflet CSS added to global Nuxt CSS array (fixes tile rendering / z-order bug).

### Fixed

- `AddressAutocompleteInput`: `$fetch` was resolving relative URLs against the Nuxt frontend origin (port 5103) instead of the CMS (port 5102). Fixed by using the absolute `apiBaseUrl` from `useRuntimeConfig`.
- `ProfileEditForm.test.ts`, `AddressAutocompleteInput.test.ts`: Added `vi.stubGlobal("useRuntimeConfig", ...)` to correctly stub the Nuxt auto-import in Vitest.

---

## [0.6.4] — 2026-03-17

### Added — Spec 011: Shared Types Migration

- Migrated `PlayerProfileResponse` and `UpdatePlayerProfilePayload` into `@ministrosfc/shared`.
- Constitution v1.6.0: Principle VII — Shared Types and Cross-Package Contracts.

---

## [0.6.3] — prior

### Added — Spec 010: Jersey Number Input & Profile Edit UX

- Jersey number field added to the player profile edit form.
- UX improvements to the profile edit flow.
