# Feature Specification: Team Statistics Views

**Feature Branch**: `feat/017-team-stats-views`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "Create private views to display tournament, games and individual players statistics. Player stats publicly visible. Filtered by year/tournament/rival. URL query params for sharing."
**CSV Source**: `data/historial.csv`, `data/jugadores.csv`, `data/apariciones.csv` (Google Spreadsheet exports; canonical source of historical data)

## User Scenarios & Testing _(mandatory)_

### User Story 1 – Any visitor views a player's public stats and shares them (Priority: P1)

An anonymous or authenticated user navigates to a player's public profile page and sees that player's career statistics (games played, won, lost, drawn, goals, win rate). They copy a link from the browser and share it with a friend who opens it and sees the identical filtered view.

**Why this priority**: Player stats visibility is the most outward-facing deliverable. It delivers standalone value to the community and requires no authentication.

**Independent Test**: Open `/players/{slug}` on the public site as a logged-out user → player career stats are visible. Copy the URL, open in incognito → same stats appear.

**Acceptance Scenarios**:

1. **Given** an anonymous user visits a player's public profile, **When** the page loads, **Then** the player's career stats (games played, won, lost, drawn, goals, win rate) are visible without requiring login.
2. **Given** a player's stats page is filtered by year, **When** the URL is shared and opened in a new tab, **Then** the same year filter is applied automatically.
3. **Given** a player user is logged in and views their own stats page, **When** they copy the link and share it, **Then** an anonymous user opening the link sees the same stats view.

---

### User Story 2 – Authenticated user views team-level statistics dashboard (Priority: P2)

An authenticated user (any role) navigates to a private stats section and can explore the team's historical performance: games played/won/lost/drawn per year, win rates per tournament, per rival, and all-time records (best win, worst loss, top scorer, etc.).

**Why this priority**: This is the core private stats experience. It requires authentication and covers the broadest set of data combinations.

**Independent Test**: Log in as any role → navigate to the stats section → the team overview header with all-time records is displayed, and the year/tournament/rival filters change the displayed table rows.

**Acceptance Scenarios**:

1. **Given** an authenticated user opens the stats section, **When** the page loads, **Then** a summary header shows all-time records (most games vs a rival, best win, worst loss, top scorer, total goals, win rate, etc.).
2. **Given** the user selects "All Years" focus, **When** the table renders, **Then** each row shows a year with games played, won, lost, drawn, and win rate.
3. **Given** the user selects "All Tournaments" focus, **When** the table renders, **Then** rows show tournament name, year, games played, won, lost, drawn, and win rate per tournament per year.
4. **Given** the user selects "All Rivals" focus, **When** the table renders, **Then** rows show rival name, games played, won, lost, drawn, and win rate historically and per year.
5. **Given** the user selects a specific rival, **When** the table renders, **Then** rows show break down by year/tournament showing games played, won, lost, drawn, and win rate for that rival.
6. **Given** an unauthenticated user tries to access the private stats URL directly, **When** the page loads, **Then** they are redirected to the login page.

---

### User Story 3 – Authenticated user views player-focused statistics (Priority: P3)

An authenticated user navigates to the player stats view and can see all players ranked by participation, goals, and win rate. They can also drill into a single player to see their performance broken down by year, tournament, and rival.

**Why this priority**: Depends on the team stats infrastructure. Player-level drill-down is the most complex view but builds on the same data.

**Independent Test**: Log in → navigate to stats → switch to "All Players" view → table shows one row per player with participation rate, goals, win rate. Click a player → filtered view shows their stats by year.

**Acceptance Scenarios**:

1. **Given** the user selects "All Players" focus, **When** the table renders, **Then** each row shows a player with games played, participation rate (games played / total team games as %), goals, win rate historically and per year.
2. **Given** the user selects a single player, **When** the table renders, **Then** rows show that player's stats broken down by year, tournament, and rival (games played, won, lost, goals, goal rate, win rate).
3. **Given** the user applies a year filter and selects a player, **When** the table renders, **Then** only data for that year plus that player is shown.

---

### User Story 4 – Filters are reflected in the URL and shareable (Priority: P4)

Any authenticated user selects filters (focus mode, year, tournament, rival, player) and the URL updates immediately to reflect the selection. They copy and paste the URL to a colleague who is also authenticated and lands on the same filtered view.

**Why this priority**: URL-driven state is required by the product description and enables collaboration. It's a cross-cutting concern that applies to all stats views.

**Independent Test**: Apply any combination of filters → URL updates → copy URL → open in new tab while logged in → same view is restored exactly.

**Acceptance Scenarios**:

1. **Given** a user changes the focus mode or any filter, **When** the change is applied, **Then** the URL query params update to encode the current filter state without a full page reload.
2. **Given** a user loads a URL with pre-set query params, **When** the stats page initializes, **Then** the filters are restored and the correct data is displayed immediately.
3. **Given** a user shares the URL with another authenticated user, **When** the second user opens it, **Then** they see the identical filtered stats view.

---

### User Story 5 – Admin imports CSV exports from Google Spreadsheet to seed historical data (Priority: P2)

The team has been tracking games and player appearances in a Google Spreadsheet. An admin exports the three sheets (Historial, Jugadores, Apariciones) as CSV files and uploads them via the CMS to seed all historical data into the app. After import, the spreadsheet is no longer updated — the app becomes the sole source of truth.

