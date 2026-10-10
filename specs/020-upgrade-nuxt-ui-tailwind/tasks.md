# Tasks: 020 - Upgrade Nuxt UI Tailwind

**Input**: Design documents from `/specs/020-upgrade-nuxt-ui-tailwind/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/upgrade-validation-contract.md, quickstart.md

**Tests**: Test tasks are mandatory for this feature because `spec.md` requires frontend-suite green gates (Vitest + Playwright) and mandatory minimal-flow verification.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Lock scope, versions, and governance artifacts before implementation starts.

- [x] T001 Resolve and record locked target versions for `nuxt`, `@nuxt/ui`, and `tailwindcss` with branch-creation-date timestamp and registry provenance in `specs/020-upgrade-nuxt-ui-tailwind/locked-targets.md`
- [x] T002 Record implementation-plan approval evidence before code changes in `specs/020-upgrade-nuxt-ui-tailwind/plan-approval.md`
- [x] T003 Create execution ledger for dependency waves and status transitions in `specs/020-upgrade-nuxt-ui-tailwind/upgrade-execution-log.md`
- [x] T004 [P] Create validation evidence index for baseline/post-wave/pre-release runs in `specs/020-upgrade-nuxt-ui-tailwind/validation/evidence-index.md`
- [x] T005 [P] Define staged-rollout template and blocker fields in `specs/020-upgrade-nuxt-ui-tailwind/staged-rollout.md`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Enforce pre-upgrade quality gates and rollback policy automation.

**CRITICAL**: No user story implementation can start until this phase is complete.

- [x] T006 Define baseline test-gate command set and pass/fail criteria in `specs/020-upgrade-nuxt-ui-tailwind/baseline-test-gate.md`
- [x] T007 Execute baseline gate and capture frontend-suite (Vitest + Playwright) green evidence in `specs/020-upgrade-nuxt-ui-tailwind/validation/baseline-pre-upgrade.md`
- [x] T008 Document mandatory minimal-flow identifiers and expected assertions in `specs/020-upgrade-nuxt-ui-tailwind/validation/minimal-flow-matrix.md`
- [x] T009 Implement rollback/reconsideration gate script (`1 failure = reconsider`, `2 failures = rollback`) in `packages/frontend/scripts/enforce-upgrade-rollback.mjs`
- [x] T010 Wire rollback gate script into workspace scripts in `packages/frontend/package.json`
- [x] T011 Create rollback execution log template (decision, dependency, evidence, action) in `specs/020-upgrade-nuxt-ui-tailwind/validation/rollback-report.md`
- [x] T037 Add or update baseline minimal auth flow e2e coverage (login/register/logout) before dependency upgrades in `packages/frontend/tests/e2e/auth-minimal-flows.spec.ts`
- [x] T038 Add or update baseline minimal players flow e2e coverage (list/detail) before dependency upgrades in `packages/frontend/tests/e2e/players-minimal-flows.spec.ts`
- [x] T039 Add or update baseline minimal admin create flow e2e coverage (user/game/player create) before dependency upgrades in `packages/frontend/tests/e2e/admin-create-minimal-flows.spec.ts`

**Checkpoint**: Baseline gate and rollback policy enforcement are active.

---

## Phase 3: User Story 1 - Keep the Product Current (Priority: P1) 🎯 MVP

**Goal**: Upgrade Nuxt, Nuxt UI, and Tailwind to locked latest-stable targets without scope drift.

**Independent Test**: Dependency manifests and lockfile show the three locked targets, and compatibility notes explain any staged split without changing locked versions.

### Implementation for User Story 1

- [x] T012 [US1] Update locked Nuxt target version in `packages/frontend/package.json`
- [x] T013 [US1] Update locked Nuxt UI target version in `packages/frontend/package.json`
- [x] T014 [US1] Update locked Tailwind target version in `packages/frontend/package.json`
- [x] T015 [US1] Regenerate and commit resolved dependency graph entries for upgrade wave in `apm.lock.yaml`
- [x] T016 [P] [US1] Apply Nuxt compatibility configuration updates required by upgraded versions in `packages/frontend/nuxt.config.ts`
- [x] T017 [P] [US1] Apply Tailwind compatibility configuration updates required by upgraded versions in `packages/frontend/tailwind.config.js`
- [x] T018 [US1] Record wave outcome and status transitions for each dependency target in `specs/020-upgrade-nuxt-ui-tailwind/upgrade-execution-log.md`
- [x] T040 [US1] Execute and record frontend suite validation after each dependency upgrade wave in `specs/020-upgrade-nuxt-ui-tailwind/validation/per-wave-validation.md`
- [x] T019 [US1] If incompatibility occurs, define staged fallback wave plan and blocker notes in `specs/020-upgrade-nuxt-ui-tailwind/staged-rollout.md`
- [x] T020 [US1] Create blocker remediation entries for any blocked dependency (feature remains open until all locked targets are upgraded) in `specs/020-upgrade-nuxt-ui-tailwind/staged-rollout.md`

**Checkpoint**: Locked-version upgrade wave is applied or formally staged with blocker/follow-up tracking.

---

## Phase 4: User Story 2 - Reduce Upgrade Risk (Priority: P2)

**Goal**: Prove behavior preservation with full-suite validation and explicit minimal-flow evidence.

**Independent Test**: Post-wave evidence is fully green with zero new failures, and all mandatory minimal flows are explicitly verified.

### Tests for User Story 2

- [x] T021 [P] [US2] Re-run auth minimal flow e2e coverage (login/register/logout) on upgraded dependencies in `packages/frontend/tests/e2e/auth-minimal-flows.spec.ts`
- [x] T022 [P] [US2] Re-run players minimal flow e2e coverage (list/detail) on upgraded dependencies in `packages/frontend/tests/e2e/players-minimal-flows.spec.ts`
- [x] T023 [P] [US2] Re-run admin create minimal flow e2e coverage (user/game/player create) on upgraded dependencies in `packages/frontend/tests/e2e/admin-create-minimal-flows.spec.ts`

### Implementation for User Story 2

- [x] T024 [US2] Execute post-wave frontend suite (Vitest + Playwright) and record outcomes in `specs/020-upgrade-nuxt-ui-tailwind/validation/per-wave-validation.md`
- [x] T025 [US2] Record mandatory minimal-flow verification evidence per flow in `specs/020-upgrade-nuxt-ui-tailwind/validation/minimal-flow-verification.md`
- [x] T026 [US2] Run rollback gate script against post-wave evidence and log decision in `specs/020-upgrade-nuxt-ui-tailwind/validation/rollback-report.md`
- [x] T027 [US2] If one validation failure exists, document version reconsideration attempt and result in `specs/020-upgrade-nuxt-ui-tailwind/validation/post-wave-validation.md`
- [x] T028 [US2] If two validation failures exist, execute rollback of affected dependency versions in `packages/frontend/package.json`
- [x] T029 [US2] If rollback executed, regenerate lockfile to match reverted dependency set in `apm.lock.yaml`

**Checkpoint**: Validation contract gates are satisfied and rollback criteria are enforced.

---

## Phase 5: User Story 3 - Improve Maintainability Posture (Priority: P3)

**Goal**: Leave auditable upgrade intent, outcomes, and follow-up obligations for predictable maintenance.

**Independent Test**: Maintainers can review one artifact set and understand targets, evidence, blockers, follow-ups, and release readiness.

### Implementation for User Story 3

- [x] T030 [P] [US3] Align contract gate wording with executed evidence and outcomes in `specs/020-upgrade-nuxt-ui-tailwind/contracts/upgrade-validation-contract.md`
- [x] T031 [P] [US3] Update operator runbook for repeatable execution and staged fallback handling in `specs/020-upgrade-nuxt-ui-tailwind/quickstart.md`
- [x] T032 [US3] Publish final dependency target/status matrix with lock-date traceability in `specs/020-upgrade-nuxt-ui-tailwind/validation/final-status.md`
- [x] T033 [US3] Record blocker resolution status and ownership in `specs/020-upgrade-nuxt-ui-tailwind/staged-rollout.md`

**Checkpoint**: Upgrade decisions and evidence are fully auditable for future maintenance.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final readiness checks across stories.

- [x] T034 [P] Run pre-release frontend suite (Vitest + Playwright) and capture final green evidence in `specs/020-upgrade-nuxt-ui-tailwind/validation/pre-release-validation.md`
- [x] T035 [P] Verify all mandatory minimal flows are present in final evidence index in `specs/020-upgrade-nuxt-ui-tailwind/validation/evidence-index.md`
- [x] T036 Enforce release-go/no-go checklist and completion decision in `specs/020-upgrade-nuxt-ui-tailwind/release-decision.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Phase 1 (Setup): No dependencies.
- Phase 2 (Foundational): Depends on Phase 1. Blocks all user stories.
- Phase 3 (US1): Depends on Phase 2.
- Phase 4 (US2): Depends on Phase 3 upgrade wave output.
- Phase 5 (US3): Depends on Phase 4 validation outcomes.
- Phase 6 (Polish): Depends on completion of US1, US2, and US3.

