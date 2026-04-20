# Tasks: Deployment Process

**Input**: Design documents from `specs/018-deployment-process/`
**Prerequisites**: plan.md ✓ spec.md ✓ research.md ✓ quickstart.md ✓

---

## Phase 1: Setup (Repository Safety)

**Purpose**: Audit and clean the git history, harden `.gitignore`, and install the pre-commit scanning hook. This phase MUST be completed before the repository is published to GitHub. Nothing else in this spec can be done until the repo is safe to make public.

**⚠️ CRITICAL**: No other phases can begin until this phase is complete and the repository is published.

- [x] T001 Run `truffleHog git file://$(pwd) --json > /tmp/findings.json` from repo root to produce the full history audit report; review `/tmp/findings.json` for true positives (secrets, credentials, CSV files)
- [x] T002 If any CSV files are found in history, remove them with `git filter-repo --path data/ --invert-paths` (run on a clean mirror clone to preserve local working copy)
- [x] T003 If any hardcoded secrets are found in history, create `/tmp/replacements.txt` with `ACTUAL_VALUE==>REDACTED` entries and run `git filter-repo --replace-text /tmp/replacements.txt`
- [x] T004 Re-run `truffleHog git file://$(pwd) --json` and confirm zero findings before proceeding
- [x] T005 Add missing `.gitignore` patterns to `.gitignore`: `.env.*`, `!.env.example`, `.fly/`, `*.pem`, `*.key`, `*.p12`, `*.pfx`, `secrets.json`, `credentials.json`, `service-account.json`
- [x] T006 [P] Create `.gitleaks.toml` at repo root with a custom rule blocking all `.env*` file patterns in addition to gitleaks defaults. **Do NOT add a CSV rule here** — gitleaks `regex` matches file content, not filenames; a CSV file would not trigger a content regex. CSV blocking is handled in T007 via a `local` pre-commit hook instead.
- [x] T007 Create `.pre-commit-config.yaml` at repo root with two hook repositories:
  1. `https://github.com/gitleaks/gitleaks` pinned at latest stable tag (secret scanning)
  2. A `local` repo with a `no-csv-data-files` hook using `language: fail` and `files: ^data/.*\.csv$` with entry message `"CSV files in data/ contain player personal data and must not be committed"` — this is the only reliable way to block files by name pattern
- [x] T008 Add `"prepare": "pre-commit install || true"` to the `scripts` block in root `package.json`; run `npm install` to trigger the hook installation locally and verify `.git/hooks/pre-commit` exists
- [x] T009 Verify the pre-commit hook works: stage a file containing a fake secret pattern → `git commit` → confirm the commit is blocked with a gitleaks error message → unstage the file
- [x] T010 Verify clean commits pass: stage a real code change with no secrets → `git commit` → confirm the commit succeeds

**Checkpoint**: History is clean, `.gitignore` covers all sensitive patterns, pre-commit hook is blocking bad commits. Repository is safe to publish.

---

## Phase 2: Foundational (Infrastructure Provisioning)

**Purpose**: Create all the external services (Neon, Upstash, Fly.io apps) and configure GitHub as the host. These are prerequisites for all deployment phases. No CI pipeline can run until this phase is complete.

**⚠️ CRITICAL**: No deployment phases can begin until this phase is complete.

- [x] T011 **Before collecting any secrets**: open a local password manager session (e.g., Bitwarden, 1Password) and create a `ministrosfc-infra-secrets` entry. Record every URL, token, and key collected in the steps below into that entry. Do NOT write any secret value to any file in the repo or to shell history (use `read -s VAR` instead of inline values in terminal commands). Then: create Neon account at neon.tech → create project `ministrosfc` → copy the `main` branch `DATABASE_URL` connection string (PROD database) into the password manager entry.
- [x] T012 In the Neon console, create a `dev` branch from `main` → copy its `DATABASE_URL` (DEV database)
- [x] T013 Create Upstash account at upstash.com → create Redis database `ministrosfc-prod` (region: São Paulo or us-east-1) → copy the `rediss://` connection URL
- [~] T014 Create a second Upstash Redis database `ministrosfc-dev` → copy its `rediss://` URL — **SKIPPED: Upstash free tier allows 1 DB; PROD Redis shared across both environments**
- [x] T015 Run `flyctl auth login`; create all four Fly.io apps: `flyctl apps create ministrosfc-cms`, `ministrosfc-frontend`, `ministrosfc-cms-dev`, `ministrosfc-frontend-dev`
- [x] T016 Set all required secrets on `ministrosfc-cms` via `flyctl secrets set` per the secrets inventory in `specs/018-deployment-process/plan.md` §1.4 (DATABASE_URL, JWT_SECRET, REDIS_URL, CORS_ORIGINS, Cloudinary vars, Google OAuth vars)
- [ ] T017 Set all required secrets on `ministrosfc-cms-dev` via `flyctl secrets set` (same keys, DEV-scoped values — Neon dev branch, Upstash dev DB, dev CORS origin)
- [ ] T018 Set secrets on `ministrosfc-frontend` via `flyctl secrets set`: `NUXT_PUBLIC_API_BASE_URL=https://ministrosfc-cms.fly.dev`, `NUXT_PUBLIC_APP_URL=https://ministrosfc-frontend.fly.dev`
  > The canonical env var name is `NUXT_PUBLIC_API_BASE_URL` (confirmed in `packages/frontend/nuxt.config.ts` line 17). Do NOT use `NUXT_PUBLIC_API_BASE`.
