# Contract: Deployment pipeline

## Workflows

| File | Purpose | Triggers |
|---|---|---|
| `ci-cms.yml` | CMS tests (Postgres + Redis services) | `pull_request`, `push` (all branches, CMS/shared paths), `workflow_call` |
| `ci-frontend.yml` | Frontend tests | `pull_request`, `push` (all branches, frontend/shared paths), `workflow_call` |
| `deploy.yml` | Orchestrated deploy | `push` to `develop` or `main`; `workflow_dispatch` (development only) |
| `rollback.yml` | Manual rollback to a previous release image | `workflow_dispatch` |
| `reset-cms-db.yml` | Reset a database | `workflow_dispatch`, **development only** |
| `seed-cms-admin.yml` | Create or update the admin user | `workflow_dispatch`; `workflow_run` after a successful **development** deploy |

`release: published` is no longer a deployment trigger.

## `deploy.yml` jobs

1. **decide**: resolves the environment (`production` only for a push to `main`; everything else, including manual dispatch, is `development`) and outputs `cms` and `frontend` booleans (`scripts/deploy/detect-changes.js`). The diff base is the head commit of the **last successful `Deploy` run on the same branch** (read with `actions: read`), falling back to `github.event.before` when there is none. Measuring from the last success matters because GitHub replaces older pending runs with newer ones: an app changed in a replaced run is still included in the next run's diff, so nothing is lost. A change to `packages/shared/**`, root package files, `deploy.yml` or `scripts/deploy/**` flags both apps; an app's own files (including its Fly files and Dockerfile) flag that app; documentation-only and unrelated changes flag neither. On `workflow_dispatch` the `apps` input (`both`, `cms`, `frontend`) decides.
2. **test-cms** / **test-frontend**: call the CI workflows with `workflow_call`; each runs only when its app is flagged and must pass before that app is deployed.
3. **deploy-cms** (runs when the CMS is flagged and its tests passed): environment = `production` on `main`, `development` on `develop`; runs `flyctl deploy --config packages/cms/fly.<environment>.toml --remote-only`; records the previous image first. The release command applies migrations before traffic switches.
4. **verify-cms**: calls the readiness endpoint with retries (up to 10 attempts, 15 s apart); on failure runs the rollback step and fails the job.
5. **deploy-frontend** (runs when the frontend is flagged and its tests passed; if the CMS is deployed in the same run it waits for it to succeed, and is skipped if the CMS deploy fails): same pattern with `fly.<environment>.toml`. A frontend-only change therefore never re-runs the CMS deploy or its migrations.
6. **verify-frontend**: requests `/`, `/roster`, `/robots.txt` and expects HTTP 200; checks that `robots.txt` matches the environment (production allows, development disallows); rollback on failure.

## Guarantees

- **Concurrency**: workflow-level `group: deploy-<environment>`, `cancel-in-progress: false`; at most one deployment per environment at a time, shared with `rollback.yml`. GitHub keeps one pending run per group and replaces older pending ones, so the newest merge is deployed last; the last-success diff base (see `decide`) guarantees replaced runs lose no changes.
- **Branch guard**: the production job has `if: github.ref == 'refs/heads/main'`.
- **Permissions**: workflow default `permissions: contents: read`; jobs request more only if needed.
- **Pinned actions**: `superfly/flyctl-actions/setup-flyctl` pinned to a released version; first-party actions pinned to major versions.
- **No secrets in logs**: verification and rollback steps never print secret values; the deploy token comes from the environment secret `FLY_API_TOKEN`.
- **Fork safety**: deploy jobs run only on `push`; pull requests (including from forks) never receive environment secrets.

## `rollback.yml` inputs

| Input | Required | Description |
|---|---|---|
| `environment` | yes | `development` or `production` |
| `app` | yes | `cms` or `frontend` |
| `version` | no | Release version to restore; default is the previous release |

Behavior: resolves the image of the chosen release with `flyctl releases --json` and redeploys it with `flyctl deploy --image`. The `production` environment's protection rules (reviewers, if configured) apply. It never reverts database migrations.

## Environment secrets (GitHub)

| Secret | Environments | Purpose |
|---|---|---|
| `FLY_API_TOKEN` | development, production | Fly token able to deploy both apps of that environment (narrowest scope the plan allows) |
| `CMS_APP_NAME` | development, production | Used only by seed/reset scripts |
| `CMS_ADMIN_EMAIL`, `CMS_ADMIN_PASSWORD` | development, production | Used only by the seed workflow, injected at run time |

`FRONTEND_APP_NAME` is no longer used by deploys (the app name lives in the Fly file). The CI workflows are named `CMS CI` and `Frontend CI` and no longer deploy; the deploy workflow is named `Deploy` (the seed workflow's `workflow_run` trigger follows it).
