# Contract: DropdownAddMore Component

## Component Location

- `packages/frontend/src/components/ui/DropdownAddMore.vue`

## Type Signatures

```ts
/** A generic selectable option. Frontend-only type — does not go to @ministrosfc/shared. */
export interface DropdownOption {
  id: string;
  label: string;
  meta?: Record<string, unknown>;
}

/** All user-facing label overrides. All fields optional; Spanish defaults are applied. */
export interface DropdownLabels {
  placeholder?: string;
  addNew?: string; // default: "Agregar nueva..."
  empty?: string; // default: "Sin opciones disponibles"
  noResults?: string; // default: "Sin resultados"
  retry?: string; // default: "Reintentar" (shown in error state inside mini-form)
}

export interface DropdownAddMoreProps {
  /** Currently selected option id (v-model). */
  modelValue: string | null;
  /** Full list of available options. Parent is responsible for fetching. */
  options: DropdownOption[];
  /** Whether options are currently loading. Passed through to vue-select. */
  loading?: boolean;
  /** Error message from a failed creation attempt (not a fetch error). */
  creationError?: string | null;
  /** Whether the search input is shown. Passed through to vue-select. Default: true. */
  searchable?: boolean;
  /** Whether the dropdown trigger is disabled. */
  disabled?: boolean;
  /** Async callback invoked when the inline creation form is submitted. */
  onCreate: (payload: Record<string, unknown>) => Promise<DropdownOption>;
  /** Label overrides with Spanish defaults. */
  labels?: DropdownLabels;
}
```

## Emits

```ts
type Emits = {
  /** v-model binding — emits the selected option's id. */
  (e: "update:modelValue", value: string | null): void;
  /** Emitted after an option is selected (includes full DropdownOption object). */
  (e: "select", option: DropdownOption): void;
};
```

> **Removed from previous version**: `request-create-open`, `submit-create`, `cancel-create`, `retry`.
> These were signals for the parent to manage creation state, but because creation is now
> handled inside the `list-footer` slot with an `onCreate` callback, the parent does not need
> these events. The wrapper manages `open_create` state internally.

## Slots

- `inline-create` (scoped): Content rendered inside the `list-footer` slot when the user clicks "Agregar nueva…". The parent uses this slot to supply the mini-form fields.
  - Slot props:
    - `submit(payload: Record<string, unknown>): Promise<void>` — call this when the user confirms; the wrapper invokes `onCreate`, awaits the result, and auto-selects the new option.
    - `cancel(): void` — resets to list view without creating.
    - `error: string | null` — creation error message (if `onCreate` rejected).
    - `loading: boolean` — true while `onCreate` is in flight.

## vue-select prop pass-throughs

The wrapper passes these props directly to the inner `<v-select>`:

| Wrapper prop / constant | vue-select prop        |
| ----------------------- | ---------------------- |
| `options` (mapped)      | `options`              |
| `modelValue` (mapped)   | `modelValue`           |
| `loading`               | `loading`              |
| `searchable`            | `searchable`           |
| `disabled`              | `disabled`             |
| `labels.placeholder`    | `placeholder`          |
| `true` (constant)       | `appendToBody`         |
| `false` (constant)      | `clearable`            |
| `false` (constant)      | `deselectFromDropdown` |
| `"id"` (constant)       | `reduce` (returns id)  |
| `"label"` (constant)    | `label`                |

## Behavioral Contract

1. Selecting an option emits `update:modelValue` (with the option's `id`) and `select` (with the full `DropdownOption`), then closes the dropdown.
2. Clicking "Agregar nueva…" in the footer opens the inline creation form within the same dropdown panel.
3. Submitting the inline form invokes `onCreate(payload)`. While awaiting: `loading` slot prop is `true`.
4. On `onCreate` resolve: the new `DropdownOption` is appended to the internal options list, selected automatically, and the dropdown closes. `creationError` is cleared. The `select` emit also fires (carrying the new option) — this is the component's creation notification; parents can distinguish it from a regular selection because their own `onCreate` callback will have resolved first.
5. On `onCreate` reject: `error` slot prop is set; the mini-form remains open for the user to retry.
6. Clicking cancel (or pressing Escape while in create mode) reverts to list view without creating.
7. Outside click closes the dropdown (handled by vue-select).
8. Component never renders a delete affordance and never emits delete-related events.
9. `list-footer` slot is always mounted while the dropdown panel is open, regardless of search state.

## Error/Loading/Empty Requirements

- Loading state: passed to vue-select's `loading` prop — renders a built-in spinner. The wrapper prevents duplicate `onCreate` calls while `loading` is `true`.
- Empty state: displayed via vue-select's `no-options` slot with the exact message from `labels.empty` (default: `"Sin opciones disponibles"`).
- Error state (creation error): displayed inside the `inline-create` slot via the `error` slot prop. Retry is via the same form submit.

## Non-Goals

- Multi-select
- Delete operations
- Server-side search / autocomplete
- Replacing the fetch responsibility — the parent always fetches and passes `options`