**Why this priority**: Without this seeding mechanism there is no data to display in the statistics views. It must be completed before the stats dashboard delivers real value.

**Independent Test**: Export three CSVs from the spreadsheet → upload via CMS import → the stats dashboard displays the historically accurate figures matching the spreadsheet totals.

**Acceptance Scenarios**:

1. **Given** an admin uploads the three valid CSV files, **When** the import completes, **Then** all games, players, and appearances are created in the database with no data loss.
2. **Given** an admin re-uploads the same CSV files a second time, **When** the import completes, **Then** no duplicate records are created (idempotent import).
3. **Given** a CSV file contains rows with missing optional fields (e.g., blank comments, missing photo URL), **When** the import runs, **Then** those rows are imported with null/empty values for optional fields without failing the import.
4. **Given** a CSV row in Apariciones references a player name that does not yet exist in Jugadores, **When** the import runs, **Then** the appearance is still created and the player is created from minimal data to ensure no appearance is lost.
5. **Given** the import completes successfully, **When** the admin navigates to the stats dashboard, **Then** the all-time summary header reflects numbers consistent with the imported data.

---

### User Story 6 – Admin imports canchas.csv to seed Playground records and link them to historical games (Priority: P2)

The team also tracks the fields ("canchas") where each game was played in the same Google Spreadsheet. An admin exports the Canchas sheet as a CSV and uploads it alongside the other imports. The system creates or updates Playground records and links each historical game to its corresponding playground.

**Why this priority**: Playground data enriches the historical game records. Without it, `Game.playgroundId` remains null for all imported games. This is additive to US5 and does not block any stats views.

**Independent Test**: Upload `canchas.csv` via the same import endpoint → Playground records are created → each game that references a cancha has its `playgroundId` populated.

**Acceptance Scenarios**:

1. **Given** an admin uploads a valid `canchas.csv`, **When** the import completes, **Then** all unique playground names from the CSV are created as Playground records.
2. **Given** a game in Historial has an "Estadio" value that matches a playground name in Canchas, **When** the import completes, **Then** that game's `playgroundId` is set to the matching Playground record.
3. **Given** a game's "Estadio" value does not match any playground in Canchas, **When** the import completes, **Then** the game's `location` string is preserved as-is and `playgroundId` remains null — a warning is added.
4. **Given** the same `canchas.csv` is re-uploaded, **When** the import completes, **Then** no duplicate Playground records are created (idempotent by name).
5. **Given** `canchas.csv` is omitted from the upload, **When** the import completes, **Then** the other three CSVs are processed normally and no error is returned; playground linking is simply skipped.

---

### User Story 7 – Nav consolidation: unified `/statistics` route for public and private views (Priority: P2)

> **Amendment (2026-04-17)**: Originally specified that `/statistics/index` would display the public top-scorers table. After implementation review, a route split was adopted: `/statistics/top-scorers` is the dedicated public scorers page, while `/statistics` is the authenticated team-summary dashboard. The nav link behaviour and sub-nav structure were updated accordingly. FR-024 and FR-025 reflect the final implemented state.

All statistics content lives under the `/statistics` route prefix. The feature introduces two distinct public/private segments:

- **`/statistics/top-scorers`** — publicly accessible page showing the all-time top-scorers table. No authentication required.
- **`/statistics`** — authenticated summary dashboard showing the all-time `StatsHeader`. Anonymous users see a login prompt; authenticated users see the summary. The four private sub-pages (`/years`, `/tournaments`, `/rivals/*`, `/players/*`) require authentication.

The main navigation "Estadísticas" link conditionally redirects: authenticated users go to `/statistics`; anonymous users go to `/statistics/top-scorers`. The `statistics` Nuxt layout renders a persistent side-nav: two public links ("General" → `/statistics`, "Goleadores" → `/statistics/top-scorers`) visible to all users, plus four auth-gated links visible only when authenticated. The legacy `/stats/*` path is removed entirely.

**Why this priority**: Improves discoverability — a single nav entry leads to all statistics content regardless of auth state. Removes the inconsistency of two separate route prefixes. Separating the public scorers table into its own route makes it linkable and independently shareable.

**Independent Test**: Anonymous → nav "Estadísticas" → lands on `/statistics/top-scorers`, table visible, auth links hidden in sub-nav. Authenticated → nav "Estadísticas" → lands on `/statistics`, summary header visible, all six sub-nav links visible. Click "Por año" → `/statistics/years` loads. Navigate to `/statistics/years` while logged out → redirected to login. Access `/stats/years` → 404.

**Acceptance Scenarios**:

1. **Given** an anonymous user clicks "Estadísticas" in the main nav, **When** navigation completes, **Then** they land on `/statistics/top-scorers` and the top-scorers table is visible.
2. **Given** an authenticated user clicks "Estadísticas" in the main nav, **When** navigation completes, **Then** they land on `/statistics` and the all-time summary header is visible.
3. **Given** any user opens `/statistics/top-scorers` directly, **When** the page loads, **Then** the top-scorers table is visible without requiring login.
4. **Given** an anonymous user opens `/statistics` directly, **When** the page loads, **Then** a login prompt is shown (no stats data); the team/summary API is NOT called.
5. **Given** any user is on any `/statistics/*` page, **When** the page renders, **Then** a side-nav is visible with "General" and "Goleadores" links always present; the four private links ("Por año", "Por torneo", "Por rival", "Por jugador") are additionally shown only when authenticated.
6. **Given** an authenticated user clicks any private sub-nav link, **When** navigation completes, **Then** the corresponding private stats view (`/statistics/years`, `/statistics/tournaments`, `/statistics/rivals`, `/statistics/players`) is rendered.
7. **Given** an unauthenticated user navigates directly to `/statistics/years` (or any other private sub-route), **When** the page loads, **Then** they are redirected to login and after authentication are returned to the original URL.
8. **Given** any request arrives at `/stats/*`, **When** handled by the router, **Then** a 404 is returned — the old route prefix no longer exists.

