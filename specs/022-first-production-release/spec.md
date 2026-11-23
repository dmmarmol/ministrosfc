# Feature Specification: First production release and automated production deployment

**Feature Branch**: `022-first-production-release`

**Created**: 2026-11-23

**Status**: Draft

**Input**: User description: "Deploy Ministros FC to production for the first time and make production deployment repeatable and automated: every merge to `main` deploys production with as little human intervention as possible, and the whole setup is described as code so it can be reproduced. Also stop the database free-tier allowance from being exhausted by idle wake-ups or non-human traffic, and settle the open questions about Redis for development and photo storage."

## Background and Constraints

Facts verified in the repository on 2026-11-23. They describe the starting point; requirements below say what must be true afterwards.

- **Applications**: two deployable apps, the public/admin website (`packages/frontend`) and the API (`packages/cms`). `packages/shared` is only used at build time and is never deployed.
- **Hosting**: two pairs of apps on the hosting provider: DEV (`ministrosfc-frontend-dev`, `ministrosfc-cms-dev`) and PRO (`ministrosfc-frontend`, `ministrosfc-cms`). One instance of each package per app.
- **DEV pipeline**: automated through `ci-frontend.yml` and `ci-cms.yml` (tests, then deploy on push to `develop`).
- **PRO pipeline**: the same workflows contain a production path, but it only runs when a GitHub Release is published, it has never been exercised, and a merge to `main` currently deploys nothing.
- **API deployment settings**: database migrations run as a release command before traffic switches; the API machine is configured to always run (never sleep); no health checks are configured; the same deployment settings file serves DEV and PRO.
- **Risky workflows**: a "Reset CMS Database" workflow can target the production environment (protected only by typing a confirmation word) and a "Seed CMS Admin" workflow can seed production on manual dispatch.
- **Image contents**: the API container image build copies any `.env*` files found in the build context.
- **Startup validation** (`packages/cms/src/config/env-validation.ts`): the API refuses to start without a database URL, a JWT secret, allowed CORS origins and a Redis connection; in production it additionally requires the three Cloudinary credentials. The frontend needs its public API base URL and public app URL.
- **Launch data decision (2026-11-23)**: production starts empty with only an admin account; the owner will import his data later through the CSV import endpoint.
- **Database**: Postgres on Neon with two branches (`production`, `dev`). Both are currently archived/suspended and the account's monthly compute allowance is exhausted until it resets in about 7 days. Prisma uses a single connection string (no separate direct/pooled URL).
- **Redis**: an Upstash database `ministrosfc-prod` exists for production. There is no DEV Redis, yet the DEV API passes startup validation today, so how DEV obtains Redis is unknown.
- **Photo storage**: a Cloudinary account exists; its original purpose is not remembered. It is the storage behind player photo uploads, which are deferred past launch (decision of 2026-11-23).
- **Suspected sources of database compute usage** (to be confirmed with data, not assumed):
  1. The API runs a game-status job on startup and every 5 minutes, and the API machine never sleeps, so the database is touched around the clock and cannot suspend; DEV and PRO multiply this.
  2. The public health endpoint queries the database and Redis on every call.
  3. Every public page view triggers API (and therefore database) queries, so crawlers or bots hitting the public URLs consume compute even though the DEV URL was never shared.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Merging to main ships to production automatically (Priority: P1)

The project owner merges a pull request into `main`. Without further action, the system runs the tests, applies any database changes safely, deploys the API and the website to production, checks that production is healthy, and reports the outcome. If anything fails, production keeps serving the previous working version.

**Why this priority**: This is the core goal of the release: repeatable production deployment with minimal human intervention.

**Independent Test**: Merge a small, harmless change to `main` and watch the pipeline: production should end up on the new version with no manual step, and a deliberately failing change must leave production untouched.

**Acceptance Scenarios**:

1. **Given** a change that touches the API, **When** it is merged to `main`, **Then** tests run, migrations are applied, the production API is deployed, and a health check confirms it before the pipeline reports success.
2. **Given** a change that touches the website, **When** it is merged to `main`, **Then** the production website is deployed and verified, and it talks to the production API.
3. **Given** a change that touches only documentation or files unrelated to either app, **When** it is merged to `main`, **Then** no production deployment is started.
4. **Given** a database migration fails during a deployment, **When** the pipeline reports the failure, **Then** the previously deployed production version is still live and serving users.
5. **Given** a production deployment completed but the new version is unhealthy, **When** the owner follows the documented rollback procedure, **Then** the previous version is restored without losing data.
6. **Given** two changes are merged in quick succession, **When** both pipelines run, **Then** production deployments do not overlap and the newest change ends up live.

