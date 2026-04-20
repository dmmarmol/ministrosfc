# Implementation Plan: Deployment Process

**Branch**: `feat/018-deployment-process` | **Date**: 2026-04-20 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `specs/018-deployment-process/spec.md`

---

## Summary

Set up a complete zero-cost deployment pipeline that: (1) audits and cleans git history of sensitive data, (2) hardens `.gitignore` and installs a `gitleaks` pre-commit hook, (3) deploys the CMS (Node.js/Express) and frontend (Nuxt 3) to Fly.io via GitHub Actions, (4) provisions free-tier infrastructure (Neon PostgreSQL, Upstash Redis, Cloudinary), and (5) supports two full environments — DEV and PROD — at $0/month.

---

## Technical Context

**Language/Version**: Node.js LTS (≥ v18), TypeScript strict  
**Primary Dependencies**: Fly.io CLI (`flyctl`), GitHub Actions, `gitleaks`, `pre-commit`, `truffleHog v3`, `git filter-repo`  
**Storage**: Neon (PostgreSQL, serverless), Upstash (Redis, free tier), Cloudinary (images, already configured)  
**Testing**: Vitest (frontend unit), Jest (CMS integration), Playwright (E2E)  
**Target Platform**: Fly.io (CMS + Frontend), GitHub Actions (CI/CD), macOS/Linux developer machines  
**Project Type**: Web application (monorepo — 2 deployable services)  
**Performance Goals**: Sub-10-minute CI/CD pipeline from push to live  
**Constraints**: $0/month total cost; free tier limits on all services; Fly.io 3-VM free allowance shared across DEV + PROD stacks  
**Scale/Scope**: < 30 active users; low traffic (amateur football club)

---

## Constitution Check

_GATE: Must pass before implementation. Re-checked after Phase 1 design._

- [x] **Shared types gate (Principle VII)**: No new shared types required. This spec introduces only infrastructure files (YAML workflows, TOML configs, shell scripts) — no cross-package TypeScript types are added.
- [x] **Page decomposition gate (Principle V)**: No new frontend pages are introduced by this spec.
- [x] **Page meta declaration gate (Principle V)**: No new `pages/` files are introduced by this spec.

**Constitution violations**: None. No justification required.

---

## Service Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  GitHub (Public Repository)                                      │
│  ├── .github/workflows/ci.yml    ← GitHub Actions pipeline      │
│  ├── GitHub Environments                                         │
│  │   ├── production  (secrets for PROD stack)                   │
│  │   └── development (secrets for DEV stack)                    │
└─────────────────────────────────────────────────────────────────┘
         │ push to main                    │ push to develop
         ▼                                 ▼
┌─────────────────────┐       ┌─────────────────────┐
│  PROD Stack         │       │  DEV Stack           │
│                     │       │                      │
│  Fly.io             │       │  Fly.io              │
│  ├─ ministrosfc-cms │       │  ├─ ministrosfc-cms- │
│  │   (Node.js API)  │       │  │   dev (Node.js)   │
│  └─ ministrosfc-    │       │  └─ ministrosfc-     │
│      frontend       │       │      frontend-dev    │
│      (Nuxt SSR)     │       │      (Nuxt SSR)      │
│                     │       │                      │
│  Neon: main branch  │       │  Neon: dev branch    │
│  Upstash: prod DB   │       │  Upstash: dev DB     │
│  Cloudinary: shared │       │  Cloudinary: shared  │
└─────────────────────┘       └─────────────────────┘
```

---

## Project Structure

### Documentation (this feature)

```text
specs/018-deployment-process/
├── plan.md              ← this file
├── research.md          ← Phase 0 output (done)
├── quickstart.md        ← Phase 1 output (environment setup guide for developers)
├── checklists/
│   └── requirements.md  ← already created
└── tasks.md             ← Phase 2 output (/speckit.tasks)
```

### Source Code Changes (repository root)

```text
.github/
└── workflows/
    └── ci.yml            ← NEW: GitHub Actions CI/CD pipeline

.gitignore                ← MODIFIED: add .env.*, .fly/, *.pem, *.key, secrets.json
.pre-commit-config.yaml   ← NEW: gitleaks pre-commit hook config
.gitleaks.toml            ← NEW: custom gitleaks rules (CSV blocking, project-specific patterns)

