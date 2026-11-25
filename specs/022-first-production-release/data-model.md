# Data Model: First production release and automated production deployment

This feature changes **no database tables, columns or migrations**. The entities below describe configuration and operational objects the implementation and runbook must keep consistent.

## Environment

| Field | DEV | PRO |
|---|---|---|
| `APP_ENV` | `development` | `production` |
| `NODE_ENV` (both run the production build) | `production` | `production` |
| Fly apps | `ministrosfc-cms-dev`, `ministrosfc-frontend-dev` | `ministrosfc-cms`, `ministrosfc-frontend` |
| Fly config files | `fly.development.toml` | `fly.production.toml` |
| GitHub environment | `development` | `production` (restricted to `main`) |
| Deploy trigger | push to `develop`, manual dispatch | push to `main` |
| Neon branch | `dev` | `production` |
| Redis | disabled (`REDIS_DISABLED=true`) | Upstash `ministrosfc-prod` |
| Photo storage | not configured | not configured at launch (deferred) |
| CMS scaling | scale to zero (`min_machines_running = 0`) | scale to zero (`min_machines_running = 0`), revisit after a month |
| Frontend scaling | scale to zero | scale to zero |
| Crawlers | blocked (`Disallow: /`, `noindex`) | allowed except private routes |

## Setting / Secret

Fields: `name`, `kind` (`secret` or `public-config`), `consumer` (CMS, frontend, pipeline), `environments`, `where stored`, `required when`, `rotation`. The authoritative list is [contracts/environment-variables.md](contracts/environment-variables.md). Rule: secrets are stored only in Fly secrets or GitHub environment secrets; public config lives in the Fly files.

## Deployment

Attributes: `environment`, `commit SHA`, `trigger` (push or manual), `apps deployed` (CMS, frontend), `previous image` (recorded before deploy), `result` (succeeded, failed-rolled-back, failed), `smoke test verdict`. State transitions: `queued → testing → deploying CMS → verifying CMS → deploying frontend → verifying frontend → succeeded`; any failure after a deploy step moves to `rolling back → failed-rolled-back`. Recorded in the workflow run, not in a database.

## Capability flags (runtime)

`photoUploadsEnabled: boolean` — derived from the presence of all three photo storage credentials. Exposed by `GET /api/v1/config` (see [contracts/runtime-endpoints.md](contracts/runtime-endpoints.md)).

## Database allowance

Not stored in the application. Observed in the Neon console; the runbook defines the alert threshold and the monthly review.
