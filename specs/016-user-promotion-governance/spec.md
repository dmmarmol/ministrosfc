# Feature Specification: User Promotion Governance & Auth Navigation

**Feature Branch**: `016-user-promotion-governance`  
**Created**: 2026-04-13  
**Updated**: 2026-04-14 (scope expanded to include authentication navigation UX)  
**Status**: Draft  
**Input**: User description: "User Promotion Feature" + "Auth navigation back buttons"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Admin/Editor User Directory Management (Priority: P1)

Admin and Editor users can access the admin users view and manage core user records without leaving the page.

**Why this priority**: This is the entry point for all governance operations and must exist before role or lifecycle actions can be performed.

**Independent Test**: Sign in as Admin and Editor, open admin/users, and verify the list and inline edit flow for first name, last name, and email.

**Acceptance Scenarios**:

1. **Given** an authenticated Admin user, **When** they open admin/users, **Then** they can see the full users list with first name, last name, and email.
2. **Given** an authenticated Editor user, **When** they open admin/users, **Then** they can see the same users list and edit user profile fields.
3. **Given** a non-Admin and non-Editor user, **When** they try to access admin/users, **Then** access is denied.
4. **Given** an Admin or Editor user on admin/users, **When** they select a user row, **Then** the edit action is linked from the displayed full name (first name + last name) without a separate edit button.
5. **Given** an Admin or Editor user editing first name, last name, or email, **When** they save valid values, **Then** the changes are persisted and reflected in the list.

---

### User Story 2 - Role Promotion/Demotion Governance (Priority: P1)

Role changes follow strict hierarchy rules so authority boundaries are enforced consistently.

**Why this priority**: Incorrect role governance creates security and authorization risk across the application.

**Independent Test**: Execute role change attempts as Admin, Editor, DT, and Player and verify allowed/blocked outcomes per policy.

**Acceptance Scenarios**:

1. **Given** an Admin user, **When** they change another user role to Player, Editor, DT, or Admin, **Then** a confirmation modal appears describing the role change.
2. **Given** a role change confirmation modal is displayed, **When** the Admin confirms the action, **Then** the new role is saved and effective immediately.
3. **Given** a role change confirmation modal is displayed, **When** the Admin cancels the action, **Then** no changes are applied and the modal closes.
4. **Given** an Admin user, **When** they demote another Admin to a lower role (Player, Editor, or DT), **Then** the confirmation modal appears and upon confirmation the change succeeds and the target user's permissions update accordingly.
5. **Given** an Admin user, **When** they attempt to change their own role to a non-Admin role, **Then** the action is blocked and an error message states "Cannot demote yourself".
6. **Given** an Admin user viewing their own user record, **When** they view the role dropdown, **Then** the dropdown is disabled or visually indicates it cannot be changed.
7. **Given** an Editor user, **When** they promote a user to Player or DT, **Then** a confirmation modal appears and upon confirmation the change succeeds.
8. **Given** an Editor user, **When** they try to demote any user or set role to Editor/Admin, **Then** the change is denied.
9. **Given** a Player or DT user, **When** they attempt any role promotion or demotion, **Then** the action is denied.
10. **Given** a successful role change, **When** the target user next accesses protected areas, **Then** permissions match the new role.

---

### User Story 3 - Player Lifecycle Actions with Confirmation (Priority: P2)

Authorized users can deactivate or delete player-linked users with explicit confirmation prompts.

**Why this priority**: Lifecycle actions are sensitive and require safeguards, but are secondary to core directory and role governance.

**Independent Test**: Perform deactivate and delete flows with role-specific accounts and confirm prompts, outcomes, and data effects.

**Acceptance Scenarios**:

1. **Given** an Admin or Editor user, **When** they click to deactivate a player user, **Then** a confirmation modal appears with clear text stating "Deactivate player [player name]? This will prevent them from participating in new games."
2. **Given** a deactivation confirmation modal, **When** the user confirms, **Then** the linked player status changes to inactive and data is retained.
3. **Given** a deactivation confirmation modal, **When** the user cancels, **Then** no changes are applied and the modal closes.
4. **Given** a deactivated player user, **When** admins view historical/statistical contexts, **Then** the user/player records remain available for historical reporting.
5. **Given** an Admin user, **When** they click to delete a player user, **Then** a confirmation modal appears with clear text stating "Delete user [user name] and player [player name]? This action cannot be undone."
6. **Given** a deletion confirmation modal, **When** the Admin confirms, **Then** both user and linked player are deleted.
7. **Given** a deletion confirmation modal, **When** the Admin cancels, **Then** no data change is applied and the modal closes.
8. **Given** an Editor user, **When** they attempt player-user deletion, **Then** the action is denied.
9. **Given** lifecycle actions in admin/users, **When** the UI is rendered, **Then** every destructive or state-changing action (role changes, status toggles, user deletions, player deletions, profile edits) uses a confirmation modal.

---

### User Story 4 - Authentication Navigation UX (Priority: P2)

Users navigating authentication flows can return to previous screens using clear back buttons.

**Why this priority**: Improves user experience and reduces confusion during authentication and onboarding flows, but is secondary to core governance features.

**Independent Test**: Navigate to /auth and /auth/onboarding pages and verify back button presence and navigation targets.

**Acceptance Scenarios**:

1. **Given** an unauthenticated user on the /auth page, **When** they view the page, **Then** a back button is visible.
2. **Given** an unauthenticated user on the /auth page, **When** they click the back button, **Then** they are redirected to the public site (home page).
3. **Given** a user on the /auth/onboarding page without a return query parameter, **When** they view the page, **Then** a back button is visible.
4. **Given** a user on the /auth/onboarding page without a return query parameter, **When** they click the back button, **Then** they are redirected to the /auth route.
5. **Given** a non-registered user attempting to sign up for a game is redirected to /auth/onboarding, **When** they arrive at the onboarding page, **Then** the original page URL is preserved in a return/redirect query parameter.
6. **Given** a user on the /auth/onboarding page with a return query parameter, **When** they click the back button, **Then** they are redirected to the URL specified in the return parameter.
7. **Given** back buttons on auth pages, **When** users interact with them, **Then** the buttons are clearly styled and positioned for easy discovery.

### Edge Cases

