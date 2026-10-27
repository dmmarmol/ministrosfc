# Changelog — @ministrosfc/frontend

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

For project-level release notes covering all packages, see the root [CHANGELOG.md](../../CHANGELOG.md).

---

## [Unreleased]

---

## [0.12.0] — 2026-05-03

### Added

- **Nuxt UI / Tailwind v4 upgrade**: Upgraded to Nuxt 4.4.2, @nuxt/ui 4.7.1, Tailwind CSS v4.2.4. New `src/assets/theme.css` design-token system using `@theme` block + `:root` / `[data-theme="dark"]` CSS variable pattern. `app.config.ts` extended with full `UButton` compound-variant configuration.
- `UiPositionSelect` component with `includeAll` prop (wraps `@ministrosfc/shared` `Position` enum; `includeAll=false` prevents `ALL` from being submitted in forms).
- `UiPlayerStatusSelect` reusable player-status dropdown component.
- `PlayerForm` shared form component for both create-player and edit-player pages; accepts `initialData?: Partial<PlayerFormData>` and `submitLabel` prop; exposes `#buttons` slot for page-specific actions.
- `LoadingOverlay` component (white/70% overlay).
- `UButton` reusable UI component aligned with @nuxt/ui 4 `UButton` API.
- `/admin/users/pending-approvals` page with `PendingApprovalQueue` table, `PendingApprovalReviewPanel` (ranked orphan-player suggestions + manual search + approve/deny/merge actions), all URL filter state via `useQueryParams`.
- `UserEditorPanel` component for post-approval merge from `/admin/users/[userId]` edition screen.
- `PendingApprovalBanner` component displayed after registration while account is under review.
- Activation status badge in admin user list.
- Custom ESLint rule restricting admin composable imports to admin-scope files only.

### Changed

- Auth store now handles `PENDING_APPROVAL` login response: shows pending banner instead of redirecting to onboarding.
- `pages/register.vue` shows `PendingApprovalBanner` on successful registration instead of redirecting.
- Admin player pages (`create.vue`, `[id]/edit.vue`) refactored to use shared `PlayerForm` component.
- Admin composables extracted to dedicated files with explicit `useQueryParams` imports.

### Fixed

- All admin pages now include `pageTitle` in `definePageMeta` (previously missing on several routes).

### Changed

- Production runtime configuration now honors deploy-provided `PORT` / `HOST` and Nitro equivalents while preserving the existing local `NUXT_PORT` / `NUXT_HOST` workflow.
- Fly.io frontend runtime was normalized around port `3000` for container startup, internal service routing, and health checks.

### Fixed

- Deployed Nuxt instances now boot with the same host/port contract expected by Fly.io, reducing environment-specific startup mismatches between local and hosted runs.

## [0.10.0] — 2026-04-21

### Added

- `/statistics` route with persistent side-nav (`statistics` Nuxt layout): two public links ("General", "Goleadores") always visible; four auth-gated links ("Por año", "Por torneo", "Por rival", "Por jugador") shown only when authenticated.
- `/statistics/top-scorers`: publicly accessible all-time top-scorers table with `playerStatus` filter and `goalRate` column.
- `/statistics`: authenticated team-summary dashboard with `StatsHeader` (10 all-time records); anonymous users see a login prompt.
- Private sub-pages: `/statistics/years`, `/statistics/tournaments`, `/statistics/rivals`, `/statistics/rivals/:rivalId`, `/statistics/players` — all require authentication.
- `StatsHeader.vue`: renders all 10 all-time records (rival most played/won/lost/drawn, best victory, worst defeat, top scorer, all-time totals).
- `StatsFilters.vue`: self-loads option lists via `useStatisticsAvailableYears`, `useStatisticsAvailableTournaments`, `useStatisticsAvailableRivals`, `useStatisticsAvailablePlayers` composables; `mode` prop controls which controls are shown.
- `StatsFocusSelector.vue`, `UiStatsTable.vue`, `StatsTableByYear.vue`, `StatsTableByTournament.vue`, `StatsTableByRival.vue`, `StatsTableByPlayer.vue` components.
- `useStatsFilters.ts` composable: reactive filter state backed by URL query params; `setFilter` updates URL without a full page reload; restores state on mount from `useRoute().query`.
- `useQueryParams.ts` composable: single mutation point for URL query params — exposes `get`, `set`, `remove`.
- Player public profile (`/players/:id`) extended with career stats (wins, losses, draws, win rate) and a year filter — publicly visible without authentication.
- Main nav "Estadísticas" link: routes authenticated users to `/statistics`, anonymous users to `/statistics/top-scorers`.
- `PlayerHeader.vue`, `CareerStats.vue`, `StatsByRival.vue` components extracted from player detail page.
- `PlayerCard.vue` updated with position label (`UiPositionLabel`) and jersey badge.

### Changed

- Statistics route prefix renamed: `/stats/*` → `/statistics/*` entirely. Requests to `/stats/*` return 404.
- `winRate` rendered as percentage float (`.toFixed(1)%`); no `* 100` multiplication.
- `*Filter.vue` sub-components renamed to `*Select.vue` (e.g. `PlayerFilter.vue` → `PlayerSelect.vue`).

### Tests

- `useStatsFilters.spec.ts`, `StatsHeader.spec.ts`, `StatsFilters.spec.ts`, stats table component specs.
- Frontend E2E: `player-public-stats.spec.ts` (anonymous access, year filter URL update, shared URL restore).

