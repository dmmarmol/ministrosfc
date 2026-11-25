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
2. **Given** a completed and an upcoming game, **When** shown as cards, detail page or signup entry, **Then** result, status and signup call to action are clear without relying on color alone.
3. **Given** the statistics pages, **When** tables and filters render, **Then** they stay scannable and keep query-param filter behavior from spec 020.

---

### User Story 4 - Admin and authenticated flows are restyled for task completion (Priority: P2)

Admins, editors, DT and players using login, registration, signup, profile and admin screens get the new system applied with emphasis on speed and clarity rather than expression.

**Why this priority**: Operate-mode surfaces must stay consistent and efficient; they follow once the public system is proven.

**Independent Test**: Admin navigation, tables, forms, modals and toasts use the new tokens, and every existing admin task can still be completed.

**Acceptance Scenarios**:

1. **Given** the admin layout, **When** an admin navigates between games, players, teams, playgrounds, tournaments and users, **Then** navigation, active state and tables are consistent.
2. **Given** any form, modal or confirmation, **When** validation errors, loading or disabled states occur, **Then** each state is visibly designed in the new system.
3. **Given** login, registration and signup pages, **When** a user completes each flow, **Then** behavior (including `returnUrl` handling) is unchanged.

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

### Key Entities

- **Product context (`PRODUCT.md`)**: Audiences, brand personality, anti-references, accessibility needs. Product truth only.
- **Design system (`DESIGN.md` + `.impeccable/design.json`)**: The chosen visual world, tokens, components and rules.
- **Surface brief**: Per-surface intent (public home, roster, schedule, game, stats, admin, auth) naming its mode (persuade, operate, read, experience).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of public and admin routes render with the new design system and no leftover old-look components.
- **SC-002**: Zero critical findings remain in the Impeccable audit; text contrast meets AA on every page.
- **SC-003**: No page has horizontal scroll or clipped content at 375px, 768px and 1280px.
- **SC-004**: All existing unit and Playwright tests pass, with test changes limited to markup-driven selector updates.
- **SC-005**: Number of distinct hard-coded color values outside the token files drops to zero.
- **SC-006**: A player can find the next game and sign up from the public home in the same number of steps as today or fewer.

## Assumptions

- The Nuxt UI and Tailwind v4 stack from spec 020 stays; this is a visual redesign, not a framework change.
- `packages/frontend` is the only UI app in scope; the other workspaces have no UI.
- The maintainer is the decision-maker for the direction and approves it before surface work begins.
- The new direction may or may not keep the blue brand color; that is decided in User Story 2.
- Dark mode is out of scope unless the chosen direction explicitly includes it. [NEEDS CLARIFICATION: ship a dark theme with this redesign, or remove the dormant dark tokens?]
- Specs after 023 were renumbered forward by one (old 023-029 are now 024-030); this spec does not depend on them.
- `packages/frontend/DESIGN.md` and `.impeccable/` are currently uncommitted and should be committed as the baseline before the redesign replaces them.