packages/cms/
├── fly.toml              ← REVIEWED: already exists; add [deploy] release_command for migrations
└── .env.example          ← REVIEWED: already complete; add REDIS_URL note

packages/frontend/
├── fly.toml              ← REVIEWED: already exists; verify NUXT_PUBLIC_API_BASE_URL env var
└── .env.example          ← REVIEWED: already exists; add NUXT_PUBLIC_APP_URL alongside existing NUXT_PUBLIC_API_BASE_URL
```

**Structure Decision**: Infrastructure-only changes — no new `src/` directories. All new files are CI/CD config, git hooks, and documentation. The Fly.io `fly.toml` files already exist and only need minor additions (release command for Prisma migrations).

---

## Phase 0: Research (Complete)

See [research.md](./research.md) for all decisions. Summary of resolved unknowns:

| Unknown          | Resolution                                                       |
| ---------------- | ---------------------------------------------------------------- |
| Hosting platform | Fly.io (already configured via fly.toml)                         |
| Database         | Neon (serverless PostgreSQL, free forever, supports branching)   |
| Redis            | Upstash (free tier, 10K commands/day)                            |
| CI/CD            | GitHub Actions (free for public repos)                           |
| Secret scanning  | gitleaks + pre-commit framework                                  |
| History audit    | truffleHog v3 + git filter-repo                                  |
| DEV/PROD support | Yes — two Fly.io app pairs + Neon branches + GitHub Environments |

---

## Phase 1: Design

### 1.1 GitHub Actions Pipeline Design

**File**: `.github/workflows/ci.yml`

**Triggers**:

- `push` to `main` → full CI + deploy to PROD
- `push` to `develop` → full CI + deploy to DEV
- `pull_request` to `main` or `develop` → CI only (build + test, no deploy)

**Jobs**:

```
Job: test-cms
  - Checkout
  - Setup Node.js (LTS)
  - npm ci (monorepo root + packages/cms)
  - Run Jest integration tests (packages/cms)
  - Upload coverage

Job: test-frontend
  - Checkout
  - Setup Node.js (LTS)
  - npm ci (monorepo root + packages/frontend)
  - Run Vitest unit tests (packages/frontend)
  - No Playwright E2E in CI (requires live DB/Redis; tested locally)

Job: deploy-cms (needs: [test-cms, test-frontend], on push to main/develop only)
  - Checkout
  - Setup flyctl
  - flyctl deploy --app $APP_NAME --config packages/cms/fly.toml
  - Environment: "production" (main) or "development" (develop)

Job: deploy-frontend (needs: [deploy-cms])
  - Checkout
  - Setup flyctl
  - flyctl deploy --app $APP_NAME --config packages/frontend/fly.toml
  - Environment: "production" (main) or "development" (develop)
```

**Branch → App name mapping** (resolved via env variable in workflow):

| Branch    | CMS App               | Frontend App               | GitHub Environment |
| --------- | --------------------- | -------------------------- | ------------------ |
| `main`    | `ministrosfc-cms`     | `ministrosfc-frontend`     | `production`       |
| `develop` | `ministrosfc-cms-dev` | `ministrosfc-frontend-dev` | `development`      |

### 1.2 Fly.io `fly.toml` Additions

**CMS** (`packages/cms/fly.toml`):

```toml
[deploy]
  release_command = "npx prisma migrate deploy"
```

This runs Prisma migrations atomically before each new version goes live — the migration runs on the currently deployed version's machine before traffic is switched to the new version.

**Frontend** (`packages/frontend/fly.toml`):

Add env var placeholder:

```toml
[env]
  APP_PORT = "5103"
  NODE_ENV = "production"
  # NUXT_PUBLIC_API_BASE_URL injected at deploy time via flyctl secrets set
  # NUXT_PUBLIC_APP_URL  injected at deploy time via flyctl secrets set
```

> **Note**: The canonical env var name consumed by `packages/frontend/nuxt.config.ts` is `NUXT_PUBLIC_API_BASE_URL` (with `_URL` suffix). Do NOT use the shorter `NUXT_PUBLIC_API_BASE` — it is not read by the app.

### 1.3 Pre-commit Hook Design

**File**: `.pre-commit-config.yaml`

```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.x.x # pin to latest stable
    hooks:
      - id: gitleaks