---

### Edge Cases

- What happens when there are no games recorded for a given year or tournament? → Table shows that row/period with all values as zero and a "No data" label.
- What happens when a player has zero goals? → Their goal rate displays as 0.00%, not a division error.
- What happens when an unauthenticated user lands on a private stats URL? → Redirected to login; after auth, redirected back to the original `/statistics/*` sub-route URL (the `auth.ts` middleware preserves the intended destination via a `redirect` query param; this applies to all `/statistics/years`, `/statistics/tournaments`, `/statistics/rivals/*`, and `/statistics/players/*` sub-routes).
- What happens when the URL contains invalid filter values (e.g., a non-existent year or rival id)? → Invalid filters are silently ignored; defaults are applied and the URL is corrected.
- What happens when the team has only played one game historically? → All stats calculate correctly with no division errors or empty-state crashes.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: Player career stats (games played, won, lost, drawn, goals, win rate) MUST be publicly visible on each player's profile page without requiring authentication.
- **FR-002**: All other statistics views (team dashboard, rival breakdown, player ranking) MUST be accessible only to authenticated users regardless of role.
- **FR-003**: The system MUST calculate all statistics in the backend; the frontend MUST only display pre-calculated results.
- **FR-004**: The stats section MUST support the following focus modes, each changing the table columns and rows accordingly:
  - **All Years**: one row per year — games played, won, lost, drawn, win rate.
  - **All Tournaments**: one row per tournament per year — games played, won, lost, drawn, win rate.
  - **All Rivals**: one row per rival with all-time totals — games played, won, lost, drawn, win rate. Per-year and per-tournament breakdown is only available in Specific Rival mode.
  - **Specific Rival**: one row per year/tournament for the selected rival.
  - **All Players**: one row per player — games played, participation rate (games played / total team games as %), goals, win rate historically and per year.
  - **Single Player**: one row per year/tournament/rival for the selected player — games played, won, lost, goals, goal rate, win rate.
- **FR-005**: The table columns MUST include where applicable: Year, Tournament, Period (start–end date of tournament), Games Played, Games Won, Games Lost, Games Drawn, Points Earned, Win Rate %, Goals For, Goals Against, Goal Difference, Goal Rate For (goals scored / games played), Goal Rate Against (goals conceded / games played). Participation Rate % (player games played / total team games in scope) applies to All Players and Single Player views only.
- **FR-006**: The stats page MUST include a static summary header displaying the following all-time team records:
  - Rival with most games played against (name and count)
  - Rival with most wins against (name and count)
  - Rival with most losses against (name and count)
  - Rival with most draws against (name and count)
  - Best victory (rival name, tournament, date)
  - Worst defeat (rival name, tournament, date)
  - Rival with most goals scored against (name and count)
  - Rival with most goals conceded against (name and count)
  - Player with most goals scored historically (name and count)
  - All-time totals: games played, goals for, goals against, points, win rate, goal rate
