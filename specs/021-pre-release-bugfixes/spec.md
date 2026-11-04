# Feature Specification: Pre-release bugfixes

**Feature Branch**: `021-pre-release-bugfixes`

**Created**: 2026-10-30

**Status**: Draft

**Input**: User description: "Fix a list of bugs spotted during manual QA in dev environment that needs to be fixed before the first production release."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Admin game save refreshes the list correctly (Priority: P1)

An administrator creates or edits a game from the admin tools and expects the system to save the record and return to the admin game index with the latest data visible without a stale list.

**Why this priority**: This is a direct workflow break in the admin lifecycle and affects the reliability of the core game management page.

**Independent Test**: An admin can save a game, observe the redirect to the list, and verify the newly created or updated item appears without needing a manual page refresh.

**Acceptance Scenarios**:

1. **Given** an admin is on the game create or edit flow, **When** they submit valid game data, **Then** the system saves the record and redirects to the admin games list.
2. **Given** the admin game list is loaded after the redirect, **When** the page renders, **Then** it fetches fresh data and displays the latest entries without stale cache or stale route state.

---

### User Story 2 - Cross-application returnUrl navigation preserves context (Priority: P1)

Any flow that opens a creation or editing screen from another page must preserve the caller context through a shared `returnUrl` mechanism, not just the team creation flow. This applies across the site, especially in admin screens and other nested form entry points.

**Why this priority**: The issue is a cross-cutting navigation defect that affects user trust and task completion across multiple routes and screens if not solved at a shared layer.

**Independent Test**: A user can open a nested form from any originating page, complete the action, and return to the original route using the `returnUrl` mechanism instead of losing context or falling back to a default list page.

**Acceptance Scenarios**:

1. **Given** a user enters a create or edit workflow from a different route and the route includes a valid `returnUrl` value, **When** the flow completes, **Then** the application redirects to that original route.
2. **Given** a team is created from the game creation flow, **When** the team form is submitted, **Then** the system returns to `admin/games/create` using the `returnUrl` query parameter instead of a hardcoded default.
3. **Given** a user navigates back from a detail or form page, **When** the shared `BackButton` component is rendered, **Then** it uses the `returnUrl` query parameter when present and otherwise falls back to the configured destination.

---

### User Story 2b - Shared back navigation standardizes admin flows (Priority: P2)

All admin pages that expose a "Volver" or "Back" action should use a single reusable navigation component so return context is preserved consistently throughout the application.

**Why this priority**: A shared back-button pattern reduces duplication and ensures the cross-route context mechanism is applied everywhere the user expects to return.

**Independent Test**: A developer can inspect the admin route set and confirm the back buttons are implemented using the shared `BackButton` component, rather than ad hoc link markup.

**Acceptance Scenarios**:

1. **Given** an admin page renders a back action, **When** the component is checked in the codebase, **Then** it uses the shared `BackButton` component rather than a raw `<NuxtLink>` or duplicate implementation.
2. **Given** a back action is opened with a `returnUrl` query parameter, **When** the user activates it, **Then** the app preserves the original route context and returns to it reliably.

---

### User Story 3 - Public roster and player filtering behave consistently and clearly (Priority: P1)

A visitor browsing the public roster experience should see consistent status labels, broader search results, and corrected display states when filtering by player status.

**Why this priority**: These issues directly affect roster usability and the correctness of player discovery by the public-facing audience.

**Independent Test**: A user can filter by status, select "Todos", and see a status label on player cards while the search operates across the full roster rather than only the active filter subset.

**Acceptance Scenarios**:

1. **Given** the user is on the public /rosters page and selects the "Todos" status filter, **When** player cards render, **Then** each card displays the correct player status label above the card contents.
2. **Given** a user searches on /rosters while a status filter is active, **When** they type in the search box, **Then** the search evaluates against all existing players instead of only the currently filtered subset.

---

### User Story 4 - Forms, labels, and dashboard surfaces are localized and accessible (Priority: P1)

An admin or public user should see clear Spanish labels, consistent competition naming, and a dashboard that follows the same UI patterns as the rest of the admin application.

**Why this priority**: These are visible quality and trust issues that reduce clarity in the current release candidate.

**Independent Test**: A user can visit the dashboard, recent games table, and tournament or game views and see translated labels, consistent competition type names, and a UTable-based recent games panel with correct edit links.

**Acceptance Scenarios**:

1. **Given** a game header displays a status label, **When** it renders in the UI, **Then** it uses Spanish text rather than untranslated English status values.
2. **Given** a competition type value is displayed, **When** the system maps it to a UI label, **Then** the label is generated from the canonical enum and does not include the duplicate ambiguous label "Temporada".
3. **Given** the dashboard recent games section loads, **When** the table renders, **Then** it uses the same UTable pattern as other admin tables and the edit action opens the dedicated game detail page route instead of the legacy edit route.

---

