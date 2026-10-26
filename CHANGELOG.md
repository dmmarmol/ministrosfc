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
