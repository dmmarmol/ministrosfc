# Data Model: Game Signup Invitation (014)

**Branch**: `chore/014-game-signup-invitation`  
**Date**: 2026-04-09

---

## Schema Changes (Prisma)

### `Game` — 4 new fields

```prisma
model Game {
  // ... existing fields ...

  // --- FEATURE 014 ---
  maxPlayers Int?    // nullable — null means unlimited capacity
  slug       String? @unique @db.VarChar(200)  // YYYY-MM-DD-{opponent}, nullable during migration
  lineup     String? @db.VarChar(10)  // one of 14 formation codes, e.g. "4-3-3"
  endDate    DateTime?  // auto-computed server-side: date + 100 min; NOT editable in admin UI

  // ... existing relations ...
}
```

**Migration strategy:**

- `maxPlayers`, `lineup`, and `endDate` are added as nullable — no backfill required.
- `endDate` will be null for existing records; the transition job's 24h fallback handles legacy rows. A backfill script (`backfill-game-end-dates.ts`) can optionally populate `endDate = date + 100 minutes` for all existing games in a follow-up migration.
- `slug` is added as nullable, then backfilled for existing records via a migration script, then a `@unique` partial index is applied. This is a 3-step migration:
  1. Add `slug String?` (no unique yet)
  2. Run `prisma db seed` / custom script to backfill slugs from `date + opponentTeam.name`
  3. Apply `@unique` constraint via `ALTER TABLE "Game" ADD CONSTRAINT "Game_slug_key" UNIQUE ("slug")`

---

## No New Entities

| Concept       | Mapped to                                    | Reason                                                      |
| ------------- | -------------------------------------------- | ----------------------------------------------------------- |
| `GameSignup`  | `GameParticipant` (existing)                 | Simple confirmation record; `confirmationStatus: CONFIRMED` |
| `GuestPlayer` | `Player` with `playerType: GUEST` (existing) | Already has `invitedById` FK and `PlayerType.GUEST` value   |

---

## Entity Relationship Summary

```
Game (extended)
 ├── maxPlayers: Int?            ← new: capacity gate
 ├── slug: String @unique        ← new: URL routing
 ├── lineup: String?             ← new: formation code
 ├── endDate: DateTime?          ← new: auto-computed (date + 100 min); not user-editable
 └── participants: GameParticipant[]

GameParticipant (unchanged schema)
 ├── gameId → Game
 ├── playerId → Player?          (nullable — guest player may be deleted)
 ├── confirmationStatus: CONFIRMED (all signups via this feature)
 ├── confirmedById → Player?     (inviting player for proxy/guest cases)
 └── confirmedAt: DateTime

Player (unchanged schema)
 ├── playerType: REGISTERED | GUEST
 ├── invitedById → Player?       (FK to registering player for guests)
 └── status: ACTIVE | INACTIVE
```

---

## Shared Type Changes (`packages/shared/src/types/`)

### `game.ts` — additions

```typescript
// 14 valid formation codes
export const FORMATIONS = [
  "4-4-2",
  "4-3-3",
  "4-2-3-1",
  "4-5-1",
  "4-1-4-1",
  "4-3-2-1",
  "4-4-1-1",
  "3-4-3",
  "3-5-2",
  "3-4-2-1",
  "5-3-2",
  "5-4-1",
  "5-2-3",
  "4-2-4",
] as const;

export type FormationCode = (typeof FORMATIONS)[number];

// Game interface gains 4 new optional fields
export interface Game {
  // ... existing fields ...
  maxPlayers?: number | null; // new
  slug?: string | null; // new
  lineup?: FormationCode | null; // new
  endDate?: string | null; // new — ISO datetime, auto-computed server-side (date + 100 min); read-only
}

// GameCreateDTO gains optional maxPlayers + lineup
// NOTE: endDate is NOT included — it is computed server-side and must not be sent by the client
export interface GameCreateDTO {
  // ... existing ...
  maxPlayers?: number;
  lineup?: FormationCode;
}

// GameUpdateDTO gains optional maxPlayers + lineup
// NOTE: endDate is NOT included — it is recomputed automatically when `date` changes
export interface GameUpdateDTO {
  // ... existing ...
  maxPlayers?: number | null;
  lineup?: FormationCode | null;
}
```

### `game-participant.ts` — new types (append to existing file)

