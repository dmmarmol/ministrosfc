# Tasks: Dropdown with Inline Add-More

**Input**: Design documents from `/specs/012-dropdown-add-more/`  
**Prerequisites**: plan.md (required), spec.md (required)

**Tests**: TDD is required for all testable component behavior. Write failing tests before implementation for each story and use the final phase only for regression hardening.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3, US4)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Create reusable base structures for a generic dropdown component

- [ ] T001 Create reusable dropdown option and labels types in `packages/frontend/src/types/dropdown-add-more.ts`
- [ ] T002 Create UI component file scaffold in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T003 [P] Add Spanish default copy constants for labels/messages in `packages/frontend/src/types/dropdown-add-more.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core component behaviors required by all user stories

**CRITICAL**: No user story implementation should start before this phase completes

### Tests for Foundational Phase (write first)

- [ ] T003A [P] Add foundational component tests for trigger state, outside click, emits contract, and FR-006 no-delete guardrails in `packages/frontend/tests/components/DropdownAddMore.test.ts`
- [ ] T003B [P] Add component tests for rapid open/close interactions to verify debounce/flicker protection in `packages/frontend/tests/components/DropdownAddMore.test.ts`

- [ ] T004 Implement open/close state and trigger rendering in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T005 Implement close-on-outside-click behavior in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T006 Implement generic props/emits contract (`select`, `request-create-open`, `submit-create`, `cancel-create`, `retry`) plus configurable fetch callback contract (`fetchOptions(query?)`) in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T006A Implement debounced open/close state transitions to prevent flicker during rapid interaction in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T007 [P] Create developer sandbox route `/playground-dropdown-playground` in `packages/frontend/src/pages/playground-dropdown-playground.vue` with explicit checks for open/select, inline-create, and empty/loading/error/retry states
- [ ] T007A [P] Enforce FR-006 guardrails: no delete UI, no delete emits, no delete callbacks in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T007C [P] Add playground scenarios for rapid toggle behavior and modal/scroll-container positioning checks in `packages/frontend/src/pages/playground-dropdown-playground.vue`

**Checkpoint**: Foundation ready for independent user story implementation

---

## Phase 3: User Story 1 - Select from Existing Options (Priority: P1) 🎯 MVP

**Goal**: Users can open the dropdown, see options, select one, and reflect selected value.

**Independent Test**: Render component with preloaded options, open dropdown, select one option, verify selected label and close behavior.

### Tests for User Story 1 (write first)

- [ ] T007B [P] [US1] Add component tests for options rendering, selection event, preselected value display, and scrollable list behavior in `packages/frontend/tests/components/DropdownAddMore.test.ts`
- [ ] T007D [P] [US1] Add component tests for rendering a missing selected value with a visible fallback indicator when the option is absent from the fetched list in `packages/frontend/tests/components/DropdownAddMore.test.ts`

### Implementation for User Story 1

- [ ] T008 [US1] Render options list from provided options prop in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T009 [US1] Emit selection event and close dropdown after option click in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T010 [US1] Render preselected value label in trigger when model value exists in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T010A [US1] Render missing selected values with a visual indicator and preserve reselection behavior when the current value is absent from the options list in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T011 [US1] Add scrollable options container styles for long lists in `packages/frontend/src/components/ui/DropdownAddMore.vue`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Add New Entry Inline (Priority: P1)

**Goal**: Users can click fixed "Agregar nueva..." option and complete inline creation flow.

**Independent Test**: Open dropdown, click "Agregar nueva...", submit valid payload, verify parent event and auto-selection path support.

### Tests for User Story 2 (write first)

- [ ] T011A [P] [US2] Add component tests for add-new visibility, create-mode open/cancel, success auto-selection, and inline validation retention in `packages/frontend/tests/components/DropdownAddMore.test.ts`
- [ ] T011B [P] [US2] Add component tests for optimistic local append and background refresh-sync behavior after successful inline creation in `packages/frontend/tests/components/DropdownAddMore.test.ts`

### Implementation for User Story 2

- [ ] T012 [US2] Render fixed last option "Agregar nueva..." with visual separator in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T013 [US2] Implement create mode toggle and render inline creation slot/section in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T014 [US2] Emit create-submit and create-cancel events from inline creation actions in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T014A [US2] Implement explicit success path: append created option, auto-select it, emit selected value, and close dropdown in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T014B [US2] Preserve the created option locally and trigger a background refresh-sync path when parent-side list refresh lags or fails after successful creation in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T015 [US2] Keep dropdown open on inline validation errors and preserve user input in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T016 [US2] Add Escape behavior to dismiss inline create mode without creating entry in `packages/frontend/src/components/ui/DropdownAddMore.vue`

**Checkpoint**: User Story 2 is fully functional and independently testable

---

## Phase 5: User Story 3 - Search/Filter Options (Priority: P2)

**Goal**: Users can optionally filter options in large lists.

**Independent Test**: Enable search, type query, verify matching options and "Sin resultados" behavior while keeping "Agregar nueva..." visible.

### Tests for User Story 3 (write first)

- [ ] T016A [P] [US3] Add component tests for search filtering, no-results state, and fixed add-new visibility during filtering in `packages/frontend/tests/components/DropdownAddMore.test.ts`

### Implementation for User Story 3

- [ ] T017 [US3] Add optional search input controlled by `searchEnabled` prop in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T018 [US3] Implement case-insensitive in-memory label filtering in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T019 [US3] Render "Sin resultados" message when filtered list is empty in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T020 [US3] Keep fixed "Agregar nueva..." option visible when search yields no matches in `packages/frontend/src/components/ui/DropdownAddMore.vue`

**Checkpoint**: User Story 3 is fully functional and independently testable

---

## Phase 6: User Story 4 - Empty and Loading States (Priority: P2)

**Goal**: Component provides clear loading, empty, and error states.

**Independent Test**: Toggle loading/empty/error props and verify each UI state and retry event handling.

### Tests for User Story 4 (write first)

- [ ] T020A [P] [US4] Add component tests for loading, exact empty-state message, error state, retry emit, and fetch callback behavior in `packages/frontend/tests/components/DropdownAddMore.test.ts`
- [ ] T020B [P] [US4] Add component tests for dropdown visibility and positioning behavior inside modal or scrollable container contexts in `packages/frontend/tests/components/DropdownAddMore.test.ts`

### Implementation for User Story 4

- [ ] T021 [US4] Render loading state indicator while options are being fetched in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T022 [US4] Render empty state message while still showing "Agregar nueva..." option in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T023 [US4] Render error state with "Reintentar" action and emit `retry` event in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T023A [US4] Ensure dropdown positioning remains visible within modal and scrollable container contexts in `packages/frontend/src/components/ui/DropdownAddMore.vue`

**Checkpoint**: User Story 4 is fully functional and independently testable

---

## Phase 7: Integration & Polish (Cross-Cutting)

**Purpose**: Adopt component in real forms and finalize quality checks

- [ ] T024 Integrate `DropdownAddMore.vue` into game create location field in `packages/frontend/src/pages/admin/games/create.vue`
- [ ] T025 Integrate `DropdownAddMore.vue` into game edit location field in `packages/frontend/src/pages/admin/games/[id]/edit.vue`
- [ ] T026 [P] Add final UX pass for configurable labels/defaults and Spanish copy in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [ ] T027 Run manual quick validation of US1-US4 acceptance criteria, confirm SC-005 reuse across both integrated contexts, and validate all documented edge-case behaviors in `specs/012-dropdown-add-more/spec.md`
- [ ] T027A Measure SC-001 by integrating the component into a new form context from a clean starting point and record whether setup completes within 15 minutes in `specs/012-dropdown-add-more/quickstart.md`
- [ ] T027B Measure SC-004 in the playground and one integrated form using browser performance tooling, validating options render within 500ms after data availability, and record the method/results in `specs/012-dropdown-add-more/quickstart.md`
- [ ] T028 Expand regression coverage for combined US1-US4 behavior in `packages/frontend/tests/components/DropdownAddMore.test.ts`
- [ ] T029 Add regression coverage for fetch callback contract (`fetchOptions`) and retry event behavior in `packages/frontend/tests/components/DropdownAddMore.test.ts`
- [ ] T030 Add regression coverage to assert FR-006 (no delete affordances/events/callbacks) in `packages/frontend/tests/components/DropdownAddMore.test.ts`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately
- **Foundational (Phase 2)**: Depends on Setup; blocks all user stories
- **User Stories (Phase 3-6)**: Depend on Foundational completion
- **Integration & Polish (Phase 7)**: Depends on completion of desired user stories
- **Regression hardening (Phase 7)**: Executes after story-level TDD coverage and integrations are in place

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2
- **US2 (P1)**: Can start after Phase 2; uses foundational emits/state
- **US3 (P2)**: Can start after Phase 2; benefits from US1 list rendering
- **US4 (P2)**: Can start after Phase 2

### Parallel Opportunities

- Phase 1: T003 can run in parallel with T001-T002
- Phase 2: T003A can run in parallel with T001-T003, and T007 can run in parallel with T004-T006
- Story work: US3 and US4 can run in parallel after US1/US2 core structure stabilizes
- Polish: T026 can run in parallel with T024-T025
- Regression tests: T028-T030 can run in parallel

---

## Parallel Example

```bash
# After foundational phase:
T017 + T021

# During polish:
T024 + T025 + T026
```

---

## Implementation Strategy

### MVP First

1. Complete Phase 1 and Phase 2
2. Deliver US1 (core dropdown selection)
3. Deliver US2 (inline add flow)
4. Validate and demo before adding P2 enhancements

### Incremental Delivery

1. US1 + US2 -> core reusable component
2. US3 -> search/filter enhancement
3. US4 -> resilient states enhancement
4. Integrate into create/edit forms and polish

---

## Notes

- Foundational and story-level tests must be written before implementation begins to satisfy the constitution's TDD rule.
- Canonical component test file path for this feature is `packages/frontend/tests/components/DropdownAddMore.test.ts`.