---

### User Story 2 - Production is live and usable (Priority: P1)

Club members open the production website and see the roster, schedule, results and statistics. The owner signs in to the production admin area and manages data. All supporting services (database, cache, photo storage) are configured and connected so that nothing depends on a developer's machine.

**Why this priority**: Without a working first production environment there is nothing for the pipeline to deploy to.

**Independent Test**: Visit the production site anonymously and as an admin: public pages load with data, sign-in works, creating and editing a record persists, and photo upload is not offered (or clearly unavailable) without causing errors.

**Acceptance Scenarios**:

1. **Given** production is configured, **When** a visitor opens the public site, **Then** pages load with production data and no error states.
2. **Given** the owner has an admin account in production, **When** they sign in and edit a record, **Then** the change persists and is visible on the public site.
3. **Given** a required production setting is missing, **When** a deployment starts, **Then** it fails early with a message naming the missing setting, rather than starting a broken service.
4. **Given** production is running, **When** the owner opens the browser console or API responses, **Then** no secrets or internal-only configuration are exposed.
5. **Given** the production site and API run on different addresses, **When** the browser calls the API, **Then** requests succeed only from the production site's address.

---

### User Story 3 - The free database allowance is no longer exhausted (Priority: P1)

The owner can rely on the database staying within its free monthly compute allowance with the expected low number of users. Idle periods let the database go to sleep, and non-human traffic cannot drive usage up.

**Why this priority**: The database is currently unavailable because the allowance was used up; production cannot launch on a database that exhausts its allowance in days.

**Independent Test**: Leave production idle for several hours and confirm the database suspends and is not woken by background activity; send a burst of automated requests to public pages and confirm usage stays bounded.

**Acceptance Scenarios**:

1. **Given** the cause of the excess usage is unknown, **When** the owner reviews usage data, **Then** the dominant sources (background job, health checks, public page views, bots) are identified with evidence and recorded.
2. **Given** no visitors for an extended period, **When** background work runs, **Then** it does not keep the database awake (the database can suspend between genuine uses).
3. **Given** automated crawlers or bots request public pages repeatedly, **When** they exceed a reasonable rate, **Then** they are throttled, served cached content, or turned away so database usage stays bounded.
4. **Given** the DEV environment is not meant for the public, **When** it is idle or probed by outsiders, **Then** it consumes close to no database compute.
5. **Given** the allowance runs low, **When** usage crosses a defined threshold, **Then** the owner is alerted before the database is suspended.

---

### User Story 4 - The setup can be reproduced from the repository (Priority: P2)

A new maintainer (or the owner after an account loss) can rebuild both environments from the repository and a short runbook: which services exist, which settings and secrets each environment needs and where they are stored, how the pipelines map branches to environments, and what to do when something goes wrong.

**Why this priority**: The goal is infrastructure-as-code. It does not block the first launch but protects every launch after it.

**Independent Test**: A reviewer who did not build the setup follows the runbook on paper and can list every secret, environment, workflow trigger and manual step, and finds no undocumented dependency.

**Acceptance Scenarios**:

1. **Given** the repository, **When** a maintainer reads the deployment documentation, **Then** every required setting and secret for DEV and PRO is listed with its purpose and where it is stored, without showing any secret values.
2. **Given** the container image for the API, **When** it is built, **Then** it contains no `.env` files and no credentials.
3. **Given** DEV and PRO, **When** their deployment settings are compared, **Then** differences (scaling, always-on behavior, addresses) are explicit per environment rather than hidden in one shared file.
4. **Given** a new maintainer, **When** they need to deploy by hand in an emergency, **Then** the runbook gives the exact steps and the access they need.

---

### User Story 5 - Production cannot be damaged by accident (Priority: P2)

Destructive or sensitive operations (resetting the database, seeding an admin, deploying outside the normal path) cannot hit production by mistake. They are blocked for production or require deliberate, hard-to-trigger confirmation.

**Why this priority**: With real data in production, one wrong click in a workflow form could destroy it.

**Independent Test**: Try to run the database reset workflow against production with the usual confirmation and confirm it is refused or requires an extra deliberate step; confirm manual dispatches default to DEV.

**Acceptance Scenarios**:

