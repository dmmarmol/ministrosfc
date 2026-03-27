# Feature Specification: Playground Entity (Game Locations)

**Feature Branch**: `feat/010-playground-entity`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "Create a new entity such as Playground that will contain data from the places where Ministros FC can or had played. This list must also appear in the Create game > Location field as a dropdown"

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Manage Playgrounds (Priority: P1)

An Admin or Editor navigates to a new "Canchas" (Playgrounds) section in the admin area. They see a list of all previously registered playgrounds with their names and addresses. They can add a new playground by providing a name and optional address. The playground appears immediately in the list.

**Why this priority**: The playground catalog is the foundational data that all other stories depend on — without playgrounds in the system, the game creation dropdown (US2) has no data to display.

**Independent Test**: Can be fully tested by navigating to `/admin/playgrounds`, creating a new playground, and verifying it appears in the list.

**Acceptance Scenarios**:

1. **Given** an Admin or Editor on the `/admin/playgrounds` page, **When** the page loads, **Then** a list of all existing playgrounds is displayed, showing name and address.
2. **Given** an Admin or Editor on the playgrounds page, **When** they click "Agregar cancha" (Add playground), fill in the name (required) and address (optional), and submit, **Then** the new playground is saved and appears in the list.
3. **Given** an Admin or Editor on the playgrounds page, **When** they click edit on an existing playground, **Then** they can modify the name and address and save the changes.
4. **Given** an Admin on the playgrounds page, **When** they click delete on a playground that is not referenced by any game, **Then** the playground is removed from the list.
5. **Given** an Admin on the playgrounds page, **When** they click delete on a playground that is referenced by one or more games, **Then** deletion is prevented and a message explains that the playground is in use.
6. **Given** the playgrounds page, **When** an Editor attempts to delete a playground, **Then** the delete option is not available (delete is Admin-only).

---

### User Story 2 — Select Playground in Game Creation (Priority: P1)

An Admin or Editor creates a new game. The "Ubicación" (Location) field, which was previously a free-text input, is now a dropdown that lists all registered playgrounds. The user selects a playground from the dropdown. If the desired playground is not in the list, they can add a new one inline without leaving the game creation form.

**Why this priority**: This is the core integration that motivated the feature — converting the free-text location field to a structured dropdown improves data consistency and enables future features (e.g., filtering games by playground, showing a map).

**Independent Test**: Can be fully tested by navigating to `/admin/games/create`, opening the Location dropdown, selecting an existing playground, and verifying the game is created with that playground reference.

**Acceptance Scenarios**:

1. **Given** an Admin or Editor on the game creation page, **When** the page loads, **Then** the "Ubicación" field is a dropdown listing all registered playgrounds sorted alphabetically.
2. **Given** the game creation form, **When** the user selects a playground from the dropdown, **Then** the selected playground's name is displayed and its identifier is associated with the game.
3. **Given** the game creation form, **When** the user wants a playground that is not in the list, **Then** they can click "Agregar nueva…" (Add new) at the bottom of the dropdown, enter a playground name and optional address, and the new playground is created and automatically selected.
4. **Given** a game that was created with a playground reference, **When** viewing the game details, **Then** the playground name is displayed as the location.
5. **Given** a game creation form, **When** the location field is left empty (no playground selected), **Then** the game is created without a location (location remains optional).

---

### User Story 3 — Playground in Game Edit (Priority: P2)

An Admin or Editor edits an existing game. The "Ubicación" field in the edit form also uses the playground dropdown, pre-populated with the game's current playground (if any). They can change the playground or clear it.

**Why this priority**: Editing is secondary to creation but completes the feature loop. Games created before this feature (with free-text locations) should gracefully display their legacy text.

**Independent Test**: Can be tested by editing an existing game, changing its playground selection, saving, and verifying the updated playground appears on the game detail page.

**Acceptance Scenarios**:

1. **Given** an Admin or Editor editing a game that has a playground assigned, **When** the edit form loads, **Then** the playground dropdown shows the current playground as the selected value.
2. **Given** an Admin or Editor editing a game, **When** they select a different playground from the dropdown, **Then** the game's location is updated upon save.
3. **Given** a game that was created before the Playground feature (with a legacy free-text location), **When** editing that game, **Then** the legacy location text is displayed as read-only context above the dropdown, and the dropdown is empty (no playground selected), allowing the user to optionally select a playground going forward.

