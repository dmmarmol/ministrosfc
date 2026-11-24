# Implementation Plan: First production release and automated production deployment

**Branch**: `022-first-production-release` | **Date**: 2026-11-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `specs/022-first-production-release/spec.md`

## Summary

Make a merge to `main` deploy production automatically and safely, and make the first production environment bootable and affordable. The work is mostly CI/CD and configuration, with a few small, test-first code changes in the CMS and frontend:

- one orchestrating deploy workflow (test → CMS with migrations → verify → frontend → verify, automatic rollback, manual rollback workflow, concurrency queue, production only from `main`);
- per-environment Fly configuration with explicit scaling, health checks and non-secret environment values;
- fixes for the Neon compute drain: no idle polling, split liveness/readiness health endpoints, cached public pages, crawler controls;
- Cloudinary and DEV Redis made optional through an explicit `APP_ENV`, with graceful photo-upload degradation;
- guarded destructive workflows, least-privilege workflow permissions, and a deployment runbook with the owner-run steps.

Decisions and alternatives are in [research.md](research.md).

## Technical Context

**Language/Version**: TypeScript 5.x on Node.js (CMS image `node:23-alpine`, CI Node 24), Vue 3 / Nuxt 4 (Nitro server) for the frontend, GitHub Actions YAML, Bash, Fly `fly.toml` files.

**Primary Dependencies**: Express, Prisma 5, ioredis, Cloudinary SDK (CMS); Nuxt 4, `@nuxt/ui` (frontend); `flyctl` via `superfly/flyctl-actions`. No new runtime dependencies are planned.

**Storage**: PostgreSQL on Neon (pooled runtime URL, direct URL for migrations), Redis on Upstash (production only). **No schema or migration changes.**

**Testing**: Jest for CMS unit/integration (`env-validation`, health, config endpoint, Docker hygiene, game-status sync), Vitest for frontend (`robots.txt`/headers server routes, photo input visibility, cache route rules), plus workflow validation by `actionlint` (documented, run locally or in CI) and the quickstart scenarios against DEV before the first production merge.

**Target Platform**: Fly.io (Linux containers, region `gru`), GitHub-hosted runners.

**Project Type**: web application monorepo (frontend + CMS API + shared types); this feature touches `packages/cms`, `packages/frontend`, `.github/`, `scripts/` and `docs/`. `packages/shared` is not touched.

**Performance Goals**: merge-to-live in under 15 minutes (SC-001); rollback under 10 minutes (SC-003); cached public pages served without CMS/database work within the cache window.

**Constraints**: free tiers of Fly, Neon, Upstash; no secret values in the public repository, workflows or images; DEV pipeline behavior unchanged; owner-account actions are manual and documented, not automated.

**Scale/Scope**: club-sized audience (tens of users); two environments; about 10 files of workflow/config, 6–8 small code changes with tests, and 3 documents.

## Constitution Check

*GATE: passed before research; re-checked after design.*

| Principle / gate | Assessment |
|---|---|
| I–III: feature scope, approved spec, plan before tasks | Pass: spec approved with clarifications resolved; this plan precedes tasks. Scope is bounded to deployment, cost control and launch configuration. |
| IV: test-first quality gates | Pass with implementation requirement: every code change (env validation, health split, config endpoint, game-status sync throttling, robots/headers, photo input visibility) gets a failing test first; workflow and Fly files are validated with `actionlint` and the quickstart. |
| V: component isolation and page decomposition | Pass: the only UI change is hiding the photo input in the existing player form; no page gains a large template block. |
| V: page access metadata | Pass: no new pages. |
| VI: data flow and state | Pass: capability flags come from the API (`/api/v1/config`) through a composable; no ad hoc state. |
| VII: shared contracts | Pass: the config response is a CMS-owned contract consumed by one frontend composable; promote to `@ministrosfc/shared` only if a second consumer appears. |
| VIII: changelogs | Applies at release time: the implementation commit set ends with root and per-package changelog entries and a version bump with an annotated tag via the `create-release` skill. |
| Dependency, storage, and migration policy | Pass: no new dependencies, no schema changes; `prisma migrate deploy` behavior unchanged apart from the connection used. |
| Public-repo secret hygiene | Pass: no secret values anywhere; names and procedures only; Dockerfile hygiene test added. |
| Git and commit conventions | Pass: semantic commits grouped by concern (workflows, Fly, CMS runtime, frontend, docs). |

No violations or complexity exceptions.

## Project Structure

### Documentation (this feature)

