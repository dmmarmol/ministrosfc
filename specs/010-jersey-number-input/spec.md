# Feature Specification: Jersey Number Input & Profile Edit UX

**Feature Branch**: `feat/010-jersey-number-input`
**Created**: 2026-04-06 (retroactive capture)
**Status**: Implemented
**Priority**: P3 (UX enhancement)

---

## User Scenarios & Testing

### User Story 1 — Jersey number selection with availability feedback (Priority: P1)

Players choosing a jersey number during onboarding or editing their profile currently receive no feedback about which numbers are available until they submit and get a server error. This story adds real-time guidance so players can pick a valid number on the first try.

**Why this priority**: The jersey number is a required profile field for registered players; a 409 error after form submission without prior feedback degrades the experience the most.

**Independent Test**: Navigate to the onboarding page as a newly-registered user, reach the jersey number step, and verify that available ranges are displayed beneath the input and that typing a taken number blocks the "Continue" button.

**Acceptance Scenarios**:

1. **Given** a player is on the onboarding page and has selected "Soy jugador", **When** the jersey number input is rendered, **Then** a hint below the input lists the available number ranges (e.g., "Disponibles: 1, 3, 15-32, 62-99").
2. **Given** a player types a jersey number that is already taken by another active registered player, **When** the value changes, **Then** an inline error message appears and the "Continuar" button is disabled.
3. **Given** a player types a jersey number that is available, **When** the value changes, **Then** the inline error is cleared and the submit button is enabled (assuming other fields are valid).
4. **Given** a player is editing their own profile, **When** the jersey number input is rendered, **Then** their current jersey number is correctly excluded from the taken list so it does not appear as a conflict.

---

### User Story 2 — Profile edit reflects saved values immediately after submit (Priority: P1)

After a player submits profile changes, the form was resetting to the previous values (server returning stale data), creating the appearance that the save had no effect.

**Why this priority**: A form that visibly reverts after saving is a critical trust failure — players cannot tell whether their data was actually saved.

**Independent Test**: On the profile edit page, change jersey number and last name, submit the form, and verify the form displays the new values immediately after the successful response.

**Acceptance Scenarios**:

1. **Given** a player submits updated profile data (e.g., jersey number 16, last name "Gomez"), **When** the server responds with 200 OK, **Then** the form displays the submitted values, not the pre-submission values.
2. **Given** a concurrent conflict causes the server to reject a jersey number (409), **When** the error is returned, **Then** the form retains the user's draft values and displays the conflict message.
3. **Given** a player saves their profile, **When** the jersey SVG preview is visible, **Then** the preview updates to reflect the confirmed jersey number and last name.

---

### User Story 3 — Player status management in profile edit (Priority: P2)

Admin-promoted players need to be able to mark themselves as inactive (e.g., temporarily unavailable for matches) from their own profile page, without requiring admin intervention.

**Why this priority**: Reducing admin burden for routine status changes improves team operations. Inactive players should be visually informed of the consequences before saving.

**Independent Test**: On the profile edit page, toggle the "Soy jugador activo" checkbox to inactive, observe the warning message, submit, and verify the player's status changes to INACTIVE.

**Acceptance Scenarios**:

1. **Given** a player has status ACTIVE, **When** they uncheck the "Soy jugador activo" checkbox, **Then** a yellow warning box appears explaining the consequences of being inactive.
2. **Given** a player has status INACTIVE, **When** they check the checkbox, **Then** the warning disappears.
3. **Given** a player sets their status to INACTIVE and saves, **When** the form is reloaded, **Then** the checkbox remains unchecked (status persists).
4. **Given** a player is on the profile page, **When** the page loads, **Then** the checkbox reflects the player's current status from the server.

---

### User Story 4 — Player can navigate to their profile from the main navigation (Priority: P2)

Players have no direct link to their profile page from the navigation bar; they must know the URL directly.

**Why this priority**: Without discoverable navigation, the profile editing feature is effectively hidden from most users.

**Independent Test**: Log in as a non-editor user, verify "Mi Perfil" appears in the navigation, click it, and verify navigation to `/profile/player`.

**Acceptance Scenarios**:

1. **Given** a user is authenticated and has the player role, **When** the navigation is rendered, **Then** a "Mi Perfil" link pointing to `/profile/player` is visible (desktop and mobile).
2. **Given** a user is an editor, **When** the navigation is rendered, **Then** the "Mi Perfil" link is NOT shown.
3. **Given** a non-authenticated user, **When** the navigation is rendered, **Then** the "Mi Perfil" link is NOT shown.
4. **Given** an authenticated player navigates to `/profile/player` while onboarding is incomplete, **When** the auth middleware runs, **Then** they are NOT redirected away from `/profile/player`.

