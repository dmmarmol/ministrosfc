# Tasks: User Registration & Sign-In

**Input**: Design documents from `/specs/009-user-registration/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅, contracts/ ✅

**Tests**: Included — plan.md mandates TDD with 80% coverage on new code.

**Organization**: Tasks grouped by user story. US1–US3 from spec.md; US4 (Profile) and US5 (Admin Role Mgmt) derived from FR groups FR-026–FR-030 and FR-018–FR-023 respectively.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths included in every task

## Path Conventions

- **CMS**: `packages/cms/` (Express API)
- **Frontend**: `packages/frontend/` (Nuxt 3 SPA)
- **Shared**: `packages/shared/` (shared validation schemas)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install new dependency, configure environment, create shared schemas

- [ ] T001 Install `google-auth-library` dependency in CMS workspace (`npm install google-auth-library --workspace=@ministrosfc/cms`)
- [ ] T002 [P] Add Google OAuth environment variables (`GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI`) to `packages/cms/src/config/auth.ts` and document in `.env.example`
- [ ] T003 [P] Create shared password validation schema with per-rule `superRefine` in `packages/shared/src/validation/password.ts` — export `passwordSchema` and `PASSWORD_RULES` (min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char)

---

## Phase 2: Foundational (DB Migrations & Core Changes)

**Purpose**: Schema migrations, model updates, and RBAC changes that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create custom Prisma migration `split_user_name_fields` in `packages/cms/prisma/migrations/` — split `User.name` → `firstName` + `lastName`, split `Player.name` → `firstName` + `lastName`, add `Player.address` (VARCHAR 500 nullable). Use custom SQL: add nullable columns → backfill from `name` (split on first space) → set NOT NULL → drop `name`. See research.md Topic 2
- [ ] T005 Create Prisma migration `add_dt_role_google_auth` in `packages/cms/prisma/migrations/` — add `DT` to Role enum, add `User.googleSubjectId` (String? @unique), make `User.passwordHash` nullable. Update `packages/cms/prisma/schema.prisma` accordingly
- [ ] T006 [P] Update User model types/helpers in `packages/cms/src/models/User.ts` — replace `name` with `firstName`/`lastName`, add `googleSubjectId` field, make `passwordHash` optional
- [ ] T007 [P] Update Player model types/helpers in `packages/cms/src/models/Player.ts` — replace `name` with `firstName`/`lastName`, add `address` field
- [ ] T008 [P] Update RBAC middleware in `packages/cms/src/middleware/rbac.ts` — add `DT` to `ROLE_HIERARCHY` (ADMIN:4, EDITOR:3, DT:2, PLAYER:1), update any role-check logic
- [ ] T009 [P] Update auth middleware in `packages/cms/src/middleware/auth.ts` — add `DT` to `JwtPayload` role type union
- [ ] T010 Update login endpoint and AuthService.login in `packages/cms/src/routes/auth.ts` and `packages/cms/src/services/AuthService.ts` — return `firstName`/`lastName` instead of `name` in login response (FR-012, FR-017)
- [ ] T011 [P] Update auth store in `packages/frontend/src/stores/auth.ts` — replace `name` with `firstName`/`lastName` in user state, add `DT` to role type, update any display name computed properties

**Checkpoint**: Foundation ready — schema migrated, models updated, RBAC hierarchy includes DT, login still works with firstName/lastName

---

## Phase 3: User Story 3 — Updated Login Page Layout (Priority: P1) 🎯 MVP

**Goal**: Redesign `/login` page with sign-in/sign-up toggle and Google button (FR-001, FR-008, FR-013)

**Independent Test**: Load `/login`, verify sign-in form renders by default, toggle to sign-up mode shows registration fields, Google button visible in both modes, existing login still works

### Tests for US3

> **TDD: Write tests FIRST, ensure they FAIL before implementation**

- [ ] T012 [P] [US3] Write unit test for LoginForm component in `packages/frontend/tests/unit/LoginForm.test.ts` — test: renders email/password fields, emits submit with credentials, shows validation errors
- [ ] T013 [P] [US3] Write unit test for RegisterForm component in `packages/frontend/tests/unit/RegisterForm.test.ts` — test: renders firstName/lastName/email/password/confirmation fields, per-rule password feedback, password mismatch validation, emits submit

### Implementation for US3

- [ ] T014 [P] [US3] Create LoginForm.vue in `packages/frontend/src/components/auth/LoginForm.vue` — extract existing sign-in form into standalone component with email/password fields, submit handler, validation errors display (Spanish labels)
- [ ] T015 [P] [US3] Create RegisterForm.vue in `packages/frontend/src/components/auth/RegisterForm.vue` — registration form with firstName, lastName, email, password, passwordConfirmation fields; import `PASSWORD_RULES` from shared for real-time per-rule feedback; client-side validation (FR-002, FR-003, FR-004, FR-014)
- [ ] T016 [P] [US3] Create GoogleSignInButton.vue in `packages/frontend/src/components/auth/GoogleSignInButton.vue` — "Iniciar sesión con Google" button that navigates to `GET /api/v1/auth/google`; disabled state for errors (FR-008)
- [ ] T017 [US3] Redesign `packages/frontend/src/pages/login.vue` — toggle between sign-in (LoginForm) and sign-up (RegisterForm) modes via "¿No tenés cuenta? Registrate" / "¿Ya tenés cuenta? Iniciá sesión" links; GoogleSignInButton visible in both modes; display Google OAuth error messages from query params (FR-011, FR-013)

**Checkpoint**: Login page shows both modes and Google button. Sign-in still works. Registration form renders but doesn't submit yet (backend not wired).

---

## Phase 4: User Story 1 — Email Registration (Priority: P1) 🎯 MVP

**Goal**: New users can register via email + password; system creates User + Player, signs them in (FR-002–FR-007, FR-014, FR-015)

**Independent Test**: Navigate to `/login`, toggle to registration mode, fill firstName/lastName/email/password, submit. User lands on authenticated area. Log out, log back in with same credentials.

### Tests for US1

> **TDD: Write tests FIRST, ensure they FAIL before implementation**

- [ ] T018 [P] [US1] Write integration test for register endpoint in `packages/cms/tests/integration/auth-register.test.ts` — test: successful registration returns 201 + tokens + user with PLAYER role; duplicate email returns 409; weak password returns 400; mismatched passwords returns 400; auto-creates Player + Contact; rate limiting (5 req/15min)
- [ ] T019 [P] [US1] Write unit test for AuthService.register in `packages/cms/tests/unit/AuthService.test.ts` — test: creates User with bcrypt hash + PLAYER role, creates Player with ACTIVE status + REGISTERED type + firstName/lastName, creates empty Contact, generates JWT pair, stores refresh in Redis

### Implementation for US1

- [ ] T020 [US1] Implement registration Zod schema in `packages/cms/src/routes/auth.ts` — import `passwordSchema` from `@ministrosfc/shared`, validate email/password/passwordConfirmation/firstName/lastName, add `POST /api/v1/auth/register` route with rate limit (5 req/15 min per IP)
- [ ] T021 [US1] Implement AuthService.register in `packages/cms/src/services/AuthService.ts` — check email uniqueness (409 on conflict), hash password (bcrypt cost 12), create User (role=PLAYER) + Player (status=ACTIVE, playerType=REGISTERED, firstName/lastName) + Contact (empty) in transaction, link User.playerId, generate tokens, store refresh in Redis, invalidate player search cache
- [ ] T022 [US1] Wire RegisterForm.vue submit to `POST /api/v1/auth/register` in `packages/frontend/src/components/auth/RegisterForm.vue` and add `register` action to auth store in `packages/frontend/src/stores/auth.ts` — on success: store tokens, redirect to role-appropriate landing page; on error: display server validation messages (FR-005: "Este correo ya está registrado")

**Checkpoint**: Full email registration flow works end-to-end. New user can register, gets signed in, can log out and back in. Player record created automatically.

---

## Phase 5: User Story 2 — Google Sign-In (Priority: P2)

**Goal**: Users can sign in or register via Google OAuth; accounts link by email when possible (FR-008–FR-011)

**Independent Test**: Click "Iniciar sesión con Google" on `/login`, complete Google consent, verify user lands on authenticated area with Google profile name. Test account linking by registering via email first, then signing in via Google with same email.

### Tests for US2

> **TDD: Write tests FIRST, ensure they FAIL before implementation**

- [ ] T023 [P] [US2] Write integration test for Google OAuth flow in `packages/cms/tests/integration/google-oauth.test.ts` — test: GET /auth/google returns 302 to Google consent URL with state cookie; GET /auth/google/callback with valid code creates new user + player (first-time); callback with existing googleSubjectId signs in; callback with matching email links account; cancelled consent redirects to `/login?error=google_cancelled`; CSRF state mismatch returns error
- [ ] T024 [P] [US2] Write unit test for AuthService.googleAuth in `packages/cms/tests/unit/AuthService.test.ts` — test: exchanges code for tokens, verifies ID token, creates user when new, links googleSubjectId when email matches, signs in when googleSubjectId found

### Implementation for US2

- [ ] T025 [US2] Implement GET `/api/v1/auth/google` route in `packages/cms/src/routes/auth.ts` — create `OAuth2Client` instance, generate consent URL with `state` CSRF token, set state in httpOnly cookie (5min TTL, sameSite=lax), redirect 302 to Google
- [ ] T026 [US2] Implement GET `/api/v1/auth/google/callback` route in `packages/cms/src/routes/auth.ts` — validate state cookie, exchange code for tokens via `OAuth2Client.getToken`, verify ID token, extract sub/email/given_name/family_name. On error → redirect `/login?error=google_failed`; on cancel → redirect `/login?error=google_cancelled`
- [ ] T027 [US2] Implement AuthService.googleAuth account resolution in `packages/cms/src/services/AuthService.ts` — (a) find by googleSubjectId → sign in, (b) find by email → link googleSubjectId + sign in, (c) not found → create User (passwordHash=null, googleSubjectId=sub, role=PLAYER) + Player + Contact → sign in. Generate tokens, store refresh in Redis. Redirect to frontend `/auth/google/callback?token=...&refresh=...`
- [ ] T028 [US2] Create Google OAuth callback page in `packages/frontend/src/pages/auth/google/callback.vue` — read `token`/`refresh`/`error` from query params; on error → redirect to `/login` with toast; on success → store tokens in auth store, decode user info, clear URL, navigate to landing page
- [ ] T029 [US2] Wire GoogleSignInButton.vue to CMS OAuth endpoint and display error messages in `packages/frontend/src/components/auth/GoogleSignInButton.vue` and `packages/frontend/src/pages/login.vue` — button navigates to `/api/v1/auth/google`; login page reads `error` query param and shows Spanish error messages (google_cancelled / google_failed / csrf_mismatch)

**Checkpoint**: Full Google sign-in flow works. New Google users get account + player created. Existing email users get Google linked. Cancel/error handled gracefully.

---

## Phase 6: User Profile Page (FRs 016, 026–030)

**Goal**: Authenticated users can view and edit their profile — photo, personal info, jersey number with SVG, invited guests list

**Independent Test**: Log in, navigate to `/profile`, verify user info renders. Edit firstName, change jersey number (validate availability tooltip), upload photo. Verify jersey SVG updates. Verify invited guests section shows guest players.

### Tests for Profile

> **TDD: Write tests FIRST, ensure they FAIL before implementation**

- [ ] T030 [P] [US4] Write unit test for ProfileService in `packages/cms/tests/unit/ProfileService.test.ts` — test: getProfile returns User+Player+Contact+invitedGuests; updateProfile updates User and Player fields in transaction; updateProfile validates jersey uniqueness (409 on conflict); updatePhoto uploads to Cloudinary and updates Player.photoUrl
- [ ] T031 [P] [US4] Write integration test for profile endpoints in `packages/cms/tests/integration/profile.test.ts` — test: GET /profile returns full profile; PATCH /profile updates fields; PUT /profile/photo accepts multipart upload; GET /profile/jersey-availability returns taken numbers; 401 on unauthenticated; 409 on duplicate jersey
- [ ] T032 [P] [US4] Write unit tests for ProfileEditForm and JerseySvg in `packages/frontend/tests/unit/ProfileEditForm.test.ts` and `packages/frontend/tests/unit/JerseySvg.test.ts` — ProfileEditForm: renders fields, validates jersey, emits save; JerseySvg: renders SVG with jersey number and lastName, accepts color props

### Implementation for Profile — Backend

- [ ] T033 [P] [US4] Generalize upload function in `packages/cms/src/utils/object-storage.ts` — extract `uploadPhoto(file, folder, entityId)` from existing `uploadPlayerPhoto`, add `uploadUserPhoto` wrapper, keep backward-compatible `uploadPlayerPhoto` wrapper
- [ ] T034 [US4] Create ProfileService in `packages/cms/src/services/ProfileService.ts` — `getProfile(userId)`: query User + Player + Contact + invitedGuests (Player where invitedById=playerId AND playerType=GUEST); `updateProfile(userId, data)`: update User.firstName/lastName + Player fields + Contact fields in transaction, validate jersey uniqueness among ACTIVE REGISTERED (excluding self); `updatePhoto(userId, file)`: upload via `uploadUserPhoto`, update Player.photoUrl, delete old asset
- [ ] T035 [US4] Create profile routes in `packages/cms/src/routes/profile.ts` — `GET /api/v1/profile` (auth required), `PATCH /api/v1/profile` (auth required, Zod validation for all optional fields per contract), `PUT /api/v1/profile/photo` (auth required, multipart, max 5MB, image/\*), `GET /api/v1/profile/jersey-availability` (auth required, returns taken numbers). Register routes in main app

### Implementation for Profile — Frontend

- [ ] T036 [P] [US4] Create useProfile composable in `packages/frontend/src/composables/useProfile.ts` — fetch profile data (`GET /api/v1/profile`), update profile (`PATCH /api/v1/profile`), upload photo (`PUT /api/v1/profile/photo`), fetch jersey availability (`GET /api/v1/profile/jersey-availability`)
- [ ] T037 [P] [US4] Create ProfileHeader.vue in `packages/frontend/src/components/profile/ProfileHeader.vue` — display photo (with upload button), full name, role badge, member since date, active/inactive status badge
- [ ] T038 [P] [US4] Create ProfileEditForm.vue in `packages/frontend/src/components/profile/ProfileEditForm.vue` — editable fields: firstName, lastName, nickname, position (dropdown), jerseyNumber (with taken-numbers tooltip per FR-029), dateOfBirth, address, phone, whatsapp, emergencyContact. Zod validation, save button
- [ ] T039 [P] [US4] Create JerseySvg.vue in `packages/frontend/src/components/profile/JerseySvg.vue` — black football jersey SVG showing jerseyNumber centered and lastName above it; colors configurable via Tailwind classes (FR-030)
- [ ] T040 [P] [US4] Create InvitedGuestsList.vue in `packages/frontend/src/components/profile/InvitedGuestsList.vue` — "Invitados" section listing GUEST players this user invited, showing guest name, game opponent, date, link to game (FR-026)
- [ ] T041 [US4] Create profile page in `packages/frontend/src/pages/profile.vue` — compose ProfileHeader, JerseySvg (right side), ProfileEditForm, InvitedGuestsList. Use useProfile composable for data. Auth guard (redirect to /login if unauthenticated)

**Checkpoint**: Profile page fully functional. Users can view/edit all fields, upload photo, see jersey SVG, view invited guests. Deactivated players can still access and edit their profile (FR-016).

---

## Phase 7: User Story 5 — Admin Role Management (FRs 018–023)

**Goal**: Admin users can list users, promote/demote roles (PLAYER↔DT↔EDITOR→ADMIN), activate/deactivate players, hard-delete players

**Independent Test**: Log in as ADMIN, navigate to `/admin/users`, verify user list renders with roles. Promote a PLAYER to DT — verify role updates. Deactivate a player — verify status changes. Verify cannot demote another ADMIN.

### Tests for Admin Role Management

> **TDD: Write tests FIRST, ensure they FAIL before implementation**

- [ ] T042 [P] [US5] Write integration test for admin user endpoints in `packages/cms/tests/integration/role-management.test.ts` — test: GET /admin/users returns paginated list (ADMIN only, 403 for others); PATCH role promotes/demotes correctly (PLAYER→DT, DT→EDITOR, etc.); PATCH role rejects demoting ADMIN (403); PATCH role rejects changing own role; PATCH player-status toggles ACTIVE/INACTIVE (EDITOR+); DELETE player hard-deletes (ADMIN only, 403 for EDITOR)
- [ ] T043 [P] [US5] Write unit test for UserService role management in `packages/cms/tests/unit/UserService.test.ts` — test: changeRole validates hierarchy rules, updatePlayerStatus changes Player.status, deletePlayer cascades correctly

### Implementation for Admin Role Management — Backend

- [ ] T044 [US5] Update UserService with role management logic in `packages/cms/src/services/UserService.ts` — `changeRole(adminId, targetId, newRole)`: validate not self, validate target not ADMIN, update User.role; `updatePlayerStatus(targetId, status)`: update Player.status, invalidate cache; `deletePlayer(targetId)`: hard-delete Player, set User.playerId=null, invalidate cache
- [ ] T045 [US5] Create admin user routes in `packages/cms/src/routes/users.ts` — `GET /api/v1/admin/users` (ADMIN, paginated, filterable by role/search), `PATCH /api/v1/admin/users/:id/role` (ADMIN), `PATCH /api/v1/admin/users/:id/player-status` (EDITOR+), `DELETE /api/v1/admin/users/:id/player` (ADMIN). Register routes in main app with `/api/v1/admin` prefix

### Implementation for Admin Role Management — Frontend

- [ ] T046 [P] [US5] Create UserRoleManager.vue in `packages/frontend/src/components/admin/UserRoleManager.vue` — table/list of users with role badge, player status badge, search input, role filter dropdown. Actions per row: role change dropdown (allowed values based on current role rules), activate/deactivate toggle, delete button with confirmation modal. Spanish labels
- [ ] T047 [US5] Create admin users page in `packages/frontend/src/pages/admin/users/index.vue` — compose UserRoleManager, use admin layout, ADMIN-only auth guard. Paginated list with server-side filtering

**Checkpoint**: Admin users can manage all user roles and player statuses from `/admin/users`. Role hierarchy enforced. Cannot demote other ADMINs.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Update all existing references to `name` field, DT permissions, and final validation

- [x] T048 [P] Update all existing player-related code to use `firstName`/`lastName` instead of `name` — search and replace in `packages/cms/src/` (routes, services, scripts, utils) and `packages/frontend/src/` (components, pages, stores). Update any display logic (e.g., `fullName = firstName + ' ' + lastName`)
- [x] T049 [P] Update DT role permissions in existing game routes in `packages/cms/src/routes/` — allow DT role to access game-edit endpoints for setting player positions and starting/bench status (FR-024); allow DT to add guest players from game edit screen (FR-025). Update RBAC checks on relevant game endpoints
- [x] T050 [P] Update existing CMS tests that reference `User.name` or `Player.name` to use `firstName`/`lastName` in `packages/cms/tests/`
- [ ] T051 Run quickstart.md validation — verify all new endpoints respond correctly, migrations apply cleanly, Google OAuth env vars documented, dev servers start without errors

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — **BLOCKS all user stories**
- **US3 (Phase 3)**: Depends on Phase 2 (auth store updated with firstName/lastName)
- **US1 (Phase 4)**: Depends on Phase 2 + Phase 3 (RegisterForm component exists)
- **US2 (Phase 5)**: Depends on Phase 2 + Phase 3 (GoogleSignInButton exists) + Phase 4 (AuthService.register pattern established)
- **US4 Profile (Phase 6)**: Depends on Phase 2 (models updated). Can start in parallel with Phase 5
- **US5 Admin (Phase 7)**: Depends on Phase 2 (RBAC updated, DT role exists). Can start in parallel with Phases 5–6
- **Polish (Phase 8)**: Depends on all previous phases being complete

### User Story Dependencies

```
Phase 1 (Setup)
    │
    ▼