### User Story Dependencies

- US1 (P1): Starts after Foundational phase; no dependency on other stories.
- US2 (P2): Depends on US1 dependency upgrades being applied or formally staged.
- US3 (P3): Depends on US2 evidence artifacts and gate outcomes.

### Within Each User Story

- Baseline minimal-flow test definition tasks (T037-T039) must be completed before US1 implementation starts.
- For US2, test execution tasks (T021-T023) must be completed before validation execution tasks (T024-T029).
- Dependency manifest changes (T012-T014) must be completed before lockfile refresh (T015).
- Any rollback (T028-T029) must be driven by gate output from T026.

---

## Parallel Opportunities

- Setup: T004 and T005 can run in parallel after T001-T003.
- Foundational: T008 and T009 can run in parallel; T010 depends on T009.
- US1: T016 and T017 can run in parallel after T012-T015.
- US2: T021, T022, and T023 can run in parallel before T024.
- US3: T030 and T031 can run in parallel before T032-T033.
- Polish: T034 and T035 can run in parallel before T036.

---

## Parallel Example: User Story 1

```bash
Task: "T016 [US1] Apply Nuxt compatibility configuration updates in packages/frontend/nuxt.config.ts"
Task: "T017 [US1] Apply Tailwind compatibility configuration updates in packages/frontend/tailwind.config.js"
```

