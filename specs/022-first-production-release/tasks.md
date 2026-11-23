---

description: "Task list for spec 022: first production release and automated production deployment"
---

# Tasks: First production release and automated production deployment

**Input**: Design documents from `specs/022-first-production-release/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`

**Tests**: Included. The constitution requires test-first development for testable code: write each failing test before the implementation task that follows it. Workflow and Fly files are validated with `actionlint` and the quickstart scenarios.

**Organization**: Grouped by user story from `spec.md`. Tasks tagged `[OWNER]` need the owner's accounts (Neon, Upstash, Fly, GitHub settings) and are not automated; they are mirrored in the runbook written in US4.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: can run in parallel (different files, no dependency on an unfinished task)
- **[Story]**: US1–US6 from `spec.md`
- Container commands (`npm run docker:up/down`): ask the owner before starting or stopping containers.

## Phase 1: Setup

- [X] T001 Update `packages/cms/.env.example`: document `APP_ENV` (default `development`), `REDIS_DISABLED`, `DIRECT_URL` (direct Neon URL, optional) and mark the three `CLOUDINARY_*` variables as optional ("all or none"); names and placeholders only, no real values.

## Phase 2: Foundational (blocks all user stories)

**Purpose**: runtime configuration and health behavior that the pipeline, Fly files and later stories depend on.

- [X] T002 [P] Write failing tests for the new startup rules in `packages/cms/tests/unit/env-validation.test.ts`: `APP_ENV` required when `NODE_ENV=production`, defaults to `development` otherwise, other values rejected; `REDIS_URL` required when `APP_ENV=production`; `REDIS_DISABLED=true` accepted only when `APP_ENV` is not `production`; Cloudinary variables optional but all-or-none; when `APP_ENV=production`, `CORS_ORIGINS` must not contain `localhost` or a non-HTTPS origin; the error message lists every problem. Update the existing cases that assumed Cloudinary is required in production.
- [X] T003 Implement the rules from T002 in `packages/cms/src/config/env-validation.ts` (contract: `contracts/runtime-endpoints.md` > Startup validation) until T002 passes.
- [X] T004 [P] Write failing tests in `packages/cms/tests/unit/redis-config.test.ts`: with `REDIS_DISABLED=true` and `APP_ENV` not `production`, `getRedisClient()` returns the no-op client even when `NODE_ENV=production`; with `APP_ENV=production` the flag is ignored and a real client is built from `REDIS_URL`.
- [X] T005 Implement `REDIS_DISABLED` handling in `packages/cms/src/config/redis.ts` until T004 passes.
- [X] T006 [P] Write failing integration tests in `packages/cms/tests/integration/health.test.ts` (and update any existing health assertions found with a search of `packages/cms/tests` and `packages/frontend`): `GET /api/v1/health` returns `200 { status: "ok", uptime }` and performs no database or Redis call; `GET /api/v1/health/ready` returns the database and Redis status, `redis: "disabled"` when disabled, `503` when the database check fails, and serves a cached result for 30 seconds (second call does not query again).
- [X] T007 Implement the liveness and readiness endpoints in `packages/cms/src/routes/health.ts` (readiness result cached in memory for 30 s) until T006 passes; keep the router mounted in `packages/cms/src/config/server.ts`.

**Checkpoint**: configuration rules and health endpoints are ready; user stories can start.

## Phase 3: User Story 1 - Merging to main ships to production automatically (Priority: P1) 🎯 MVP

**Goal**: A merge to `main` runs the tests, applies migrations, deploys CMS then frontend, verifies health, rolls back on failure, and never overlaps with another deployment.

**Independent Test**: Quickstart section B on DEV (develop branch), including the failure and rollback tests.

### Tests for User Story 1

- [X] T008 [P] [US1] Write failing tests in `packages/cms/tests/unit/deploy-detect-changes.test.ts` for the change-detection logic exported by `scripts/deploy/detect-changes.js`: shared or root package changes set both apps; an app's own files or Fly files set that app only; docs-only changes set neither; an all-zero `before` SHA sets both.

### Implementation for User Story 1

