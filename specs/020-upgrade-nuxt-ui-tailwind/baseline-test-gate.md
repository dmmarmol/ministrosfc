# Baseline Test Gate Definition

## Gate Commands

Run from repository root:

1. `npm --prefix packages/frontend run test -- --run`
2. `npm --prefix packages/frontend run test:e2e -- --project=chromium tests/e2e/auth-minimal-flows.spec.ts tests/e2e/players-minimal-flows.spec.ts tests/e2e/admin-create-minimal-flows.spec.ts`

## Pass/Fail Criteria

- Pass: both commands exit 0 and show no failing tests.
- Fail: any non-zero exit code, timeout, or any failing test.
- Policy: no dependency upgrade task may start until baseline is green.

## Mandatory Flow Coverage Requirement

Minimal flows must be represented and validated in e2e evidence:

- auth: login, register, logout
- players: list, detail
- admin create: user, game, player
