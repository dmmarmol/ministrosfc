# Quickstart: User Promotion Governance

## Goal

Implement governance-complete admin user management for listing/editing users, controlled role transitions (including admin demotion with self-demotion prevention), player deactivate/delete actions, and mandatory ConfirmationModal UX for all sensitive operations.

## Prerequisites

- Branch: `chore/016-user-promotion-governance`
- Running local DB and API dependencies
- Seed/test users with roles `ADMIN`, `EDITOR`, `DT`, `PLAYER`

## Implementation Steps

1. Backend authorization and route coverage

- Update `packages/cms/src/routes/users.ts`:
  - Allow Editor+ on list endpoint.
  - Add `PATCH /:id` for firstName/lastName/email edits.
  - Keep role/status/delete endpoints; wire enhanced validation and role matrix enforcement.

2. Service-layer governance rules

- Update `packages/cms/src/services/UserService.ts`:
  - Implement `updateAdminUserProfile(...)` with uniqueness and format checks.
  - Extend `changeRole(...)` to support Admin full authority (promote to admin, demote from admin) + constrained Editor governance.
  - Add `isRoleChangeAllowed(actorId, targetId, newRole)` helper that prevents self-demotion (actorId === targetId check).
  - Make delete flow transactional and delete both user + linked player.
  - Add deterministic stale-write detection (using `updatedAt` precondition).

3. Shared contract types

- Add/update shared DTOs in:
  - `packages/shared/src/types/api.ts`
  - `packages/shared/src/types/index.ts`
- Replace frontend-local admin user interfaces with imports from `@ministrosfc/shared`.

4. Frontend admin users UX

- Update `packages/frontend/src/components/admin/UserRoleManager.vue`:
  - Remove admin role restriction from dropdown (`v-if="user.role !== 'ADMIN'"` removal).
  - Add `:disabled="user.id === currentUser.id"` to role dropdown to prevent self-demotion at UI level.
  - Full-name click enters edit mode (no separate edit button).
  - ConfirmationModal component integration for ALL sensitive actions: role changes, status toggles, user/player deletions, critical edits.
  - Modal messages clearly describe action and target (e.g., "Change Alice's role from ADMIN to USER?").
  - Show success/error feedback for each mutation.
  - Respect actor permissions in UI affordances (while keeping backend as authority).

5. Tests

- Update/add CMS integration tests:
  - `packages/cms/tests/integration/role-management.test.ts`
  - Cover Editor allowed/denied role transitions, profile edit, and delete semantics.
  - Add test: Admin can demote another Admin to lower role (200 success).
  - Add test: Admin cannot demote themselves (403 with "Cannot demote yourself" error).
- Update/add frontend unit tests:
  - `packages/frontend/tests/unit/admin-users.test.ts`
  - Cover full-name edit trigger and confirmation-gated mutation calls.
  - Test: Role dropdown disabled when viewing own user record.
  - Test: All sensitive actions trigger ConfirmationModal before execution.

## Validation Commands

Run CMS tests:

```bash
cd packages/cms && npx jest tests/integration/role-management.test.ts --testTimeout=30000
```

Run frontend unit tests:

```bash
cd packages/frontend && npx vitest run tests/unit/admin-users.test.ts
```

Optional full package runs:

```bash
npm test --workspace=@ministrosfc/cms
cd packages/frontend && npx vitest run
```

## Implementation Status (as of 2026-04-15)

### Backend (packages/cms) — ✅ Complete

- `UserService.ts`: `updateAdminUserProfile`, `changeRole` (self-demotion prevention, idempotent), `updatePlayerStatus`, `deletePlayer` (transactional), optimistic concurrency (`expectedUpdatedAt`)
- `routes/users.ts`: GET `/`, PATCH `/:id`, PATCH `/:id/role`, PATCH `/:id/player-status`, DELETE `/:id/player`
- Integration tests: 31/31 passing (T007, T015, T022, T030)

### Shared types (packages/shared) — ✅ Complete

- `AdminUserListItem`, `AdminUserListResponse`, `AdminUserProfilePayload`, `AdminUserRoleChangePayload`, `AdminUserPlayerStatusPayload`, `AdminUserDeleteResponse`

### Frontend (packages/frontend) — ✅ Complete

- `UserRoleManager.vue`: Full-name click edit, email confirmation modal, first/last name inline save, role change confirmation, status toggle confirmation, delete confirmation, self-demotion UI prevention, success/error toasts
- `pages/admin/users/index.vue`: Thin wrapper, lifecycle feedback delegated to component
- `components/ui/BackButton.vue`: Reusable accessible back button with `to` and `label` props
- `pages/login.vue`: Back button → `/` (public site)
- `pages/auth/onboarding.vue`: Back button → `/login` (preserves and validates `redirect` param to prevent open redirect)
- `middleware/auth.ts`: Redirects unauthenticated users to `/login?redirect=<original>` and users needing onboarding to `/auth/onboarding?redirect=<original>`
- Unit tests: 33/33 passing (T008, T008A, T016, T016A, T023); 13/13 passing (T034–T039 auth navigation)

## US4 Verification

```bash
# Unit tests
cd packages/frontend && npx vitest run tests/unit/auth-navigation.test.ts
```

Manual checks:

- Visit `/login` — a back button "Volver al sitio" appears, clicking it navigates to `/`
- Visit `/auth/onboarding` — a back button "Volver" appears, clicking it navigates to `/login`
- Visit a protected page while unauthenticated — redirected to `/login?redirect=<page>`, after login → redirects back to original page
- Attempt an open redirect via `?redirect=https://evil.com` on onboarding — falls back to `/login` (external URLs blocked)

**Note on T041B (terminology standardization)**: The codebase uses `redirect` as the query param name consistently across all pages, middleware, and CMS redirect routes. Renaming to `return` would be an API surface change beyond this spec's scope and is deferred.

```

## Manual Verification Checklist

- Login as Editor and load `/admin/users` successfully.
- Edit first name/last name/email from full-name interaction and verify persisted update.
- As Editor, promote `PLAYER -> DT` succeeds with confirmation modal; demotion attempts fail.
- As Admin, demote another Admin to USER succeeds after confirmation; verify target loses admin privileges.
- As Admin viewing own user record, verify role dropdown is disabled (cannot select different role).
- As Admin, attempt self-demotion via API directly and verify 403 Forbidden with "Cannot demote yourself" error.
- As DT/PLAYER, role/status/delete actions are denied.
- Verify ALL sensitive actions (role change, status toggle, user delete, player delete) trigger ConfirmationModal before execution.
- Deactivate/reactivate linked player only after confirmation modal approval.
- Delete linked player user as Admin only and verify both records are removed after confirmation.

## definePageMeta Audit Results (T033)

**Audited**: 2026-04-15 — All 28 pages in `packages/frontend/src/pages/` declare `definePageMeta`. Constitution Principle V fully satisfied.

| Status       | Count |
| ------------ | ----- |
| ✅ Compliant | 28    |
| ❌ Missing   | 0     |

**US4 path discrepancy**: T036 references `pages/auth/index.vue` (route `/auth`), but the login page is at `pages/login.vue` (route `/login`). See T036 note in tasks.md before implementing US4.

---

## Done Criteria

- All FR-001..FR-018 covered by tests or explicit acceptance checks.
- Shared types used for all cross-package admin-users payloads/responses.
- No sensitive mutation can fire without confirmation in admin users UI.
- Role and lifecycle actions enforce actor/target policy in backend.
```
