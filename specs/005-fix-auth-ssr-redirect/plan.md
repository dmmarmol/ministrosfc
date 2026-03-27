# Implementation Plan: Fix Auth Middleware SSR Redirect

**Branch**: `fix/auth-ssr-redirect` | **Date**: 2026-03-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `specs/005-fix-auth-ssr-redirect/spec.md`

## Summary

Authenticated users who hard-refresh any protected page (`/admin/**`, `/player/**`) are incorrectly redirected to `/login`. The root cause is that Nuxt 3 route middleware runs on the server during SSR, where Pinia's auth store is always empty (no `localStorage`). The `auth-init.client.ts` plugin that restores state only runs client-side — after the SSR redirect has already been sent.

**Fix**: Add `if (useRuntime().isServer) return` as the first statement in `src/middleware/auth.ts`. This allows the server to deliver the page HTML, after which the client plugin hydrates the store and the middleware re-evaluates with the correct auth state.

## Technical Context

**Language/Version**: TypeScript 5.x (strict mode)
**Primary Dependencies**: Nuxt 3 (SSR enabled), Pinia (`@pinia/nuxt`), `useRuntime()` composable (internal)
**Storage**: N/A — no database or schema changes
**Testing**: Vitest (happy-dom environment) + `vi.mock` for `useRuntime`
**Target Platform**: Browser (client-side Nuxt) + Node.js (SSR Nuxt server)
**Project Type**: Web application (Nuxt 3 SPA/SSR hybrid)
**Performance Goals**: N/A — one-line guard, no measurable overhead
**Constraints**: Must use `useRuntime()` composable per constitution v1.2.0; zero regression on client-side navigation; all existing auth store tests must continue to pass
**Scale/Scope**: 1 source file modified, 1 new test file, 1 config line changed

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
│   └── middleware/
│       └── auth.ts                 ← MODIFY: add useRuntime().isServer guard (1 line)
├── tests/
│   └── middleware/
│       └── auth.test.ts            ← NEW: Vitest unit tests for all middleware branches
└── vitest.config.ts                ← MODIFY: remove src/middleware/** from coverage exclusions
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

### ADR-002: Remove middleware from Vitest coverage exclusions

**Context**: `vitest.config.ts` currently excludes `src/middleware/**` from coverage.

**Decision**: Remove the exclusion so the new middleware tests register against coverage thresholds.

**Consequences**:

- ✅ Coverage now accurately reflects the real test surface
- `src/plugins/**` remains excluded (client-only plugins can't run in happy-dom)

## Implementation Phases

### Phase 1 (TDD — RED): Write failing tests

Create `packages/frontend/tests/middleware/auth.test.ts` covering:

| Test case                                                   | Expected behaviour                                                  |
| ----------------------------------------------------------- | ------------------------------------------------------------------- |
| `isServer: true` (any route)                                | Returns `undefined`; `navigateTo` never called                      |
| `isServer: false`, unauthenticated, `/admin/dashboard`      | Redirects to `/login?redirect=%2Fadmin%2Fdashboard`                 |
| `isServer: false`, unauthenticated, `/player/games`         | Redirects to `/login?redirect=%2Fplayer%2Fgames`                    |
| `isServer: false`, authenticated ADMIN, `/admin/dashboard`  | No redirect (returns `undefined`)                                   |
| `isServer: false`, authenticated PLAYER, `/admin/dashboard` | Redirects to `/`                                                    |
| `isServer: false`, authenticated user on `/login`           | Redirects to `/admin/dashboard` (ADMIN) or `/player/games` (PLAYER) |

### Phase 2 (TDD — GREEN): Implement the guard

In `src/middleware/auth.ts`:

1. Import `useRuntime` from `~/composables/useRuntime`
2. Add `if (useRuntime().isServer) return` as the first line of the middleware handler

### Phase 3: Update vitest.config.ts

Remove `"src/middleware/**"` from the `coverage.exclude` array.

### Phase 4: Verify

- Run `npx vitest run` in `packages/frontend` — all tests green ✅
- Manual: log in, hard-refresh `/admin/dashboard` — stays on page ✅
