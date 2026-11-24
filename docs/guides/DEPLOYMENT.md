# Deployment runbook

How Ministros FC is built, deployed, rolled back and operated in **DEV** and **PRO** (production). This is the single source of truth for rebuilding the environments from the repository. It lists secret **names** and procedures only; no secret values belong in the repository, workflows, images or this document.

Related design documents: [`specs/022-first-production-release`](../../specs/022-first-production-release/) (spec, plan, contracts, quickstart).

> Steps marked **(owner)** need an account the repository cannot reach (Fly, Neon, Upstash, GitHub settings). Everything else is automated by the repository.

## 1. Architecture

| Piece | What | Where it runs |
|---|---|---|
| Frontend | Nuxt 4 site (public pages + admin) from `packages/frontend` | Fly.io app |
| CMS | Express API from `packages/cms` | Fly.io app |
| Shared | Types and utilities from `packages/shared` | Not deployed; compiled into the other two at build time |
| Database | PostgreSQL | Neon (branches `production` and `dev`) |
| Cache | Redis | Upstash `ministrosfc-prod` (production only) |
| Photo storage | Cloudinary | Deferred past launch (not configured) |
| CI/CD | GitHub Actions | `.github/workflows/` |

Traffic: browser → frontend (SSR) → CMS (`NUXT_PUBLIC_API_BASE_URL`) → Neon / Upstash. The browser also calls the CMS directly, so the CMS allows the frontend's origin through CORS.

## 2. Environments

| | DEV | PRO |
|---|---|---|
| Fly apps | `ministrosfc-cms-dev`, `ministrosfc-frontend-dev` | `ministrosfc-cms`, `ministrosfc-frontend` |
| Fly config | `packages/{cms,frontend}/fly.development.toml` | `packages/{cms,frontend}/fly.production.toml` |
| URLs | `https://<app>.fly.dev` | `https://<app>.fly.dev` |
| `APP_ENV` | `development` | `production` |
| GitHub environment | `development` | `production` (restrict to `main`) |
| Deployed by | push to `develop`, or manual dispatch | push to `main` |
| Neon branch | `dev` | `production` |
| Redis | none (`REDIS_DISABLED=true`) | Upstash `ministrosfc-prod` |
| Photo uploads | off | off at launch |
| Scaling | scale to zero | scale to zero (revisit after a month of data) |
| Crawlers | blocked (`Disallow: /`, `noindex`) | allowed on public routes |

Both CMS apps run the production build, so `NODE_ENV=production` everywhere; `APP_ENV` tells them apart.

## 3. Settings and secrets

Public, non-secret settings live in the Fly files. **Secrets** are set with `flyctl secrets set` (Fly) or stored as GitHub environment secrets. Never commit a value.

### CMS

| Name | Kind | Stored in | Required | Purpose / notes |
|---|---|---|---|---|
| `APP_ENV` | public | Fly file | yes | `development` or `production` |
| `CORS_ORIGINS` | public | Fly file | yes | Frontend origin; production must be HTTPS, no localhost |
| `FRONTEND_URL`, `GOOGLE_REDIRECT_URI` | public | Fly file | yes | OAuth redirects; match the environment's addresses |
| `DATABASE_URL` | **secret** | Fly secret | yes | Neon **pooled** connection string (runtime) |
| `DIRECT_URL` | **secret** | Fly secret | recommended | Neon **direct** string, used only by the migration release command; falls back to `DATABASE_URL` |
| `JWT_SECRET` | **secret** | Fly secret | yes | 64+ random characters, unique per environment. Rotation logs everyone out |
| `REDIS_URL` | **secret** | Fly secret | PRO | Upstash `rediss://` URL |
| `REDIS_DISABLED` | public | Fly file | DEV | `true` makes the cache a no-op; rejected in production |
| `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` | **secret** | Fly secret | if Google sign-in is used | |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | **secret** | Fly secret | not at launch | All three or none; enables photo upload |

### Frontend

All frontend settings are public (`APP_ENV`, `NUXT_PUBLIC_API_BASE_URL`, `NUXT_PUBLIC_APP_URL`, ports) and live in its Fly file.

### GitHub environment secrets (`development`, `production`)

