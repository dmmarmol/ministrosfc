# Tasks: Monorepo Setup

**Input**: Design documents from `/specs/002-monorepo-setup/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, quickstart.md ✅

> **Status: VERIFICATION ONLY** — All 10 FRs confirmed implemented by plan.md research phase. Tasks below verify each requirement against the existing codebase and run the acceptance tests. No new code should be needed; one minor README fix is included.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- All file paths are relative to repo root

---

## Phase 1: Setup

**Purpose**: Confirm feature branch and working tree are ready for verification

- [x] T001 Confirm git branch is `002-monorepo-setup` and working tree is clean (`git status`)

---

## Phase 2: Foundational Verification (Blocking Prerequisites)

**Purpose**: Verify all configuration artifacts exist and are spec-compliant before running acceptance tests

**⚠️ CRITICAL**: T010/T011 acceptance tests will fail if any of these foundation checks fail

- [x] T002 [P] Verify `package.json` workspaces glob, all 7 required scripts, and `engines` field in package.json
- [x] T003 [P] Verify `tsconfig.base.json` has `strict: true`, `target: "ES2020"`, and `@ministrosfc/*` path alias in tsconfig.base.json
- [x] T004 [P] Verify `packages/cms/tsconfig.json`, `packages/frontend/tsconfig.json`, `packages/shared/tsconfig.json` each extend `../../tsconfig.base.json` with correct overrides
- [x] T005 [P] Verify `docker-compose.yml` defines `db` service (postgres:15, port 5100 with health check) and `redis` service (redis:7, port 5101 with health check) with named volumes in docker-compose.yml
- [x] T006 [P] Verify `packages/cms/.env.example` contains all required variables: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY`, `REFRESH_TOKEN_EXPIRY`, `REDIS_HOST`, `REDIS_PORT`, `NODE_ENV`, `API_PORT`, `CORS_ORIGIN`, and Cloudinary vars in packages/cms/.env.example
- [x] T007 [P] Verify `packages/frontend/.env.example` contains `NUXT_PUBLIC_API_BASE_URL`, `NUXT_PUBLIC_BRAND_COLOR`, and `NUXT_PORT` in packages/frontend/.env.example
- [x] T008 [P] Verify `packages/cms/Dockerfile` and `packages/frontend/Dockerfile` exist and use multi-stage build pattern (builder stage + runtime stage)

**Checkpoint**: All configuration files verified — ready for acceptance testing

---

## Phase 3: User Story 1 — Developer Onboards in One Command (Priority: P1) 🎯 MVP

**Goal**: One-command local environment setup works end-to-end from a clean state

**Independent Test**: `npm install && npm run docker:up && npm run build:all` completes with zero errors; both container health checks pass within 30 seconds

### Implementation for User Story 1

- [x] T009 [US1] Fix README `package.json` prerequisites: change "npm 9+" to "npm 10+" to match `engines` field (research §2 minor discrepancy) in README.md
- [x] T010 [US1] Run `npm install` at repo root and confirm all three workspace packages install with zero errors
- [x] T011 [US1] Run `npm run docker:up` and verify both containers reach `(healthy)` status within 30 seconds (`podman ps` or `docker ps`)
- [x] T012 [US1] Copy `.env.example` files (`cp packages/cms/.env.example packages/cms/.env && cp packages/frontend/.env.example packages/frontend/.env`) and run `npm run gen:prisma`
- [x] T013 [US1] Run `npm run build:all` and confirm zero TypeScript compilation errors across all three packages (shared → cms → frontend)

**Checkpoint**: US1 complete — a developer can go from clone to running environment in under 5 minutes (SC-001, SC-002, SC-003, SC-004)

---

## Phase 4: User Story 2 — Developer Navigates Codebase Structure (Priority: P2)

**Goal**: Each package has its own `package.json`, `tsconfig.json`, and correctly named source subdirectories

**Independent Test**: `ls packages/cms/src/ packages/frontend/src/ packages/shared/src/` shows expected named directories

### Implementation for User Story 2

- [x] T014 [P] [US2] Verify `packages/cms/src/` contains: `config/`, `middleware/`, `models/`, `routes/`, `services/`, `utils/` directories
- [x] T015 [P] [US2] Verify `packages/frontend/src/` contains: `components/`, `composables/`, `layouts/`, `middleware/`, `pages/`, `plugins/`, `stores/`, `utils/` directories
- [x] T016 [P] [US2] Verify `packages/shared/src/` exists and `packages/shared/package.json` is named `@ministrosfc/shared`
- [x] T017 [US2] Run `npm run test --workspace=@ministrosfc/cms` and confirm only CMS tests execute (workspace isolation check)

**Checkpoint**: US2 complete — directory structure is navigable and workspace isolation works

---

## Final Phase: Polish & Cross-Cutting Concerns

- [x] T018 [P] Verify `npm run test:all` runs all 134 tests (98 CMS + 36 frontend) and passes
- [x] T019 [P] Confirm `.env` files are listed in `.gitignore` and NOT committed to the repository

---

## Dependencies

```
T001 → T002–T008 (parallel) → T009–T013 (US1 sequential) → T014–T017 (US2 parallel) → T018–T019
```

US1 and US2 can be verified independently:

- US1 needs T001 → T002–T008 → T010–T013
- US2 needs T001 → T014–T017 (no container dependency)

## Parallel Execution Examples

**US1 foundation checks** (run all at once):

```bash
# Verify all config files simultaneously
cat package.json | jq '.workspaces, .scripts, .engines'
cat tsconfig.base.json | jq '.compilerOptions.strict, .compilerOptions.target, .compilerOptions.paths'
cat docker-compose.yml | grep -E "image:|ports:"
cat packages/cms/.env.example | grep -E "DATABASE_URL|JWT_|REDIS_|API_PORT"
```

**US2 structure check** (one command):

```bash
ls packages/cms/src/ packages/frontend/src/ packages/shared/src/
```

## Implementation Strategy

**This is a verification-only feature** — the monorepo scaffold already exists. Execute tasks top-to-bottom; each checkpoint confirms spec compliance before proceeding.

**MVP scope**: T001–T013 (Phase 1–3). US2 verification (T014–T017) can follow immediately after since it requires no containers.

**If any task fails**: The failure indicates a regression since the initial `001-ministrosfc-monorepo` delivery. Document the specific check that failed in a commit message and fix the discrepancy before proceeding to Phase 3 (003-cms-backend-foundation).
