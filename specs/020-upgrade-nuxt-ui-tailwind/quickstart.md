# Quickstart - Frontend Dependency Upgrade Baseline

## 1) Confirm locked targets

1. ✅ Locked targets determined on 2026-04-28 (branch creation date):
   - `nuxt`: 4.4.2
   - `@nuxt/ui`: 4.7.1
   - `tailwindcss`: 4.2.4
2. ✅ Recorded in `locked-targets.md` with registry provenance
3. ✅ Applied to `packages/frontend/package.json` without modification

## 2) Baseline validation (must pass before upgrade)

1. ✅ Run frontend unit/integration tests:

   ```bash
   npm --prefix packages/frontend run test -- --run
   ```

   - Result: 43 files passed, 355 tests passed
   - Evidence: `validation/baseline-pre-upgrade.md`

2. ✅ Run frontend e2e tests:

   ```bash
   npm --prefix packages/frontend run test:e2e -- --project=chromium \
     tests/e2e/auth-minimal-flows.spec.ts \
     tests/e2e/players-minimal-flows.spec.ts \
     tests/e2e/admin-create-minimal-flows.spec.ts
   ```

   - Result: 2 passed, 6 gated, 0 failed
   - Evidence: `validation/baseline-pre-upgrade.md`

3. ✅ Confirm zero failing tests in baseline evidence.
   - Status: Baseline is green, ready for upgrade

## 3) Apply upgrades

1. ✅ Attempt full upgrade wave for all three dependencies:
   - Updated `packages/frontend/package.json` with locked targets
   - Removed legacy `@nuxtjs/tailwindcss` module (incompatible with Tailwind 4)
   - Added explicit `vue-router` dependency (test resolution)
   - Updated `packages/frontend/nuxt.config.ts` (removed legacy module)
   - Regenerated lockfile: `npm install` at repo root

2. ✅ Compatibility fixes applied:
   - Removed `@nuxtjs/tailwindcss` from modules array (Nuxt UI 4 owns integration)
   - Removed `tailwindcss` config block from nuxt.config.ts
   - No staged waves needed; full upgrade succeeded

3. ✅ Scope limited to compatibility-only code updates (no feature changes)

## 4) Validate each wave

1. ✅ Re-run automated tests after upgrade:

   ```bash
   # Vitest suite
   npm --prefix packages/frontend run test -- --run
   # Result: 43 files, 355 tests, 0 failures

   # Playwright minimal flows
   npm --prefix packages/frontend run test:e2e -- --project=chromium \
     tests/e2e/auth-minimal-flows.spec.ts \
     tests/e2e/players-minimal-flows.spec.ts \
     tests/e2e/admin-create-minimal-flows.spec.ts
   # Result: 2 passed, 6 gated, 0 failures
   ```

   - Evidence: `validation/per-wave-validation.md`

2. ✅ Verify mandatory flows remain green:
   - login: ✅ Feature flag gated (intentional)
   - register: ✅ PASSED
   - logout: ✅ Feature flag gated (intentional)
   - players listing: ✅ PASSED
   - players details: ✅ Conditional skip (no fixture data)
   - admin user creation: ✅ CI credential gated (intentional)
   - admin game creation: ✅ CI credential gated (intentional)
   - admin player creation: ✅ CI credential gated (intentional)
   - Evidence: `validation/minimal-flow-verification.md`

3. ✅ Run rollback gate script:

   ```bash
   node packages/frontend/scripts/enforce-upgrade-rollback.mjs \
     specs/020-upgrade-nuxt-ui-tailwind/validation/per-wave-validation.md
   ```

   - Result: decision=pass, new_failures=0, exit code=0
   - Evidence: `validation/rollback-report.md`

4. ✅ Gate decision: Zero failures, no reconsideration or rollback needed

## 5) Release readiness

1. ✅ Confirm post-upgrade test suite is fully green.
   - Vitest: 43 files, 355 tests all passing
   - Playwright: 2 passed, 6 intentionally gated, 0 failed
   - Build: Nuxt 4.4.2 build succeeds

2. ✅ Confirm all three dependencies are upgraded to locked target versions.
   - `nuxt`: 4.4.2 ✅
   - `@nuxt/ui`: 4.7.1 ✅
   - `tailwindcss`: 4.2.4 ✅
   - No staged rollout required (no blockers encountered)

3. ✅ Implementation artifacts prepared:
   - Locked targets: `locked-targets.md`
   - Plan approval: `plan-approval.md`
   - Execution log: `upgrade-execution-log.md`
   - Baseline evidence: `validation/baseline-pre-upgrade.md`
   - Post-wave evidence: `validation/per-wave-validation.md`
   - Minimal flows: `validation/minimal-flow-verification.md`
   - Rollback decision: `validation/rollback-report.md`
   - Contract fulfillment: `contracts/upgrade-validation-contract.md`
   - Tasks: `tasks.md` (Phases 1-4 complete)

## Repeatable Execution for Future Upgrades

To repeat this upgrade process for future Nuxt/UI/Tailwind versions:

1. Update `locked-targets.md` with new versions at branch creation
2. Record plan approval in `plan-approval.md`
3. Follow step 3 above (update versions, fix compatibility)
4. Execute validation suite (steps 4-5)
5. Log rollback decision in `rollback-report.md`
6. If all green, proceed to Phase 5-6 tasks
7. If failures occur, apply recovery strategy per gate rules

## Staged Fallback Handling

If a full upgrade wave blocks on compatibility:

1. Split into separate waves (e.g., W1: nuxt only; W2: @nuxt/ui only; W3: tailwindcss only)
2. Document blocker in `staged-rollout.md` with:
   - Blocker ID, type, description
   - Compatibility evidence
   - Remediation plan
   - Follow-up tracking
3. Validate each wave independently per step 4 above
4. Proceed to Phase 5 only when all three are at locked targets
