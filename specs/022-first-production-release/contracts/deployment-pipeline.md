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

1. **changes**: outputs `cms` and `frontend` booleans from the changed files between `github.event.before` and `github.sha`. A change to `packages/shared/**`, root `package.json` / `package-lock.json` sets both. A change to an app's directory or its Fly files sets that app. Documentation-only changes set neither. If `before` is all zeros, both are true.
2. **test-cms** / **test-frontend**: call the CI workflows with `workflow_call`; run only if their app changed.
3. **deploy-cms** (needs test-cms, changes): environment = `production` on `main`, `development` on `develop`; runs `flyctl deploy --config packages/cms/fly.<environment>.toml --remote-only`; records the previous image first. The release command applies migrations before traffic switches.
4. **verify-cms**: calls the readiness endpoint with retries (up to 10 attempts, 15 s apart); on failure runs the rollback step and fails the job.
5. **deploy-frontend** (needs deploy-cms or skipped CMS, test-frontend): same pattern with `fly.<environment>.toml`.
6. **verify-frontend**: requests `/`, `/roster`, `/robots.txt` and expects HTTP 200; checks that `robots.txt` matches the environment (production allows, development disallows); rollback on failure.

## Guarantees

- **Concurrency**: `group: deploy-${environment}`, `cancel-in-progress: false`; at most one deployment per environment at a time.
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
| `FLY_API_TOKEN` | development, production | Deploy token scoped to that environment's apps |
| `CMS_APP_NAME` | development, production | Used only by seed/reset scripts |
| `CMS_ADMIN_EMAIL`, `CMS_ADMIN_PASSWORD` | development, production | Used only by the seed workflow, injected at run time |

`FRONTEND_APP_NAME` is no longer used by deploys (the app name lives in the Fly file).
