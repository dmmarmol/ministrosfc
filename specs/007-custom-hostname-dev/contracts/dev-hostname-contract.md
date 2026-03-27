# Dev Hostname Contract

**Feature**: `feat/007-custom-hostname-dev`  
**Scope**: Development environment only — not applicable to staging or production

---

## Accepted Origins (CORS Allowlist)

The backend CORS allowlist MUST permit all of the following origins simultaneously when the custom hostname is enabled:

| Origin | Hostname | Port | Status |
|--------|----------|------|--------|
| `http://localhost:5103` | `localhost` | 5103 | Always active (default) |
| `http://localhost.ministrosfc.com:5103` | `localhost.ministrosfc.com` | 5103 | Active when `CORS_ORIGINS` includes it |

**Configuration mechanism**: `CORS_ORIGINS` environment variable (comma-separated string).

```
# packages/cms/.env.local  (gitignored — developer's local override)
CORS_ORIGINS=http://localhost:5103,http://localhost.ministrosfc.com:5103
```

The backend reads this variable on startup; no code change is required to add or remove an origin.

---

## Frontend Dev Server Binding

| Binding | Host | Port | Status |
|---------|------|------|--------|
| Default | `localhost` | 5103 | Active when `NUXT_HOST` is unset |
| Custom hostname | `0.0.0.0` | 5103 | Active when `NUXT_HOST=0.0.0.0` |

When bound to `0.0.0.0`, the Nuxt dev server accepts HTTP requests from all hostnames resolving to `127.0.0.1` on the developer's machine.

**Configuration mechanism**: `NUXT_HOST` environment variable.

```
# packages/frontend/.env.local  (gitignored — developer's local override)
NUXT_HOST=0.0.0.0
```

---

## Backend Direct Access Ports

| Hostname | Port | Notes |
|----------|------|-------|
| `localhost` | 5102 | Always active (Express binds `0.0.0.0` by default) |
| `localhost.ministrosfc.com` | 5102 | Active without config change — backend already listens on all interfaces |

---

## Dev-Only Applicability

This contract applies **exclusively to the development environment**. Production deployments use different CORS policies, TLS termination, and hostname configurations governed by `fly.toml` and deployment secrets.

No production code path is affected by this feature.

---

## Prerequisites (Developer Machine)

The following are prerequisites, not deliverables of this feature:

1. `/etc/hosts` entry: `127.0.0.1 localhost.ministrosfc.com`
2. Local `.env.local` files created at `packages/cms/.env.local` and/or `packages/frontend/.env.local` containing the values above

Both of these are developer-local operations and are not committed to version control.
