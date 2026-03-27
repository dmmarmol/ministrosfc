# Data Model: Fix Auth Middleware SSR Redirect

**Feature**: 005-fix-auth-ssr-redirect
**Date**: 2026-03-25

## Scope

This bug fix introduces no new entities, no schema changes, and no state shape changes.

The auth Pinia store (`AuthState`) is unchanged:

```ts
interface AuthState {
  user: UserInfo | null; // set on login, cleared on logout
  accessToken: string | null; // short-lived JWT; NOT persisted to localStorage
  refreshToken: string | null; // long-lived token; persisted to localStorage
}
```

The `UserInfo` shape is also unchanged:

```ts
interface UserInfo {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "EDITOR" | "PLAYER";
}
```

## State Lifecycle (unchanged)

```
Browser boot (hard refresh)
  │
  ├── SSR: Pinia initialises empty (user: null)
  │        auth middleware runs → NEW: returns early, no redirect
  │        Server sends page HTML to browser
  │
  └── Client: auth-init.client.ts plugin runs
               loadFromStorage() → sets user + refreshToken from localStorage
               Vue hydration completes
               Client-side route middleware re-evaluates with hydrated store
               → authenticated: stay on page
               → unauthenticated: redirect to /login?redirect=<path>
```

## No Database Changes

This fix has zero impact on the Prisma schema or any CMS data model.
