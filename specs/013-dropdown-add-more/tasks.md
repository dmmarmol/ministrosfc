# Tasks: Dropdown with Inline Add-More

**Branch**: `chore/013-dropdown-add-more`
**Spec**: [`/specs/013-dropdown-add-more/spec.md`](/specs/013-dropdown-add-more/spec.md)
**Plan**: [`/specs/013-dropdown-add-more/plan.md`](/specs/013-dropdown-add-more/plan.md)
**Input**: Design documents from `/specs/013-dropdown-add-more/`

---

## Phase 1: Setup

**Purpose**: Install `vue-select@beta` and wire its CSS globally.

- [x] T001 Install `vue-select@beta` in `packages/frontend` — `npm install vue-select@beta --workspace=@ministrosfc/frontend`
- [x] T002 Add `"vue-select/dist/vue-select.css"` to the `css` array in `packages/frontend/nuxt.config.ts`

**Checkpoint**: `vue-select` resolves without errors; CSS loads on dev server.

---

## Phase 2: Foundational (Blocking — complete before all user stories)

**Purpose**: Type definitions and component skeleton that all story implementations depend on.

**⚠️ CRITICAL**: No user story work can begin until T003–T005 are done.

- [x] T003 Export `DropdownOption` and `DropdownLabels` TypeScript interfaces from `packages/frontend/src/components/ui/DropdownAddMore.vue` per `/specs/013-dropdown-add-more/contracts/dropdown-add-more.contract.md`
- [x] T004 [P] Define `DropdownAddMoreProps` interface and `defineEmits` shape (`update:modelValue`, `select`) in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [x] T005 [P] Create component skeleton with `<v-select>` wired — pass `options`, `modelValue`, `loading`, `searchable`, `disabled`, `labels.placeholder`; hardcode `clearable: false`, `deselectFromDropdown: false`, `appendToBody: true`, `reduce: (o) => o.id`, `label: "label"` in `packages/frontend/src/components/ui/DropdownAddMore.vue`

**Checkpoint**: Skeleton mounts without runtime errors; vue-select renders a basic dropdown.

---

## Phase 3: User Story 1 — Select from Existing Options (Priority: P1) 🎯 MVP

**Goal**: User can open the dropdown, see all options, select one, have the value emitted, and the dropdown closes. Pre-selected value renders on mount. Outside click closes. No clear/delete button visible.

**Independent Test**: Mount with `options` + `modelValue`; verify open/select/emit/close cycle; verify no clear button.

### Tests for User Story 1

> **Write these tests FIRST and confirm they FAIL before implementing T007–T008**

- [x] T006 [P] [US1] Write Vitest tests in `packages/frontend/tests/components/DropdownAddMore.test.ts`:
  - renders trigger showing selected option's label when `modelValue` is set
  - emits `update:modelValue` with the option's `id` when an option is selected
  - emits `select` with the full `DropdownOption` object when selected
  - shows all options when opened with a populated `options` array
  - no clear/deselect button rendered (`clearable: false`)
  - `disabled: true` disables the dropdown trigger

- [x] T006B [P] [US1] Write Vitest test in `packages/frontend/tests/components/DropdownAddMore.test.ts`: when `modelValue` references an `id` absent from `options`, the trigger renders a visual fallback (e.g., greyed label or placeholder text) instead of crashing

### Implementation for User Story 1

- [x] T007 [US1] Wire `v-model` pass-through: on `<v-select>` `@update:modelValue`, emit `update:modelValue(id)` and `select(fullOption)` (look up full option from `options` array by `id`) in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [x] T007B [US1] Handle missing-value fallback: when `modelValue` is set but its `id` is not found in `options`, display the `labels.placeholder` text or a configurable fallback label in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [x] T008 [US1] Wire the `no-options` slot in `<v-select>` to display `labels.empty` (default: `"Sin opciones disponibles"`) in `packages/frontend/src/components/ui/DropdownAddMore.vue`

**Checkpoint**: T006 + T006B tests pass. Option select works; no clear button; pre-selected value renders on mount.

---

## Phase 4: User Story 2 — Add New Entry Inline (Priority: P1) 🎯 MVP

**Goal**: User clicks "Agregar nueva…" in the dropdown footer; an inline mini-form appears; they submit; the new entry is auto-selected; dropdown closes. Cancel returns to list view.

**Independent Test**: Mount with `onCreate` callback and `inline-create` slot; verify full creation roundtrip and cancel flow.

### Tests for User Story 2

> **Write these tests FIRST and confirm they FAIL before implementing T010–T015**

