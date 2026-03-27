# Data Model: Admin Player Delete with Role-Based Controls

**Phase**: 1 — Design  
**Feature**: `feat/006-admin-player-delete`  
**Date**: 2026-03-25

---

## Schema Change: GameParticipant.playerId → Nullable

**Why**: FR-005 mandates that game participation records be preserved (nullified) when a player is deleted. The current schema uses `onDelete: Cascade` with a non-nullable `playerId`, which would delete the records. See `research.md` Finding 1.

**Migration diff** (`packages/cms/prisma/schema.prisma`):

```diff
 model GameParticipant {
   id     String @id @default(uuid())
   game   Game   @relation("GameParticipants", fields: [gameId], references: [id], onDelete: Cascade)
   gameId String
-  player Player @relation("PlayerParticipant", fields: [playerId], references: [id], onDelete: Cascade)
-  playerId String
+  player   Player? @relation("PlayerParticipant", fields: [playerId], references: [id], onDelete: SetNull)
+  playerId String?
```

**Impact**:

- All existing rows unaffected (non-null playerId values remain)
- TypeScript Prisma client type: `playerId` becomes `string | null`; `player` becomes `Player | null`
- Queries that filter/join on `playerId` must handle null (e.g., `where: { playerId: { not: null } }`)
- Application code reading `participant.playerId` must null-guard

**Migration file**: `prisma/migrations/<timestamp>_nullable_game_participant_player/migration.sql`

```sql
-- AlterTable
ALTER TABLE "GameParticipant" ALTER COLUMN "playerId" DROP NOT NULL;
```

---

## No New Entities

This feature does not introduce new database models. The core `Player` entity is unchanged; deletion is handled at the service layer via `prisma.player.delete()`.

---

## Player Entity (unchanged)

| Field        | Type                | Notes                                 |
| ------------ | ------------------- | ------------------------------------- |
| `id`         | `String` (UUID)     | Primary key                           |
| `name`       | `String` (max 255)  | Required                              |
| `nickname`   | `String?` (max 100) | Optional                              |
| `playerType` | `PlayerType`        | `REGISTERED` or `GUEST`               |
| `status`     | `PlayerStatus`      | `ACTIVE` or `INACTIVE` (soft-disable) |
| `photoUrl`   | `String?`           | Cloudinary URL; cleaned up on delete  |

**Lifecycle**:

```
ACTIVE ←→ INACTIVE   (status toggle — reversible, Editor+Admin)
    ↓
 deleted              (permanent DELETE — Admin only, irreversible)
```

---

## Cascade Behavior on Player Deletion

| Related Model     | Relation                | Behavior on Delete            | Notes                                                 |
| ----------------- | ----------------------- | ----------------------------- | ----------------------------------------------------- |
| `Contact`         | `PlayerContact`         | **Cascade delete**            | Player's own contact info; no value without player    |
| `Statistics`      | `PlayerStats`           | **Cascade delete**            | Player's aggregate stats; player-owned record         |
| `GameParticipant` | `PlayerParticipant`     | **SetNull** (after migration) | Preserves game contribution rows; `playerId` → `null` |
| `GameParticipant` | `ConfirmedParticipants` | **SetNull** (existing)        | `confirmedById` already nullable                      |
| `User`            | `player` field          | **SetNull** (existing)        | User account preserved; `playerId` → `null`           |
| `Player` (guests) | `GuestInvites`          | **SetNull** (existing)        | Invited guest `invitedById` → `null`                  |
| `Game`            | (no direct relation)    | No change                     | Game outcomes, scores fully preserved                 |

---

## New Service Method: PlayerService.deletePlayer

**Location**: `packages/cms/src/services/PlayerService.ts`

**Signature**:

```ts
async deletePlayer(id: string): Promise<void>
```

**Logic**:

1. `findById(id)` — throw 404 if not found
2. `PlayerModel.deleteById(id)` — triggers DB cascade/SetNull per table above
3. If `player.photoUrl` exists → `deletePlayerPhoto(photoUrl).catch(() => {})` (best-effort)
4. `invalidateCache()` — clear Redis player list keys

**Error codes used**:

- `404 / PLAYER_NOT_FOUND` — player does not exist
- `401 / UNAUTHORIZED` — no auth (enforced by middleware, not service)
- `403 / FORBIDDEN` — non-Admin caller (enforced by middleware, not service)

---

## New Model Method: PlayerModel.deleteById

**Location**: `packages/cms/src/models/Player.ts`

**Signature**:

```ts
async deleteById(id: string): Promise<void>
```

**Implementation**:

```ts
async deleteById(id: string) {
  await prisma.player.delete({ where: { id } });
}
```

Prisma propagates cascade/SetNull according to the schema. No application-side join deletions needed.

---

## Frontend State Changes

**Auth store** (`packages/frontend/src/stores/auth.ts`): No changes. `isAdmin` getter already exists.

**Page state** (`admin/players/index.vue`):

- New reactive: `deleteTarget: Player | null` (controls modal visibility)
- No new Pinia store needed (local page state is sufficient)

**PlayerDeleteModal component** (`admin/players/PlayerDeleteModal.vue`):

- Props: `player: { id: string; name: string }`
- Emits: `confirm`, `cancel`
- No external state; purely presentational + event emitter

---

## Validation Rules

| Rule                                      | Scope       | Notes                                         |
| ----------------------------------------- | ----------- | --------------------------------------------- |
| `id` must be valid UUID                   | Route param | Validated by existing `uuidSchema` middleware |
| Caller must be authenticated              | Route       | `authenticate` middleware                     |
| Caller must be ADMIN                      | Route       | `requireRole("ADMIN")`                        |
| Player must exist                         | Service     | 404 returned if not found                     |
| No custom business rule prevents deletion | Service     | No restrictions (admin has full authority)    |
