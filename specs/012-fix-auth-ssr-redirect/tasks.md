---
description: "Task list for 012-fix-auth-ssr-redirect"
---

# Tasks: Fix Auth Middleware SSR Redirect on Page Refresh

**Input**: Design documents from `specs/012-fix-auth-ssr-redirect/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: Included — TDD approach required by constitution (bug fixes must have tests demonstrating the bug and the fix).

---

## Phase 1: Setup

**Purpose**: Unlock the middleware for testing by removing its coverage exclusion.

- [x] T001 Remove `"src/middleware/**"` from `coverage.exclude` in `packages/frontend/vitest.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Write the failing tests that define the expected behaviour before any production code is touched (TDD RED phase).

**⚠️ CRITICAL**: Tests MUST be written and FAILING before Phase 3 implementation begins.

- [x] T002 Create `packages/frontend/tests/middleware/` directory and stub `auth.test.ts` with all `vi.stub`/`vi.mock` scaffolding for `useRuntime`, `useAuthStore`, `navigateTo`, and `defineNuxtRouteMiddleware`
- [x] T003 [P] Add failing test: `isServer: true` on any protected route → middleware returns `undefined`; `navigateTo` is never called (SC-001)
- [x] T004 [P] Add failing test: `isServer: false`, unauthenticated, `/admin/dashboard` → redirects to `/login?redirect=%2Fadmin%2Fdashboard` (FR-004)
- [x] T005 [P] Add failing test: `isServer: false`, unauthenticated, `/player/games` → redirects to `/login?redirect=%2Fplayer%2Fgames` (FR-004)
- [x] T006 [P] Add failing test: `isServer: false`, authenticated ADMIN, `/admin/dashboard` → no redirect, returns `undefined` (FR-002)
- [x] T007 [P] Add failing test: `isServer: false`, authenticated PLAYER, `/admin/dashboard` → redirects to `/` (FR-005)
- [x] T008 [P] Add failing test: `isServer: false`, authenticated ADMIN on `/login` → redirects to `/admin/dashboard` (FR-002)
- [x] T009 [P] Add failing test: `isServer: false`, authenticated PLAYER on `/login` → redirects to `/player/games` (FR-002)
- [x] T010 Run `npx vitest run tests/middleware/auth.test.ts` from `packages/frontend` and confirm ALL tests fail (RED)

**Checkpoint**: All middleware tests exist and fail — TDD RED phase confirmed.

---

## Phase 3: User Story 1 — Authenticated user survives a hard refresh (Priority: P1) 🎯 MVP

**Goal**: A logged-in user who hits F5 on any `/admin/**` or `/player/**` page stays on that page without being redirected to `/login`.

**Independent Test**: Log in as ADMIN, navigate to `/admin/dashboard`, press F5 — page renders, no redirect.

### Implementation for User Story 1

- [x] T011 [US1] Add `import { useRuntime } from "~/composables/useRuntime"` to `packages/frontend/src/middleware/auth.ts`
- [x] T012 [US1] Add `if (useRuntime().isServer) return` as the first statement inside the `defineNuxtRouteMiddleware` handler in `packages/frontend/src/middleware/auth.ts`
- [x] T013 [US1] Run `npx vitest run tests/middleware/auth.test.ts` from `packages/frontend` and confirm ALL tests pass (GREEN)
- [x] T014 [US1] Run the full frontend test suite `npx vitest run` from `packages/frontend` and confirm zero regressions (SC-003)

**Checkpoint**: User Story 1 fully functional — hard-refresh no longer redirects authenticated users. All tests green.

---

## Phase 4: User Story 2 — Login redirect parameter is preserved (Priority: P2)

**Goal**: An unauthenticated user who visits `/admin/games` is redirected to `/login?redirect=%2Fadmin%2Fgames` and then lands on `/admin/games` after successfully logging in.

**Independent Test**: Visit `/admin/games` logged out → confirm redirect URL contains `redirect=%2Fadmin%2Fgames`; log in → confirm you land on `/admin/games`.

**Note**: The middleware redirect to `/login?redirect=<path>` is already enforced by T004/T005 tests. This story's only additional test covers the login page consuming the `redirect` param.

### Tests for User Story 2

- [x] T015 [P] [US2] Add test in `packages/frontend/tests/middleware/auth.test.ts`: `isServer: false`, unauthenticated, visiting `/admin/games` → `navigateTo` called with `/login?redirect=%2Fadmin%2Fgames` (encodeURIComponent validation)

### Implementation for User Story 2

- [x] T016 [US2] Verify existing login page (`packages/frontend/src/pages/login.vue`) reads `route.query.redirect` and calls `router.push(redirect)` after successful `authStore.login()` — add the redirect-on-login behaviour if it is missing
- [x] T017 [US2] Run `npx vitest run` from `packages/frontend` — confirm all tests still green

**Checkpoint**: User Stories 1 AND 2 are independently testable and functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T018 [P] Manual end-to-end verification per `specs/012-fix-auth-ssr-redirect/quickstart.md`: log in, navigate to `/admin/dashboard`, hard-refresh, confirm no redirect
- [x] T019 [P] Manual verify unauthenticated path: open private window, navigate to `/admin/players` → confirm redirect to `/login?redirect=%2Fadmin%2Fplayers`
- [x] T020 Run `npx vitest run --coverage` from `packages/frontend` and confirm `src/middleware/auth.ts` appears in coverage output with ≥80% line coverage

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational/RED)**: Depends on Phase 1 — creates all failing tests
- **Phase 3 (US1 implementation)**: Depends on Phase 2 — production code written after tests exist
- **Phase 4 (US2)**: Depends on Phase 3 completion (US1 guard must be in place)
- **Phase 5 (Polish)**: Depends on Phases 3 and 4

### User Story Dependencies

- **US1 (P1)**: No dependencies on other stories
- **US2 (P2)**: Depends on US1 only for the SSR guard being present (redirect path test reuses the same middleware file)

### Within Each Phase

- T002 must complete before T003–T009 (scaffolding before individual tests)
- T010 (confirm RED) must complete before T011 (start implementation)
- T013 (confirm GREEN) must complete before T014 (regression run)

### Parallel Opportunities

- T003–T009 can all be written in parallel (each targets a distinct mock state)
- T011 and T015 can be written in parallel (different test + source file concerns)
- T018 and T019 can be executed in parallel (independent manual checks)

---

## Parallel Example: User Story 1

```
[Sequential]
T001 → T002 → T003..T009 (parallel) → T010 (confirm RED)
                                            ↓
                                       T011 → T012 → T013 → T014
```

---

## Implementation Strategy

**MVP scope**: Phase 3 (US1) alone delivers the fix. US2 / polish are incremental improvements.

**Suggested execution order**:

1. T001 (2 min) – config tweak
2. T002–T010 (TDD RED, ~30 min) – write all tests
3. T011–T014 (TDD GREEN, ~10 min) – single-line fix + verify
4. T015–T017 (US2, ~15 min) – login redirect param
5. T018–T020 (polish, ~10 min) – manual + coverage check

**Total estimated files changed**: 3 (`vitest.config.ts`, `auth.ts`, `tests/middleware/auth.test.ts`) + possible `login.vue` if redirect logic is missing.
