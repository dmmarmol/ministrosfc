# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/) at the project level.

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
