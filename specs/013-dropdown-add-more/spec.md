# Feature Specification: Dropdown with Inline Add-More

**Feature Branch**: `feat/013-dropdown-add-more`
**Created**: 2026-03-25
**Status**: Draft
**Input**: User description: "Create a UI component for the frontend to be a dropdown with the capacity of inserting a new entry. This dropdown should be able to fetch a list of values and also to trigger the addition by clicking 'Add more' as the fixed last option. Deletion is not allowed through the dropdown"

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Select from Existing Options (Priority: P1)

A user interacts with a form that uses the dropdown component. They click the dropdown and see a list of options loaded from a data source. They select one, and the form field is populated with their choice. The dropdown closes after selection.

**Why this priority**: Selecting from existing options is the primary and most frequent use case. The component must work reliably as a standard dropdown before adding creation capabilities.

**Independent Test**: Can be fully tested by rendering the component with a list of options, clicking to open, selecting an option, and verifying the selected value is emitted.

**Acceptance Scenarios**:

1. **Given** a form containing the dropdown component, **When** the user clicks the component, **Then** a dropdown panel opens showing all available options.
2. **Given** the dropdown is open, **When** the user clicks on an option, **Then** the option is selected, the dropdown closes, and the selected value is reflected in the form field.
3. **Given** the dropdown is open, **When** the user clicks outside the dropdown, **Then** the dropdown closes without changing the selected value.
4. **Given** a dropdown with a pre-selected value, **When** the dropdown renders, **Then** the selected option's label is displayed in the trigger area.
5. **Given** a dropdown with many options, **When** the user opens the dropdown, **Then** the options are scrollable if they exceed the dropdown's visible area.

---

### User Story 2 — Add New Entry Inline (Priority: P1)

A user opens the dropdown and doesn't find the option they need. They see "Agregar nueva…" (Add new) as the last fixed option at the bottom of the list. They click it, a small inline form appears (within or adjacent to the dropdown), they fill in the required fields, and submit. The new entry is created, automatically selected, and the dropdown closes.

**Why this priority**: The inline creation capability is the core differentiator of this component — it eliminates the need to navigate away from the current form to create missing reference data.

**Independent Test**: Can be fully tested by opening the dropdown, clicking "Agregar nueva…", entering a value in the inline form, submitting, and verifying the new entry is selected and a creation event is emitted.

**Acceptance Scenarios**:

1. **Given** the dropdown is open, **When** the user scrolls to the bottom of the list, **Then** "Agregar nueva…" is always visible as the last option, visually distinct from regular options (e.g., separated by a divider, with a "+" icon).
2. **Given** the user clicks "Agregar nueva…", **When** the inline creation form appears, **Then** it shows the fields required to create a new entry (as configured by the parent form).
3. **Given** the inline creation form is visible, **When** the user fills in valid data and submits, **Then** the new entry is created (via the configured creation handler), automatically selected in the dropdown, and the dropdown closes.
4. **Given** the inline creation form is visible, **When** the user clicks cancel or presses Escape, **Then** the form is dismissed without creating an entry and the dropdown shows the original options.
5. **Given** the inline creation form is visible, **When** the user submits with invalid data, **Then** validation errors are shown inline without dismissing the form.

---

### User Story 3 — Search/Filter Options (Priority: P2)

A user opens the dropdown and sees many options. They start typing in a search field within the dropdown to filter the list. Only options matching the typed text are shown.

**Why this priority**: Filtering is important for usability when the option list grows beyond a handful of items, but the component is functional without it.

**Independent Test**: Can be tested by opening the dropdown, typing a search term, and verifying only matching options are displayed.

**Acceptance Scenarios**:

1. **Given** the dropdown is open, **When** the component is configured to show search and the user types in the search field, **Then** the option list is filtered to show only options whose label contains the typed text (case-insensitive).
2. **Given** the user has typed a search term, **When** no options match, **Then** the dropdown shows "Sin resultados" (No results) but the "Agregar nueva…" option remains visible.
3. **Given** the user has typed a search term, **When** they clear the search field, **Then** all options are shown again.

---

### User Story 4 — Empty and Loading States (Priority: P2)

The dropdown gracefully handles scenarios where there are no options or options are still loading.

