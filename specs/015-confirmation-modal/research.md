# Research: Confirmation Modal

## Decision 1: Adopt @nuxt/ui as Nuxt module

- Decision: Install `@nuxt/ui` in `packages/frontend` and register it in `nuxt.config.ts` `modules`.
- Rationale: Spec explicitly mandates using `@nuxt/ui` Modal as the base; module registration enables standardized modal primitives.
- Alternatives considered:
  - Keep custom modal only: rejected because spec now requires `@nuxt/ui` foundation.
  - Use another modal library: rejected due to direct product requirement for `@nuxt/ui`.

## Decision 2: Build a thin ConfirmationModal wrapper

- Decision: Implement `ConfirmationModal.vue` as a wrapper over `@nuxt/ui` Modal exposing product-facing API (`title`, `description`, `confirmText`, `cancelText`, `open`, `onConfirm`, `onCancel`).
- Rationale: Keeps caller API consistent across pages and centralizes async/error/focus behavior.
- Alternatives considered:
  - Use raw `@nuxt/ui` Modal directly in each page: rejected due to duplicated logic and inconsistent behavior.
  - Keep `PlayerDeleteModal` as isolated component: rejected because spec requires reusable modal.

## Decision 3: Controlled open state contract

- Decision: Parent controls open/close state; wrapper emits close signal and executes callbacks. `v-if` remains optional mount optimization only.
- Rationale: Explicit parent state makes page orchestration predictable and testable.
- Alternatives considered:
  - Internal `isOpen` state in modal: rejected because it complicates parent coordination and spec assumptions.

## Decision 4: Async confirm handling and duplicate prevention

- Decision: Confirm button enters loading+disabled state while `onConfirm` is pending. On success, modal closes. On failure, modal stays open and shows an error state/message.
- Rationale: Prevents duplicate submissions and makes failure recoverable.
- Alternatives considered:
  - Close immediately before async completion: rejected because failures would be hidden and unsafe for destructive actions.
  - Keep button enabled while pending: rejected due to race/duplicate action risk.

## Decision 5: Replacement scope for native confirm calls

- Decision: Replace all source-level `confirm()` usages for sensitive admin actions under `packages/frontend/src/**` with `ConfirmationModal`.
- Rationale: Aligns with SC-001 and removes inconsistent browser prompt UX.
- Alternatives considered:
  - Replace only player delete flow: rejected because scope now includes broader sensitive admin actions.
