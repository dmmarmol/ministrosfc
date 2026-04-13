# Tasks: Confirmation Modal

**Input**: Design documents from `/specs/015-confirmation-modal/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are required for this feature (SC-003, SC-004, SC-005).

**Organization**: Tasks are grouped by user story for independent implementation and validation.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no unmet dependencies)
- **[Story]**: User story label for story-phase tasks only (`[US1]`)
- Each task includes an exact file path.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Install and configure required UI module.

- [X] T001 Add `@nuxt/ui` dependency in `packages/frontend/package.json`
- [X] T002 Register `@nuxt/ui` module in `packages/frontend/nuxt.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Establish reusable modal contract and test scaffolding before replacing page flows.

- [X] T003 Create `ConfirmationModal` component shell with controlled `open` contract in `packages/frontend/src/components/ui/ConfirmationModal.vue`
- [X] T004 [P] Add component test scaffold for `ConfirmationModal` in `packages/frontend/tests/components/ConfirmationModal.test.ts`
- [X] T005 [P] Add/adjust shared test stubs for Nuxt UI modal rendering in `packages/frontend/tests/stubs/nuxt-ui.ts`

**Checkpoint**: Reusable modal foundation exists and is test-ready.

---

## Phase 3: User Story 1 - Admin Confirms Sensitive Actions via Modal (Priority: P1) 🎯 MVP

**Goal**: Replace native `confirm()` prompts in sensitive admin actions with a reusable `ConfirmationModal` built on `@nuxt/ui` Modal.

**Independent Test**: Trigger delete and non-delete sensitive admin flows, verify modal behavior (confirm/cancel/escape/backdrop), and confirm business outcomes remain intact.

### Tests for User Story 1 (write first, ensure failing before implementation)

- [X] T006 [P] [US1] Add unit tests for confirm success/cancel/backdrop/escape in `packages/frontend/tests/components/ConfirmationModal.test.ts`
- [X] T007 [P] [US1] Add unit tests for async confirm failure + loading/disable behavior in `packages/frontend/tests/components/ConfirmationModal.test.ts`
- [X] T008 [P] [US1] Update delete-flow test coverage for player modal integration in `packages/frontend/tests/components/PlayerDeleteModal.test.ts`
- [X] T009 [P] [US1] Create or update admin-games confirmation tests in `packages/frontend/tests/unit/admin-games-confirmation.test.ts`
- [X] T010 [P] [US1] Create or update admin-teams confirmation tests in `packages/frontend/tests/unit/admin-teams-confirmation.test.ts`
- [X] T011 [P] [US1] Create or update admin-tournaments confirmation tests in `packages/frontend/tests/unit/admin-tournaments-confirmation.test.ts`
- [X] T012 [P] [US1] Create or update admin-playgrounds confirmation tests in `packages/frontend/tests/unit/admin-playgrounds-confirmation.test.ts`

### Implementation for User Story 1

- [X] T013 [US1] Implement `ConfirmationModal` wrapper on top of Nuxt UI Modal in `packages/frontend/src/components/ui/ConfirmationModal.vue`
- [X] T014 [US1] Refactor `PlayerDeleteModal` to delegate layout/behavior to `ConfirmationModal` in `packages/frontend/src/components/player/PlayerDeleteModal.vue`
- [X] T015 [US1] Replace native `confirm()` delete flow with `ConfirmationModal` in `packages/frontend/src/pages/admin/games/index.vue`
- [X] T016 [US1] Replace native `confirm()` delete flow with `ConfirmationModal` in `packages/frontend/src/pages/admin/teams/index.vue`
- [X] T017 [US1] Replace native `confirm()` delete flow with `ConfirmationModal` in `packages/frontend/src/pages/admin/tournaments/index.vue`
- [X] T018 [US1] Replace native `confirm()` delete flow with `ConfirmationModal` in `packages/frontend/src/pages/admin/playgrounds/index.vue`
- [X] T019 [US1] Ensure focus-return handling from invoking controls across affected admin pages in `packages/frontend/src/pages/admin/games/index.vue`, `packages/frontend/src/pages/admin/teams/index.vue`, `packages/frontend/src/pages/admin/tournaments/index.vue`, and `packages/frontend/src/pages/admin/playgrounds/index.vue`
- [X] T020 [US1] Add non-delete sensitive-action confirmation tests (activate/deactivate flow) in `packages/frontend/tests/unit/admin-users.test.ts`
- [X] T021 [US1] Replace non-delete sensitive-action native interaction with `ConfirmationModal` (activate/deactivate flow) in `packages/frontend/src/pages/admin/players/index.vue`
- [X] T022 [US1] Add role/flow parity confirmation tests for non-delete sensitive actions in `packages/frontend/tests/unit/admin-users.test.ts`

**Checkpoint**: Sensitive admin actions use `ConfirmationModal`; native `confirm()` removed from source flows.

---

## Phase 4: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and cleanup across story scope.

- [X] T023 [P] Verify no `window.confirm` or global `confirm` remains under `packages/frontend/src/**` using direct source search (`grep`/`rg`) in CI/local checks
- [X] T024 Run full frontend test suite and fix regressions in `packages/frontend/tests/`
- [X] T025 [P] Update feature documentation notes in `specs/015-confirmation-modal/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: starts immediately.
- **Phase 2 (Foundational)**: depends on Phase 1.
- **Phase 3 (US1)**: depends on Phase 2.
- **Phase 4 (Polish)**: depends on Phase 3.

### Within User Story 1

- Tests first: T006-T012 and T020 before T013-T022.
- Core component implementation: T013 before page replacements T015-T018.
- Integration refactor: T014 after T013.
- Focus-return and non-delete sensitive-action updates: T019-T022 after or alongside T015-T018.

### Parallel Opportunities

- T004 and T005 can run in parallel after T003.
- T006-T012 can run in parallel.
- T015-T018 can run in parallel once T013 is complete.
- T019 and T022 can run after page modal wiring; T020 can run in parallel with other story tests; T021 depends on T013 and T020.
- T023 and T025 can run in parallel during polish.

---

## Parallel Example: User Story 1

```bash
# Component test tasks (parallel)
T006, T007, T008

# Admin page test tasks (parallel)
T009, T010, T011, T012

# Page migration tasks (parallel after T013)
T015, T016, T017, T018
```

---

## Implementation Strategy

### MVP First (US1 only)

1. Complete Phase 1 and Phase 2.
2. Implement and validate US1 (Phase 3).
3. Run polish validation (Phase 4).

### Incremental Delivery

1. Deliver `ConfirmationModal` + `PlayerDeleteModal` refactor first.
2. Migrate each admin page flow in small batches.
3. Keep tests green after each migrated page.

### Team Parallel Strategy

1. Developer A: `ConfirmationModal` + core tests.
2. Developer B: admin page migrations (games/teams).
3. Developer C: admin page migrations (tournaments/playgrounds) + focus-return checks.

---

## Notes

- `[P]` tasks are safe to parallelize when dependencies are met.
- Story label is used only for user-story phase tasks.
- All sensitive admin action replacements must preserve existing backend call semantics.
- Use source-only search scope for SC-001 compliance: `packages/frontend/src/**`.
