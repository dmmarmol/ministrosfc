# Data Model: 012 — Playground Entity

## New Entity: Playground

### Prisma Schema Addition

```prisma
model Playground {
  id        String   @id @default(uuid())
  name      String   @db.VarChar(255)
  address   String?  @db.VarChar(500)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  games Game[]
}
```

**Validation rules:**
- `name`: required, 1–255 characters, trimmed
- `address`: optional, max 500 characters, trimmed

---

## Modified Entity: Game (existing)

### Prisma Schema Change

Add two fields to the existing `Game` model:

```prisma
// Added to Game model:
playgroundId  String?    @db.Uuid
playground    Playground? @relation(fields: [playgroundId], references: [id], onDelete: Restrict)
```

**The existing `location` field is preserved unchanged:**
```prisma
location String? @db.VarChar(255)  // kept as-is, legacy free-text
```

**Behaviour:**
- `playgroundId` is optional — both new and existing games can have `null`
- `onDelete: Restrict` — prevents deletion of a playground referenced by any game
- Display priority: `playground.name` if linked, else `location` text, else nothing

---

## Shared Types (`packages/shared/src/types/`)

### New file: `packages/shared/src/types/playground.ts`

```typescript
export interface Playground {
  id: string;
  name: string;
  address: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlaygroundCreatePayload {
  name: string;
  address?: string | null;
}

export interface PlaygroundUpdatePayload {
  name?: string;
  address?: string | null;
}
```

### Update: `packages/shared/src/types/game.ts`

Extend the existing `Game` interface with optional playground fields:

```typescript
// Add to existing Game interface:
playgroundId?: string | null;
playground?: { id: string; name: string; address: string | null } | null;
```

### Update: `packages/shared/src/types/index.ts`

Add export: `export * from "./playground";`

---

## State Transitions

Playground has no complex state. It is either:
- **Referenced** (by ≥1 game) — cannot be deleted
- **Unreferenced** (by 0 games) — can be deleted

```
[Unreferenced] ←→ [Referenced]
                  ↑ (any game is created/updated with this playgroundId)
                  ↓ (all referencing games updated to remove playgroundId)
```

---

## Prisma Migration Plan

1. New migration: `add_playground_entity`
   - Creates `Playground` table
   - Adds `playgroundId` column to `Game` table (nullable, no default)
   - Adds FK constraint with `ON DELETE RESTRICT`
2. No data migration needed — all existing games will have `playgroundId = NULL`
3. The existing `location` column is untouched

---

## Entity Summary Table

| Field        | Type          | Required | Notes                                      |
|--------------|---------------|----------|--------------------------------------------|
| `id`         | UUID          | Yes      | Auto-generated                             |
| `name`       | String(255)   | Yes      | Trimmed, 1–255 chars                       |
| `address`    | String(500)?  | No       | Optional, trimmed                          |
| `createdAt`  | DateTime      | Yes      | Auto-set                                   |
| `updatedAt`  | DateTime      | Yes      | Auto-updated                               |

### Game.playground relation fields

| Field          | Type       | Required | Notes                                          |
|----------------|------------|----------|------------------------------------------------|
| `playgroundId` | UUID?      | No       | FK → Playground.id, ON DELETE RESTRICT         |
| `playground`   | Playground?| No       | Expanded relation (not always loaded)          |
