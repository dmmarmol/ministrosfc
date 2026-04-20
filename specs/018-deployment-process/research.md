# Research: Deployment Process

**Feature**: spec 018 — Deployment Process  
**Date**: 2026-04-20  
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## 1. Hosting Platform for CMS Backend

**Decision**: Fly.io  
**Rationale**: Both `packages/cms` and `packages/frontend` already have `fly.toml` configured for Fly.io (region `gru` = São Paulo). This is the path of least resistance. Fly.io's free allowances cover this project's needs: 3 shared-CPU VMs, 160 GB outbound data/month, and 3 GB of persistent volume storage. Auto-start/auto-stop is already configured in the existing `fly.toml` files, which effectively makes idle cost $0.  
**Alternatives considered**:

- Render: free web services sleep after 15 min of inactivity (unacceptable for an API); free PostgreSQL expires after 90 days
- Railway: removed free tier entirely in 2024
- Vercel (backend): not suitable for a long-running Express/Prisma server  
  **Constraint**: Fly.io requires a credit card on file to create apps, but charges $0 as long as usage stays within the free allowances. The project's low traffic (small amateur club) is well within limits.

---

## 2. Hosting Platform for Frontend

**Decision**: Fly.io (same platform as CMS)  
**Rationale**: `packages/frontend` already has `fly.toml` configured. Nuxt 3 is deployed as a Node.js SSR server on Fly.io. Keeping both services on the same platform simplifies secrets management, networking (private IPv6 between services), and CI/CD pipeline logic.  
**Alternatives considered**:

- Vercel: excellent Nuxt support via `@nuxtjs/vercel`, but splits the deployment target — two platforms to manage
- Netlify: same concern; also requires `@nuxtjs/netlify` adapter
- Cloudflare Pages: free tier for static/SSR, but Nuxt SSR on Workers has edge-case compatibility issues

---

## 3. PostgreSQL Database

**Decision**: Neon (serverless PostgreSQL)  
**Rationale**: Neon's free tier offers 0.5 GB storage, unlimited branches, and no expiration. Crucially, **Neon supports database branching natively** — a DEV branch is created from PROD with one command. This aligns perfectly with the DEV/PROD environment requirement. Connection is via standard `DATABASE_URL` (PostgreSQL protocol), so Prisma works unchanged.  
**Alternatives considered**:

- Fly.io Postgres: requires a VM (consumes 1 of 3 free VMs); not truly serverless — a dedicated machine must always be running
- Supabase: 500 MB free, but projects **pause after 1 week of inactivity** (unacceptable for a production app)
- Render PostgreSQL: deletes free databases after 90 days  
  **Migration note**: Replace `DATABASE_URL` in `packages/cms/.env` from `localhost:5100` to the Neon connection string. No Prisma schema changes required.

---

## 4. Redis (Session / Token Store)

**Decision**: Upstash Redis  
**Rationale**: Upstash offers a free Redis tier: 10,000 commands/day, 256 MB max database size, no expiration. The project uses Redis exclusively for refresh token storage (`session:refresh:{token}` keys with 30-day TTL). At this traffic scale (< 20 active users), daily command usage is far below the 10K limit. Upstash is accessed via standard Redis protocol — the existing `REDIS_HOST`/`REDIS_PORT`/`REDIS_PASSWORD` env vars map directly to Upstash credentials.  
**Alternatives considered**:

- Redis Cloud (Redis Labs): free tier (30 MB) — too small for safety margin
- Fly.io Redis via Upstash integration: same service, accessible via Fly.io's built-in Upstash extension
- Eliminating Redis: theoretically possible by storing refresh tokens in PostgreSQL, but would require a new migration and service-layer changes outside this spec's scope  
  **Connection**: Upstash provides a `rediss://` URL; the existing `ioredis` client supports TLS connections via `REDIS_URL` — update the CMS Redis initialisation to prefer `REDIS_URL` (single string) over host+port+password trio.

---

## 5. Image Storage

**Decision**: Cloudinary (already in use)  
**Rationale**: Cloudinary is already configured in `packages/cms/.env.example` and in use for player photo uploads. Free tier: 25 GB storage, 25 GB bandwidth/month. No changes required — secrets are already documented.  
**Alternatives considered**: None — Cloudinary is already the established solution.

---

## 6. CI/CD Automation

**Decision**: GitHub Actions  
**Rationale**: The project targets GitHub as its Git platform. GitHub Actions is free for **public repositories** — unlimited minutes, unlimited storage for logs. The `.github/` directory already exists (used for `agents`, `prompts`, `skills`). Adding a `workflows/` subdirectory is all that's needed. GitHub Actions natively integrates with GitHub Environments for scoped secrets (DEV vs PROD).  
**Alternatives considered**:

- CircleCI: free tier limited to 6,000 build-minutes/month
- Bitbucket Pipelines: wrong platform
- Self-hosted runner: operational overhead, not justified for this scale  
  **Pipeline structure** (per trigger):

```
push to main     → CI workflow → run tests → deploy to PROD
push to develop  → CI workflow → run tests → deploy to DEV
pull_request     → CI workflow → run tests only (no deploy)
```

---

## 7. Secrets Management

**Decision**: GitHub Environments + Fly.io secrets  
**Rationale**: GitHub Environments (`development`, `production`) allow scoping secrets per environment. Each environment's secrets are passed to GitHub Actions as `${{ secrets.VAR }}` and then forwarded to Fly.io via `flyctl secrets set`. No third-party secret vault is needed.  
**Secret inventory** (from `.env.example`):

