# Data Model: Dropdown with Inline Add-More

## Entity: DropdownOption

- Purpose: Canonical option representation consumed by the component.
- Fields:
  - `id: string` (required, non-empty)
  - `label: string` (required, non-empty, user-facing)
  - `meta?: Record<string, unknown>` (optional extensibility)
- Validation rules:
  - `id` and `label` are mandatory.
  - `label` should be trimmed before rendering/search.
- Type location: `packages/frontend/src/components/ui/DropdownAddMore.vue` (inline export) — frontend-only type; does not cross the CMS boundary, no `@ministrosfc/shared` placement required.

## Entity: DropdownLabels

- Purpose: Configurable UI copy with Spanish defaults.
- Fields:
  - `placeholder?: string`
  - `addNew?: string` default `"Agregar nueva..."`
  - `empty?: string` default `"Sin opciones disponibles"`
  - `noResults?: string` default `"Sin resultados"`
  - `retry?: string` default `"Reintentar"`
- Validation rules:
  - Empty-string overrides are allowed but discouraged.
  - Missing values fall back to defaults.
- Note: `loading` copy is no longer a label field — vue-select renders its own spinner via the `loading` prop; no text override is needed.

## Entity: ComponentState (wrapper-level only)

- Purpose: Explicit UI state owned by the wrapper. vue-select owns the open/closed/search state internally; the wrapper only owns creation-mode and error state.
- State values managed by the wrapper:
  - `open_create` — inline creation mini-form is visible inside `list-footer` slot
  - `error` — a creation-attempt error message is displayed
- State values owned by vue-select (not managed by wrapper):
  - `closed` / `open_list` — open/closed state
  - `loading` — passed as a prop; vue-select renders the spinner
  - `empty` / `no_results` — driven by the `options` array length and search query; handled via the `no-options` slot

## Relationships

- `DropdownAddMore` wraps one `v-select` instance from `vue-select@beta`.
- `DropdownAddMore` consumes many `DropdownOption` items (via `options` prop).
- `DropdownAddMore` consumes one `DropdownLabels` configuration (via `labels` prop).
- Parent provides an `onCreate` async callback that receives the creation payload and returns a `Promise<DropdownOption>`.
- Parent owns data source and creates/refreshes `DropdownOption` collection.

## State Transitions (wrapper-level)

1. `[list open]` → `open_create`: user clicks "Agregar nueva…" in the `list-footer` slot.
2. `open_create` → `[list open]`: user cancels or presses Escape.
3. `open_create` → `[closed, new option selected]`: `onCreate` resolves → wrapper appends option + sets modelValue → vue-select closes.
4. `open_create` → `error`: `onCreate` rejects → error message shown inside the mini-form.
5. `error` → `open_create`: user edits and retries.
6. vue-select handles all transitions between closed, open, and loading states independently.

## Invariants

- Delete action is never exposed (FR-006). `clearable: false`, `deselectFromDropdown: false` passed to `v-select`.
- "Agregar nueva…" is always rendered via `list-footer` slot, regardless of search state or options count.
- Empty or error state must preserve create-entry access path (footer is always mounted when dropdown is open).
