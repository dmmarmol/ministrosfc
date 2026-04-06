# Tasks: User Registration & Sign-In (Full Scope)

**Input**: Design documents from `/specs/009-user-registration/`  
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md

**Tests**: Included. TDD is required for all testable behavior.  
**Organization**: Tasks are grouped by user story so each increment is independently testable.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable task (different files, no unfinished dependency).
- **[Story]**: User story label (`[US1]` ... `[US6]`) for story phases only.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare dependencies and shared validation/config modules.

- [ ] T001 Install `google-auth-library` in `packages/cms/package.json`
- [ ] T002 [P] Add Google OAuth env entries in `packages/cms/.env.example`
- [ ] T003 [P] Wire Google OAuth config in `packages/cms/src/config/auth.ts`
- [ ] T004 [P] Add shared password schema rules in `packages/shared/src/validation/password.ts`
- [ ] T005 [P] Export password schema from `packages/shared/src/index.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Complete schema, migrations, role hierarchy, and auth typing before any story work.

**CRITICAL**: No story implementation starts before this phase is complete.

- [ ] T006 Add `User.onboardingCompletedAt` in `packages/cms/prisma/schema.prisma`
- [ ] T007 Add `User.googleSubjectId`, nullable `passwordHash`, and `Role.DT` in `packages/cms/prisma/schema.prisma`
- [ ] T008 Add `firstName`/`lastName` fields for `User` and `Player` plus `Player.address` in `packages/cms/prisma/schema.prisma`
- [ ] T009 Create migration SQL for `name` split + backfill in `packages/cms/prisma/migrations/`
- [ ] T010 Create migration for Google auth + DT + onboarding fields in `packages/cms/prisma/migrations/`
- [ ] T011 [P] Update user model typings in `packages/cms/src/models/User.ts`
- [ ] T012 [P] Update player model typings in `packages/cms/src/models/Player.ts`
- [ ] T013 [P] Update role hierarchy map in `packages/cms/src/middleware/rbac.ts`
- [ ] T014 [P] Update JWT/auth payload typing in `packages/cms/src/middleware/auth.ts`
- [ ] T015 [P] Update frontend auth state types in `packages/frontend/src/stores/auth.ts`

**Checkpoint**: Database and auth foundations are ready.

---

## Phase 3: User Story 3 - Updated Login Page Layout (Priority: P1)

**Goal**: `/login` supports sign-in/sign-up toggle with persistent Google access and Spanish UX copy.

**Independent Test**: Open `/login`, switch between modes, verify Google button appears in both modes, and verify legacy sign-in still succeeds.

### Tests (write first)

- [ ] T016 [P] [US3] Add mode toggle UI tests in `packages/frontend/tests/unit/login-page.test.ts`
- [ ] T017 [P] [US3] Add registration form field rendering tests in `packages/frontend/tests/unit/register-form.test.ts`
- [ ] T018 [P] [US3] Add login regression tests for existing email/password path in `packages/frontend/tests/unit/login-regression.test.ts`

### Implementation

- [ ] T019 [US3] Implement sign-in/sign-up mode toggle in `packages/frontend/src/pages/login.vue`
- [ ] T020 [US3] Add registration fields and default `isPlayer=true` checkbox in `packages/frontend/src/pages/login.vue`
- [ ] T021 [US3] Keep Google button visible in both auth modes in `packages/frontend/src/pages/login.vue`
- [ ] T022 [US3] Apply Spanish labels and validation/error copy in `packages/frontend/src/pages/login.vue`

**Checkpoint**: Login/register entry UI is complete and regression-safe.

---

## Phase 4: User Story 1 - Email Registration (Priority: P1)

**Goal**: Register by email/password, create onboarding-pending user, issue tokens, and redirect to onboarding.

**Independent Test**: Register new user; duplicate email/invalid password/mismatch fail with expected errors; successful registration returns onboarding next step.

### Tests (write first)

- [ ] T023 [P] [US1] Add registration integration tests in `packages/cms/tests/integration/auth-register.test.ts`
- [ ] T024 [P] [US1] Add `AuthService.register` unit tests in `packages/cms/tests/unit/AuthService.test.ts`
- [ ] T025 [P] [US1] Add explicit default-role assertion test (`PLAYER`) in `packages/cms/tests/unit/AuthService.test.ts`
- [ ] T026 [P] [US1] Add frontend registration submit tests in `packages/frontend/tests/unit/register-submit.test.ts`

### Implementation

- [ ] T027 [US1] Implement register request schema (`firstName/lastName/isPlayer`) in `packages/cms/src/routes/auth.ts`
- [ ] T028 [US1] Implement onboarding-pending user creation and token issuance in `packages/cms/src/services/AuthService.ts`
- [ ] T029 [US1] Return `nextStep=/auth/onboarding` and updated user payload in `packages/cms/src/routes/auth.ts`
- [ ] T030 [US1] Redirect to onboarding after successful registration in `packages/frontend/src/pages/login.vue`

**Checkpoint**: Email registration flow is complete end-to-end.

---

## Phase 5: User Story 4 - Unified Post-Signup Onboarding Wizard (Priority: P1)

**Goal**: Single onboarding source of truth for player intent and conditional player linkage.

**Independent Test**: First-time authenticated users complete onboarding once; `isPlayer=true` creates/updates Player, `isPlayer=false` leaves `playerId=null`.

### Tests (write first)

- [ ] T031 [P] [US4] Add onboarding status/complete integration tests in `packages/cms/tests/integration/onboarding.test.ts`
- [ ] T032 [P] [US4] Add onboarding service branch/idempotency tests in `packages/cms/tests/unit/OnboardingService.test.ts`
- [ ] T033 [P] [US4] Add conditional onboarding form tests in `packages/frontend/tests/unit/onboarding-page.test.ts`

### Implementation

- [ ] T034 [US4] Implement onboarding domain logic in `packages/cms/src/services/OnboardingService.ts`
- [ ] T035 [US4] Implement onboarding routes in `packages/cms/src/routes/onboarding.ts`
- [ ] T036 [US4] Register onboarding routes in `packages/cms/src/config/server.ts`
- [ ] T037 [P] [US4] Implement onboarding composable in `packages/frontend/src/composables/useOnboarding.ts`
- [ ] T038 [P] [US4] Implement onboarding page UI/validation in `packages/frontend/src/pages/auth/onboarding.vue`
- [ ] T039 [US4] Implement middleware guard for incomplete onboarding in `packages/frontend/src/middleware/auth.ts`
- [ ] T040 [US4] Implement post-onboarding role-based navigation in `packages/frontend/src/pages/auth/onboarding.vue`

**Checkpoint**: Unified onboarding gate and completion flow are complete.

---

## Phase 6: User Story 2 - Google Sign-In (Priority: P2)

**Goal**: Google OAuth sign-in/linking converges to the same onboarding and validation flow as email registration.

**Independent Test**: First-time Google login creates/signs in user then routes through onboarding; existing email account links Google subject and reuses account.

### Tests (write first)

- [ ] T041 [P] [US2] Add Google OAuth integration tests in `packages/cms/tests/integration/google-oauth.test.ts`
- [ ] T042 [P] [US2] Add explicit account-linking test (email match) in `packages/cms/tests/integration/google-oauth.test.ts`
- [ ] T043 [P] [US2] Add frontend Google callback routing tests in `packages/frontend/tests/unit/google-callback.test.ts`

### Implementation

- [ ] T044 [US2] Implement Google start/callback handlers in `packages/cms/src/routes/auth.ts`
- [ ] T045 [US2] Implement Google subject resolution/linking in `packages/cms/src/services/AuthService.ts`
- [ ] T046 [US2] Implement frontend callback token handling in `packages/frontend/src/pages/auth/google/callback.vue`
- [ ] T047 [US2] Reuse onboarding status gate after Google callback in `packages/frontend/src/pages/auth/google/callback.vue`

**Checkpoint**: Google auth path is aligned with onboarding source-of-truth behavior.

---

## Phase 7: User Story 5 - Profile & Player Features (FR-016, FR-026 to FR-030)

**Goal**: Deliver profile editing, photo upload, jersey availability/preview, and invited guests list.

**Independent Test**: Authenticated user can edit profile and photo, see jersey preview and taken-number tooltip, and inactive players can still log in/edit while blocked from participation features.

### Tests (write first)

- [ ] T048 [P] [US5] Add profile service unit tests in `packages/cms/tests/unit/ProfileService.test.ts`
- [ ] T049 [P] [US5] Add profile endpoint integration tests in `packages/cms/tests/integration/profile.test.ts`
- [ ] T050 [P] [US5] Add profile UI component tests (guests/jersey/tooltip) in `packages/frontend/tests/unit/profile-components.test.ts`
- [ ] T051 [P] [US5] Add inactive-player participation restriction tests in `packages/cms/tests/integration/participation-restrictions.test.ts`

### Implementation

- [ ] T052 [US5] Implement profile aggregation/update logic in `packages/cms/src/services/ProfileService.ts`
- [ ] T053 [US5] Implement profile endpoints (`GET/PATCH/PUT/jersey-availability`) in `packages/cms/src/routes/profile.ts`
- [ ] T054 [US5] Implement photo storage adapter updates in `packages/cms/src/utils/object-storage.ts`
- [ ] T055 [US5] Implement inactive-player participation guards in `packages/cms/src/services/ParticipationService.ts`
- [ ] T056 [P] [US5] Implement profile composable in `packages/frontend/src/composables/useProfile.ts`
- [ ] T057 [P] [US5] Implement profile components in `packages/frontend/src/components/profile/`
- [ ] T058 [US5] Implement profile page composition in `packages/frontend/src/pages/profile.vue`

**Checkpoint**: Profile and player-status behavior are complete.

---

## Phase 8: User Story 6 - Admin Role Management + DT Features (FR-018 to FR-025)

**Goal**: Complete admin role transitions, player status management, hard delete, and DT game-route permissions.

**Independent Test**: Admin can manage role/status/delete with constraints; DT has expected game editing/guest-add permissions.

### Tests (write first)

- [ ] T059 [P] [US6] Add role-management integration tests in `packages/cms/tests/integration/role-management.test.ts`
- [ ] T060 [P] [US6] Add role transition matrix unit tests in `packages/cms/tests/unit/UserService.test.ts`
- [ ] T061 [P] [US6] Add admin users UI tests in `packages/frontend/tests/unit/admin-users.test.ts`
- [ ] T062 [P] [US6] Add DT route-permission tests for game tactics/guest flows in `packages/cms/tests/integration/game-dt-permissions.test.ts`

### Implementation

- [ ] T063 [US6] Implement role transition rules in `packages/cms/src/services/UserService.ts`
- [ ] T064 [US6] Implement admin users role/status/delete endpoints in `packages/cms/src/routes/users.ts`
- [ ] T065 [US6] Implement DT permission checks for game tactics and guest add in `packages/cms/src/routes/games.ts`
- [ ] T066 [US6] Implement admin user role manager UI in `packages/frontend/src/components/admin/UserRoleManager.vue`
- [ ] T067 [US6] Implement admin users management page in `packages/frontend/src/pages/admin/users/index.vue`

**Checkpoint**: Admin and DT scope is complete.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final consistency, regression, and quality gates.

- [ ] T068 [P] Sync final auth/onboarding/profile/admin contracts in `specs/009-user-registration/contracts/`
- [ ] T069 [P] Sync quickstart endpoints and scenarios in `specs/009-user-registration/quickstart.md`
- [ ] T070 Add CMS auth regression test coverage for legacy login behavior in `packages/cms/tests/integration/auth-flow.test.ts`
- [ ] T071 Run focused CMS suites for auth/onboarding/profile/roles in `packages/cms/tests/`
- [ ] T072 Run focused frontend suites for login/onboarding/profile/admin in `packages/frontend/tests/`
- [ ] T073 Verify new-code coverage gate (>=80%) in `packages/cms/tests/` and `packages/frontend/tests/`
- [ ] T074 Execute quickstart manual validation and record outcomes in `specs/009-user-registration/research.md`

---

## Dependencies & Execution Order

### Story completion order

1. US3 (login entry layout) + US1 (email registration) + US4 (onboarding) form the MVP track.
2. US2 (Google sign-in) depends on auth + onboarding foundation.
3. US5 (profile/player features) depends on foundational schema and onboarding states.
4. US6 (admin roles + DT permissions) depends on role hierarchy migration and admin route base.

### Phase dependencies

1. Phase 1 -> Phase 2 -> Phases 3 to 6 -> Phases 7 and 8 -> Phase 9
2. Phase 2 blocks all user story implementation.
3. Phase 9 starts after targeted stories are implemented.

### Within each user story

1. Tests first (must fail before implementation).
2. Backend domain/services before routes.
3. Frontend integration after backend contracts are stable.
4. Story checkpoint validation before moving on.

---

## Parallel Execution Examples

### US3

- T016 in `packages/frontend/tests/unit/login-page.test.ts`
- T017 in `packages/frontend/tests/unit/register-form.test.ts`
- T018 in `packages/frontend/tests/unit/login-regression.test.ts`

### US1

- T023 in `packages/cms/tests/integration/auth-register.test.ts`
- T024 in `packages/cms/tests/unit/AuthService.test.ts`
- T026 in `packages/frontend/tests/unit/register-submit.test.ts`

### US4

- T031 in `packages/cms/tests/integration/onboarding.test.ts`
- T032 in `packages/cms/tests/unit/OnboardingService.test.ts`
- T033 in `packages/frontend/tests/unit/onboarding-page.test.ts`

### US2

- T041 in `packages/cms/tests/integration/google-oauth.test.ts`
- T043 in `packages/frontend/tests/unit/google-callback.test.ts`

### US5

- T048 in `packages/cms/tests/unit/ProfileService.test.ts`
- T049 in `packages/cms/tests/integration/profile.test.ts`
- T050 in `packages/frontend/tests/unit/profile-components.test.ts`

### US6

- T059 in `packages/cms/tests/integration/role-management.test.ts`
- T060 in `packages/cms/tests/unit/UserService.test.ts`
- T062 in `packages/cms/tests/integration/game-dt-permissions.test.ts`

---

## Implementation Strategy

### MVP first (US3 + US1 + US4)

1. Complete Phase 1 and Phase 2.
2. Deliver US3 (entry UI), US1 (email registration), and US4 (onboarding).
3. Validate independent acceptance criteria before extending scope.

### Incremental delivery

1. Add US2 (Google sign-in) after MVP stabilization.
2. Add US5 (profile/player features) once onboarding state is stable.
3. Add US6 (admin role management + DT permissions).
4. Finish with Phase 9 consistency/regression/coverage gates.

### Team parallelization

1. After Phase 2, split teams across US2, US5, and US6 while MVP track is stabilized.
2. Keep contract sync tasks (T068, T069) as final convergence work.

---

## Notes

- Keep all labels, messages, and UX copy in Spanish.
- Preserve session-storage token behavior.
- Onboarding completion endpoint remains single source of truth for player linkage.
- This task set intentionally covers FR-001 through FR-037.
