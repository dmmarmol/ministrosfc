# Tasks: Merge Related Users

**Input**: Design documents from `/specs/019-merge-related-users/`
**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅ quickstart.md ✅

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no incomplete dependencies in same phase)
- **[Story]**: Which user story this task belongs to
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish shared cross-package types before any implementation begins. Required by Constitution Principle VII — all types consumed by more than one package must land in `packages/shared` first.

- [ ] T001 Add `RegistrationStatus` (`PENDING_APPROVAL | APPROVED | DENIED`) and `ApprovalDecisionType` (`APPROVE_NO_MERGE | APPROVE_WITH_MERGE`) enums to `packages/shared/src/types/user.ts`
- [ ] T002 [P] Create `packages/shared/src/types/notification.ts` with `NotificationRecipient`, `NotificationSender`, and `NotificationSenderFactory` interfaces matching `contracts/notification-sender.md`
- [ ] T003 [P] Create `packages/shared/src/types/approval.ts` with `PendingApprovalQueueItem`, `RelatedPlayerSuggestion`, `OrphanPlayerItem`, and `MergeResolution` DTOs matching `contracts/approval-review-api.md`
- [ ] T004 Export all new types from `packages/shared/src/index.ts`

**Checkpoint**: Shared types compile and are importable from `@ministrosfc/shared`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Database schema, model layer, and auth-service changes that all user stories depend on. No story work can begin until this phase is complete.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Add `RegistrationStatus` enum and `registrationStatus RegistrationStatus @default(PENDING_APPROVAL)` field to `User` model in `packages/cms/prisma/schema.prisma`
- [ ] T006 Add `UserApprovalDecision` model (id, userId FK, reviewerId FK, decisionType, mergePlayerId, createdAt) to `packages/cms/prisma/schema.prisma`; expose API aliases `approvedBy` and `approvedAt` from reviewer/timestamp fields
- [ ] T007 Generate and apply Prisma migration for registration status and approval decision schema (`npx prisma migrate dev --name add-registration-approval`)
- [ ] T008 Update `UserModel.create` to accept and persist `registrationStatus`, defaulting to `PENDING_APPROVAL` in `packages/cms/src/models/User.ts`
- [ ] T009 [P] Add `UserModel.findPendingApprovals(options)` paginated query method in `packages/cms/src/models/User.ts`
- [ ] T010 [P] Add `PENDING_APPROVAL` error code to `packages/cms/src/utils/error-codes.ts`
- [ ] T011 Update `AuthService.register` to create user with `PENDING_APPROVAL` status and return `{ status: "pending", message: "..." }` without issuing JWT tokens in `packages/cms/src/services/AuthService.ts`
- [ ] T012 [P] Update `AuthService.login` to reject users with `registrationStatus=PENDING_APPROVAL` with `403 PENDING_APPROVAL` error in `packages/cms/src/services/AuthService.ts`

**Checkpoint**: Database migration passes, UserModel and AuthService changes compile with no TypeScript errors

---

## Phase 3: User Story 1 — Registration Waits for Approval (Priority: P1) 🎯 MVP Start

**Goal**: New sign-ups are persisted as `PENDING_APPROVAL`, receive no JWT tokens, and cannot access any approved-user routes until reviewed.

**Independent Test**: Register a new user; verify no access token is returned; attempt login and verify `403` with pending-approval message; check pending user appears in admin review queue.

### Implementation

- [ ] T014 [US1] [WRITE FIRST] Add register integration test asserting `202` response with pending status and no tokens in `packages/cms/tests/integration/auth-register.test.ts`
- [ ] T013 [US1] Update `POST /api/v1/auth/register` to return `202` with `{ status: "pending", message: "Tu cuenta está pendiente de aprobación" }` and no JWT in `packages/cms/src/routes/auth.ts`
- [ ] T015 [P] [US1] Add login integration test asserting `403 PENDING_APPROVAL` for registered-but-unreviewed users in `packages/cms/tests/integration/auth-login.test.ts`
- [ ] T016 [P] [US1] Create `PendingApprovalBanner` component showing pending-state message in `packages/frontend/src/components/pages/auth/PendingApprovalBanner.vue`
- [ ] T017 [US1] Update frontend registration result flow to show pending-state message (display `PendingApprovalBanner` on successful registration instead of redirecting to onboarding) in `packages/frontend/src/pages/register.vue`