- [ ] T019 Set secrets on `ministrosfc-frontend-dev` via `flyctl secrets set`: `NUXT_PUBLIC_API_BASE_URL=https://ministrosfc-cms-dev.fly.dev`, `NUXT_PUBLIC_APP_URL=https://ministrosfc-frontend-dev.fly.dev`
- [ ] T020 Create GitHub repository (public) at github.com; add remote: `git remote add origin https://github.com/<org>/ministrosfc.git`
- [ ] T021 In GitHub → Settings → Environments: create `production` environment; add secrets `FLY_API_TOKEN`, `CMS_APP_NAME=ministrosfc-cms`, `FRONTEND_APP_NAME=ministrosfc-frontend`
- [ ] T022 In GitHub → Settings → Environments: create `development` environment; add secrets `FLY_API_TOKEN`, `CMS_APP_NAME=ministrosfc-cms-dev`, `FRONTEND_APP_NAME=ministrosfc-frontend-dev`

**Checkpoint**: All 4 Fly.io apps exist, secrets are set, GitHub repo and environments are configured. CI pipeline can now be wired up.

---

## Phase 3: User Story 3 – Automated CI/CD Deployment (Priority: P2)

**Goal**: A push to `main` or `develop` triggers GitHub Actions, runs all tests, and deploys to PROD or DEV respectively. Pull requests trigger CI only.

**Independent Test**: Push a trivial code change to `main` → observe the Actions tab on GitHub → confirm the pipeline runs `build-cms`, `build-frontend`, `deploy-cms`, `deploy-frontend` jobs in order → confirm the live PROD URL reflects the change within 10 minutes.

- [x] T023 [P] Add `[deploy]` release command to `packages/cms/fly.toml`: `release_command = "npx prisma migrate deploy"` so Prisma migrations run atomically before each new CMS version goes live
- [x] T024 [P] Update `packages/frontend/fly.toml` under `[env]`: add comment lines documenting that `NUXT_PUBLIC_API_BASE_URL` and `NUXT_PUBLIC_APP_URL` are injected via `flyctl secrets set` (not hardcoded). Values must NOT appear in the committed file.
- [x] T025 Create `.github/workflows/ci.yml` with the following jobs:
  - `build-cms`: checkout → Node LTS setup → `npm ci` → run Jest tests in `packages/cms`
  - `build-frontend`: checkout → Node LTS setup → `npm ci` → run Vitest tests in `packages/frontend`
  - `deploy-cms` (needs `build-cms` + `build-frontend`, only on push to `main`/`develop`): setup `flyctl` → `flyctl deploy --config packages/cms/fly.toml --app ${{ secrets.CMS_APP_NAME }}`; select environment with `environment: ${{ github.ref == 'refs/heads/main' && 'production' || 'development' }}` — GitHub Actions supports expressions directly in the `environment:` field
  - `deploy-frontend` (needs `deploy-cms`): setup `flyctl` → `flyctl deploy --config packages/frontend/fly.toml --app ${{ secrets.FRONTEND_APP_NAME }}`; same environment expression as `deploy-cms`
- [ ] T026 [US3] Push `main` branch to GitHub: `git push -u origin main` → verify the Actions workflow triggers and all 4 jobs complete successfully → confirm PROD CMS URL responds at `https://ministrosfc-cms.fly.dev/api/v1/health` (or equivalent live check)
- [ ] T027 [US3] Create and push `develop` branch: `git checkout -b develop && git push -u origin develop` → verify the DEV pipeline triggers and deploys to `ministrosfc-cms-dev` and `ministrosfc-frontend-dev`
- [ ] T028 [US3] Open a pull request (any branch → `main`) → verify only `build-cms` and `build-frontend` run, no deploy jobs are triggered

