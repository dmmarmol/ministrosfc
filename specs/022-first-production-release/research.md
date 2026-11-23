# Research: First production release and automated production deployment

All design questions from the planning brief were resolved from the repository (workflows, Fly files, Dockerfiles, CMS and frontend code) and the spec's verified Background. External consoles (Neon, Upstash, Fly, GitHub settings) were **not** inspected; anything that depends on them is an owner-run step in the runbook or an explicit "verify" item.

## Decisions

### 1. Production deploy on push to `main`

- **Decision**: Add one orchestrating workflow, `.github/workflows/deploy.yml`, triggered by `push` to `develop` (→ `development` environment) and `main` (→ `production` environment), plus `workflow_dispatch` (development only). Remove the deploy jobs and the `release` trigger from `ci-cms.yml` / `ci-frontend.yml`, which stay as test workflows (pull request, push, and `workflow_call` so `deploy.yml` reuses them).
  - A `decide` job flags each app (`cms`, `frontend`) from `git diff --name-only <base> <sha>` (an app's files, the shared package, root package files, the deploy scripts or `deploy.yml`; docs-only changes flag neither). **Apps deploy separately**: a frontend-only change never re-runs the CMS deploy and its migrations (which would wake Neon). `<base>` is the head of the **last successful Deploy run on the branch** (falling back to the push's `before`), because GitHub replaces older pending runs with newer ones and a per-push diff could otherwise skip an app changed in a replaced run. Manual dispatch can pick `both`, `cms` or `frontend` (development only).
  - Order: test (the changed apps' suites) → deploy CMS (migrations run as the Fly release command) → verify CMS → deploy frontend → verify frontend. The frontend is deployed only after the CMS it calls is healthy.
  - `concurrency: { group: deploy-<environment>, cancel-in-progress: false }` so deployments queue instead of overlapping; the newest merge is deployed last.
  - Guard: the production job runs only when `github.ref == 'refs/heads/main'`; the owner restricts the `production` environment to the `main` branch in GitHub settings (runbook step).
- **Rationale**: Today production is reachable only through a published release and the two apps deploy from separate, unordered workflows. One workflow gives ordering, a single concurrency group, and one place to add verification and rollback.
- **Alternatives considered**: Keep per-app workflows and trigger production from `release` (rejected: contradicts the goal of no human step); `workflow_run` chaining (rejected: harder to reason about failures and concurrency); a third-party paths-filter action (rejected: a 15-line `git diff` script avoids another dependency in a public repo).

### 2. Verification and rollback

- **Decision**:
  - Fly health checks on the liveness endpoint (see 4) are configured in each Fly file so `flyctl deploy` only switches traffic when the new machine is healthy.
  - After each deploy a smoke step calls the readiness endpoint (CMS: database and Redis) and key public pages (frontend: `/`, `/roster`, `/robots.txt`) with retries and a timeout.
  - Before deploying, the workflow records the currently deployed image (`flyctl releases --json`); if the smoke step fails, a rollback step redeploys that image automatically and the job still fails so the owner is notified.
  - A manual `rollback.yml` (`workflow_dispatch`: environment, app, optional version) redeploys a previous release image. The runbook states that **database migrations are not reverted**, and that migrations must be backward compatible with the previous app version (expand/contract) so an image rollback is safe.
- **Rationale**: Image-based rollback is fast and needs no rebuild. Auto-rollback limits downtime when a human is not watching.
- **Alternatives considered**: Blue/green strategy (rejected: needs extra machines and the free budget is tight); never auto-rollback (rejected: production would stay broken until noticed); reversing migrations automatically (rejected: unsafe for data).

### 3. Safe migrations on Neon

- **Decision**: Keep Prisma's single `DATABASE_URL` in the schema (no `directUrl`, so local development, tests and CI are unchanged). The Fly release command runs `prisma migrate deploy` with `DATABASE_URL` overridden by `DIRECT_URL` when that secret exists, falling back to `DATABASE_URL`:
  `sh -c 'DATABASE_URL="${DIRECT_URL:-$DATABASE_URL}" node_modules/.bin/prisma migrate deploy --schema=packages/cms/prisma/schema.prisma'`.
  The runtime uses the pooled Neon endpoint in `DATABASE_URL` (with the pooler options Prisma needs and a small `connection_limit`); migrations use the direct endpoint in `DIRECT_URL`. The owner sets both as Fly secrets (runbook).
- **Rationale**: Migrations take advisory locks and use session features that do not work reliably through a pooler. Overriding in the release command avoids a `schema.prisma` change that would force `DIRECT_URL` into every local, test and CI environment.
- **Alternatives considered**: `directUrl` in the schema (rejected: ripple effects on every environment and the Jest setup); running migrations from GitHub Actions (rejected: would need the production database URL as a GitHub secret and a network path from runners).

### 4. Why the Neon allowance is exhausted, and the fixes

Evidence found in the code:

| Source | Evidence | Fix |
|---|---|---|
| Background job | `main.ts` runs `runGameStatusTransitions` at startup and every 5 minutes (`setInterval`), two `updateMany` queries each time | Remove the interval. Run once at startup and from a throttled hook on game-read requests (at most once per 5 minutes per process). Idle machines then touch the database zero times. |
| Always-on machine | `fly.toml`: `min_machines_running = 1`, shared by DEV and PRO | Per-environment Fly files; both CMS apps use `min_machines_running = 0` and auto-stop. Revisit PRO after a month of usage data. |
| Health endpoint | `GET /api/v1/health` runs `SELECT 1` and a Redis `PING` on every call | Split into a dependency-free liveness endpoint (used by Fly checks) and a readiness endpoint (database + Redis, result cached for 30 s, used only by deploy smoke tests). |
| Public page views | Each SSR page view calls the API and so the database | Nitro `routeRules` stale-while-revalidate (5 min) for public pages; `/admin/**`, `/profile/**`, `/login`, `/register`, `/auth/**` are never cached. Verify SSR output does not depend on per-user state (the navigation already renders auth state client-side). |
| Bots and crawlers | `robots.txt` exists but is static and the same in every environment | `robots.txt` per `APP_ENV` (DEV: `Disallow: /`), `X-Robots-Tag: noindex, nofollow` on DEV, a small deny-list for abusive crawler user agents, and a generous per-IP rate limit on SSR routes. The CMS already rate-limits `/api` (100 requests per 15 minutes per IP). |
| No visibility | No usage alert | Owner-run runbook step: usage notification in the Neon console plus a monthly review. |

The suspension and 7-day reset cannot be influenced from the repository; the owner waits for the reset or upgrades temporarily.

- **Hypothesis ranking**: the interval job plus always-on machine is the most likely dominant cause (a wake-up every 5 minutes on two branches means the database never sleeps). Bots and the health endpoint are secondary. Confirm in the Neon console (usage over time, connection sources) before and after the change; this is a validation step in `quickstart.md`.

### 5. Per-environment Fly configuration

- **Decision**: Replace the shared `fly.toml` files with `packages/cms/fly.development.toml`, `fly.production.toml` and the same two for `packages/frontend`. Each file sets `app`, scaling, health checks and the **non-secret** environment (`APP_ENV`, `CORS_ORIGINS`, `NUXT_PUBLIC_API_BASE_URL`, `NUXT_PUBLIC_APP_URL`, ports). Workflows pick the file by environment and no longer need the `CMS_APP_NAME` / `FRONTEND_APP_NAME` secrets for deploys (they remain for the seed/reset scripts). Secrets (`DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET`, `REDIS_URL`, etc.) stay in Fly secrets.
- **Rationale**: Differences between DEV and PRO become explicit, reviewable code; public URLs and CORS origins are not secrets and belong in the repository.
- **Alternatives considered**: One file with `--app` overrides (current; rejected: scaling and URLs cannot differ); templating at deploy time (rejected: extra moving parts).

### 6. No `.env` files in images

- **Decision**: Remove the `COPY packages/cms/.env*` and `COPY .env*` lines from the CMS Dockerfile. Both `.dockerignore` files already exclude `.env*`, so today the lines copy nothing; removing them closes the gap if an ignore rule ever changes. Add a Jest test that fails if a Dockerfile copies `.env*` or a `.dockerignore` stops excluding it.
- **Rationale**: Defense in depth for a public repository with a remote builder.

### 7. Photo storage optional at launch

- **Decision**: Introduce `APP_ENV` (`development` | `production`, set in each Fly file; `NODE_ENV` is `production` on both because both run the production build). Cloudinary variables are no longer required by `validateEnv`; a partially filled set is rejected ("incomplete photo storage configuration"). `object-storage.ts` exposes `isPhotoStorageConfigured()`; upload functions throw a 503 application error with a Spanish message when it is not configured. A public, dependency-free `GET /api/v1/config` returns `{ photoUploadsEnabled }`; the frontend hides the photo input in the admin player form when it is false.
- **Rationale**: Production must boot without the unused account; unchanged behavior when credentials exist, so enabling photos later is a secrets-only change.
- **Alternatives considered**: Keep Cloudinary required and create credentials (rejected: owner decision to defer); remove photo upload code (rejected: the feature is only deferred).

### 8. Redis for DEV

- **Decision**: Add `REDIS_DISABLED=true`, honored only when `APP_ENV` is not `production`, which makes the existing no-op Redis client (already used for `NODE_ENV` development/test) available on DEV, and make `validateEnv` accept it. Production still requires `REDIS_URL`. The DEV Fly file sets `REDIS_DISABLED=true`.
- **Owner check (runbook)**: the DEV CMS passes validation today, so it has `REDIS_URL` or host/port secrets set. If they point at the production Upstash database, unset them so DEV never shares production cache data.
- **Alternatives considered**: A second Upstash database for DEV (rejected: unnecessary for a low-traffic DEV; can be added later by setting `REDIS_URL`).

### 9. Destructive workflows

- **Decision**: `reset-cms-db.yml` loses the `production` option and its job has `if: inputs.environment == 'development'`; `scripts/seed-admin/reset-cms-db.sh` additionally refuses unless the app name ends in `-dev`. `seed-cms-admin.yml` keeps `production` (needed once at launch to create the first admin) but, for production, requires a typed confirmation input and the `production` environment (owner configures required reviewers), never echoes credentials, and no longer chains automatically after production deployments (the `workflow_run` seeding stays development-only). All workflows declare least-privilege `permissions: contents: read`; `superfly/flyctl-actions/setup-flyctl` is pinned to a released version instead of `@master`; deployments run only on `push`, so fork pull requests never receive secrets.
- **Rationale**: Closes the one-click path to wiping production while keeping the launch bootstrap possible.

### 10. CORS and public URLs

- **Decision**: Per-environment values live in the Fly files (see 5). `validateEnv` gains a production rule: when `APP_ENV=production`, `CORS_ORIGINS` must be set and must not contain `localhost` or `http://` origins. Default addresses are the Fly hostnames (`https://ministrosfc-frontend.fly.dev`, `https://ministrosfc-cms.fly.dev`); a custom domain is out of scope.
- **Rationale**: A misconfigured origin is one of the most common first-deploy failures, and it can be caught at startup.

### 11. CSV import on production

- **Decision**: No functional change expected. The import route already enforces a 10 MB per-file limit and returns 202 with a durable job (`ImportJobService`, with `recoverInterruptedJobs` at startup), so a request timeout does not lose rows. Validate with a realistic file on DEV before launch. Risks recorded in the runbook: Fly can stop an idle machine while a job is running (the UI's status polling keeps the machine awake; an interrupted job resumes on the next start), and a first import will wake the database for its duration. If validation shows jobs interrupted by auto-stop, add a graceful-shutdown wait for the running job in a follow-up task.
- **Alternatives considered**: Raising limits or streaming uploads (rejected: no evidence they are needed for spreadsheet-sized files).

### 12. Supply-chain and secret hygiene (constitution)

- **Decision**: No secret values in the repository, workflows or images; deploy tokens are scoped per app (`fly tokens create deploy`) and stored as environment secrets (`development`, `production`); documentation lists names, purpose, owner, location and rotation only. A repository check (existing pre-commit secret scan plus a Jest test for Dockerfile hygiene) enforces this.

## Open items for the owner (not blocking planning)

- Confirm the DEV CMS Redis secrets and unset any that point at the production Upstash database.
- Create the Neon pooled and direct connection strings for each branch and set `DATABASE_URL` / `DIRECT_URL` as Fly secrets.
- Create per-app Fly deploy tokens, set GitHub environment secrets, restrict `production` to `main`, and add required reviewers if wanted.
- Configure a Neon usage alert.