| Name | Purpose |
|---|---|
| `FLY_API_TOKEN` | Lets the workflows deploy that environment's apps. It must be able to deploy **both** apps of the environment. Prefer the narrowest scope your Fly plan offers (check `flyctl tokens create --help`); an organization token reaches every app in the organization |
| `CMS_APP_NAME` | Used only by the seed/reset scripts |
| `CMS_ADMIN_EMAIL`, `CMS_ADMIN_PASSWORD` | Used only by the seed workflow; injected at run time, never printed |

**Rotation:** change the value at its source, update the Fly secret or GitHub secret, then redeploy (or restart) the app. Rotate `FLY_API_TOKEN`, database and Redis passwords at least once a year and immediately after any suspected exposure.

## 4. External accounts and what they are for

| Account | Used for | Free-tier caution |
|---|---|---|
| Fly.io | Hosts four apps | Shared 1 vCPU / 512 MB machines; scale to zero keeps cost low |
| GitHub | Source, CI/CD, environments and secrets | Actions minutes are generous for this repo |
| Neon | PostgreSQL (`production`, `dev` branches) | Monthly compute allowance is shared by branches; an always-touched database never suspends and exhausts it (see section 8) |
| Upstash | Redis for production | Command-count limits; cache usage here is small |
| Cloudinary | Player and profile photo storage | **Deferred.** Account kept; not required for launch |

## 5. Pipeline

| Workflow | Trigger | Does |
|---|---|---|
| `CMS CI`, `Frontend CI` | pull requests; pushes to other branches | Tests only |
| `Deploy` | push to `develop` (DEV), push to `main` (PRO), manual dispatch (DEV only) | Tests the changed apps, deploys them, smoke-tests, rolls back on failure |
| `Rollback` | manual | Restores an earlier release image of one app |
| `Seed CMS Admin` | manual; after a successful **development** deploy | Creates or updates the admin user |
| `Reset CMS Database` | manual, **development only** | Wipes the DEV database |

How `Deploy` behaves:

1. **decide** picks the environment (`main` → production, otherwise development) and which apps changed since the **last successful deployment on that branch**. Documentation-only changes deploy nothing. Manual dispatch has an `apps` input (`both`, `cms`, `frontend`).
2. Tests run for each changed app and must pass.
3. The **CMS** deploys first. Prisma migrations run as Fly's release command before traffic switches, over `DIRECT_URL` when set; a failing migration aborts the release and the old version keeps serving. A smoke test then calls `/api/v1/health/ready` (database and Redis).
4. The **frontend** deploys next (when changed) and is smoke-tested on `/`, `/roster` and `/robots.txt`.
5. If a smoke test fails after a deploy, the previously live image is redeployed automatically and the run is marked failed.
6. Runs for the same environment queue and never overlap. The run summary shows the environment, app, commit and previous release.

Read results in the repository's **Actions** tab (workflow `Deploy`); the job summary lists what shipped.

## 6. First production bootstrap (owner, one time)

1. **Neon**: create (or restore) the `production` branch database. Copy its **pooled** and **direct** connection strings. Enable scale to zero (autosuspend). Do the same for `dev`.
2. **Upstash**: confirm `ministrosfc-prod` exists; copy its `rediss://` URL.
3. **Fly secrets for `ministrosfc-cms`**: `DATABASE_URL`, `DIRECT_URL`, `JWT_SECRET` (generate 64+ random characters), `REDIS_URL`, and Google credentials if sign-in is used. The frontend app needs no secrets.
4. **GitHub**: create the `production` environment with `FLY_API_TOKEN`, `CMS_APP_NAME`, `CMS_ADMIN_EMAIL`, `CMS_ADMIN_PASSWORD`. Under *Deployment branches* restrict it to `main`; optionally add required reviewers.
5. **DEV Redis check**: run `flyctl secrets list --app ministrosfc-cms-dev`. If a `REDIS_URL` (or `REDIS_HOST`) is present and points at the production Upstash database, unset it so DEV never shares production cache data. DEV runs with `REDIS_DISABLED=true`.
6. **Deploy**: merge to `main`. `Deploy` runs the migrations on the empty production database, deploys CMS then frontend and smoke-tests both.
7. **Create the admin**: run `Seed CMS Admin` for `production` (typed confirmation required). Credentials come from the environment secrets and are never printed.
8. **Verify** as a visitor and as the admin (see the quickstart, section D), then load data (section 9).
9. **Usage alert**: configure it as in section 8.

