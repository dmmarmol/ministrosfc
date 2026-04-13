# Feature Specification: User Promotion Governance

**Feature Branch**: `016-user-promotion-governance`  
**Created**: 2026-04-13  
**Status**: Draft  
**Input**: User description: "User Promotion Feature"

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

1. **Given** an Admin user, **When** they change another user role to Player, Editor, or DT, **Then** the new role is saved and effective immediately.
2. **Given** an Editor user, **When** they promote a user to Player or DT, **Then** the change succeeds.
3. **Given** an Editor user, **When** they try to demote any user or set role to Editor/Admin, **Then** the change is denied.
4. **Given** a Player or DT user, **When** they attempt any role promotion or demotion, **Then** the action is denied.
5. **Given** a successful role change, **When** the target user next accesses protected areas, **Then** permissions match the new role.

---

### User Story 3 - Player Lifecycle Actions with Confirmation (Priority: P2)

Authorized users can deactivate or delete player-linked users with explicit confirmation prompts.

**Why this priority**: Lifecycle actions are sensitive and require safeguards, but are secondary to core directory and role governance.

**Independent Test**: Perform deactivate and delete flows with role-specific accounts and confirm prompts, outcomes, and data effects.

**Acceptance Scenarios**:

1. **Given** an Admin or Editor user, **When** they deactivate a player user and confirm, **Then** the linked player status changes to inactive and data is retained.
2. **Given** a deactivated player user, **When** admins view historical/statistical contexts, **Then** the user/player records remain available for historical reporting.
3. **Given** an Admin user, **When** they delete a player user and confirm, **Then** both user and linked player are deleted.
4. **Given** an Editor user, **When** they attempt player-user deletion, **Then** the action is denied.
5. **Given** any deactivate or delete action, **When** confirmation is canceled, **Then** no data change is applied.
6. **Given** lifecycle actions in admin/users, **When** the UI is rendered, **Then** every destructive or state-changing action uses a confirmation prompt.

### Edge Cases

- Attempting to deactivate or delete a user with no linked player profile must return a clear validation error and no partial update.
- Attempting to change a role to the current value should be idempotent and not create duplicate audit/event records.
- Editing email to a value already used by another account must fail with a clear uniqueness message.
- Deleting a player user with historical game participations must not leave orphan references.
- Concurrent updates on the same user (role change plus profile edit) must resolve deterministically without silent overwrite.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: System MUST expose an admin/users management view accessible only to Admin and Editor roles.
- **FR-002**: System MUST display first name, last name, and email for each listed user.
- **FR-003**: System MUST support editing first name, last name, and email for listed users by Admin and Editor roles.
- **FR-004**: System MUST present the edit action as part of the user full-name interaction (first name + last name), without requiring a dedicated edit button.
- **FR-005**: System MUST allow Admin users to assign roles Player, Editor, and DT to other users according to policy.
- **FR-006**: System MUST allow Editor users to promote users only to Player or DT.
- **FR-007**: System MUST deny demotion actions initiated by Editor users.
- **FR-008**: System MUST deny all promotion/demotion actions initiated by Player and DT users.
- **FR-009**: System MUST apply role changes to persistent user records so authorization behavior reflects the new role.
- **FR-010**: System MUST allow Admin and Editor users to deactivate player users by changing linked player status to inactive.
- **FR-011**: System MUST keep user and player data retained when a player user is deactivated.
- **FR-012**: System MUST allow only Admin users to delete player users.
- **FR-013**: System MUST delete both user and linked player when Admin confirms deletion of a player user.
- **FR-014**: System MUST preserve data integrity during player-user deletion (no orphan linked records).
- **FR-015**: System MUST require explicit confirmation prompts before role changes, deactivation, and deletion actions are executed.
- **FR-016**: System MUST deny unauthorized lifecycle actions with clear authorization errors.
- **FR-017**: System MUST validate uniqueness and format constraints for edited email values before persisting changes.
- **FR-018**: System MUST provide clear success and failure feedback for each completed or rejected admin/users action.

### Key Entities _(include if feature involves data)_

- **User Account**: Application identity containing first name, last name, email, role, and authentication linkage.
- **Player Profile**: Player-domain record linked to a user account, including active/inactive status for participation availability.
- **Role Governance Policy**: Rule set defining which actor roles can promote/demote target roles.
- **Lifecycle Action**: Confirmed administrative action that changes player status or removes player-linked user records.

## Assumptions

- Deactivation in this feature means player-status deactivation, not account-level authentication lock.
- Delete behavior for this feature removes both player and linked user account when performed by Admin.
- Existing confirmation modal patterns are reused for all sensitive actions.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 100% of Admin and Editor users can load admin/users and view first name, last name, and email for all visible users.
- **SC-002**: 100% of role-change attempts enforce policy outcomes (allowed and denied) according to actor role rules.
- **SC-003**: 100% of deactivation and deletion actions require explicit confirmation before any data mutation.
- **SC-004**: 100% of confirmed Admin deletions remove both user and linked player without orphan linked records.
- **SC-005**: At least 95% of successful admin/users mutations (edit, promote, deactivate, delete) are reflected in the UI within one refresh cycle.