---

### User Story 4 — Playground Display on Public Pages (Priority: P3)

Public visitors viewing the schedule or game details see the playground name as the location. If a game has no playground assigned (legacy data), the free-text location is displayed instead.

**Why this priority**: Public display is the final consumer of the data. The admin-side stories must work first.

**Independent Test**: Can be tested by viewing the public schedule page and verifying that games with playgrounds show the playground name, and legacy games show their original text.

**Acceptance Scenarios**:

1. **Given** a public visitor viewing the game schedule, **When** a game has a playground assigned, **Then** the playground name is displayed as the location.
2. **Given** a public visitor viewing the game schedule, **When** a game has only a legacy free-text location (no playground), **Then** the free-text location is displayed.
3. **Given** a public visitor viewing the game schedule, **When** a game has neither a playground nor a legacy location, **Then** no location is shown (or "Sin ubicación" placeholder).

---

### Edge Cases

- What happens to existing games that have free-text location data after migration? → The existing `location` text field is preserved as a legacy field. Games display the playground name when a playground is linked, falling back to the legacy text field. No data is lost.
- What happens if two playgrounds have the same name? → The system allows duplicate names (different addresses may distinguish them). The dropdown displays both, showing the address as secondary context.
- What happens if a playground name is very long? → The dropdown truncates display at a reasonable length with an ellipsis; the full name is visible on hover/tooltip.
- What happens when the playground list is empty? → The dropdown shows a placeholder "No hay canchas registradas" and the "Agregar nueva…" option is still available.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The system MUST support a "Playground" entity with a name (required) and address (optional).
- **FR-002**: Admins and Editors MUST be able to list, create, and edit playgrounds.
- **FR-003**: Only Admins MUST be able to delete playgrounds.
- **FR-004**: Deletion of a playground MUST be prevented if it is referenced by any game.
- **FR-005**: The game creation form MUST replace the free-text "Ubicación" input with a dropdown listing all playgrounds.
- **FR-006**: The game creation dropdown MUST include an "Agregar nueva…" option that allows inline creation of a new playground.
- **FR-007**: The game edit form MUST use the same playground dropdown, pre-populated with the game's current playground.
- **FR-008**: Games MUST continue to support having no location (the playground field is optional).
- **FR-009**: Legacy games with free-text location data MUST continue to display their text on public pages and in the edit form.
- **FR-010**: The game entity MUST store a reference to a playground (optional) in addition to the existing legacy location text field.
- **FR-011**: Public pages displaying game locations MUST show the playground name when a playground is linked, falling back to the legacy text field.
- **FR-012**: The playgrounds list in the dropdown MUST be sorted alphabetically by name.
- **FR-013**: The playgrounds admin page MUST be accessible via the admin sidebar navigation.

### Key Entities

- **Playground**: Represents a physical location where games are played. Key attributes: name (required, string), address (optional, string). Relationships: referenced by zero or more Games.
- **Game** (existing, modified): Gains an optional reference to a Playground. The existing free-text `location` field is preserved for backward compatibility.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Admins and Editors can create a new playground and see it in the game creation dropdown within 30 seconds.
- **SC-002**: 100% of existing games retain their displayed location after migration (no data loss).
- **SC-003**: The game creation form's location dropdown loads all playgrounds within 2 seconds.
- **SC-004**: Users can create a game with a playground selected in under 3 minutes (same as current game creation time).
- **SC-005**: The inline "Add new playground" flow from the game creation form completes without navigating away from the page.

## Assumptions

- The UI language is Spanish (Argentine dialect). All new labels and messages follow existing conventions.
- The Playground entity is intentionally simple (name + address). Future enhancements like GPS coordinates, photos, or capacity are out of scope.
- The legacy `location` text field on Game is preserved and not deleted. Existing data remains untouched.
- RBAC follows the existing pattern: Editors can create/edit, Admins get full CRUD including delete.
- The inline "Add new" functionality in the dropdown depends on the reusable dropdown component (spec 017). If that component is not yet available, a simpler "navigate to playground creation" link may be used as interim.

## Out of Scope

- Playground GPS coordinates or map integration
- Playground photos/images
- Playground capacity or surface type attributes
- Bulk import of playgrounds
- Migration script to auto-link legacy free-text locations to matching playground records
- Public-facing standalone playground listing page
