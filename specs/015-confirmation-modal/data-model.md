# Data Model: Confirmation Modal

## Overview

This feature is frontend UI-state driven. No database schema changes.

## Entities

## ConfirmationModalProps

- `open: boolean` — controlled visibility from parent
- `title: string` — required heading text
- `description?: string` — optional explanatory text
- `confirmText?: string` — confirm label (default `Confirmar`)
- `cancelText?: string` — cancel label (default `Cancelar`)
- `onConfirm: () => Promise<void> | void` — confirm callback
- `onCancel?: () => void` — optional cancel callback

## ConfirmationModalState

- `idle` — mounted but not open
- `open` — visible and interactive
- `confirming` — confirm callback pending; confirm action disabled
- `error` — confirm callback failed; modal remains open with error message
- `closed` — hidden; focus restored to invoking control

## ActionInvocationContext

- `actionKind: "delete" | "deactivate" | "other-sensitive"`
- `resourceLabel: string` (for title/description interpolation)
- `invokerElementRef: HTMLElement | null` (for focus return)

## State Transitions

1. `idle -> open`

- Trigger: parent sets `open = true`
- Side effects: focus enters modal

2. `open -> confirming`

- Trigger: user clicks confirm
- Side effects: run `onConfirm`, disable confirm button

3. `confirming -> closed`

- Trigger: `onConfirm` resolves
- Side effects: emit close/update, clear local error, restore focus to invoker

4. `confirming -> error`

- Trigger: `onConfirm` rejects/throws
- Side effects: show error state, re-enable confirm, keep cancel available

5. `open|error -> closed`

- Trigger: cancel button, Escape, backdrop click
- Side effects: invoke `onCancel` (if provided), emit close/update, restore focus

## Validation Rules

- `title` is required and non-empty.
- `onConfirm` is required.
- Confirm must be disabled while pending (`confirming`).
- `description` and `onCancel` are optional.
- Closing behavior must be idempotent (multiple close events do not duplicate callbacks).
