# Data Model: 012 — Playground Entity

## New Entity: Playground

### Prisma Schema Addition

```prisma
model Playground {
  id          String    @id @default(uuid()) @db.Uuid
  name        String    @db.VarChar(255)
  address     String    @db.VarChar(500)
  latitude    Float?
  longitude   Float?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  createdById String    @db.Uuid
  updatedById String?   @db.Uuid

  createdBy   User      @relation("PlaygroundCreatedBy", fields: [createdById], references: [id])
  updatedBy   User?     @relation("PlaygroundUpdatedBy", fields: [updatedById], references: [id])

  games       Game[]
}
```

**Validation rules:**

- `name`: required, 1–255 characters, trimmed
- `address`: required, 1–500 characters, trimmed; geocoded via OpenStreetMap Nominatim on create and on every update that changes the address value
- `latitude` / `longitude`: derived automatically after successful geocoding; not provided by the client
- `createdById`: set to the authenticated user's ID on create; never writable by the client
- `updatedById`: set to the authenticated user's ID on every update; never writable by the client

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
  address: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  updatedById: string | null;
  gameCount: number; // derived: count of games referencing this playground
}

export interface PlaygroundCreatePayload {
  name: string;
  address: string;
}

export interface PlaygroundUpdatePayload {
  name?: string;
  address?: string;
}
```

### Update: `packages/shared/src/types/game.ts`

Extend the existing `Game` interface with optional playground fields:

```typescript
// Add to existing Game interface:
playgroundId?: string | null;
playground?: { id: string; name: string; address: string; latitude: number | null; longitude: number | null } | null;
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

| Field         | Type        | Required | Notes                                                                                     |
| ------------- | ----------- | -------- | ----------------------------------------------------------------------------------------- |
| `id`          | UUID        | Yes      | Auto-generated                                                                            |
| `name`        | String(255) | Yes      | Trimmed, 1–255 chars                                                                      |
| `address`     | String(500) | Yes      | Trimmed; geocoded on create/update                                                        |
| `latitude`    | Float?      | No       | Set automatically after geocoding                                                         |
| `longitude`   | Float?      | No       | Set automatically after geocoding                                                         |
| `createdAt`   | DateTime    | Yes      | Auto-set                                                                                  |
| `updatedAt`   | DateTime    | Yes      | Auto-updated                                                                              |
| `createdById` | UUID (FK)   | Yes      | References User; set on create                                                            |
| `updatedById` | UUID? (FK)  | No       | References User; set on update                                                            |
| `gameCount`   | Int         | Derived  | Count of games referencing this playground; included in list/single responses; not stored |

### Game.playground relation fields

| Field          | Type        | Required | Notes                                  |
| -------------- | ----------- | -------- | -------------------------------------- |
| `playgroundId` | UUID?       | No       | FK → Playground.id, ON DELETE RESTRICT |
| `playground`   | Playground? | No       | Expanded relation (not always loaded)  |
