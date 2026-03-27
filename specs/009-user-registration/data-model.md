# Data Model: 015 — User Registration & Sign-In

**Date**: 2026-03-25
**Source**: [spec.md](spec.md), [research.md](research.md)

---

## Schema Changes Overview

| Entity      | Change Type | Description                                                                                  |
| ----------- | ----------- | -------------------------------------------------------------------------------------------- |
| `Role` enum | MODIFY      | Add `DT` value                                                                               |
| `User`      | MODIFY      | Split `name` → `firstName` + `lastName`; add `googleSubjectId`; make `passwordHash` nullable |
| `Player`    | MODIFY      | Split `name` → `firstName` + `lastName`; add `address`                                       |

---

## Enum Changes

### Role (MODIFY)

```prisma
enum Role {
  ADMIN
  EDITOR
  DT        // NEW — Director Técnico (Coach)
  PLAYER
}
```

**Application-level hierarchy** (in `rbac.ts`):

```ts
const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 4, // was 3
  EDITOR: 3, // was 2
  DT: 2, // NEW
  PLAYER: 1, // unchanged
};
```

---

## Entity Changes

### User (MODIFY)

**Current schema:**

```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  name         String
  role         Role      @default(PLAYER)
  player       Player?   @relation(fields: [playerId], references: [id], onDelete: SetNull)
  playerId     String?   @unique
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  lastLoginAt  DateTime?
}
```

**Updated schema:**

```prisma
model User {
  id              String    @id @default(uuid())
  email           String    @unique
  passwordHash    String?                        // CHANGED: nullable (Google-only users)
  firstName       String    @db.VarChar(255)     // NEW: replaces `name`
  lastName        String    @db.VarChar(255)     // NEW: replaces `name`
  googleSubjectId String?   @unique              // NEW: Google OAuth subject ID
  role            Role      @default(PLAYER)
  player          Player?   @relation(fields: [playerId], references: [id], onDelete: SetNull)
  playerId        String?   @unique
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  lastLoginAt     DateTime?

  @@index([email])
  @@index([role])
  @@index([googleSubjectId])
}
```

**Field-level changes:**

| Field             | Before              | After                     | Migration                                                      |
| ----------------- | ------------------- | ------------------------- | -------------------------------------------------------------- |
| `name`            | `String` (required) | REMOVED                   | Split into firstName + lastName                                |
| `firstName`       | —                   | `String @db.VarChar(255)` | Backfill from `name` (text before first space)                 |
| `lastName`        | —                   | `String @db.VarChar(255)` | Backfill from `name` (text after first space, or empty string) |
| `passwordHash`    | `String` (required) | `String?` (nullable)      | Allow Google-only users with no password                       |
| `googleSubjectId` | —                   | `String? @unique`         | Google OAuth subject ID for account linking                    |

**Validation rules:**

- `email`: valid email format, unique (DB + Zod)
- `firstName`: 1–255 chars, not blank
- `lastName`: 1–255 chars, not blank
- `passwordHash`: nullable; required if `googleSubjectId` is null (app-level: users must have at least one auth method)
- `googleSubjectId`: unique when present; populated from Google's `sub` claim

---

### Player (MODIFY)

**Current schema (relevant fields):**

```prisma
model Player {
  id         String       @id @default(uuid())
  name       String       @db.VarChar(255)
  nickname   String?      @db.VarChar(100)
  // ... rest unchanged
}
```

**Updated schema (relevant fields):**

```prisma
model Player {
  id         String       @id @default(uuid())
  firstName  String       @db.VarChar(255)     // NEW: replaces `name`
  lastName   String       @db.VarChar(255)     // NEW: replaces `name`
  nickname   String?      @db.VarChar(100)
  address    String?      @db.VarChar(500)     // NEW: per FR-028 profile editing
  // ... rest unchanged
}
```

**Field-level changes:**

| Field       | Before                    | After                      | Migration                                                      |
| ----------- | ------------------------- | -------------------------- | -------------------------------------------------------------- |
| `name`      | `String @db.VarChar(255)` | REMOVED                    | Split into firstName + lastName                                |
| `firstName` | —                         | `String @db.VarChar(255)`  | Backfill from `name` (text before first space)                 |
| `lastName`  | —                         | `String @db.VarChar(255)`  | Backfill from `name` (text after first space, or empty string) |
| `address`   | —                         | `String? @db.VarChar(500)` | Nullable, editable from profile page                           |

**Validation rules:**

- `firstName`: 1–255 chars
- `lastName`: 1–255 chars
- `jerseyNumber`: unique among ACTIVE REGISTERED players (existing rule)
- `address`: 0-500 chars, optional

---

## Migrations

### Migration 1: `split_user_name_fields`

Custom SQL migration (not auto-generated):

1. Add `firstName`, `lastName` as nullable to `User` and `Player`
2. Backfill from `name` (split on first space)
3. Set NOT NULL
4. Drop `name` column from both tables
5. Add `address` to `Player` (nullable)

See [research.md](research.md#topic-2) for exact SQL.

### Migration 2: `add_dt_role_google_auth`

Auto-generated by Prisma:

1. `ALTER TYPE "Role" ADD VALUE 'DT'`
2. Add `googleSubjectId String? @unique` to `User`
3. Make `User.passwordHash` nullable
4. Add index on `googleSubjectId`

---

## State Transitions

### User Registration States

```
[No Account] ──email register──→ [User(role=PLAYER, passwordHash=set) + Player(status=ACTIVE)]
[No Account] ──google sign-in──→ [User(role=PLAYER, passwordHash=null, googleSubjectId=set) + Player(status=ACTIVE)]
[Existing email user] ──google sign-in──→ [User.googleSubjectId linked]
```

### Role Hierarchy (promote/demote paths)

```
PLAYER ←──promote/demote──→ DT ←──promote/demote──→ EDITOR ←──promote──→ ADMIN
                                                                         (no demote from ADMIN)
```

- Only ADMIN can promote/demote
- Cannot demote another ADMIN
- Promotion: PLAYER→DT, PLAYER→EDITOR, PLAYER→ADMIN, DT→EDITOR, DT→ADMIN, EDITOR→ADMIN
- Demotion: EDITOR→DT, EDITOR→PLAYER, DT→PLAYER

### Player Status (existing, unchanged)

```
ACTIVE ←──deactivate/reactivate──→ INACTIVE
```

- INACTIVE players can still log in and edit profile (FR-016)
- INACTIVE players excluded from game participation, roster selection

---

## Relationships

```
User 1──0..1 Player     (User.playerId FK, @unique)
Player 0..1──* Player   (invitedBy / invitedGuests — "GuestInvites" relation)
Player 1──0..1 Contact  (PlayerContact relation)
Player 1──* GameParticipant
```

**New behavior:**

- Registration auto-creates Player linked via `User.playerId`
- Profile page accesses User + Player + Contact in a single query
- "Invitados" section queries `Player.invitedGuests` where `playerType=GUEST`