---

### User Story 5 — Jersey SVG preview reflects the player's current number (Priority: P3)

The static hand-rolled jersey SVG on the profile page does not reflect the player's actual jersey number or name in a visually compelling way.

**Why this priority**: Aesthetic improvement only; core functionality is unaffected.

**Independent Test**: On the profile edit page, change the jersey number field and verify the jersey preview image updates live; change the last name field and verify the last name overlaid on the jersey updates live.

**Acceptance Scenarios**:

1. **Given** a player has jersey number 10 and last name "Messi", **When** the profile page loads, **Then** the jersey SVG displays "10" on the shirt and "MESSI" below it.
2. **Given** a player changes the jersey number in the edit form, **When** the field value updates, **Then** the jersey preview re-renders with the new number without requiring a save.
3. **Given** a player changes their last name in the edit form, **When** the field value updates, **Then** the jersey preview re-renders with the uppercase new last name.

---

### Edge Cases

- What happens when all jersey numbers 1–99 are taken? → The available ranges hint shows empty/no ranges; any input triggers the inline error.
- What happens when the API for jersey availability is unavailable? → The input renders without the availability hint; the server still rejects conflicts on submit.
- What happens when a player's profile has no contact record yet? → The upsert creates one on first save; no error surfaced to the user.
- What happens when the jersey number field is cleared (null)? → Null is a valid value (player has no jersey); no conflict check is performed.

---

## Requirements

### Functional Requirements

- **FR-001**: The system MUST display available jersey number ranges in real time below the jersey number input in both the onboarding page and the profile edit form.
- **FR-002**: The jersey number input MUST show an inline validation error when the entered number is already assigned to another active registered player.
- **FR-003**: The onboarding "Continuar" button and the profile edit save button MUST be disabled while a taken jersey number is entered.
- **FR-004**: Available range calculation MUST exclude the editing player's own current jersey number from the taken list.
- **FR-005**: The system MUST display jersey availability ranges in a human-readable collapsed format (e.g., "1, 3, 15-32" instead of listing every integer).
- **FR-006**: Authenticated non-editor players MUST have a "Mi Perfil" link in the navigation bar (both desktop and mobile) that routes to `/profile/player`.
- **FR-007**: The profile edit form MUST include a player status toggle ("Soy jugador activo") that persists the ACTIVE/INACTIVE state to the server.
- **FR-008**: When a player marks themselves inactive, a contextual warning MUST be displayed explaining the consequences before they save.
- **FR-009**: After a successful profile save, the form MUST display the values confirmed by the server, not the pre-submission state.
- **FR-010**: The jersey number preview image on the profile page MUST update live as the player changes the jersey number or last name in the edit form.

### Key Entities

- **Player**: Has a `jerseyNumber` (1–99 or null), `status` (ACTIVE / INACTIVE), `firstName`, `lastName`. Jersey numbers must be unique across ACTIVE REGISTERED players.
- **Contact**: Optional entity linked to a Player. Holds `phone`, `whatsapp`, `emergencyContact`.
- **JerseyAvailability**: Derived concept — the set of integers 1–99 not currently assigned to any active registered player (excluding a specified player ID).

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: Players can identify an available jersey number without submitting the form — zero 409 errors caused by number conflicts for users who consulted the availability hint.
- **SC-002**: Players can complete a profile edit (including jersey number change) and see the updated values reflected in the form immediately after save, with no manual page refresh required.
- **SC-003**: Players can toggle their own active status from the profile page — admin intervention is not required for routine availability changes.
- **SC-004**: 100% of `@TODO` type-sync debt introduced in this feature is tracked and assigned to a follow-up spec (shared types migration deferred to a dedicated spec per team decision 2026-04-06).

---

## Assumptions

- Jersey numbers are integers in the range 1–99. Numbers outside this range are considered invalid regardless of availability.
- Only REGISTERED players with ACTIVE status occupy jersey numbers. GUEST players do not hold jersey numbers.
- The profile edit page is accessible only to authenticated users who have completed onboarding (have a linked Player record).
- The `IsPlayerCheckbox` component (player status toggle) is reused from the component introduced in the registration form; it is a UI primitive, not a domain-specific component.
- Shared type migration (`PlayerProfileResponse`, `UpdatePlayerProfileInput`) is explicitly deferred to a separate spec per team decision on 2026-04-06.

---

## Out of Scope

- Admin ability to change another player's jersey number or status (covered by admin player management spec).
- Jersey number reservation or queuing when a number is temporarily unavailable.
- Historical tracking of jersey number assignments.
- Migrating `ProfileData` interface and `updateProfile` input type to `@ministrosfc/shared` (deferred — see Assumptions).