- **Admin Self-Demotion Prevention**: An admin attempting to demote themselves (change their own role from ADMIN to any lower role) must be blocked with error "Cannot demote yourself". The role dropdown for the admin's own user record should be disabled or visually indicate it cannot be changed. This prevents accidental privilege loss and ensures at least one admin always exists in the system.
- **Admin-to-Admin Demotion**: An admin can promote other users to ADMIN and also demote other admins to lower roles (PLAYER, EDITOR, DT). This prevents privilege escalation lock-in where promoted admins can never be demoted. All such actions require confirmation modal approval.
- **Confirmation Modal for All Sensitive Actions**: Every state-changing action on the /admin/users page must trigger a confirmation modal before execution. Sensitive actions include: role changes (any role to any other role), user status toggles (activate/deactivate), user deletions, player deletions, and critical profile edits (email changes). Non-critical profile edits (first name, last name) do not require confirmation. The modal must clearly state what action will be performed and on which user/player.
- **Idempotent Changes Skip Confirmation**: Attempting to change a role to its current value (e.g., ADMIN→ADMIN) or toggle status to its current state returns success without confirmation modal or database write. This prevents unnecessary user clicks and maintains good UX.
- **Network Failure During Confirmation**: If network fails after the user confirms a modal but before the backend processes the request, the UI must close the modal, show an error toast with message "Network error occurred. Please try again." and a retry button, and not mutate local state. The user must retry the action.
- **Session Expiry During Confirmation**: If an admin's session expires while a confirmation modal is open, the backend rejects the request with 401 Unauthorized and the frontend prompts re-authentication via existing auth middleware.
- **Concurrent Role Changes**: If two admins attempt to change the same user's role simultaneously, the system uses optimistic concurrency control via `expectedUpdatedAt` timestamp. The second request receives 409 CONFLICT error and must retry with fresh data. Users see updated data after successful operations.
- Attempting to perform a player-status update (deactivate/reactivate) or delete a user with no linked player profile must return a clear validation error and no partial update.
- Editing email to a value already used by another account must fail with a clear uniqueness message.
- Deleting a player user with historical game participations must not leave orphan references. (See data integrity requirement below)
- **Auth Navigation State Preservation**: Back button navigation from /auth or /auth/onboarding must not clear any partially entered form data if the user returns (browser back/forward behavior). However, this is browser-default behavior and requires no special handling.
- **Public Site Home Page**: The "public site" referenced in FR-019 refers to the application's unauthenticated landing page (typically "/" route or a marketing homepage). If no public site exists, the back button should be hidden or navigate to a sensible default.
- **Onboarding Flow Interruption**: When a user clicks back from /auth/onboarding to the originating page (via return parameter), any partial onboarding progress is not saved. The user must complete the full onboarding flow in a single session.
- **Open Redirect Prevention**: Return/redirect query parameters must be validated to prevent open redirect attacks. Only same-origin URLs (matching the current domain) or relative paths (starting with /) should be allowed. External URLs (http://, https://, //) must be rejected and fall back to /auth default navigation.
- **Malformed Return URLs**: If the return query parameter contains invalid characters, is malformed, or fails validation, the system should fall back to the default /auth navigation rather than throwing an error.
- **Return URL Encoding**: Return URLs in query parameters must be properly URL-encoded when set and decoded when read. Special characters in paths (e.g., /games/123?tab=signup) must be handled correctly.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST expose an admin/users management view accessible only to Admin and Editor roles.
- **FR-002**: System MUST display first name, last name, and email for each listed user.
- **FR-003**: System MUST support editing first name, last name, and email for listed users by Admin and Editor roles.
- **FR-004**: System MUST present the edit action as part of the user full-name interaction (first name + last name), without requiring a dedicated edit button.
- **FR-005**: System MUST allow Admin users to assign any role (Player, Editor, DT, Admin) to other users, including promoting users to Admin and demoting other Admins to lower roles.
- **FR-005a**: System MUST prevent Admin users from demoting themselves (changing their own role from ADMIN to any other role) with error message "Cannot demote yourself".
- **FR-006**: System MUST allow Editor users to promote users only to Player or DT.
- **FR-007**: System MUST deny demotion actions initiated by Editor users.
- **FR-008**: System MUST deny all promotion/demotion actions initiated by Player and DT users.
- **FR-009**: System MUST apply role changes to persistent user records so authorization behavior reflects the new role.
- **FR-010**: System MUST allow Admin and Editor users to perform player-status updates (deactivate/reactivate) by changing linked player status.
- **FR-011**: System MUST keep user and player data retained when a player user is deactivated.
- **FR-012**: System MUST allow only Admin users to delete player users.
- **FR-013**: System MUST delete both user and linked player when Admin confirms deletion of a player user.
- **FR-014**: System MUST preserve data integrity during player-user deletion (no orphan linked records; see also Edge Cases).
- **FR-015**: System MUST require explicit, blocking confirmation modals (ConfirmationModal component) before ALL sensitive actions on /admin/users page are executed, including: role changes (any role to any other role), user status toggles (activate/deactivate), user deletions, player deletions, and critical profile edits (email changes that affect login identity). Confirmation modals MUST display clear action text describing what will happen and to whom, require explicit confirm/cancel buttons, and block background interaction until resolved. EXCEPTION: Idempotent changes (e.g., setting a role to its current value) skip confirmation for better UX.
- **FR-015a**: System MUST disable the role dropdown (`:disabled` attribute) for an admin viewing their own user record to prevent self-demotion attempts at the UI level. Visual indication (e.g., tooltip stating "Cannot change your own role") SHOULD be added as secondary affordance.
- **FR-015b**: System MUST validate on the backend that the requesting admin user is not attempting to modify their own role, returning 403 Forbidden with error "Cannot demote yourself" if attempted.
- **FR-016**: System MUST deny unauthorized lifecycle actions with clear authorization errors (e.g., Editor delete denial, Player/DT promotion attempts).
- **FR-017**: System MUST validate uniqueness and format constraints for edited email values before persisting changes, and return clear error messages for duplicates.
- **FR-018**: System MUST provide clear success and failure feedback for each completed or rejected admin/users action (UI and API).
- **FR-019**: System MUST display a user-friendly back button on the /auth page that navigates users to the public site home page.
- **FR-020**: System MUST display a user-friendly back button on the /auth/onboarding page that navigates users to: (a) the URL specified in the return/redirect query parameter if present, or (b) the /auth route if no return parameter is provided.
- **FR-020a**: System MUST validate return/redirect query parameters to prevent open redirect vulnerabilities, allowing only same-origin URLs or relative paths.
- **FR-021**: System MUST ensure back buttons on authentication pages are clearly visible and accessible, following consistent UI patterns.
- **FR-022**: System MUST preserve the originating page URL as a return/redirect query parameter when redirecting unauthenticated users from protected pages (e.g., game signup) to /auth/onboarding.

### Key Entities _(include if feature involves data)_

- **User Account**: Application identity containing first name, last name, email, role, and authentication linkage.
- **Player Profile**: Player-domain record linked to a user account, including active/inactive status for participation availability.
- **Role Governance Policy**: Rule set defining which actor roles can promote/demote target roles.
- **Lifecycle Action**: Confirmed administrative action that changes player status or removes player-linked user records.

## Assumptions

- Deactivation in this feature means player-status deactivation, not account-level authentication lock.
- Delete behavior for this feature removes both player and linked user account when performed by Admin.
- Existing confirmation modal patterns are reused for all sensitive actions.
- The "public site" for auth page back button navigation refers to the unauthenticated home page (typically "/" route).
- Back button styling and positioning follows existing UI/UX patterns defined in the design system.
- Auth and onboarding pages use Nuxt routing, so navigation is handled via nuxt-link or router.push().
- Return URL validation follows common open redirect prevention patterns: same-origin check or relative path validation.
- The return/redirect query parameter name is consistent across all auth flows (e.g., "return", "redirect", or "returnUrl").
- Game signup and other protected page redirects to onboarding already exist; this feature only adds the back button with return parameter handling.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of Admin and Editor users can load admin/users and view first name, last name, and email for all visible users.
- **SC-002**: 100% of role-change attempts enforce policy outcomes (allowed and denied) according to actor role rules. This includes: (1) Admin can demote other admins to lower roles (with confirmation), (2) Admin cannot demote themselves (blocked at UI and backend with clear error), (3) All other role transitions follow documented governance matrix and require confirmation.
- **SC-003**: 100% of ALL sensitive actions on /admin/users page (role changes, status toggles, user deletions, player deletions, critical edits) require explicit confirmation modal before any data mutation. Exception: idempotent changes (same-value updates) skip confirmation for better UX.
- **SC-004**: 100% of confirmed Admin deletions remove both user and linked player without orphan linked records.
- **SC-005**: At least 95% of successful admin/users mutations (edit, promote, deactivate, delete) are reflected in the UI within one refresh cycle.
- **SC-006**: Admins can demote any user including other admins in under 10 seconds (select role, confirm modal, see update).
- **SC-007**: Zero accidental admin demotions or user deletions occur due to confirmation requirement - all actions require explicit modal confirmation.
- **SC-008**: 100% of users on /auth and /auth/onboarding pages can navigate back to previous screens using clearly visible back buttons.
- **SC-009**: 100% of redirects from protected pages (e.g., game signup) to /auth/onboarding preserve the original URL, and users can return via back button without re-navigation loss.
