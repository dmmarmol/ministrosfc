# Implementation notes: First production release (spec 022)

Handoff for anyone returning to this feature. Read after `spec.md` (intent) and `plan.md` / `research.md` (design). The operational procedures live in [`docs/guides/DEPLOYMENT.md`](../../docs/guides/DEPLOYMENT.md).

- **Branch**: `022-first-production-release`
- **Status**: everything that can be done in the repository is done and tested. The steps that need the owner's accounts are still open (see section 5); production has **not** been deployed yet.
- **Release**: version bump and tag are prepared afterwards with the `create-release` skill (task T053).

## 1. What shipped

| Area | Change | Where |
|---|---|---|
| Pipeline | One `Deploy` workflow: push to `main` → production, push to `develop` → development; manual dispatch (development only) with an `apps` choice. Tests, CMS deploy (migrations as the Fly release command), smoke test, frontend deploy, smoke test, automatic rollback on a failed smoke test, queue per environment, production guard, pinned `setup-flyctl`, least-privilege permissions | `.github/workflows/deploy.yml`, `rollback.yml`; `ci-*.yml` are test-only and reusable |
| Which apps deploy | Only the apps whose files changed, measured from the **last successful run** on the branch (so a superseded pending run never loses a change) | `scripts/deploy/detect-changes.js` |
| Scripts | Smoke test, rollback helper (current / restore / previous), release selection (never prints Fly JSON, which contains user emails) | `scripts/deploy/` |
| Fly config | One file per environment with scale to zero, liveness checks, migrations over `DIRECT_URL` (fallback `DATABASE_URL`), non-secret environment values | `packages/{cms,frontend}/fly.{development,production}.toml` (old `fly.toml` removed) |
| Environment rules | `APP_ENV`; Redis optional in DEV (`REDIS_DISABLED`, rejected in production); photo storage optional (all-or-none); production CORS must be HTTPS and non-localhost | `packages/cms/src/config/env-validation.ts`, `redis.ts` |
| Compute fixes | No 5-minute timer: game statuses sync at startup and, throttled, on game reads; `/health` is dependency-free, `/health/ready` is cached 30 s; public pages cached 5 min (production builds); crawler deny-list, per-IP limit, noindex and `robots.txt` per environment | `packages/cms/src/jobs/GameStatusSync.ts`, `routes/health.ts`; `packages/frontend/route-rules.ts`, `server/` |
| Photo storage | `GET /api/v1/config` capability flag; uploads fail with 503 `PHOTO_STORAGE_UNAVAILABLE` while unconfigured; admin player form shows the photo input only when enabled | `routes/config.ts`, `utils/object-storage.ts`, `useCmsCapabilities.ts`, `PlayerForm.vue` |
| Safety | Reset workflow is development-only and its script refuses apps not ending in `-dev`; production admin seeding needs a typed confirmation | `reset-cms-db.yml`, `scripts/seed-admin/reset-cms-db.sh`, `seed-cms-admin.yml` |
| Images | `.env` copies removed from both Dockerfiles; test guards it | `packages/*/Dockerfile`, `docker-hygiene.test.ts` |
| Docs | Deployment runbook; README, TECH_STACK and AGENTS.md link it; the old deployment guide is marked superseded | `docs/guides/DEPLOYMENT.md` |

## 2. Findings during implementation (worth remembering)

1. **Deploy-both was a wrong turn.** An early version deployed both apps on every change to dodge GitHub's "replace older pending runs" behavior. That made frontend-only changes re-run CMS migrations and wake Neon, and removed separate deploys. Replaced by per-app flags measured from the last successful run.
2. **`useAppConfig` collides with Nuxt.** Nuxt auto-imports its own `useAppConfig` (Nuxt UI uses it); a same-named composable shadows it and logs an error. The capability composable is `useCmsCapabilities`.
3. **Page-cache rules break `nuxt dev`.** With `swr` rules in development, every page after the first returned 500 (`ENOTDIR` in `.nuxt/cache/nuxt/payload`: the cached root page is a file where sub-routes need a directory). The rules are applied to production builds only (`NODE_ENV=production`). A production build was run locally and verified: pages 200, second request about 1 ms (cached), no noindex header, crawler 403.
4. **Nuxt UI texts were English.** Empty tables showed "No data". `UApp` now uses the Spanish locale (`@nuxt/ui/locale`).
5. **A frontend Dockerfile copied `.env*` too**, not only the CMS one; both fixed.
6. **Prisma stayed untouched on purpose.** No `directUrl` in the schema; the release command overrides `DATABASE_URL` with `DIRECT_URL`, so local development, tests and CI are unchanged.

## 3. Verification performed

- CMS: build clean, 62 suites / 581 tests passing (one skipped). Frontend: 63 files / 434 tests passing. Lint: no errors on the changed files.
- All six workflows pass `actionlint` 1.7.12 (installed with `brew install actionlint`; run `actionlint` from the repository root). Fly files pass a structural check (`flyctl config validate` needs a Fly login and was not run); shell scripts ran in dry-run mode and failure paths were exercised.
- The public pages were exercised against a freshly migrated empty database (dev server and a production build): all 200, Spanish empty states.
- **Not verified here** (needs the owner's accounts or tools): the pipeline itself on GitHub, Fly deploys and rollbacks, Neon behavior (suspension, usage), the pipeline's behavior on GitHub.

## 4. Deviations from the plan

- Deploys are per app (changed apps only) with a last-success diff base; the "deploy both" idea was dropped (finding 1).
- Fly tokens: a single `FLY_API_TOKEN` per GitHub environment must be able to deploy both apps of that environment; narrower per-app tokens would need two secrets. Documented in the runbook.
- `useCmsCapabilities` instead of `useAppConfig` (finding 2).

## 5. Still open

**Owner steps** (tasks T020, T028, T038, T047, T049, T051 in `tasks.md`; procedures in the runbook):
- Exercise the DEV pipeline (quickstart B), including a failing migration and a rollback.
- Bootstrap production (Neon pooled and direct strings, Upstash URL, Fly secrets, GitHub `production` environment restricted to `main`), seed the admin, merge to `main`.
- Check the DEV Fly secrets for a Redis URL that points at the production database.
- Configure the Neon usage alert and verify idle suspension; import the club data with the CSV import.

**Repository follow-ups**:
- Release prep (T053): version bump, changelogs and annotated tag with the `create-release` skill.
- Carried over from spec 021: switch the spec-kit integration to `claude`, update `apm.yml` / `apm.lock.yaml` paths, add a `CLAUDE.md` that imports `AGENTS.md`, remove `.github/copilot-instructions.md`.
- Only if a running CSV import is interrupted by auto stop: add a graceful-shutdown wait for the running job (see research §11).
