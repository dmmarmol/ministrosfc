# Tasks: 014 — Fix Navigation Hydration Mismatch

**Branch**: `fix/014-navigation-hydration`
**Priority**: P1 (visual glitch on every page load for authenticated users)

---

## Problem

`[Vue warn]: Hydration node mismatch` on the `/` page (and all pages using Navigation).

The server renders `<a href="/login">Iniciar sesión</a>` because `authStore.isAuthenticated` is always `false` during SSR (token lives in `sessionStorage`, unavailable server-side). On the client, after hydration, the store loads the token and `isAuthenticated` becomes `true`, attempting to render `AdminProfileMenu` or the logout button — a different vnode tree (`Symbol(v-fgt)`) than the server produced.

## Root Cause

`packages/frontend/src/components/common/Navigation.vue` line ~63: the `v-if="authStore.isAuthenticated"` / `v-else` block is evaluated during SSR with no access to browser storage, producing a server/client mismatch.

---

## Phase 1: Fix

- [ ] T001 Wrap auth-dependent section in `<ClientOnly>` with `#fallback` rendering the login link in `packages/frontend/src/components/common/Navigation.vue`
- [ ] T002 Verify no hydration warnings in browser console on `/`, `/roster`, `/schedule` when logged in and logged out
- [ ] T003 Verify mobile menu auth section has no hydration mismatch in `packages/frontend/src/components/common/Navigation.vue`

---

## Phase 2: Regression

- [ ] T004 Run existing frontend test suites to confirm no regressions in `packages/frontend/tests/`
