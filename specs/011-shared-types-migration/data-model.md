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
    createdAt: string; // ISO 8601 string (serialized from Date)
  };
  player: {
    id: string;
    firstName: string;
    lastName: string;
    nickname: string | null;
    position: Position | null;
    jerseyNumber: number | null;
    dateOfBirth: string | null; // ISO 8601 string (serialized from Date)
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
      date: string; // ISO 8601 string
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

### `UpdatePlayerProfilePayload`

Represents the validated input a player may submit to `PATCH /api/v1/profile/player`.

```ts
export interface UpdatePlayerProfilePayload {
  firstName?: string;
  lastName?: string;
  nickname?: string;
  position?: Position | null; // Uses shared Position enum (not raw string)
  jerseyNumber?: number | null;
  dateOfBirth?: string | null;
  address?: string | null;
  phone?: string | null;
  whatsapp?: string | null;
  emergencyContact?: string | null;
  status?: PlayerStatus;
}
```

**Note on `position`**: Changed from `string` to `Position | null` to align with the shared `Position` enum already in `shared/src/types/player.ts`. The Zod schema in the CMS route validates against `z.enum(Position)` — this is now consistent. No additional import needed in shared since `Position` is already in the same package.

**Replaces**: Inline anonymous `data` parameter type in `ProfileService.updateProfile` and `Record<string, unknown>` in `useProfile.ts`

**Used by**:

- `ProfileService.updateProfile(userId, data: UpdatePlayerProfilePayload)`
- `useProfile.ts`'s `updateProfile(data: UpdatePlayerProfilePayload)` composable function
- CMS route validation in `routes/profile.ts` (indirect — Zod schema shape must remain compatible)

---

## Enum imports replacing raw string literals in ProfileService.ts

| Current raw literal | Replacement             | Enum source           |
| ------------------- | ----------------------- | --------------------- |
| `"GUEST"`           | `PlayerType.GUEST`      | `@ministrosfc/shared` |
| `"ACTIVE"`          | `PlayerStatus.ACTIVE`   | `@ministrosfc/shared` |
| `"INACTIVE"`        | `PlayerStatus.INACTIVE` | `@ministrosfc/shared` |
| `"REGISTERED"`      | `PlayerType.REGISTERED` | `@ministrosfc/shared` |

Locations in `ProfileService.ts`:

- Line 57: `playerType: "GUEST"` → `PlayerType.GUEST`
- Line 150: `status: "ACTIVE"` → `PlayerStatus.ACTIVE`
- Line 151: `playerType: "REGISTERED"` → `PlayerType.REGISTERED`
- Line 131 (data type): `"ACTIVE" | "INACTIVE"` → `PlayerStatus` (resolved by `UpdatePlayerProfilePayload`)
- Line 262: `status: "ACTIVE"` → `PlayerStatus.ACTIVE`
- Line 263: `playerType: "REGISTERED"` → `PlayerType.REGISTERED`

Additional locations in `packages/frontend/src/components/profile/`:

**ProfileEditForm.vue** (raw literals in reactive defaults and `isActive` computed):

- `status: props.profile.status ?? "ACTIVE"` (×2) → `PlayerStatus.ACTIVE`
- `form.status === "ACTIVE"` → `form.status === PlayerStatus.ACTIVE`
- `val ? "ACTIVE" : "INACTIVE"` → `val ? PlayerStatus.ACTIVE : PlayerStatus.INACTIVE`

**ProfileHeader.vue** (raw literals in `roleBadgeClass` and `statusBadgeClass`):

- Object keys `"ADMIN"`, `"EDITOR"`, `"DT"`, `"PLAYER"` → `UserRole.ADMIN`, etc.
- `props.status === "ACTIVE"` → `props.status === PlayerStatus.ACTIVE`

---

## Type Dependency Graph (after migration)

```
@ministrosfc/shared
  └── types/api.ts
        ├── PlayerProfileResponse  (imports PlayerStatus, PlayerType, Position, UserRole)
        └── UpdatePlayerProfilePayload  (imports PlayerStatus, Position)

packages/cms
  └── services/ProfileService.ts
        ├── import { PlayerStatus, PlayerType } from "@ministrosfc/shared"
        └── import { PlayerProfileResponse, UpdatePlayerProfilePayload } from "@ministrosfc/shared"

packages/frontend
  ├── composables/useProfile.ts
  │     └── import { PlayerProfileResponse, UpdatePlayerProfilePayload } from "@ministrosfc/shared"
  └── components/profile/
        ├── ProfileEditForm.vue → import { PlayerStatus, Position } from "@ministrosfc/shared"
        ├── ProfileHeader.vue   → import { UserRole, PlayerStatus } from "@ministrosfc/shared"
        └── InvitedGuestsList.vue → import { formatDate } from "~/utils/formatDate" (new utility)
```
