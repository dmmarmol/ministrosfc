# Contract: ConfirmationModal

## Component

- Name: `ConfirmationModal`
- Location: `packages/frontend/src/components/ui/ConfirmationModal.vue`
- Base: `@nuxt/ui` Modal

## Public API

## Props

- `open: boolean` (required)
- `title: string` (required)
- `description?: string`
- `confirmText?: string` (default `Confirmar`)
- `cancelText?: string` (default `Cancelar`)
- `onConfirm: () => Promise<void> | void` (required)
- `onCancel?: () => void`

## Emits

- `update:open` (or equivalent close event) with `false` when modal should close
- Optional `error` event if parent-level logging/telemetry is required

## Behavioral Contract

1. Opening

- When `open` becomes `true`, modal is visible and receives focus.

2. Confirm action

- Clicking confirm invokes `onConfirm`.
- While pending: confirm is disabled and shows loading state.
- On success: emit close/update and hide modal.
- On failure: keep modal open and show error message/state.

3. Cancel action

- Cancel button, backdrop click, and Escape all trigger cancel flow.
- If `onCancel` exists, call it exactly once.
- Emit close/update and hide modal.

4. Accessibility

- Focus is trapped while open.
- Escape closes modal.
- On close, focus returns to the element that triggered opening.

## Usage Contract for Pages

Pages replacing native `confirm()` prompts must:

- Maintain parent-owned `open` state.
- Pass action-specific title/description copy.
- Keep existing backend call semantics untouched.
- Handle post-confirm refresh/success messaging exactly as current flows require.

## In-Scope Adoption Targets

- `packages/frontend/src/components/player/PlayerDeleteModal.vue`
- `packages/frontend/src/pages/admin/games/index.vue`
- `packages/frontend/src/pages/admin/playgrounds/index.vue`
- `packages/frontend/src/pages/admin/teams/index.vue`
- `packages/frontend/src/pages/admin/tournaments/index.vue`