- [x] T009 [P] [US2] Write Vitest tests in `packages/frontend/tests/components/DropdownAddMore.test.ts`:
  - "Agregar nueva…" button is rendered when the dropdown is open
  - clicking "Agregar nueva…" exposes the `inline-create` scoped slot
  - `inline-create` slot receives `{ submit, cancel, error, loading }` props
  - calling `submit(payload)` invokes the `onCreate` prop with the payload
  - on `onCreate` resolve: new option appears; `update:modelValue` emits new id
  - on `onCreate` reject: `error` slot prop is set; mini-form remains open
  - calling `cancel()` hides the mini-form without calling `onCreate`
  - `loading` slot prop is `true` while `onCreate` is awaiting

### Implementation for User Story 2

- [x] T010 [US2] Add `open_create` ref and `creationLoading` ref to component state in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [x] T011 [US2] Implement `list-footer` slot inside `<v-select>`: show "Agregar nueva…" button (when `!open_create`) and the `inline-create` scoped slot region (when `open_create`) in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [x] T012 [US2] Implement `submit(payload)` slot function: call `props.onCreate(payload)`, set `creationLoading = true`, on resolve — append new option to `internalOptions`, emit `update:modelValue(id)` and `select(option)`, set `open_create = false`, clear `creationError` in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [x] T013 [US2] Implement `cancel()` slot function: set `open_create = false`, clear `creationError` in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [x] T014 [US2] Implement error state: on `onCreate` reject, set `creationError` ref; expose as `error` slot prop in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [x] T015 [US2] Use `internalOptions` ref (initialised from `props.options`, appended on creation success); pass to `<v-select :options="internalOptions">`; watch `props.options` to sync external updates in `packages/frontend/src/components/ui/DropdownAddMore.vue`

**Checkpoint**: T009 tests pass. Full creation roundtrip works; cancel works; error shown in slot.

---

## Phase 5: User Story 3 — Search/Filter Options (Priority: P2)

**Goal**: User types in the search field; list filters to matching options; "Agregar nueva…" footer remains visible during zero-result search.

**Independent Test**: Mount with >5 options; type partial label; verify filtered list; verify footer present on zero results.

### Tests for User Story 3

> **Write these tests FIRST and confirm they FAIL before implementing T017–T018**

- [x] T016 [P] [US3] Write Vitest tests in `packages/frontend/tests/components/DropdownAddMore.test.ts`:
  - search input is rendered when `searchable: true` (default)
  - search input is absent when `searchable: false`
  - "Agregar nueva…" footer is still visible when search returns zero matches

### Implementation for User Story 3

- [x] T017 [US3] Pass `searchable` prop through to `<v-select :searchable="searchable">` (default `true`) and `placeholder` from `labels.placeholder` in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [x] T018 [US3] Override `no-options` slot: show `labels.noResults` (default: `"Sin resultados"`) when vue-select's `search` slot prop is non-empty; show `labels.empty` when options array is empty and no search term in `packages/frontend/src/components/ui/DropdownAddMore.vue`

**Checkpoint**: T016 tests pass. Filter works via vue-select; footer preserved during zero-result state.

---

## Phase 6: User Story 4 — Empty and Loading States (Priority: P2)

**Goal**: Loading spinner shows while options are being fetched. Empty state message is correct Spanish text. Creation error shows inside the mini-form.

**Independent Test**: Mount with `loading: true`; mount with `options: []`; trigger a failing `onCreate` and verify error slot prop.

### Tests for User Story 4

> **Write these tests FIRST and confirm they FAIL before implementing T020–T021**

- [x] T019 [P] [US4] Write Vitest tests in `packages/frontend/tests/components/DropdownAddMore.test.ts`:
  - `loading: true` causes vue-select loading indicator to be present
  - `options: []` with `loading: false` shows `labels.empty` text
  - after `onCreate` rejects, `error` slot prop contains the error message
  - after a second `submit()` that resolves, `error` slot prop is cleared

### Implementation for User Story 4

- [x] T020 [US4] Confirm `loading` prop is wired to `<v-select :loading="loading">` (verify skeleton wire from T005) in `packages/frontend/src/components/ui/DropdownAddMore.vue`
- [x] T021 [US4] Verify `no-options` slot conditional logic from T018 correctly handles `options: []` + no search → shows `labels.empty` in `packages/frontend/src/components/ui/DropdownAddMore.vue`

**Checkpoint**: All US1–US4 unit tests pass — `cd packages/frontend && npx vitest run tests/components/DropdownAddMore.test.ts`.

