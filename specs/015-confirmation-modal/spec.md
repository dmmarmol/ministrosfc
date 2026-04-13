# Feature Specification: Confirmation Modal

**Feature Branch**: `feat/015-confirmation-modal`
**Created**: 2026-04-09
**Status**: Implemented
**Input**: User description: "Abstract the modal from PlayerDeleteModal into a reusable UI Component named ConfirmationModal. Let this component accept props for title, description, confirm button text, cancel button text, and a callback function to execute on confirmation and on cancellation. Remove calls to confirm() prompt for DELETE operations and instead use the native Confirmation Modal."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Admin Confirms Sensitive Actions via the Modal (Priority: P1)

An Admin or Editor user triggers a sensitive action (for example delete, deactivate, or any irreversible state change). Instead of a browser `confirm()` popup, a styled in-app modal appears with a clear title, description, and confirm/cancel buttons. The modal foundation is provided by `@nuxt/ui` Modal, and the product-specific confirmation behavior is implemented in a reusable `ConfirmationModal` wrapper component. They click Confirm and the action proceeds; clicking Cancel aborts it.

**Why this priority**: This is the only user story — the entire feature is a UI refactor. Replacing the `confirm()` browser dialog with a consistent, accessible, branded modal is the complete deliverable.

**Independent Test**: Can be fully tested by triggering at least one delete flow and one non-delete sensitive action flow in the admin area, verifying a modal appears with expected content, clicking confirm and cancel, and verifying correct outcomes.

**Acceptance Scenarios**:

1. **Given** an authorized user is on an admin page with a sensitive action, **When** they trigger that action, **Then** a `ConfirmationModal` appears (implemented on top of `@nuxt/ui` Modal) — NOT a browser `confirm()` popup.
2. **Given** the `ConfirmationModal` is open, **When** the authorized user clicks the confirm button, **Then** the configured `onConfirm` callback is executed and the modal closes.
3. **Given** the `ConfirmationModal` is open, **When** the authorized user clicks the cancel button or presses Escape, **Then** the configured `onCancel` callback is executed (if provided), the modal closes, and NO destructive action is taken.
4. **Given** the `ConfirmationModal` is rendered, **When** it displays, **Then** it shows the `title` prop as a heading, the `description` prop as body text, the `confirmText` prop on the confirm button, and the `cancelText` prop on the cancel button.
5. **Given** the modal is open, **When** the user clicks outside the modal overlay, **Then** the modal closes without executing the confirm action (treats as cancel).
6. **Given** the confirm callback is asynchronous and fails, **When** it rejects or throws, **Then** the modal remains open, confirm button returns to enabled state, and an error message is shown without applying the action.

---

### Edge Cases

- `description` is optional — the modal must render without it and still be usable.
- `onCancel` is optional — if not provided, cancelling simply closes the modal.
- The modal should trap focus while open (accessibility).
- The confirm button should have a visually destructive style (e.g., red) when the action is irreversible.
- The confirm button should enter a loading/disabled state while an async confirm action is in-flight to prevent duplicate submissions.
- When the modal closes, keyboard focus should return to the control that opened it.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-000**: Frontend MUST install and register `@nuxt/ui` as a Nuxt module before implementing the reusable confirmation modal.
- **FR-001**: System MUST provide a new `ConfirmationModal` Vue component in `packages/frontend/src/components/ui/` that accepts `title` (string, required), `description` (string, optional), `confirmText` (string, default "Confirmar"), `cancelText` (string, default "Cancelar"), `onConfirm` (function, required), and `onCancel` (function, optional) props.
- **FR-001A**: `ConfirmationModal` MUST use `@nuxt/ui` Modal as its base/container layer and expose product-specific confirmation actions through the wrapper component interface.
- **FR-001B**: `ConfirmationModal` MUST support a controlled open state contract (`open` + close event/callback) and MAY use `v-if` as a rendering optimization, but open/close behavior is controlled by parent state.
- **FR-002**: `ConfirmationModal` MUST call `onConfirm` when the confirm button is clicked; it closes only after a successful confirm callback resolution.
- **FR-003**: `ConfirmationModal` MUST call `onCancel` (if provided) when the cancel button is clicked, and close the modal.
- **FR-004**: `ConfirmationModal` MUST close when the user clicks the overlay backdrop or presses Escape.
- **FR-005**: `PlayerDeleteModal` MUST be refactored to use `ConfirmationModal` internally, removing its own custom layout in favour of the shared component.
- **FR-006**: All existing usages of the browser `confirm()` function for sensitive admin actions (including delete flows and other irreversible admin actions) MUST be replaced with `ConfirmationModal`.
- **FR-007**: The `ConfirmationModal` MUST be keyboard accessible (focus trapped inside the modal while open; Escape closes; focus returns to invoking control on close).
- **FR-008**: During async confirm execution, `ConfirmationModal` MUST prevent duplicate confirm submissions by disabling the confirm action until resolution.
- **FR-009**: If `onConfirm` fails, `ConfirmationModal` MUST remain open and surface an error state/message while preserving cancel availability.

### Key Entities

- **ConfirmationModal**: New reusable UI component built on `@nuxt/ui` Modal; open/closed state is controlled by the parent via explicit state and close events.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Zero calls to `window.confirm()` or global `confirm()` remain in frontend source files under `packages/frontend/src/**` for sensitive admin actions after this spec is implemented.
- **SC-002**: All sensitive admin actions identified in scope use `ConfirmationModal` and behave identically to before regarding business outcome — confirm proceeds, cancel aborts.
- **SC-003**: `ConfirmationModal` passes all unit tests covering: confirm callback fired, cancel callback fired, Escape key closes, backdrop click closes.
- **SC-004**: `@nuxt/ui` is installed and configured as a Nuxt module, and component tests verify `ConfirmationModal` renders through the `@nuxt/ui` Modal base in all covered sensitive-action flows.
- **SC-005**: Unit/integration tests verify async failure behavior: failed `onConfirm` keeps the modal open, exposes an error state, and allows user cancellation.

## Assumptions

- The component is parent-controlled through explicit open state and close events; `v-if` may be used for mounting optimization.
- Only admin-facing pages need the modal; no public-facing usage is in scope.
- Styling follows the existing Tailwind design system (matching `PlayerDeleteModal`'s current visual style).
- `@nuxt/ui` Modal behavior (focus management, keyboard handling, and overlay behavior) is adopted as the baseline interaction model for the wrapper component.
