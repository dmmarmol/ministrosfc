# Tasks: User Promotion Governance

**Input**: Design documents from `/specs/016-user-promotion-governance/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are required for this feature (acceptance scenarios and success criteria require explicit verification for role/lifecycle governance and confirmation flows).

**Organization**: Tasks are grouped by user story to enable independent implementation and validation.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: User story label for story-phase tasks only (`[US1]`, `[US2]`, `[US3]`)
- Each task includes an exact file path.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Define shared cross-package contracts before backend/frontend implementation.

- [ ] T001 Add admin users governance DTOs for list/profile/role/lifecycle payloads in `packages/shared/src/types/api.ts`
- [ ] T002 Export admin users governance DTOs from `packages/shared/src/types/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish common backend and frontend governance primitives required by all stories.

**CRITICAL**: No user story implementation starts before this phase is complete.

- [ ] T003 Add reusable Zod validators for admin user profile, role change, and player-status payloads in `packages/cms/src/routes/users.ts`
- [ ] T004 [P] Add reusable governance helper functions (actor/target checks + transition helpers) in `packages/cms/src/services/UserService.ts`
- [ ] T005 [P] Add optimistic concurrency precondition handling (`expectedUpdatedAt`) for mutable admin-user operations in `packages/cms/src/services/UserService.ts`
- [ ] T006 Add shared confirmation-intent state and action descriptors used by admin users UI in `packages/frontend/src/components/admin/UserRoleManager.vue`

**Checkpoint**: Shared types, validation, governance helpers, and confirmation scaffolding are ready.

---

## Phase 3: User Story 1 - Admin/Editor User Directory Management (Priority: P1) 🎯 MVP

**Goal**: Admin and Editor can access admin users list and edit first name/last name/email from full-name interaction.

**Independent Test**: Authenticate as Admin and Editor, open `/admin/users`, edit profile fields from full-name entry point, and verify persistence + feedback.

### Tests for User Story 1 (write first, ensure failing before implementation)

- [ ] T007 [P] [US1] Add integration tests for Editor+ list access and profile edit authorization in `packages/cms/tests/integration/role-management.test.ts`
- [ ] T008 [P] [US1] Add unit tests for full-name click edit entry and profile save feedback in `packages/frontend/tests/unit/admin-users.test.ts`
- [ ] T008A [US1] Add unit/integration test for UI-level access control: unauthorized user (non-Admin/Editor) is denied access to admin/users page (UI + API).

### Implementation for User Story 1

- [ ] T009 [US1] Update Editor+ authorization and query handling for `GET /api/v1/admin/users` in `packages/cms/src/routes/users.ts`
- [ ] T010 [US1] Implement `updateAdminUserProfile` (trim/format/unique email + stale-write conflict) in `packages/cms/src/services/UserService.ts`
- [ ] T011 [US1] Implement `PATCH /api/v1/admin/users/:id` route with validation and error mapping in `packages/cms/src/routes/users.ts`
- [ ] T012 [US1] Replace local admin-user interfaces with shared admin-users DTO imports in `packages/frontend/src/components/admin/UserRoleManager.vue`
- [ ] T013 [US1] Implement full-name interaction to enter profile edit mode and submit save flow in `packages/frontend/src/components/admin/UserRoleManager.vue`. Email changes require ConfirmationModal (critical edit per FR-015). First/last name changes use inline save without confirmation (non-critical).
- [ ] T014 [US1] Ensure admin users page wiring and role-gated access behavior in `packages/frontend/src/pages/admin/users/index.vue`
- [ ] T014A [US1] Implement and test explicit UI feedback for all admin/users actions (success/error toasts, banners, or dialogs).

**Checkpoint**: US1 is independently functional and testable.

---

## Phase 4: User Story 2 - Role Promotion/Demotion Governance (Priority: P1)

**Goal**: Role transitions follow Admin/Editor/DT/Player policy with server-side enforcement and confirmation-gated UX.

**Independent Test**: Execute allowed and denied role change attempts as Admin, Editor, DT, and Player; verify policy-consistent outcomes and feedback.

### Tests for User Story 2 (write first, ensure failing before implementation)

