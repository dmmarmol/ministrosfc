# Implementation Plan: User Promotion Governance

**Branch**: `chore/016-user-promotion-governance` | **Date**: 2026-04-13 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/016-user-promotion-governance/spec.md`

## Summary

Deliver governance-complete admin user management by extending existing `/api/v1/admin/users` flows and admin UI so Editor can manage user directory and constrained promotions, Admin retains full authority (including role demotions of other admins and deletions), all sensitive mutations require explicit ConfirmationModal confirmation, self-demotion is prevented at UI and backend levels, and role/lifecycle rules are enforced consistently across API, frontend, and tests.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 18+), Vue 3, Nuxt 3  
**Primary Dependencies**: Express, Prisma ORM, Zod, Nuxt composables/runtime, Vitest, Jest + Supertest  
**Storage**: PostgreSQL via Prisma  
**Testing**: CMS integration tests (Jest/Supertest), frontend unit/component tests (Vitest + Vue Test Utils)  
**Target Platform**: Web admin panel + CMS API  
**Project Type**: Monorepo web app (`packages/cms`, `packages/frontend`, `packages/shared`)  
**Performance Goals**: admin user list and mutation endpoints maintain existing interactive behavior (p95 < 500ms under normal admin load)  
**Constraints**: Preserve referential integrity across `User` <-> `Player` <-> `GameParticipant`; no unauthorized role escalation; admin can demote other admins but not themselves; all sensitive actions (role changes, status toggles, deletions, critical edits) require ConfirmationModal component with explicit confirm/cancel; role dropdown disabled for admin's own user record  
**Scale/Scope**: Team-level directory (tens to low hundreds of users), 1 admin page + users API/service + shared types + targeted test suite updates

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Shared types gate (Principle VII)**: New admin-users response and mutation payload/response types are cross-package (`cms` + `frontend`) and will be added to `packages/shared/src/types/api.ts` and exported through `@ministrosfc/shared`.
- [x] **Page decomposition gate (Principle V)**: No new page file is added; existing `pages/admin/users/index.vue` remains routing entry and feature UI stays in extracted component(s). If complexity grows, split current `UserRoleManager` into page-scoped sub-components under `components/pages/admin/users/`.
- [x] **Page meta declaration gate (Principle V)**: No new `pages/` file introduced. Existing `pages/admin/users/index.vue` already declares `definePageMeta({ layout: "admin", middleware: "auth", requiresAuth: true, requiresRole: "editor" })`.

## Project Structure

### Documentation (this feature)

```text
specs/016-user-promotion-governance/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── admin-users-governance.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/cms/
├── src/
│   ├── routes/users.ts
│   ├── services/UserService.ts
│   └── middleware/rbac.ts
└── tests/integration/role-management.test.ts

packages/frontend/
├── src/
│   ├── pages/admin/users/index.vue
│   ├── components/admin/UserRoleManager.vue
│   └── components/ui/ConfirmationModal.vue
└── tests/unit/admin-users.test.ts

packages/shared/
└── src/types/
    ├── api.ts
    └── index.ts