```

**File**: `.gitleaks.toml` (custom rules on top of gitleaks defaults):

```toml
[extend]
  useDefault = true

[[rules]]
  id = "env-files"
  description = "Environment files must not be committed"
  regex = '''\.env'''
  path = '''\.env'''
  tags = ["secret"]
```

> **Note**: CSV blocking is handled via a dedicated `pre-commit` hook (not a gitleaks rule) because gitleaks `regex` matches **file content**, not filenames. A `.csv` file would not contain a line matching `\.csv$` as text — the rule would silently do nothing. Instead, add a `check-added-large-files` or custom `file-contents-sorter` pre-commit hook entry targeting `data/**/*.csv`, or use the `pre-commit` built-in `prevent-commit-to` check. See `.pre-commit-config.yaml` for the implementation.

**File**: `.pre-commit-config.yaml` — CSV blocking via filename pattern hook:

```yaml
repos:
  - repo: https://github.com/gitleaks/gitleaks
    rev: v8.x.x # pin to latest stable
    hooks:
      - id: gitleaks

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.x.x # pin to latest stable
    hooks:
      - id: check-added-large-files
        args: ["--maxkb=100"]
      - id: forbid-new-submodules

  - repo: local
    hooks:
      - id: no-csv-data-files
        name: Block CSV data files (player personal data)
        language: fail
        files: ^data/.*\.csv$
        entry: "CSV files in data/ contain player personal data and must not be committed"
```

**Auto-install** via `package.json` `prepare` script:

```json
"prepare": "pre-commit install || true"
```

The `|| true` ensures `npm install` does not fail on CI machines where `pre-commit` may not be installed (CI runs gitleaks as a separate step).

### 1.4 Environment Variables — Complete Inventory

**CMS** (sets via `flyctl secrets set` on Fly.io):

| Variable                | PROD value source                                             | DEV value source                           |
| ----------------------- | ------------------------------------------------------------- | ------------------------------------------ |
| `DATABASE_URL`          | Neon `main` branch connection string                          | Neon `dev` branch connection string        |
| `JWT_SECRET`            | GitHub Secret: `JWT_SECRET_PROD`                              | GitHub Secret: `JWT_SECRET_DEV`            |
| `REDIS_URL`             | Upstash prod Redis URL                                        | Upstash dev Redis URL                      |
| `CORS_ORIGINS`          | `https://ministrosfc-frontend.fly.dev`                        | `https://ministrosfc-frontend-dev.fly.dev` |
| `CLOUDINARY_CLOUD_NAME` | GitHub Secret (shared)                                        | Same                                       |
| `CLOUDINARY_API_KEY`    | GitHub Secret (shared)                                        | Same                                       |
| `CLOUDINARY_API_SECRET` | GitHub Secret (shared)                                        | Same                                       |
| `GOOGLE_CLIENT_ID`      | GitHub Secret: `GOOGLE_CLIENT_ID_PROD`                        | GitHub Secret: `GOOGLE_CLIENT_ID_DEV`      |
| `GOOGLE_CLIENT_SECRET`  | GitHub Secret: `GOOGLE_CLIENT_SECRET_PROD`                    | GitHub Secret: `GOOGLE_CLIENT_SECRET_DEV`  |
| `GOOGLE_REDIRECT_URI`   | `https://ministrosfc-cms.fly.dev/api/v1/auth/google/callback` | `https://ministrosfc-cms-dev.fly.dev/...`  |
| `NODE_ENV`              | `production` (in fly.toml)                                    | `production` (in fly.toml DEV app)         |
| `API_PORT`              | `5102` (in fly.toml)                                          | Same                                       |

**Frontend** (sets via `flyctl secrets set`):

| Variable                   | PROD                                   | DEV                                        |
| -------------------------- | -------------------------------------- | ------------------------------------------ |
| `NUXT_PUBLIC_API_BASE_URL` | `https://ministrosfc-cms.fly.dev`      | `https://ministrosfc-cms-dev.fly.dev`      |
| `NUXT_PUBLIC_APP_URL`      | `https://ministrosfc-frontend.fly.dev` | `https://ministrosfc-frontend-dev.fly.dev` |