- [ ] T015 [P] [US2] Extend integration role-matrix tests (allowed, denied, idempotent, stale update conflict) in `packages/cms/tests/integration/role-management.test.ts`. MUST include test cases for: (1) Admin can demote another Admin to lower role, (2) Admin cannot demote themselves (403 error), (3) Admin can promote user to Admin role.
- [ ] T016 [P] [US2] Add frontend unit tests for role option visibility, confirmation gate, and forbidden feedback in `packages/frontend/tests/unit/admin-users.test.ts`. MUST include: (1) Admin sees all role options including Admin for other users, (2) Admin role dropdown is disabled for current user (self) with tooltip, (3) ConfirmationModal component appears for role changes with clear action descriptions, (4) Same-role changes (idempotent) skip confirmation modal, (5) Session expiry during confirmation triggers re-auth flow. Verify SC-003 compliance: confirmation required before any non-idempotent role mutation API call.
- [ ] T016A [US2] Add explicit test for unauthorized action denial (e.g., Editor delete denial, Player/DT promotion attempts) in both backend and frontend.

### Implementation for User Story 2

- [ ] T017 [US2] Finalize shared role-mutation request/response types used by API and UI in `packages/shared/src/types/api.ts`
- [ ] T018 [US2] Implement role governance matrix in `packages/cms/src/services/UserService.ts`. Admin full policy (can promote to any role including Admin, can demote other Admins to lower roles), Editor constrained promotions (only to Player/DT), DT/Player denied. Update governance functions: `canPromote()` and `canDemote()` to allow admin-to-admin transitions. Add early return for idempotent role changes (if currentRole === newRole, return 200 OK without DB write).
- [ ] T019 [US2] Enforce role endpoint authorization, payload validation, and conflict responses in `packages/cms/src/routes/users.ts`. MUST add self-demotion check: if `req.user.id === userId && newRole !== "ADMIN"`, return 403 Forbidden with error "Cannot demote yourself".
- [ ] T020 [US2] Wire confirmation modal before role change dispatch in `packages/frontend/src/components/admin/UserRoleManager.vue`. Update role select to: (1) Remove `v-if="user.role !== 'ADMIN'"` condition to show all roles for other users, (2) Add `:disabled="user.id === currentUser.id"` to prevent self-demotion in UI with tooltip "Cannot change your own role", (3) Skip confirmation modal if old role === new role (idempotent change), (4) Trigger confirmation modal on actual role change with clear action description "Change [user name]'s role from [old role] to [new role]?".
- [ ] T021 [US2] Add role mutation success/error UI feedback and list refresh logic in `packages/frontend/src/components/admin/UserRoleManager.vue`. On network error after confirmation: close modal, show error toast "Network error occurred. Please try again." with retry button, do not mutate local state. On 409 CONFLICT: show error "Another admin updated this user. Please refresh and try again." On success: show success toast, refresh user list.

**Checkpoint**: US2 policy behavior is enforced end-to-end and independently testable.

---

## Phase 5: User Story 3 - Player Lifecycle Actions with Confirmation (Priority: P2)

**Goal**: Admin/Editor can deactivate player-linked users with confirmation, while only Admin can delete linked user+player transactionally.

**Independent Test**: Verify confirm/cancel behavior for deactivate and delete, Editor delete denial, Admin transactional deletion, and no orphan integrity regressions.

### Tests for User Story 3 (write first, ensure failing before implementation)

- [ ] T022 [P] [US3] Extend lifecycle integration tests for player-status updates, Admin-only delete, and integrity guarantees in `packages/cms/tests/integration/role-management.test.ts`
- [ ] T023 [P] [US3] Add frontend unit tests for ALL sensitive lifecycle action confirmations (status toggle, user delete, player delete) and cancel no-op behavior in `packages/frontend/tests/unit/admin-users.test.ts`. Verify SC-003 compliance: every destructive action triggers ConfirmationModal before API call, cancel prevents mutation. Include test for session expiry during confirmation (401 triggers re-auth).

### Implementation for User Story 3

- [ ] T024 [US3] Finalize shared lifecycle DTOs for player-status update (deactivate/reactivate) and delete semantics in `packages/shared/src/types/api.ts`
- [ ] T025 [US3] Implement player-status update logic with linked-player existence checks in `packages/cms/src/services/UserService.ts`
- [ ] T026 [US3] Implement transactional delete of linked `User` + `Player` with referential-integrity safeguards in `packages/cms/src/services/UserService.ts`
- [ ] T027 [US3] Enforce authorization and error handling for `PATCH /:id/player-status` and `DELETE /:id/player` in `packages/cms/src/routes/users.ts`
- [ ] T028 [US3] Wire ConfirmationModal component for ALL sensitive lifecycle actions in `packages/frontend/src/components/admin/UserRoleManager.vue`: (1) player-status toggle (deactivate/reactivate) with message "Deactivate player [name]? This will prevent them from participating in new games.", (2) user deletion with message "Delete user [name]? This action cannot be undone.", (3) player deletion with message "Delete player [name]? This action cannot be undone.". Confirmation modal MUST be blocking, display clear action text with specific user/player names, and require explicit confirm/cancel buttons before API call. On network error after confirmation: close modal, show error toast "Network error occurred. Please try again." with retry button, do not mutate local state.
- [ ] T029 [US3] Update admin users page state handling for lifecycle mutation feedback and row updates/removal in `packages/frontend/src/pages/admin/users/index.vue`