## 7. Rollback

- **Automatic**: a failed smoke test restores the previous image.
- **Manual**: run `Rollback` with the environment, app, and optionally a release version (default: previous). The production environment's protection rules apply.
- **Emergency by hand** (needs a Fly token):
  - list releases: `flyctl releases --app <app> --image`
  - restore one: `flyctl deploy --app <app> --image <image-ref> --strategy rolling`
  - or use `scripts/deploy/rollback-image.sh previous <app> [version]`.
- **Database migrations are never reverted.** To make an image rollback safe, ship schema changes in two steps (expand/contract): first add columns or tables the old code ignores, deploy, switch the code, and only later remove what is no longer used. A rollback to an image that expects a removed column will fail.

## 8. Database compute budget (Neon)

The free allowance is consumed whenever the database is awake. Causes found in the code and what changed:

| Cause | Change |
|---|---|
| A job queried the database at startup and every 5 minutes, and the CMS machine never slept | No timer. Game statuses sync once at startup and, throttled to once per 5 minutes, when games are read. Both CMS apps scale to zero |
| The health endpoint queried the database and Redis on each call | `/api/v1/health` is dependency-free (used by Fly checks); `/api/v1/health/ready` checks the database and is cached 30 s (used by deploy smoke tests) |
| Every public page view called the API | Public pages are cached for 5 minutes (stale-while-revalidate) |
| Crawlers and bots | DEV blocks crawling and sends `noindex`; abusive crawler user agents get `403`; SSR requests are limited per IP (`429`) |

**Monitoring (owner):** in the Neon console enable the usage notification if your plan offers one, and review the compute-hours graph weekly (monthly at minimum). Aim to stay under 70% of the allowance and let the database suspend during idle windows.

**If the allowance is exhausted:** the database is suspended until it resets. The sites show errors until then. Options: wait for the reset, or temporarily upgrade the plan.

**Verifying the fixes:** compare the usage graph before and after a deployment, leave DEV idle for 6 hours and confirm the compute suspends (quickstart, section C).

## 9. Loading data after launch (CSV import)

Production launches with an empty database and one admin account. Load the club data with the administrator CSV import using files exported from the spreadsheet.

- The import accepts files up to 10 MB each and runs as a background job; the page shows its status.
- **Keep the browser tab open** while it runs: the status polling keeps the machine awake. A job interrupted by the machine stopping resumes the next time the CMS starts.
- Do it in one session and avoid repeating large imports; each import wakes the database for its duration.
- The import is safe to re-run. Check the job report for rejected rows.
- Try it first on DEV with a realistic file.

## 10. Decisions on optional services

- **Redis in DEV**: not used. `REDIS_DISABLED=true` in the DEV Fly file turns the cache into a no-op. This flag is ignored (and rejected at startup) when `APP_ENV=production`.
- **Photo storage**: player and profile photo upload is **deferred** past the first production launch. The Cloudinary account stays, but production does not need it. While the three `CLOUDINARY_*` secrets are unset the admin player form hides the photo input and the API refuses uploads with a clear message. **To enable later:** set the three secrets on the CMS app (`flyctl secrets set ...`); no code change or redeploy of code is needed, only the restart Fly performs after setting secrets.

## 11. Troubleshooting

| Symptom | Likely cause and fix |
|---|---|
| CMS fails to start naming a missing variable | A required setting or secret is missing; add it with `flyctl secrets set` or in the Fly file, then redeploy |
| CMS fails to start about `CORS_ORIGINS` | In production it must contain only HTTPS, non-localhost origins |
| Release fails during migration | The old version keeps serving. Read the release command output (`flyctl logs`); fix the migration and redeploy. Check `DIRECT_URL` is the **direct** Neon endpoint |
| Smoke test fails on `/api/v1/health/ready` | Database or Redis unreachable (Neon suspended and resuming, allowance exhausted, wrong secret). The workflow rolls back automatically |
| Browser shows CORS errors | `CORS_ORIGINS` does not match the frontend's address exactly (scheme, host, no trailing slash) |
| First request after idle is slow | Expected: the app and the database wake from zero |
| `Deploy` did not run | The push touched only documentation or unrelated files, or it was not on `develop` / `main` |
| Public page shows old data | Public pages are cached for up to 5 minutes |