Phase 2 (Foundational) ─── BLOCKS ALL ───┐
    │                                      │
    ▼                                      │
Phase 3 (US3: Login Layout)               │
    │                                      │
    ├──────────────┐                       │
    ▼              ▼                       ▼
Phase 4 (US1)  Phase 6 (US4: Profile) ──┐
    │                                     │
    ▼                                     │
Phase 5 (US2)  Phase 7 (US5: Admin) ────┘
    │              │
    ▼              ▼
Phase 8 (Polish)
```

- **US3 (P1)**: First UI story — provides the LoginForm/RegisterForm/GoogleButton components
- **US1 (P1)**: After US3 — backend registration + wiring the RegisterForm
- **US2 (P2)**: After US1 — Google OAuth flow reuses auth patterns from registration
- **US4 (Profile)**: After Phase 2 — independent of US1/US2, can run in parallel
- **US5 (Admin)**: After Phase 2 — independent of US4, can run in parallel

### Within Each User Story

1. Tests written **FIRST** and verified to FAIL (TDD)
2. Backend implementation (models → services → routes)
3. Frontend implementation (composables → components → pages)
4. Story checkpoint validation

### Parallel Opportunities

**Phase 2 parallel batch (after migrations T004–T005):**

```
T006 (User model) | T007 (Player model) | T008 (RBAC) | T009 (Auth middleware) | T011 (Auth store)
```

**Phase 3 parallel batch:**

```
T012 (LoginForm test) | T013 (RegisterForm test)
T014 (LoginForm) | T015 (RegisterForm) | T016 (GoogleButton)
```

**Phase 6 parallel batch (after T034 ProfileService + T035 routes):**

```
T036 (useProfile) | T037 (ProfileHeader) | T038 (ProfileEditForm) | T039 (JerseySvg) | T040 (GuestsList)
```

**Cross-story parallelism (after Phase 3):**

```
Developer A: Phase 4 (US1) → Phase 5 (US2)
Developer B: Phase 6 (US4 Profile) → Phase 7 (US5 Admin)
```

---

## Implementation Strategy

### MVP First (US3 + US1)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US3 — Login page redesign
4. Complete Phase 4: US1 — Email registration
5. **STOP and VALIDATE**: New users can register via email, sign in, reach authenticated area
6. Deploy/demo MVP

### Incremental Delivery

1. Setup + Foundational → Foundation ready (migrations applied, login works with firstName/lastName)
2. US3 + US1 → Email registration MVP → Deploy/Demo
3. US2 → Google sign-in → Deploy/Demo
4. US4 → Profile page → Deploy/Demo
5. US5 → Admin role management → Deploy/Demo
6. Polish → Cross-cutting cleanup → Final release

### Parallel Team Strategy

With two developers:

1. Both developers complete Phase 1 + Phase 2 together
2. Once Foundational is done:
   - **Developer A**: Phase 3 (US3) → Phase 4 (US1) → Phase 5 (US2) → Phase 8
   - **Developer B**: Phase 6 (US4 Profile) → Phase 7 (US5 Admin) → Phase 8
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies on incomplete tasks
- [USn] label maps task to specific user story for traceability
- TDD mandate: write tests first, verify they fail, then implement
- All UI labels in Spanish (Argentine dialect) per existing convention
- `useRuntime()` composable required for client/server branching in Nuxt files
- Explicit imports required in all Nuxt files (no auto-imports)
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
