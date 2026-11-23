# Feature Specification: Pre-release bugfixes

**Feature Branch**: `021-pre-release-bugfixes`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Fix a list of bugs spotted during manual QA in dev environment that needs to be fixed before the first production release."

## Clarifications

### Session 2026-11-04

- Q: Which return addresses (`returnUrl`) should the app accept after saving a form or pressing Back, and what should it do when the address is missing or invalid? → A: Accept only valid internal application paths; use the configured default destination when the value is missing or invalid.
- Q: After an admin creates a new opponent team from an unfinished game form, what should appear when they return to the game form? → A: Restore the entered game details and automatically select the new team.
- Q: How should existing games and tournaments marked "Temporada" be handled when that option is removed? → A: Convert existing records to "Liga" and remove the "Temporada" type; the source CSV will be updated to remain aligned.
- Q: After saving a game form opened with a valid `returnUrl`, where should the admin go? → A: Return to `returnUrl`; otherwise go to the games list, which must be fresh when next opened.
- Q: What should happen to the roster's status filter while a search is active, and after the search is cleared? → A: Switch to "Todos" while searching and keep "Todos" selected when the search is cleared.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Save games and return to the right place (Priority: P1)

An administrator creating or editing a game can save it and return to the screen they came from. When no safe return destination was provided, the administrator returns to the games list and sees the saved information the next time that list is opened.

**Why this priority**: This is a release-blocking break in the core game-management workflow.

**Independent Test**: Save new and edited games from both a normal entry point and a nested entry point; verify the destination and confirm the games list shows the saved values when reopened.

**Acceptance Scenarios**:

1. **Given** an administrator saves valid game details without a valid return destination, **When** the save succeeds, **Then** the administrator arrives at the games list.
2. **Given** an administrator saves valid game details with a valid internal return destination, **When** the save succeeds, **Then** the administrator arrives at that destination.
3. **Given** a game has been saved, **When** the games list is next opened, **Then** it shows the latest saved details without requiring the administrator to manually refresh the page.
4. **Given** a game cannot be saved, **When** the save fails, **Then** the administrator remains in the game form, the entered details are retained, and a clear failure message is shown.

---

### User Story 2 - Preserve context in nested workflows (Priority: P1)

When an administrator or visitor opens a creation, editing, or detail screen from another screen, they can complete the action or go back without losing their place. An administrator creating an opponent team from an unfinished game form returns to the game form with the draft intact and the new team selected.

**Why this priority**: Losing a draft or returning to an unrelated screen interrupts essential workflows and can cause users to repeat work.

**Independent Test**: Open nested forms from different screens, complete or leave the form, and verify that safe destinations and any unfinished game details are restored as described.

**Acceptance Scenarios**:

1. **Given** a creation or editing task was opened from another screen with a valid internal return destination, **When** the task completes, **Then** the user returns to the originating screen.
2. **Given** an administrator has entered game details and opens team creation from that unfinished game, **When** the team is saved, **Then** the administrator returns to the game form, all previously entered details and participants are restored, and the new team is selected as the opponent; the game is not submitted.
3. **Given** a user chooses a Back action, **When** a valid internal return destination is available, **Then** the user returns to that destination; otherwise the flow's stated default destination is used.
4. **Given** a return destination is missing, malformed, an absolute URL, protocol-relative, or external, **When** a flow completes or the user chooses Back, **Then** the user is taken to that flow's configured default destination.

---

### User Story 2b - Use predictable back navigation in admin screens (Priority: P2)

Administrators encounter a consistent Back action throughout admin screens, and it returns them to the screen they came from when that destination is safe.

**Why this priority**: Predictable navigation reduces confusion and prevents users from losing context across admin tasks.

**Independent Test**: Review admin screens that offer a Back action and try each from both a nested entry point and a direct entry point; verify consistent behavior and the appropriate fallback.

**Acceptance Scenarios**:

1. **Given** an administrator screen offers a Back action, **When** the administrator uses it, **Then** it follows the same return-destination and fallback rules as other admin screens.
2. **Given** an administrator reaches a screen from a valid internal destination, **When** the administrator uses Back, **Then** the originating screen is restored.

---

### User Story 3 - Find registered players in the public roster (Priority: P1)

A visitor browsing the public roster can identify player status and find registered players regardless of their status. Searching clears any narrower status selection, and guest players remain private.

**Why this priority**: These issues directly affect roster usability and the correctness of player discovery by the public-facing audience.