**Checkpoint**: US3 lifecycle actions are independently functional and testable.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final alignment of tests and feature documentation across stories.

- [ ] T030 [P] Add regression coverage for duplicate-email profile edit and stale-write conflict messaging in `packages/cms/tests/integration/role-management.test.ts`
- [ ] T030A [P] Add end-to-end verification test for SC-003 compliance: ALL sensitive actions on /admin/users page (role changes, status toggles, user deletions, player deletions, critical edits) require ConfirmationModal before execution in `packages/frontend/tests/e2e/admin-flow.spec.ts` or equivalent E2E test file.
- [ ] T031 [P] Update implementation/verification runbook with final commands and manual checks in `specs/016-user-promotion-governance/quickstart.md`
- [ ] T032 Update API behavior notes to match implemented status/error outcomes in `specs/016-user-promotion-governance/contracts/admin-users-governance.md`
- [ ] T033 [Polish] Audit all legacy and new page files for `definePageMeta` compliance per Principle V (constitution) and document results.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: Starts immediately.
- **Phase 2 (Foundational)**: Depends on Phase 1 and blocks all user stories.
- **Phase 3 (US1)**: Depends on Phase 2.
- **Phase 4 (US2)**: Depends on Phase 2; may proceed in parallel with late US1 UI work after shared contracts are stable.
- **Phase 5 (US3)**: Depends on Phase 2 and should follow US2 backend governance updates.
- **Phase 6 (Polish)**: Depends on completion of US1, US2, and US3.

### User Story Dependencies

- **US1 (P1)**: No dependency on other user stories once foundational work is done.
- **US2 (P1)**: Independent of US1 business flow, but shares files and should merge after foundational + shared type baseline.
- **US3 (P2)**: Depends on role/lifecycle governance primitives from foundational phase and benefits from US2 error/confirmation patterns.

### Within Each User Story

- Tests first and failing before implementation.
- Backend service logic before route wiring.
- Shared types before frontend binding.
- Confirmation-gated UX before final feedback/refetch wiring.

### Parallel Opportunities

- **Foundational**: T004 and T005 can run in parallel after T003.
- **US1**: T007 and T008 in parallel; T012 and T014 can proceed in parallel after T011.
- **US2**: T015 and T016 in parallel; T020 and T021 can be split after T019.
- **US3**: T022 and T023 in parallel; T025 and T028 can proceed in parallel once T024 is complete.
- **Polish**: T030 and T031 in parallel.

---

## Parallel Example: User Story 1

```bash
# Tests in parallel
T007
T008

# Frontend follow-up in parallel after backend profile endpoint is ready
T012
T014
```

## Parallel Example: User Story 2

```bash
# Tests in parallel
T015
T016

# UI wiring split in parallel after route/service role enforcement
T020
T021
```

## Parallel Example: User Story 3

```bash
# Tests in parallel
T022
T023

# Backend + frontend implementation overlap after shared lifecycle DTOs
T025
T028
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2.
2. Deliver US1 (Phase 3) end-to-end.
3. Validate US1 independently before moving forward.

### Incremental Delivery

1. Ship US1 directory access/editing.
2. Add US2 role governance with policy enforcement.
3. Add US3 lifecycle actions with transactional delete and confirmation guarantees.
4. Finish with polish/docs alignment.

### Parallel Team Strategy

1. Pair on Phase 1-2 to stabilize contracts and governance helpers.
2. Split US1 backend/frontend tasks once foundational checkpoint is met.
3. Split US2 and US3 across backend/frontend owners while sharing test updates in `role-management.test.ts` and `admin-users.test.ts`.

---

## Notes

- `[P]` means no unmet dependency and low file conflict risk.
- Story labels appear only on user-story phase tasks.
- Every task references an explicit path and is executable by an implementation agent without extra context.
