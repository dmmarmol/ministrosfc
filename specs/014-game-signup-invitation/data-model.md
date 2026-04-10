# Data Model: Game Signup Invitation (014)

**Branch**: `chore/014-game-signup-invitation`  
**Date**: 2026-04-09

---

## Schema Changes (Prisma)

### `Game` — 4 new fields

```prisma
model Game {
  // ... existing fields ...

  // --- FEATURE 014 (amended 2026-04-10) ---
  maxPlayers Int?
  slug       String    @unique @db.VarChar(200)
  lineup     String    @default("4-4-2") @db.VarChar(10)  // non-nullable; legacy NULL rows migrated
  endDate    DateTime

  // ... existing relations ...
}
```

**Migration strategy (amendment 2026-04-10 — T060):**

`lineup` was previously nullable (`String?`). A single migration sets the default, backfills
all existing `NULL` rows to `"4-4-2"`, then drops nullability:

```sql
ALTER TABLE "Game" ALTER COLUMN "lineup" SET DEFAULT '4-4-2';
UPDATE "Game" SET "lineup" = '4-4-2' WHERE "lineup" IS NULL;
ALTER TABLE "Game" ALTER COLUMN "lineup" SET NOT NULL;
```

This is expressed as a Prisma migration — `prisma migrate dev --name lineup_non_nullable_default`.
No separate backfill script is needed (unlike `slug` which required opponentTeam name lookups).

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
 ├── lineup: String @default("4-4-2")  ← non-nullable (amended 2026-04-10); was String?
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
  position?: string | null; // optional, one of Position enum values; stored on the guest Player record
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

## US-8 Type Additions (added 2026-04-10 — FR-031, FR-032, FR-033)

### `game.ts` — `GameSignupState` (new export)

```typescript
/**
 * Per-game signup state for authenticated PLAYER callers viewing the public games list.
 * Embedded in the GET /api/v1/games list response (FR-031) and consumed by GameCard.vue (FR-032).
 * Distinct from CurrentPlayerStatus which is for the signup-page detail view.
 */
export type GameSignupState = "available" | "signed_up" | "full";
```

**Placement**: `packages/shared/src/types/game.ts` — exported from `@ministrosfc/shared`.

**Usage**:

- CMS: `GET /api/v1/games` response embeds `currentPlayerStatus?: GameSignupState | null` per game for PLAYER callers
- Frontend: `GameCard.vue` `signupState?: GameSignupState` prop

### `game.ts` — `Game` interface extension

```typescript
// Add to Game interface:
currentPlayerStatus?: GameSignupState | null; // only present for PLAYER-authenticated list responses
```

**Note**: This field is computed server-side and never stored in the DB. It is omitted from `GameCreateDTO` and `GameUpdateDTO`.

---

## Validation Rules

| Field                            | Rule                                                                                                                                                                            |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `maxPlayers`                     | Int ≥ 1 or null                                                                                                                                                                 |
| `lineup`                         | Must be one of `FORMATIONS` or null                                                                                                                                             |
| `slug`                           | Auto-generated server-side; not user-settable                                                                                                                                   |
| `endDate`                        | Auto-computed server-side as `date + exactly 100 minutes` (no sub-minute rounding); not user-settable; stripped silently from client payloads; nullable for legacy records only |
| `firstName` / `lastName` (guest) | 1–255 chars, required                                                                                                                                                           |
| `position` (guest)               | One of `Position` enum values or null; optional — stored on the guest `Player` record; used for SVG field slot assignment same as a registered player's position                |
| `targetPlayerId` (proxy)         | Valid UUID, must exist as `REGISTERED + ACTIVE` in DB                                                                                                                           |
| Slug opponent name               | After normalization, must produce at least 1 non-hyphen char                                                                                                                    |

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

---

## Wave 3 Component Model — Session 2026-04-10

No new DB entities or API endpoints. Wave 3 is a **pure frontend refactor + new component**.

### New Component: `SignupAddPlayer.vue`

**Location**: `packages/frontend/src/components/pages/games/signup/SignupAddPlayer.vue`

**Props**

| Prop | Type | Description |
|---|---|---|
| `confirmedPlayerIds` | `string[]` | IDs of players already confirmed for this game; used to filter dropdown |
| `proxyLoading` | `boolean` | True while parent's proxy API call is in-flight; disables dropdown |
| `proxyError` | `string \| null` | Inline error message to display on proxy API failure |
| `isFull` | `boolean` | When true, hide the widget entirely (capacity reached) |

**Emits**

| Event | Payload | Description |
|---|---|---|
| `signup-proxy` | `playerId: string` | User selected a registered player; parent fires API call |
| `signup-guest` | `firstName: string, lastName: string, position: string \| null` | User submitted guest form; parent fires API call |

**Internal state**

| Ref | Type | Purpose |
|---|---|---|
| `mode` | `'dropdown' \| 'guest'` | Controls v-if branch: dropdown mode or guest form mode |
| `allPlayers` | `PlayerPublic[]` | Full catalogue fetched once on mount from `GET /api/v1/players?status=ACTIVE&playerType=REGISTERED` |
| `fetchLoading` | `boolean` | True while player catalogue is loading on mount |
| `fetchError` | `string \| null` | Error if player catalogue fetch fails |
| `guestFirst` | `string` | Guest first name (required) |
| `guestLast` | `string` | Guest last name (required) |
| `guestPosition` | `string` | Guest position (optional; empty = null on submit) |
| `guestError` | `string \| null` | Validation error shown before emit |

**Computed**

| Computed | Derivation |
|---|---|
| `dropdownOptions` | `allPlayers.filter(p => !confirmedPlayerIds.includes(p.id))` mapped to `DropdownOption[]` |

**Visibility rule** (enforced in `signup.vue`):

```
show SignupAddPlayer when:
  game.status === 'SCHEDULED'
  AND currentPlayerStatus === 'signed_up'
  AND user.role === 'PLAYER' (or dual-role)
  AND !isFull
```

### Modified Component: `SignupRegistrationRow.vue`

Remove all guest-form and proxy-search logic. Retain:
- Props: `currentPlayerStatus`, `isFull`
- Emits: `signup-self`, `cancel-self`, `dismiss`
- Template: self-signup block (`not_signed_up`), cancel-self block (`signed_up`), full-capacity message

Props removed: `confirmedPlayerIds` (no longer needed)
Emits removed: `signup-guest`, `signup-proxy`
Imports removed: `SignupProxySearch`, all guest-form refs

### Modified Page: `signup.vue`

**Outer container**: remove `class="max-w-2xl mx-auto"` — replace with `class="w-full"` (or no wrapper class — let Tailwind's default width apply).

**New state** (for proxy loading isolation):
```ts
const proxyLoading = ref(false)
const proxyError = ref<string | null>(null)
```

**Updated `handleSignupProxy`**:
```ts
async function handleSignupProxy(targetPlayerId: string) {
  proxyLoading.value = true
  proxyError.value = null
  try {
    await signupProxy(targetPlayerId)
  } catch (e: any) {
    proxyError.value = e?.data?.message ?? e?.message ?? 'Error al agregar jugador'
  } finally {
    proxyLoading.value = false
  }
}
```

**New import**: `SignupAddPlayer`

**Right panel order** (below the 12-col grid):
1. `SignupRegistrationRow` (game SCHEDULED only, PLAYER role only)
2. `SignupAddPlayer` (game SCHEDULED + signed_up PLAYER + !isFull)
3. `SignupPlayerTable`

### Deleted Component: `SignupProxySearch.vue`

Delete after confirming zero imports in codebase.