## Parallel Example: User Story 2

```bash
Task: "T021 [US2] Re-run auth minimal flow e2e coverage in packages/frontend/tests/e2e/auth-minimal-flows.spec.ts"
Task: "T022 [US2] Re-run players minimal flow e2e coverage in packages/frontend/tests/e2e/players-minimal-flows.spec.ts"
Task: "T023 [US2] Re-run admin create minimal flow e2e coverage in packages/frontend/tests/e2e/admin-create-minimal-flows.spec.ts"
```

## Parallel Example: User Story 3

```bash
Task: "T030 [US3] Align contract gate wording in specs/020-upgrade-nuxt-ui-tailwind/contracts/upgrade-validation-contract.md"
Task: "T031 [US3] Update runbook in specs/020-upgrade-nuxt-ui-tailwind/quickstart.md"
```

---

## Implementation Strategy

### MVP First (US1)

1. Complete Phase 1 and Phase 2.
2. Complete US1 (Phase 3) to apply locked-version upgrades and staged fallback definition if needed.
3. Validate upgrade wave output before proceeding.

### Incremental Delivery

1. Deliver US1 locked-target upgrade/staged plan.
2. Deliver US2 validation evidence and rollback enforcement.
3. Deliver US3 maintainability and handoff artifacts.
4. Finalize in Phase 6 pre-release gate.

### Notes

- `[P]` means safe parallelization with no unmet dependency.
- This task set respects feature scope constraints: compatibility-only changes for Nuxt, Nuxt UI, and Tailwind.
- Any incompatibility must be handled via staged rollout documentation and mandatory follow-up tracking, not by changing locked target definitions.
