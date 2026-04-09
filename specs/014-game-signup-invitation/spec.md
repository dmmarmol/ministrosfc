# Feature Specification: Game Signup Invitation

**Feature Branch**: `chore/014-game-signup-invitation`
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
5. **Given** a search engine crawler visits the signup URL, **When** the Game Sign Up Page is rendered, **Then** a `<meta name="robots" content="noindex,nofollow">` tag is present in the `<head>` and the URL is excluded from any auto-generated sitemap.

---

### User Story 2 — Player Signs Up via the Link (Priority: P1)

A player opens the signup link, reviews game details and the current roster, and confirms their attendance. Duplicate signups and capacity overflows are blocked.

**Why this priority**: The player signup action is the core deliverable; all other stories are additive.

**Independent Test**: Visit the signup URL as an authenticated unconfirmed player, click the confirm button on the pre-filled `DropdownAddMore` row, and verify the player appears as a confirmed row in the game roster.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user visits the signup URL, **When** the page loads, **Then** they are redirected to login with a `redirect` param pointing back to the signup URL.
2. **Given** an authenticated player who has not yet signed up visits the signup URL for an open game, **When** the page loads, **Then** they see rival, date, playground, confirmed player count vs. max, the player table with confirmed attendees, and a `DropdownAddMore` in the next empty table row pre-filled with their own player name alongside an adjacent confirm button.
3. **Given** the player's own name is pre-filled in the `DropdownAddMore` and they click the confirm button, **When** the request completes, **Then** their row becomes a permanent confirmed entry in the player table and the count increases.
4. **Given** a player who is already signed up visits the URL again, **When** the page loads, **Then** the `DropdownAddMore` is NOT pre-filled with their own name; only guests and unconfirmed existing players are available as addable options in the dropdown.
5. **Given** a game at full capacity (`signedUp >= maxPlayers`), **When** any player visits the signup URL, **Then** the form shows "El cupo está completo" and no registration is accepted.
6. **Given** an authenticated non-player user (Admin/Editor/DT) visits the signup URL, **When** they attempt to sign up, **Then** the system rejects the action and explains that only registered players can sign up.

---

### User Story 3 — Player Registers Attendees via DropdownAddMore (Priority: P1)

A signed-in player uses a `DropdownAddMore` component embedded in the next empty row of the player table to register attendees one at a time: themselves, new guest players, or other existing active registered players.

**Why this priority**: This is the primary signup interaction on the Game Sign Up Page — all three registration modes (self, guest, proxy) share the same component. Self-signup no longer uses a separate button.

**Independent Test**: As a signed-in unconfirmed player, visit the Game Sign Up Page for an open game: (1) click confirm on the pre-filled self-signup row; (2) select "Agregar invitado", type a guest name, confirm; (3) select another existing active player from the dropdown, confirm. Verify three new rows appear in the player table and the field visualization updates accordingly.

**Acceptance Scenarios**:

