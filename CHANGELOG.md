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

### Fixed

- Deployments with Redis disabled (local development and the DEV apps) now keep refresh tokens in an in-process store, so a signed-in session can be renewed instead of failing after the access token expires.

### Changed

- `deploy.yml` comment now describes the last-successful-run diff base accurately (spec 022 follow-up).

---

## [0.15.0] — 2026-11-23

### Summary

Minor release implementing spec 022 (first production release): a merge to `main` now deploys production automatically with tests, migrations, health checks and automatic rollback; the CMS and frontend ship separately; and the changes that were exhausting the free database allowance are fixed. Production owner-run bootstrap steps are documented in `docs/guides/DEPLOYMENT.md`.

### Changed

- Production deploys on merge to `main` (DEV on `develop`) instead of on a published release; the CI workflows are test-only and reusable, and workflows use least-privilege permissions and a pinned `flyctl` action.
- `/api/v1/health` is dependency-free; game statuses sync at startup and, throttled, when games are read, instead of every 5 minutes, so an idle environment no longer wakes the database.
- Photo storage (Cloudinary) is optional at launch, DEV runs without Redis (`REDIS_DISABLED`), and production requires `APP_ENV=production`, Redis and HTTPS CORS origins.
- Public pages are cached for 5 minutes in production builds; DEV blocks crawlers, abusive crawler user agents are refused and SSR requests are rate limited per IP.
- Nuxt UI built-in texts, such as empty tables, are shown in Spanish.

### Added

- `Deploy` workflow with per-app deployment measured from the last successful run, smoke tests, queueing per environment and automatic rollback; `Rollback` workflow and `scripts/deploy/` helpers.
- Per-environment Fly config (`fly.development.toml`, `fly.production.toml`) for both apps, with scale to zero, liveness checks and migrations over the direct database URL.
- `GET /api/v1/health/ready` (database and Redis, cached 30 s) and `GET /api/v1/config` (capability flags such as `photoUploadsEnabled`).
- Environment-aware `robots.txt`, `X-Robots-Tag: noindex` outside production and `useCmsCapabilities` in the admin player form.
- Deployment runbook (`docs/guides/DEPLOYMENT.md`) with secrets matrix, owner bootstrap, rollback and troubleshooting; spec 022 documents.

### Fixed

- Both container images no longer copy `.env*` files; a test guards it.
- The "Reset CMS Database" workflow can no longer target production, and seeding the production admin needs a typed confirmation.

### Removed

- The shared `fly.toml` files and the release-triggered production deploy path.

## [0.14.0] — 2026-11-23

### Added

- **spec 022 — First production release and automated production deployment**: specification for the first production launch (empty database plus admin, data loaded later through the administrator CSV import; photo upload deferred), merge-to-`main` production deployment with health checks and rollback, reproducible environments and secrets documentation, protection of production from destructive workflows, and bounding database compute usage (idle wake-ups and non-human traffic). Specification only; implementation follows in later releases.

### Changed

- Renumbered the spec folders `022`–`029` to `023`–`030` to make room for spec 022.

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