1. **Given** the database reset workflow, **When** someone selects production, **Then** it refuses to run (or requires an additional approval defined by the owner) and states why.
2. **Given** the admin-seeding workflow, **When** it targets production, **Then** it needs explicit approval and never prints credentials.
3. **Given** production secrets, **When** a pull request from a fork or a non-protected branch runs, **Then** it has no access to them.
4. **Given** a production deployment, **When** it starts, **Then** it is traceable to the exact merge that triggered it.

---

### User Story 6 - Open service questions are settled (Priority: P3)

The owner knows, and the repository records, whether DEV uses its own cache or runs without one, and that photo storage is deferred past launch. Unused accounts are either kept for a documented reason or retired.

**Why this priority**: These are loose ends that affect configuration and cost, but they do not block the pipeline itself.

**Independent Test**: The deployment documentation states, for each external service, whether DEV and PRO use it and why.

**Acceptance Scenarios**:

1. **Given** DEV has no dedicated cache, **When** the DEV API starts, **Then** its behavior is deliberate and documented (for example, a documented fallback or a shared/disabled cache), not accidental.
2. **Given** the photo storage account, **When** the owner reviews the launch scope, **Then** the documentation states that photo upload is deferred past launch, why the account exists, and what must be configured to enable it later.

---

### Edge Cases

