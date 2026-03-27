# Quickstart: Fix Auth Middleware SSR Redirect

## What this fix does

Adds a single SSR guard to `packages/frontend/src/middleware/auth.ts` so that hard-refreshing any protected page no longer redirects authenticated users to `/login`.

## Implementation (single file change)

```ts
// packages/frontend/src/middleware/auth.ts
import { navigateTo } from "nuxt/app";
import { useAuthStore } from "../stores/auth";
import { useRuntime } from "~/composables/useRuntime";

export default defineNuxtRouteMiddleware((to) => {
  // Skip all access checks during SSR — auth state lives in localStorage,
  // which is unavailable server-side. The auth-init.client.ts plugin restores
  // it before this middleware re-runs on the client.
  if (useRuntime().isServer) return;

  const authStore = useAuthStore();
  // ... rest of middleware unchanged
});
```

## Test (new file)

```
packages/frontend/tests/middleware/auth.test.ts
```

TDD cycle:

1. Write failing tests covering:
   - SSR context → middleware returns without redirecting (FR-001)
   - Unauthenticated client → redirects to `/login?redirect=<path>` (FR-004)
   - Authenticated ADMIN on `/admin/**` → no redirect (FR-002)
   - Authenticated PLAYER on `/admin/**` → redirects to `/` (FR-005)
   - Authenticated user on `/login` → redirects to dashboard (FR-002)
2. Implement the one-line guard in `auth.ts`
3. All tests green

## Verification

### Manual

1. `npm run dev:all` from repo root
2. Log in as ADMIN in the browser
3. Navigate to `/admin/dashboard`
4. Press F5 (hard refresh) — page should stay on `/admin/dashboard`, NOT redirect to `/login`

### Automated

```bash
cd packages/frontend
npx vitest run tests/middleware/auth.test.ts
```

## Coverage note

`vitest.config.ts` currently excludes `src/middleware/**` from coverage. Remove that exclusion so the new tests register against coverage thresholds.
