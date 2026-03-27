# Research: Custom Hostname Dev Access

**Feature**: `feat/007-custom-hostname-dev`  
**Phase**: 0 — Research  
**Date**: 2026-03-25

---

## Unknown 1 — Nuxt 3 Dev Server Host Binding

**Question**: How to configure Vite/Nuxt to accept requests on `localhost.ministrosfc.com`?

**Decision**: Set `devServer.host` in `nuxt.config.ts` to read from the `NUXT_HOST` env var, defaulting to `localhost`.

```ts
// nuxt.config.ts
devServer: {
  host: process.env.NUXT_HOST ?? 'localhost',
  port: parseInt(process.env.NUXT_PORT ?? '5103', 10),
},
```

A developer enables the custom hostname by setting `NUXT_HOST=0.0.0.0` in their local `.env.local` (gitignored). Binding to `0.0.0.0` makes Vite accept connections from any interface/hostname resolving to `127.0.0.1`, including `localhost.ministrosfc.com`.

**Why `devServer.host` over `vite.server.host`**: `devServer` is the Nuxt 3-canonical key; it maps internally to the Vite dev server host. Using `vite.server.host` also works but is the lower-level escape hatch — `devServer` is preferred for clarity and Nuxt version safety.

**Env var vs `--host` CLI flag**: The `--host` flag is per-invocation. Env var in `.env.local` is persistent and invisible to `dev:all` without the flag, which satisfies FR-004 (no source-code change to enable/disable).

**Alternatives considered**:
- Hardcode `host: '0.0.0.0'` in `nuxt.config.ts` → rejected: would bind to all interfaces in all environments by default, including CI/staging
- Use Nuxt CLI `--host` flag in `dev:all` script → rejected: changes root `package.json` (a source file); violates FR-004

---

## Unknown 2 — Express CORS Allowlist

**Question**: Is adding the new origin to `CORS_ORIGINS` sufficient, or does `server.ts` need code changes?

**Decision**: Environment variable change only — no `server.ts` code change needed.

The existing implementation in `packages/cms/src/config/server.ts` already handles comma-separated origins:

```ts
const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5103")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);
```

Adding `http://localhost.ministrosfc.com:5103` to `CORS_ORIGINS` is fully sufficient.

**Backend host binding**: `app.listen(API_PORT)` in `main.ts` passes no explicit host argument, so Express binds to `0.0.0.0` by default. The backend already accepts TCP connections from any hostname resolving to `127.0.0.1` — no change required.

**Discrepancy found**: `packages/cms/.env.example` uses `CORS_ORIGIN` (singular), but the code reads `CORS_ORIGINS` (plural). The `.env.example` must be updated to match.

**Alternatives considered**:
- Dynamic origin function in `server.ts` using regex → rejected: over-engineering, no benefit over the existing comma-separated list approach

---

## Unknown 3 — Cookie/Session Domain Impact

**Question**: Do JWT cookies or session headers need `domain` changes for the custom hostname?

**Decision**: No changes needed.

The CMS authentication uses JWT tokens transmitted via the `Authorization: Bearer <token>` HTTP header (confirmed by `authRouter` usage of `JWT_SECRET` and `JWT_EXPIRY`). There are no `Set-Cookie` headers for session tokens, so cookie domain scoping is not relevant to API authentication.

Even if cookies were used in a future refactor: `localhost` and `localhost.ministrosfc.com` are different registrable domains, so cookies set without an explicit `domain` attribute would be scoped to the issuing hostname only — no cross-contamination, no breakage. This is a documented limitation (not a bug) for the dev environment.

**Conclusion**: No JWT or auth config changes required for this feature.

---

## Unknown 4 — NUXT_PUBLIC_API_BASE_URL Strategy

**Question**: Does the frontend `.env` need a second variable, or does a single URL work for both hostnames?

**Decision**: Single variable, no change to its value (`http://localhost:5102`).

When a developer accesses the frontend via `localhost.ministrosfc.com:5103`, the browser's `fetch` calls use the `NUXT_PUBLIC_API_BASE_URL` value embedded at runtime. Regardless of which frontend hostname is used, the API calls still target `http://localhost:5102` — which resolves correctly because `localhost` maps to `127.0.0.1` on the developer's machine.

This is cross-origin (different hostnames → different origins), which is exactly why we're allowing `http://localhost.ministrosfc.com:5103` in the backend CORS config. The API URL itself does not need to change.

**Optional**: A developer who prefers full hostname consistency can optionally set `NUXT_PUBLIC_API_BASE_URL=http://localhost.ministrosfc.com:5102` — this works because the backend already listens on `0.0.0.0`. This is documented in quickstart but is not a requirement.

**Alternatives considered**:
- Two separate env vars (`NUXT_PUBLIC_API_BASE_URL_DEFAULT` / `NUXT_PUBLIC_API_BASE_URL_CUSTOM`) → rejected: needless complexity, runtime config doesn't support dynamic switching per hostname
