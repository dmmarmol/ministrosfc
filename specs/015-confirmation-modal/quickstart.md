# Quickstart: Confirmation Modal

## Goal

Implement `ConfirmationModal` on top of `@nuxt/ui` Modal and replace native `confirm()` usage in sensitive admin flows.

## Prerequisites

- Branch: `feat/015-confirmation-modal`
- Node/npm per workspace constraints

## Steps

1. Install and configure Nuxt UI

- Add `@nuxt/ui` to `packages/frontend/package.json`.
- Register `@nuxt/ui` in `packages/frontend/nuxt.config.ts` `modules`.

2. Build reusable wrapper

- Create `packages/frontend/src/components/ui/ConfirmationModal.vue`.
- Implement controlled open-state contract.
- Implement async confirm handling (loading + error persistence).
- Implement keyboard and focus behavior (trap, Escape close, focus return).

3. Refactor existing modal component

- Update `packages/frontend/src/components/player/PlayerDeleteModal.vue` to use `ConfirmationModal`.

4. Replace native confirm prompts

- Remove `confirm()` usages in admin pages:
  - `pages/admin/games/index.vue`
  - `pages/admin/playgrounds/index.vue`
  - `pages/admin/teams/index.vue`
  - `pages/admin/tournaments/index.vue`

5. Add/update tests

- Add component tests for `ConfirmationModal`:
  - confirm success closes
  - cancel closes
  - Escape/backdrop close
  - async failure keeps modal open with error
  - duplicate confirm blocked while pending
- Update page-level/unit tests for replaced flows.

## Validation

Run frontend tests:

```bash
npm test --workspace=@ministrosfc/frontend -- --run
```

Optional targeted run:

```bash
npm test --workspace=@ministrosfc/frontend -- --run tests/components
```

## Done Criteria

- No source `confirm()` calls remain in `packages/frontend/src/**` for sensitive admin actions.
- `ConfirmationModal` is the shared entry point for confirmation UX.
- All affected tests pass.

## Verification Notes

- Source check command used in this feature:

```bash
grep -R --line-number --include='*.vue' --include='*.ts' --include='*.js' 'confirm(' packages/frontend/src
```

- Full frontend test command used in this feature:

```bash
npm test --workspace=@ministrosfc/frontend -- --run
```
