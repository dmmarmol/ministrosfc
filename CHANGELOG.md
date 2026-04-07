# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/) at the project level.

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
