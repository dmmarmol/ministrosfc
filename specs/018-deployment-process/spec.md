# Feature Specification: Deployment Process

**Feature Branch**: `feat/018-deployment-process`  
**Created**: 2026-04-20  
**Status**: Implemented  
**Input**: User description: "Set up a deployment process to deploy the application to a hosting service. Validate commit history for sensitive data. Use GitHub as the git platform with a public repository. Ensure $0/month hosting cost. Set up monitoring and logging."

## User Scenarios & Testing _(mandatory)_

### User Story 1 – Project owner safely publishes the repository on GitHub (Priority: P1)

Before making the project public on GitHub, the project owner audits the entire commit history to confirm no sensitive data — such as database credentials, API keys, JWT secrets, or CSV data files — has ever been committed. Any sensitive data found in history is permanently removed. The repository is then published as public with confidence that no secrets are exposed.

**Why this priority**: This is the foundational prerequisite for all other stories. A public repository with leaked secrets in its history would expose the entire system to compromise. It must be completed first.

**Independent Test**: After history audit and cleanup, run an automated scan across all commits — no secrets, credentials, or CSV files should be found in any commit, including rewritten ones. Then publish the repository and confirm public access works.

**Acceptance Scenarios**:

1. **Given** the project has a local git history, **When** a full history scan is performed, **Then** a report identifies every commit and file that contains potentially sensitive data (credentials, tokens, CSV files, `.env` files).
2. **Given** sensitive data is found in commit history, **When** remediation is applied, **Then** the rewritten history contains no sensitive data in any commit, and the repository can be pushed to GitHub safely.
3. **Given** the repository is published as public on GitHub, **When** any person browses the full commit history, **Then** no credentials, API keys, secrets, or CSV data files are accessible at any point in the history.
4. **Given** the `.gitignore` file exists, **When** reviewed and updated, **Then** it explicitly excludes all `.env*` files, `data/*.csv` files, any secrets management files, and other known sensitive patterns.

---

### User Story 2 – Developer is prevented from accidentally committing sensitive data (Priority: P1)

Any developer working on the project is blocked from committing files or content that match known sensitive data patterns. When they attempt to commit a file containing secrets or a file that should be ignored, the commit is rejected with a clear message explaining what was found and how to fix it.

**Why this priority**: Auditing history once is not enough — ongoing prevention is required to protect the public repository from future accidental exposure, especially as the team grows.

**Independent Test**: Attempt to commit a `.env` file or a file containing a hardcoded token. The commit must be rejected automatically before it is recorded in history. A clean commit with no secrets must pass through.

**Acceptance Scenarios**:

1. **Given** a developer stages a `.env` file for commit, **When** they run `git commit`, **Then** the commit is blocked and a message identifies the problematic file.
2. **Given** a developer stages a file containing a string matching common secret patterns (e.g., a token, a password assignment), **When** they run `git commit`, **Then** the commit is blocked with a message identifying the matched pattern.
3. **Given** a developer stages a CSV file from the `data/` directory, **When** they run `git commit`, **Then** the commit is blocked because CSV files contain player personal data.
4. **Given** a developer stages a file with no sensitive content, **When** they run `git commit`, **Then** the commit proceeds normally without interruption.
5. **Given** a new team member clones the repository and runs the project setup, **When** they complete setup, **Then** the pre-commit protection is automatically active without manual configuration.

---

### User Story 3 – Project owner deploys the application to a free hosting service automatically (Priority: P2)

When code is merged to the main branch on GitHub, the application — both the CMS backend and the frontend — is automatically built, tested, and deployed to a free hosting service without any manual steps. The deployment runs in a CI/CD pipeline that is visible on GitHub.

**Why this priority**: Manual deployments are error-prone and inconsistent. Automated deployment is the primary goal of this feature and delivers ongoing value after the repository is set up.

**Independent Test**: Merge a code change to `main` → observe the CI/CD pipeline run on GitHub → verify the change appears on the live deployed URLs for both backend and frontend within a reasonable time.

**Acceptance Scenarios**:

1. **Given** a commit is pushed to the `main` branch, **When** the CI/CD pipeline triggers, **Then** it builds the application, runs all tests, and deploys only if tests pass.
2. **Given** any test fails during the pipeline, **When** the pipeline runs, **Then** deployment is skipped and the team is notified of the failure.
3. **Given** the pipeline runs successfully, **When** it completes, **Then** the new version is live on the public hosting URLs for both the backend API and the frontend.
4. **Given** the deployment targets free hosting tiers, **When** the application is running, **Then** the monthly infrastructure cost is $0.
5. **Given** a deployment completes, **When** a user visits the deployed frontend URL, **Then** the application loads correctly and communicates with the deployed backend.

---

### User Story 4 – Developer stores secrets securely so they are never in the codebase (Priority: P2)

All secrets required by the application — database connection strings, JWT secrets, API keys — are stored in the hosting platform's environment variable or secrets management system, not in any file committed to the repository. The application reads these values from the environment at runtime.

**Why this priority**: A public repository requires that all secrets live exclusively outside the codebase. This is a prerequisite for the CI/CD pipeline to run securely.

**Independent Test**: Review the entire codebase and CI/CD configuration files — no hardcoded credentials, tokens, or connection strings should appear. Deploy the application with environment variables set on the hosting platform and confirm it starts correctly.

**Acceptance Scenarios**:

1. **Given** the application is deployed, **When** the runtime configuration is inspected, **Then** all secrets are injected via environment variables and none are hardcoded in source files or CI/CD configuration files.
2. **Given** a required environment variable is missing, **When** the application starts, **Then** it fails with a clear error message identifying the missing variable.
3. **Given** the CI/CD pipeline runs, **When** it accesses secrets (e.g., deployment tokens, database URLs), **Then** these values are sourced from the hosting platform's secrets store, not from committed files.

---

### User Story 5 – Project owner monitors the deployed application for errors and issues (Priority: P3)

After deployment, the project owner can view logs from both the backend and frontend to diagnose errors and track usage. When an unhandled error occurs in production, it is captured and visible in the logging interface without requiring a developer to SSH into a server.

**Why this priority**: Without visibility into production issues, bugs may go undetected. However, this is lower priority than getting the application deployed correctly.

**Independent Test**: Trigger a known error in production (e.g., call an invalid route) → check that the error appears in the logging interface with enough context to diagnose the problem.

**Acceptance Scenarios**:

1. **Given** the application is deployed, **When** a user action causes a backend error, **Then** the error is captured and visible in the logging interface with a timestamp, error message, and stack context.
2. **Given** the application is running, **When** a team member opens the logging interface, **Then** they can see recent application logs without direct server access.
3. **Given** the free hosting service provides built-in logging, **When** the application is deployed, **Then** logging is enabled by default at no additional cost.

---

### Edge Cases

- What happens when the deployment pipeline cannot reach the hosting service due to a temporary outage?
- How does the system handle a failed database migration during deployment?
- What if a secret is rotated — how are the running instances updated without downtime?
- What happens if the free tier usage limits are exceeded (e.g., memory, bandwidth)?
- What if a team member installs a dependency that introduces a `.env` file template not covered by `.gitignore`?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The repository MUST be fully audited for sensitive data across all existing commits before being published to GitHub.
- **FR-002**: Any sensitive data found in the commit history MUST be permanently removed such that it is inaccessible in the published public history.
- **FR-003**: The `.gitignore` file MUST explicitly exclude all environment files (`.env`, `.env.*`, `.env.local`, etc.), CSV data files (`data/*.csv`), and any secrets management files.
- **FR-004**: A pre-commit hook MUST be installed that scans staged files for known sensitive data patterns and rejects commits that contain them.
- **FR-005**: The pre-commit hook MUST be automatically activated for any developer who clones the repository and completes the standard project setup steps.
- **FR-006**: All application secrets (database credentials, JWT secrets, API keys, cloud storage credentials) MUST be stored exclusively in the hosting platform's environment variable or secrets management system.
- **FR-007**: The CI/CD pipeline MUST trigger automatically on every push to the `main` branch (→ PROD deployment) and on every push to the `develop` branch (→ DEV deployment).
- **FR-008**: The CI/CD pipeline MUST run all automated tests before deploying; deployment MUST be skipped if any test fails.
- **FR-009**: The CI/CD pipeline MUST deploy both the CMS backend and the frontend to their respective hosting services upon successful test runs.
- **FR-010**: The total monthly infrastructure cost of the deployed application MUST be $0 using free tiers only.
- **FR-011**: The deployed application MUST produce logs accessible to the team without direct server access, using the hosting platform's built-in logging at no additional cost.
- **FR-012**: A documented guide MUST be provided explaining how team members handle sensitive data, how to rotate secrets, and how to set up a local development environment.
- **FR-013**: The CI/CD design MUST support independent verification and deployment of CMS and frontend so a failure in one pipeline does not hide status in the other.
- **FR-014**: The deployment process MUST include an operator-triggered database reset workflow for the DEV environment with explicit confirmation controls to prevent accidental data destruction.
- **FR-015**: The deployment process MUST include a controlled DEV admin-seeding workflow that can run only after a successful DEV database reset.
- **FR-016**: After any DEV database reset, cached application data MUST be cleared before validation/import steps to prevent stale API responses.
- **FR-017**: The deployment process MUST define the frontend callback origin as an explicit runtime variable for CMS authentication redirects so DEV and PROD can be configured independently.

