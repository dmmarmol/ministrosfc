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

## Entity: DropdownLabels

- Purpose: Configurable UI copy with Spanish defaults.
- Fields:
  - `placeholder?: string`
  - `addNew?: string` default `"Agregar nueva..."`
  - `empty?: string` default `"Sin opciones disponibles"`
  - `noResults?: string` default `"Sin resultados"`
  - `loading?: string` default `"Cargando opciones..."`
  - `retry?: string` default `"Reintentar"`
- Validation rules:
  - Empty-string overrides are allowed but discouraged.
  - Missing values fall back to defaults.

## Entity: CreateDraftPayload

- Purpose: Inline create payload emitted to parent.
- Fields:
  - `payload: Record<string, unknown>` (required)
- Validation rules:
  - Component only checks presence; domain validation is owned by parent.

## Entity: ComponentState

- Purpose: Explicit UI state model.
- State values:
  - `closed`
  - `open_list`
  - `open_create`
  - `loading`
  - `empty`
  - `error`
- Derived signals:
  - `hasOptions = options.length > 0`
  - `hasSelection = modelValue !== null && modelValue !== ""`

## Relationships

- `DropdownAddMore` consumes many `DropdownOption` items.
- `DropdownAddMore` consumes one `DropdownLabels` configuration.
- `DropdownAddMore` emits one `CreateDraftPayload` per create submission.
- Parent owns data source and creates/refreshes `DropdownOption` collection.

## State Transitions

1. `closed -> open_list` on trigger click.
2. `open_list -> closed` on outside click or option selection.
3. `open_list -> open_create` on fixed "Agregar nueva..." click.
4. `open_create -> open_list` on cancel or Escape.
5. `open_create -> closed` on successful create + auto-selection.
6. `open_list -> loading` while options are being fetched.
7. `loading -> open_list` when options resolve with data.
8. `loading -> empty` when options resolve empty.
9. `loading -> error` on fetch failure.
10. `error -> loading` on retry action.

## Invariants

- Delete action is never exposed (FR-006).
- "Agregar nueva..." is always rendered as fixed last option while dropdown is open.
- Empty or error state must preserve create entry access path.
