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

### Edge Cases

- What happens when there are no games recorded for a given year or tournament? → Table shows that row/period with all values as zero and a "No data" label.
- What happens when a player has zero goals? → Their goal rate displays as 0.00%, not a division error.
- What happens when an unauthenticated user lands on a private stats URL? → Redirected to login; after auth, redirected back to the original stats URL.
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

| CSV Column   | Entity Field         | Notes                 |
| ------------ | -------------------- | --------------------- |
| Jugador      | player.name          | Full name, lookup key |
| Apodo        | player.nickname      |                       |
| Nacimiento   | player.birth_date    | Optional DD/MM/YYYY   |
| Edad         | (derived)            | Not stored            |
| Altura       | player.height_cm     | Integer cm, optional  |
| Numero       | player.jersey_number | Integer               |
| Pie          | player.dominant_foot | e.g. "Diestro"        |
| Posición     | player.position      | e.g. "SMF"            |
| DNI          | player.dni           | Optional identifier   |
| Telefono     | player.phone         | Optional              |
| Imagen (URL) | player.image_url     | Optional              |

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
- The private stats dashboard is accessible at `/stats`. Sub-routes under `/stats` are used per focus mode to enable direct link sharing: `/stats/years` (default), `/stats/tournaments`, `/stats/rivals`, `/stats/rivals/:rivalId`, `/stats/players`, `/stats/players/:playerId`. All sub-routes require authentication.
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