**Independent Test**: Browse and filter the roster, search while a specific status is selected, clear the search, and verify the displayed labels, retained selection, and exclusion of guest players.

**Acceptance Scenarios**:

1. **Given** a visitor selects "Todos" on the public roster, **When** player cards are shown, **Then** each card displays that player's status above the card contents.
2. **Given** a visitor has selected one status, **When** they enter a non-empty search, **Then** the selection changes to "Todos" and matching registered players are found across all statuses.
3. **Given** a search has changed the selection to "Todos", **When** the visitor clears the search, **Then** "Todos" remains selected.
4. **Given** guest players exist, **When** a visitor browses or searches the public roster, **Then** no guest player is shown.
5. **Given** the search or selected status has no matching registered players, **When** results are shown, **Then** the visitor sees a clear Spanish empty-state message.
6. **Given** a visitor selects one specific status, **When** player cards are shown, **Then** the status label above each card is hidden.

---

### User Story 4 - See clear Spanish labels and competition names (Priority: P1)

Administrators and visitors see Spanish game-status labels and consistent competition names. Existing games and tournaments labeled "Temporada" become "Liga" without losing their other information.

**Why this priority**: These are visible quality and trust issues that reduce clarity in the current release candidate.

**Independent Test**: Review game and competition labels and compare game and tournament details before and after the change; verify that no "Temporada" competition type remains and unrelated record details are unchanged.

**Acceptance Scenarios**:

1. **Given** a game has a status, **When** its status is shown to a user, **Then** the label is in Spanish and accurately describes the status.
2. **Given** a game or tournament has the competition type "Temporada", **When** the change is applied, **Then** its competition type is "Liga" and all other record details remain unchanged.
3. **Given** a user views or selects a competition type, **When** the available names are shown, **Then** "Temporada" is no longer offered and competition names are consistent across the application.
4. **Given** a game status or competition type is missing or unrecognized, **When** its label is displayed, **Then** the label reads "Sin especificar" and the screen remains usable.

---

### User Story 5 - Read the application comfortably in dark mode (Priority: P2)

Visitors and administrators who prefer a dark appearance can read and use public and private screens without text or controls becoming difficult to distinguish.

**Why this priority**: Readable, consistent surfaces improve release quality for users whose devices or preferences use a dark appearance.

**Independent Test**: Use representative public and private screens with dark appearance enabled; verify that text, controls, and important content remain readable and usable.

**Acceptance Scenarios**:

1. **Given** a user has selected a dark appearance, **When** they visit public and admin screens, **Then** the dark appearance is applied consistently and text and controls remain legible.
2. **Given** text is shown in dark appearance, **When** its contrast is measured, **Then** normal text has at least 4.5:1 contrast and large text has at least 3:1 contrast against its background.

---

### User Story 6 - See consistent recent game and player information (Priority: P2)

Administrators can review recent games on the dashboard and open the correct game. Game and player information remains consistent with the corresponding admin workflows, including supported player listing and management actions.

**Why this priority**: The dashboard is a frequent admin entry point; consistent and actionable information avoids confusion and duplicated effort.

**Independent Test**: Compare recent games shown on the dashboard with their game details, open each available edit action, and verify supported player listing and management actions produce the same results as their established admin workflows.

**Acceptance Scenarios**:

1. **Given** recent games are available, **When** an administrator views the dashboard, **Then** each item shows its available date, participants, competition, and status, and its edit action opens that same game's detail screen.
2. **Given** the administrator opens an edit action for a recent game, **When** the game is displayed, **Then** it is the game represented by the selected dashboard item.
3. **Given** there are no recent games, **When** the dashboard is opened, **Then** a clear Spanish empty-state message is shown.
4. **Given** an existing admin workflow supports listing, creating, updating, or deleting players, **When** that operation is performed through the shared player data behavior, **Then** it follows the same validation, result, and error behavior as the established workflow.

---

### Edge Cases