- **FR-007**: All active filter selections MUST be encoded as URL query parameters, updating the URL without a full page reload.
- **FR-008**: Loading a URL with filter query params MUST restore the exact filtered view on page initialization.
- **FR-009**: A Player user MUST be able to share a direct link to their own public stats page with unauthenticated users.
- **FR-010**: The stats section MUST support filtering by year (select), tournament (select), and rival (select) where applicable per focus mode.
- **FR-011**: The system MUST handle zero-data states gracefully (no crashes, clear empty-state messaging).
- **FR-012**: The CMS MUST provide a batch import endpoint that accepts three CSV files (Historial, Jugadores, Apariciones) matching the historical spreadsheet export format.
- **FR-013**: The import MUST be idempotent — re-uploading the same CSVs MUST NOT create duplicate records; existing records are matched and skipped or updated.
- **FR-014**: The import MUST parse date formats used in the CSVs: `DD/MM/YYYY` for game dates in Historial and `YYYY/MM/DD` in Apariciones.
- **FR-015**: The import MUST link Apariciones rows to their corresponding game via the combination of (date + rival + tournament); if no matching game is found, the appearance row is skipped and a warning is added to the import result.
- **FR-016**: The import MUST link Apariciones to Players by name; if no matching player exists, a minimal player record MUST be created so the appearance is not lost.
- **FR-017**: CSV rows with blank optional fields (comments, photo URL, image URL, coach) MUST be imported successfully with null/empty values.
- **FR-018**: Conclusion codes in Historial MUST be mapped as follows: `G` → Win, `P` → Loss, `E` → Draw.
- **FR-019**: The import endpoint MUST accept an optional fourth file field `canchas` (CSV). If omitted, all other processing continues normally without error.
- **FR-020**: Each row in `canchas.csv` represents one Playground. The system MUST upsert Playground records by `name` (case-insensitive, trimmed).
- **FR-021**: After Playground upsert, the system MUST update each `Game` whose `location` string matches the playground name (case-insensitive, trimmed) to set `Game.playgroundId`.
- **FR-022**: Games whose `location` does not match any playground in `canchas.csv` MUST have their `location` field preserved and `playgroundId` left null; a warning entry MUST be added to the import result per unmatched game.
- **FR-023**: The `CsvImportResultDTO` MUST include a `playgrounds` counter object `{ created, updated, skipped }` and the warning list MUST include messages for unmatched game-to-playground associations.
- **FR-024**: The `/statistics/top-scorers` route MUST be publicly accessible and display the all-time top-scorers table without requiring authentication. The `/statistics` route MUST display the authenticated team-summary dashboard (`StatsHeader`); anonymous users reach this page and see a login prompt — the team/summary API MUST NOT be called for unauthenticated users. The private dashboard sub-pages MUST be accessible under `/statistics/*` only. The legacy `/stats/*` prefix MUST NOT exist — requests to `/stats/*` result in a 404.
- **FR-025**: The main navigation "Estadísticas" link MUST conditionally route: authenticated users → `/statistics`; anonymous users → `/statistics/top-scorers`. The `statistics` Nuxt layout's side-nav MUST always render two public links ("General" → `/statistics`, "Goleadores" → `/statistics/top-scorers`) and conditionally render four auth-gated links ("Por año", "Por torneo", "Por rival", "Por jugador") when the user is authenticated.
- **FR-026**: The `GET /api/v1/statistics/players` endpoint MUST accept an optional `status` query parameter (`ACTIVE` | `INACTIVE`). When provided, only players with the matching `Player.status` are included in the aggregation. The `/statistics/players` page MUST default to `status=ACTIVE` on initial load. In `StatsFilters` `players` mode, the "Jugador" filter and the "Estado" `<select>` MUST be displayed next to each other. The "Estado" filter MUST allow toggling between "Activos" (`ACTIVE`), "Inactivos" (`INACTIVE`), and "Todos los estados" (no filter), and the "Jugador" dropdown options MUST be constrained by the currently selected status (only active players for `ACTIVE`, only inactive players for `INACTIVE`, all players when no status is selected). If a selected player becomes invalid after a status change, the player selection MUST be cleared. The selected status value MUST be encoded as the `playerStatus` URL query parameter per FR-007.

### CSV Import Data Structure

The following column mappings define how the Google Spreadsheet exports map to the app's data model:

**Historial.csv** (one row per game):

| CSV Column        | Entity Field          | Notes                        |
| ----------------- | --------------------- | ---------------------------- |
| Fecha             | game.date             | Format: DD/MM/YYYY           |
| Torneo            | tournament.name       | Match or create tournament   |
| Comienzo          | game.start_time       | HH:MM                        |
| Finalización      | game.end_time         | HH:MM                        |
| Equipo            | game.home_team        | Always "Ministros FC"        |
| Rival             | game.rival            | Opponent team name           |
| Estadio           | game.venue            | Stadium / field name         |
| Goles Convertidos | game.goals_for        | Integer                      |
| Goles Recibidos   | game.goals_against    | Integer                      |
| Resultado         | game.score_string     | e.g. "3-1"                   |
| Conclusión        | game.outcome          | G=Win, P=Loss, E=Draw        |
| Apariciones       | game.appearance_count | Derived count, informational |
| DT                | game.coach            | Optional                     |
| Comentarios       | game.comments         | Optional                     |
| Foto              | game.photo_url        | Optional URL                 |

**Jugadores.csv** (one row per player):

| CSV Column   | Entity Field         | Notes                                                         |
| ------------ | -------------------- | ------------------------------------------------------------- |
| Jugador      | player.name          | Full name, lookup key                                         |
| Apodo        | player.nickname      |                                                               |
| Nacimiento   | player.birth_date    | Optional DD/MM/YYYY                                           |
| Edad         | (derived)            | Not stored                                                    |
| Altura       | player.height_cm     | Integer cm, optional                                          |
| Numero       | player.jersey_number | Integer                                                       |
| Pie          | player.dominant_foot | e.g. "Diestro"                                                |
| Posición     | player.position      | e.g. "SMF"                                                    |
| DNI          | player.dni           | Optional identifier                                           |
| Telefono     | player.phone         | Optional                                                      |
| Imagen (URL) | player.image_url     | Optional                                                      |
| Status       | player.status        | `ACTIVE` or `INACTIVE`; defaults to `ACTIVE` if blank/invalid |

**Apariciones.csv** (one row per player per game):

| CSV Column       | Entity Field               | Notes                      |
| ---------------- | -------------------------- | -------------------------- |
| Fecha            | appearance.game_date       | Format: YYYY/MM/DD         |
| Rival            | appearance.rival           | Used to link to game       |
| Torneo           | appearance.tournament      | Used to link to game       |
| Resultado        | appearance.score_string    | Used to link to game       |
| (5th col)        | appearance.outcome         | G/P/E                      |
| Jugador          | appearance.player_name     | Full name, links to player |
| Jugador (apodo)  | appearance.player_nickname | Informational              |
| Goles            | appearance.goals           | Integer                    |
| Amarilla         | appearance.yellow_cards    | Integer                    |
| Roja             | appearance.red_cards       | Integer                    |
| Titular/Suplente | appearance.status          | "Titular" or "Suplente"    |
| Comentarios      | appearance.comments        | Optional                   |