| Secret                  | Scope                                 |
| ----------------------- | ------------------------------------- |
| `DATABASE_URL`          | Per-environment (Neon branch URL)     |
| `JWT_SECRET`            | Per-environment (different keys)      |
| `REDIS_URL`             | Per-environment (Upstash DB URL)      |
| `CLOUDINARY_CLOUD_NAME` | Shared (same Cloudinary account)      |
| `CLOUDINARY_API_KEY`    | Shared                                |
| `CLOUDINARY_API_SECRET` | Shared                                |
| `GOOGLE_CLIENT_ID`      | Per-environment (different OAuth app) |
| `GOOGLE_CLIENT_SECRET`  | Per-environment                       |
| `GOOGLE_REDIRECT_URI`   | Per-environment (different URL)       |
| `FLY_API_TOKEN`         | CI only (Fly.io deploy token)         |
| `NUXT_PUBLIC_API_BASE`  | Per-environment (CMS backend URL)     |

---

## 8. DEV + PROD Environments

**Decision**: Two full environment stacks (DEV + PROD) sharing the same GitHub repository  
**Rationale**: The spec asks whether DEV + PROD can be supported. Yes — this is achievable with zero additional cost by:

- Using **GitHub Environments** for scoped secrets
- Creating **two Fly.io app pairs**: `ministrosfc-cms` (PROD) + `ministrosfc-cms-dev` (DEV), same for frontend
- Using **Neon database branching**: a `dev` Neon branch created from `main` branch for the DEV stack
- Using **two Upstash Redis databases** (both on the free tier, each project gets one free database)

**Environment → Branch mapping**:

| GitHub branch | GitHub Environment | Fly.io apps                                        | Neon branch                  | Upstash DB |
| ------------- | ------------------ | -------------------------------------------------- | ---------------------------- | ---------- |
| `main`        | `production`       | `ministrosfc-cms` + `ministrosfc-frontend`         | `main`                       | `prod`     |
| `develop`     | `development`      | `ministrosfc-cms-dev` + `ministrosfc-frontend-dev` | `dev` (branched from `main`) | `dev`      |

**Cost**: Still $0/month — Fly.io free allowances cover 3 VMs total (CMS + Frontend = 2 VMs, the third is spare). Adding a DEV stack would require 2 more VMs (4 total), which exceeds the free allowance of 3 VMs.

**Revised decision for DEV stack**: Use **free tier spinning** — DEV apps use `min_machines_running = 0` (already set in `fly.toml`) and scale to zero when idle. In practice, DEV apps are only running during active testing sessions. This stays within the free allowance.

---

## 9. Pre-commit Secret Scanning

**Decision**: `gitleaks` via `pre-commit` framework  
**Rationale**: `gitleaks` is the industry standard for detecting hardcoded secrets in staged files and git history. The `pre-commit` framework provides auto-installation across developer machines — running `pre-commit install` after `npm install` is sufficient. A `.gitleaks.toml` config file can add custom rules for patterns specific to this project (e.g., blocking CSV files from `data/`).  
**Alternatives considered**:

- `detect-secrets` (Yelp): requires Python; more false positives
- `truffleHog`: better for deep history scanning (also used for the one-time history audit) but not designed as a pre-commit hook
- Custom bash hook: harder to maintain, no cross-platform support  
  **One-time history audit tool**: `truffleHog v3` — scans entire git history including all blobs, not just the current working tree.

---

## 10. Git History Audit & Cleanup

**Decision**: `truffleHog v3` for scanning + `git filter-repo` for rewriting  
**Rationale**: `truffleHog v3` has entropy-based and regex-based detection across the entire history. `git filter-repo` is the modern, officially recommended replacement for `git filter-branch` — faster and safer.  
**Process**:

1. Run `truffleHog git file:///path/to/repo --json` — outputs all findings
2. Review findings manually
3. Run `git filter-repo --path data/ --invert-paths` to remove the `data/` directory from all commits (if ever committed)
4. Run `git filter-repo --replace-text replacements.txt` to scrub any hardcoded secrets found
5. Force-push the rewritten history (this is a destructive one-time operation — document as such)
6. Run `truffleHog` again to confirm clean

**Note**: The `.gitignore` already includes `data/` at the repo root and `packages/cms/data/imports/*.csv`. However, if any CSV files were committed before this rule was added, they will exist in git history even if removed from the working tree. The history audit will catch this.

---

## 11. `.gitignore` Gaps

The current `.gitignore` covers most cases. Gaps identified:

| Missing pattern                    | Reason to add                                                                                                                                |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `.env.*` (all variants)            | Current rules cover `.env.local`, `.env.*.local`, etc., but not `.env.production`, `.env.staging`, `.env.develop` — these should be excluded |
| `*.pem`, `*.key`, `*.p12`          | SSL certificate private keys                                                                                                                 |
| `.fly/`                            | Fly.io local state directory                                                                                                                 |
| `secrets.json`, `credentials.json` | Common secret file names                                                                                                                     |
| `packages/cms/data/`               | Broader rule covering any CSV or import data in the CMS data directory (already partially covered)                                           |

The existing `data/` rule at the end of `.gitignore` covers the **root-level** `data/` directory (which contains the source CSVs). This is correct.