- A missing, malformed, absolute URL, protocol-relative, or external return destination uses the current flow's configured default destination.
- A non-empty roster search changes the status selection to "Todos"; clearing the search leaves "Todos" selected.
- Missing or unrecognized game statuses and competition types use the Spanish label "Sin especificar" rather than a blank or misleading label.
- Empty roster and recent-game results show a clear Spanish empty-state message.
- A failed game save retains the entered details and gives the administrator a clear failure message.
- Migrating a "Temporada" competition type changes only that type; all other details of the game or tournament remain intact.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: After a successful game save, the administrator MUST return to the valid internal destination from which the game form was opened, or to the games list if no valid destination was provided. The next time the games list is opened, it MUST show the latest saved information without requiring a manual refresh.
- **FR-002**: Every creation or editing flow opened from another screen MUST preserve a valid internal return destination and return the user there when the flow completes. Missing, malformed, external, absolute URL, or protocol-relative destinations MUST use the configured default for that flow.
- **FR-003**: Back actions on admin screens MUST follow the same safe return-destination rules and configured fallbacks.
- **FR-004**: Game status labels shown to users MUST be in Spanish and accurately represent the status.
- **FR-005**: When "Todos" is selected on the public roster, each displayed player card MUST show the player's status above its contents.
- **FR-006**: The public roster MUST reflect status-selection changes immediately. Player cards MUST show their status label when "Todos" is selected and MUST hide that label when a specific status is selected.
- **FR-007**: A non-empty public roster search MUST select "Todos" and search registered players across all statuses while excluding guest players. Clearing the search MUST leave "Todos" selected. An empty result MUST be explained with a clear Spanish message.
- **FR-008**: Public and admin screens MUST support a dark appearance in which text and controls remain legible; normal text MUST have at least 4.5:1 contrast and large text at least 3:1 contrast against its background.
- **FR-009**: Existing games and tournaments with competition type `SEASON` ("Temporada") MUST retain all their details and be changed to `LEAGUE` ("Liga"). `SEASON` MUST no longer be offered or displayed as a competition type, and competition names MUST remain consistent wherever they are shown. Missing or unrecognized values MUST display "Sin especificar".
- **FR-010**: The dashboard MUST show each recent game's available date, participants, competition, and status, and its edit action MUST open that same game's detail screen. When no recent games are available, the dashboard MUST show a clear Spanish empty-state message.
- **FR-011**: Game and player information on the dashboard and in admin workflows MUST produce consistent user-visible results. For player operations supported by existing admin workflows, listing, creating, updating, and deleting MUST use the same validation, results, and error behavior; the dashboard MUST NOT introduce conflicting behavior.
- **FR-012**: After a team is created from an unfinished game creation form, the system MUST restore the entered game details, including participants, and automatically select the new team as the opponent without submitting the game.

### Key Entities

- **Game**: A match with a status, competition name, date, participating teams, and associated administrator workflows.
- **Team**: A club or team that can be selected as a game participant and may be created while a game form is unfinished.
- **Player**: A roster member with a status that determines how the player is described and filtered in the public roster.
- **Tournament**: A competition grouping whose name must be consistent with game competition names.
- **Dashboard**: An administrator's overview of recent games and related information, with actions to open the corresponding game.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of tested game creation, editing, nested return, and Back cases reach the valid originating destination or configured fallback; team creation from an unfinished game form restores the complete draft and selects the new team; and all saved game changes are visible when the games list is next opened.
- **SC-002**: 100% of tested roster searches return matching registered players across all statuses, exclude guest players, and leave "Todos" selected after a search is cleared.
- **SC-003**: On representative public and admin screens in dark appearance, normal text meets a 4.5:1 contrast ratio and large text meets a 3:1 ratio; users can identify and operate all visible controls.
- **SC-004**: 100% of displayed competition names are consistent across games and tournaments, no competition is presented as "Temporada", and all existing `SEASON` records retain their non-type details after migration to `LEAGUE` ("Liga").
- **SC-005**: 100% of recent-game actions open the game represented by that item, and users receive a clear empty-state message when there are no recent games.
- **SC-006**: 100% of tested supported player listing and management operations produce the same validation, results, and error behavior across the dashboard and established admin workflows, with no user-visible inconsistencies in game or player information.
- **SC-007**: 100% of displayed game statuses use accurate Spanish labels, and missing or unrecognized game statuses or competition types display "Sin especificar".

## Assumptions

- The release candidate can safely include coordinated UI and data-flow fixes without introducing broad new features outside the bugfix scope.
- Existing game and player workflows define which listing and management operations are supported; this feature does not introduce new player-management capabilities beyond that existing scope.
- The source CSV owner will remove or update the "Temporada" value so it cannot reintroduce a competition type that has been changed to "Liga".
- The dark appearance follows the user's existing device or application preference and does not introduce a separate theme choice beyond the scope of this feature.
- The bugfix scope is focused on correctness, user clarity, and delivery readiness before the first production release, not on unrelated refactors outside the listed issues.