**Checkpoint**: Registration returns pending response; login blocked for pending users; frontend shows pending message after sign-up

---

## Phase 4: User Story 2 — Admin/Editor Approves or Denies with Related-Match Review (Priority: P1)

**Goal**: Reviewers can see the pending queue with curated merge suggestions, search orphan players manually, and complete approve-without-merge or deny decisions with optimistic lock protection.

**Independent Test**: Create pending user and seeded orphan players; verify reviewer sees queue entry with ranked suggestions; approve without merge and verify `registrationStatus=APPROVED`; deny with reason and verify user is deleted with no rejected-application data retained.

### Implementation

- [ ] T018 [US2] Create `packages/cms/src/services/UserApprovalService.ts` with `matchOrphanPlayers(pendingUser)` method implementing two-step match: DB prefilter for orphan players (`user == null`) then application-side name-similarity + email ranking, excluding candidates with `matchScore < 0.30`
- [ ] T019 [P] [US2] Add `PlayerModel.findOrphans(options: { search?, page?, limit? })` method (players with no linked user) in `packages/cms/src/models/Player.ts`
- [ ] T020 [US2] Implement `UserApprovalService.getPendingApprovals(options)` that returns paginated pending users with top suggestions per entry (limit 5 suggestions per user) in `packages/cms/src/services/UserApprovalService.ts`
- [ ] T021 [US2] Implement `UserApprovalService.approveWithoutMerge(userId, reviewerId, expectedUpdatedAt)` in `packages/cms/src/services/UserApprovalService.ts`: set `registrationStatus=APPROVED`, write `UserApprovalDecision` record, enforce optimistic lock
- [ ] T022 [US2] Implement `UserApprovalService.deny(userId, reviewerId, reason, expectedUpdatedAt)` in `packages/cms/src/services/UserApprovalService.ts`: validate non-empty reason, then hard-delete user without persisting rejected-application data, enforce optimistic lock
- [ ] T024 [US2] [WRITE FIRST] Add integration tests for approval endpoints (queue list, orphan search, approve-no-merge, deny hard-delete with no retained rejected data, optimistic lock `409`) in `packages/cms/tests/integration/approval-queue.test.ts`
- [ ] T023 [US2] Add approval endpoints to `packages/cms/src/routes/users.ts`:
  - `GET /api/v1/admin/users/pending-approvals`
  - `GET /api/v1/admin/users/pending-approvals/:userId/orphan-players`
  - `POST /api/v1/admin/users/pending-approvals/:userId/approve`
  - `POST /api/v1/admin/users/pending-approvals/:userId/deny`
- [ ] T025 [P] [US2] Create `PendingApprovalQueue` table component (userId, name, email, date, top suggestion preview, action buttons) in `packages/frontend/src/components/pages/admin/users/PendingApprovalQueue.vue`; consume filter/query state provided by page-level `useQueryParams`
- [ ] T026 [P] [US2] Create `PendingApprovalReviewPanel` component (shows ranked suggestion list, orphan-player search input, approve/deny confirmation actions) in `packages/frontend/src/components/pages/admin/users/PendingApprovalReviewPanel.vue`; require explicit merge confirmation via `ConfirmationModal` and explicit deny confirmation warning that denied accounts are deleted permanently
- [ ] T027 [US2] Create `/admin/users/pending-approvals` page wiring `PendingApprovalQueue` and `PendingApprovalReviewPanel` in `packages/frontend/src/pages/admin/users/pending-approvals.vue` with `definePageMeta({ layout: "admin", middleware: "auth", requiresAuth: true, requiresRole: "editor" })`; all URL filter state (`search`, `page`, `limit`) must read/write through `useQueryParams`

**Checkpoint**: Full approve-without-merge and deny flows work end-to-end; deny flow confirms hard-delete with no retained rejected data; concurrent-reviewer `409` tested; frontend renders queue and allows decisions

---

## Phase 5: User Story 3 — Merged Identity Preserves Credentials and Player History (Priority: P2)

