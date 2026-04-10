# Feature Specification: Fix Auth Middleware SSR Redirect on Page Refresh

**Feature Branch**: `fix/005-auth-ssr-redirect`
**Created**: 2026-03-25
**Updated**: 2026-04-10
**Status**: Implemented
**Type**: Bug Fix + Architecture Improvement

## Root Cause

The `auth` route middleware runs on **both the server and the client** in Nuxt 3 with SSR enabled. On a hard refresh:

1. The server handles the initial HTTP request — `localStorage` and `window` are unavailable.
2. The `auth` middleware executes **server-side**; the Pinia `authStore` is in its empty initial state (`user: null`).
3. `authStore.isAuthenticated` is `false`, so the middleware redirects to `/login` before the HTML ever reaches the browser.
4. The `auth-init.client.ts` plugin (which restores state from `localStorage`) runs **after** the server redirect has already been sent.

The core issue is that auth state is persisted in `localStorage` — a client-only storage — but the route guard runs server-side where that storage is inaccessible.

## Options Considered

| Option                          | Description                                                                                     | Trade-offs                                                                                                                                                                               |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A — Skip on server**          | Return early from middleware when running server-side (`import.meta.server`)                    | Simplest fix. SSR renders the page shell; middleware re-runs client-side with restored state. Zero security regression: protected data is still behind authenticated API calls.          |
| **B — httpOnly cookie session** | Migrate token storage to a server-readable httpOnly cookie; middleware reads cookie server-side | Fully SSR-safe and more secure. Requires API changes (`Set-Cookie` on login/refresh, CSRF protection). Significantly larger scope — better suited as a dedicated auth hardening feature. |

**Decision: Option A, extended with per-page meta policy.** The application is a private team management tool, not a public-facing product. The API enforces auth on every data-returning endpoint regardless of SSR. Option A fixes the UX regression immediately with minimal risk. Option B is deferred to a future auth hardening spec.

During implementation, the middleware was further evolved from a path-prefix approach to a **per-page meta policy** system (see ADR below) to eliminate the tight coupling between the middleware and the page file structure.

---

## User Scenarios & Testing

### User Story 1 — Authenticated user survives a hard refresh (Priority: P1)

A logged-in admin or editor refreshes the browser on any protected page (`/admin/**` or `/player/**`) and lands back on the same page without being redirected to `/login`.

**Why this priority**: This is the direct, observed bug. It breaks every workflow involving page refresh — a fundamental browser operation.

**Independent Test**: Log in as ADMIN, navigate to `/admin/dashboard`, press F5. The dashboard renders; the user is not redirected.

**Acceptance Scenarios**:

1. **Given** a user is authenticated and on `/admin/dashboard`, **When** they perform a hard refresh, **Then** the dashboard page renders and no redirect to `/login` occurs.
2. **Given** a user is authenticated and on `/admin/games`, **When** they perform a hard refresh, **Then** the games page renders and no redirect occurs.
3. **Given** a user is authenticated and on `/player/games`, **When** they perform a hard refresh, **Then** the player games page renders and no redirect occurs.
4. **Given** an unauthenticated user navigates directly to `/admin/dashboard`, **When** the page loads, **Then** they are redirected to `/login?redirect=%2Fadmin%2Fdashboard`.

---

### User Story 2 — Login redirect parameter is preserved through refresh (Priority: P2)

A user who lands on `/login?redirect=/admin/games` after following a direct link while logged out, successfully authenticates and is sent to `/admin/games`.

**Why this priority**: Preserving the `redirect` query parameter ensures users land where they intended after login, not at the dashboard every time.

**Independent Test**: Visit `/admin/games` while logged out; confirm redirect to `/login?redirect=%2Fadmin%2Fgames`; log in; confirm redirect back to `/admin/games`.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user visits `/admin/games`, **When** the middleware runs, **Then** they are redirected to `/login?redirect=%2Fadmin%2Fgames`.
2. **Given** a user is on the login page with `?redirect=%2Fadmin%2Fgames`, **When** they successfully authenticate, **Then** they are redirected to `/admin/games`.

---

### Edge Cases

- An already-expired token is stored in `localStorage`: middleware skips on server (Option A), client restores user into Pinia, first API call returns 401, `$api` plugin triggers `authStore.refresh()`, which fetches a new access token using the stored refresh token. If the refresh token is also expired, the user is logged out and redirected to `/login`.
- `localStorage` is cleared mid-session (private browsing, manual clear): on the next hard refresh, `loadFromStorage()` finds nothing, `isAuthenticated` is `false` on the client re-evaluation after hydration, and the middleware correctly redirects to `/login`.
- A PLAYER-role user navigates to `/admin/**`: the middleware (now running client-side on first load) correctly redirects to `/` due to the `requiresRole: "editor"` meta check.
- A page that declares no auth meta at all (e.g. public game detail page) is passed through unconditionally by the middleware.

---

## Requirements

### Functional Requirements

- **FR-001**: The `auth` middleware MUST skip all redirect logic when executing in a server-side rendering context, allowing the page to be delivered to the browser.
- **FR-002**: The `auth` middleware MUST continue to enforce access control on client-side navigation (Vue Router transitions).
- **FR-003**: The `auth-init.client.ts` plugin MUST restore `user` and `refreshToken` from `sessionStorage` before the middleware re-evaluates on the client after hydration.
- **FR-004**: Unauthenticated direct-URL access MUST still redirect to `/login` with the `redirect` query parameter preserved (client-side enforcement).
- **FR-005**: The fix MUST NOT remove or weaken any existing role-based access checks (`isEditor`, `isAdmin`).
- **FR-006**: Each page MUST declare its own auth policy via `definePageMeta` using the meta keys defined below. The middleware MUST read policy exclusively from page meta — no path-prefix pattern matching.
- **FR-007**: A TypeScript declaration file MUST extend Nuxt's `PageMeta` interface so that all custom meta keys are type-checked at compile time.

### Page Meta Keys

| Key | Type | Meaning |
|-----|------|---------|
| `requiresAuth` | `boolean` | Any authenticated user can access this page |
| `requiresRole` | `"editor" \| "admin"` | Only users with the specified role can access |
| `authPage` | `boolean` | Login/register pages — redirect away if already authenticated |
| `onboardingPage` | `boolean` | Onboarding page — skips the incomplete-profile redirect |
| `skipOnboardingCheck` | `boolean` | Bypass the incomplete-profile redirect for pages like `/profile/player` |

---

## Success Criteria

### Measurable Outcomes

- **SC-001**: A logged-in user who performs a hard refresh on any protected page is NOT redirected to `/login`. Verified by Vitest unit test mocking `import.meta.server = true` and `import.meta.server = false` states.
- **SC-002**: An unauthenticated user who navigates directly to a protected URL is redirected to `/login`. Verified by existing or updated unit test.
- **SC-003**: Zero regressions in the existing `tests/stores/auth.test.ts` and `tests/e2e/admin-flow.spec.ts` suites after the change.

---

## Assumptions

- The project is not deployed behind an SSR edge that requires full server-side auth session validation.
- The existing `auth-init.client.ts` plugin correctly restores state for client-side navigation — this fix makes it relevant for hard refreshes by ensuring the server pass-through delivers a page for the plugin to run on.
- httpOnly cookie migration (Option B) is out of scope for this fix and tracked separately.
