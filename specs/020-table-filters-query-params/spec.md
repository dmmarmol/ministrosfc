# Feature Specification: Table Filters, Query Params, and Admin Page Decomposition

**Feature Branch**: `018-table-filters-query-params`
**Created**: 2026-04-09
**Status**: Draft
**Input**: User description: "Update /admin/players and /admin/games views to include a search bar to filter the list of players and games respectively. The search should be case-insensitive and should filter by name for players and by opponent for games. Connect the UI filters and the search bar to the frontend query-params so that a user can share a link to a filtered list of players or games." Scope update: split large admin page components into smaller units, move core page logic into `components/pages/admin`, and standardize table rendering patterns (prefer Nuxt UI Table as base when feasible).

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Admin Filters the Players List by Name (Priority: P1)

An Admin opens `/admin/players`, types a name fragment in the search bar, and the player list narrows to only matching rows in real time — without a page reload. The current filter value is reflected in the URL so the Admin can share the filtered view.

**Why this priority**: The players list is the most frequently visited admin view and the most immediately useful to filter, especially as the club grows.

**Independent Test**: Navigate to `/admin/players`, type "Gom" in the search bar, verify only players whose name contains "gom" (case-insensitive) are shown, and verify the URL query param reflects the search term (e.g., `?search=Gom`).

**Acceptance Scenarios**:

1. **Given** the Admin is on `/admin/players`, **When** the page loads, **Then** a visible search bar labelled "Buscar jugador" (or similar) is present above the player table.
2. **Given** the Admin types in the search bar, **When** they type each character, **Then** the player list updates in real time (or with a short debounce) to show only players whose full name contains the typed text (case-insensitive).
3. **Given** the search bar contains text, **When** the Admin clears it, **Then** the full player list is restored.
4. **Given** the Admin types a search term, **When** the list updates, **Then** the URL query param `?search={term}` is updated without a full page reload (pushState / replaceState).
5. **Given** a URL like `/admin/players?search=Gom`, **When** the Admin navigates to it directly or shares it, **Then** the page loads with the filter pre-applied and the search bar pre-filled.
6. **Given** no players match the search term, **When** the list renders, **Then** an empty-state message "Sin resultados" is shown instead of an empty table.

---

### User Story 2 — Admin Filters the Games List by Opponent (Priority: P1)

An Admin opens `/admin/games`, types an opponent name fragment in the search bar, and the games list narrows in real time. The filter is URL-persisted.

**Why this priority**: Same value as US1 but for the games table; both tables are equally used by admins.

**Independent Test**: Navigate to `/admin/games`, type "River" in the search bar, verify only games with "River" in the opponent name are shown, and verify `?search=River` appears in the URL.

**Acceptance Scenarios**:

1. **Given** the Admin is on `/admin/games`, **When** the page loads, **Then** a visible search bar labelled "Buscar por rival" (or similar) is present above the games table.
2. **Given** the Admin types in the search bar, **When** they type each character, **Then** the games list updates to show only games whose `opponent` field contains the typed text (case-insensitive).
3. **Given** the search bar contains text, **When** the Admin clears it, **Then** the full games list is restored.
4. **Given** the Admin types a search term, **When** the list updates, **Then** the URL query param `?search={term}` is updated without a full page reload.
5. **Given** a pre-filled URL, **When** the Admin navigates to it, **Then** the filter is applied on load and the search bar is pre-filled.
6. **Given** no games match the search term, **When** the list renders, **Then** "Sin resultados" is shown.

---

### User Story 3 — Admin Pages Are Refactored into Reusable Table Units (Priority: P2)

An Admin-facing table page is maintained through small, focused UI units instead of large page files that mix rendering, filtering, and row actions. Core list logic is moved out of page files and reused from `components/pages/admin`.

**Why this priority**: This reduces maintenance risk and regression probability while preserving behavior as admin surfaces grow.

**Independent Test**: Review `/pages/admin` table pages and confirm each page delegates table rendering and list behavior to extracted units under `components/pages/admin`, while keeping existing user-visible behavior unchanged.

**Acceptance Scenarios**:

1. **Given** a table-driven admin page (games, players, playgrounds, teams, tournaments, users), **When** implementation is complete, **Then** core list/filter/table behavior is delegated to reusable components under `components/pages/admin`.
2. **Given** admin pages previously assembled table markup inline, **When** they are refactored, **Then** pages remain focused on route-level orchestration and data wiring.
3. **Given** the new table units are reused, **When** a table behavior change is needed, **Then** it can be applied in a shared component rather than duplicated across page files.
4. **Given** table rendering primitives are chosen, **When** a reusable base is available, **Then** Nuxt UI Table is preferred for consistency unless a documented exception applies.

---

### Edge Cases

- What happens when the user navigates back/forward using the browser? The filter state should be restored from the URL history entry.
- What if the search term contains special characters (e.g., `&`, `#`)? The term must be properly URL-encoded in the query param.
- What if both a search filter and a sort column are active simultaneously? Both state values should coexist in the URL as separate query params.
- What if one admin page needs custom columns/actions that do not fit the shared default? The shared table units should allow per-page slot or config extension without forking base behavior.
- What if migration happens incrementally page-by-page? Existing pages should remain functional during transition with no broken navigation or missing actions.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The `/admin/players` page MUST include a text search input that filters the displayed player list by full name, case-insensitively.
- **FR-002**: The `/admin/games` page MUST include a text search input that filters the displayed games list by `opponent`, case-insensitively.
- **FR-003**: Both search inputs MUST sync their current value to a `search` URL query parameter in real time (using `replaceState` to avoid bloating browser history on each keystroke).
- **FR-004**: Both pages MUST read the `search` query parameter on initial load and pre-apply the filter and pre-fill the search input.
- **FR-005**: Filtering MUST be performed client-side against the already-loaded list; no additional API calls are required for filtering.
- **FR-006**: When the search bar is cleared (empty string), the query param MUST be removed from the URL (not left as `?search=`).
- **FR-007**: When no rows match the current filter, an empty-state message "Sin resultados" MUST be shown in place of the table rows.
- **FR-008**: Table-heavy routes under `packages/frontend/src/pages/admin/**` (including games, players, playgrounds, teams, tournaments, and users) MUST be split into smaller page-facing units under `packages/frontend/src/components/pages/admin/**`.
- **FR-009**: Route page files under `packages/frontend/src/pages/admin/**` SHOULD act as orchestration layers (routing, page-level fetching, composition) and MUST NOT contain duplicated table-building logic across multiple pages.
- **FR-010**: Shared table behavior (headers, empty states, loading placeholders, common actions/slots wiring) MUST be centralized in reusable components instead of duplicated per page.
- **FR-011**: Refactoring to extracted admin page components MUST preserve existing user-visible behavior (filters, actions, labels, and row outcomes) unless explicitly changed by this spec.
- **FR-012**: For reusable table foundations, implementation SHOULD prefer Nuxt UI Table as the base component when it satisfies required behaviors; exceptions MUST be documented in spec artifacts.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Typing in the search bar updates the visible rows within 300ms (debounce ≤ 300ms or immediate).
- **SC-002**: A shared URL with `?search={term}` produces the same filtered view for any Admin who opens it.
- **SC-003**: The browser Back / Forward buttons correctly restore the previous filter state without a full page reload.
- **SC-004**: Zero additional HTTP requests are made to the CMS API when filtering (all filtering is client-side).
- **SC-005**: All targeted admin table pages render through extracted units in `components/pages/admin`, and no targeted page relies on a duplicated inline table implementation.
- **SC-006**: At least one shared table base used by multiple admin pages is implemented and reused, with Nuxt UI Table adopted where compatible.
- **SC-007**: Regression verification for targeted admin pages confirms parity for core actions (search/filter, row actions, empty/loading states).

## Assumptions

- The full dataset for each table is already loaded in memory (no pagination conflict exists at current data volumes).
- The filter is additive with any existing sort state; both can be active simultaneously.
- "Full name" for players means the `firstName + lastName` concatenation.
- Scope includes admin table pages under `packages/frontend/src/pages/admin/`: `games`, `players`, `playgrounds`, `teams`, `tournaments`, and `users`.
- Existing visual design should be preserved while decomposing structure into reusable units.
