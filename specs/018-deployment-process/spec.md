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
