# Research: Admin Player Delete with Role-Based Controls

**Phase**: 0 — Research  
**Feature**: `013-admin-player-delete`  
**Date**: 2026-03-25

---

## Finding 1: GameParticipant Cascade vs. SetNull — Schema Contradiction

**Context**: FR-005 mandates that "References in other records (e.g., game participation history) MUST be nullified rather than deleted, preserving historical game data." The spec's Assumptions section states: "The Prisma schema already defines `onDelete: Cascade` for `PlayerContact` and `PlayerStats`, and `onDelete: SetNull` for nullable player references in game records — these behaviours satisfy FR-005 without schema changes."

**Finding**: The spec assumption is **factually incorrect**. Inspecting `packages/cms/prisma/schema.prisma`:

```prisma
model GameParticipant {
  player   Player @relation("PlayerParticipant", fields: [playerId], references: [id], onDelete: Cascade)
  playerId String  // ← NON-NULLABLE, Cascade
  ...
}
```

The `playerId` field in `GameParticipant` is **non-nullable** with **`onDelete: Cascade`**. Deleting a player would cascade-delete all their `GameParticipant` rows (including in-game stats: goals, assists, minutes played, cards), not nullify them.

**Decision**: A Prisma migration is **required** to satisfy FR-005.

- Make `GameParticipant.playerId` **nullable** (`String?`)
- Change `onDelete` to **`SetNull`**
- Result: when a player is deleted, their GameParticipant rows persist with `playerId = null`, preserving per-game contribution records

**Rationale**: FR-005 is an explicit functional requirement, not an assumption. The migration is isolated (one field change + index update), low-risk, and directly satisfies the requirement.

**Alternatives considered**:
- Accept cascade delete → violates FR-005; historical per-game contribution data (goals, assists) is lost irreversibly
- Application-level soft-delete (add `deletedAt` to Player) → much larger scope change; out of feature scope
- Denormalize player name into GameParticipant → additional complexity without adding query value; rejected

**Migration scope**:
```prisma
model GameParticipant {
  player   Player? @relation("PlayerParticipant", fields: [playerId], references: [id], onDelete: SetNull)
  playerId String?  // was: String
```

---

## Finding 2: Status Toggle Endpoint — Wrong Role Restriction

**Context**: FR-009 says "Both Admin and Editor users MUST be able to toggle a player's status." FR-010 says the frontend must display status controls to both roles.

**Finding**: The current `PATCH /api/v1/players/:id/status` endpoint in `packages/cms/src/routes/players.ts` uses `requireRole("ADMIN")`, blocking Editors.

```ts
// Current (incorrect for FR-009):
router.patch("/:id/status", authenticate, requireRole("ADMIN"), ...)
```

The RBAC hierarchy is `ADMIN(3) > EDITOR(2) > PLAYER(1)`. Changing to `requireRole("EDITOR")` grants access to both EDITOR and ADMIN (since ADMIN level 3 ≥ EDITOR required level 2).

**Decision**: Change status endpoint role guard from `requireRole("ADMIN")` to `requireRole("EDITOR")`.

**Rationale**: Single-line fix that directly satisfies FR-009 without any structural change. The existing hierarchy handles it.

**Alternatives considered**:
- Create a separate EDITOR-facing status endpoint → unnecessary duplication; same endpoint works
- Add a custom per-endpoint role list → over-engineering; hierarchy already supports this

---

## Finding 3: No Existing Confirmation Modal Component

**Context**: FR-006 requires a confirmation prompt before deletion. FR-007 requires the Delete control is Admin-only.

**Finding**: Inspecting `packages/frontend/src/components/`:
```
common/Footer.vue, Header.vue, Navigation.vue
player/PlayerCard.vue
```
No reusable modal/dialog component exists. The current codebase uses `alert()` for error feedback (see `toggleStatus` in `admin/players/index.vue`).

**Decision**: Create a **scoped** `PlayerDeleteModal.vue` component co-located with the players admin pages. No general-purpose modal abstraction needed for this feature.

**Rationale**: Constitution Principle V (Single Responsibility) and the implementation discipline rule against creating abstractions for one-time use. A players-scoped modal is sufficient; a general modal can be extracted later if more use cases emerge.