### Key Entities

- **CI/CD Pipeline**: The automated process that runs on GitHub on every push to `main`; performs build, test, and deploy stages sequentially.
- **Pre-commit Hook**: A local script that runs before each `git commit` to scan staged content for sensitive patterns; blocks commits that match.
- **Environment Variable**: A runtime configuration value injected by the hosting platform; never stored in source files or committed history.
- **Hosting Service**: A free-tier platform that runs the CMS backend and frontend; provides logs, environment variable management, and HTTPS.
- **Commit History Audit**: A one-time scan of all past commits to identify and remove any previously committed sensitive data before publishing.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Zero secrets, credentials, or sensitive CSV files are findable by an automated scan across the full public commit history at time of publication.
- **SC-002**: 100% of attempted commits containing sensitive data patterns are blocked by the pre-commit hook before reaching the repository.
- **SC-003**: A code change merged to `main` is live on the deployed hosting service within 10 minutes of the merge, with no manual steps required.
- **SC-004**: The deployed application operates at $0/month total infrastructure cost on free hosting tiers.
- **SC-005**: Any unhandled production error is visible in the team's logging interface within 60 seconds of occurrence.
- **SC-006**: All team members can set up a working local development environment using only the repository and a documented environment variable template, without needing any secrets from other team members.

## Assumptions

- The application uses Docker Compose for local development only; cloud services (database, Redis, hosting) are provisioned manually once via web consoles and are not managed by Docker Compose.
- Two full environments are supported: **PROD** (triggered by `main`) and **DEV** (triggered by `develop`). Each environment has its own Fly.io apps, Neon database branch, and Upstash Redis instance.
- The application uses Docker Compose for local development; the hosting platform may or may not use Docker — the CI/CD pipeline will adapt as needed.
- The free hosting service selected will support the application's technology stack (Node.js for CMS, Nuxt/Vue for frontend) on its free tier.
- Redis (used for session management) will use a free-tier managed instance or an alternative zero-cost session strategy if no free Redis is available.
- PostgreSQL (used as the primary database) will use a free-tier managed instance available from the selected hosting provider or a compatible third-party free service.
- The project's low traffic volume (small team, amateur club) is well within free tier limits for all selected services.
- "GitHub Copilot" in the original description refers to GitHub Actions as the CI/CD automation platform.
- CSV files in `data/` contain player personal data and must be treated as sensitive regardless of the data they currently hold.

## Implemented Deployment Process Acknowledgement

The branch work merged into this specification delivered and validated the following deployment-process capabilities:

1. CI/CD split and branch targeting

- Independent CMS and frontend GitHub Actions workflows are in place.
- `develop` targets DEV deployment and `main` targets PROD deployment.
- Deployments remain test-gated (no deploy on failing tests).

2. Hosting deployment hardening

