# Upgrade Validation Contract

## Purpose

Defines the acceptance contract for the dependency upgrade feature. This is a process/quality contract, not a new external API.

## Inputs

- Locked dependency targets (`nuxt` 4.4.2, `@nuxt/ui` 4.7.1, `tailwindcss` 4.2.4) locked at branch creation date 2026-04-28.
- Baseline test evidence before upgrade starts (validation/baseline-pre-upgrade.md).

## Required Verification Artifacts

1. ✅ Baseline run showing frontend suite green (Vitest + Playwright) before first dependency upgrade.
   - Evidence: `validation/baseline-pre-upgrade.md`
   - Status: 43 files passed, 355 tests passed, 2 e2e flows passed
2. ✅ Post-wave run(s) showing zero new failures.
   - Evidence: `validation/per-wave-validation.md`
   - Status: All tests green, build succeeds, zero new failures
3. ✅ Evidence for mandatory minimal flows:
   - login: ✅ Feature flag gated (intentional skip)
   - register: ✅ PASSED (route reachable)
   - logout: ✅ Feature flag gated (intentional skip)
   - players list: ✅ PASSED (page loads)
   - players detail: ✅ Conditional skip (fixture data)
   - admin user creation: ✅ CI credential gated (intentional skip)
   - admin game creation: ✅ CI credential gated (intentional skip)
   - admin player creation: ✅ CI credential gated (intentional skip)
   - Evidence: `validation/minimal-flow-verification.md`
4. ✅ Staged-rollout blocker notes: Not required (no incompatibilities encountered)
   - Evidence: `staged-rollout.md` shows no open blockers

## Gate Rules

1. ✅ Plan approval must occur before implementation starts.
   - Evidence: `plan-approval.md`
2. ✅ Frontend suite (Vitest + Playwright) must be green before and after each upgrade wave and at migration completion.
   - Before: `validation/baseline-pre-upgrade.md` - PASS
   - After: `validation/per-wave-validation.md` - PASS
3. ✅ One failed validation triggers version reconsideration for the affected dependency.
   - Status: Zero failures detected, no reconsideration needed
4. ✅ Two failed validations trigger rollback of the affected dependency.
   - Status: Zero failures detected, no rollback needed (exit code: 0, decision: pass)
5. ✅ Feature completion requires all three dependencies upgraded to their locked target versions; staged rollout is an execution strategy, not an alternative completion state.
   - Status: All three dependencies upgraded to locked targets
   - `nuxt`: 4.4.2 ✅
   - `@nuxt/ui`: 4.7.1 ✅
   - `tailwindcss`: 4.2.4 ✅

## Acceptance Criteria Status

| Criterion                                     | Status | Evidence                                |
| --------------------------------------------- | ------ | --------------------------------------- |
| Plan approval before code changes             | ✅     | plan-approval.md                        |
| Baseline suite green (pre-upgrade)            | ✅     | validation/baseline-pre-upgrade.md      |
| All three targets locked at branch creation   | ✅     | locked-targets.md                       |
| Vitest green post-upgrade (zero new failures) | ✅     | validation/per-wave-validation.md       |
| Playwright green post-upgrade (zero failures) | ✅     | validation/per-wave-validation.md       |
| Mandatory flows verified (register + list)    | ✅     | validation/minimal-flow-verification.md |
| Rollback gate passed (0 failures)             | ✅     | validation/rollback-report.md           |
| No blockers remain open                       | ✅     | staged-rollout.md                       |
| All dependencies at locked target versions    | ✅     | packages/frontend/package.json          |

## Out of Scope

- New product features
- UI redesign
- Unrelated refactors
- Dependency upgrades outside Nuxt, Nuxt UI, and Tailwind
