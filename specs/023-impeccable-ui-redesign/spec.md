# Feature Specification: Impeccable UI Redesign

**Feature Branch**: `023-impeccable-ui-redesign`

**Created**: 2026-11-24

**Status**: Draft

**Input**: User description: "Work on the redesign of the app using the impeccable plugin."

## Context

Spec 020 modernized the frontend stack (Nuxt UI, Tailwind v4) but kept the existing look. The current visual system is now documented in `packages/frontend/DESIGN.md` ("The Matchday Programme": blue masthead, near-black chrome, white cards). That document is **evidence of the incumbent, not the target**: this spec replaces the visual identity while keeping product truth, content, routes, behavior and Spanish-language copy.

The work is driven by the Impeccable plugin (`/impeccable init`, `shape`, `craft`/new-work, `critique`, `audit`, `polish`, `document`), so each user story below maps to one of its stages.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Product context is captured before any visual decision (Priority: P1)

The maintainer records who the app serves and what it must feel like, so the redesign is grounded in product truth instead of taste.

**Why this priority**: The project has no `PRODUCT.md`; Impeccable's redesign flow requires it and every later decision depends on it.

**Independent Test**: `PRODUCT.md` exists in `packages/frontend`, and `impeccable context` resolves it without a missing-product warning.

**Acceptance Scenarios**:

1. **Given** no `PRODUCT.md`, **When** the maintainer completes the init interview, **Then** `PRODUCT.md` describes the audiences (public fans and players, signed-in players, admins/editors/DT), brand personality, anti-references and accessibility needs.
2. **Given** `PRODUCT.md` exists, **When** a surface is designed, **Then** it can be traced to a stated audience need.

---

### User Story 2 - A new visual world is chosen and recorded (Priority: P1)

The maintainer picks a replacement visual direction (palette strategy, type pairing, shape and depth language, motion grammar) and it is committed as the system's new `DESIGN.md` and token set.

**Why this priority**: All surface work inherits from this decision; doing it per page produces drift.

**Independent Test**: `DESIGN.md` and `.impeccable/design.json` describe the new world, and the app's theme tokens match them.

**Acceptance Scenarios**:

1. **Given** the incumbent `DESIGN.md`, **When** the redesign direction is approved, **Then** `DESIGN.md` is replaced (not patched) and the retired look is listed as an anti-reference.
2. **Given** the new direction, **When** theme tokens are updated, **Then** colors, fonts, radii and shadows live in a single source of truth that Nuxt UI components consume.
3. **Given** the club's brand colors, **When** the palette is chosen, **Then** the decision on blue versus gold (and any second accent) is explicit and the stale alternative is removed.

---

### User Story 3 - Public pages are redesigned (Priority: P1)

Visitors and players see the home page, roster, schedule, game detail, player profile and statistics pages in the new visual world, on phones first.

**Why this priority**: These are the surfaces fans and players actually use.

**Independent Test**: Each listed page renders in the new system at mobile (375px), tablet (768px) and desktop (1280px) widths, with the same data and links as before.

**Acceptance Scenarios**:

1. **Given** the public home, roster and schedule, **When** viewed at the three widths, **Then** layout, hierarchy and components follow the new `DESIGN.md` with no leftover old-look components.
2. **Given** a completed and an upcoming game, **When** shown as cards or on the detail page, **Then** result and status are clear without relying on color alone. The signup call to action is not shown in this redesign (see FR-020).
3. **Given** the statistics pages, **When** tables and filters render, **Then** they stay scannable and keep query-param filter behavior from spec 020.

---

### User Story 3b - Players get a collectible-style player card (Priority: P2)

A player card inspired by the football-video-game "ultimate team" card (reference: `private/design/PlayerCardFifa.vue`) becomes the signature way a player is shown: on the roster, on their profile, and wherever a player is highlighted. It is an inspiration for structure and feel, not a replica: the club has no per-player ability ratings today, so the card shows only data the app really has.

**Why this priority**: Squad players are the primary audience, and a card they would want to screenshot and share gives the club's archive a face. It depends on the visual world from User Story 2, so it follows it.

**Independent Test**: A roster or profile page shows the card for a player with full data and for a player with missing photo, nickname, position or number, and no slot displays invented or placeholder numbers.

**Acceptance Scenarios**:

1. **Given** a player with photo, number, position and nickname, **When** their card renders, **Then** it shows the photo, jersey number, position, name (nickname when set) and the club crest/monogram in the card's top block.
2. **Given** the player has career stats, **When** the card renders, **Then** its stat grid shows real values only (appearances, goals, assists, yellow cards, red cards), scoped to the same year filter as the profile when one is active.
3. **Given** a player lacks a photo, number, position or stats, **When** the card renders, **Then** each missing part has a designed fallback and no fake rating appears.
4. **Given** per-player ability ratings are added to the data model in the future, **When** the card is extended, **Then** the stat grid and an overall rating slot can take them without redesigning the card.
5. **Given** the roster on a 375px phone, **When** many cards render, **Then** they stay legible, tappable and link to the player profile.