- [X] T009 [US1] Implement `scripts/deploy/detect-changes.js` (exports the pure function and a CLI that writes `cms` and `frontend` outputs to `$GITHUB_OUTPUT`) until T008 passes.
- [X] T010 [P] [US1] Create `packages/cms/fly.development.toml` and `packages/cms/fly.production.toml` per `contracts/environment-variables.md` and `research.md` §§3–5: `app`, `primary_region = "gru"`, non-secret `[env]` (`APP_ENV`, `NODE_ENV`, `API_PORT`, `CORS_ORIGINS`, and `REDIS_DISABLED = "true"` for development only), `min_machines_running = 0` with auto stop and start, a liveness check on `/api/v1/health`, and the release command `sh -c 'DATABASE_URL="${DIRECT_URL:-$DATABASE_URL}" node_modules/.bin/prisma migrate deploy --schema=packages/cms/prisma/schema.prisma'`. Delete `packages/cms/fly.toml`. Use the default Fly hostnames for URLs.
- [X] T011 [P] [US1] Create `packages/frontend/fly.development.toml` and `packages/frontend/fly.production.toml`: `app`, scaling to zero, non-secret `[env]` (`APP_ENV`, `NUXT_PUBLIC_API_BASE_URL`, `NUXT_PUBLIC_APP_URL`, existing port and host variables), and an HTTP check on `/robots.txt`. Delete `packages/frontend/fly.toml`.
- [X] T012 [P] [US1] Create `scripts/deploy/smoke-test.sh`: arguments `<app> <base-url> <environment>`; CMS checks `/api/v1/health/ready` for 200; frontend checks `/`, `/roster` for 200 and that `/robots.txt` allows indexing in production and disallows it otherwise; up to 10 attempts 15 s apart; supports `--dry-run`; never prints secrets.
- [X] T013 [P] [US1] Create `scripts/deploy/rollback-image.sh`: arguments `<app> [version]`; resolves the previous release image from `flyctl releases --json` and redeploys it with `flyctl deploy --image`; supports `--dry-run`; prints only app, version and image names.
- [X] T014 [US1] Convert `.github/workflows/ci-cms.yml` to tests only: remove the `deploy-cms` job and the `release` trigger, add `workflow_call`, set `permissions: contents: read`.
- [X] T015 [US1] Convert `.github/workflows/ci-frontend.yml` the same way.
- [X] T016 [US1] Create `.github/workflows/deploy.yml` per `contracts/deployment-pipeline.md`: triggers, `changes` job using `scripts/deploy/detect-changes.js`, test jobs via `workflow_call`, CMS then frontend deploy and verify jobs, previous-image recording and automatic rollback using the scripts from T012–T013, environment by branch, `concurrency` group per environment without cancellation, production guard `github.ref == 'refs/heads/main'`, least-privilege `permissions`, `setup-flyctl` pinned to a released version, deploy with `--config packages/<app>/fly.<environment>.toml`.
- [X] T017 [US1] Create `.github/workflows/rollback.yml` per the contract (inputs `environment`, `app`, optional `version`), using `scripts/deploy/rollback-image.sh`.
- [X] T018 [US1] Search the repository for references to the removed `fly.toml` files and the removed `release` trigger (workflows, scripts, docs, `specs/001-ministrosfc-monorepo/deployment.md`) and update them.
- [ ] T019 [US1] Validate every workflow with `actionlint` (install with the owner's approval if missing) and run `scripts/deploy/smoke-test.sh --dry-run` and `rollback-image.sh --dry-run`; fix findings.
- [ ] T020 [OWNER] [US1] Exercise the DEV pipeline: quickstart B1–B6 (CMS-only change, docs-only change, two quick merges, failing migration, rollback, DEV crawler check).

**Checkpoint**: a merge to `develop` deploys DEV through the new pipeline; the same workflow serves `main`.

## Phase 4: User Story 2 - Production is live and usable (Priority: P1)

**Goal**: Production boots with an empty database, an admin account, no photo storage, and clear failures for missing settings.

**Independent Test**: Quickstart section D (owner) plus the local checks in A.

### Tests for User Story 2

- [X] T021 [P] [US2] Write failing integration tests in `packages/cms/tests/integration/config.test.ts`: `GET /api/v1/config` returns `{ photoUploadsEnabled: false }` without credentials and `true` with all three; it makes no database call.
- [X] T022 [P] [US2] Write failing tests in `packages/cms/tests/integration/object-storage.test.ts` (extend) and `packages/cms/tests/unit/PlayerService.test.ts`: `isPhotoStorageConfigured()` reflects the credentials; uploading when not configured throws a 503 application error with code `PHOTO_STORAGE_UNAVAILABLE` and a Spanish message; creating or updating a player without a photo still works.
- [X] T023 [P] [US2] Write failing tests: `packages/frontend/src/composables/__tests__/useCmsCapabilities.test.ts` (fetches `/api/v1/config`, defaults to disabled on failure) and `packages/frontend/src/components/pages/admin/players/__tests__/PlayerForm.photo.test.ts` (photo input hidden when disabled, shown when enabled).

### Implementation for User Story 2

- [X] T024 [US2] Add `packages/cms/src/routes/config.ts` returning the capability flags (no database access) and mount it at `/api/v1/config` in `packages/cms/src/config/server.ts` until T021 passes.
- [X] T025 [US2] Add `isPhotoStorageConfigured()` and the graceful 503 error (new error code `PHOTO_STORAGE_UNAVAILABLE`, defined where the other application error codes live) in `packages/cms/src/utils/object-storage.ts`; have `packages/cms/src/services/PlayerService.ts` and `packages/cms/src/services/ProfileService.ts` rely on it, until T022 passes.
- [X] T026 [US2] Add `packages/frontend/src/composables/useCmsCapabilities.ts` and hide the photo input in `packages/frontend/src/components/pages/admin/players/PlayerForm.vue` (and any other photo input found by searching `packages/frontend/src` for `type="file"`) until T023 passes.
- [X] T027 [US2] With owner approval to start the local database containers, run the app against a freshly migrated empty database and review `/`, `/roster`, `/schedule`, `/tournaments`, `/statistics/**` and the admin dashboard for empty states and errors; fix gaps in the corresponding `packages/frontend/src/pages` and `components/pages` files, with a test per fix.
- [ ] T028 [OWNER] [US2] Production bootstrap from the runbook: Fly secrets for `ministrosfc-cms`, GitHub `production` environment secrets, run the seed workflow for `production` once to create the admin account (see US5 guard), then quickstart D4–D6.

**Checkpoint**: production configuration validates, boots without photo storage, and the UI degrades gracefully.

## Phase 5: User Story 3 - The free database allowance is no longer exhausted (Priority: P1)

**Goal**: No idle database activity, bounded public traffic, and visibility of usage.

**Independent Test**: Quickstart A5 (local idle check) and section C (owner, with Neon).

### Tests for User Story 3

- [X] T029 [P] [US3] Write failing tests in `packages/cms/tests/unit/GameStatusSync.test.ts`: the synchronization runs at most once per 5-minute window per process, runs again after the window, never throws into the request, and no timer is registered at startup. Adjust `packages/cms/tests/unit/GameStatusTransitionJob.test.ts` if signatures change.
- [X] T030 [P] [US3] Write failing tests in `packages/frontend/tests/unit/robots-route.test.ts`: production returns the allow rules with `/admin`, `/profile`, `/login`, `/register`, `/auth`, `/games/*/signup` disallowed; any other `APP_ENV` returns `Disallow: /`.
- [X] T031 [P] [US3] Write failing tests in `packages/frontend/tests/unit/server-middleware.test.ts`: non-production responses carry `X-Robots-Tag: noindex, nofollow`; a denied crawler user agent gets `403`; requests above the per-IP threshold get `429`; assets and health probes are exempt.
- [X] T032 [P] [US3] Write a failing test in `packages/frontend/tests/unit/route-rules.test.ts` asserting the Nitro route rules: public routes use stale-while-revalidate for 5 minutes; `/admin/**`, `/profile/**`, `/login`, `/register`, `/auth/**` are not cached.

### Implementation for User Story 3

- [X] T033 [US3] Add `packages/cms/src/jobs/GameStatusSync.ts` (throttled wrapper around `runGameStatusTransitions`), mount it as middleware ahead of the game read routes in `packages/cms/src/config/server.ts`, and remove the `setInterval` and `clearInterval` from `packages/cms/src/main.ts` while keeping the single startup run, until T029 passes.
- [X] T034 [US3] Make `packages/frontend/server/routes/robots.txt.ts` environment-aware until T030 passes.
- [X] T035 [US3] Add `packages/frontend/server/middleware/bot-protection.ts` (noindex header, crawler deny-list, per-IP rate limit using the client IP forwarded by the platform) and a small helper under `packages/frontend/server/utils/` until T031 passes; keep thresholds configurable with safe defaults.
- [X] T036 [US3] Add `routeRules` (caching for public routes, none for private routes) and the public `appEnv` runtime value in `packages/frontend/nuxt.config.ts` until T032 passes; first confirm each cached page renders the same SSR output for every visitor (authentication state is client-side) and record the check in `research.md` notes if any page needs exclusion.
- [X] T037 [P] [US3] Confirm both Fly files from T010–T011 use scale to zero and that the liveness check does not touch the database; adjust if not.
- [ ] T038 [OWNER] [US3] Neon: record the usage baseline, configure the usage alert from the runbook, and run quickstart C2–C4 (6-hour idle window, bot burst, confirm suspension). Record results in the runbook's usage section.

**Checkpoint**: idle environments make no database calls; public pages and bots are bounded; owner has alert and evidence.

## Phase 6: User Story 4 - The setup can be reproduced from the repository (Priority: P2)

**Goal**: Everything needed to rebuild the environments is in the repository without secrets.

**Independent Test**: A reviewer follows `docs/guides/DEPLOYMENT.md` on paper and finds no undocumented dependency; image hygiene test passes.

- [X] T039 [P] [US4] Write a failing test in `packages/cms/tests/unit/docker-hygiene.test.ts`: no `Dockerfile` under `packages/` copies `.env*` files, and the root and package `.dockerignore` files exclude `.env*`.
- [X] T040 [US4] Remove the `COPY packages/cms/.env* ./packages/cms/` and `COPY .env* ./` lines from `packages/cms/Dockerfile` (and any equivalent in `packages/frontend/Dockerfile`) until T039 passes.
- [X] T041 [US4] Write `docs/guides/DEPLOYMENT.md` (the runbook): architecture and environment matrix (from `data-model.md`), secrets and settings matrix by name, purpose, owner, location and rotation (from `contracts/environment-variables.md`, no values), owner-run bootstrap steps (Neon pooled and direct strings per branch, Upstash, per-app Fly deploy tokens, GitHub environments with branch restriction and optional reviewers, DEV Redis secret check, Neon usage alert), pipeline behavior and how to read results, rollback procedure with the expand/contract rule and the fact that migrations are not reverted, emergency manual deploy, account inventory with what each external account is for, free-tier cautions, the post-launch CSV import procedure and its caveats.
- [X] T042 [P] [US4] Update `README.md`, `AGENTS.md` and `docs/guides/TECH_STACK.md` to link the runbook, and mark `specs/001-ministrosfc-monorepo/deployment.md` as superseded by it.

**Checkpoint**: documentation and image hygiene complete.

## Phase 7: User Story 5 - Production cannot be damaged by accident (Priority: P2)

**Goal**: The destructive paths to production are closed or deliberately gated.

**Independent Test**: Quickstart section E.

- [X] T043 [P] [US5] Write a failing test in `packages/cms/tests/unit/reset-script-guard.test.ts` running `scripts/seed-admin/reset-cms-db.sh` with `DRY_RUN=1`: it refuses when `CMS_APP_NAME` does not end in `-dev`, and proceeds only for development app names.
- [X] T044 [US5] Add the `-dev` suffix guard to `scripts/seed-admin/reset-cms-db.sh` until T043 passes.
- [X] T045 [US5] Update `.github/workflows/reset-cms-db.yml`: remove the `production` choice, add the job condition `inputs.environment == 'development'`, set least-privilege `permissions`, pin `setup-flyctl`.
- [X] T046 [US5] Update `.github/workflows/seed-cms-admin.yml`: for `production` require a typed confirmation input before the job runs, keep `workflow_run` seeding development-only, set least-privilege `permissions`, pin `setup-flyctl`, and make sure credentials are only passed as environment variables and never echoed.
- [ ] T047 [OWNER] [US5] In GitHub: restrict the `production` environment to the `main` branch and optionally add required reviewers; confirm fork pull requests receive no secrets (quickstart E2).

**Checkpoint**: production cannot be reset; seeding is deliberate.

## Phase 8: User Story 6 - Open service questions are settled (Priority: P3)

**Goal**: Redis for DEV and photo storage are decided and recorded.

**Independent Test**: The runbook states, per service, whether DEV and PRO use it and why.

- [X] T048 [US6] Record in `docs/guides/DEPLOYMENT.md` the decisions: DEV runs without Redis (`REDIS_DISABLED=true`), production uses Upstash `ministrosfc-prod`; photo upload and the Cloudinary account are deferred past launch with the exact steps to enable them later (set the three secrets; no code change).
- [ ] T049 [OWNER] [US6] Inspect the DEV CMS Fly secrets; if `REDIS_URL` points at the production Upstash database, unset it so DEV never shares production cache data.

## Phase 9: Polish and cross-cutting

- [X] T050 Run all checks: `npm run build --workspace=@ministrosfc/shared`, CMS build and `npm test --workspace=@ministrosfc/cms -- --runInBand`, frontend build and `npm run test --workspace=@ministrosfc/frontend -- --run`; fix regressions (re-run flaky CMS files alone before treating them as real).
- [ ] T051 [OWNER] Validate the CSV import on DEV with a realistic file (quickstart D7 against DEV first); record limits, timing and Neon usage in the runbook; add a graceful-shutdown follow-up only if a running job is interrupted by auto stop.
- [X] T052 Update `specs/022-first-production-release/spec.md` status and add `specs/022-first-production-release/implementation-notes.md` (what shipped, deviations, owner steps still pending, how to roll back).
- [ ] T053 Release prep with the `create-release` skill: version bump, root and per-package changelog entries, release commit and annotated tag (the owner chooses the bump).
- [ ] T054 Final pre-push checks: no secret values or personal identifiers in the diff (`git grep` for known patterns), commit authors use the personal email; the owner runs the push.

## Dependencies and execution order

- **Phase 1 → Phase 2** first; Phase 2 blocks everything else (T003 and T007 feed Fly files, checks and the config rules).
- **US1** needs Phase 2; its Fly files (T010–T011) are reused by US3 (T037) and US4 (runbook).
- **US2** needs Phase 2; independent of US1 except for the production bootstrap (T028), which needs the US1 pipeline and the US5 seed guard.
- **US3** needs Phase 2; frontend tasks (T030–T036) are independent of CMS tasks (T029, T033).
- **US4** can start after Phase 2; T041 should be written last so it reflects the final Fly and workflow files.
- **US5** needs US1 for workflow conventions (pinning, permissions); T043–T044 are independent.
- **US6** documentation depends on T041; T049 is owner-only.
- **Polish** last; T053 only after all code tasks pass, T054 after T053.

### Within each story

Failing test → implementation → checkpoint. Models/config before endpoints; workflows after the scripts they call.

## Parallel opportunities

- Phase 2: T002/T004/T006 (separate test files) can be written together.
- US1: T010, T011, T012, T013 (separate files) in parallel after T009.
- US2: T021, T022, T023 in parallel; T024–T026 afterwards.
- US3: T029–T032 in parallel; CMS (T033) and frontend (T034–T036) streams in parallel.
- US4/US5: T039, T043, T042 in parallel.

### Example: User Story 3 parallel start

```text
T029 GameStatusSync tests          (packages/cms/tests/unit)
T030 robots.txt tests              (packages/frontend/tests/unit)
T031 server middleware tests       (packages/frontend/tests/unit)
T032 route rules test              (packages/frontend/tests/unit)
```

## Implementation strategy

- **MVP**: Phase 1, Phase 2 and US1 deliver merge-to-main deployment on top of the safe runtime. Validate on DEV (T020) before touching production.
- **Launch readiness**: add US2 and US3 (both P1) before the first production merge; they are what makes production bootable and affordable.
- **Hardening**: US4 and US5 (P2) before announcing the site; US6 (P3) closes the loose ends.
- **Incremental delivery**: each phase ends with a checkpoint and can be committed on its own using semantic commits grouped by concern (CMS runtime, frontend, workflows and scripts, Fly files, docs).
- **Order of exposure**: runtime code → Fly files and scripts → workflows exercised on `develop` → runbook → owner bootstrap → first merge to `main`.