---

## [0.9.0] — 2026-04-16

### Added

- `UserRoleManager.vue`: role `<select>` per user row, `ConfirmationModal` gate before every change, self-row disabled.
- `BackButton.vue` reusable component; back-navigation added to `/login` (→ `/`) and `/auth/onboarding` (→ `/login?redirect=…` with open-redirect prevention).
- `isUserSignedUp` computed exported from `useGameSignup` composable.
- `useGameBySlug(slug)` composable: consolidates slug resolution + game + participants fetch into a single `useAsyncData` call.

### Changed

- Game detail pages (`games/[slug]/index.vue`, `signup.vue`): replaced ad-hoc `useAsyncData` chains with `useGameBySlug`.
- Auth store migrated to `useRuntime` composable pattern.

### Fixed

- Nuxt composable context loss: `useGameBySlug` is synchronous (single `useAsyncData` handler) to avoid "called outside of Vue setup" warnings caused by `async` composables losing the Nuxt instance after `await`.

### Tests

- 79 unit tests across 14 files including 33 for `UserRoleManager` and 13 for auth back-button navigation.

---

## [0.8.1] — 2026-04-13

### Added

- Reusable `ConfirmationModal` based on `@nuxt/ui`; applied to sensitive admin actions.

### Changed

- Admin confirmation modal copy standardised to Spanish across all admin flows; focus-return behavior preserved from invoking controls.

### Fixed

- Players API filtering/sorting: `status=ALL` now returns combined results with deterministic ordering (status first, then position group).
- Game edit payload: date/time submission now sends ISO 8601 with timezone offset, resolving PATCH validation errors.

---

## [0.8.0] — 2026-04-13

### Added

- Public game detail and signup: unified "Confirmados (X/Y)" header with "Equipo completo" state indicator when capacity is reached.
- `/admin/games/create`: `maxPlayers` initialised with `DEFAULT_MAX_PLAYERS`; preserves clear-to-null behavior for unlimited games.
- Reusable position label and number presentation components (`UiPositionLabel`).

### Changed

- `SignupAddPlayer`, signup header/table, and related pages updated for improved roster clarity and invitation flow behavior.
- Add-player button rendered as `disabled` instead of hidden when the game is full.

### Fixed

- Onboarding, auth, jersey rendering, signup table, middleware, and regression tests aligned with current runtime behavior.

---

## [0.7.1] — 2026-04-09

### Added

- `DropdownAddMore.vue`: generic reusable dropdown wrapping `vue-select@beta` with `inline-create` scoped slot; supports option selection, inline entry creation, loading/empty/error states, and searchable filtering.
- `PlaygroundSelect.vue` refactored as a thin adapter over `DropdownAddMore`; public API unchanged.
- CSS theme overrides for vue-select via CSS custom properties to match the Tailwind design system.
- 24 unit tests for `DropdownAddMore`; 6 unit tests for `PlaygroundSelect` adapter.

### Fixed

- `ProfileEditForm.test.ts`: functional stubs for `JerseyNumberInput` and `AddressAutocompleteInput` to prevent timer leaks and `useRuntimeConfig` errors.

---

## [0.7.0] — 2026-04-07

### Added

- `/admin/playgrounds`: split-panel layout — 4-col table + 8-col interactive Leaflet.js / OpenStreetMap map. Clicking a table row centres the map; clicking a pin highlights the row.
- `PlaygroundSelect` dropdown in game create/edit forms (replaces free-text "Ubicación" field); supports inline playground creation without leaving the form.
- Legacy `location` text field displayed as read-only fallback for existing games.
- Schedule and game detail pages show `playground.name` when linked, falling back to legacy `location` text.
- `AddressAutocompleteInput` combobox: debounced Nominatim proxy calls (400ms, min 3 chars, Argentina-biased); forwards pre-geocoded coordinates on selection.
- OSM attribution displayed in autocomplete dropdown and map tile layer.
- Admin layout `noPadding: true` meta support for edge-to-edge pages (e.g. the map page).
- Admin sidebar: "Canchas" navigation link (visible to Admins and Editors).
- Leaflet CSS added to global Nuxt CSS array; zoom controls repositioned to bottom-right.

### Fixed

- `AddressAutocompleteInput`: `$fetch` now uses absolute `apiBaseUrl` from `useRuntimeConfig` (was resolving relative URLs against frontend origin, causing 404).
- `ProfileEditForm.test.ts`, `AddressAutocompleteInput.test.ts`: added `vi.stubGlobal("useRuntimeConfig", ...)` to correctly stub Nuxt auto-import in Vitest.
- SSR guard added to auth middleware (fixes hard-refresh redirect on page reload).

---

## [0.6.4] — prior

### Changed

- `PlayerProfileResponse` and `UpdatePlayerProfilePayload` types consumed from `@ministrosfc/shared` (migrated from frontend-local definitions).

---

## [0.6.3] — prior

### Added

- Jersey number field added to player profile edit form.
- Live jersey preview on profile edit page.
- Player status toggle on profile edit form.
- `soccer-jersey` npm package replaces custom `JerseySvg` component.
- Player profile navigation improvements.

---

## [0.6.0] — prior

### Added

- User registration (`/register`), Google OAuth, and onboarding (`/auth/onboarding`) flows.
- Auth components: register form, sign-in, session management.
- Role-based navigation and admin controls.
- Game signup/invitation flow: `SignupAddPlayer`, roster table, capacity indicators.
