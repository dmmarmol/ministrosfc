# Quickstart: Validate the first production release

Run these in order. Steps marked **owner** need the owner's accounts; everything else runs from the repository. Details of each interface are in `contracts/`.

## Prerequisites

- Node.js and npm installed, workspace dependencies installed (`npm install`).
- Local services only when running the CMS integration tests (`npm run docker:up`; ask before starting or stopping containers).
- For pipeline checks: write access to the repository and the `development` GitHub environment configured.

## A. Local checks (no accounts needed)

1. **Unit and integration tests**
   - `npm test --workspace=@ministrosfc/cms -- --runInBand`
   - `npm run test --workspace=@ministrosfc/frontend -- --run`
   - Expect: all pass, including new tests for environment validation, health endpoints, config endpoint, Docker hygiene, game-status throttling, robots/headers and photo input visibility.
2. **Workflow lint**: `actionlint` over `.github/workflows` reports no errors.
3. **Image hygiene**: building the CMS image locally and listing its files shows no `.env*` (only `.env.example` may be absent or present by design).
4. **Startup rules**: starting the CMS with `APP_ENV=production` and a `localhost` CORS origin, or with one Cloudinary variable set, fails with a message naming the problem; starting it with `APP_ENV=development REDIS_DISABLED=true` and no Redis succeeds.
5. **Idle behavior**: run the CMS locally, leave it with no traffic for 10 minutes while watching database query logs; expect no queries after startup.

## B. DEV pipeline (develop branch)

1. Merge a small change touching only the CMS to `develop`. Expect: both test suites run, the CMS deploys to `ministrosfc-cms-dev`, readiness verification passes, then the frontend deploys and its checks pass (both apps ship together).
2. Merge a docs-only change. Expect: no deployment starts.
3. Merge two CMS changes within one minute. Expect: the runs queue, never overlap, and the newest change is live at the end.
4. **Failure test**: merge a change with a deliberately failing migration on a throwaway branch pushed to `develop` (or run `workflow_dispatch` on a test branch). Expect: the release command fails, the previous version keeps serving, the run is red.
5. **Rollback test**: run `rollback.yml` for DEV. Expect: the previous image is redeployed and the health checks pass.
6. Open the DEV site as an anonymous visitor and via `curl -I`. Expect: `robots.txt` shows `Disallow: /` and responses carry `X-Robots-Tag: noindex, nofollow`.

## C. Cost controls (owner, with Neon console)

1. Before merging the compute fixes, record the Neon usage graph and the connection pattern for the `dev` branch.
2. After the fixes are on DEV, leave DEV idle for 6 hours. Expect: the compute is suspended for at least 80% of the window (SC-004) and no periodic wake-ups.
3. Send a burst of automated requests to DEV public pages (for example 1,000 requests in a minute). Expect: usage rises only for the first cache fill, rate-limited requests receive `429`, and the DEV site is not indexable.
4. Configure the Neon usage alert as written in the runbook and confirm it sends a test notification if the console offers one.

## D. Production bootstrap (owner, from the runbook)

1. Set Fly secrets for `ministrosfc-cms` and the public config check for `ministrosfc-frontend` (secret names only are listed in the runbook).
2. Create the production GitHub environment secrets, restrict the environment to `main`, and add reviewers if desired.
3. Run the seed workflow for `production` with its typed confirmation to create the admin account.
4. Merge to `main`. Expect: CMS then frontend deploy, both verifications pass, no manual step.
5. Verify as a visitor: public pages load, `robots.txt` allows indexing of public routes, the site works with the empty database (empty states, no errors).
6. Verify as admin: sign in, create and edit a record, confirm the player form shows no photo input.
7. Import the club data with the administrator CSV import on production; confirm the job report, the success state, and that Neon usage for the session is within the pre-agreed amount (SC-010).

## E. Safety checks

1. Try the "Reset CMS Database" workflow: `production` is not offered; running it for development still works.
2. Confirm a pull request from a fork cannot read production secrets (environment secrets are only exposed to the `main` push path).
3. Read the deploy run summary and confirm the commit SHA and merge are identifiable (FR-019).
