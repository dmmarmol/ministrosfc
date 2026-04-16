# Feature Specification: Team Statistics Views

**Feature Branch**: `017-team-stats-views`  
**Created**: 2026-04-16  
**Status**: Draft  
**Input**: User description: "Create private views to display tournament, games and individual players statistics. Player stats publicly visible. Filtered by year/tournament/rival. URL query params for sharing."

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

1. **Given** the user selects "All Players" focus, **When** the table renders, **Then** each row shows a player with games played, participation rate, goals, win rate historically and per year.
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
  - **All Rivals**: one row per rival — games played, won, lost, drawn, win rate historically and per year.
  - **Specific Rival**: one row per year/tournament for the selected rival.
  - **All Players**: one row per player — games played, participation rate, goals, win rate historically and per year.
  - **Single Player**: one row per year/tournament/rival for the selected player — games played, won, lost, goals, goal rate, win rate.
- **FR-005**: The table columns MUST include where applicable: Year, Tournament, Period (start–end date), Games Played, Games Won, Games Lost, Games Drawn, Points Earned, Win Rate %, Goals For, Goals Against, Goal Difference, Goal Rate For, Goal Rate Against.
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

### Key Entities

- **GameResult**: A completed game with its score (goals for/against), date, tournament, rival, and list of participating players with their individual contributions (goals scored, position played).
- **Tournament**: A competition grouping multiple games, with a name, start and end date.
- **PlayerStat**: Aggregated stats for a player across a time range — derived from GameResult records; not stored directly.
- **TeamStat**: Aggregated stats for the team across a time range — derived from GameResult records; not stored directly.

### Assumptions

- Game results (scores, goals per player, participating players) are already stored or will be stored as part of the existing game and participation data model.
- Stats calculations are performed server-side and returned as pre-aggregated objects; no heavy computation happens in the browser.
- The public player profile page (`/players/{slug}`) already exists; this spec adds the stats section to it.
- "Points earned" follows standard football scoring: 3 for a win, 1 for a draw, 0 for a loss.
- A private stats route such as `/stats` or `/admin/stats` is to be determined during planning; the route must be inaccessible to unauthenticated users.
- Goal rate is defined as goals scored divided by games played, rounded to 2 decimal places.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An anonymous user can view any player's public stats in under 2 seconds on a standard connection.
- **SC-002**: All 6 focus modes render the correct table columns and data — verified by at least one acceptance test per mode.
- **SC-003**: Applying any filter combination updates the URL query params within the same page interaction — verified by checking that the browser URL changes without a full reload.
- **SC-004**: Loading a shared stats URL with any valid filter combination restores the exact same view 100% of the time — verified by round-trip URL tests.
- **SC-005**: The all-time summary header displays all 10 required records, with correct values matching the underlying game data.
- **SC-006**: Zero regressions from the current passing test suite (79/79 frontend, 31/31 CMS baseline).
