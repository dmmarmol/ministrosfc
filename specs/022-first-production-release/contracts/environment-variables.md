# Contract: Environment variables and secrets

Values are never stored in the repository. "Fly file" means non-secret public config committed in `fly.<environment>.toml`; "Fly secret" means `flyctl secrets set` by the owner; "GitHub env" means an environment secret in the `development` or `production` GitHub environment.

## CMS (`packages/cms`)

| Name | Kind | Where | Required | Notes |
|---|---|---|---|---|
| `APP_ENV` | public config | Fly file | when `NODE_ENV=production` | `development` or `production`; defaults to `development` locally |
| `NODE_ENV` | public config | Fly file | always | `production` on both (production build) |
| `API_PORT` | public config | Fly file | always | `5102` |
| `CORS_ORIGINS` | public config | Fly file | always | Frontend origin(s); production must be HTTPS, no localhost |
| `DATABASE_URL` | secret | Fly secret | always | Neon **pooled** endpoint for runtime |
| `DIRECT_URL` | secret | Fly secret | recommended | Neon **direct** endpoint, used only by the release command; falls back to `DATABASE_URL` |
| `JWT_SECRET` | secret | Fly secret | always | At least 64 random characters; unique per environment |
| `REDIS_URL` | secret | Fly secret | production | Upstash `rediss://` URL |
| `REDIS_DISABLED` | public config | Fly file | DEV only | `true` makes the cache a no-op; ignored when `APP_ENV=production` |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | secret | Fly secret | not at launch | All three or none; enables photo uploads |
| `GOOGLE_*` OAuth settings | secret | Fly secret | if Google sign-in is enabled | Redirect URI must match the environment's API address |

## Frontend (`packages/frontend`)

| Name | Kind | Where | Required | Notes |
|---|---|---|---|---|
| `APP_ENV` | public config | Fly file | always | Drives robots, noindex and cache behavior |
| `NUXT_PUBLIC_API_BASE_URL` | public config | Fly file | always | CMS address for the environment |
| `NUXT_PUBLIC_APP_URL` | public config | Fly file | always | Frontend address for the environment |
| `NODE_ENV`, `PORT`, `HOST` and Nitro port variables | public config | Fly file | always | Already defined |

## Pipeline (GitHub)

See the secrets table in [deployment-pipeline.md](deployment-pipeline.md).

## Rules

- A secret must never appear in a Fly file, workflow file, Dockerfile, documentation or log output.
- Each environment has its own `JWT_SECRET`, database branch and (if used) cache; no value is shared between DEV and PRO.
- The runbook (`docs/guides/DEPLOYMENT.md`) mirrors this table with owner, creation steps and rotation notes.