```

**Structure Decision**: Keep implementation inside existing admin-users vertical slice; no new service boundary or package introduced.

## Phase 0: Research Output

See [research.md](./research.md) for resolved decisions on role-governance rules, delete semantics, confirmation strategy, shared-type contract shape, and deterministic concurrent update handling.

## Phase 1: Design Output

- [data-model.md](./data-model.md): user governance entities, constraints, and state transitions
- [contracts/admin-users-governance.md](./contracts/admin-users-governance.md): API/interface contract for listing, profile edit, role mutation, lifecycle actions
- [quickstart.md](./quickstart.md): implementation runbook and verification commands

## Constitution Check (Post-Design)

- [x] **Shared types gate (Principle VII)**: Design explicitly introduces shared DTOs for admin-users API instead of frontend-local interfaces.
- [x] **Page decomposition gate (Principle V)**: Design keeps page entry thin and confirms component-level UX work in `UserRoleManager`/page-scoped sub-components.
- [x] **Page meta declaration gate (Principle V)**: No new page files; existing page meta remains compliant.

## Parallel Example: User Story 1

Implementation Strategy
MVP First (US1 only)
Complete Phase 1 and Phase 2.
Deliver US1 (Phase 3) end-to-end.
Validate US1 independently before moving forward.
Incremental Delivery
Ship US1 directory access/editing.
Add US2 role governance with policy enforcement.
Add US3 lifecycle actions with transactional delete and confirmation guarantees.
Finish with polish/docs alignment.
Parallel Team Strategy
Pair on Phase 1-2 to stabilize contracts and governance helpers.
Split US1 backend/frontend tasks once foundational checkpoint is met.
Split US2 and US3 across backend/frontend owners while sharing test updates in role-management.test.ts and admin-users.test.ts.
Constitution Audit
All legacy and new page files must be audited for definePageMeta compliance per Principle V. See T033 in tasks.md for the required audit and documentation step.

Notes
[P] means no unmet dependency and low file conflict risk.
Story labels appear only on user-story phase tasks.
Every task references an explicit path and is executable by an implementation agent without extra context.

## Implementation Notes

### Admin Demotion Requirements (New Scope)

**Backend Changes:**

- Update `UserService` governance functions (`canPromote`, `canDemote`) to allow admin→admin and admin→lower role transitions
- Add `isRoleChangeAllowed(actorId, targetId, newRole)` helper that checks: actor is admin, target is not actor (self-demotion prevention)
- Update `PATCH /api/v1/admin/users/:id` route to validate `req.user.id !== userId` when changing roles, returning 403 with "Cannot demote yourself" if violated
- Add validation: if target role = current role, skip mutation (idempotent, no confirmation needed)

**Frontend Changes:**

- Update `UserRoleManager.vue` to remove admin role restriction from dropdown (`v-if="user.role !== 'ADMIN'"` removal)
- Add `:disabled="user.id === currentUser.id"` to role select element for self-demotion prevention at UI level
- Add tooltip "Cannot change your own role" for disabled dropdown (secondary affordance)
- Wire ConfirmationModal for ALL sensitive actions with clear messaging:
  - Role changes (non-idempotent): "Change [user name]'s role from [old role] to [new role]?"
  - Status toggle: "Deactivate player [player name]? This will prevent them from participating in new games."
  - User deletion: "Delete user [user name] and player [player name]? This action cannot be undone."
  - Player deletion: equivalent messaging
  - Email changes: "Change [user name]'s email from [old] to [new]? This affects their login credentials."
- Skip confirmation modal for idempotent changes (same role → same role)
- Pass clear action descriptions to modal with user/player names
- Block action execution until modal confirms or cancels
- On network error: close modal, show error toast "Network error occurred. Please try again." with retry button
- On 409 CONFLICT: show error "Another admin updated this user. Please refresh and try again."

**Test Updates:**

- `role-management.test.ts`: Add test cases for admin→admin demotion (200 success), admin self-demotion (403 forbidden)
- `admin-users.test.ts`: Add component tests for disabled role dropdown on current user, confirmation modal triggers for all actions
- E2E tests: Verify confirmation flow for role changes, verify self-demotion prevention

### Key Decision Points

1. **Self-Demotion Prevention Strategy**: Dual-layer prevention (UI disabled dropdown with tooltip + backend validation) ensures security even if client-side controls are bypassed
2. **Confirmation Modal Reuse**: Existing ConfirmationModal component pattern extended to all sensitive actions (except idempotent changes) for consistency
3. **Idempotent Role Changes**: Same-role changes skip confirmation and DB write for better UX (return 200 OK immediately)
4. **Critical vs. Non-Critical Edits**: Email changes require confirmation (affect login identity); name changes use inline save
5. **Concurrent Update Strategy**: Optimistic locking via `expectedUpdatedAt` prevents silent overwrites; second writer gets 409 CONFLICT and must retry
6. **Error Messaging**: "Cannot demote yourself" provided at both UI interaction layer (disabled dropdown with tooltip) and API response (403 error)

## Complexity Tracking

No constitution violations requiring justification.