### Key Entities

- **Game** (from Historial.csv): date, start_time, end_time, rival, venue, goals_for, goals_against, outcome (Win/Loss/Draw), coach, comments, photo_url.
- **Tournament**: name; groups multiple games; linked to each game.
- **Player** (from Jugadores.csv): name (lookup key), nickname, birth_date, height_cm, jersey_number, dominant_foot, position, dni, phone, image_url.
- **Appearance** (from Apariciones.csv): links a Player to a Game; records goals, yellow_cards, red_cards, status (Titular/Suplente), comments.
- **PlayerStat**: Aggregated stats for a player across a scope — derived from Appearance records; not stored directly.
- **TeamStat**: Aggregated stats for the team across a scope — derived from Game records; not stored directly.

### Assumptions

- Historical data originates from a Google Spreadsheet and will be seeded via a one-time CSV import; after import the spreadsheet is retired and the app becomes the sole source of truth.
- The CSV export format matches the column structure documented in the CSV Import Data Structure section above.
- Game results (scores, goals per player, participating players) are the source of all statistical calculations; no pre-aggregated stats are stored in the database.
- Stats calculations are performed server-side and returned as pre-aggregated objects; no heavy computation happens in the browser.
- The public player profile page (`/players/{slug}`) already exists; this spec adds the stats section to it.
- "Points earned" follows standard football scoring: 3 for a win, 1 for a draw, 0 for a loss.
- The public top-scorers page and private stats dashboard are served under a single `/statistics` route. The `/stats/` prefix is removed. Anonymous users see the top-scorers table at `/statistics`; authenticated users additionally see a sub-nav with links to the private sub-pages. Sub-routes under `/statistics` used per focus mode: `/statistics/years`, `/statistics/tournaments`, `/statistics/rivals`, `/statistics/rivals/:rivalId`, `/statistics/players`, `/statistics/players/:playerId`. All sub-routes require authentication.
- Goal rate is defined as goals scored divided by games played, rounded to 2 decimal places.
- Player matching during CSV import uses the full name field (`Jugador`) as the lookup key; partial or nickname-only matches are not supported.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An anonymous user can view any player's public stats in under 2 seconds on a standard connection.
- **SC-002**: All 6 focus modes render the correct table columns and data — verified by at least one acceptance test per mode.
- **SC-003**: Applying any filter combination updates the URL query params within the same page interaction — verified by checking that the browser URL changes without a full reload.
- **SC-004**: Loading a shared stats URL with any valid filter combination restores the exact same view 100% of the time — verified by round-trip URL tests.
- **SC-005**: The all-time summary header displays all 10 required records, with correct values matching the underlying game data.
- **SC-006**: Zero regressions from the current passing test suite (79/79 frontend, 31/31 CMS baseline).
- **SC-007**: Admin can complete the full CSV import (all three spreadsheet exports) in a single operation and the resulting stats dashboard matches the historical spreadsheet totals for games played, goals for/against, and win rate.
- **SC-008**: Re-running the same CSV import produces no duplicate records — verified by running the import twice and comparing record counts.
- **SC-009**: An anonymous user navigating to `/statistics` sees the top-scorers table and no sub-nav. An authenticated user on the same page sees the sub-nav with links to the four private sections. Navigating to any `/statistics/*` sub-route without being logged in redirects to login. The `/stats/*` prefix returns 404.

---

## Amendments

### Amendment 2026-04-17 — URL Query Param Centralization, Statistics Layout, and playgroundName Fixes

#### New: `useQueryParams` composable

A new composable `packages/frontend/src/composables/useQueryParams.ts` was created as the single mutation point for URL query params. It exposes `get(key): string`, `set(key, value): Promise<void>`, and `remove(key): Promise<void>`. Calling `set("key", "")` removes the key from the URL cleanly. All direct `router.push({ query })` calls outside this composable are a constitution violation (Principle VI, v1.9.1). **Exception**: `navigateTo({ query: ... })` called from within a composable (e.g. `useStatsFilters.ts`) is permitted as an implementation detail — `navigateTo` is a Nuxt-level utility distinct from `useRouter().push()`. This exception applies only when the composable is itself the single mutation surface for URL state; direct `navigateTo({ query })` calls from page or component templates remain a violation.

#### New: `statistics-private` Nuxt layout

A new layout `packages/frontend/src/layouts/statistics-private.vue` was introduced. It renders `<StatsFilters>` above the page slot and owns all filter → URL wiring via `useQueryParams`. Filter visibility is controlled by `route.meta.filtersMode` (typed as `StatsFiltersMode`). All four private stats pages (`years`, `tournaments`, `rivals/index`, `players/index`) were migrated to use this layout.

#### New: `useStatisticsAvailableTournaments` composable

`packages/frontend/src/composables/useStatisticsAvailableTournaments.ts` fetches `GET /api/v1/tournaments` and returns `{ value: string; label: string }[]` deduplicated by tournament name (multiple "Amistoso" editions collapse to a single option). The value is the tournament name string, used for name-based API filtering.

#### New: `StatsFiltersMode` shared type

