# Baseline Pre-Upgrade Validation

Date: 2026-04-28
Stage: baseline-pre-upgrade
Result: PASS

## Command Results

### 1) Vitest

- Command: `npm --prefix packages/frontend run test -- --run`
- Exit: 0
- Summary: 43 passed files, 355 passed tests, 0 failures.

### 2) Playwright

- Command: `npm --prefix packages/frontend run test:e2e -- --project=chromium tests/e2e/auth-minimal-flows.spec.ts tests/e2e/players-minimal-flows.spec.ts tests/e2e/admin-create-minimal-flows.spec.ts`
- Exit: 0
- Summary: 2 passed, 6 skipped, 0 failed.
- Skip policy: credential-dependent flows are skipped unless required env vars are provided.

## Gate Decision

- Baseline gate is green before upgrades (satisfies FR-006 and contract gate rule 2).
- Upgrade waves may proceed.