- The database is suspended or cold when the first request arrives: the first visitors get a working page (possibly slower) and not an error.
- The monthly allowance is exhausted: visitors see a clear, friendly unavailable message instead of broken pages, and the owner is notified.
- A deployment is triggered while another is running, or two merges land seconds apart.
- A change adds a database migration that cannot be reversed: the rollback procedure states what can and cannot be undone.
- The website is deployed before the API it depends on is ready, or the other way around: the order and compatibility rules are defined so users never see a mismatched pair.
- A required secret is missing or expired (cloud token, database password, cache password): the pipeline fails early and names the problem.
- The production health check passes but a critical user flow (sign-in, public roster) is broken.
- Search engines and crawlers index DEV: DEV should not be discoverable, while production should be.
- The hosting account's token is revoked or rotated.
- The owner uploads a large CSV right after launch: the import must not time out the request, lose rows silently, or burn through the database allowance.
- Photo upload is requested while photo storage is not configured: the user sees a clear message, not an error.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A merge to `main` MUST automatically deploy the changed application(s) to the production environment after tests pass, with no manual step in the normal case. Deployments MUST NOT depend on publishing a release.
- **FR-002**: Production deployments MUST NOT start for changes that affect neither application (for example documentation-only changes), and MUST NOT run concurrently with each other.
- **FR-003**: The pipeline MUST apply database migrations before the new API version receives traffic, and MUST leave the previous version serving users if the migration or deployment fails.
- **FR-004**: After each production deployment, the pipeline MUST verify that the API and website are healthy and MUST report failure clearly if they are not.
- **FR-005**: A documented rollback procedure MUST allow the owner to restore the previous production version, stating which data changes cannot be undone.
- **FR-006**: The existing DEV pipeline (deploy on push to `develop`) MUST keep working unchanged in behavior.
- **FR-007**: Each environment (DEV, PRO) MUST have its own explicit deployment settings, including scaling and always-on behavior, rather than sharing one file with silent overrides.
- **FR-008**: The API MUST fail to start with a clear message when a required setting is missing, and the pipeline SHOULD detect missing production settings before deploying.
- **FR-009**: The build of every deployable image MUST NOT include `.env` files, credentials or other secrets, and secrets MUST be supplied only at run time from protected storage.
- **FR-010**: The set of settings and secrets required by each environment MUST be documented (names, purpose, owner, where stored, rotation notes) without including secret values.
- **FR-011**: The API's allowed browser origins in production MUST be limited to the production website's address(es).
- **FR-012**: The dominant causes of database compute usage MUST be identified with data and recorded, and the identified causes MUST be addressed.
- **FR-013**: Background work and monitoring MUST NOT keep the database awake during idle periods; any recurring database activity MUST have a justification and a defined frequency.
- **FR-014**: Public traffic that is automated (crawlers, bots, probes) MUST be limited so that it cannot drive database usage beyond the budget; DEV MUST NOT be discoverable by search engines.
- **FR-015**: Public pages SHOULD avoid database work on every view where the data changes rarely (for example by serving recent data from a cache), within the freshness the club needs.
- **FR-016**: The owner MUST be alerted before the database free allowance is exhausted.
- **FR-017**: The database reset workflow MUST NOT be able to target production without an additional deliberate safeguard defined by the owner, and the admin-seeding workflow MUST require explicit approval for production and MUST NOT expose credentials.
- **FR-018**: Production secrets MUST be reachable only by workflows running on the protected production path (merges to `main`), not by pull requests from forks or other branches.
- **FR-019**: Every production deployment MUST be traceable to the commit and merge that produced it.
- **FR-020**: Production MUST launch with an empty business database containing only a working administrator account, created without storing credentials in the repository. All club data is loaded after launch by the owner through the existing administrator CSV import (from CSV files exported from the club's spreadsheet).
- **FR-021**: The administrator CSV import MUST work reliably on production: it MUST accept the owner's real file sizes, complete or fail with a clear report instead of timing out silently, be safe to re-run, and MUST NOT exhaust the database allowance for a typical import.
- **FR-022**: Player photo upload is NOT part of the launch. Production startup validation MUST NOT require photo storage credentials, and while photo storage is not configured the product MUST behave gracefully (no photo upload offered, or a clear "not available" message) with players shown without photos and no errors.
- **FR-023**: How DEV obtains its cache (own instance, shared instance, or none) MUST be decided and documented, and DEV and PRO MUST NOT share cache data accidentally.
- **FR-024**: A deployment runbook MUST describe how to deploy manually in an emergency, how to read pipeline results, who holds which accounts, and how to rotate each secret.

### Key Entities

- **Environment**: DEV or PRO. Has its own applications, database branch, cache, secrets, addresses and scaling behavior.
- **Deployment**: One execution of the pipeline for an environment, tied to a commit, with a result (succeeded, failed, rolled back) and a health verdict.
- **Secret / Setting**: A named piece of configuration required by an application or pipeline, with an owner, storage location and rotation procedure.
- **Database allowance**: The monthly free compute budget shared by the environments' database branches; consumed by every query and every wake-up.
- **External service account**: Hosting, database, cache and photo storage accounts, each with a documented purpose per environment.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: From the moment a change is merged to `main`, it is live in production within 15 minutes with zero manual steps in at least 9 of 10 consecutive deployments.
- **SC-002**: In a deliberate failure test (failing migration, failing tests, unhealthy build), production keeps serving the previous version 100% of the time and the owner sees a clear failure report.
- **SC-003**: A rollback to the previous version can be completed by the owner in under 10 minutes following the runbook.
- **SC-004**: Over a full month with the expected club-sized audience, database compute usage stays below 70% of the monthly free allowance, and during any 6-hour idle window the database is suspended for at least 80% of the time.
- **SC-005**: A burst of 1,000 automated requests to public pages in one minute does not increase database compute usage beyond a small, pre-agreed amount and does not degrade the site for real visitors.
- **SC-006**: A reviewer who did not build the setup can list every required secret, environment and manual step from the documentation alone, and finds no secret value or `.env` content in the repository, workflows or built images.
- **SC-007**: Attempting the database reset on production through the normal workflow form is blocked in 100% of tries; DEV remains resettable.
- **SC-008**: The owner receives an alert before the free allowance is exhausted, at least 3 days ahead of projected exhaustion at the current usage rate.
- **SC-009**: After launch, an anonymous visitor can load the public roster and schedule, and the admin can sign in and edit a record, on the first attempt on production.
- **SC-010**: The owner can import the club's full data set through the administrator CSV import on production in a single session, with a clear success or error report, and without exceeding the free database allowance.

## Assumptions

- Production starts on the hosting provider's default addresses; a custom domain is out of scope for this feature and can be added later.
- DEV remains a private working environment: it may scale to zero, is not meant for public traffic, and is not indexed by search engines. Production is public and indexable.
- The free tiers of the hosting, database, cache and photo storage providers remain the target; moving to paid plans is a fallback, not the plan.
- The existing pipelines, hosting apps and the production cache database are reused rather than recreated.
- The owner accepts that cold starts after idle periods may make the first request slower.
- Required approvals for production changes are the pull request review and merge; no extra manual approval gate is added to the normal deployment (the owner may add one later through the repository's environment settings).
- The version bump and git tag for this release follow the constitution's package version management rules.
- Production launches empty; the owner loads data afterwards with the administrator CSV import, using files exported from a spreadsheet he maintains. Importing historical data during the deploy itself is out of scope.
- Player photo upload is deferred; the existing photo storage account is kept but not required for launch, and enabling it later is a separate, small change.
- Out of scope: new product features, redesigning the database schema, multi-region deployment, and a staging environment beyond DEV and PRO.
