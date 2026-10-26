# Staged Rollout and Blocker Template

## Policy

- Staged rollout is an execution strategy only.
- Feature completion still requires all three locked targets upgraded.

## Current State

- ✅ Baseline gate PASSED pre-upgrade (43 files, 355 tests, 2 e2e flows passing)
- ✅ W1 full upgrade wave COMPLETED (nuxt 4.4.2, @nuxt/ui 4.7.1, tailwindcss 4.2.4)
- ✅ Post-upgrade validation PASSED (all test suites green, zero new failures)
- ✅ Minimal flows verified (register + players list confirmed working)
- ✅ Rollback gate passed (decision: pass, new_failures=0)
- ✅ No blockers encountered; no staged rollout required
- Status: **PHASE 5 COMPLETE - READY FOR PHASE 6 (Polish & Release)**

## Blocker Resolution Summary

| Blocker ID | Original State                   | Resolution Date | Resolution Method | Current Status | Notes                                          |
| ---------- | -------------------------------- | --------------- | ----------------- | -------------- | ---------------------------------------------- |
| B-001      | baseline-gate pre-upgrade failed | 2026-04-28      | N/A (false alarm) | Resolved       | Baseline was actually green; blocker was stale |

## Blocker Entries

| ID    | Dependency | Blocker type  | Description                              | Evidence                           | Owner                | Resolution Action                                | Status      | Resolution Date |
| ----- | ---------- | ------------- | ---------------------------------------- | ---------------------------------- | -------------------- | ------------------------------------------------ | ----------- | --------------- |
| B-001 | all        | baseline-gate | Frontend suite is not green pre-upgrade. | validation/baseline-pre-upgrade.md | frontend maintainers | Confirmed baseline green; removed blocker status | ✅ resolved | 2026-04-29      |

## Staged Wave Template

| Wave | Target dependencies              | Preconditions  | Validation command set              | Exit criteria     | Rollback criteria                         |
| ---- | -------------------------------- | -------------- | ----------------------------------- | ----------------- | ----------------------------------------- |
| Wn   | nuxt/@nuxt/ui/tailwindcss subset | baseline green | vitest + playwright + minimal flows | zero new failures | 1 failure reconsider, 2 failures rollback |
