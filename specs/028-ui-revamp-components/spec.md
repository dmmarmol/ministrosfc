# Feature Specification: UI Revamp – Toast, Button, and Table Components

**Feature Branch**: `026-ui-revamp-components`  
**Created**: 2025-07-09  
**Status**: Draft  
**Input**: User description: "UI Revamp: Toast, Button, and Table components for admin panel"

## User Scenarios & Testing

### User Story 1 – Admin sees consistent feedback after actions (Priority: P1)

As an admin user operating on the users panel, when I perform any action (promote, demote, deactivate, delete), I see a clear, consistent notification pop up briefly on the screen and then disappear automatically. The notification uses the same visual style across the entire app with no custom per-component timer logic.

**Why this priority**: The current toast in `UserRoleManager` is a hand-rolled div with a manual `setTimeout`. Replacing it with the platform's standard notification system eliminates duplicated feedback logic and is the foundation all other UI improvements depend on.

**Independent Test**: Open the admin users panel, promote a user, confirm the confirmation dialog → a toast notification appears with a success message and dismisses after a few seconds. No visible change to any button or table layout is required.

**Acceptance Scenarios**:

1. **Given** the admin panel is open, **When** an action completes successfully, **Then** a success toast with a short message is displayed and auto-dismisses.
2. **Given** a network error occurs during an admin action, **When** the action fails, **Then** an error toast with the relevant error message is displayed.
3. **Given** a toast is displayed, **When** the admin dismisses it manually, **Then** the toast closes immediately.

---

### User Story 2 – Admin panel uses a reusable button component (Priority: P2)

As a developer maintaining the admin panel, every interactive button across the admin area is rendered using a single reusable button component that wraps the design system's button, ensuring visual consistency (size, style, states) for all admin actions.

**Why this priority**: Standardizing the button interface removes visual inconsistencies and makes future style changes a one-place update. It has no user-visible dependency on the Table revamp.

**Independent Test**: Load the admin users panel and verify that all buttons (edit, save, cancel, promote, demote, deactivate, delete, confirm, back) render with a uniform appearance and all interactive states (disabled, loading) work.

**Acceptance Scenarios**:

1. **Given** the admin users page is loaded, **When** the page renders, **Then** all action buttons share a unified visual design (size, color scheme, hover and disabled states).
2. **Given** an async admin action is triggered, **When** it is pending, **Then** the triggering button displays a loading state and is non-interactive.
3. **Given** an admin lacks permission for an action, **When** that button is rendered, **Then** it is visually disabled.

---

### User Story 3 – Admin panel buttons are replaced with the reusable button (Priority: P3)

As an admin user viewing the users list, all buttons throughout the admin/users panel (including role change, status toggle, delete, edit, and confirmation dialog actions) have been replaced with the reusable button component so the UI looks and behaves consistently.

**Why this priority**: Depends on the reusable button (Story 2). The value is adoption coverage — the new component must be used everywhere in the admin/users area.

**Independent Test**: Run through all admin/user workflows (edit name, change role, toggle status, delete user, delete player) and confirm every button in every state uses the standardized appearance with no raw HTML buttons or legacy button markup remaining in admin/users views.

**Acceptance Scenarios**:

1. **Given** an admin navigates the users panel, **When** interacting with any button, **Then** all buttons render using the reusable button component with consistent look and feel.
2. **Given** the confirmation dialog appears, **When** the admin views it, **Then** the confirm and cancel actions both use the reusable button.

---

### User Story 4 – Admin user list is displayed as a structured table with inline edit navigation (Priority: P4)

As an admin user, the user list is rendered as a properly structured table with clear column headers, sorted rows, and pagination support. Each user's name is a clickable link that navigates to the edit view, replacing the separate inline edit controls.

**Why this priority**: Depends on Stories 1–3 being in place. The table revamp is the most user-visible change and delivers the cleanest admin UX improvement.