**Checkpoint**: Every push to `main` deploys PROD; every push to `develop` deploys DEV; PRs only run tests.

---

## Phase 4: User Story 4 – Secrets Management (Priority: P2)

**Goal**: No secrets exist anywhere in the codebase or CI config files. All secrets are exclusively in Fly.io app secrets and GitHub Environment secrets. The app fails fast with a clear error if a required env var is missing.

**Independent Test**: `grep -r "JWT_SECRET\|DATABASE_URL\|CLOUDINARY_API_SECRET" .github/ packages/*/fly.toml packages/cms/src packages/frontend/src` — should return zero matches. Start the CMS with a missing env var and confirm a startup error names the missing variable.

- [x] T029 [US4] Audit all files in `.github/workflows/` — confirm no secret values are hardcoded; only `${{ secrets.* }}` references are used. **Note**: T029 depends on T025 (the `ci.yml` file must exist before this audit). Do not run T029 before T025.
- [x] T030 [US4] Audit `packages/cms/fly.toml` and `packages/frontend/fly.toml` — confirm only non-sensitive config (`API_PORT`, `NODE_ENV`, `APP_PORT`) is in `[env]`; all secrets are absent from these files
- [x] T030-pre [US4] **Write a unit test first (TDD)**: add a test in `packages/cms` that imports the env config module and asserts the process exits (or throws) with an error listing every missing required variable when `DATABASE_URL`, `JWT_SECRET`, and `REDIS_URL` are absent from `process.env`. The test MUST be written and failing before T031 begins.
- [x] T031 [P] [US4] Add startup validation to the CMS env config module: first locate it with `find packages/cms/src -name 'env.ts' -o -name 'config.ts' | head -5` and confirm the correct file path before editing. Check that each required env var (`DATABASE_URL`, `JWT_SECRET`, `REDIS_URL`, `CORS_ORIGINS`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`) is defined at process start; throw with a clear message naming every missing variable. T030-pre test must pass after this change.
- [x] T032 [P] [US4] Update `packages/cms/.env.example`: add `REDIS_URL` as the preferred single-string Redis connection var with a comment explaining the Upstash `rediss://` format; mark `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` as legacy/local-only
- [x] T032a [US4] **Update the CMS Redis client initialisation** to accept a single `REDIS_URL` (`rediss://` connection string from Upstash) when the variable is present, falling back to `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` for local Docker Compose. First locate the Redis client setup with `grep -r "createClient\|ioredis\|Redis" packages/cms/src --include="*.ts" -l | head`. This is a **blocking code change** — without it, the deployed app cannot connect to Upstash even if `REDIS_URL` is correctly set as a Fly.io secret. The T030-pre test must cover this conditional initialisation path.
- [x] T033 [US4] Update `packages/frontend/.env.example`: add `NUXT_PUBLIC_APP_URL` alongside the existing `NUXT_PUBLIC_API_BASE_URL` entry (already present in the file) with example values for local, DEV, and PROD environments. Do NOT rename `NUXT_PUBLIC_API_BASE_URL` — it is the name consumed by `nuxt.config.ts`.

**Checkpoint**: Zero secrets in any committed file; CMS fails fast with named errors on missing env vars.

---

## Phase 5: User Story 1 – Safe Repository Publication (Priority: P1)

**Goal**: The public GitHub repository contains zero sensitive data in its current state or anywhere in git history.

**Independent Test**: `truffleHog github --repo https://github.com/<org>/ministrosfc --json` — must return zero findings across the full public commit history.

- [ ] T034 [US1] Run `truffleHog github --repo https://github.com/<org>/ministrosfc --json` against the now-public repository to confirm the remote history is clean (mirrors the Phase 1 local audit result)
- [ ] T035 [US1] Verify the `.gitignore` additions from T005 are in the published history and that no `data/*.csv`, `.env`, or `.fly/` files appear in any commit on GitHub

**Checkpoint**: Repository is publicly accessible with zero secrets in history. SC-001 satisfied.

---

## Phase 6: User Story 2 – Pre-commit Protection (Priority: P1)

**Goal**: Every developer who clones the repo and runs `npm install` gets the gitleaks pre-commit hook automatically. Bad commits are blocked before reaching the repository.

**Independent Test**: Fresh clone → `npm install` → `echo 'SECRET_KEY="abc123xyz"' > /tmp/test-secret.txt && git add /tmp/test-secret.txt && git commit -m "test"` → must be blocked. Then `git reset HEAD /tmp/test-secret.txt` → commit a real code change → must succeed.

- [ ] T036 [US2] Verify on a fresh clone: `git clone https://github.com/<org>/ministrosfc.git /tmp/test-clone && cd /tmp/test-clone && npm install` → confirm `.git/hooks/pre-commit` exists and references `pre-commit`
- [ ] T037 [US2] In the fresh clone, attempt to commit a file containing a fake credential pattern (e.g., `password = "hunter2"`) → confirm the commit is blocked with a gitleaks output identifying the pattern
- [ ] T038 [US2] Attempt to commit a file from `data/` (e.g., copy `data/jugadores.csv` into the repo and stage it) → confirm the commit is blocked by the custom CSV rule in `.gitleaks.toml`
- [ ] T039 [US2] Confirm a clean commit (no secret patterns, no CSV files) passes the hook without interruption

**Checkpoint**: Pre-commit hook is verified working from a clean clone. SC-002 satisfied.

---

## Phase 7: User Story 5 – Production Monitoring (Priority: P3)

**Goal**: Errors and logs from the deployed application are accessible via Fly.io's built-in log viewer without needing direct server access.

**Independent Test**: Call `https://ministrosfc-cms.fly.dev/api/v1/nonexistent-route` → open Fly.io logs dashboard for `ministrosfc-cms` → confirm a 404 error entry appears within 60 seconds.

- [ ] T040 [US5] Open Fly.io dashboard → `ministrosfc-cms` → Monitoring → confirm live logs appear and include request/response entries
- [ ] T041 [US5] Trigger a known 404 on the PROD CMS URL → verify the error is visible in the Fly.io log stream with timestamp, HTTP method, path, and status code
- [ ] T042 [P] [US5] Confirm that the CMS HTTP request logger is outputting to stdout (required for Fly.io log capture). First locate the logger configuration with `find packages/cms/src -name 'server.ts' -o -name 'app.ts' | head -5` and confirm the actual file path; then verify `stream: process.stdout` or equivalent is set.

**Checkpoint**: Logs are live in the Fly.io dashboard. No SSH needed for basic error diagnosis. SC-005 satisfied.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [x] T043 Update `specs/018-deployment-process/spec.md` status from `Draft` to `Implemented`
- [x] T044 [P] Update the `Feature Branch` field in `specs/018-deployment-process/spec.md` from `main` to `feat/018-deployment-process`
- [x] T045 [P] Verify `packages/cms/README.md` or root `README.md` references the `quickstart.md` guide for environment setup; add a link if missing

---

## Dependencies

```
Phase 1 (History Audit + .gitignore + hooks) → MUST complete before Phase 2
Phase 2 (Infrastructure Provisioning)        → MUST complete before Phase 3
Phase 3 (CI/CD Pipeline)                     → MUST complete before Phase 5 (publication verification)
Phase 4 (Secrets Audit)
  └─ T030-pre, T031, T032, T033 → can run in parallel with Phase 3 (touch different files)
  └─ T029 → MUST follow T025 (.github/workflows/ci.yml must exist before auditing it)
Phase 5 (Publication Verification)           → Requires Phase 1 + Phase 3
Phase 6 (Pre-commit Verification)            → Requires Phase 1 + Phase 3 (needs public repo clone URL)
Phase 7 (Monitoring)                         → Requires Phase 3 (needs live PROD deployment)
Phase 8 (Polish)                             → Requires all phases complete
```

## Parallel Execution Opportunities

**Within Phase 1**: T006 (`.gitleaks.toml`), T007 (`.pre-commit-config.yaml`) can be written in parallel once T004 (clean scan) is confirmed.

**Phases 3 + 4**: Once Phase 2 is complete, CI/CD setup (Phase 3) and secrets audit (Phase 4) can run in parallel — they touch different files.

**Within Phase 3**: T023 (`fly.toml` CMS) and T024 (`fly.toml` frontend) can be done in parallel.

## Implementation Strategy

**MVP scope**: Phases 1 → 2 → 3 deliver the core requirement: a safe public repository with automated deployment. Phases 4–7 harden and verify the result.

**Suggested order for a single developer**:

1. Complete Phase 1 entirely (safest to do before anything else touches git)
2. Complete Phase 2 (account creation, ~30 minutes of manual web work)
3. Complete Phase 4 in parallel with writing the workflow in Phase 3
4. Complete Phase 3 (CI/CD YAML + push to trigger it)
5. Verify Phases 5 and 6 against the live public repo
6. Complete Phase 7 and 8
