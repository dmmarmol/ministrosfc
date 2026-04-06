# Data Model: 011 — Shared Types Migration

No database schema changes. This feature is a purely type-level refactor.

---

## New Types in `packages/shared/src/types/api.ts`

### `PlayerProfileResponse`

Represents the full player profile API response returned by `GET /api/v1/profile/player` and `PATCH /api/v1/profile/player`.

```ts
import { PlayerStatus, PlayerType, Position, UserRole } from "./player"; // re-exported via shared index

export interface PlayerProfileResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    hasPassword: boolean;
    hasGoogle: boolean;
    createdAt: string;  // ISO 8601 string (serialized from Date)
  };
  player: {
    id: string;
    firstName: string;
    lastName: string;
    nickname: string | null;
    position: Position | null;
    jerseyNumber: number | null;
    dateOfBirth: string | null;  // ISO 8601 string (serialized from Date)
    address: string | null;
    photoUrl: string | null;
    status: PlayerStatus;
    playerType: PlayerType;
  };
  contact: {
    phone: string | null;
    whatsapp: string | null;
    emergencyContact: string | null;
  };
  invitedGuests: Array<{
    id: string;
    firstName: string;
    lastName: string;
    game: {
      id: string;
      date: string;  // ISO 8601 string
      opponent: string | null;
    } | null;
  }>;
}
```

**Replaces**: `ProfileData` in `packages/frontend/src/composables/useProfile.ts`

**Used by**:
- `ProfileService.getProfile(userId): Promise<PlayerProfileResponse>` — return type annotation
- `useProfile.ts` — `profile` ref type, `$fetch` response type
- Any future frontend component that imports profile data from the composable

---

### `UpdatePlayerProfileInput`

Represents the validated input a player may submit to `PATCH /api/v1/profile/player`.

```ts
export interface UpdatePlayerProfileInput {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  position?: string;       // Accepts position code string; validated by Zod in the route
  jerseyNumber?: number | null;
  dateOfBirth?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  emergencyContact?: string | null;
  status?: PlayerStatus;
}
```

**Note on `position`**: The Zod schema validates `position` against `z.nativeEnum(Position)` (Prisma enum imported in the route). The shared type uses `string` for `position` to avoid a `@prisma/client` dependency in `@ministrosfc/shared`. A follow-up improvement would be to align `Position` enum usage with the shared `Position` enum already defined in `shared/src/types/player.ts`.

**Replaces**: Inline anonymous `data` parameter type in `ProfileService.updateProfile`

**Used by**:
- `ProfileService.updateProfile(userId, data: UpdatePlayerProfileInput)`
- CMS route validation in `routes/profile.ts` (indirect — Zod schema shape must remain compatible)

---

## Enum imports replacing raw string literals in ProfileService.ts

| Current raw literal | Replacement | Enum source |
|---|---|---|
| `"GUEST"` | `PlayerType.GUEST` | `@ministrosfc/shared` |
| `"ACTIVE"` | `PlayerStatus.ACTIVE` | `@ministrosfc/shared` |
| `"INACTIVE"` | `PlayerStatus.INACTIVE` | `@ministrosfc/shared` |
| `"REGISTERED"` | `PlayerType.REGISTERED` | `@ministrosfc/shared` |

Locations in `ProfileService.ts`:
- Line 57: `playerType: "GUEST"` → `PlayerType.GUEST`  
- Line 150: `status: "ACTIVE"` → `PlayerStatus.ACTIVE`
- Line 151: `playerType: "REGISTERED"` → `PlayerType.REGISTERED`
- Line 131 (data type): `"ACTIVE" | "INACTIVE"` → `PlayerStatus` (resolved by `UpdatePlayerProfileInput`)
- Line 262: `status: "ACTIVE"` → `PlayerStatus.ACTIVE`
- Line 263: `playerType: "REGISTERED"` → `PlayerType.REGISTERED`

---

## Type Dependency Graph (after migration)

```
@ministrosfc/shared
  └── types/api.ts
        ├── PlayerProfileResponse  (imports PlayerStatus, PlayerType, Position, UserRole from player.ts / user.ts)
        └── UpdatePlayerProfileInput  (imports PlayerStatus)

packages/cms
  └── services/ProfileService.ts
        ├── import { PlayerStatus, PlayerType } from "@ministrosfc/shared"
        └── import { PlayerProfileResponse, UpdatePlayerProfileInput } from "@ministrosfc/shared"

packages/frontend
  └── composables/useProfile.ts
        └── import { PlayerProfileResponse } from "@ministrosfc/shared"
```