**Independent Test**: Load the admin users panel and confirm the user list renders in a structured table with columns (Name, Email, Role, Status, Actions). Clicking a user's name navigates to or opens the edit experience. Sorting and pagination are functional with 10+ users.

**Acceptance Scenarios**:

1. **Given** the admin users page loads, **When** the user list is displayed, **Then** it renders in a structured table with visible column headers (e.g., Name, Email, Role, Status, Actions).
2. **Given** the user list is displayed, **When** the admin clicks a user's name, **Then** the admin is taken to or shown the edit interface for that user (inline or route).
3. **Given** more users exist than the visible page size, **When** the admin scrolls or navigates, **Then** pagination controls allow viewing all users.
4. **Given** the data is loading, **When** the table renders, **Then** a loading indicator is shown in the table body.

---

### Edge Cases

- What happens when the user list is empty? → Table displays a friendly empty state message.
- What happens if the toast system is unavailable? → Actions still complete; feedback falls back silently (no crash).
- What happens if a user has no associated player? → The Name column still shows `firstName lastName` and the edit link remains functional.
- What happens when pagination is at the last page and a user is deleted? → The page index adjusts so the last page is still shown.

## Requirements

### Functional Requirements

- **FR-001**: The admin panel MUST display feedback notifications (success and error) using the application's standard notification system, not custom per-component implementations.
- **FR-002**: Notifications MUST auto-dismiss after a standard duration and MUST be manually dismissible.
- **FR-003**: The frontend MUST expose a single reusable button component that accepts at minimum: label, variant, size, loading state, and disabled state.
- **FR-004**: All buttons in the admin/users area MUST be rendered using the reusable button component.
- **FR-005**: The admin user list MUST be rendered as a structured table with labeled columns.
- **FR-006**: The table MUST include: Name, Email, Role, Status, and an Actions column.
- **FR-007**: Clicking a user's name in the table MUST navigate to or trigger an edit experience for that user.
- **FR-008**: The separate inline "Edit" button for a user row MUST be removed once the name is a clickable edit link.
- **FR-009**: The table MUST support pagination when the number of users exceeds the visible page size (default 10 per page).
- **FR-010**: The table MUST display a loading indicator while user data is being fetched.
- **FR-011**: The table MUST display an empty state message when no users are present.
- **FR-012**: All admin action buttons (promote, demote, deactivate, delete, confirm, cancel) MUST reflect a loading/disabled state while their associated async operation is in progress.

### Assumptions

- Nuxt UI v4 is already installed and configured in the frontend package (it powers existing components like `ConfirmationModal`).
- The `useToast` composable from Nuxt UI (used via `toast.add(...)`) is the target notification API for all toast feedback.
- The Admin layout already wraps pages with the `UApp` component (required for `useToast` to work globally).
- The reusable button component will be placed under `components/ui/` for use across all admin views.
- Pagination is client-side (all users loaded, paginated in the table) since the user count for a team is small (< 100).

## Success Criteria

### Measurable Outcomes

- **SC-001**: All admin/user actions display a toast notification within 300ms of completion — measurable by manual testing each action flow.
- **SC-002**: Zero instances of hand-rolled toast divs or custom timer feedback logic remain in any admin component after the revamp.
- **SC-003**: All interactive buttons in the admin/users panel use the reusable button component — verified by codebase grep with no exceptions in admin/users files.
- **SC-004**: Admins can navigate to edit a user in 1 click from the user list (by clicking the name), compared to the prior 2-step inline edit flow.
- **SC-005**: The user list table renders with visible column headers and correct data alignment — verified visually and through unit tests checking column definitions.
- **SC-006**: All existing unit tests pass after the revamp (0 regressions from current 79/79 frontend tests baseline).

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements _(mandatory)_

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

_Example of marking unclear requirements:_

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities _(include if feature involves data)_

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria _(mandatory)_

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]
