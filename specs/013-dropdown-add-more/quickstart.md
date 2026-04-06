# Quickstart: Dropdown with Inline Add-More

## Prerequisites

- Node/NPM versions aligned with root workspace engines.
- Frontend dependencies installed from workspace root.

## Implementation Steps

1. Add shared component types in `packages/frontend/src/types/dropdown-add-more.ts`.
2. Implement component shell in `packages/frontend/src/components/ui/DropdownAddMore.vue`.
3. Implement typed props/emits and outside-click close behavior.
4. Implement option rendering and fixed last `Agregar nueva...` action.
5. Implement inline create mode with submit/cancel events.
6. Implement loading/empty/error states and retry event.
7. Implement optional search filtering.
8. Add playground page `packages/frontend/src/pages/playground-dropdown-playground.vue`.
9. Integrate in:
   - `packages/frontend/src/pages/admin/games/create.vue`
   - `packages/frontend/src/pages/admin/games/[id]/edit.vue`

## Validation Steps

1. Run frontend unit tests:

```bash
npm run test --workspace=@ministrosfc/frontend
```

2. Run focused unit tests for component contract:

```bash
npm run test --workspace=@ministrosfc/frontend -- DropdownAddMore
```

3. Start frontend dev server and manually validate playground + both admin pages:

```bash
npm run dev --workspace=@ministrosfc/frontend
```

## Manual Acceptance Checklist

- US1: open/select/close behavior and preselected rendering work.
- US2: inline create submits, successful create is auto-selected, cancel works.
- US3: filtering is case-insensitive and preserves fixed add-new option.
- US4: loading/empty/error/retry states are correctly displayed.
- FR-006: no delete UI, callback, or event exists.

## Rollback Plan

- Revert integrations in game create/edit pages first.
- Keep component behind non-routed usage until stable.
- Remove playground route if it blocks release criteria.
