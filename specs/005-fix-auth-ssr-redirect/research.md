# Research: Fix Auth Middleware SSR Redirect

**Feature**: 005-fix-auth-ssr-redirect
**Date**: 2026-03-25
**Status**: Complete — no NEEDS CLARIFICATION items

---

## Finding 1: How Nuxt 3 route middleware execution order works

**Decision**: Use `useRuntime().isServer` guard as the first statement in the middleware.

**Rationale**:
Nuxt 3 `defineNuxtRouteMiddleware` runs on **both server and client** for SSR-enabled apps. On a hard refresh the execution order is:

1. Server receives HTTP request
2. Server executes all matching route middleware (Pinia store is empty — no localStorage)
3. Server sends the redirect response (or the page HTML)
4. Browser receives response; client-side Vue/Nuxt boots
5. **`.client.ts` plugins** run (`auth-init.client.ts` → `loadFromStorage()`)
6. Client-side middleware re-runs with the now-hydrated Pinia store

Because step 2 happens before step 5, the store is always empty on the first server pass, causing an unconditional redirect to `/login`. The fix is to skip the redirect logic during server-side execution so the page HTML reaches the browser and the client bootstrap can run.

**Returning `undefined`** (plain `return`) from `defineNuxtRouteMiddleware` is the documented Nuxt pattern to indicate "no navigation required" — it does not trigger any redirect.

**Alternatives considered**:

- **httpOnly cookie session (Option B)**: Would make auth state available server-side, removing the need for the guard. Rejected for this fix as it requires API-level changes (`Set-Cookie`, CSRF protection). Deferred to a future auth hardening spec.
- **`process.server` check**: Equivalent to `import.meta.server` in Node/Nuxt context. Rejected — less idiomatic in Vite/Nuxt 3 and would bypass the `useRuntime()` constitution requirement.

---

## Finding 2: Correct composable to use for the guard

**Decision**: `useRuntime().isServer` (from `src/composables/useRuntime.ts`).

**Rationale**:
Constitution v1.2.0 mandates that `import.meta.client` / `import.meta.server` MUST NOT be used directly in `packages/frontend` source code. `useRuntime()` is the required abstraction. This is also the correct pattern for testability — the vitest suite mocks `~/composables/useRuntime` via `vi.mock()` rather than monkeypatching `import.meta`.

**Alternatives considered**:

- Direct `import.meta.server`: Violates constitution v1.2.0. Also not mockable in Vitest without the `nuxtMetaShimPlugin` (which replaces it with a compile-time literal, making it impossible to toggle in a test).

---

## Finding 3: Middleware registration pattern (per-page, not global)

**Decision**: No change needed to `nuxt.config.ts` or middleware registration.

**Rationale**:
Inspecting `nuxt.config.ts` confirms there is no global middleware registration. The `auth` middleware is applied per-page via `definePageMeta({ middleware: 'auth' })` in each protected page. This means:

- The fix applies consistently everywhere the middleware is used
- No global registration risk

---

## Finding 4: Test strategy for the middleware

**Decision**: Create `packages/frontend/tests/middleware/auth.test.ts` that mocks `useRuntime` and `useAuthStore` to test all middleware branches.

**Rationale**:
The existing `vitest.config.ts` has a `nuxtMetaShimPlugin` that compiles `import.meta.server` → `false` at build time. The current `vitest.config.ts` also **excludes** `src/middleware/**` from coverage thresholds. The new tests are necessary to:

1. Verify the SSR guard actually skips navigation (SC-001)
2. Verify unauthenticated redirect still works client-side (SC-002)
3. Verify role-based redirects are not regressed (FR-005)

`useRuntime` is mockable via `vi.mock('~/composables/useRuntime', ...)` returning `{ isServer: true }` or `{ isServer: false, isClient: true }` as needed.

Nuxt globals (`navigateTo`, `defineNuxtRouteMiddleware`, `useRoute`) must be stubbed with `vi.stubGlobal()` — the same pattern used in `auth.test.ts` for `$fetch` and `useRuntimeConfig`.

**Alternatives considered**:

- E2E Playwright test only: Would require a running dev server. Acceptable for regression coverage but not for TDD red-green cycle. Unit test is preferred and faster.
- Update `auth.test.ts` (store tests) to cover middleware: Wrong layer. The store test covers store actions. The middleware test belongs in its own file.

---

## Finding 5: Coverage exclusion update

**Decision**: Remove `src/middleware/**` from coverage exclusions in `vitest.config.ts`.

**Rationale**:
The current config explicitly excludes `src/middleware/**` from coverage. Since we are adding tests for `auth.ts`, this exclusion should be removed so the new tests count toward coverage thresholds, and the file shows up in coverage reports.

Note: `src/plugins/**` remains excluded since client-only plugins (`auth-init.client.ts`) cannot run in the happy-dom test environment.

---

## Summary Table

| Item                    | Decision                                                 | Status                     |
| ----------------------- | -------------------------------------------------------- | -------------------------- |
| Fix mechanism           | `if (useRuntime().isServer) return` at top of middleware | ✅ Resolved                |
| Composable              | `useRuntime()` per constitution v1.2.0                   | ✅ Resolved                |
| Middleware registration | Per-page; no nuxt.config change                          | ✅ Resolved                |
| Test approach           | New `tests/middleware/auth.test.ts` with `vi.mock`       | ✅ Resolved                |
| Coverage exclusion      | Remove `src/middleware/**` from exclusion list           | ✅ Resolved                |
| Option B (cookies)      | Deferred to future auth hardening spec                   | ✅ Resolved (out of scope) |
