# Quickstart: Dropdown with Inline Add-More (vue-select wrapper)

## Prerequisites

- Node/NPM versions aligned with root workspace engines.
- Frontend dependencies installed from workspace root (`npm install` from repo root).

## Setup — Install vue-select

```bash
# From repo root (workspace install propagates to packages/frontend)
npm install vue-select@beta --workspace=@ministrosfc/frontend
```

Then add the CSS import to `packages/frontend/nuxt.config.ts`:

```ts
css: [
  // ...existing entries (e.g. leaflet)...
  "vue-select/dist/vue-select.css",
],
```

## Component Registration

`vue-select` registers `<v-select>` locally inside `DropdownAddMore.vue`. No global Nuxt plugin needed:

```ts
import VueSelect from "vue-select";
```

## Implementation Steps

1. Install `vue-select@beta` and add CSS to `nuxt.config.ts` (above).
2. Write the `DropdownAddMore.vue` component with props/emits per the contract.
3. Plug `<v-select>` with pass-through props and the `list-footer` slot.
4. Implement the `open_create` toggle and `inline-create` scoped slot.
5. Implement the `onCreate` callback flow: await → append → auto-select → close.
6. Implement the `no-options` slot override with Spanish string from `labels`.
7. Replace `PlaygroundSelect.vue` internals with `DropdownAddMore` and its `inline-create` slot.
8. Integrate in both game form pages:
   - `packages/frontend/src/pages/admin/games/create.vue`
   - `packages/frontend/src/pages/admin/games/[id]/edit.vue`

## Validation Steps

1. Run focused unit tests:

```bash
cd packages/frontend && npx vitest run tests/components/DropdownAddMore.test.ts --reporter=verbose
```

2. Run all frontend tests to check for regressions:

```bash
cd packages/frontend && npx vitest run --reporter=verbose
```

3. Start dev server and manually exercise both integration pages and the component in all states:

```bash
npm run dev:all
# navigate to /admin/games/create and test the playground dropdown
```

## Manual Acceptance Checklist

- US1: open/select/close, preselected value renders, outside click closes. Keyboard arrow keys work.
- US2: "Agregar nueva…" opens mini-form; successful create auto-selects and closes; cancel returns to list.
- US3: typing filters options case-insensitively; "Agregar nueva…" footer remains visible during search.
- US4: `loading` prop shows spinner; empty options show "Sin opciones disponibles"; creation error shows inside mini-form with retry.
- FR-006: no clear button, no deselect, no delete event anywhere.
- Modal: open dropdown inside a scroll-overflow container and verify it renders above it.

## Rollback Plan

- Revert `PlaygroundSelect.vue` to its previous pure-`<select>` implementation.
- Remove `vue-select@beta` and the `nuxt.config.ts` CSS entry.
- Revert game page imports.