- Deployment configuration for both CMS and frontend has been normalized for reliable runtime startup.
- Release-time migration/bootstrapping behavior for CMS was aligned with the deployment process so releases are deterministic.

3. DEV reset and seed operational flow

- A dedicated workflow exists to reset DEV CMS database state.
- A follow-up workflow exists to seed the DEV admin user after reset.
- Reset flow includes explicit operator confirmation to reduce destructive-operation risk.

4. Cache consistency after reset

- Reset operations now include a post-reset Redis cache flush step (best-effort) to avoid stale reads after DB recreation/import.
- This addresses previously observed endpoint inconsistencies immediately after reset/import cycles.

5. Environment and secret management in practice

- Runtime secrets remain managed through platform secrets, not repository files.
- CMS frontend redirect origin is now explicitly configurable via runtime environment, supporting separate DEV/PROD callback behavior.

6. Operational validation performed

- DEV deployment and `import/csv` execution were validated end-to-end during this branch's work.
- Monitoring/triage relied on hosting logs and workflow run inspection as the primary operational visibility path.

## Deployment Inventory (Implemented)

### Fly.io apps and VM footprint

- PROD CMS app: `ministrosfc-cms`
- DEV CMS app: `ministrosfc-cms-dev`
- PROD frontend app: `ministrosfc-frontend`
- DEV frontend app: `ministrosfc-frontend-dev`
- CMS VM profile (base runtime target): shared-cpu-1x, 512MB memory
- Frontend VM profile (base runtime target): shared-cpu-1x, 512MB memory

### Fly.io runtime environment and secrets used

1. CMS runtime vars/secrets

- `API_PORT`
- `NODE_ENV`
- `DATABASE_URL`
- `JWT_SECRET`
- `JWT_EXPIRY`
- `REFRESH_TOKEN_EXPIRY`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `REDIS_URL`
- `REDIS_HOST`
- `REDIS_PORT`
- `REDIS_PASSWORD`
- `CORS_ORIGINS`
- `FRONTEND_URL`
- `CLOUDINARY_CLOUD_NAME`
- `CLOUDINARY_API_KEY`
- `CLOUDINARY_API_SECRET`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`

2. Frontend runtime vars/secrets

- `APP_PORT`
- `PORT`
- `NITRO_PORT`
- `HOST`
- `NITRO_HOST`
- `NODE_ENV`
- `NUXT_PUBLIC_API_BASE_URL`
- `NUXT_PUBLIC_APP_URL`
- `NUXT_PUBLIC_CLUB_NAME`
- `NUXT_PUBLIC_CLUB_SHORT_NAME`
- `NUXT_PUBLIC_PRIMARY_COLOR`

### GitHub Actions vars/secrets used for deployment and operations

- `FLY_API_TOKEN`
- `CMS_APP_NAME`
- `FRONTEND_APP_NAME`
- `CMS_ADMIN_EMAIL`
- `CMS_ADMIN_PASSWORD`
- Manual workflow inputs used operationally: `environment` and reset `confirmation`

### GitHub Actions workflows used

1. Deployment workflows

- `.github/workflows/ci-cms.yml`
  - CI + deploy for CMS
  - deploys to DEV on `develop` and to PROD on `main`
- `.github/workflows/ci-frontend.yml`
  - CI + deploy for frontend
  - deploys to DEV on `develop` and to PROD on `main`

2. Development operational workflows

- `.github/workflows/reset-cms-db.yml`
  - Optional, manual DEV DB reset workflow
  - Protected by explicit confirmation input
  - Executes reset script that now includes a post-reset Redis flush
- `.github/workflows/seed-cms-admin.yml`
  - Base admin seeding workflow for CMS
  - supports manual dispatch and post-reset workflow chaining

### Environment mapping used in practice

- `main` branch -> PROD apps (`ministrosfc-cms`, `ministrosfc-frontend`)
- `develop` branch -> DEV apps (`ministrosfc-cms-dev`, `ministrosfc-frontend-dev`)
- GitHub Environments map corresponding `CMS_APP_NAME` and `FRONTEND_APP_NAME` per environment