**Goal**: Approve-with-merge produces a single active user-player identity in one atomic transaction; user credentials prevail; player domain data is preserved; no duplicate active identities.

**Independent Test**: Approve pending user with merge target; reload user and verify `playerId` is linked; verify player record unchanged; verify no second active user record exists for same person.

### Implementation

- [ ] T030 [US3] [WRITE FIRST] Add integration tests for approve-merge: credentials preserved, player linked, `409` if player already linked or stale in `packages/cms/tests/integration/approval-merge.test.ts`; assert each successful merge leaves exactly one active user linked to the selected player (SC-003 invariant)
- [ ] T031 [US3] [WRITE FIRST] Add unit tests for `approveWithMerge` transaction logic (orphan validation, credential prevalence, duplicate guard) in `packages/cms/tests/unit/UserApprovalService.test.ts`, including the no-duplicate-active-identity assertion
- [ ] T028 [US3] Implement `UserApprovalService.approveWithMerge(userId, mergePlayerId, reviewerId, expectedUpdatedAt)` as a Prisma transaction: validate orphan player, enforce optimistic lock, set `user.playerId = mergePlayerId`, set `registrationStatus=APPROVED`, write `UserApprovalDecision` record in `packages/cms/src/services/UserApprovalService.ts`
- [ ] T029 [US3] Add `POST /api/v1/admin/users/pending-approvals/:userId/approve-merge` endpoint to `packages/cms/src/routes/users.ts`

**Checkpoint**: Approve-with-merge is atomic, correctly wires user to player, and is tested for integrity constraints

---

## Phase 6: User Story 4 — Notification Contract Ready for Future Email Service (Priority: P3)

**Goal**: `NotificationSender` interface is implemented as a no-op logger adapter and wired into approval/denial flows via `sendSafe`, ensuring failure never blocks operations.

**Independent Test**: Inject a failing mock `NotificationSender`; execute approve and deny flows; confirm operations succeed; confirm warning is logged.

### Implementation

- [ ] T032 [US4] Create `packages/cms/src/services/NoOpNotificationSender.ts` implementing `NotificationSender` from `@ministrosfc/shared`: `send`/`sendCC`/`sendCCO` log and resolve; `sendSafe` wraps in try/catch and logs warning on failure
- [ ] T033 [US4] Wire `NotificationSender.sendSafe` calls at approval and denial completion points in `packages/cms/src/services/UserApprovalService.ts` using `NoOpNotificationSender`
- [ ] T034 [P] [US4] Add unit tests for `NoOpNotificationSender`: verify `sendSafe` swallows errors and logs warning; verify `send` resolves normally in `packages/cms/tests/unit/NoOpNotificationSender.test.ts`

**Checkpoint**: Notification contract is wired; approval/deny flows do not fail when notification throws

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: FR-018 user edition screen with post-approval merge, navigation links, and quickstart validation.

