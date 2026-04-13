# Implementation Plan: Fix Auth Middleware SSR Redirect

**Branch**: `fix/005-auth-ssr-redirect` | **Date**: 2026-03-25 | **Updated**: 2026-04-10 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/005-fix-auth-ssr-redirect/spec.md`
**Status**: Implemented

## Summary

Authenticated users who hard-refresh any protected page (`/admin/**`, `/profile/**`) were incorrectly redirected to `/login`. The root cause is that Nuxt 3 route middleware runs on the server during SSR, where Pinia's auth store is always empty (no `sessionStorage`). The `auth-init.client.ts` plugin that restores state only runs client-side — after the SSR redirect has already been sent.

**Fix**: Add `if (useRuntime().isServer) return` as the first statement in `src/middleware/auth.ts`. This allows the server to deliver the page HTML, after which the client plugin hydrates the store and the middleware re-evaluates with the correct auth state.

**Evolution**: The middleware was further refactored from a path-prefix pattern approach to a **per-page meta policy** system. Each page declares its own auth requirements in `definePageMeta`; the middleware reads those meta keys and enforces policy accordingly. This eliminates path-prefix coupling and makes each page's access control self-documenting.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Nuxt 3 (SSR enabled), Pinia (`@pinia/nuxt`), `useRuntime()` composable (internal)
**Storage**: N/A — no database or schema changes
**Testing**: Vitest (happy-dom environment) + `vi.mock` for `useRuntime`
**Target Platform**: Browser (client-side Nuxt) + Node.js (SSR Nuxt server)
**Project Type**: Web application (Nuxt 3 SPA/SSR hybrid)
**Performance Goals**: N/A — lightweight meta lookup, no measurable overhead
**Constraints**: Must use `useRuntime()` composable per constitution v1.2.0; zero regression on client-side navigation; all existing auth store tests must continue to pass
**Scale/Scope**: `src/middleware/auth.ts` rewritten; 19 pages updated; 1 new TypeScript declaration file added

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Principle                               | Status  | Notes                                                                                     |
| --------------------------------------- | ------- | ----------------------------------------------------------------------------------------- |
| I. Feature-Driven Architecture          | ✅ PASS | Discrete scoped bug fix with clear user impact                                            |
| II. Specification Before Implementation | ✅ PASS | `spec.md` exists and is complete                                                          |
| III. Plan-Driven Implementation         | ✅ PASS | This document                                                                             |
| IV. TDD Quality Gates                   | ✅ PASS | New `tests/middleware/auth.test.ts` written before implementation                         |
| V. Component Isolation                  | ✅ PASS | Change isolated to `src/middleware/auth.ts`; no cross-component coupling introduced       |
| VI. Data Flow and State Management      | ✅ PASS | SSR renders page shell; client plugin hydrates store; guard doesn't change data flow      |
| Testing Tooling (v1.2.0)                | ✅ PASS | Uses `useRuntime()` composable; guard is `useRuntime().isServer` not `import.meta.server` |

**No gate violations. No complexity tracking required.**

## Project Structure

### Documentation (this feature)

```text
specs/005-fix-auth-ssr-redirect/
├── plan.md            ← this file
├── spec.md
├── research.md
├── data-model.md
├── quickstart.md
├── checklists/
│   └── requirements.md
└── tasks.md           ← Phase 2 output (speckit.tasks — not yet created)
```

### Source Code (modified files only)

```text
packages/frontend/
├── src/
│   ├── middleware/
│   │   └── auth.ts                     ← REWRITTEN: per-page meta policy enforcement
│   ├── types/
│   │   └── nuxt.d.ts                   ← NEW: extends PageMeta with custom auth keys
│   └── pages/
│       ├── login.vue                   ← authPage: true
│       ├── auth/onboarding.vue         ← requiresAuth: true, onboardingPage: true
│       ├── profile/index.vue           ← requiresAuth: true
│       ├── profile/player.vue          ← requiresAuth: true, skipOnboardingCheck: true
│       ├── games/[slug]/signup.vue     ← requiresAuth: true
│       └── admin/**/*.vue (14 files)   ← requiresAuth: true, requiresRole: "editor"
├── tests/
│   └── middleware/
│       └── auth.test.ts                ← NEW: Vitest unit tests for all middleware branches
└── vitest.config.ts                    ← MODIFY: remove src/middleware/** from coverage exclusions
```

**Structure Decision**: Single-package frontend modification. No new packages, modules, or abstractions needed.

## Architecture Decision Record

### ADR-001: Server-skip guard over httpOnly cookie migration

**Context**: Auth state is in `localStorage`; SSR middleware can't read it.

**Decision**: Add `if (useRuntime().isServer) return` at the top of `auth.ts`.

**Consequences**:

- ✅ Zero API changes required
- ✅ Zero security regression — protected data still requires authenticated API calls
- ✅ Works without any infrastructure changes
- ⚠️ SSR does not validate auth before sending the page shell (acceptable for a private team tool)
- httpOnly cookie approach (Option B) deferred — tracked separately as a future auth hardening feature

### ADR-001: Server-skip guard over httpOnly cookie migration

**Context**: Auth state is in `sessionStorage`; SSR middleware can't read it.

**Decision**: Add `if (useRuntime().isServer) return` at the top of `auth.ts`.

**Consequences**:

- ✅ Zero API changes required
- ✅ Zero security regression — protected data still requires authenticated API calls
- ✅ Works without any infrastructure changes
- ⚠️ SSR does not validate auth before sending the page shell (acceptable for a private team tool)
- httpOnly cookie approach (Option B) deferred — tracked separately as a future auth hardening feature

### ADR-002: Per-page meta policy over path-prefix pattern matching

**Context**: The original middleware used path-prefix checks (`/admin/`, `/profile/`, etc.) to determine which pages required auth. Adding a new protected page required updating the middleware itself.

**Decision**: Rewrite the middleware to read policy exclusively from Nuxt's `to.meta` (set via `definePageMeta` on each page). Each page declares its own requirements using typed meta keys: `requiresAuth`, `requiresRole`, `authPage`, `onboardingPage`, `skipOnboardingCheck`.

**Consequences**:

- ✅ Each page is self-documenting — its access policy is visible right where the component is defined
- ✅ Adding a new protected page requires zero changes to the middleware
- ✅ TypeScript type safety via `src/types/nuxt.d.ts` extending Nuxt's `PageMeta` interface
- ✅ Eliminates risk of path-prefix typos silently leaving pages unprotected
- ⚠️ A developer forgetting to add `requiresAuth: true` to a new page leaves it unprotected (mitigated by the type declaration making the keys discoverable)

### ADR-003: Remove middleware from Vitest coverage exclusions

**Context**: `vitest.config.ts` previously excluded `src/middleware/**` from coverage.

**Decision**: Remove the exclusion so the new middleware tests register against coverage thresholds.

**Consequences**:

- ✅ Coverage now accurately reflects the real test surface
- `src/plugins/**` remains excluded (client-only plugins can't run in happy-dom)

## Implementation Phases

### Phase 1 (TDD — RED): Write failing tests

Create `packages/frontend/tests/middleware/auth.test.ts` covering:

| Test case                                                                                               | Expected behaviour                                      |
| ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `isServer: true` (any route)                                                                            | Returns `undefined`; `navigateTo` never called          |
| `isServer: false`, unauthenticated, page with `requiresAuth: true`                                      | Redirects to `/login?redirect=<path>`                   |
| `isServer: false`, unauthenticated, public page (no meta)                                               | No redirect                                             |
| `isServer: false`, authenticated ADMIN, page with `requiresAuth: true`                                  | No redirect                                             |
| `isServer: false`, authenticated PLAYER, page with `requiresRole: "editor"`                             | Redirects to `/`                                        |
| `isServer: false`, authenticated user, page with `authPage: true`                                       | Redirects to `/admin/dashboard` (ADMIN) or `/` (PLAYER) |
| `isServer: false`, unauthenticated, page with `authPage: true`                                          | No redirect                                             |
| `isServer: false`, authenticated, needs onboarding, page without `onboardingPage`/`skipOnboardingCheck` | Redirects to `/auth/onboarding`                         |

### Phase 2 (TDD — GREEN): Implement the middleware

Rewrite `src/middleware/auth.ts`:

1. Import `useRuntime` from `~/composables/useRuntime`
2. Add `if (useRuntime().isServer) return` as the first line
3. Read `to.meta` and cast to the policy shape
4. Enforce `authPage`, `requiresAuth`, onboarding redirect, `requiresRole` in order

### Phase 3: Add TypeScript declarations

Create `src/types/nuxt.d.ts` extending `PageMeta` with all custom meta keys.

### Phase 4: Update all pages

Add the appropriate meta keys to all 19 pages' `definePageMeta` calls.

### Phase 5: Update vitest.config.ts

Remove `"src/middleware/**"` from the `coverage.exclude` array.

### Phase 6: Verify

- Run `npx vitest run` in `packages/frontend` — all tests green ✅
- Manual: log in, hard-refresh `/admin/dashboard` — stays on page ✅
- Manual: log out, navigate to `/games/:slug/signup` — redirects to `/login?redirect=...` ✅