`export type StatsFiltersMode = "years" | "tournaments" | "rivals" | "players"` was added to `packages/shared/src/types/statistics.ts`. Both the layout and `StatsFilters` component import it from `@ministrosfc/shared`. Two additional single-entity variants — `"player"` and `"rival"` — are confirmed used in `players/[id].vue` and `rivals/[id].vue` (detail pages where the filter bar is scoped to a single entity context, not an aggregate list). These variants are included in `StatsFiltersMode` as part of `@ministrosfc/shared` via T066.

#### Backend: `tournamentName` filter propagated to all stats endpoints

The `tournamentName?: string` filter was added to `teamStatsQuerySchema` (Zod), and propagated through `StatisticsService` methods (`getTeamStatsByTournament`, `getTeamStatsByRival`, `getAllPlayerStats`) and their corresponding `StatisticsModel` methods (`aggregateTeamByTournament`, `aggregateTeamByRival`, `aggregatePlayersAll`). Cache keys were updated to include the `tournamentName` segment.

#### Bug fix: tournament `endDate` never updated after first game

`packages/cms/src/services/csv-import/import-historial.ts` was setting `endDate` to the first game date and never extending it. Fixed: when a tournament already exists, `updateMany` now extends `endDate` if the current game date is later than the stored value.

#### Bug fix: `playgroundName` now always a `string` in `TeamStatPeriodDTO`

`TeamStatPeriodDTO.playgroundName` was previously `string | undefined` (optional), then changed to `string | null`, and finally to `string` (non-nullable). Fallback is `""` when no playground is linked. Two model assignment sites in `Statistics.ts` were updated accordingly.

#### Enhancement: rivals endpoint returns most common playground

`StatisticsModel.aggregateTeamByRival` now includes `tournament.playground.name` in its Prisma select. After grouping, it computes the most frequently played playground per rival and sets `playgroundName` to that value (or `""` if none is recorded).

#### Bug fix: `players/[id].vue` constitution violation

`packages/frontend/src/pages/players/[id].vue` was mutating `route.query` directly via `router.push({ query: { ...route.query, year } })`. Replaced with `useQueryParams().set("year", val)` in accordance with Principle VI.

#### Redis: no-op client in development

`packages/cms/src/config/redis.ts` now returns a no-op Proxy when `NODE_ENV === "development"`. Every `withCache` read is a miss; writes are silently discarded. No Redis instance is required locally.

#### Constitution updated to v1.9.1

A "URL Query Parameter Management (NON-NEGOTIABLE)" sub-rule was added to Principle VI. Direct `router.push({ query })` outside `useQueryParams` is defined as a Code Review gate violation.

---

### Amendment 2026-04-17 — Reusable Stats Table Component using nuxt/ui

#### Context

All statistics views in the frontend (years, tournaments, rivals, players) currently render hand-crafted `<table>` HTML elements directly inside each page component. This is inconsistent, duplicates layout logic, and provides no built-in sorting or accessible column labels.

#### Table Component Architecture: `<UiTable>` + `<StatsTable>`

The statistics table layer uses a two-tier component stack with clear separation of concerns, preparing the ground for future `<AdminTable>` reuse:

- **`components/ui/Table.vue`** (`<UiTable>`) — a **generic, layout-agnostic** wrapper around `nuxt/ui`'s `<UTable>`. Accepts a `columns: ColumnDef[]` prop, renders no statistics-specific logic, and forwards all unrecognised props and slots to `<UTable>` via `v-bind="$attrs"` and `<slot>` forwarding. No custom HTML `<table>` elements are permitted inside `<UiTable>`.
- **`components/pages/stats/StatsTable.vue`** (`<StatsTable>`) — a **statistics-specific decorator** that wraps `<UiTable>`. Owns client-side sort state and renders column `title` attributes for header tooltips. Has no knowledge of page-level data-fetching or routing.

A future `<AdminTable>` (separate spec, admin layout) will wrap `<UiTable>` in the same pattern with admin-specific concerns.

**FR-026**: Statistics table rendering MUST use the two-tier component architecture described above. `<UiTable>` (`components/ui/Table.vue`) wraps `nuxt/ui`'s `<UTable>` and accepts a `columns: ColumnDef[]` prop. It MUST forward all unrecognised props and slots to `<UTable>` via `v-bind="$attrs"` and `<slot>` forwarding. No custom HTML `<table>` elements are permitted inside `<UiTable>`.

**FR-027**: `<StatsTable>` MUST support column-level sorting. Clicking any sortable column header MUST toggle between ascending and descending order. Sorting MUST be performed client-side on the already-fetched rows (no additional API calls).

**FR-028**: Each `ColumnDef` MAY include an optional `title` string. When provided and non-empty, `<StatsTable>` MUST render a native HTML `title` attribute on the corresponding column header cell, enabling a browser tooltip with the full column name. When `title` is absent or an empty string, the `title` attribute MUST NOT be rendered — this is a valid, silent no-op. This allows headers to display abbreviated labels (e.g., `label: "PJ"`) while surfacing the full description (e.g., `title: "Partidos Jugados"`) on hover.

**FR-029**: Column definitions MUST be passed as a `columns: ColumnDef[]` prop to both `<UiTable>` and `<StatsTable>`. The `ColumnDef` type is defined in `packages/frontend/src/types/table.ts`:

```typescript
export interface ColumnDef {
  key: string;
  label: string; // abbreviated header label (e.g. "PJ")
  title?: string; // full label shown on hover (e.g. "Partidos Jugados")
  sortable?: boolean; // defaults to false
}
```

No columns are hardcoded in either component.

