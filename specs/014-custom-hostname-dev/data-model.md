# Data Model: Custom Hostname Dev Access

**Feature**: `014-custom-hostname-dev`  
**Phase**: 1 — Design

---

No data model changes.

This feature modifies **dev server configuration only**:

- `packages/frontend/nuxt.config.ts` — adds `devServer.host` env var read
- `packages/cms/.env.example` — corrects `CORS_ORIGIN` → `CORS_ORIGINS` key name
- `packages/frontend/.env.example` — documents new `NUXT_HOST` variable
- Developer-local `.env.local` files (gitignored) — where the values are set

No new entities, no schema migrations, no state transitions, no validation rules.
