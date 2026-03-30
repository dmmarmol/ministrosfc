# Tasks: User-to-Player Promotion & Guest Merge

**Input**: Design documents from `/specs/013-user-player-promotion/`  
**Prerequisites**: plan.md, spec.md, research.md

**Tests**: Included, because the feature spec explicitly defines unit, integration, and E2E test strategy.

**Organization**: Tasks are grouped by user story so each increment is independently implementable and testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on incomplete tasks)
- **[Story]**: User story label (`[US1]` for this feature)
- All tasks include explicit file paths

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare schema and project scaffolding for minimal audit rollout (Choice A)

- [ ] T001 Add minimal audit fields (`createdBy`, `updatedBy`) to `Player` and `GameParticipant` in `packages/cms/prisma/schema.prisma`
- [ ] T002 Generate and review Prisma migration for audit fields in `packages/cms/prisma/migrations/*/migration.sql`
- [ ] T003 Regenerate Prisma client after schema update in `packages/cms/prisma/schema.prisma`
- [ ] T004 [P] Add new error codes for promotion/merge conflicts in `packages/cms/src/utils/error-codes.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core backend plumbing required before implementing story behavior

**CRITICAL**: No user story task should start until this phase is complete

- [ ] T005 Create promotion/merge service skeleton in `packages/cms/src/services/PromotionService.ts`
- [ ] T006 [P] Add Zod request schemas for promotion and merge payloads in `packages/cms/src/routes/users.ts`
- [ ] T007 Create admin players routes for merge endpoints in `packages/cms/src/routes/admin-players.ts`
- [ ] T008 Wire admin players routes into app router in `packages/cms/src/config/server.ts`
- [ ] T009 [P] Add request/response type contracts for promotion/merge UI in `packages/frontend/src/types/promotion.ts`
- [ ] T010 Create frontend composables for promotion and merge API calls in `packages/frontend/src/composables/usePromotion.ts`

**Checkpoint**: Foundations ready for user story implementation

---

## Phase 3: User Story 1 - Admin/Editor Promote Themselves and Merge Guests (Priority: P2)

**Goal**: Admin/editor users can become players and merge guest history into registered users without data loss.

**Independent Test**: Admin/editor promotes self from profile, appears as registered player, confirms game participation, then merges a guest into a user and sees migrated game history.

### Tests for User Story 1

- [ ] T011 [P] [US1] Add unit tests for `promoteUserToPlayer` validation and role rules in `packages/cms/tests/unit/PromotionService.test.ts`
- [ ] T012 [P] [US1] Add unit tests for `mergeGuestToUser` atomic/idempotent behavior in `packages/cms/tests/unit/PromotionService.test.ts`
- [ ] T013 [P] [US1] Add integration test for `GET/POST /api/v1/admin/users/:id/(promotion-status|promote-to-player)` in `packages/cms/tests/integration/user-player-promotion.test.ts`
- [ ] T014 [P] [US1] Add integration test for `GET /api/v1/admin/players/merge-candidates` and `POST /api/v1/admin/players/:guestPlayerId/merge-into-user` in `packages/cms/tests/integration/guest-merge.test.ts`
- [ ] T015 [P] [US1] Add frontend E2E spec for admin self-promotion flow in `packages/frontend/tests/e2e/admin-player-promotion.spec.ts`
- [ ] T016 [P] [US1] Add frontend E2E spec for guest-to-user merge flow in `packages/frontend/tests/e2e/admin-guest-merge.spec.ts`

### Implementation for User Story 1

- [ ] T017 [US1] Implement `promoteUserToPlayer` transactional logic with jersey validation in `packages/cms/src/services/PromotionService.ts`
- [ ] T018 [US1] Implement `mergeGuestToUser` transactional logic with state-based idempotency in `packages/cms/src/services/PromotionService.ts`
- [ ] T019 [US1] Persist audit actor fields on promotion writes (`createdBy`, `updatedBy`) in `packages/cms/src/services/PromotionService.ts`
- [ ] T020 [US1] Persist audit actor fields on merge writes (new player, participant reassignment, guest deactivation) in `packages/cms/src/services/PromotionService.ts`
- [ ] T021 [US1] Implement `GET /api/v1/admin/users/:id/promotion-status` and `POST /api/v1/admin/users/:id/promote-to-player` endpoints in `packages/cms/src/routes/users.ts`
- [ ] T022 [US1] Implement `GET /api/v1/admin/players/merge-candidates` and `POST /api/v1/admin/players/:guestPlayerId/merge-into-user` endpoints in `packages/cms/src/routes/admin-players.ts`
- [ ] T023 [US1] Enforce Editor+ access (`authenticate + requireRole("EDITOR")`) on promotion/merge endpoints in `packages/cms/src/routes/users.ts`
- [ ] T024 [US1] Enforce Editor+ access on merge endpoints in `packages/cms/src/routes/admin-players.ts`
- [ ] T025 [P] [US1] Add admin profile page section for self-promotion entrypoint in `packages/frontend/src/pages/admin/profile.vue`
- [ ] T026 [P] [US1] Create promotion form modal component with field-level validation in `packages/frontend/src/components/admin/PromotionForm.vue`
- [ ] T027 [P] [US1] Create guest merge modal with candidate/user selectors and confirmation UX in `packages/frontend/src/components/admin/MergeGuestModal.vue`
- [ ] T028 [US1] Add guest merge page with search and results table in `packages/frontend/src/pages/admin/players/merge.vue`
- [ ] T029 [US1] Integrate promotion action and optimistic UI state in `packages/frontend/src/pages/admin/profile.vue`
- [ ] T030 [US1] Integrate merge actions and status feedback in `packages/frontend/src/pages/admin/players/merge.vue`
- [ ] T031 [US1] Show merged historical appearances in player profile response mapping in `packages/cms/src/services/ProfileService.ts`
- [ ] T032 [US1] Update player participation guest creation to support future merge tracing metadata in `packages/cms/src/models/GameParticipant.ts`

**Checkpoint**: User Story 1 should be fully functional and independently testable

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Stabilization, documentation, and final quality checks

- [ ] T033 [P] Update API usage documentation for promotion/merge endpoints in `docs/guides/IMPLEMENTATION_CHECKLIST.md`
- [ ] T034 [P] Document minimal audit rollout decision (Choice A) in `specs/013-user-player-promotion/plan.md`
- [ ] T035 Run targeted backend tests for promotion/merge changes in `packages/cms/tests/integration/user-player-promotion.test.ts`
- [ ] T036 Run targeted frontend E2E tests for promotion/merge UI in `packages/frontend/tests/e2e/admin-player-promotion.spec.ts`
- [ ] T037 Execute quickstart-style manual validation steps and record outcomes in `specs/013-user-player-promotion/research.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: starts immediately
- **Phase 2 (Foundational)**: depends on Phase 1 completion and blocks all story tasks
- **Phase 3 (US1)**: depends on Phase 2 completion
- **Phase 4 (Polish)**: depends on Phase 3 completion

### User Story Dependencies

- **US1**: no dependency on other stories in this feature

### Within User Story 1

- Tests (T011-T016) should be authored before implementation and fail first
- Service logic (T017-T020) before route wiring (T021-T024)
- Backend endpoints before frontend integration (T025-T030)
- Profile/participant integration tasks (T031-T032) after core merge logic

---

## Parallel Opportunities

- Setup parallelizable: T004
- Foundational parallelizable: T006, T009
- US1 tests parallelizable: T011, T012, T013, T014, T015, T016
- US1 UI components parallelizable: T025, T026, T027
- Polish parallelizable: T033, T034

---

## Parallel Example: User Story 1

```bash
# Parallel test authoring
T011 + T012 + T013 + T014 + T015 + T016

# Parallel UI work after backend contracts are stable
T025 + T026 + T027
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Setup and Foundational phases
2. Implement backend promotion/merge transactions and secured routes
3. Add minimal admin UI for promotion + merge flows
4. Validate US1 independently with integration + E2E tests

### Incremental Delivery

1. Deliver backend endpoints first (usable via API clients)
2. Deliver admin profile promotion UI
3. Deliver guest merge UI
4. Apply polish and docs updates
