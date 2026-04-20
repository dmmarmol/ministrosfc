# Quickstart: Deployment Process

**Spec**: 018 — Deployment Process  
**Purpose**: Step-by-step guide for first-time infrastructure setup, ongoing developer onboarding, and secret rotation.

---

## Prerequisites

Install these tools once on your machine:

```bash
# Fly.io CLI
brew install flyctl

# pre-commit (for gitleaks hook)
brew install pre-commit

# truffleHog (one-time history audit only)
brew install trufflehog

# git filter-repo (history rewriting, if needed)
brew install git-filter-repo
```

---

## Part 1 — One-Time: Git History Audit (Before Publishing the Repository)

Run this on a clean clone to avoid accidents:

```bash
git clone --mirror /path/to/local/ministrosfc ministrosfc-audit
cd ministrosfc-audit

# Scan all history for secrets
trufflehog git file://$(pwd) --json > /tmp/findings.json 2>&1

# Review findings (open in your editor)
cat /tmp/findings.json
```

If findings include CSV files or secrets:

```bash
# Remove data/ directory from ALL commits (if any CSV was committed)
git filter-repo --path data/ --invert-paths

# Remove a specific file from history
git filter-repo --path packages/cms/.env --invert-paths

# Replace a hardcoded secret with REDACTED across all commits
# 1. Create replacements.txt:
#    actual_secret_value==>REDACTED
# 2. Apply:
git filter-repo --replace-text /tmp/replacements.txt

# Verify: re-scan — should return no findings
trufflehog git file://$(pwd) --json
```

Once clean, this becomes the repository that gets pushed to GitHub.

---

## Part 2 — One-Time: Infrastructure Setup

### 2.1 Neon (PostgreSQL)