```text
specs/022-first-production-release/
├── plan.md              # This file
├── research.md          # Decisions and alternatives
├── data-model.md        # Environment, secret and config entities
├── quickstart.md        # Validation scenarios
├── contracts/
│   ├── deployment-pipeline.md      # Workflow triggers, jobs, gates
│   ├── runtime-endpoints.md        # /health, /health/ready, /config
│   └── environment-variables.md    # Variables and secrets per environment
├── checklists/requirements.md
└── tasks.md             # Created by /speckit.tasks
```

### Source Code (repository root)

```text
.github/workflows/
├── ci-cms.yml                 # tests only (+ workflow_call), deploy job removed
├── ci-frontend.yml            # tests only (+ workflow_call), deploy job removed
├── deploy.yml                 # NEW: orchestrated deploy for develop/main
├── rollback.yml               # NEW: manual rollback
├── reset-cms-db.yml           # development only
└── seed-cms-admin.yml         # production needs typed confirmation

packages/cms/
├── fly.development.toml       # NEW (replaces fly.toml)
├── fly.production.toml        # NEW
├── Dockerfile                 # no .env copies
├── src/
│   ├── main.ts                # no setInterval; startup sync only
│   ├── config/env-validation.ts   # APP_ENV, optional Cloudinary, REDIS_DISABLED, CORS rule
│   ├── config/redis.ts            # honor REDIS_DISABLED outside production
│   ├── jobs/GameStatusTransitionJob.ts + throttled hook on game reads
│   ├── routes/health.ts           # liveness + readiness (cached)
│   ├── routes/config.ts           # NEW: capabilities
│   ├── config/server.ts           # mount config router
│   └── utils/object-storage.ts    # isPhotoStorageConfigured + graceful errors
└── tests/unit|integration/    # new and updated tests

packages/frontend/
├── fly.development.toml       # NEW (replaces fly.toml)
├── fly.production.toml        # NEW
├── nuxt.config.ts             # routeRules cache for public routes, APP_ENV public config
├── server/routes/robots.txt.ts          # per-environment rules
├── server/middleware/                   # noindex header (DEV), crawler deny-list, rate limit
└── src/composables/useCmsCapabilities.ts + PlayerForm.vue   # hide photo input when disabled

scripts/seed-admin/reset-cms-db.sh       # refuses non "-dev" apps
docs/guides/DEPLOYMENT.md                # NEW runbook (owner-run steps, secrets matrix, rollback)
```

**Structure Decision**: keep all work in existing packages and `.github/`; one new runbook under `docs/guides/`. No new package, service, or database entity.

## Design Decisions

1. **Single deploy orchestrator** with a changed-files job, per-environment concurrency, and CMS-before-frontend ordering (see research §1).
2. **Verification and rollback** via Fly health checks, a post-deploy smoke test, automatic redeploy of the recorded previous image on failure, and a manual rollback workflow; migrations are never auto-reverted (research §2).
3. **Migrations over the direct Neon URL** by overriding `DATABASE_URL` in the release command, with no schema change (research §3).
4. **Compute-usage fixes** targeting the verified causes: interval job removed, health split, scale-to-zero on both CMS apps, public SSR caching, crawler controls (research §4).
5. **Per-environment Fly files** hold scaling, health checks and non-secret environment values; secrets stay in Fly (research §5).
6. **`APP_ENV`** distinguishes development from production (both run `NODE_ENV=production`) and drives validation rules, Redis and photo-storage optionality, robots and noindex behavior (research §§7–8, 10).
7. **Destructive-action guards** at three layers: workflow input removal, job condition, and script guard; production seeding requires a typed confirmation (research §9).
8. **Documentation as code**: `docs/guides/DEPLOYMENT.md` is the single runbook; contracts in this folder define the interfaces the implementation must honor.

## Rollout and Risk

- **Order of delivery**: runtime code changes (safe, test-first) → Fly files and Dockerfile → workflows (DEV exercised first on `develop`) → runbook → production bootstrap by the owner → first merge to `main`.
- **Risks**: first production deploy is untested (mitigation: run the whole pipeline against DEV on `develop` first, and use `workflow_dispatch` on DEV); Neon cold start on the first request (accepted, documented); image rollback with an incompatible migration (mitigation: expand/contract rule in the runbook); GitHub environment settings are owner-controlled (mitigation: workflow-level branch guard plus runbook checklist).
- **Rollback of this feature itself**: the previous `fly.toml` files and workflow structure are recoverable from git; no data migration is involved.

## Implementation status

Implemented in the repository; owner-run steps remain. Deviations (per-app deploys measured from the last successful run, `useCmsCapabilities`, production-only page caching) and the findings made along the way are in [`implementation-notes.md`](implementation-notes.md).