**Implementation**: The modal will:
- Accept `player` prop (name + id)
- Emit `confirm` and `cancel` events
- Show player name in warning text
- Trap Escape key and background-click to cancel (satisfies edge case in spec)
- Be rendered inline in the players list and edit pages

---

## Finding 4: Frontend Admin Role Detection Pattern

**Context**: FR-007 requires the Delete button be visible only to Admins in the frontend.

**Finding**: `packages/frontend/src/stores/auth.ts` already exposes:
```ts
getters: {
  isAdmin: (state) => state.user?.role === "ADMIN",
  isEditor: (state) => state.user?.role === "ADMIN" || state.user?.role === "EDITOR",
}
```

The `useAuthStore().isAdmin` getter can be used directly in templates to conditionally show the Delete button.

**Decision**: Use `authStore.isAdmin` for all delete-control visibility guards. No new role infrastructure needed.

---

## Finding 5: Photo Cleanup on Player Deletion

**Context**: Players may have a `photoUrl` pointing to a Cloudinary-hosted image. Deleting the player should clean up the orphaned photo.

**Finding**: `PlayerService` exposes `deletePlayerPhoto(url)` (from `utils/object-storage`). The pattern used in `updatePlayer` is: delete-then-upload. The same pattern applies to permanent deletion: call `deletePlayerPhoto(player.photoUrl)` before (or after) the DB delete.

**Decision**: In `PlayerService.deletePlayer()`, after the DB delete succeeds, attempt `deletePlayerPhoto(photoUrl)` as a **best-effort** (fire-and-forget with `.catch(() => {})` — same pattern as existing code). A failed photo cleanup is not a reason to reject the deletion response.

**Rationale**: Matches existing codebase patterns. Cloudinary cleanup is not transactional; best-effort is the correct approach.

---

## Finding 6: PlayerModel.delete — New Method Needed

**Context**: `packages/cms/src/models/Player.ts` has `create`, `findById`, `findMany`, `update`, `deactivate`, `reactivate`. No `delete`/`deleteById` method exists.

**Decision**: Add `PlayerModel.deleteById(id: string)` that calls `prisma.player.delete({ where: { id } })`. The cascade behavior (Cascade for Contact, Statistics; SetNull for GameParticipant after migration) is handled by Prisma automatically.

---

## Finding 7: Cache Invalidation — Reuse Existing

**Finding**: `PlayerService.invalidateCache()` deletes all `cache:stats:players:list:*` keys. It is already called by create/update/status operations.

**Decision**: Call `PlayerService.invalidateCache()` after a successful delete. No new cache logic needed.

---

## Finding 8: Test Framework Decisions

**CMS tests**: Jest (existing pattern). New tests for:
- `tests/unit/PlayerService.test.ts` — extend with `deletePlayer` cases
- `tests/integration/player-crud.test.ts` — extend with DELETE endpoint cases
- `tests/integration/rbac.test.ts` — extend with DELETE 403 for Editor, 401 for unauth

**Frontend tests**: Vitest (constitution mandate for new files). New tests for:
- `tests/components/PlayerDeleteModal.test.ts` — modal emits confirm/cancel correctly
- `tests/stores/auth.test.ts` — extend if needed (isAdmin getter already tested)

**E2E**: Playwright. New specs for:
- Admin delete flow (with confirmation)
- Editor cannot see Delete button
- Status toggle works for Editor

---

## Summary of Changes Required

| Area | Change | Complexity |
|------|--------|------------|
| Prisma schema | `GameParticipant.playerId` nullable + SetNull | Low (migration) |
| CMS route | DELETE `/api/v1/players/:id` (Admin-only) | Low |
| CMS route | Status PATCH: `requireRole("ADMIN")` → `requireRole("EDITOR")` | Trivial |
| CMS model | `PlayerModel.deleteById()` | Low |
| CMS service | `PlayerService.deletePlayer()` | Low |
| Frontend component | `PlayerDeleteModal.vue` | Low |
| Frontend page | Players list: Admin-only Delete button + modal | Low |
| Frontend page | Player edit: Admin-only Delete button + modal | Low |
| Tests (CMS) | Unit + integration coverage for delete & editor status | Medium |
| Tests (frontend) | Vitest component test for modal | Low |
| E2E | Playwright: delete flow + editor guard | Medium |
