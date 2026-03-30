# Tasks: 015 — Separate Register Route

**Branch**: `refactor/015-register-route`
**Priority**: P2

---

## Problem

The register form currently lives as a toggled state (`isRegisterMode`) inside `/login`. This makes it impossible to link directly to `/register`, hurts SEO, and couples two distinct user flows in one page component.

## Goal

Extract the register form into its own `/register` page route. Both pages share the same visual shell (centered card, logo, Google button, divider) but each owns its own flow.

---

## Phase 1: Fix register endpoint validation responses

The `validate` middleware in `packages/cms/src/middleware/validation.ts` strips field-level error details for unauthenticated requests to avoid leaking schema info. However, the register endpoint is a public form that needs those details to show the user what went wrong (e.g., "Email inválido" for `test01@usuario`).

- [ ] T001 Add a `{ exposeErrors?: boolean }` option to the `validate()` middleware in `packages/cms/src/middleware/validation.ts` — when `true`, include the `errors` array in the response regardless of auth status
- [ ] T002 Pass `{ exposeErrors: true }` to the `validate(registerSchema)` call for `POST /api/v1/auth/register` in `packages/cms/src/routes/auth.ts`
- [ ] T003 Add integration test: unauthenticated `POST /api/v1/auth/register` with invalid email returns 400 with `errors` array containing field-level messages in `packages/cms/tests/integration/auth-register.test.ts`
- [ ] T004 Add integration test: unauthenticated `POST /api/v1/auth/login` with invalid email still returns 400 WITHOUT `errors` array (no regression) in `packages/cms/tests/integration/auth-flow.test.ts`

## Phase 2: Create register page

- [ ] T005 Create `packages/frontend/src/pages/register.vue` with the shared auth layout shell, `RegisterForm` component, `GoogleSignInButton`, error handling, and post-register redirect to `/auth/onboarding`
- [ ] T006 Add "¿Ya tenés cuenta? Iniciá sesión" link pointing to `/login` in `packages/frontend/src/pages/register.vue`

## Phase 3: Simplify login page

- [ ] T007 Remove `isRegisterMode` state, `RegisterForm` import, `handleRegister`, `toggleMode`, and `onMounted` query check from `packages/frontend/src/pages/login.vue`
- [ ] T008 Replace the toggle button with a "¿No tenés cuenta? Registrate" `NuxtLink` to `/register` in `packages/frontend/src/pages/login.vue`

## Phase 4: Update references

- [ ] T009 Update Navigation login link if it references `?mode=register` anywhere in `packages/frontend/src/components/common/Navigation.vue`
- [ ] T010 Update auth middleware redirect target from `/login?mode=register` to `/register` if applicable in `packages/frontend/src/middleware/auth.ts`

## Phase 5: Update tests

- [ ] T011 Update `packages/frontend/tests/unit/login-page.test.ts` — remove "starts in register mode" test, add test for NuxtLink to `/register`
- [ ] T012 Create `packages/frontend/tests/unit/register-page.test.ts` — renders RegisterForm, shows login link, handles submit + redirect to onboarding
- [ ] T013 Update `packages/frontend/tests/unit/register-submit.test.ts` if it depends on login page context
- [ ] T014 Run all frontend tests to confirm no regressions in `packages/frontend/tests/`
