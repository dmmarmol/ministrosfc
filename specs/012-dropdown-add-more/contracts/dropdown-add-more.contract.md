# Contract: DropdownAddMore Component

## Component Location

- `packages/frontend/src/components/ui/DropdownAddMore.vue`

## Type Signatures

```ts
export interface DropdownOption {
  id: string;
  label: string;
  meta?: Record<string, unknown>;
}

export interface DropdownLabels {
  placeholder?: string;
  addNew?: string; // default: "Agregar nueva..."
  empty?: string; // default: "Sin opciones disponibles"
  noResults?: string; // default: "Sin resultados"
  loading?: string; // default: "Cargando opciones..."
  retry?: string; // default: "Reintentar"
}

export interface DropdownAddMoreProps {
  modelValue: string | null;
  options: DropdownOption[];
  labels?: DropdownLabels;
  loading?: boolean;
  error?: string | null;
  searchEnabled?: boolean;
  disabled?: boolean;
  fetchOptions?: (query?: string) => Promise<DropdownOption[]>;
}
```

## Emits

```ts
type Emits = {
  (e: "update:modelValue", value: string): void;
  (e: "select", option: DropdownOption): void;
  (e: "request-create-open"): void;
  (e: "submit-create", payload: Record<string, unknown>): void;
  (e: "cancel-create"): void;
  (e: "retry"): void;
};
```

## Slots

- `inline-create` (optional): parent-provided inline form content.
  - Slot props:
    - `submit(payload: Record<string, unknown>): void`
    - `cancel(): void`

## Behavioral Contract

1. Selecting an option emits `update:modelValue` and `select`, then closes dropdown.
2. Clicking fixed last option emits `request-create-open` and opens create mode.
3. Submitting inline create emits `submit-create`; parent returns updated options.
4. On parent-confirmed creation success, component appends/selects new option and closes.
5. Retry action emits `retry`.
6. Outside click closes dropdown without mutating selection.
7. Component never renders delete affordance and never emits delete-related events.

## Error/Loading/Empty Requirements

- Loading state displays indicator and prevents duplicate fetch triggers.
- Empty state uses exact default message `Sin opciones disponibles`.
- Error state presents message with retry action, while keeping create path available.

## Non-Goals

- Multi-select
- Delete operations
- Server-side search/autocomplete
