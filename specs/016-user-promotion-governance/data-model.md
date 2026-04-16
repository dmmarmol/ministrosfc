# Data Model: User Promotion Governance

## Overview

This feature extends existing domain entities (`User`, `Player`) plus admin interaction state for confirmation-driven mutations. No new top-level domain table is required.

## Entities

## UserAccount (existing, extended usage)

- Fields used:
  - `id: string`
  - `email: string` (unique)
  - `firstName: string`
  - `lastName: string`
  - `role: ADMIN | EDITOR | DT | PLAYER`
  - `playerId?: string | null`
  - `updatedAt: string`
- Validation:
  - `email` must be valid format and unique across users.
  - `firstName`, `lastName` required for admin edit endpoint and trimmed.
- Business constraints:
  - Editor cannot self-escalate or assign `EDITOR`/`ADMIN`.
  - Admin can assign any role to other users (including promoting to ADMIN and demoting from ADMIN).
  - Admin cannot change their own role (self-demotion prevention enforced at UI and backend).
  - Role mutation must follow actor-target matrix.

## PlayerProfile (existing, lifecycle target)

- Fields used:
  - `id: string`
  - `status: ACTIVE | INACTIVE`
  - relation to `UserAccount` through `User.playerId`
- Validation:
  - Deactivate/delete requires linked player existence.
- Business constraints:
  - Deactivation retains both user + player records.
  - Admin delete removes both linked records atomically.

## RoleGovernancePolicy (service-level entity)

- Dimensions:
  - `actorRole`
  - `actorId` (to prevent self-modification)
  - `targetCurrentRole`
  - `targetId`
  - `targetNewRole`
- Allowed transitions:
  - `ADMIN`: can set any other user to any role (`PLAYER`, `DT`, `EDITOR`, `ADMIN`); includes both promotion to ADMIN and demotion from ADMIN.
  - `ADMIN`: CANNOT change own role (actorId === targetId check returns 403 "Cannot demote yourself").
  - `EDITOR`: can promote only to `PLAYER` or `DT`; cannot demote and cannot set `EDITOR`/`ADMIN`.
  - `DT`/`PLAYER`: no role mutation actions allowed.
- Denials:
  - Self-role changes denied for all users (particularly enforced for ADMIN to prevent privilege loss).
  - Unauthorized transitions return `403 FORBIDDEN`.

## AdminUserMutationRequest (API DTO)

- `UpdateAdminUserProfilePayload`:
  - `firstName: string`
  - `lastName: string`
  - `email: string`
  - optional `expectedUpdatedAt: string` for optimistic concurrency
- `ChangeAdminUserRolePayload`:
  - `role: UserRole`
  - optional `expectedUpdatedAt: string`
- `ChangeAdminUserPlayerStatusPayload`:
  - `status: ACTIVE | INACTIVE`

## AdminConfirmationIntent (frontend state entity)

- Fields:
  - `actionType: "change-role" | "toggle-status" | "delete-user" | "delete-player" | "edit-email"`
  - `targetUserId: string`
  - `targetUserLabel: string` (e.g., "Alice Smith")
  - `targetPlayerLabel?: string` (e.g., "Player #10")
  - `currentValue?: string` (e.g., current role "ADMIN" or current email)
  - `nextValue?: string` (e.g., new role "USER" or new email)
  - `actionDescription: string` (e.g., "Change Alice Smith's role from ADMIN to USER?")
- Purpose:
  - Drives ConfirmationModal component with clear action descriptions.
  - Ensures no sensitive mutation (role changes, status toggles, deletions, critical email edits) is sent before explicit user confirmation.
  - Displays user/player names and before/after values for transparency.
  - Skipped for idempotent changes (same → same) and non-critical edits (first/last name inline saves).

## Relationships

- `UserAccount (0..1) -> (1) PlayerProfile`
- `RoleGovernancePolicy` validates transitions over `UserAccount.role`.
- `AdminConfirmationIntent` references a `UserAccount` row for pending mutation.

## State Transitions

## Role transition

1. `idle` -> `pending-confirmation`
2. `pending-confirmation` -> `updating-role`
3. `updating-role` -> `success` (list refresh + updated badge)
4. `updating-role` -> `forbidden|conflict|validation-error`

## Player lifecycle transition

1. `ACTIVE` -> `INACTIVE` (Editor+ allowed, confirm required)
2. `INACTIVE` -> `ACTIVE` (Editor+ allowed, confirm required)
3. `linked user+player` -> `deleted` (Admin only, confirm required, transactional)

## Profile edit transition

1. `view` -> `inline-edit`
2. `inline-edit` -> `saving`
3. `saving` -> `saved` or `validation-error|conflict`

## Integrity Rules

- Delete operation must not leave orphan references from `GameParticipant`/related tables.
- Profile + role concurrent updates use optimistic concurrency control: stale `expectedUpdatedAt` returns 409 CONFLICT with message "Another admin updated this user. Please refresh and try again."
- Idempotent role update (same value) returns 200 OK without DB write or confirmation modal.
- Network errors after confirmation: close modal, show error toast with retry button, do not mutate local state.
- Session expiry (401) during any operation triggers re-authentication via existing auth middleware.