---

## Phase 7: Integration — Replace PlaygroundSelect.vue

**Goal**: Replace `PlaygroundSelect.vue`'s hand-rolled implementation with `DropdownAddMore`. Both game form pages continue to work unchanged. `PlaygroundSelect.vue` becomes a thin adapter.

**Independent Test**: Start dev server; visit `/admin/games/create`; open playground dropdown; create a new playground inline; verify it auto-selects. Visit edit page for an existing game; verify pre-selected playground renders.

- [x] T022 [P] [US1] Refactor `packages/frontend/src/components/PlaygroundSelect.vue`: remove custom `<select>`, `showInlineForm` state, manual event handlers; import and render `<DropdownAddMore>` with `options` mapped from `usePlaygrounds().playgrounds` as `DropdownOption[]`; wire `onCreate` to call `createPlayground`; provide the `inline-create` slot with name and address fields in `packages/frontend/src/components/PlaygroundSelect.vue`
- [x] T023 [P] [US1] Verify `packages/frontend/src/pages/admin/games/create.vue` works with the refactored `PlaygroundSelect.vue` (no changes to the page itself)
- [x] T024 [P] [US1] Verify `packages/frontend/src/pages/admin/games/[id]/edit.vue` works with the refactored `PlaygroundSelect.vue` — confirm `modelValue` pre-selection renders in edit mode

**Checkpoint**: Both game pages work end-to-end; `PlaygroundSelect.vue` no longer contains custom dropdown logic.

---

## Phase 8: CSS Polish & Cross-Cutting Concerns

**Purpose**: Align vue-select style with Tailwind palette; run full validation.

- [x] T025 [P] Override vue-select CSS custom properties
- [x] T026 [P] Verify `appendToBody: true` renders the dropdown above overflow-hidden containers by manually testing the playground dropdown inside the game create form (which is inside a scrollable card)
- [x] T027 Run full frontend test suite and confirm no regressions: `cd packages/frontend && npx vitest run --reporter=verbose`
- [x] T028 [P] Run TypeScript check: `cd packages/frontend && npx tsc --noEmit 2>&1 | grep "error TS"`

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational) — BLOCKS everything below
        ├── Phase 3 (US1 — P1)
        ├── Phase 4 (US2 — P1)
        ├── Phase 5 (US3 — P2)
        └── Phase 6 (US4 — P2)
              └── Phase 7 (Integration) — needs Phase 3 + 4
                    └── Phase 8 (Polish)
```

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2. No inter-story dependency.
- **US2 (P1)**: Starts after Phase 2. No inter-story dependency.
- **US3 (P2)**: Starts after Phase 2. Shares `no-options` slot work with US4 — coordinate T018/T021.
- **US4 (P2)**: Starts after Phase 2. Overlaps with US3 on `no-options` slot.

### Parallel Opportunities Per Phase

**Phase 2** (after T001–T002):

```
T003 → T004 + T005   (T004 and T005 in parallel)
```

**Phase 3** (after Phase 2):

```
T006 (tests — write first, confirm FAIL) → T007 + T008 in parallel
```

**Phase 4** (after Phase 2):

```
T009 (tests) → T010 → T011 → T012 + T013 + T014 in parallel → T015
```

**Phase 5** (after Phase 2):

```
T016 (tests) → T017 + T018 in parallel
```

**Phase 7** (after Phase 3 + 4):

```
T022 → T023 + T024 in parallel
```

**Phase 8** (after Phase 7):

```
T025 + T026 + T027 + T028 in parallel
```

---

## MVP Scope

**Minimum shippable increment**: Phase 1 + Phase 2 + Phase 3 (US1) + Phase 4 (US2) + Phase 7 (Integration).

This delivers:

- Complete `DropdownAddMore.vue` with selection and inline creation
- `PlaygroundSelect.vue` migrated on both game form pages
- SC-005 validated (two integration contexts: create + edit game)

Phases 5–6 (US3 search, US4 loading/empty states) are additive improvements and can follow.

---

## Implementation Strategy

1. Install and verify vue-select renders (T001–T002)
2. Scaffold types and skeleton (T003–T005)
3. Write US1 tests → FAIL → implement T007–T008 → PASS
4. Write US2 tests → FAIL → implement T010–T015 → PASS
5. Integrate into `PlaygroundSelect.vue` and both game pages (T022–T024)
6. Write US3 + US4 tests → FAIL → implement → PASS
7. Polish CSS, run full test suite and TypeScript check (T025–T028)