**Why this priority**: These states ensure the component doesn't break or confuse the user in edge cases.

**Independent Test**: Can be tested by rendering the component with an empty options list and verifying it shows a helpful placeholder and the "Add new" action.

**Acceptance Scenarios**:

1. **Given** a dropdown with no options loaded, **When** the user opens the dropdown, **Then** a message "Sin opciones disponibles" (No options available) is shown, and the "Agregar nueva…" option is still available.
2. **Given** a dropdown where options are being fetched, **When** the user opens the dropdown, **Then** a loading indicator is shown until options arrive.
3. **Given** a dropdown where the data fetch fails, **When** the user opens the dropdown, **Then** an error message is shown with a "Reintentar" (Retry) option.

---

### Edge Cases

- What happens when the user rapidly opens and closes the dropdown? → The component debounces open/close to prevent visual flickering.
- What happens when the "Add new" creation succeeds but the options list fails to refresh? → The newly created entry is added to the local options list optimistically; a background re-fetch syncs the full list.
- What happens when the selected value is removed from the data source (externally, not via this dropdown)? → The dropdown displays the selected value as a "missing" entry with a visual indicator, allowing the user to select a different option.
- What happens when the dropdown is inside a modal or a scrollable container? → The dropdown panel positions itself to remain visible (standard dropdown positioning behavior).
- Deletion is explicitly not supported through this component — there is no delete action in the dropdown.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The component MUST display a list of selectable options provided by the parent form.
- **FR-002**: The component MUST support fetching options from a data source (via a configurable fetch function provided by the parent).
- **FR-003**: The component MUST display "Agregar nueva…" as a fixed last option, visually separated from the regular options list.
- **FR-004**: Clicking "Agregar nueva…" MUST trigger an inline creation flow (the form fields are defined by the parent component).
- **FR-005**: After successful inline creation, the new entry MUST be automatically selected and the dropdown MUST close.
- **FR-006**: The component MUST NOT support deletion of entries through the dropdown interface.
- **FR-007**: The component MUST emit a selection event when the user selects an option, providing the selected value.
- **FR-008**: The component MUST emit a creation event when a new entry is created inline, providing the created entry's data.
- **FR-009**: The component MUST support an optional search/filter input to narrow the options list.
- **FR-010**: The component MUST handle empty states (no options) by showing the exact default message "Sin opciones disponibles" while keeping "Agregar nueva…" accessible.
- **FR-011**: The component MUST handle loading states with a visual indicator.
- **FR-012**: The component MUST support a pre-selected value (for edit forms).
- **FR-013**: The component MUST close when the user clicks outside of it.
- **FR-014**: The component MUST be reusable — it does not know about specific entities (playgrounds, teams, etc.) and is configured entirely through its inputs.
- **FR-015**: All user-facing labels MUST be configurable (placeholder text, "Add new" label, empty state message) with Spanish defaults.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The component can be integrated into any form with a data source in under 15 minutes of developer effort.
- **SC-002**: Option selection completes within 1 click after the dropdown is open.
- **SC-003**: Inline creation flow completes within 3 interactions (click "Add new" → fill field → submit).
- **SC-004**: The component renders and displays options within 500 milliseconds of receiving data.
- **SC-005**: The component works correctly when used in at least 2 different contexts within the application (demonstrating reusability).

## Assumptions

- The UI language is Spanish (Argentine dialect). Default labels are in Spanish but can be overridden by the parent component.
- The component is a presentational/UI component — it does not directly call any backend endpoint. Data fetching and creation logic are provided by the parent form via callback functions or events.
- The inline creation form supports a simple layout (1-3 fields). Complex multi-step creation flows should navigate to a dedicated page instead.
- The component follows the existing Tailwind CSS styling patterns used throughout the application.
- Keyboard accessibility (arrow keys, Enter, Escape) is a nice-to-have for this iteration, not a hard requirement.

## Out of Scope

- Deletion of entries through the dropdown
- Multi-select functionality (selecting multiple options at once)
- Drag-and-drop reordering of options
- Server-side search / autocomplete (all filtering is client-side on already-fetched data)
- Virtualized rendering for lists with thousands of items
- Keyboard accessibility beyond basic Tab and Escape support
