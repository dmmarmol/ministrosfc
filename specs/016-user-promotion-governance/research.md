# Research: User Promotion Governance

## Scope

Resolve implementation choices for user directory edits, role governance, and player lifecycle actions in existing admin-users flows.

## Decision 1: Allow Editor access to user listing and profile edits

- Decision: Change `GET /api/v1/admin/users` and profile-edit endpoint authorization from Admin-only to Editor+ (`requireRole("EDITOR")`).
- Rationale: Spec requires both Admin and Editor to manage the directory and edit first name/last name/email.
- Alternatives considered:
  - Keep Admin-only API and proxy Editor through frontend restrictions: rejected because it violates FR-001/FR-003.
  - Duplicate endpoints for Admin and Editor: rejected as unnecessary surface-area growth.

## Decision 2: Keep role-change endpoint as one route with policy checks in service

- Decision: Keep one endpoint (`PATCH /api/v1/admin/users/:id/role`) but enforce actor/target matrix in `UserService.changeRole`.
- Rationale: Existing route exists and already centralizes role mutation. Policy extension is safer in one path.
- Alternatives considered:
  - Separate promote/demote endpoints: rejected because policy still needs centralized matrix logic.
  - Frontend-only role restriction: rejected because authorization must be server-enforced.

## Decision 3: Add explicit profile edit endpoint for first name, last name, email

- Decision: Add/update endpoint `PATCH /api/v1/admin/users/:id` with Zod validation (name lengths + email format/uniqueness).
- Rationale: Current users API lacks dedicated profile mutation route despite service support; feature requires inline edit behavior.
- Alternatives considered:
  - Reuse auth/profile endpoints: rejected because admin is editing other users, not self-profile.
  - Put profile fields into role endpoint payload: rejected due to mixed concerns and harder validation.

## Decision 4: Enforce confirmation before role/status/delete in UI only, keep API stateless

- Decision: Require confirmation modals in admin UI for role changes, deactivate/reactivate, and delete; API remains idempotent and stateless.
- Rationale: Confirmation is user-interaction policy; backend cannot guarantee modal presence and should keep business validation only.
- Alternatives considered:
  - Add backend confirmation tokens/challenge: rejected as unnecessary complexity for same-session admin actions.
  - Keep browser `confirm()` prompts: rejected; inconsistent UX and lower testability.

## Decision 5: Delete semantics must remove both user and linked player atomically

- Decision: Update `deletePlayer` flow to transactional delete of both `User` and linked `Player` with relation-safe ordering.
- Rationale: Spec FR-013 requires both records deleted; current implementation only deletes player then disconnects user.
- Alternatives considered:
  - Soft-delete user only: rejected due to explicit hard-delete requirement.
  - Delete user only and rely on cascade for player: rejected because current relation (`onDelete: SetNull`) does not guarantee player removal.

## Decision 6: Concurrency strategy for overlapping user updates

- Decision: Use optimistic concurrency via `updatedAt` precondition (or compare-and-fail check) on mutable user updates and return conflict on stale writes.
- Rationale: Spec requires deterministic behavior for concurrent role/profile changes without silent overwrite.
- Alternatives considered:
  - Last-write-wins default: rejected due to silent data loss risk.
  - Pessimistic locks at DB level: rejected as excessive for low-write admin flow.

## Decision 7: Move admin-users API contracts to shared types

- Decision: Replace local `AdminUser` component interface with `@ministrosfc/shared` types (`AdminUserListItem`, mutation payload/response types).
- Rationale: Constitution Principle VII requires cross-package contracts in `packages/shared/src/types`.
- Alternatives considered:
  - Keep frontend-local interfaces: rejected; known drift risk against backend selects and route payloads.

## Decision 8: Retain existing page route and meta declaration

- Decision: No new page file; continue using `pages/admin/users/index.vue` with existing `definePageMeta` and evolve extracted component structure.
- Rationale: Already constitution-compliant and avoids route churn.
- Alternatives considered:
  - New dedicated pages for edit/delete flows: rejected as over-segmentation for inline management UX.

## Decision 9: Admin can demote other admins with self-demotion prevention

- Decision: Update governance matrix to allow Admin→Any role transitions (including Admin→lower roles) for other users, but block self-demotion at both UI and backend levels.
- Rationale: FR-005/FR-005a/FR-005b require reversible admin privileges to prevent escalation lock-in while ensuring at least one admin always exists (self-demotion prevention). Dual-layer validation (UI disabled dropdown + backend 403) provides defense in depth.
- Alternatives considered:
  - Allow self-demotion with "last admin" check: rejected due to race condition complexity and admin lockout risk.
  - Keep admin role immutable: rejected as it creates permanent privilege escalation once admin rights are granted.
  - Backend-only validation: rejected as insufficient UX feedback; users should see disabled controls before attempting action.

## Decision 10: All sensitive actions require ConfirmationModal component

- Decision: Extend existing ConfirmationModal component integration to ALL sensitive actions on /admin/users page: role changes (any→any), user status toggles, user/player deletions, critical profile edits. Each modal must display clear action description with user/player names and require explicit confirm/cancel.
- Rationale: FR-015 mandates comprehensive confirmation coverage to prevent accidental data loss and unintended privilege changes. Reusing existing modal component maintains UI consistency and leverages tested patterns.
- Alternatives considered:
  - Selective confirmation (deletions only): rejected as insufficient; role changes and status toggles are equally sensitive.
  - Different modal components per action type: rejected as unnecessary fragmentation; single component with dynamic messaging is cleaner.
  - Browser-native confirm dialogs: rejected due to poor UX, limited styling/testing capability, and inconsistency with app design system.