1. **Given** an authenticated unconfirmed player visits the Game Sign Up Page, **When** the page loads, **Then** the `DropdownAddMore` in the next empty table row is pre-filled with their own player name; a confirm button is visible in the same row adjacent to the dropdown.
2. **Given** the player's own name is pre-filled and they click the confirm button, **When** the request completes, **Then** a `GameParticipant` record with `confirmationStatus: CONFIRMED` is created, their row becomes a permanent confirmed entry in the table, and the `DropdownAddMore` advances to the next empty row.
3. **Given** a signed-up player selects "Agregar invitado" in the `DropdownAddMore`, types a guest name (first and last name), and clicks confirm, **When** the request completes, **Then** a new `Player` with `playerType: GUEST` linked to the inviting player and a `GameParticipant` record are created; the guest appears at the bottom of the table as "Invitado por {Player Name}" (guest's name hidden on game detail pages and general roster pages).
4. **Given** a signed-up player selects an existing active registered player from the `DropdownAddMore` (filtered to show only unconfirmed players) and clicks confirm, **When** the request completes, **Then** a `GameParticipant` record for the selected player is created with `confirmationStatus: CONFIRMED` and `confirmedById` set to the inviting player's ID; the selected player appears in the table as a standard registered player row.
5. **Given** a player who is already signed up visits the Game Sign Up Page again, **When** the page loads, **Then** the `DropdownAddMore` is NOT pre-filled with their own name; only new guests and unconfirmed existing registered players are available as selectable options.
6. **Given** the game roster is rendered, **When** guests are present, **Then** registered players (with number, position, name) are listed first; guests appear after a visual separator as "Invitado por {Player Name}" only.
7. **Given** an Admin views `/admin/players`, **When** guest records exist, **Then** each guest shows an "Invitado" badge and a visible reference to the registered player who invited them.

---

### User Story 4 — Updated Public Game Detail Page (Priority: P2)

The public game detail page is served at the SEO-friendly URL and shows the roster with guest attribution, accessible without authentication.

**Why this priority**: Read-only improvement that completes the URL rewrite and makes the guest display consistent with the admin view.

**Independent Test**: Visit `/games/{date}/{opponent}` as an anonymous user and verify game info, player roster, and guest tags display correctly.

**Acceptance Scenarios**:

1. **Given** a game with players and guests, **When** an anonymous user visits the game detail page, **Then** registered players show number, position, and name; guests appear as "Invitado por {Player Name}" after a separator.
2. **Given** the public homepage, **When** the schedule renders, **Then** game links use the `games/{date}/{opponent}` format.
3. **Given** the public player roster page, **When** it renders, **Then** guest players do NOT appear in the general roster listing.
4. **Given** a game with a lineup set, **When** an anonymous user visits the public game detail page at `/games/{slug}`, **Then** the lineup field visualization is NOT displayed; the page shows only game info and the player roster table.

---

### User Story 5 — Admin Sets Game Lineup (Priority: P2)

An Admin, Editor or DT user selects a tactical formation for the game from the admin game edit page using a pre-filled drop-down of standard formations. The chosen lineup determines how confirmed players are positioned on the visual field on the Game Sign Up Page.

**Why this priority**: Enhances Game Sign Up Page presentation but does not block player registration.

**Independent Test**: Select "4-3-3" from the lineup dropdown on a game's admin page, save, then visit the Game Sign Up Page and verify the field shows 1 GK, 3 defenders, 3 midfielders, and 3 forwards.

**Acceptance Scenarios**:

1. **Given** an Admin, Editor or DT user is on a game's admin edit page, **When** they view the game form, **Then** a "Formación" select element is visible with at least 14 pre-defined formation options (4-4-2, 4-3-3, 4-2-3-1, 4-5-1, 4-1-4-1, 4-3-2-1, 4-4-1-1, 3-4-3, 3-5-2, 3-4-2-1, 5-3-2, 5-4-1, 5-2-3, 4-2-4) plus a "Sin formación" empty option.
2. **Given** a formation is selected and saved, **When** the game is persisted, **Then** the formation string is stored on the game record.
3. **Given** an Admin changes the lineup after players have already signed up, **When** the Game Sign Up Page is refreshed, **Then** the field re-renders with players repositioned according to the new formation.
4. **Given** no lineup is set, **When** the Game Sign Up Page loads, **Then** the field visualization is hidden and only the player table is shown.

---

### User Story 6 — Game Sign Up Page Visual Lineup Display (Priority: P2)

The Game Sign Up Page renders a full-size soccer field (SVG or Canvas) on the left side (8 of 12 grid columns) with 11 player position circles laid out according to the selected formation, and a player table on the right (4 of 12 columns). Registered players fill positions first, then guests fill any remaining slots.

**Why this priority**: Provides an engaging visual overview of confirmed attendees and the tactical shape, but does not affect signup logic.

**Independent Test**: With 8 registered players and 2 guests confirmed for a 4-3-3 game, visit the Game Sign Up Page and verify: 8 registered players appear in closest-matching positions, 2 guests fill the next 2 empty slots with "Inv." label, 1 remaining slot shows an empty "TBD" circle.

**Acceptance Scenarios**:

1. **Given** a game with a lineup set and 11+ confirmed attendees, **When** the Game Sign Up Page renders, **Then** an SVG or Canvas soccer field occupies 8 of 12 grid columns and displays exactly 11 filled player circles, each showing the player's jersey number (or initials, e.g., `JG`, if jersey number is null), positioned according to the formation.
2. **Given** fewer than 11 registered players are confirmed, **When** the field renders, **Then** guest players (as black circles labelled `I{n}` where n is their 1-based index, e.g., `I1`, `I2`) fill the next available slots in signup order; remaining unfilled slots display an empty "TBD" circle.
3. **Given** a player's stored position matches a formation slot, **When** the field renders, **Then** that player is placed in the best-matching slot; where multiple players match the same slot type, the best fit by position hierarchy is chosen deterministically.
4. **Given** the page is viewed on a screen narrower than 768 px, **When** the layout renders, **Then** the field and table stack vertically (field full-width on top, table below) with no horizontal overflow.
5. **Given** the right-hand player table (4 of 12 columns on desktop), **When** it renders, **Then** it lists each confirmed attendee with jersey number, position abbreviation, and full name; guests appear at the bottom with an "Inv." prefix and no jersey number.

---

### Edge Cases

- Two games with the same date and opponent: the slug auto-appends an incrementing numeric suffix (e.g., `2026-04-09-atletico-2`) to remain unique; uniqueness is enforced at the database level.
- `maxPlayers` is null: signup is unlimited with no capacity block.
- The inviting player account is deleted after inviting guests: guests retain a fallback attribution label (e.g., "Invitado" without a name).
- An existing guest with the same name: show the existing record as a selectable option in `DropdownAddMore` to avoid duplicates.
- More than 11 confirmed attendees: only the first 11 (registered by confirmation time, then guests by signup time) appear on the field; all appear in the adjacent player table.
- No registered players at all: first 11 guests fill all field slots in signup order.
- Multiple players tied for the same formation slot (identical position): placement is deterministic — ordered by confirmation timestamp ascending.
- A registered player with `position = null`: placed in the next available field slot in ascending confirmation timestamp order after all position-matched players have been assigned.
- Capacity conflict during individual registration: each confirm action (self, guest, or proxy) is fully independent; capacity is checked at the time of each confirm. If capacity is full when confirm is clicked, that single action fails with a capacity-exceeded message; all previously confirmed registrations are unaffected.
- Player self-withdrawal from a game is out of scope for this release; only Admin and Editor users can remove a player or guest from a game (FR-014).

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST add `maxPlayers` (nullable integer) to the `Game` entity; when null, capacity is unlimited.
- **FR-002**: System MUST add a unique URL slug to each game derived from `{YYYY-MM-DD}-{opponentName}`; slugs MUST be normalized to lowercase, accented characters transliterated to ASCII equivalents (e.g., `é→e`, `ñ→n`), spaces and non-alphanumeric characters replaced by hyphens, and consecutive hyphens collapsed to a single hyphen. Old `/games/{GUID}` URLs MUST return HTTP 301 to `/games/{slug}`. The frontend game detail route MUST be updated to `/games/[slug]`, replacing the existing `/games/[id]` route.
- **FR-003**: Admin, Editor and DT users MUST be able to view and copy the signup link from the game admin page.
- **FR-004**: System MUST provide a signup endpoint (authenticated, player-role only) that creates a `GameParticipant` record with `confirmationStatus: CONFIRMED`; `GameSignup` used elsewhere in this spec is a conceptual alias for this model — no new DB table is required.
- **FR-005**: System MUST prevent duplicate signups — a player MUST NOT be registered for the same game more than once.
- **FR-006**: System MUST reject signups when total attendee count (registered players + guests) ≥ `maxPlayers`; guests count as full capacity slots.
- **FR-007**: Unauthenticated users visiting the signup URL MUST be redirected to login with a `redirect` param pointing back to the signup URL.
- **FR-008**: Authenticated non-player users (Admin/Editor/DT) MUST see the Game Sign Up Page in read-only mode with the full roster including guest full names visible; they MUST NOT be able to sign up.
- **FR-009**: Attendee registration (self, guest, or existing player proxy) MUST be performed one at a time via the `DropdownAddMore` embedded in the next empty row of the player table; each confirm button press triggers an independent atomic request. Self-signup creates a `GameParticipant` for the current user. Guest signup creates a `Player` with `playerType: GUEST` and a linked `GameParticipant`; each guest MUST store a reference to the inviting player (`invitedById`). Proxy signup (FR-025) creates a `GameParticipant` for the selected existing player.
- **FR-010**: Guest players MUST have an `isGuest: true` flag and a `invitedBy` FK to the registering player; they MUST appear in `/admin/players` with an "Invitado" badge.
- **FR-011**: Guest players MUST NOT appear in the public player roster (homepage or general roster pages).
- **FR-012**: On game detail pages (public and admin roster views), guests MUST appear as "Invitado por {Player Name}" without revealing the guest's name, listed after all registered players with a visual separator. On the Game Sign Up Page, the inviting player MUST see the guest's full name in their own guest list; Admin/Editor/DT in read-only mode MUST also see guest full names.
- **FR-013a**: Guest players MUST default to active status. Admins and Editors MUST be able to set a guest's status to inactive (prospective effect only: existing game rosters are unaffected). DT users MUST also be able to set a guest's status to inactive (prospective only).
- **FR-013b**: Admins and Editors MUST be able to explicitly remove any guest or registered player from a specific game. DT users MUST NOT be able to remove players or guests from games.
- **FR-014**: When a player or guest is explicitly removed from a game by an Admin or Editor, they MUST be removed from that game's roster immediately without affecting their overall player record or other games; their removal MUST decrement the confirmed attendee count, re-opening that capacity slot for new signups.
- **FR-015**: The Game Sign Up Page (`/games/{date}/{opponent}/signup`) MUST include `<meta name="robots" content="noindex,nofollow">` in its `<head>` and MUST NOT appear in any auto-generated sitemap; its URL pattern MUST be disallowed in `robots.txt`.
- **FR-016**: The `Game` entity MUST include an optional `lineup` field (nullable string, formation code); when null, no formation is set and the field visualization is hidden.
- **FR-017**: The admin game edit page MUST include a "Formación" `<select>` pre-filled with the following 14 formations: `4-4-2`, `4-3-3`, `4-2-3-1`, `4-5-1`, `4-1-4-1`, `4-3-2-1`, `4-4-1-1`, `3-4-3`, `3-5-2`, `3-4-2-1`, `5-3-2`, `5-4-1`, `5-2-3`, `4-2-4`; plus a blank "Sin formación" option (value: null). DT users MUST be permitted to set and modify the `lineup` field via the game PATCH endpoint (adds `lineup` to the DT-allowed field whitelist).
- **FR-018**: When a lineup is set, the Game Sign Up Page MUST render a soccer field using SVG or Canvas occupying 8 of 12 grid columns, visible to all authenticated visitors regardless of whether they have confirmed attendance. The field displays 11 position slot circles according to the selected formation; circles for registered players show their jersey number, or initials (e.g., `JG`) if jersey number is null; guest circles show `I{n}` (1-based index, e.g., `I1`, `I2`); empty slots show `TBD`.
- **FR-019**: Confirmed registered players MUST be assigned to the field slots whose position type best matches their stored `position` field. Players with `position = null` are assigned to remaining slots in ascending confirmation timestamp order after all position-matched players. Guest players MUST fill any remaining empty slots in order of signup time. Unoccupied slots MUST display as empty "TBD" circles.
- **FR-020**: When more than 11 attendees are confirmed, only the first 11 (registered players by confirmation time first, then guests by signup time) are placed on the field; all confirmed attendees appear in the adjacent player table regardless of whether they are on the field.
- **FR-021**: On desktop (≥768 px), the player table MUST occupy 4 of 12 grid columns alongside the field. Each row shows: jersey number, position abbreviation, full name. Guest rows appear at the bottom, prefixed with "Inv." and no jersey number. On mobile, field and table stack vertically.
- **FR-022**: When no lineup is set for a game, the Game Sign Up Page MUST NOT render the field visualization; only the player table is displayed. The public game detail page (`/games/{slug}`) MUST NOT display the field visualization regardless of whether a lineup is set.
- **FR-023**: Formation-to-slot mapping MUST be defined as a static client-side lookup (no server computation required). Hovering (desktop) or tapping (mobile) a player circle on the field MUST highlight the corresponding row in the right-side player table; no tooltip is shown on the field itself. The highlight MUST clear when the pointer leaves the circle (desktop) or when another circle is tapped (mobile).
- **FR-024**: The signup endpoint MUST return HTTP 422 and reject all signup and guest-creation attempts when `game.status` is not `SCHEDULED`.
- **FR-025**: A signed-up player MUST be able to register another existing active `REGISTERED` player who is not yet confirmed for the game by selecting them from the `DropdownAddMore` (filtered to show only active, unconfirmed registered players) and clicking the confirm button. The resulting `GameParticipant` record MUST set `confirmedById` to the inviting player's ID. The proxy-registered player appears in the player table as a standard registered player row.

### Key Entities

- **GameSignup** (semantic alias for `GameParticipant`): No new DB table. A confirmed signup is a `GameParticipant` record with `confirmationStatus: CONFIRMED`. The existing `GameParticipant` model (fields: `gameId`, `playerId`, `confirmationStatus`, `confirmedAt`, per-game stats) is reused.
- **GuestPlayer** (semantic alias for `Player` with `playerType: GUEST`): No new DB table. Guest players are standard `Player` records with `playerType: GUEST` and an `invitedById` FK. They have no login credentials.
- **Game** (extended): Gains `maxPlayers` (nullable int), `slug` (unique string), and `lineup` (nullable string — one of the 14 pre-defined formation codes).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: A player completes the full signup flow (link → authenticate → confirm) in under 60 seconds on a standard connection.
- **SC-002**: Adding a guest via the inline form takes fewer than 30 seconds from opening the form to the guest appearing in the roster.
- **SC-003**: The old `/games/{GUID}` URL returns 301 and the browser lands on the correct new URL in a single redirect with no additional hops.
- **SC-004**: A game at full capacity rejects a signup request within one round-trip — no partial state is persisted.
- **SC-005**: Player and guest roster data is consistent between the public game detail page and the admin panel for the same game.
- **SC-006**: The soccer field renders and positions all players within 1 second of the roster data loading, with no visible layout shift after initial paint.

## Assumptions

- Guest players have no login credentials; their record is data-only.
- The `DropdownAddMore` component (spec 013) is the UI primitive for guest entry.
- Slug uniqueness is enforced at the database level.
- Existing auth-redirect middleware (spec 005) handles the `redirect` param post-login.
- The Game Sign Up Page is intentionally not linked from any public navigation or sitemap; distribution is via direct link only.
- Formation-to-position-slot mapping (e.g., which field positions map to GK, DEF, MID, FWD slots for each formation string) is defined as a static lookup table in the frontend — no server computation is required.
- The field visualization is entirely client-side rendered; server only provides the `lineup` string and roster data.

## Clarifications

### Session 2026-04-09

- Q: Should the Game Sign Up Page be hidden from SEO crawlers and public web discovery? → A: Yes — the signup URL must set `noindex,nofollow` meta robots tag, be disallowed in `robots.txt`, and be excluded from any auto-generated sitemap. Distribution is via direct link only.
- Q: Do guests count toward the `maxPlayers` capacity? → A: Yes — each guest occupies one slot in the total `maxPlayers` count alongside registered player signups.
- Q: How should slug collisions (same date + opponent) be resolved? → A: Auto-append an incrementing numeric suffix (e.g., `2026-04-09-atletico-2`); collision is considered highly unlikely in practice.
- Q: When a guest is marked inactive, does it retroactively hide them from existing rosters? → A: No — inactive status is prospective only (Option B). Admin and Editor can additionally *remove* a guest or registered player from a specific game (immediate roster removal). DT can mark guests inactive (prospective) but cannot remove players/guests from games.
- Q: Is the guest's full name visible on the Game Sign Up Page to the player who added them? → A: Yes — the inviting player sees the guest's full name on the Game Sign Up Page; the name is hidden (shown as "Invitado por {Player Name}") on all public and admin roster pages.
- Q: What does an authenticated non-player (Admin/Editor/DT) see on the Game Sign Up Page? → A: A privileged read-only view with the full roster including guest full names visible, consistent with their admin-level access; they cannot sign up.

### Analysis Pass 2026-04-09

- C1 (GameSignup vs GameParticipant): `GameSignup` is a conceptual alias for `GameParticipant`; no new table. FR-004 and Key Entities updated accordingly.
- C2 (null position field placement): Players with `position = null` fill remaining field slots in ascending confirmation timestamp order after all position-matched players.
- C3 (guest batch capacity atomicity): First-write-wins per guest in submission order; the player's own signup is never rejected for capacity reasons.
- H1 (null jersey number on field): Registered player circles display initials (e.g., `JG`) when `jerseyNumber` is null; guest circles display `I{n}` (1-based index).
- H2 (player self-withdrawal scope): Out of scope for this release. Only Admin/Editor can remove a player from a game (FR-014).
- H3 (guest add timing — revised): Per-item confirm model. Each addition (self-signup, guest creation, or proxy signup of an existing player) is a separate atomic action triggered by a confirm button adjacent to the `DropdownAddMore` in the next empty row of the player table. The `DropdownAddMore` is pre-filled with the player's own name for not-yet-confirmed visitors. Three modes share the same component: (1) self-signup via pre-fill, (2) guest creation via "Agregar invitado", (3) proxy signup by selecting an existing unconfirmed player.
- H4 (slug normalization): Lowercase; accented chars transliterated to ASCII; spaces and non-alphanumeric chars → hyphens; consecutive hyphens collapsed.
- H5 (game status gate): Signup endpoint MUST reject (HTTP 422) when `game.status ≠ SCHEDULED`. Added as FR-024.
- H6 (hover/tap behavior): Hovering or tapping a field circle highlights the corresponding player row in the right-side table. No tooltip on the field itself.
- H7 (when field shows): Field is shown to all authenticated visitors as long as a lineup is set, regardless of whether they have confirmed attendance.
- M1 (DT lineup whitelist): DT users can set/modify `lineup` via PATCH; added to the DT-allowed field whitelist in FR-017. US-5 AC-1 updated to include DT.
- M2 (public game detail page route): Route is `/games/{slug}`. Lineup field visualization is exclusive to the Game Sign Up Page; not shown on the public game detail page (FR-022). US-4 AC-4 added.
- M3 (capacity re-opens on removal): Removal by Admin/Editor decrements the confirmed attendee count, re-opening that capacity slot (FR-014).
- M4 (FR-013 split): Separated into FR-013a (status management) and FR-013b (remove-from-game privilege) for independent testability.
- L1 (FR numbering): Renumbered to sequential order: FR-014 (remove-from-game, with M3), FR-015 (SEO noindex).
- L2 (wording drift): `public pages` replaced by `game detail pages and general roster pages` in US-3 AC-2.