1. Create account at [neon.tech](https://neon.tech) — no credit card needed
2. Create a new project: `ministrosfc`
3. Copy the **main branch connection string** → this is `DATABASE_URL` for PROD
4. In the Neon console, click "Branches" → "New Branch" → name it `dev` (branch from `main`)
5. Copy the **dev branch connection string** → this is `DATABASE_URL` for DEV

### 2.2 Upstash (Redis)

1. Create account at [upstash.com](https://upstash.com) — no credit card needed
2. Create database: `ministrosfc-prod` (region: São Paulo / us-east-1)
   - Copy the `UPSTASH_REDIS_REST_URL` or the standard `rediss://` URL → `REDIS_URL` for PROD
3. Create database: `ministrosfc-dev`
   - Copy the URL → `REDIS_URL` for DEV

### 2.3 Fly.io

```bash
flyctl auth login

# Create all 4 apps
flyctl apps create ministrosfc-cms         --org personal
flyctl apps create ministrosfc-frontend    --org personal
flyctl apps create ministrosfc-cms-dev     --org personal
flyctl apps create ministrosfc-frontend-dev --org personal
```

Set secrets for **PROD CMS** (`ministrosfc-cms`):

```bash
flyctl secrets set \
  DATABASE_URL="postgresql://..." \
  JWT_SECRET="<generate: openssl rand -hex 64>" \
  REDIS_URL="rediss://..." \
  CORS_ORIGINS="https://ministrosfc-frontend.fly.dev" \
  CLOUDINARY_CLOUD_NAME="..." \
  CLOUDINARY_API_KEY="..." \
  CLOUDINARY_API_SECRET="..." \
  GOOGLE_CLIENT_ID="..." \
  GOOGLE_CLIENT_SECRET="..." \
  GOOGLE_REDIRECT_URI="https://ministrosfc-cms.fly.dev/api/v1/auth/google/callback" \
  --app ministrosfc-cms
```

Set secrets for **DEV CMS** (`ministrosfc-cms-dev`) — same structure, different values:

```bash
flyctl secrets set \
  DATABASE_URL="postgresql://... (Neon dev branch)" \
  JWT_SECRET="<generate: openssl rand -hex 64>" \
  REDIS_URL="rediss://... (Upstash dev DB)" \
  CORS_ORIGINS="https://ministrosfc-frontend-dev.fly.dev" \
  CLOUDINARY_CLOUD_NAME="..." \
  CLOUDINARY_API_KEY="..." \
  CLOUDINARY_API_SECRET="..." \
  GOOGLE_CLIENT_ID="..." \
  GOOGLE_CLIENT_SECRET="..." \
  GOOGLE_REDIRECT_URI="https://ministrosfc-cms-dev.fly.dev/api/v1/auth/google/callback" \
  --app ministrosfc-cms-dev
```

Set secrets for **PROD Frontend** (`ministrosfc-frontend`):

```bash
flyctl secrets set \
  NUXT_PUBLIC_API_BASE="https://ministrosfc-cms.fly.dev" \
  NUXT_PUBLIC_APP_URL="https://ministrosfc-frontend.fly.dev" \
  --app ministrosfc-frontend
```

Set secrets for **DEV Frontend** (`ministrosfc-frontend-dev`):

```bash
flyctl secrets set \
  NUXT_PUBLIC_API_BASE="https://ministrosfc-cms-dev.fly.dev" \
  NUXT_PUBLIC_APP_URL="https://ministrosfc-frontend-dev.fly.dev" \
  --app ministrosfc-frontend-dev
```

### 2.4 GitHub Repository

1. Create a new **public** repository at github.com/\<your-org\>/ministrosfc
2. Go to **Settings → Environments** → create two environments:
   - `production`
   - `development`
3. For each environment, add the following secrets (these are used by GitHub Actions to call `flyctl` — the actual app secrets are already set directly on Fly.io in step 2.3):

   **Both environments**:
   - `FLY_API_TOKEN` — generate at fly.io/user/personal_access_tokens

   **`production` environment**:
   - `CMS_APP_NAME` = `ministrosfc-cms`
   - `FRONTEND_APP_NAME` = `ministrosfc-frontend`

   **`development` environment**:
   - `CMS_APP_NAME` = `ministrosfc-cms-dev`
   - `FRONTEND_APP_NAME` = `ministrosfc-frontend-dev`

4. Push the repository:
   ```bash
   git remote add origin https://github.com/<org>/ministrosfc.git
   git push -u origin main
   git push -u origin develop
   ```

---

## Part 3 — Developer Onboarding (Every New Developer)

After cloning the repository:

```bash
# Install monorepo dependencies (also installs pre-commit hook via "prepare" script)
npm install

# Verify pre-commit hook is active
pre-commit --version
cat .git/hooks/pre-commit  # should reference pre-commit
```

Copy the environment template and fill in your local values:

```bash
cp packages/cms/.env.example packages/cms/.env
# Edit packages/cms/.env with local development values
# (local Docker Compose DB and Redis — see docker-compose.yml)

cp packages/frontend/.env.example packages/frontend/.env
# Edit packages/frontend/.env:
#   NUXT_PUBLIC_API_BASE=http://localhost:5102
#   NUXT_PUBLIC_APP_URL=http://localhost:5103
```

Start the local stack:

```bash
docker compose up -d  # starts PostgreSQL + Redis
npm run dev           # starts CMS + Frontend concurrently
```

---

## Part 4 — Secret Rotation

When rotating a secret (e.g., JWT_SECRET, database password):

```bash
# Generate a new secret
openssl rand -hex 64

# Update on Fly.io (rolling restart happens automatically)
flyctl secrets set JWT_SECRET="<new-value>" --app ministrosfc-cms

# If rotating for DEV as well
flyctl secrets set JWT_SECRET="<new-dev-value>" --app ministrosfc-cms-dev
```

**Note**: After rotating `JWT_SECRET`, all existing JWT access tokens become invalid. Users will need to re-log in. Refresh tokens are stored in Redis — rotating `JWT_SECRET` alone does not invalidate refresh tokens; you must also flush the Upstash Redis database if a full session purge is needed.

---

## Part 5 — Manual Deploy (Emergency / Bypass CI)

In rare cases where you need to deploy without waiting for the pipeline:

```bash
# Deploy CMS to PROD directly
flyctl deploy --config packages/cms/fly.toml --app ministrosfc-cms

# Deploy Frontend to PROD directly
flyctl deploy --config packages/frontend/fly.toml --app ministrosfc-frontend
```

This should only be used in genuine emergencies. The CI pipeline is the expected deployment path.

---

## Environment Summary

|                  | Local Dev                  | DEV (Cloud)                                | PROD (Cloud)                           |
| ---------------- | -------------------------- | ------------------------------------------ | -------------------------------------- |
| **Trigger**      | Manual (`npm run dev`)     | Push to `develop`                          | Push to `main`                         |
| **CMS URL**      | `http://localhost:5102`    | `https://ministrosfc-cms-dev.fly.dev`      | `https://ministrosfc-cms.fly.dev`      |
| **Frontend URL** | `http://localhost:5103`    | `https://ministrosfc-frontend-dev.fly.dev` | `https://ministrosfc-frontend.fly.dev` |
| **Database**     | Local Docker PostgreSQL    | Neon `dev` branch                          | Neon `main` branch                     |
| **Redis**        | Local Docker Redis         | Upstash `dev` DB                           | Upstash `prod` DB                      |
| **Migrations**   | `npm run migrate` (manual) | Auto on deploy (`migrate deploy`)          | Auto on deploy (`migrate deploy`)      |