```typescript
// Three signup modes — tagged union for the trimodal DropdownAddMore
export interface SelfSignupDTO {
  mode: "self";
}

export interface GuestSignupDTO {
  mode: "guest";
  firstName: string; // max 255 chars
  lastName: string; // max 255 chars
}

export interface ProxySignupDTO {
  mode: "proxy";
  targetPlayerId: string; // UUID of existing REGISTERED ACTIVE player
}

export type SignupRequestDTO = SelfSignupDTO | GuestSignupDTO | ProxySignupDTO;

// Normalized roster row returned by the signup page endpoint
export interface RosterEntry {
  participantId: string;
  player: {
    id: string;
    firstName: string;
    lastName: string; // hidden on public pages for guests
    nickname?: string | null;
    jerseyNumber?: number | null;
    position?: string | null;
    playerType: "REGISTERED" | "GUEST";
    invitedById?: string | null;
    invitedByName?: string | null; // "Nombre Apellido" of inviting player
  };
  confirmationStatus: "CONFIRMED";
  confirmedById?: string | null;
  confirmedByName?: string | null; // "Nombre Apellido" — for "Agregado por:" display
  confirmedAt: string; // ISO datetime
}

// Full response shape from GET /api/v1/games/:gameId/signup-page
export interface GameSignupPageDTO {
  game: Game & {
    opponentTeam: { id: string; name: string; logoUrl?: string | null };
    playground?: { id: string; name: string } | null;
  };
  roster: RosterEntry[]; // ordered by confirmedAt ASC
  confirmedCount: number;
  maxPlayers: number | null;
  isFull: boolean;
  currentPlayerStatus:
    | "not_signed_up"
    | "signed_up"
    | "no_player_linked"
    | "not_player_role";
  currentPlayerId?: string | null;
}
```

---

## Slug Normalization

**Location**: `packages/cms/src/utils/slug.ts`

```typescript
// Algorithm:
// 1. Format date as YYYY-MM-DD (UTC)
// 2. Transliterate opponent name: á→a, é→e, í→i, ó→o, ú→u, ü→u, ñ→n (manual map)
// 3. Lowercase
// 4. Replace non-alphanumeric chars with '-'
// 5. Collapse consecutive hyphens
// 6. Trim leading/trailing hyphens
// 7. If result is empty → validation error (thrown before DB write)
// 8. Check DB for conflict; if exists → append '-2', '-3', etc.

export async function generateGameSlug(
  date: Date,
  opponentName: string,
  prisma: PrismaClient,
  existingGameId?: string,
): Promise<string>;
```

---

## Validation Rules

| Field                            | Rule                                                                                          |
| -------------------------------- | --------------------------------------------------------------------------------------------- |
| `maxPlayers`                     | Int ≥ 1 or null                                                                               |
| `lineup`                         | Must be one of `FORMATIONS` or null                                                           |
| `slug`                           | Auto-generated server-side; not user-settable                                                 |
| `endDate`                        | Auto-computed server-side as `date + 100 minutes` (rounded down); not user-settable; nullable for legacy records only |
| `firstName` / `lastName` (guest) | 1–255 chars, required                                                                         |
| `targetPlayerId` (proxy)         | Valid UUID, must exist as `REGISTERED + ACTIVE` in DB                                        |
| Slug opponent name               | After normalization, must produce at least 1 non-hyphen char                                  |

---

## State Transitions

### Signup lifecycle

```
Player visits /games/{slug}/signup
  → not authenticated → redirect to /login?redirect=/games/{slug}/signup
  → authenticated, no player linked → read-only view (no DropdownAddMore)
  → authenticated, already confirmed → no self-signup option; can still proxy/guest
  → authenticated, not confirmed, game.status ≠ SCHEDULED → read-only + "no disponible"
  → authenticated, not confirmed, isFull → "El cupo está completo"
  → authenticated, not confirmed, open → DropdownAddMore (trimodal)
```

### Game Participant creation

```
POST /api/v1/games/:gameId/signup-page/signup
  → mode: 'self' → upsert GameParticipant(playerId=self, confirmedById=self, status=CONFIRMED)
  → mode: 'guest' → create Player(GUEST, invitedById=self) + GameParticipant(confirmedById=self)
  → mode: 'proxy' → create GameParticipant(playerId=target, confirmedById=self, status=CONFIRMED)
```
