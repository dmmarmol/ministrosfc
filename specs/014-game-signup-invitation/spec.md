# Feature Specification: Game Signup Invitation

**Feature Branch**: `014-game-signup-invitation`
**Created**: 2026-04-09
**Status**: Draft
**Input**: User description: "Implement a feature to allow Admin, Editor & DT users to invite players to sign up for the next game through a link."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Admin Generates Signup Link for a Game (Priority: P1)

An Admin, Editor or DT user opens a game in the admin panel, sets a maximum player count, and copies a shareable signup link to send to players.

**Why this priority**: The shareable link is the entry point for the entire feature and introduces the `maxPlayers` capacity gate that controls signup eligibility.

**Independent Test**: Navigate to a game in the admin panel, set `maxPlayers`, copy the generated link, and verify the URL matches `games/{date}/{opponent}/signup`.

**Acceptance Scenarios**:

1. **Given** an Admin is on a game's edit page, **When** they view the form, **Then** a "Cupo máximo" number input is available.
2. **Given** `maxPlayers` is set and saved, **When** the game is persisted, **Then** the value is stored on the game record.
3. **Given** a game exists, **When** the admin views the game detail page, **Then** a "Copiar link de convocatoria" button is visible that copies `games/{date}/{opponent}/signup`.
4. **Given** the old URL `/games/{GUID}` is accessed, **When** a browser or crawler follows it, **Then** a permanent redirect (301) leads to `/games/{date}/{opponent}`.

---

### User Story 2 — Player Signs Up via the Link (Priority: P1)

A player opens the signup link, reviews game details and the current roster, and confirms their attendance. Duplicate signups and capacity overflows are blocked.

**Why this priority**: The player signup action is the core deliverable; all other stories are additive.

**Independent Test**: Visit the signup URL as an authenticated player, press "Confirmar asistencia", and verify the player appears in the game roster.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user visits the signup URL, **When** the page loads, **Then** they are redirected to login with a `redirect` param pointing back to the signup URL.
2. **Given** an authenticated player visits the signup URL for an open game, **When** the page loads, **Then** they see rival, date, playground, confirmed player count vs. max, player list, and a "Confirmar asistencia" button.
3. **Given** a player clicks "Confirmar asistencia", **When** the request completes, **Then** their name appears in the confirmed roster and the count increases.
4. **Given** a player who already signed up visits the URL again, **When** the page loads, **Then** the button shows "Ya estás anotado" and re-signup is blocked.
5. **Given** a game at full capacity (`signedUp >= maxPlayers`), **When** any player visits the signup URL, **Then** the form shows "El cupo está completo" and no registration is accepted.
6. **Given** an authenticated non-player user (Admin/Editor/DT) visits the signup URL, **When** they attempt to sign up, **Then** the system rejects the action and explains that only registered players can sign up.

---

### User Story 3 — Player Adds Guest Players (Priority: P2)

After confirming their own attendance, a player can add an unlimited number of guest participants (people without accounts). Each guest is linked back to the inviting player.

**Why this priority**: Guest tracking handles a real-world scenario (bringing friends) but does not block the core signup flow.

**Independent Test**: Sign up as a player, add one guest using the inline form, submit, and verify the guest appears as "Invitado por {Player Name}" at the end of the game roster.

**Acceptance Scenarios**:

1. **Given** a signed-up player is on the signup page, **When** they open the guest section, **Then** a `DropdownAddMore` component is shown to create or search guest names.
2. **Given** a player creates a new guest using the inline form, **When** they submit, **Then** the guest record is created with at least first and last name, linked to the inviting player, and appears at the bottom of the game roster as "Invitado por {Player Name}" (guest's own name is hidden on public pages).
3. **Given** the game roster is rendered, **When** guests are present, **Then** registered players (with number, position, name) are listed first; guests appear after a visual separator as "Invitado por {Player Name}" only.
4. **Given** an Admin views `/admin/players`, **When** guest records exist, **Then** each guest shows an "Invitado" badge and a visible reference to the registered player who invited them.

---

### User Story 4 — Updated Public Game Detail Page (Priority: P2)

The public game detail page is served at the SEO-friendly URL and shows the roster with guest attribution, accessible without authentication.

**Why this priority**: Read-only improvement that completes the URL rewrite and makes the guest display consistent with the admin view.

**Independent Test**: Visit `/games/{date}/{opponent}` as an anonymous user and verify game info, player roster, and guest tags display correctly.

**Acceptance Scenarios**:

1. **Given** a game with players and guests, **When** an anonymous user visits the game detail page, **Then** registered players show number, position, and name; guests appear as "Invitado por {Player Name}" after a separator.
2. **Given** the public homepage, **When** the schedule renders, **Then** game links use the `games/{date}/{opponent}` format.
3. **Given** the public player roster page, **When** it renders, **Then** guest players do NOT appear in the general roster listing.

---

### Edge Cases

- Two games with the same date and opponent: the slug must include a disambiguator (e.g., a short GUID suffix) to remain unique.
- `maxPlayers` is null: signup is unlimited with no capacity block.
- The inviting player account is deleted after inviting guests: guests retain a fallback attribution label (e.g., "Invitado" without a name).
- An existing guest with the same name: show the existing record as a selectable option in `DropdownAddMore` to avoid duplicates.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST add `maxPlayers` (nullable integer) to the `Game` entity; when null, capacity is unlimited.
- **FR-002**: System MUST add a unique URL slug to each game (derived from date + opponent); old `/games/{GUID}` URLs MUST return HTTP 301 to `/games/{slug}`.
- **FR-003**: Admin, Editor and DT users MUST be able to view and copy the signup link from the game admin page.
- **FR-004**: System MUST provide a signup endpoint (authenticated, player-role only) that records a `GameSignup` entry.
- **FR-005**: System MUST prevent duplicate signups — a player MUST NOT be registered for the same game more than once.
- **FR-006**: System MUST reject signups when confirmed attendee count ≥ `maxPlayers`.
- **FR-007**: Unauthenticated users visiting the signup URL MUST be redirected to login with a `redirect` param pointing back to the signup URL.
- **FR-008**: Authenticated non-player users MUST see the signup page in read-only mode and MUST NOT be able to sign up.
- **FR-009**: A signed-up player MUST be able to add any number of guest players; each guest MUST store a reference to the inviting player.
- **FR-010**: Guest players MUST have an `isGuest: true` flag and a `invitedBy` FK to the registering player; they MUST appear in `/admin/players` with an "Invitado" badge.
- **FR-011**: Guest players MUST NOT appear in the public player roster (homepage or general roster pages).
- **FR-012**: On game detail pages, guests MUST appear as "Invitado por {Player Name}" without revealing the guest's name, listed after all registered players with a visual separator.
- **FR-013**: Guest players MUST default to active status; Admins, Editors and DT users MUST be able to change their status in the admin panel.

### Key Entities

- **GameSignup**: Joins a `Player` to a `Game`; stores `signedUpAt`, plus reference to both.
- **GuestPlayer**: Lightweight player record with `firstName`, `lastName`, `isGuest: true`, `invitedBy` (Player FK), `status` (active/inactive). No user account, no login credentials.
- **Game** (extended): Gains `maxPlayers` (nullable int) and `slug` (unique string).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A player completes the full signup flow (link → authenticate → confirm) in under 60 seconds on a standard connection.
- **SC-002**: Adding a guest via the inline form takes fewer than 30 seconds from opening the form to the guest appearing in the roster.
- **SC-003**: The old `/games/{GUID}` URL returns 301 and the browser lands on the correct new URL in a single redirect with no additional hops.
- **SC-004**: A game at full capacity rejects a signup request within one round-trip — no partial state is persisted.
- **SC-005**: Player and guest roster data is consistent between the public game detail page and the admin panel for the same game.

## Assumptions

- Guest players have no login credentials; their record is data-only.
- The `DropdownAddMore` component (spec 013) is the UI primitive for guest entry.
- Slug uniqueness is enforced at the database level.
- Existing auth-redirect middleware (spec 005) handles the `redirect` param post-login.