### User Story 5 - Dark mode and shared frontend composition improve release stability (Priority: P2)

Users with a device-level dark theme preference should still experience correct contrast and readable UI surfaces across public and private pages, and dashboard code should use shared composables instead of ad hoc $api calls where available.

**Why this priority**: These improvements reduce friction in the pre-release experience and improve maintainability without changing user-facing data model semantics.

**Independent Test**: A user with dark mode enabled can browse public and admin screens and see improved contrast; a developer can verify the dashboard uses the existing shared game and player composables instead of direct $api calls where functionality already exists.

**Acceptance Scenarios**:

1. **Given** a device selects a dark color scheme, **When** the application renders, **Then** the site uses darker surfaces and higher-contrast text across both public and private pages.
2. **Given** the dashboard component calls backend endpoints, **When** the feature is reviewed or executed, **Then** it uses the existing shared composable layer and a new `usePlayers` composable where applicable instead of duplicating request logic directly.

---

### Edge Cases

- What happens when a user creates a team while already inside the game creation flow and the return URL is missing or malformed?
- How does the app behave when a player status filter is set to "Todos" and the search box is used simultaneously?
- What happens when a competition type or game status value is missing, null, or not present in the display map?
- How does the recent games dashboard handle empty results while still showing a correctly structured UTable or empty-state message?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The admin game save flow MUST redirect to the admin games list after successful save and MUST ensure the list refreshes from the latest backend data.
- **FR-002**: The application MUST support a shared `returnUrl` query parameter across the site so that any nested form or creation flow can restore the original route after completion, including team creation triggered from the admin game creation flow.
- **FR-003**: The shared `BackButton` component MUST honor the `returnUrl` query parameter when present and MUST be used for the main admin back/navigation actions instead of ad hoc raw links.
- **FR-004**: The game header status label MUST be displayed in Spanish for end users in the UI.
- **FR-005**: The public roster page MUST display a player status label above each player card when the selection is set to `OPTION_FILTER_ALL`.
- **FR-006**: The player status selector MUST emit a `selected` event and MUST notify the roster view when the user selects `OPTION_FILTER_ALL` so the card-level status label can be toggled appropriately.
- **FR-007**: The public roster search MUST search across all existing players regardless of the current player status filter so that the search results are not artificially restricted by the active filter state.
- **FR-008**: The application MUST support dark mode when the root HTML element has the `dark` class and MUST improve contrast for both public and private pages.
- **FR-009**: The competition type display mapping MUST remove the ambiguous label "Temporada" and MUST use the canonical enum values as the source of truth for display text.
- **FR-010**: The dashboard recent games section MUST render as a UTable consistent with the admin tournaments list pattern and MUST use a `cellActions` action for editing that points to `/admin/games/:id` instead of the legacy edit route.
- **FR-011**: The dashboard MUST prefer existing shared composables such as `useGames`, and a reusable `usePlayers` composable MUST be created to mirror the existing patterns for listing, creating, updating, and deleting players when matching CMS endpoints exist.
- **FR-012**: The system MUST maintain a consistent and accessible admin user experience when navigating between game creation, team creation, and game list screens without losing state or context.

### Key Entities

- **Game**: A match record with status, competition type, date, and associated admin/edit workflows.
- **Team**: A club/team entity created from the admin area, with a return route requirement when created from a specific flow.
- **Player**: A roster member with a display status and searchability across the public roster.
- **Tournament**: A competition grouping entity whose display labels are derived from the global competition type enum and must remain unambiguous.
- **Dashboard View**: The recent activity summary for admins, including structured recent games data and action links.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of the listed release-blocking admin workflows complete without stale list refreshes or incorrect redirects after the fix.
- **SC-002**: 100% of public roster searches and player status filter states behave predictably when the status is set to "Todos" or a specific status value.
- **SC-003**: The application provides noticeably improved contrast in dark mode on both public and private pages, and the user can browse without reduced legibility.
- **SC-004**: All competition type labels shown in the UI use a single canonical display mapping and do not include ambiguous or duplicated values.
- **SC-005**: The dashboard recent games section uses the standard admin table pattern and the edit action routes to the correct game detail page for every recent item.
- **SC-006**: New or updated shared composable coverage and usage patterns reduce direct `$api` calls in dashboard logic without introducing regressions in main data-fetch flows.

## Assumptions

- The release candidate can safely include coordinated UI and data-flow fixes without introducing broad new features outside the bugfix scope.
- Existing endpoint contracts in the CMS continue to be the source of truth for player and game CRUD behavior, and any new composable wrapper will mirror those contract patterns instead of inventing a parallel layer.
- The public and admin UI should remain consistent with the project’s current styling system while adding dark mode support through the existing root HTML state rather than introducing a separate app-wide theme system.
- The bugfix scope is focused on correctness, user clarity, and delivery readiness before the first production release, not on unrelated refactors outside the listed issues.