**FR-030**: `<UiTable>` is layout-agnostic and available to both frontend and admin layouts. `<StatsTable>` MUST be scoped to the **frontend** layout only for this feature — admin-facing table decoration is a separate spec concern.

**FR-031**: All statistics pages with tabular data MUST replace their current hand-made `<table>` markup with `<StatsTable>` — no raw `<table>`, `<thead>`, `<tbody>`, `<tr>`, `<th>`, or `<td>` HTML MAY remain in those pages after this change. Pages in scope: `/statistics/top-scorers`, `/statistics/years`, `/statistics/tournaments`, `/statistics/rivals` (list + detail), `/statistics/players` (list + detail). Column configs to use are defined in the Column Configuration Reference below.

#### Column Configuration Reference

Column `key` values correspond to fields in `TeamStatPeriodDTO` / `PlayerStatRowDTO` or computed row properties. `sortable: true` enables client-side sorting in `<StatsTable>`. Columns requiring custom cell rendering (e.g. `NuxtLink`, computed rank) use `<UTable>`'s scoped slot passthrough via `<StatsTable>`.

**Top-Scorers** (`/statistics/top-scorers`):

| key         | label     | title            | sortable | notes                                                                                       |
| ----------- | --------- | ---------------- | -------- | ------------------------------------------------------------------------------------------- |
| rank        | #         | Posición         | false    | computed index (slot: `idx + 1`)                                                            |
| name        | Jugador   | Jugador          | true     | `NuxtLink` to `/players/:id` (slot)                                                         |
| goalsScored | Goles     | Goles            | true     |                                                                                             |
| assists     | Asist.    | Asistencias      | true     |                                                                                             |
| appearances | PJ        | Partidos Jugados | true     |                                                                                             |
| goalRate    | Prom. Gol | Promedio de gol  | true     | `goalsScored / appearances`; 2-decimal display; 0.00 when appearances = 0; added 2026-04-19 |

**Amendment (2026-04-19)**: `/statistics/top-scorers` now supports a `playerStatus` filter (`ACTIVE` / `INACTIVE` / all). Defaults to `ACTIVE`. Persisted as `playerStatus` URL query param. The "Goleadores" sub-nav link includes `?playerStatus=ACTIVE`. Uses `PlayerStatus` enum from `@ministrosfc/shared` on the frontend and `z.enum(["ACTIVE","INACTIVE"]).optional()` on the CMS route schema.

**StatsTableByYear** (`/statistics/years`):

| key          | label   | title                   | sortable |
| ------------ | ------- | ----------------------- | -------- |
| year         | Año     | Año                     | true     |
| period       | Período | Período                 | false    |
| games        | PJ      | Partidos Jugados        | true     |
| wins         | PG      | Partidos Ganados        | true     |
| losses       | PP      | Partidos Perdidos       | true     |
| draws        | PE      | Partidos Empatados      | true     |
| goalsFor     | GF      | Goles a Favor           | true     |
| goalsAgainst | GC      | Goles en Contra         | true     |
| goalDiff     | DG      | Diferencia de Goles     | true     |
| points       | PTS     | Puntos                  | true     |
| winRate      | Win%    | Porcentaje de Victorias | true     |

**StatsTableByTournament** (`/statistics/tournaments`):

| key             | label   | title                    | sortable |
| --------------- | ------- | ------------------------ | -------- |
| tournament      | Torneo  | Torneo                   | true     |
| year            | Año     | Año                      | true     |
| period          | Período | Período                  | false    |
| games           | PJ      | Partidos Jugados         | true     |
| wins            | PG      | Partidos Ganados         | true     |
| losses          | PP      | Partidos Perdidos        | true     |
| draws           | PE      | Partidos Empatados       | true     |
| goalsFor        | GF      | Goles a Favor            | true     |
| goalsAgainst    | GC      | Goles en Contra          | true     |
| goalDiff        | DG      | Diferencia de Goles      | true     |
| goalRateFor     | GRF     | Ritmo Goleador a Favor   | true     |
| goalRateAgainst | GRC     | Ritmo Goleador en Contra | true     |
| points          | PTS     | Puntos                   | true     |
| winRate         | Win%    | Porcentaje de Victorias  | true     |

**StatsTableByRival — all mode** (`/statistics/rivals`):

| key            | label  | title                   | sortable |
| -------------- | ------ | ----------------------- | -------- |
| rival          | Rival  | Rival                   | true     |
| games          | PJ     | Partidos Jugados        | true     |
| wins           | PG     | Partidos Ganados        | true     |
| losses         | PP     | Partidos Perdidos       | true     |
| draws          | PE     | Partidos Empatados      | true     |
| goalsFor       | GF     | Goles a Favor           | true     |
| goalsAgainst   | GC     | Goles en Contra         | true     |
| winRate        | Win%   | Porcentaje de Victorias | true     |
| playgroundName | Cancha | Cancha Más Frecuente    | false    |

**StatsTableByRival — single mode** (`/statistics/rivals/:id`):

| key          | label   | title                   | sortable |
| ------------ | ------- | ----------------------- | -------- |
| year         | Año     | Año                     | true     |
| tournament   | Torneo  | Torneo                  | true     |
| period       | Período | Período                 | false    |
| games        | PJ      | Partidos Jugados        | true     |
| wins         | PG      | Partidos Ganados        | true     |
| losses       | PP      | Partidos Perdidos       | true     |
| draws        | PE      | Partidos Empatados      | true     |
| goalsFor     | GF      | Goles a Favor           | true     |
| goalsAgainst | GC      | Goles en Contra         | true     |
| winRate      | Win%    | Porcentaje de Victorias | true     |