---

### User Story 4 - Admin and authenticated flows are restyled for task completion (Priority: P2)

Admins, editors, DT and players using login, registration, signup, profile and admin screens get the new system applied with emphasis on speed and clarity rather than expression.

**Why this priority**: Operate-mode surfaces must stay consistent and efficient; they follow once the public system is proven.

**Independent Test**: Admin navigation, tables, forms, modals and toasts use the new tokens, and every existing admin task can still be completed.

**Acceptance Scenarios**:

1. **Given** the admin layout, **When** an admin navigates between games, players, teams, playgrounds, tournaments and users, **Then** navigation, active state and tables are consistent.
2. **Given** any form, modal or confirmation, **When** validation errors, loading or disabled states occur, **Then** each state is visibly designed in the new system.
3. **Given** login, registration and any existing signup pages and routes, **When** a user reaches them directly, **Then** they work as before with the new styling and behavior (including `returnUrl` handling) unchanged; they are simply not promoted from public pages.

---

### User Story 5 - The redesign passes quality gates (Priority: P2)

Before release, the redesigned UI is reviewed and checked for accessibility, responsiveness and design-detector findings.

**Why this priority**: Prevents shipping a redesign with regressions or AI-generic patterns.

**Independent Test**: Impeccable `critique`, `audit` and `detect` reports are recorded and their blocking findings resolved.

**Acceptance Scenarios**:

1. **Given** the finished UI, **When** `audit` runs, **Then** no critical accessibility (contrast, focus, keyboard, labels) or responsive issues remain.
2. **Given** the changed UI files, **When** the detector runs, **Then** its findings are fixed or explicitly waived with a reason.
3. **Given** the existing unit and Playwright suites, **When** they run after the redesign, **Then** they pass, with selectors updated only where markup legitimately changed.

---

### Edge Cases

- Long opponent, player or venue names must truncate or wrap without breaking cards.
- Missing crests, player photos or nicknames need designed fallbacks.
- Empty states (no games, no roster, no stats) and error states are designed, not blank.
- Fonts that fail to load must fall back without layout shift.
- A dormant dark theme exists in the tokens; its fate must be decided so half-styled dark mode is not exposed.
- Spanish copy is longer than English in places (buttons, table headers) and must fit.

## Confirmed Direction (shape, 2026-11-24)

Confirmed by the maintainer after the Impeccable decision round; anchors the visual world on the **public home** (mode: Persuade, phone first, code-led).

- **World:** "Planilla en Triplicado": the next game as a team sheet printed in black ink on white, with stamp and typewriter type. **Black and white are the main colors; blue is reserved for details** (line numbers, section labels, position tags, links, the SUSPENDIDO stamp, the reserved-slot outline, arrows). The Plantilla and Estadísticas copies are black and white strips, not pink or yellow.
- **Primary tasks:** find the next game (rival, date, time, venue, directions) and open any teammate's card. No signup call to action (FR-020).
- **Sheet lines:** game participants loaded by the DT, falling back to the usual squad when none are loaded.
- **Raises kept:** a suspended game is stamped SUSPENDIDO in blue with struck lines. The earlier "drenched blue ground" raise is dropped; commitment now comes from hard black rules, heavy condensed type and strict black/white contrast.
- **Reserved slot:** a hidden, designed space for a future "Anotarme" action (FR-021).
- **States to design:** upcoming, suspended, played (score, scorers, who played), no upcoming game, long names.
- **Reference sketch:** `packages/frontend/.impeccable/mocks/decision/revised.html` (black/white with blue details; gitignored working material). The earlier `assigned.html` shows the old signup button and a blue ground, and is superseded.
- **Open:** exact blue (one detail color, not a second brand color) and fonts (typewriter and condensed stamp faces must be self-hosted); "Cómo llegar" depends on playground address or map data being usable; dark theme; the player card as a "ficha" tied to the sheet.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `PRODUCT.md` MUST be created in `packages/frontend` via Impeccable init before any visual redesign work starts.
- **FR-002**: The redesign MUST treat the current look as an anti-reference and replace `DESIGN.md` and its sidecar, not layer changes on top of it.
- **FR-003**: Existing routes, data, permissions, behavior and Spanish-language copy MUST be preserved; factual copy changes need the maintainer's approval.
- **FR-004**: Visual tokens (color, type, radius, shadow, motion) MUST live in one source of truth and flow into Nuxt UI via `app.config.ts` and theme CSS.
- **FR-005**: The webfonts chosen in the new direction MUST actually be loaded (self-hosted or via the font module), with fallbacks; declared-but-unloaded fonts are not acceptable.
- **FR-006**: Stale color definitions (unused gold palette in `tailwind.config.js`, commented values, hard-coded color pairs that bypass tokens) MUST be removed or migrated to tokens.
- **FR-007**: Public pages MUST be designed mobile-first and verified at 375px, 768px and 1280px.
- **FR-008**: Meaning MUST NOT be conveyed by color alone (results, statuses, errors); text contrast MUST meet WCAG AA.
- **FR-009**: Every interactive element MUST have visible focus, keyboard access, and designed hover, active, disabled and loading states.
- **FR-010**: Motion MUST be purposeful and respect reduced-motion preferences.
- **FR-011**: The redesign MUST be delivered in stages (system, public pages, authenticated and admin pages, polish) so each stage can be merged and reviewed independently.
- **FR-012**: The final `DESIGN.md` and `.impeccable/design.json` MUST be regenerated from the shipped UI.
- **FR-013**: Existing automated tests MUST pass at the end of each stage.
- **FR-014**: The redesign MUST include a player card component inspired by the reference in `private/design/PlayerCardFifa.vue`, used for roster and profile surfaces; structure and feel are borrowed, not copied.
- **FR-015**: The player card MUST show only real data: photo, jersey number, position (with its Spanish name), name or nickname, club crest, and career stats (appearances, goals, assists, yellow and red cards). It MUST NOT show invented ratings, nationality or other fields the app does not hold.
- **FR-016**: The card MUST have designed fallbacks for missing photo, number, position, nickname and stats, and MUST truncate long names without breaking layout.
- **FR-017**: The card's layout MUST leave room for a future overall rating and ability stats without a redesign.
- **FR-018**: The card MUST NOT use the reference's third-party assets (hotlinked background, flags, player images, fonts) or any video-game brand marks; its artwork, crest and fonts MUST be the club's own or properly licensed and self-hosted. The reference's license and origin MUST be checked before any of its code or art is reused.
- **FR-019**: The card MUST work as a plain accessible link (keyboard focus, readable name and position for screen readers, contrast AA) and MUST NOT rely on color or decoration to convey stat meaning.
- **FR-020**: The in-app game signup call to action MUST NOT appear on public pages in this redesign. The feature is unfinished and the club confirms attendance through WhatsApp today. Existing signup routes, data and code are left intact.
- **FR-021**: The public home MUST reserve a designed, hidden-by-default call-to-action slot (placement, size, states, copy hook) behind a single switch, so signup can be enabled later without redesigning the surface.

