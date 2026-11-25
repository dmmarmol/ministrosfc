# Research: Pre-release bugfixes

Research was resolved from the checked-in specification, constitution, workspace configuration, and current repository patterns. No external dependency or framework change is needed.

## Decisions

### 1. Frontend and test stack

- **Decision**: Use the existing TypeScript 5 / Vue 3 / Nuxt 4 frontend; frontend regression tests use Vitest and Vue Test Utils. CMS regression tests use the configured Jest suite unless/until that package is migrated.
- **Rationale**: `packages/frontend/package.json` identifies Nuxt 4.4, Vue 3, Vitest 3, and Vue Test Utils. `packages/cms/package.json` still runs Jest, which the constitution explicitly permits for an existing non-migrated suite.
- **Alternatives considered**: Introducing a new test runner or moving packages to another frontend framework. Rejected because existing project tooling covers the feature and new dependencies are unnecessary.

### 2. Route return validation and query access

- **Decision**: Centralize safe return-path validation and route all `returnUrl` reads through `useQueryParams`. Accept only valid same-application paths and fall back to the caller's configured local destination for missing or invalid values.
- **Rationale**: The constitution makes `useQueryParams` mandatory for query reads/writes. The spec explicitly excludes absolute, protocol-relative, malformed, or external destinations. A shared validation point avoids inconsistent fallbacks and open redirects.
- **Alternatives considered**: Trusting raw query values, using browser history as the sole return mechanism, or validating separately in every page. Rejected because raw values can navigate outside the app, history is not deterministic, and duplicated checks drift.

### 3. Game-form state while creating a team

- **Decision**: Persist a narrowly scoped game draft in tab-scoped `sessionStorage` while the user visits team creation, then restore and consume it on return, setting the new team's ID as opponent. Keep the saved game unsubmitted.
- **Rationale**: The form includes fields and a participant list that should not be serialized into route query parameters. `sessionStorage` is available in this client-side authenticated workflow and is already used by the app for browser-only state. Scoping the draft to the current tab avoids indefinite persistence.
- **Alternatives considered**: Query-serializing all fields and participants, adding a CMS draft endpoint/database entity, or retaining only in-memory component state. Rejected: the URL can become large and expose transient values, persistent backend storage exceeds bugfix scope, and in-memory state is lost on navigation.

### 4. Game-list freshness

- **Decision**: Ensure the games list makes a fresh CMS request when opened after a save by invalidating or bypassing the existing Nuxt async-data cache entry.
- **Rationale**: The admin games page currently uses `useAsyncData("admin-games", ...)` with a stable key. The `useGames` composable also has an explicit `fetchGames` request, but the list currently loads through `$api`; freshness must account for both patterns instead of relying on route re-entry.
- **Alternatives considered**: Relying on a browser reload or a manual refresh, and adding a new caching library. Rejected because neither guarantees the required workflow and no new cache dependency is warranted.

### 5. Player CRUD composable

- **Decision**: Implement/use a `usePlayers` frontend composable only for existing CMS player routes and import the existing shared `Player`, `PlayerCreateDTO`, and `PlayerUpdateDTO` types. Keep request/response transport in the composable.
- **Rationale**: CMS exposes public listing/detail and admin create/update/delete under `/api/v1/players`; shared player DTOs already exist. Existing `useGames` and `useOpponentTeams` provide the local composable style. Dashboard's existing direct `$api` player count can be replaced only where the composable preserves required filters/pagination.
- **Alternatives considered**: Duplicating API response interfaces in the frontend or adding new CMS endpoints. Rejected because both violate shared-contract principles and the existing endpoint set is sufficient.

### 6. Competition-type conversion and enum removal

- **Decision**: Use a new Prisma migration that converts `Game.competitionType` and `Tournament.competitionType` from `SEASON` to `LEAGUE` before rebuilding the PostgreSQL enum without `SEASON`. Update Prisma schema, shared enum/options, CMS route validators, UI display/selects, and both seed-import transformer maps.
- **Rationale**: The type is a PostgreSQL enum used by both Prisma models; the spec requires preserving all record data and removing the type, and PostgreSQL enum value removal requires a replacement strategy. Both importer transformers currently map “Torneo Apertura” and “Torneo Clausura” to `SEASON`; leaving them unchanged would generate unsupported values.
- **Alternatives considered**: Retaining `SEASON`, adding an alias at API level, deleting affected rows, or changing only UI labels. Rejected because these conflict with the explicit clarified requirement to migrate records and remove the type.
- **Source data note**: `packages/cms/data/imports/` currently contains only `.gitkeep`. The spec says the source CSV owner will align the CSV; the repository importer must independently stop emitting `SEASON`.

### 7. Theme and labels

- **Decision**: Keep Spanish UI labels as static copy and use canonical enum mappings. Reuse the existing Tailwind v4 `theme.css` variables and make them apply when the root element has `.dark`, as required by the spec.
- **Rationale**: The project has no active color-mode module (`@nuxtjs/color-mode` is commented out); its existing stylesheet defines tokens in `theme.css` under `:root` and `[data-theme="dark"]`. The spec requires root `.dark` support. Existing game status labels are already Spanish in `GameStatusBadge` and admin game header.
- **Alternatives considered**: Adding `useI18n`/`useLocale`, adding a translation package, or introducing a second set of component-local dark-mode colors. Rejected because the user explicitly clarified that no such composable exists and the existing theme-token architecture should remain the source of truth.

### 8. Dashboard recent-games rendering

- **Decision**: Follow the admin tournaments page's `UTable`, typed `ColumnDef`, and `cellActions` convention, with edit navigation to `/admin/games/:id`.
- **Rationale**: This pattern already exists in `packages/frontend/src/pages/admin/tournaments/index.vue` and directly matches FR-010.
- **Alternatives considered**: Keeping custom row markup or creating a new table abstraction. Rejected because it would diverge from the requested existing pattern without a new reuse need.

## Resolved Technical Context

- **Storage/migration**: PostgreSQL through Prisma; migration required for value conversion and enum removal.
- **API**: Existing Express routes are the source of truth; no endpoint is added.
- **Contracts**: Cross-package types remain in `packages/shared/src/types/`.
- **Validation**: Frontend Vitest; CMS current Jest suite; migration checked against a safe database snapshot.
- **Performance**: Maintain current request patterns and list limits; spec sets no numeric performance target.
- **Open clarification**: None blocking Phase 1. The source CSV file is not present in the repository; its owner-updated version is an external coordination dependency described in the plan.