**StatsTableByPlayer — all mode** (`/statistics/players`):

| key               | label   | title                       | sortable |
| ----------------- | ------- | --------------------------- | -------- |
| name              | Jugador | Jugador                     | true     |
| games             | PJ      | Partidos Jugados            | true     |
| wins              | PG      | Partidos Ganados            | true     |
| losses            | PP      | Partidos Perdidos           | true     |
| draws             | PE      | Partidos Empatados          | true     |
| goals             | Goles   | Goles                       | true     |
| assists           | Asist.  | Asistencias                 | true     |
| goalRate          | PG      | Promedio de gol             | true     |
| winRate           | Win%    | Porcentaje de Victorias     | true     |
| participationRate | Part.%  | Porcentaje de Participación | true     |

**StatsTableByPlayer — single mode** (`/statistics/players/:id`):

| key        | label  | title                   | sortable |
| ---------- | ------ | ----------------------- | -------- |
| year       | Año    | Año                     | true     |
| tournament | Torneo | Torneo                  | true     |
| rival      | Rival  | Rival                   | true     |
| games      | PJ     | Partidos Jugados        | true     |
| wins       | PG     | Partidos Ganados        | true     |
| losses     | PP     | Partidos Perdidos       | true     |
| draws      | PE     | Partidos Empatados      | true     |
| goals      | Goles  | Goles                   | true     |
| goalRate   | PG     | Promedio de gol         | true     |
| winRate    | Win%   | Porcentaje de Victorias | true     |

#### Assumptions

- `@nuxt/ui` is already installed in `packages/frontend`; no new package installation is required.
- `ColumnDef` is a frontend-local type defined in `packages/frontend/src/types/table.ts`; it is NOT added to `@ministrosfc/shared` — it is a UI rendering concern not shared with the CMS.
- Sorting state is local to `<StatsTable>` (not persisted in the URL) unless a future spec explicitly requires it.
- Column `title` tooltips rely solely on the native HTML `title` attribute; no custom tooltip overlay is needed.
- `<UiTable>` passes through all `$attrs` and slots so future callers (e.g. `<AdminTable>`) can configure row click handlers, custom cell renderers, etc., without modifying `<UiTable>`.

---

### Amendment 2026-04-19 — Rivals Detail Page: UiAccordion, Game Slug Links, and UX Improvements

#### Context

Several improvements and bug fixes were made to the rival detail page (`/statistics/rivals/:id`) and its supporting types/backend. These changes concern the per-game match list rendered inside each year accordion and the overall page navigation UX.

#### Bug fix: `tableRows` used before initialization

`packages/frontend/src/pages/statistics/rivals/[id].vue` declared `const expandedYears = ref(tableRows.value.map(...))` before `tableRows` was declared as a `computed`. This caused a `ReferenceError: Cannot access 'tableRows' before initialization` at runtime. Fixed by reordering declarations so `tableRows` is defined before `expandedYears`.

#### New: `UiAccordion` reusable component

`packages/frontend/src/components/ui/Accordion.vue` was extracted as a reusable component. It accepts an `:open` boolean prop and emits a `@toggle` event. It exposes two named slots: `#header` (the clickable row trigger) and `#content` (the collapsible body). The trigger button renders a rotating chevron SVG that animates via `rotate-180` when open. `rivals/[id].vue` was refactored to use `<UiAccordion>` in place of its inline accordion markup.

#### `TeamStatMatchDTO.slug` made non-optional

`packages/shared/src/types/statistics.ts`: `TeamStatMatchDTO.slug` was changed from `slug?: string` (optional) to `slug: Game["slug"]` (resolves to `string`, non-optional). This makes the field a required part of the DTO contract.

#### Backend: `getRivalBreakdown` returns `slug` per match

`packages/cms/src/models/Statistics.ts` (`getRivalBreakdown` method): the Prisma select for each game now includes `slug: true`. The `slug` value is pushed alongside each match entry. Games with a null slug from legacy data use `g.slug ?? null`; however, because `TeamStatMatchDTO.slug` is now `string`, the backend ensures a non-null value is always present (the field is guaranteed by the `Game` model to be non-null in practice).

#### Enhancement: per-game "Ir al partido" links

Match rows in `rivals/[id].vue` were previously rendering the entire row as a `<NuxtLink>` wrapper, which is not accessible or semantically correct. Changed to:

- Each match row is a `<li>` element with a CSS grid layout (10-column grid including an `auto` final column).
- A `<NuxtLink :to="\`/games/${match.slug}\`">Ir al partido</NuxtLink>` is placed in the last grid column.
- The link uses `text-xs text-blue-600 hover:underline whitespace-nowrap` classes.

#### Enhancement: back navigation button on rivals detail page

A `<NuxtLink to="/statistics/rivals">` back link with `w-24` fixed width was added at the top of the `rivals/[id].vue` template, immediately before `<UiStatsTitle>`. It renders a left-pointing chevron SVG icon followed by the label "Volver". The link uses `text-sm text-muted-foreground hover:text-foreground transition-colors` classes and is styled to be legible against the statistics layout dark background via `text-muted-foreground`.
