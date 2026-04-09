# Feature Specification: Confirmation Modal

**Feature Branch**: `015-confirmation-modal`
**Created**: 2026-04-09
**Status**: Draft
**Input**: User description: "Abstract the modal from PlayerDeleteModal into a reusable UI Component named ConfirmationModal. Let this component accept props for title, description, confirm button text, cancel button text, and a callback function to execute on confirmation and on cancellation. Remove calls to confirm() prompt for DELETE operations and instead use the native Confirmation Modal."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Admin Confirms a Destructive Action via the Modal (Priority: P1)

An Admin user clicks "Eliminar" on a player or any other entity. Instead of a browser `confirm()` popup, a styled in-app modal appears with a clear title, description, and confirm/cancel buttons. They click Confirm and the action proceeds; clicking Cancel aborts it.

**Why this priority**: This is the only user story — the entire feature is a UI refactor. Replacing the `confirm()` browser dialog with a consistent, accessible, branded modal is the complete deliverable.

**Independent Test**: Can be fully tested by triggering a delete flow on the admin players page, verifying a modal appears with the expected title and description, clicking confirm, and verifying the deletion proceeds. Repeat with cancel to verify the action is aborted.

**Acceptance Scenarios**:

1. **Given** an Admin is on the `/admin/players` page, **When** they click the "Eliminar" button for a player, **Then** a `ConfirmationModal` appears — NOT a browser `confirm()` popup.
2. **Given** the `ConfirmationModal` is open, **When** the Admin clicks the confirm button, **Then** the configured `onConfirm` callback is executed and the modal closes.
3. **Given** the `ConfirmationModal` is open, **When** the Admin clicks the cancel button or presses Escape, **Then** the configured `onCancel` callback is executed (if provided), the modal closes, and NO destructive action is taken.
4. **Given** the `ConfirmationModal` is rendered, **When** it displays, **Then** it shows the `title` prop as a heading, the `description` prop as body text, the `confirmText` prop on the confirm button, and the `cancelText` prop on the cancel button.
5. **Given** the modal is open, **When** the user clicks outside the modal overlay, **Then** the modal closes without executing the confirm action (treats as cancel).

---

### Edge Cases

- `description` is optional — the modal must render without it and still be usable.
- `onCancel` is optional — if not provided, cancelling simply closes the modal.
- The modal should trap focus while open (accessibility).
- The confirm button should have a visually destructive style (e.g., red) when the action is irreversible.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST provide a new `ConfirmationModal` Vue component in `packages/frontend/src/components/ui/` that accepts `title` (string, required), `description` (string, optional), `confirmText` (string, default "Confirmar"), `cancelText` (string, default "Cancelar"), `onConfirm` (function, required), and `onCancel` (function, optional) props.
- **FR-002**: `ConfirmationModal` MUST call `onConfirm` when the confirm button is clicked and close the modal.
- **FR-003**: `ConfirmationModal` MUST call `onCancel` (if provided) when the cancel button is clicked, and close the modal.
- **FR-004**: `ConfirmationModal` MUST close when the user clicks the overlay backdrop or presses Escape.
- **FR-005**: `PlayerDeleteModal` MUST be refactored to use `ConfirmationModal` internally, removing its own custom layout in favour of the shared component.
- **FR-006**: All existing usages of the browser `confirm()` function for DELETE operations MUST be replaced with `ConfirmationModal`.
- **FR-007**: The `ConfirmationModal` MUST be keyboard accessible (focus trapped inside the modal while open; Escape closes).

### Key Entities

- **ConfirmationModal**: New reusable UI component. Stateless — open/closed state is controlled by the parent (e.g., via `v-if`).

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Zero calls to `window.confirm()` remain in the frontend codebase for DELETE / destructive operations after this spec is implemented.
- **SC-002**: All destructive admin actions (player delete and any others identified) use `ConfirmationModal` and behave identically to before — confirm proceeds, cancel aborts.
- **SC-003**: `ConfirmationModal` passes all unit tests covering: confirm callback fired, cancel callback fired, Escape key closes, backdrop click closes.

## Assumptions

- The component is controlled via `v-if` by the parent; no internal `isOpen` state is needed.
- Only admin-facing pages need the modal; no public-facing usage is in scope.
- Styling follows the existing Tailwind design system (matching `PlayerDeleteModal`'s current visual style).
