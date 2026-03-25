# Feature Specification: Admin Player Delete with Role-Based Controls

**Feature Branch**: `013-admin-player-delete`
**Created**: 2026-03-25
**Status**: Draft

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Admin permanently deletes a player (Priority: P1)

An Admin navigates to the players list or a player's detail/edit page, selects "Delete Player", is presented with a confirmation prompt warning that this action is permanent and cannot be undone, confirms the deletion, and the player record is permanently removed from the system.

**Why this priority**: This is the core capability being introduced. All other stories depend on the delete endpoint and confirmation flow existing first.

**Independent Test**: Log in as ADMIN, open the player list, click "Delete" on any player, confirm the prompt — the player disappears from the list and cannot be retrieved.

**Acceptance Scenarios**:

1. **Given** a logged-in Admin is on the players list page, **When** they click "Delete" on a player row, **Then** a confirmation modal appears naming the player and warning the action is permanent.
2. **Given** the confirmation modal is open, **When** the Admin clicks "Confirm Delete", **Then** the player is permanently removed and the list refreshes without that player.
3. **Given** the confirmation modal is open, **When** the Admin clicks "Cancel", **Then** the modal closes and no data is changed.
4. **Given** a logged-in Admin is on a player's edit page, **When** they initiate deletion and confirm, **Then** they are redirected to the player list and the deleted player no longer appears.

---

### User Story 2 — Editor is prevented from deleting a player (Priority: P1)

An Editor logs in and views the players list. The "Delete" action is not visible to them — only the status toggle (Activate / Deactivate) is available. Any direct attempt to call the delete endpoint is rejected by the system.

**Why this priority**: Role enforcement is as critical as the feature itself; a missing guard would be a security regression.

**Independent Test**: Log in as EDITOR, open the player list — no Delete button is visible. Attempt a direct API call to `DELETE /api/v1/players/:id` — the system returns a 403 Forbidden response.

**Acceptance Scenarios**:

1. **Given** a logged-in Editor is on the players list page, **When** the page renders, **Then** no "Delete" button is visible for any player row.
2. **Given** a logged-in Editor is on a player's edit page, **When** the page renders, **Then** no "Delete" option is present.
3. **Given** an authenticated Editor sends a `DELETE` request to the player endpoint, **When** the server processes the request, **Then** a 403 Forbidden response is returned and the player record is unchanged.

---

### User Story 3 — Editor toggles player status (Activate / Deactivate) (Priority: P2)

An Editor (or Admin) navigates to the players list, finds a player, and toggles their status between ACTIVE and INACTIVE. This is the soft-disable mechanism available to both roles.

**Why this priority**: The status toggle already works at the API level; this story ensures the UI clearly presents it as the Editor's only mutating action and that the distinction between soft-deactivation and hard deletion is visually unambiguous.

**Independent Test**: Log in as EDITOR, open the player list, toggle a player's status — the status badge updates in place with no delete option visible.

**Acceptance Scenarios**:

1. **Given** a logged-in Editor views an ACTIVE player, **When** they click "Deactivate", **Then** the player's status changes to INACTIVE and the badge reflects it.
2. **Given** a logged-in Editor views an INACTIVE player, **When** they click "Activate", **Then** the player's status changes to ACTIVE.
3. **Given** a logged-in Admin views any player, **When** they toggle the status, **Then** the status changes correctly — confirming Admins retain Editor permissions.

---

### Edge Cases

- What happens when an Admin attempts to delete a player who has associated game participations, stats, or contact records? The system must handle cascading references gracefully (either cascade-delete or prevent deletion with a descriptive error).
- What happens if two Admins simultaneously try to delete the same player? The second request should return a 404 Not Found (the player is already gone).
- What happens when an unauthenticated user calls the delete endpoint? The system must return 401 Unauthorized.
- What happens when a valid UUID that does not match any player is submitted for deletion? The system must return 404 Not Found.
- What happens if the confirmation modal is dismissed via keyboard (Escape key) or clicking outside it? The modal closes and no deletion occurs.

## Requirements _(mandatory)_

### Functional Requirements

**Delete (ADMIN only)**

- **FR-001**: The system MUST expose a permanent delete operation for player records, accessible only to users with the ADMIN role.
- **FR-002**: The system MUST reject permanent delete requests from EDITOR-role users with a 403 Forbidden response; the player record MUST remain unchanged.
- **FR-003**: The system MUST reject permanent delete requests from unauthenticated callers with a 401 Unauthorized response.
- **FR-004**: The system MUST return 404 Not Found when a delete is requested for a player ID that does not exist.
- **FR-005**: Upon successful deletion, the system MUST remove the player record and all directly owned child data (contact details, statistics) from the data store. References in other records (e.g., game participation history) MUST be nullified rather than deleted, preserving historical game data.
- **FR-006**: The frontend MUST display a confirmation prompt before issuing the delete request. The prompt MUST identify the player by name and include a warning that the action is permanent and cannot be undone.
- **FR-007**: The "Delete" control MUST only be rendered in the UI for authenticated Admin users; Editor-role users MUST NOT see this control.
- **FR-008**: After a successful deletion, the frontend MUST navigate the user to the players list and the deleted player MUST NOT appear in the list.

**Status Toggle (ADMIN and EDITOR)**

- **FR-009**: Both Admin and Editor users MUST be able to toggle a player's status between ACTIVE and INACTIVE via the existing status endpoint.
- **FR-010**: The frontend players list MUST display distinct Activate / Deactivate controls visible to both Admins and Editors.
- **FR-011**: The status toggle MUST NOT require a confirmation prompt (it is a reversible soft action).

### Key Entities

- **Player**: Represents a registered player. Key attributes: unique identifier, name, nickname, status (ACTIVE / INACTIVE). Deletion permanently removes this record.
- **PlayerStatus**: An enumerated state (`ACTIVE`, `INACTIVE`) used for soft-disabling players without removing the record. Status toggling is reversible; permanent deletion is not.
- **Role**: Determines what operations a user may perform. `ADMIN` can delete and toggle status. `EDITOR` can only toggle status.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: An Admin can permanently delete a player in under 30 seconds from the player list page, including the confirmation step.
- **SC-002**: 100% of delete attempts by non-Admin authenticated users are rejected without modifying any data.
- **SC-003**: 100% of frontend sessions for Editor-role users render no delete controls on any player-related page.
- **SC-004**: After a successful deletion, the deleted player does not appear in any subsequent player list query — verified by automated tests.
- **SC-005**: All existing game history and statistics records that reference the deleted player retain their data integrity (no orphaned foreign key errors, no loss of historical match data).

## Assumptions

- The existing `PATCH /api/v1/players/:id/status` endpoint and its frontend controls remain unchanged; this feature adds a new `DELETE /api/v1/players/:id` endpoint alongside it.
- The Prisma schema defines `onDelete: Cascade` for `PlayerContact` and `PlayerStats`. **`GameParticipant.playerId` does not yet have `onDelete: SetNull`** — Phase 1 of this feature introduces a migration to make the field nullable and add the SetNull behaviour. That migration is a prerequisite before any delete operation can satisfy FR-005 without orphaned-reference errors.
- The ADMIN role in the existing RBAC middleware (`requireRole`) is defined as a superset of EDITOR (inclusive semantics) — `requireRole("EDITOR")` grants access to both EDITOR and ADMIN users; no role hierarchy changes are needed.
- A dedicated `PlayerDeleteModal.vue` component will be created under `packages/frontend/src/components/player/` for this feature. It is scoped to the delete confirmation use case only.