- [ ] T035 [P] Create `UserEditorPanel` component (editable firstName/lastName/email, reuses `PendingApprovalReviewPanel`'s orphan-player merge selector) in `packages/frontend/src/components/pages/admin/users/UserEditorPanel.vue`
- [ ] T036 [P] Implement `UserApprovalService.mergeApprovedUser(userId, mergePlayerId, actorId, expectedUpdatedAt)` (post-approval link: validates user is APPROVED and has no existing player, validates orphan player, links `user.playerId`, and writes auditable fields `approvedBy=actorId` and `approvedAt`) in `packages/cms/src/services/UserApprovalService.ts`
- [ ] T037 [P] Add `POST /api/v1/admin/users/:userId/merge-player` endpoint to `packages/cms/src/routes/users.ts`
- [ ] T038 Create `/admin/users/[userId].vue` page displaying `UserEditorPanel` in `packages/frontend/src/pages/admin/users/[userId].vue` with `definePageMeta({ layout: "admin", middleware: "auth", requiresAuth: true, requiresRole: "editor" })`
- [ ] T039 [P] Add integration test for post-approval merge endpoint (`409` if player already linked, `404` if player not orphan) in `packages/cms/tests/integration/user-merge.test.ts`
- [ ] T040 [P] Add navigation link to pending-approvals queue in admin sidebar or users index page in `packages/frontend/src/components/admin/` (exact component depends on current sidebar implementation)
- [ ] T041 [P] Run quickstart.md manual verification flow to confirm full end-to-end scenario works; verification PASSES only when all of the following are confirmed by the quickstart checklist steps: SC-001 (new user blocked until decision), SC-003 (no duplicate active identity post-merge, exactly one active user linked to selected player), SC-004 (audit record present with reviewer identity, decision type, timestamp), and SC-005 (notification contract callable without concrete transport)
- [ ] T042 [P] Update changelogs for this feature scope: root `CHANGELOG.md` plus `packages/cms/CHANGELOG.md`, `packages/frontend/CHANGELOG.md`, and `packages/shared/CHANGELOG.md`
- [ ] T043 [P] Measure response times for approval queue (`GET /api/v1/admin/users/pending-approvals`) and all decision endpoints (`POST .../approve`, `.../deny`, `.../approve-merge`) under representative load; assert all are under 300ms average (plan performance goal); document measured results in `specs/019-merge-related-users/quickstart.md` validation section
- [ ] T044 [P] Bump minor version in `packages/shared/package.json`, `packages/cms/package.json`, and `packages/frontend/package.json`; promote `## [Unreleased]` to `## [X.Y.Z] — YYYY-MM-DD` in root `CHANGELOG.md` and each affected `packages/*/CHANGELOG.md` in a single atomic commit (Constitution Principle VIII release process)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Requires Phase 1 complete — **BLOCKS all user stories**
- **Phase 3 (US1)**: Requires Phase 2 complete
- **Phase 4 (US2)**: Requires Phase 2 complete — may start in parallel with Phase 3
- **Phase 5 (US3)**: Requires Phase 4 complete (reuses `UserApprovalService` infrastructure)
- **Phase 6 (US4)**: Requires Phase 2 complete — may start after Phase 2, independently of US1–US3
- **Phase 7 (Polish)**: Requires Phase 4 + Phase 5 complete

### User Story Dependencies

| Story    | Depends On                                | Can Parallelize With |
| -------- | ----------------------------------------- | -------------------- |
| US1 (P1) | Phase 2 done                              | US4 after Phase 2    |
| US2 (P1) | Phase 2 done                              | US1, US4             |
| US3 (P2) | US2 complete (`UserApprovalService` base) | US4                  |
| US4 (P3) | Phase 2 done                              | US1, US2, US3        |

### Within Each Phase

- Models before services
- Services before route handlers
- Routes before frontend integration
- Frontend components before page wiring

### Parallel Opportunities (per phase)

**Phase 1**: T002 and T003 can run in parallel with T001 (different files)  
**Phase 2**: T009 and T010 and T012 can run in parallel; T011 and T012 can run in parallel  
**Phase 3**: T014 should be written before T013; T015 and T016 can run in parallel after T013  
**Phase 4**: T019 can run in parallel with T018; T024 should be written before T023, while T025/T026 can run in parallel with T023  
**Phase 5**: T030 and T031 should be written before T028 and can run in parallel with each other  
**Phase 6**: T034 can run in parallel with T033  
**Phase 7**: T035/T036/T037/T039/T040/T042/T043/T044 can run in parallel; T041 must run last (validates end-to-end state)

---

## Parallel Execution Example: User Story 2

```
After Phase 2 is complete:

Stream A (backend service):
  T018 → T020 → T021 → T022 → T023

Stream B (backend model):
  T019 (parallel with T018)

Stream C (backend tests):
  T024 (write first, then validate T023)

Stream D (frontend):
  T025 + T026 (parallel) → T027
```

---

## Implementation Strategy

**MVP** (minimum to satisfy SC-001 and SC-004):  
Phases 1 + 2 + 3 (pending state + login block). Proves registration governance gate is in place.

**P1 complete** (add US2 — core reviewer workflow):  
Phases 1–4. Reviewers can process the queue with approve/deny.

**P2 complete** (add US3 — merge integrity):  
Phases 1–5. Full merge lifecycle with data integrity guarantees.

**Full delivery** (add US4 + polish):  
All phases. Notification contract wired, post-approval merge available from user edition screen.
