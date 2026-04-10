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
6. **Given** a game row in `/admin/games` has `status = SCHEDULED` and `signedUpCount < maxPlayers` (or `maxPlayers` is null), **When** an Admin, Editor, or DT user views the table, **Then** a share-signup link for `{baseUrl}/games/{slug}/signup` is displayed in that row; clicking it copies the URL to clipboard AND triggers the native share dialog on supporting devices.
7. **Given** any game row in `/admin/games` regardless of `status`, **When** an Admin, Editor, or DT user views the table, **Then** a share-detail link for `{baseUrl}/games/{slug}` is displayed in that row; clicking it copies the URL to clipboard AND triggers the native share dialog on supporting devices.

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

**Independent Test**: As a signed-in unconfirmed player, visit the Game Sign Up Page for an open game: (1) click confirm on the pre-filled self-signup row; (2) select "Agregar invitado", type a guest name, optionally select a position, confirm; (3) select "Agregar invitado" again and click × to dismiss — verify the `DropdownAddMore` returns to its default state; (4) select another existing active player from the dropdown, confirm. Verify three confirmed rows appear in the player table and the field visualization updates accordingly.

**Acceptance Scenarios**:

1. **Given** an authenticated unconfirmed player visits the Game Sign Up Page, **When** the page loads, **Then** the `DropdownAddMore` in the next empty table row is pre-filled with their own player name; a confirm button is visible in the same row adjacent to the dropdown.
2. **Given** the player's own name is pre-filled and they click the confirm button, **When** the request completes, **Then** a `GameParticipant` record with `confirmationStatus: CONFIRMED` is created, their row becomes a permanent confirmed entry in the table, and the `DropdownAddMore` advances to the next empty row.
3. **Given** a signed-up player selects "Agregar invitado" in the `DropdownAddMore`, types a guest name (first and last name), optionally selects a position from the position dropdown, and clicks confirm, **When** the request completes, **Then** a new `Player` with `playerType: GUEST` (with `position` set to the selected value if provided) linked to the inviting player and a `GameParticipant` record are created; the guest appears at the end of the roster in `confirmedAt ASC` order as "Invitado por {Player Name}" (guest's name hidden on game detail pages and general roster pages; position abbreviation displayed in the table if a position was set).
4. **Given** a signed-up player selects an existing active registered player from the `DropdownAddMore` (filtered to show only players with `playerType = REGISTERED`, `status = ACTIVE`, and `confirmationStatus ≠ CONFIRMED` for this game) and clicks confirm, **When** the request completes, **Then** a `GameParticipant` record for the selected player is created with `confirmationStatus: CONFIRMED` and `confirmedById` set to the inviting player's ID; the selected player appears in the table with "Agregado por: {Inviting Player Name}" displayed below their name in a smaller font size.
5. **Given** a player who is already signed up visits the Game Sign Up Page again, **When** the page loads, **Then** the `DropdownAddMore` is NOT pre-filled with their own name; only new guests and unconfirmed existing registered players are available as selectable options.
6. **Given** the game roster is rendered, **When** the player table is displayed, **Then** all confirmed attendees appear in registration timestamp order regardless of player type; guests appear inline in that order, visually distinguished as "Invitado por {Player Name}" with an "Inv." prefix and no jersey number.
7. **Given** an Admin views `/admin/players`, **When** guest records exist, **Then** each guest shows an "Invitado" badge and a visible reference to the registered player who invited them.
8. **Given** a signed-up player selects "Agregar invitado" in the `DropdownAddMore` (rendering the guest form with name and position fields), **When** they click the × (dismiss) button before confirming, **Then** the guest form is cleared and the `DropdownAddMore` returns to its default state (dropdown options restored, no form fields visible) without creating any record.

---

### User Story 4 — Updated Public Game Detail Page (Priority: P2)

The public game detail page is served at the SEO-friendly URL and shows the roster with guest attribution, accessible without authentication.

**Why this priority**: Read-only improvement that completes the URL rewrite and makes the guest display consistent with the admin view.

**Independent Test**: Visit `/games/{date}/{opponent}` as an anonymous user and verify game info, player roster, and guest tags display correctly.

**Acceptance Scenarios**:

1. **Given** a game with players and guests, **When** an anonymous user visits the game detail page, **Then** all attendees appear in registration timestamp order; registered players show number, position, and name; guests appear inline in that order as "Invitado por {Player Name}" with no jersey number displayed.
2. **Given** the public homepage, **When** the schedule renders, **Then** game links use the `games/{date}/{opponent}` format.
3. **Given** the public player roster page, **When** it renders, **Then** guest players do NOT appear in the general roster listing.
4. **Given** a game with a lineup set, **When** an anonymous user visits the public game detail page at `/games/{slug}`, **Then** the lineup field visualization is NOT displayed; the page shows only game info and the player roster table.
5. **Given** the public homepage renders the "next games" section, **When** games are fetched, **Then** only games with `status = SCHEDULED` appear; all other statuses are excluded.
6. **Given** the public homepage renders the "past games" section, **When** games are fetched, **Then** only games with `status = COMPLETED` appear; games with `status = CANCELLED` or `status = IN_PROGRESS` are not shown in any homepage section.

---

### User Story 5 — Admin Sets Game Lineup (Priority: P2)

An Admin, Editor or DT user selects a tactical formation for the game from the admin game edit page using a pre-filled drop-down of standard formations. The chosen lineup determines how confirmed players are positioned on the visual field on the Game Sign Up Page.

**Why this priority**: Enhances Game Sign Up Page presentation but does not block player registration.

**Independent Test**: Select "4-3-3" from the lineup dropdown on a game's admin page, save, then visit the Game Sign Up Page and verify the field shows 1 GK, 3 defenders, 3 midfielders, and 3 forwards.

**Acceptance Scenarios**:

1. **Given** an Admin, Editor or DT user is on a game's admin edit page, **When** they view the game form, **Then** a "Formación" select element is visible with exactly 14 pre-defined formation options (4-4-2, 4-3-3, 4-2-3-1, 4-5-1, 4-1-4-1, 4-3-2-1, 4-4-1-1, 3-4-3, 3-5-2, 3-4-2-1, 5-3-2, 5-4-1, 5-2-3, 4-2-4); `4-4-2` is pre-selected for new games; there is no blank "Sin formación" empty option.
2. **Given** a formation is selected and saved, **When** the game is persisted, **Then** the formation string is stored on the game record.
3. **Given** an Admin changes the lineup after players have already signed up, **When** the Game Sign Up Page is refreshed, **Then** the field re-renders with players repositioned according to the new formation.
4. **Given** an Admin creates a new game without selecting a formation, **When** the game is saved, **Then** the `lineup` field is automatically set to `4-4-2`; the Game Sign Up Page renders the field using the `4-4-2` formation by default.

---

### User Story 6 — Game Sign Up Page Visual Lineup Display (Priority: P2)

The Game Sign Up Page renders a full-size soccer field (SVG or Canvas) on the left side (6 of 12 grid columns) with 11 player position circles laid out according to the selected formation, and a player table on the right (6 of 12 columns). Registered players fill positions first, then guests fill any remaining slots.

**Why this priority**: Provides an engaging visual overview of confirmed attendees and the tactical shape, but does not affect signup logic.

**Independent Test**: With 8 registered players and 2 guests confirmed for a 4-3-3 game, visit the Game Sign Up Page and verify: 8 registered players appear in closest-matching positions, 2 guests fill the next 2 empty slots with "Inv." label, 1 remaining slot shows an empty "TBD" circle.

**Acceptance Scenarios**:

1. **Given** a game with 11+ confirmed attendees, **When** the Game Sign Up Page renders, **Then** an SVG or Canvas soccer field occupies 6 of 12 grid columns and displays exactly 11 filled player circles, each showing the player's jersey number (or initials, e.g., `JG`, if jersey number is null), positioned according to the formation.
2. **Given** fewer than 11 registered players are confirmed, **When** the field renders, **Then** guest players (as black circles labelled `I{n}` where n is their 1-based index, e.g., `I1`, `I2`) fill the next available slots in signup order; remaining unfilled slots display an empty "TBD" circle.
3. **Given** a player's stored position matches a formation slot, **When** the field renders, **Then** that player is placed in the best-matching slot; where multiple players match the same slot type, the best fit by position hierarchy is chosen deterministically.
4. **Given** the page is viewed on a screen narrower than 768 px, **When** the layout renders, **Then** the field and table stack vertically (field full-width on top, table below) with no horizontal overflow.
5. **Given** the right-hand player table (6 of 12 columns on desktop), **When** it renders, **Then** it lists each confirmed attendee in registration timestamp order (registered and guests intermixed) with jersey number, position abbreviation, and full name; guests appear inline in sign-up order with an "Inv." prefix and no jersey number.

---

### User Story 7 — Game Status Auto-Transition (SCHEDULED → IN_PROGRESS → COMPLETED) (Priority: P1)

The system automatically transitions game status through its lifecycle without manual admin intervention: a game moves from `SCHEDULED` to `IN_PROGRESS` when the current time reaches its start datetime (`game.date`), and from `IN_PROGRESS` to `COMPLETED` when the current time reaches its auto-computed end datetime (`game.endDate = date + 100 minutes`). `endDate` is derived server-side and is not editable by users. For legacy records that pre-date this feature and have `endDate = null`, the job falls back to transitioning `IN_PROGRESS → COMPLETED` 24 hours after `game.date`.

**Why this priority**: Ensures system state accurately reflects the game lifecycle without manual admin intervention and gates all time-sensitive behaviors — signup eligibility, homepage display, and admin share links.

**Independent Test**: (1) Create a game with `date = now − 5 minutes`; `endDate` is auto-set to `date + 100 min = now + 95 min`; run the job once; verify `game.status = IN_PROGRESS` and the Game Sign Up Page returns 422. (2) Create a second game with `date = now − 101 minutes` and `status = SCHEDULED`; `endDate` is auto-set to `date + 100 min = now − 1 min`; run the transition job once; because both step-1 and step-2 conditions are satisfied in the same run, the game transitions directly `SCHEDULED → COMPLETED` with zero observable `IN_PROGRESS` duration; verify `game.status = COMPLETED` and the game appears in the "past games" homepage section.

**Acceptance Scenarios**:

1. **Given** a game with `status = SCHEDULED` and `date <= now`, **When** the scheduled transition job runs, **Then** `game.status` is updated to `IN_PROGRESS`.
2. **Given** a game with `status = SCHEDULED` and `date > now`, **When** the scheduled transition job runs, **Then** the game's status is NOT changed.
3. **Given** a game with `status = IN_PROGRESS` and `endDate <= now`, **When** the scheduled transition job runs, **Then** `game.status` is updated to `COMPLETED`.
4. **Given** a legacy game with `status = IN_PROGRESS` and `endDate = null` and `date < now − 24 hours`, **When** the scheduled transition job runs, **Then** `game.status` is updated to `COMPLETED` (fallback for records created before this feature was deployed).
5. **Given** a game has `status = IN_PROGRESS` or `COMPLETED`, **When** any user attempts to sign up via the Game Sign Up Page, **Then** the signup endpoint returns HTTP 422 with the message "El juego ya no está disponible para inscripciones".
6. **Given** a game has transitioned to `COMPLETED`, **When** an Admin, Editor, or DT user views the game in the admin panel, **Then** they can see all game details and the full list of signed-up players in read-only mode.
7. **Given** a game has `status = COMPLETED`, **When** an ADMIN user edits the game, **Then** they can still modify the `lineup` field and add participants via admin override; Editor and DT users attempting to modify lineup or add participants for a COMPLETED game receive HTTP 403.
8. **Given** a game has `status = IN_PROGRESS`, **When** an Admin, Editor, or DT user views the game in the admin panel, **Then** the game is shown in read-only mode for Editor and DT; only an ADMIN user may modify any game field, lineup, or participant roster for an IN_PROGRESS game.
9. **Given** an ADMIN updates `game.date` to a future timestamp while the game has `status = IN_PROGRESS`, **When** the update is saved, **Then** `game.status` is atomically reverted to `SCHEDULED` and `game.endDate` is recomputed as the new `date + 100 minutes` in the same transaction.

---

### User Story 8 — Authenticated Player Sees Signup CTA on Public Game Cards (Priority: P1)

A logged-in Player browsing the public homepage sees an "Anotarse" action link directly on each SCHEDULED game card, enabling navigation to the signup page in one click. Cards reflect the Player's current signup state — already signed up shows "Ya anotado", a full game shows "Completo".

**Why this priority**: Reduces friction to the core signup flow — a Player should not need to navigate to the game detail page first.

**Independent Test**: Log in as a Player, visit the homepage. A SCHEDULED game card shows "Anotarse". Clicking it navigates to `/games/:slug/signup`. A card where the Player is already signed up shows "Ya anotado". A full game shows "Completo". Log out — no signup UI appears on any card.

**Acceptance Scenarios**:

1. **Given** an authenticated Player visits the public homepage, **When** the SCHEDULED games section renders, **Then** each game card shows an "Anotarse" link navigating to `/games/:slug/signup`.
2. **Given** an authenticated Player is already signed up for a SCHEDULED game, **When** they view that game card, **Then** the card shows "Ya anotado" instead of "Anotarse".
3. **Given** a SCHEDULED game has reached its `maxPlayers` capacity, **When** an authenticated Player views that game card, **Then** the card shows "Completo" instead of "Anotarse".
4. **Given** an unauthenticated visitor views the homepage, **When** SCHEDULED game cards render, **Then** no signup CTA is shown on any card.
5. **Given** a user with role EDITOR, ADMIN, or DT is authenticated, **When** they view the public homepage, **Then** no signup CTA is shown on any game card.
6. **Given** an authenticated Player views a COMPLETED or CANCELLED game card, **When** the card renders, **Then** no signup CTA is shown.

---

### User Story 9 — Unregistration (Self and Admin) (Priority: P2)

A confirmed player cancels their own attendance from the Game Sign Up Page before the game starts. Separately, users with Admin, Editor, or DT roles can remove any confirmed player or guest from the roster for SCHEDULED games.

**Why this priority**: Provides roster accuracy without requiring admin intervention for player-initiated cancellations; DT inclusion aligns team-management responsibilities.

**Independent Test**: Log in as a Player already signed up for a SCHEDULED game. Navigate to the signup page and click "Cancelar inscripción". Verify the player's row disappears from the roster, the count decrements, and the DropdownAddMore reappears pre-filled with the player's name.

**Acceptance Scenarios**:

1. **Given** an authenticated Player with a CONFIRMED GameParticipant record visits the Game Sign Up Page for a SCHEDULED game, **When** the page loads, **Then** a "Cancelar inscripción" button is visible alongside their roster entry.
2. **Given** the Player clicks "Cancelar inscripción", **When** the request completes, **Then** their GameParticipant record is deleted, the confirmed count decrements, the page updates without a full refresh, and `SignupRegistrationRow` reverts to showing the self-signup CTA button ("Confirmar asistencia").
3. **Given** an authenticated Player visits the signup page for an IN_PROGRESS or COMPLETED game where they were signed up, **When** the page loads, **Then** the "Cancelar inscripción" button is absent or disabled.
4. **Given** an Admin, Editor, or DT user views the Game Sign Up Page for a SCHEDULED game, **When** they view the confirmed attendees, **Then** an unregistration action (e.g., "×" or "Eliminar") is visible for each confirmed player and guest.
5. **Given** an Admin, Editor, or DT user clicks the unregistration action for a confirmed attendee, **When** the request completes, **Then** that GameParticipant record is removed, the count decrements, and the table updates reactively without a full page refresh.
6. **Given** an Editor or DT user attempts to unregister a participant from an IN_PROGRESS or COMPLETED game, **When** the request is sent, **Then** the server returns HTTP 403 and the frontend displays an error message.

---

### User Story 10 — Full-Width Signup Page Layout (Priority: P1)

The Game Sign Up Page is redesigned to occupy the full available browser width. A page-spanning header shows the match title and confirmed-player count. Below it, a two-column desktop grid places the soccer field on the left and all signup controls plus the roster on the right.

**Why this priority**: The current `max-w-2xl` container wastes horizontal space on desktop and makes it harder to display the field and roster side by side at comfortable sizes. The redesign improves readability and usability without changing any business logic.

**Independent Test**: Open the Game Sign Up Page in a ≥1280 px viewport. Verify there is no max-width wrapper constraining the content area. Verify the header spans the full width. Verify the soccer field occupies 6 columns on the left and the right panel (controls + roster) occupies the other 6 columns. Resize to a mobile viewport and verify all sections stack vertically: header → field → right panel.

**Acceptance Scenarios**:

1. **Given** a user visits the Game Sign Up Page on a desktop-width viewport (≥768 px), **When** the page renders, **Then** the outer container has no maximum width restriction and the content fills the available browser width.
2. **Given** the desktop layout is active, **When** the page renders, **Then** `SignupGameHeader` spans the full page width above both columns and displays "Ministros vs {TEAM}" alongside the confirmed-player count.
3. **Given** the desktop layout is active, **When** the page renders, **Then** the left 6 columns contain only the soccer field visualization; the right 6 columns contain, in descending order: the self-signup / cancel-self CTA, the `SignupAddPlayer` widget (when visible), and the roster table (`SignupPlayerTable`).
4. **Given** a user visits the Game Sign Up Page on a mobile-width viewport (<768 px), **When** the page renders, **Then** the sections stack vertically in the order: header → field → right panel.

---

### User Story 11 — Dedicated Add-Player Widget (Priority: P1)

A confirmed player uses a dedicated `SignupAddPlayer` widget to add other attendees (registered players via proxy or new guests). The widget is a self-contained component that replaces the inline proxy-search previously embedded inside `SignupRegistrationRow`. Switching between "select a registered player" mode and "add a guest" mode is mutually exclusive within the widget. `SignupRegistrationRow` is simplified to handle only the self-signup and cancel-self actions.

**Why this priority**: Separating the "add another player" responsibility into its own component makes each component's intent clear, removes duplication between `SignupRegistrationRow` and `SignupProxySearch`, and enables the mutually-exclusive list/form UX that the current design cannot express cleanly.

**Independent Test**: As a confirmed Player on a SCHEDULED game's signup page, locate the `SignupAddPlayer` widget. (1) Verify the searchable dropdown shows only active registered non-confirmed players. (2) Select a player from the dropdown and verify a proxy signup fires immediately and the roster updates. (3) Click "Agregar invitado" and verify the inline guest form appears while the player list is hidden. (4) Click × on the guest form and verify it closes with no record created and the dropdown is restored. (5) Re-open the guest form, fill in first name, last name, and position, submit — verify the guest appears in the roster. Verify that at no point are both the player-selection list and the guest form visible simultaneously.

**Acceptance Scenarios**:

1. **Given** an authenticated PLAYER with a CONFIRMED participation record visits a SCHEDULED game's signup page, **When** the page renders, **Then** the `SignupAddPlayer` widget is visible in the right panel, positioned between the self-signup CTA and the roster table.
2. **Given** the `SignupAddPlayer` widget is in its default (dropdown) mode, **When** it renders, **Then** the dropdown options are populated with all players where `playerType = REGISTERED`, `status = ACTIVE`, and `confirmationStatus ≠ CONFIRMED` for this game; the inviting player's own ID is excluded.
3. **Given** the user selects a player from the dropdown, **When** the selection is made, **Then** the component immediately emits `signup-proxy` with the selected player's ID; the parent handles the API call and updates the roster reactively; the dropdown resets after a successful signup.
4. **Given** the user activates the "Agregar invitado" action within the widget, **When** the inline guest form appears, **Then** the dropdown player-list is hidden and the guest form is the only visible mode; the form includes first name (required), last name (required), and an optional position `<select>`.
5. **Given** the inline guest form is open and the user clicks the × (dismiss) button, **When** the button is clicked, **Then** the guest form closes, no record is created, and the widget returns to its default dropdown state.
6. **Given** the user completes the inline guest form with valid first name, last name, and optionally a position, and submits it, **When** the submission succeeds, **Then** the component emits `signup-guest(firstName, lastName, position)`, the parent creates the guest, the new guest appears in the roster, and the guest form closes; the widget returns to its default dropdown state.
7. **Given** `SignupRegistrationRow` is rendered, **When** it is inspected, **Then** it contains only the self-signup CTA (for non-confirmed players) and the cancel-self CTA (for confirmed players); all proxy-search and guest-form logic has been removed.
8. **Given** the `SignupAddPlayer` widget is visible, **When** the game transitions to a non-SCHEDULED state (e.g., after status refresh), **Then** the widget is hidden and no add-player action is available.

---

### Edge Cases

- Two games with the same date and opponent: the slug auto-appends an incrementing numeric suffix (e.g., `2026-04-09-atletico-2`) to remain unique; uniqueness is enforced at the database level. The numeric suffix has no enforced upper bound in this release; duplicate games on the same date and opponent are considered highly unlikely in practice.
- Opponent name yields an empty or all-hyphen slug after transliteration (e.g., `"???"` normalizes to `"---"`): the system MUST reject the game with a validation error; a non-empty, non-whitespace opponent name is required before saving.
- `maxPlayers` is null: signup is unlimited with no capacity block.
- The inviting player account is soft-deleted after inviting guests: the `invitedById` FK on the guest's `Player` record remains valid (no hard-delete cascade). Attribution degrades gracefully to a fallback label (e.g., "Invitado" without a name). In `/admin/players`, any guest whose inviting player is soft-deleted MUST display a visual pill (e.g., "Invitante eliminado") to flag the broken attribution reference.
- An existing guest with the same name: a guest with identical first and last name already registered for **this game** is a hard duplicate blocked by FR-005. A guest with the same name from a **previous game** MAY be offered as a selectable existing record in `DropdownAddMore` to avoid DB proliferation; inactive guests MUST NOT be offered.
- More than 11 confirmed attendees: only the first 11 (registered by confirmation time, then guests by signup time) appear on the field; all appear in the adjacent player table.
- No registered players at all: first 11 guests fill all field slots in signup order.
- Multiple players tied for the same formation slot (identical position): placement is deterministic — ordered by confirmation timestamp ascending.
- A registered player with `position = null`: placed in the next available field slot in ascending confirmation timestamp order after all position-matched players have been assigned.
- Capacity conflict during individual registration: each confirm action (self, guest, or proxy) is fully independent; capacity is checked at the time of each confirm. If capacity is full when confirm is clicked, that single action fails with a capacity-exceeded message; all previously confirmed registrations are unaffected.
- Concurrent signups for the last slot: capacity enforcement MUST be atomic at the database level (unique constraint + transaction); when two or more requests race for the last available slot, exactly one succeeds and the others receive HTTP 422 with a capacity-exceeded message; no partial state is persisted.
- Game start time passes but the scheduled job has not yet run: the game remains `SCHEDULED` until the next job execution; the signup endpoint's own `game.status ≠ SCHEDULED` check (FR-024) provides a secondary guard once the status is updated.
- Game end time passes but the scheduled job has not yet run: the game remains `IN_PROGRESS`; signups are still blocked (FR-024 rejects non-SCHEDULED); the game appears in neither "next games" nor "past games" on the homepage (FR-029) until the job transitions it to `COMPLETED`.
- `endDate` is null (legacy records): for games created before this feature was deployed, `endDate` may be null; the job falls back to transitioning `IN_PROGRESS → COMPLETED` 24 hours after `game.date`. `endDate` is auto-populated for all games created or updated after deployment.
- Double-transition in a single job run: if a game has `date <= now AND endDate <= now` when the job fires (e.g., a game starting 101 minutes ago), step 1 sets `status = IN_PROGRESS` and step 2 immediately sets `status = COMPLETED` in the same execution. The `IN_PROGRESS` state will have zero observable duration. This is expected — no special handling is needed.
- ADMIN reverts an IN_PROGRESS game by updating `date` to the future: `game.status` is atomically reset to `SCHEDULED` and `endDate` is recomputed in the same transaction (FR-030). This is the intended mechanism for correcting an accidental or premature transition.
- `maxPlayers` is null and game is `SCHEDULED`: the share-signup-link (FR-027) MUST still appear in `/admin/games` since there is no capacity ceiling — the game is always open for more signups.
- Admin has the game edit form open when the cron transitions status to `IN_PROGRESS` or `COMPLETED`: on form submit, the PATCH endpoint checks the current `game.status` and returns HTTP 403 to non-ADMIN users trying to mutate lineup/participants on a COMPLETED game; ADMIN continues to save normally.
- Player self-unregistration (FR-035) is only permitted for `SCHEDULED` games; attempting to unregister from `IN_PROGRESS` or `COMPLETED` games returns HTTP 422.
- Concurrent self-unregistration is idempotent at the DB level: if two requests try to delete the same `GameParticipant`, exactly one succeeds and the other receives a not-found error; the capacity slot is decremented exactly once.

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
- **FR-009**: Attendee registration (self, guest, or existing player proxy) MUST be performed one at a time via the `DropdownAddMore` embedded in the next empty row of the player table; each confirm button press triggers an independent atomic request. Self-signup creates a `GameParticipant` for the current user. Guest signup creates a `Player` with `playerType: GUEST` and a linked `GameParticipant`; each guest MUST store a reference to the inviting player (`invitedById`). When the guest mode is selected, an optional position `<select>` dropdown (values: same `Position` enum values as registered players, plus a blank "Sin posición" option) MUST appear alongside the first/last name fields; the inviting player MAY select a position before confirming, which is stored on the guest `Player` record. The guest entry row MUST be dismissable via an × button; clicking it MUST cancel the guest mode and return the `DropdownAddMore` to its default state (dropdown options restored, form fields hidden) without creating any record. Proxy signup (FR-025) creates a `GameParticipant` for the selected existing player. Upon a successful confirm, the frontend MUST update the player table and field visualization from the server response without requiring a full page refresh. If the successful registration reaches `maxPlayers`, the `DropdownAddMore` row MUST be replaced immediately with the "El cupo está completo" message.
- **FR-010**: Guest players are represented as `Player` records with `playerType: GUEST` and an `invitedBy` FK to the registering player; they MUST appear in `/admin/players` with an "Invitado" badge.
- **FR-011**: Guest players MUST NOT appear in the public player roster (homepage or general roster pages).
- **FR-012**: On game detail pages (public and admin roster views), guests MUST appear inline in registration timestamp order as "Invitado por {Player Name}" without revealing the guest's name, visually distinguished with an "Inv." prefix and no jersey number; no separator between registered players and guests is applied. On the Game Sign Up Page, the inviting player MUST see the guest's full name in their own guest list; Admin/Editor/DT in read-only mode MUST also see guest full names.
- **FR-013a**: Guest players MUST default to active status. Admins and Editors MUST be able to set a guest's status to inactive (prospective effect only: existing game rosters are unaffected). DT users MUST also be able to set a guest's status to inactive (prospective only).
- **FR-013b**: For games with `status = SCHEDULED`, Admins, Editors, and DT users MUST be able to explicitly remove any guest or registered player. For games with `status = IN_PROGRESS` or `COMPLETED`, only ADMIN may remove participants; Editor and DT attempting removal MUST receive HTTP 403.
- **FR-014**: When a player or guest is explicitly removed from a game by an Admin or Editor, they MUST be removed from that game's roster immediately without affecting their overall player record or other games; their removal MUST decrement the confirmed attendee count, re-opening that capacity slot for new signups.
- **FR-015**: The Game Sign Up Page (`/games/{date}/{opponent}/signup`) MUST include `<meta name="robots" content="noindex,nofollow">` in its `<head>` and MUST NOT appear in any auto-generated sitemap; `robots.txt` MUST include `Disallow: /games/*/signup` to disallow all signup URLs regardless of game slug.
- **FR-016**: The `Game` entity MUST include a `lineup` field (non-nullable string, formation code); new games MUST default to `4-4-2` if no lineup is provided by the caller. The field visualization on the Game Sign Up Page is ALWAYS rendered. Legacy records with `lineup = null` (created before this requirement) MUST be treated as `4-4-2` by the frontend for display purposes.
- **FR-017**: The admin game edit page MUST include a "Formación" `<select>` pre-filled with the following 14 formations: `4-4-2`, `4-3-3`, `4-2-3-1`, `4-5-1`, `4-1-4-1`, `4-3-2-1`, `4-4-1-1`, `3-4-3`, `3-5-2`, `3-4-2-1`, `5-3-2`, `5-4-1`, `5-2-3`, `4-2-4`. The `4-4-2` formation MUST be pre-selected as the default value for new games; there is no blank "Sin formación" empty option. For games with `status = SCHEDULED`, DT users MUST be permitted to set and modify the `lineup` field via the game PATCH endpoint (adds `lineup` to the DT-allowed field whitelist). For games with `status = IN_PROGRESS`, ONLY ADMIN users MAY modify any game field, lineup, or participant roster; any attempt by Editor or DT to mutate an IN_PROGRESS game MUST be rejected with HTTP 403. For games with `status = COMPLETED`, ONLY ADMIN users MAY modify the `lineup` field or add new participants; any attempt by Editor or DT to modify lineup or add participants to a COMPLETED game MUST be rejected with HTTP 403.
- **FR-018**: The Game Sign Up Page MUST always render a soccer field using SVG or Canvas occupying 6 of 12 grid columns, visible to all authenticated visitors regardless of whether they have confirmed attendance. The field displays 11 position slot circles according to the selected formation (defaulting to `4-4-2` if the `lineup` field is null on a legacy record); circles for registered players show their jersey number, or initials (e.g., `JG`) if jersey number is null; guest circles show `I{n}` (1-based index, e.g., `I1`, `I2`); empty slots show `TBD`.
- **FR-019**: Confirmed registered players MUST be assigned to the field slots whose position type best matches their stored `position` field. Players with `position = null` are assigned to remaining slots in ascending confirmation timestamp order after all position-matched players. Guest players who have a `position` value set MUST be treated identically to registered players for field slot-type matching: they participate in the position-first pass, sorted by `confirmedAt ASC` among all players (registered and guest) matching the same slot type. Guest players without a `position` MUST fill remaining empty slots in order of signup time. Unoccupied slots MUST display as empty "TBD" circles.
- **FR-020**: When more than 11 attendees are confirmed, field slot assignment prioritizes: (1) registered players by confirmation timestamp, then (2) guests by signup timestamp; only the first 11 by this priority order are placed on the field. All confirmed attendees appear in the adjacent player table in registration timestamp order, regardless of player type or whether they are placed on the field.
- **FR-021**: On desktop (≥768 px), the player table MUST occupy 6 of 12 grid columns alongside the field. Each row shows: jersey number, position abbreviation, full name. All confirmed attendees are listed in registration timestamp order regardless of player type (registered and guests intermixed); guest rows are visually distinguished with an "Inv." prefix, no jersey number, and a position abbreviation if one was assigned at signup (or "—" if none), appearing inline at their natural position in the sign-up order. On mobile, field and table stack vertically.
- **FR-022**: The public game detail page (`/games/{slug}`) MUST NOT display the field visualization regardless of the game's lineup value. The field visualization is exclusive to the Game Sign Up Page.
- **FR-023**: Formation-to-slot mapping MUST be defined as a static client-side lookup (no server computation required). Hovering (desktop) or tapping (mobile) a player circle on the field MUST highlight the corresponding row in the right-side player table; no tooltip is shown on the field itself. The highlight MUST clear when the pointer leaves the circle (desktop) or when another circle is tapped (mobile).
- **FR-024**: The signup endpoint MUST return HTTP 422 and reject all signup and guest-creation attempts when `game.status` is not `SCHEDULED`. The 422 response body MUST include an explanatory message (e.g., "El juego ya no está disponible para inscripciones"). Upon receiving this 422, the frontend MUST display the message inline and disable the confirm button without requiring a page refresh.
- **FR-025**: A signed-up player MUST be able to register another existing active `REGISTERED` player who is not yet confirmed for the game by selecting them from the `SignupAddPlayer` dropdown (filtered to show only players where `playerType = REGISTERED`, `status = ACTIVE`, and `confirmationStatus ≠ CONFIRMED` for this specific game); selection alone triggers the proxy signup — no separate confirm button is required (see FR-038). If two players concurrently attempt to proxy-register the same target player, the second request MUST return HTTP 409 with the message "Este jugador ya fue registrado. Refresca el navegador para visualizar los cambios". The resulting `GameParticipant` record MUST set `confirmedById` to the inviting player's ID. The proxy-registered player appears in the player table with "Agregado por: {Inviting Player Name}" displayed below their name in a smaller font size.
- **FR-026**: The system MUST include a scheduled job that runs at least every 5 minutes and applies two idempotent transitions in order: (1) set `game.status = IN_PROGRESS` for every game where `status = SCHEDULED` AND `date <= NOW`; (2) set `game.status = COMPLETED` for every game where `status = IN_PROGRESS` AND ((`endDate IS NOT NULL` AND `endDate <= NOW`) OR (`endDate IS NULL` AND `date < NOW − 24 hours`)). The job MUST NOT affect games in `COMPLETED` or `CANCELLED` status. Both transitions are idempotent — re-running on already-transitioned games is a no-op. **Note**: if a game satisfies both conditions simultaneously (i.e., `date <= NOW AND endDate <= NOW` at the same execution), the two `updateMany` calls run sequentially and the game transitions directly from `SCHEDULED` to `COMPLETED` in one job run — the `IN_PROGRESS` state will have zero observable duration in this case.
- **FR-027**: The `/admin/games` table MUST render a shareable signup link for each row where `game.status = SCHEDULED` AND (`signedUpCount < maxPlayers` OR `maxPlayers IS NULL`). The link URL MUST be `{baseUrl}/games/{slug}/signup`. Clicking it MUST copy the URL to the clipboard AND invoke `navigator.share` on devices that support the Web Share API; on unsupported devices, clipboard copy alone is acceptable with a confirmation toast.
- **FR-028**: The `/admin/games` table MUST render a shareable game detail link for every game row regardless of `game.status` (i.e., shown for `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, and `CANCELLED` rows). The link URL MUST be `{baseUrl}/games/{slug}`. Clicking it MUST copy the URL to the clipboard AND invoke `navigator.share` on supporting devices; on unsupported devices, clipboard copy alone is acceptable with a confirmation toast.
- **FR-029**: The public homepage game sections MUST be filtered strictly by status: the "next games" section MUST show ONLY `status = SCHEDULED` games; the "past games" section MUST show ONLY `status = COMPLETED` games; games with `status = CANCELLED` or `status = IN_PROGRESS` MUST NOT appear in any homepage section.
- **FR-030**: When a game is created or its `date` field is updated (regardless of the game's current `status`), the system MUST automatically compute `game.endDate = date + exactly 100 minutes` server-side. If an ADMIN updates `date` to a future timestamp while the game has `status = IN_PROGRESS`, the CMS MUST atomically revert `game.status` to `SCHEDULED` and recompute `endDate` in the same PATCH transaction. `endDate` MUST NOT be exposed as an editable input in any admin UI form; it is a server-only derived field. Client payloads that include `endDate` MUST be stripped silently at the schema validation layer (no error returned to the client). The `date` field MUST be stored and compared in UTC; the frontend MUST send `date` as an ISO 8601 string with an explicit UTC offset (or `Z` suffix); the CMS MUST reject `date` values lacking a timezone designator with HTTP 422.
- **FR-031**: The games list endpoint (`GET /api/v1/games`) MUST embed a `currentPlayerStatus` field per game in the response when the authenticated caller has role `PLAYER`. Possible values: `"available"` (game is `SCHEDULED`, not full, and caller has no `CONFIRMED` `GameParticipant` record for this game), `"signed_up"` (caller has a `CONFIRMED` `GameParticipant` record for this game), `"full"` (game has reached `maxPlayers` capacity regardless of caller status). For unauthenticated requests and requests from callers with roles other than `PLAYER`, this field MUST be omitted or `null`. The field MUST be computed server-side in the same query without requiring additional round-trips.
- **FR-032**: The `GameCard` component MUST accept an optional `signupState` prop typed as `"available" | "signed_up" | "full" | undefined`. When `signupState = "available"` and `game.status = SCHEDULED`, the card MUST display an "Anotarse" action link navigating to `/games/:slug/signup`. When `signupState = "signed_up"`, the card MUST display a "Ya anotado" non-interactive indicator. When `signupState = "full"`, the card MUST display a "Completo" non-interactive indicator. When `signupState` is absent or `undefined`, no signup UI is rendered — preserving existing behaviour for unauthenticated visitors and non-PLAYER roles.
- **FR-033**: The `GameCard` component MUST be restructured from its current single `<NuxtLink>` wrapper to a container element (e.g., `<div>` or `<article>`) with an inner `<NuxtLink>` for game detail navigation and a separate `<NuxtLink>` for the "Anotarse" signup action. Nested interactive elements are prohibited. The game detail link MUST remain the primary navigation target for the card area; the signup action MUST be visually distinct and positioned in the right-side action area, replacing the "Próximo" status badge for SCHEDULED cards when `signupState` is present.
- **FR-034**: The Game Sign Up Page MUST display the selected formation name as a visible text label above or adjacent to the soccer field (e.g., "Formación: 4-4-2"). This label MUST be visible to all authenticated roles (PLAYER, Admin, Editor, DT). The label MUST update reactively if an authorised user modifies the lineup without a full page refresh.
- **FR-035**: An authenticated PLAYER who currently has a `CONFIRMED` `GameParticipant` record for a `SCHEDULED` game MUST be able to self-unregister via the Game Sign Up Page by clicking a "Cancelar inscripción" button. Clicking the button MUST send a DELETE request to the participation endpoint, remove the player's `GameParticipant` record, decrement the confirmed attendee count (re-opening the capacity slot), and update the page reactively without a full refresh — returning `SignupRegistrationRow` to its self-signup CTA state (showing the "Confirmar asistencia" button). Self-unregistration MUST be rejected (HTTP 422) for games with `status ≠ SCHEDULED`.
- **FR-036**: The Game Sign Up Page MUST render without a maximum width constraint (the current `max-w-2xl` outer wrapper MUST be removed). On desktop (≥768 px), the page MUST use a two-column grid: the left 6 of 12 columns contain the soccer field visualization; the right 6 of 12 columns contain, in top-to-bottom order: (1) `SignupRegistrationRow` (self-signup / cancel-self CTA, PLAYER role only), (2) the `SignupAddPlayer` widget (when visible per FR-037), and (3) the confirmed-players roster table (`SignupPlayerTable`). The `SignupGameHeader` component MUST span the full page width above both columns. On mobile, all sections MUST stack vertically in the order: header → field → right panel.
- **FR-037**: A new `SignupAddPlayer` component MUST be introduced under `packages/frontend/src/components/pages/games/signup/`. The component MUST accept a `confirmedPlayerIds: string[]` prop (the list of already-confirmed participant player IDs for the current game) and MUST emit two events: `signup-proxy(playerId: string)` and `signup-guest(firstName: string, lastName: string, position: string | null)`. The component MUST be rendered in the Game Sign Up Page right panel when `game.status = SCHEDULED` and the authenticated user is a PLAYER with a `CONFIRMED` `GameParticipant` record for the game (i.e., the same user who can currently proxy-register others per FR-025).
- **FR-038**: `SignupAddPlayer` MUST use the existing `DropdownAddMore` component. The dropdown options MUST be dynamically fetched from `GET /api/v1/players?status=ACTIVE&playerType=REGISTERED` and filtered client-side to exclude player IDs already present in the `confirmedPlayerIds` prop — no new endpoint is required. Selecting a player from the dropdown MUST immediately emit `signup-proxy` with the selected player's ID — no additional confirm step is required; the parent handles the API call and roster update. While the proxy API call is in-flight, the dropdown MUST be disabled and a loading indicator MUST be visible. On API failure, an inline error message MUST be displayed within the widget and the dropdown MUST be re-enabled so the user can retry. After a successful proxy signup, the widget MUST reset to its default dropdown state and remove the just-confirmed player from the dropdown options.
- **FR-039**: When the user activates the "Agregar invitado" option within `SignupAddPlayer`, the entire contents of the `SignupAddPlayer` box MUST switch to an inline guest form, completely replacing the player-selection dropdown (the dropdown is not merely hidden behind the form — it is replaced). The form MUST include: first name (required text input), last name (required text input), an optional position `<select>` (same `Position` enum values as registered players, plus a blank "Sin posición" default option), and a submit button. The player-selection dropdown state and the guest form state are mutually exclusive: they MUST NOT both be visible simultaneously. An × (dismiss) button MUST be displayed at the far top-right of the `SignupAddPlayer` container whenever the guest form is active; clicking it MUST replace the guest form with the player-selection dropdown, returning `SignupAddPlayer` to its default state without creating any record. On valid form submission the component MUST emit `signup-guest(firstName, lastName, position)`.
- **FR-040**: `SignupRegistrationRow` MUST be simplified to contain only the self-signup CTA (shown when the authenticated PLAYER is not yet confirmed) and the cancel-self CTA (shown when the authenticated PLAYER is confirmed). All inline guest-form markup and all inline proxy-search / `SignupProxySearch` usage MUST be removed from this component. The component's emitted events MUST be reduced to `signup-self`, `cancel-self`, and `dismiss`; the `signup-guest` and `signup-proxy` emits MUST be removed.
- **FR-041**: `SignupProxySearch.vue` MUST be deleted once `SignupAddPlayer.vue` has been introduced and all usages of `SignupProxySearch` in the codebase have been replaced.

### Key Entities

- **GameSignup** (semantic alias for `GameParticipant`): No new DB table. A confirmed signup is a `GameParticipant` record with `confirmationStatus: CONFIRMED`. The existing `GameParticipant` model (fields: `gameId`, `playerId`, `confirmationStatus`, `confirmedAt`, per-game stats) is reused.
- **GuestPlayer** (semantic alias for `Player` with `playerType: GUEST`): No new DB table. Guest players are standard `Player` records with `playerType: GUEST` and an `invitedById` FK. They have no login credentials.
- **Game** (extended): Gains `maxPlayers` (nullable int), `slug` (unique string), `lineup` (non-nullable string, defaults to `4-4-2` — one of the 14 pre-defined formation codes; legacy records may have `null` which the frontend treats as `4-4-2`), and `endDate` (nullable DateTime — auto-computed server-side as `date + 100 minutes`, rounded to the nearest minute; not user-editable; nullable only for legacy records that pre-date this feature).

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
- The `GameStatus` enum contains four values: `SCHEDULED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`. Signup eligibility is gated on `SCHEDULED` only; `IN_PROGRESS` is non-enrollable (HTTP 422). From an editing perspective: `SCHEDULED` allows all role-appropriate mutations (Admin/Editor/DT per their normal permissions); `IN_PROGRESS` is read-only for all roles except ADMIN (who retains full editing rights including reverting to `SCHEDULED` by advancing `date`); `COMPLETED` restricts lineup and participant mutations to ADMIN only.
- If a user holds the `PLAYER` role in addition to any admin role (Admin/Editor/DT), they are treated as a `PLAYER` for signup purposes on the Game Sign Up Page and may register themselves as an attendee.

## Clarifications

### Session 2026-04-09

- Q: Should the Game Sign Up Page be hidden from SEO crawlers and public web discovery? → A: Yes — the signup URL must set `noindex,nofollow` meta robots tag, be disallowed in `robots.txt`, and be excluded from any auto-generated sitemap. Distribution is via direct link only.
- Q: Do guests count toward the `maxPlayers` capacity? → A: Yes — each guest occupies one slot in the total `maxPlayers` count alongside registered player signups.
- Q: How should slug collisions (same date + opponent) be resolved? → A: Auto-append an incrementing numeric suffix (e.g., `2026-04-09-atletico-2`); collision is considered highly unlikely in practice.
- Q: When a guest is marked inactive, does it retroactively hide them from existing rosters? → A: No — inactive status is prospective only (Option B). Admin and Editor can additionally _remove_ a guest or registered player from a specific game (immediate roster removal). DT can mark guests inactive (prospective) but cannot remove players/guests from games.
- Q: Is the guest's full name visible on the Game Sign Up Page to the player who added them? → A: Yes — the inviting player sees the guest's full name on the Game Sign Up Page; the name is hidden (shown as "Invitado por {Player Name}") on all public and admin roster pages.
- Q: What does an authenticated non-player (Admin/Editor/DT) see on the Game Sign Up Page? → A: A privileged read-only view with the full roster including guest full names visible, consistent with their admin-level access; they cannot sign up.

### Analysis Pass 2026-04-09

- C1 (GameSignup vs GameParticipant): `GameSignup` is a conceptual alias for `GameParticipant`; no new table. FR-004 and Key Entities updated accordingly.
- C2 (null position field placement): Players with `position = null` fill remaining field slots in ascending confirmation timestamp order after all position-matched players.
- C3 (guest batch capacity atomicity): First-write-wins per guest in submission order; the player's own signup is never rejected for capacity reasons.
- H1 (null jersey number on field): Registered player circles display initials (e.g., `JG`) when `jerseyNumber` is null; guest circles display `I{n}` (1-based index).
- H2 (player self-withdrawal scope): Now in scope (FR-035). An authenticated PLAYER may self-unregister from SCHEDULED games via the Game Sign Up Page. Admin/Editor/DT can unregister any player from SCHEDULED games (FR-013b updated to include DT).
- H3 (guest add timing — revised): Per-item confirm model. Each addition (self-signup, guest creation, or proxy signup of an existing player) is a separate atomic action triggered by a confirm button adjacent to the `DropdownAddMore` in the next empty row of the player table. The `DropdownAddMore` is pre-filled with the player's own name for not-yet-confirmed visitors. Three modes share the same component: (1) self-signup via pre-fill, (2) guest creation via "Agregar invitado", (3) proxy signup by selecting an existing unconfirmed player.
- H4 (slug normalization): Lowercase; accented chars transliterated to ASCII; spaces and non-alphanumeric chars → hyphens; consecutive hyphens collapsed.
- H5 (game status gate): Signup endpoint MUST reject (HTTP 422) when `game.status ≠ SCHEDULED`; this explicitly includes `IN_PROGRESS` (see US-7 AC-5). Added as FR-024.
- H6 (hover/tap behavior): Hovering or tapping a field circle highlights the corresponding player row in the right-side table. No tooltip on the field itself.
- H7 (when field shows): Field is always shown to all authenticated visitors on the Game Sign Up Page; since `lineup` is non-nullable (defaults to `4-4-2`), there is no "no lineup" state in new games.
- M1 (DT lineup whitelist): DT users can set/modify `lineup` via PATCH; added to the DT-allowed field whitelist in FR-017. US-5 AC-1 updated to include DT.
- M2 (public game detail page route): Route is `/games/{slug}`. Lineup field visualization is exclusive to the Game Sign Up Page; not shown on the public game detail page (FR-022). US-4 AC-4 added.
- M3 (capacity re-opens on removal): Removal by Admin/Editor decrements the confirmed attendee count, re-opening that capacity slot (FR-014).
- M4 (FR-013 split): Separated into FR-013a (status management) and FR-013b (remove-from-game privilege) for independent testability.
- L1 (FR numbering): Renumbered to sequential order: FR-014 (remove-from-game, with M3), FR-015 (SEO noindex).
- L2 (wording drift): `public pages` replaced by `game detail pages and general roster pages` in US-3 AC-2.

### Analysis Pass 2026-04-09 (Round 2)

- C1 (concurrency — last slot race): Capacity enforcement is atomic at the DB level (transaction + unique constraint); concurrent races for the last slot resolve to exactly one success and HTTP 422 for the rest. Added to Edge Cases.
- C2 (concurrent proxy for same target): Second request returns HTTP 409 with "Este jugador ya fue registrado. Refresca el navegador para visualizar los cambios". Added to FR-025.
- C3 (isGuest flag mismatch): Removed non-existent `isGuest: true` flag from FR-010; replaced with `playerType: GUEST` to match the Prisma schema.
- H1 (reactivity strategy): Strategy A — optimistic local state update. Frontend updates player table and field visualization from server response on each confirm success; no full page refresh required. Added to FR-009.
- H2 (slug transliteration fallback): If opponent name normalizes to empty or all-hyphens after transliteration, system rejects with a validation error. Added to Edge Cases.
- H3 (proxy registration attribution): "Agregado por: {Player Name}" label displayed below the proxy-registered player's name in a smaller font size. WhatsApp/email notification to the proxy-registered player is deferred to a future notification spec. Added to FR-025 and US-3 AC-4.
- H4 (422 client-side handling): 422 response MUST include explanatory message; frontend MUST display it and disable the confirm button. Added to FR-024.
- H5 (guest dedup scope): Same-name guest for **this game** = hard duplicate blocked by FR-005. Same-name guest from a previous game MAY be offered as a reusable record; inactive guests excluded. Updated Edge Cases.
- M1 (DropdownAddMore at capacity): When registration reaches `maxPlayers`, DropdownAddMore row is replaced with "El cupo está completo" immediately. Added to FR-009.
- M2 (robots.txt wildcard): `robots.txt` MUST include `Disallow: /games/*/signup`. Updated FR-015.
- M3 (soft-delete of inviting player): Inviting player deletion is soft-delete; `invitedById` FK remains valid. Admin/players table shows "Invitante eliminado" pill for affected guests. Updated Edge Cases.
- M4 (table sort order): Player table lists all confirmed attendees in registration timestamp order regardless of type; guests appear inline, not at the bottom. Updated FR-020, FR-021, US-3 AC-6, US-4 AC-1, US-6 AC-5.
- M5 (proxy dropdown filter): Dropdown filters to `playerType = REGISTERED`, `status = ACTIVE`, `confirmationStatus ≠ CONFIRMED` for this specific game. Updated FR-025 and US-3 AC-4.
- L1 (slug suffix bound): Numeric dedup suffix has no upper bound in this release. Added note to Edge Cases.
- L2 (game.status enum): Valid values are `SCHEDULED` and `COMPLETED`; this spec gates on `SCHEDULED` only. Added to Assumptions.
- L3 (dual-role user): Users with `PLAYER` role can sign up regardless of any additional admin roles held. Added to Assumptions.

### Extension Pass 2026-04-09

- E1 (auto-transition timing): "1 day after game date" means `game.date + 24h` has passed at job execution time. A daily cron is sufficient — the job does not need to fire exactly at `game.date + 24h`. `IN_PROGRESS` and `CANCELLED` statuses are untouched. Added as FR-026; US-7 added.
- E2 (COMPLETED lineup restriction): When `game.status = COMPLETED`, only ADMIN may modify `lineup` or add participants. DT and Editor are read-only for COMPLETED games. Updated FR-017; added to US-7 AC-5.
- E3 (admin/games table share links): SCHEDULED + under capacity → show signup link (clipboard + `navigator.share`). Detail link (clipboard + `navigator.share`) is visible for ALL game statuses regardless of enrollment state. Updated FR-028; US-1 AC-7 updated.
- E4 (homepage status filtering): Next games = SCHEDULED only; past games = COMPLETED only; CANCELLED and IN‑PROGRESS excluded from all homepage sections. Added as FR-029; US-4 ACs 5–6 added.
- E5 (share link when maxPlayers is null): No capacity ceiling → share-signup-link always visible when `status = SCHEDULED` and `maxPlayers IS NULL`. Clarified in FR-027 and Edge Cases.
- E6 (IN_PROGRESS on homepage): Games with `status = IN_PROGRESS` are excluded from the public homepage (neither upcoming nor past). Covered by FR-029.
- E7 (IN_PROGRESS transition via startDate/endDate): `game.date` is reused as the game start datetime (SCHEDULED → IN_PROGRESS trigger). A new auto-computed `game.endDate` field drives the IN_PROGRESS → COMPLETED transition. `endDate` is not user-editable. If `endDate` is null (legacy records), the fallback is `game.date + 24h`. The scheduled job frequency increases from daily to every 5 minutes to support real-time transitions. Updated FR-026; US-7 ACs 1–9 updated.
- E8 (endDate auto-computation rule): `endDate = date + exactly 100 minutes`, computed server-side on game create and on every update where `date` changes regardless of game.status. The admin UI MUST NOT expose `endDate` as an editable field. Client payloads including `endDate` are stripped silently. Added as FR-030.
- E9 (IN_PROGRESS editing restrictions): IN_PROGRESS games are read-only for all roles except ADMIN. ADMIN retains full editing rights on IN_PROGRESS games. If ADMIN moves `date` forward on an IN_PROGRESS game, `game.status` reverts to `SCHEDULED` atomically (FR-030). Editor and DT receive HTTP 403 for any mutation on an IN_PROGRESS game (FR-017, FR-013b). Updated US-7 AC-8/AC-9; Assumption 8 updated.
- E10 (share detail link): Game detail link is visible in `/admin/games` for all game statuses including IN_PROGRESS and CANCELLED — independently of enrollment eligibility. Only the signup invitation link is restricted to SCHEDULED games. Updated FR-028, US-1 AC-7.
- E11 (guest position and dismissable row): When adding a guest via "Agregar invitado", an optional position dropdown (same `Position` enum values as registered players) MUST appear alongside the name fields, allowing the inviting player to pre-assign a position before confirming. The guest's `position` (if selected) is stored on their `Player` record and used for SVG field slot assignment (treated equivalently to a registered player with that position). The guest entry row is dismissable via an × button, returning `DropdownAddMore` to its default state without creating any record. Updated FR-009, FR-019, FR-021, US-3 AC-3, US-3 AC-8 (new).

### Session 2026-04-10

- Q: When a Player sees a SCHEDULED game card on the public homepage, should the card differentiate between available, already-signed-up, and full states? → A: Yes — "Anotarse" for available, "Ya anotado" when already signed up, "Completo" when at capacity.
- Q: How should the public homepage obtain per-game signup state for the authenticated Player? → A: Embed `currentPlayerStatus` per game in the existing games list endpoint response when the caller has role PLAYER; omit or null for all other callers — no new endpoint required.
- Q: Should the "Anotarse" link coexist with the existing card-level game detail navigation, or replace it? → A: Coexist — game detail remains the primary card navigation; "Anotarse" is a distinct secondary action; `GameCard` is restructured from a single `<NuxtLink>` wrapper to avoid nested interactive elements.
- Q: After a PLAYER self-unregisters (FR-035), which state should the page return to — the `DropdownAddMore` pre-filled with the player's own name (US-9 AC-2 legacy), or the plain "Confirmar asistencia" self-signup CTA button from `SignupRegistrationRow` (FR-040 Wave 3)? → A: The plain "Confirmar asistencia" CTA button. The player's own signup uses the existing "Confirmar asistencia" button on `SignupRegistrationRow`; the `DropdownAddMore` widget (`SignupAddPlayer`) is exclusively for adding other players (proxy or guest). US-9 AC-2's DropdownAddMore reference is superseded by FR-040.
- Q: When a user selects an existing player from the `SignupAddPlayer` dropdown and the proxy API call is in-flight, what should the widget do? → A: Disable the dropdown and show a loading indicator while in-flight; display an inline error message and re-enable the dropdown on failure; reset to default state on success (FR-038 updated).
- Q: Which endpoint should `SignupAddPlayer` use to fetch eligible players for the dropdown? → A: Reuse the existing `GET /api/v1/players?status=ACTIVE&playerType=REGISTERED` endpoint; filter out already-confirmed player IDs client-side via the `confirmedPlayerIds` prop. No new endpoint required (FR-038 updated).

### Analysis Pass 2026-04-10

- C1 (lineup non-nullable): `game.lineup` is now non-nullable with a server-side default of `4-4-2`. The "Sin formación" empty option is removed from the admin dropdown (FR-017 updated). The field visualization is ALWAYS rendered on the Game Sign Up Page; FR-016, FR-018, FR-022, US-5 AC-1, US-5 AC-4, and US-6 description updated accordingly.
- C2 (column layout): Game Sign Up Page uses a symmetric 6/6 split — 6 columns for the soccer field visualization, 6 columns for the player table and registration controls. FR-018, FR-021, US-6 description, US-6 AC-1, and US-6 AC-5 updated.
- C3 (formation label): A visible "Formación: {code}" label is displayed above or adjacent to the soccer field on the Game Sign Up Page, visible to all authenticated roles. Added as FR-034.
- C4 (player self-unregistration): Previously out of scope (H2 Round 2 reversed). An authenticated PLAYER may now self-unregister from SCHEDULED games via a "Cancelar inscripción" button on the Game Sign Up Page (FR-035). Admin/Editor/DT can unregister any player from SCHEDULED games; FR-013b updated to include DT. Edge Cases updated to replace the "out of scope" note with the new idempotency edge case. User Story 9 added.

### Wave 3 Amendment — Session 2026-04-28

- W1 (layout overhaul): The current `max-w-2xl mx-auto` wrapper on the Game Sign Up Page limits content width and makes the two-column layout feel cramped on larger displays. Requirement: remove the max-width constraint and allow the page to fill the full browser width. The header (`SignupGameHeader`) spans the full width; the 6/6 column split (field left, controls+roster right) is retained but now uses the full available width. Added as FR-036. US-10 added.
- W2 (dedicated add-player widget): The proxy-search functionality previously duplicated across `SignupRegistrationRow` and `SignupProxySearch` is consolidated into a new `SignupAddPlayer` component. It renders the searchable registered-player dropdown and the inline guest form as mutually exclusive modes using `DropdownAddMore`'s `inline-create` slot. Selecting a registered player triggers an immediate proxy signup without a separate confirm step. Added as FR-037, FR-038, FR-039. US-11 added.
- W3 (SignupRegistrationRow simplification): With guest-form and proxy-search moved to `SignupAddPlayer`, `SignupRegistrationRow` is reduced to self-signup CTA + cancel-self CTA only. The `signup-guest` and `signup-proxy` emits are removed from this component. Added as FR-040.
- W4 (SignupProxySearch deletion): `SignupProxySearch.vue` becomes redundant after `SignupAddPlayer.vue` is introduced. It MUST be deleted as part of this wave. Added as FR-041.
- W5 (right-panel layout order): The right panel order in `signup.vue` is now explicit: (1) `SignupRegistrationRow` (self-signup / cancel-self CTA, PLAYER only), (2) `SignupAddPlayer` (SCHEDULED + confirmed PLAYER only), (3) `SignupPlayerTable` (all authenticated users). Encoded in FR-036.
- W6 (immediately-emit proxy): Unlike the old confirm-button model, selecting a player from `SignupAddPlayer`'s dropdown immediately emits `signup-proxy`. This reduces the number of clicks and aligns with the UX pattern where the dropdown selection itself is the confirmation intent. Encoded in FR-038.
- W7 (guest-form X close): The guest inline form inside `SignupAddPlayer` has an × dismiss button that resets the widget to dropdown mode without creating any record. This mirrors the existing × dismissal in FR-009 / US-3 AC-8 but is now the responsibility of `SignupAddPlayer` rather than `SignupRegistrationRow`. Encoded in FR-039.
