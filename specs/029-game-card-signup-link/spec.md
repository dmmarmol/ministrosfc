# Feature Specification: Game Card Signup Link

**Feature Branch**: `024-game-card-signup-link`  
**Created**: 2026-04-10  
**Status**: Draft  
**Input**: User description: "A Player User logged in, in the public site, should be able to see a 'Anotarse' link over an SCHEDULED game card in the public site"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Authenticated Player sees "Anotarse" on upcoming game card (Priority: P1)

A logged-in Player visits the public homepage. For each SCHEDULED game in the "upcoming games" section they can see an "Anotarse" CTA on the game card that takes them directly to the signup page for that game.

**Why this priority**: This is the entire feature. Without it nothing else applies.

**Independent Test**: A Player-role user opens the homepage. Each SCHEDULED game card shows the "Anotarse" link. Clicking it navigates to `/games/:slug/signup`. A non-Player or unauthenticated user sees no such link.

**Acceptance Scenarios**:

1. **Given** a user with role PLAYER is authenticated, **When** they visit the public homepage, **Then** each SCHEDULED game card displays an "Anotarse" action link.
2. **Given** a user with role PLAYER is authenticated, **When** they click "Anotarse" on a SCHEDULED game card, **Then** they are taken to the signup page for that game.
3. **Given** a user with role PLAYER is authenticated, **When** they view a COMPLETED game card, **Then** no "Anotarse" link is shown.
4. **Given** a user is not authenticated (guest), **When** they view a SCHEDULED game card, **Then** no "Anotarse" link is shown.
5. **Given** a user with role EDITOR, ADMIN, or DT is authenticated, **When** they view the public homepage, **Then** no "Anotarse" link is shown on game cards.

---

### User Story 2 - Card reflects current signup state (Priority: P2)

When a Player is already signed up for a game, or the game roster is full, the card communicates this clearly instead of showing "Anotarse".

**Why this priority**: Prevents confusion — a Player who is already on the roster should not see an invitation to sign up again.

**Independent Test**: A Player already signed up views the homepage. That game card shows "Ya anotado" instead of "Anotarse". A different game that is full shows "Completo".

**Acceptance Scenarios**:

1. **Given** a Player is already signed up for a SCHEDULED game, **When** they view that game card, **Then** the card shows "Ya anotado" instead of "Anotarse".
2. **Given** a SCHEDULED game is full (confirmed count ≥ maxPlayers), **When** an authenticated Player views that game card, **Then** the card shows "Completo" (or equivalent disabled state) instead of "Anotarse".

---

### Edge Cases

- If a game has no slug, the "Anotarse" link falls back to the game detail page (non-breaking for legacy data).
- Signup state information may not be available for all games in one request. If it is unavailable, the card defaults to showing "Anotarse" and lets the signup page handle state validation.
- A CANCELLED game card never shows "Anotarse" regardless of role.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The `GameCard` component MUST accept an optional `signupState` prop with values `"available"`, `"signed_up"`, `"full"`, or `undefined`.
- **FR-002**: When `signupState` is `"available"` and game status is `SCHEDULED`, the card MUST display an "Anotarse" link pointing to the game's signup URL.
- **FR-003**: When `signupState` is `"signed_up"`, the card MUST display a "Ya anotado" indicator instead of the link.
- **FR-004**: When `signupState` is `"full"`, the card MUST display a "Completo" indicator instead of the link.
- **FR-005**: When `signupState` is `undefined` or absent, the card MUST NOT display any signup-related UI (preserving existing behaviour for all current usages).
- **FR-006**: The public homepage MUST only pass `signupState` to `GameCard` when the current user has role PLAYER.
- **FR-007**: Unauthenticated users and users with roles ADMIN, EDITOR, or DT MUST NOT see any signup UI on game cards.
- **FR-008**: Signup state data for upcoming SCHEDULED games MUST be fetched in parallel with the games list to avoid sequential waterfalls.

### Key Entities

- **GameCard**: Presentational component extended with an optional `signupState` prop. Existing usages without the prop are unaffected.
- **SignupState**: Per-game, per-player derived value (`available` / `signed_up` / `full`) sourced from the backend signup-page endpoint or a new lightweight batch endpoint.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A logged-in Player can navigate from the homepage to the game signup page in exactly one click.
- **SC-002**: The "Anotarse" link is never visible to unauthenticated visitors or non-Player role users.
- **SC-003**: A Player already signed up sees the correct "Ya anotado" state without navigating away from the homepage.
- **SC-004**: Homepage load time for authenticated Players is not degraded — signup state is fetched concurrently with the game list.

## Assumptions

- The `slug` field is populated for all SCHEDULED games (enforced as non-nullable in spec 014 schema migration).
- Determining per-game signup state may reuse the existing `/api/v1/games/:id/signup-page` endpoint per game, or require a new lightweight batch endpoint — the choice is deferred to planning.
- The feature scope is limited to the public homepage game cards. Other listing surfaces (e.g. `/games` archive page) are out of scope for this spec.
