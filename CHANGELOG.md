# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/) at the project level.

Per-package history is maintained in each package's own changelog:

- [`packages/cms/CHANGELOG.md`](packages/cms/CHANGELOG.md)
- [`packages/shared/CHANGELOG.md`](packages/shared/CHANGELOG.md)
- [`packages/frontend/CHANGELOG.md`](packages/frontend/CHANGELOG.md)

---

## [Unreleased]

---

## [0.13.0] - 2026-11-23

### Summary

Minor release delivering the spec 021 pre-release bugfixes: reliable game-save and returnUrl navigation, a clearer public roster, a legible dark mode with a toggle, Spanish API messages, and removal of the ambiguous "Temporada" competition type, plus several regressions found during browser QA.

### Changed

- Saving a game returns to a validated internal `returnUrl` (or `/admin/games`) and the games list refetches fresh data; admin back actions use a shared `BackButton`.
- Public roster search covers all registered players and switches the filter to "Todos"; status labels show above each card when "Todos" is selected.
- Dashboard "Partidos recientes" is a `UTable` whose edit action opens `/admin/games/:id`, and the dashboard now uses `useGames` and `usePlayers`.
- CMS API errors and validation messages are returned in Spanish.
- Dark mode is legible across public and admin pages and keeps the brand blue.

### Added

- Icon-only dark mode toggle in the public nav and admin header.
- Creating an opponent team from the game form restores the unfinished game and selects the new team.
- Shared `BackButton`, `returnUrl` resolver and `usePlayers` composable.
- Shared types: `PaginatedResponse`, `PlayerListQuery`, `GameListQuery`, `competitionTypeLabels`.
- `AGENTS.md` and Claude Code assets under `.claude/` (skills, spec-kit commands, subagents, rules), including a `create-pr` skill.
- `docs/guides/MANUAL_QA_CHROME.md`, a repeatable browser QA runbook.

### Fixed

- Editing a game shifted its date and time by the UTC offset on every save.
- Team, playground and tournament forms reloaded the page before the returnUrl redirect ran.
- The game form listed only the first 20 opponent teams.
- The dashboard recent-games table crashed when the list API returned no participants.
- Home hero overflowed horizontally at 320px.

### Removed

- `CompetitionType.SEASON` ("Temporada"); a migration converts existing games and tournaments to `LEAGUE`.

## [0.12.0] — 2026-05-03

### Added

- **spec 020 — Nuxt / UI / Tailwind upgrade**: Upgraded frontend to Nuxt 4.4.2, @nuxt/ui 4.7.1, and Tailwind CSS v4.2.4. New `theme.css` design-token system with `:root` / `[data-theme="dark"]` CSS variable pattern. Reusable `UButton`, `UiPositionSelect`, and `UiPlayerStatusSelect` shared select components. `PlayerForm` shared component for create and edit player pages. `LoadingOverlay` component.
- **spec 019 — Registration approval workflow**: New registrations are held in `PENDING_APPROVAL` state until an Admin or Editor reviews them. Reviewers can approve (with or without merging an existing orphan player) or deny (hard-deletes the user). Concurrent reviewer conflict is prevented via optimistic lock (409). Post-approval merge available from `/admin/users/{userId}` user edition screen. `NotificationSender` interface contract added for future email integration.
- **spec 019 — Admin pending-approvals UI**: New `/admin/users/pending-approvals` page with `PendingApprovalQueue`, `PendingApprovalReviewPanel`, and `UserEditorPanel` components. Orphan-player match suggestions ranked by name similarity + email score.

### Changed

- `AuthService.register` now returns `202 { status: "pending" }` with no JWT tokens instead of issuing tokens immediately.
- `AuthService.login` rejects pending users with `403 PENDING_APPROVAL`.

### Fixed

- Replaced `bcrypt` native addon with `bcryptjs` to resolve CI install hangs on ARM/musl targets.