### Key Entities

- **Product context (`PRODUCT.md`)**: Audiences, brand personality, anti-references, accessibility needs. Product truth only.
- **Design system (`DESIGN.md` + `.impeccable/design.json`)**: The chosen visual world, tokens, components and rules.
- **Player card**: A compact portrait-format card for one player combining identity (photo, name, number, position, club crest) and a stat grid. Data source: existing player and career-stats fields; ratings are a future extension.
- **Surface brief**: Per-surface intent (public home, roster, schedule, game, stats, admin, auth) naming its mode (persuade, operate, read, experience).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of public and admin routes render with the new design system and no leftover old-look components.
- **SC-002**: Zero critical findings remain in the Impeccable audit; text contrast meets AA on every page.
- **SC-003**: No page has horizontal scroll or clipped content at 375px, 768px and 1280px.
- **SC-004**: All existing unit and Playwright tests pass, with test changes limited to markup-driven selector updates.
- **SC-005**: Number of distinct hard-coded color values outside the token files drops to zero.
- **SC-007**: The player card renders correctly for 100% of roster players, including those with missing photo, number, position, nickname or stats, with zero fabricated values.
- **SC-006**: A player can find the next game's rival, date, time and venue, and open any teammate's card, from the public home in two taps or fewer on a phone.
- **SC-008**: Adding a signup call to action to the home later requires only enabling a reserved slot, with no layout rework (verified by rendering the slot in a test state).

## Assumptions

- The Nuxt UI and Tailwind v4 stack from spec 020 stays; this is a visual redesign, not a framework change.
- `packages/frontend` is the only UI app in scope; the other workspaces have no UI.
- The maintainer is the decision-maker for the direction and approves it before surface work begins.
- The card reference file is untracked (`private/` is gitignored) and built from third-party assets; it is design inspiration only. Its gold-on-dark game-card look is not assumed to be the new visual world; the card adapts to whichever world User Story 2 selects.
- The card's real crest depends on the maintainer supplying the club logo (see `PRODUCT.md`); the "M" monogram is the placeholder until then.
- Whether the card is also offered as a shareable image is out of scope for now.
- The new direction may or may not keep the blue brand color; that is decided in User Story 2.
- Game signup is deliberately deferred: the club signs up by WhatsApp message, adoption would take time, and the feature is incomplete. This redesign prepares a slot for it but does not ship it.
- Dark mode: resolved. The public sheet pages ship a negative-print dark theme (ink and paper swapped) with the `ColorModeToggle` in the header.
- Specs after 023 were renumbered forward by one (old 023-029 are now 024-030); this spec does not depend on them.
- `packages/frontend/DESIGN.md` and `.impeccable/` are currently uncommitted and should be committed as the baseline before the redesign replaces them.