### 1.5 `.gitignore` Additions

The following patterns are missing from the current `.gitignore`:

```gitignore
# Additional environment file variants
.env.*
!.env.example

# Fly.io local state
.fly/

# SSL/TLS certificates and private keys
*.pem
*.key
*.p12
*.pfx

# Common secret file names
secrets.json
credentials.json
service-account.json
```

**Note**: The current `.gitignore` already correctly excludes `data/` (root) and `packages/cms/data/imports/*.csv`. The `.env` and `.env.local` / `.env.*.local` patterns are already present. The additions above close the remaining gaps identified in research.md §11.

### 1.6 Git History Audit Plan (one-time, pre-publish)

This is a human-executed procedure, not automated CI. It is documented in `quickstart.md`:

1. **Scan**: `truffleHog git file:///$(pwd) --json > findings.json`
2. **Review**: examine `findings.json` for true positives
3. **Remove `data/` from history** (if any CSV was ever committed):
   ```bash
   git filter-repo --path data/ --invert-paths
   ```
4. **Scrub inline secrets** (if any found):
   ```bash
   # Create replacements.txt with: LITERAL_SECRET==>REDACTED
   git filter-repo --replace-text replacements.txt
   ```
5. **Verify**: re-run `truffleHog` — confirm zero findings
6. **Push** (one-time force push to create the public repository):
   ```bash
   git remote add origin https://github.com/<org>/ministrosfc.git
   git push --force-with-lease origin main
   ```

---

## Post-Design Constitution Check

- [x] **Shared types**: Confirmed no shared types added.
- [x] **Page decomposition**: Confirmed no new pages.
- [x] **Page meta declaration**: Confirmed no new pages.
- [x] **URL query params (Principle VI)**: No frontend state changes in this spec.
- [x] **Cost constraint**: All services confirmed at $0/month within free tier limits.
- [x] **DEV + PROD**: Confirmed achievable. Two Fly.io app pairs + Neon branches + GitHub Environments.

---

## Risks and Mitigations

| Risk                                                  | Likelihood | Impact | Mitigation                                                                                                     |
| ----------------------------------------------------- | ---------- | ------ | -------------------------------------------------------------------------------------------------------------- |
| Fly.io free tier VM count exceeded (3 VMs for 4 apps) | Medium     | High   | DEV apps use `min_machines_running = 0` — they only run during active test sessions; idle time counts as 0 VMs |
| Neon free tier: 0.5 GB storage limit                  | Low        | Medium | Project has < 1,000 games and < 100 players; historical data is well under 50 MB                               |
| Upstash 10K commands/day limit                        | Very Low   | Low    | At < 30 users, daily refresh token operations are far below 1,000/day                                          |
| `git filter-repo` corrupts local history              | Low        | High   | Always run on a clean clone; keep original as backup before rewriting                                          |
| Prisma migration failure at release_command stage     | Low        | High   | `migrate deploy` is idempotent — failed migrations roll back before traffic switches                           |
| GitHub Actions minutes exceeded                       | Very Low   | None   | Public repos have unlimited minutes                                                                            |

---

## Deployment Order (first time)

1. Run git history audit (local, one-time)
2. Update `.gitignore` and commit
3. Create Neon account → create project → note `main` branch connection string → create `dev` branch
4. Create Upstash account → create two Redis databases (prod + dev)
5. Create Fly.io account → `flyctl auth login`
6. Create all 4 Fly.io apps: `flyctl apps create ministrosfc-cms`, `ministrosfc-frontend`, `ministrosfc-cms-dev`, `ministrosfc-frontend-dev`
7. Set secrets on each app via `flyctl secrets set`
8. Create GitHub repository (public)
9. Configure GitHub Environments (`production`, `development`) with scoped secrets
10. Add `.pre-commit-config.yaml` and `.gitleaks.toml` → `pre-commit install`
11. Add `.github/workflows/ci.yml`
12. Push `main` → pipeline runs → PROD deploys
13. Create `develop` branch → push → DEV deploys
