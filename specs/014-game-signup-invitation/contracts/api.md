# API Contracts: Game Signup Invitation (014)

**Base URL**: `/api/v1`  
**Auth**: JWT Bearer token via `Authorization: Bearer <token>` header  
**Date**: 2026-04-09

---

## New Endpoints

---

### GET `/games/slug/:slug`

Resolve a game slug to its UUID and redirect. Used by the frontend for the 301 redirect logic when an old UUID URL is accessed.

**Auth**: None (public)

**Path params**:

- `slug` — URL slug (e.g. `2026-04-09-atletico`)

**Response `200`**:

```json
{
  "data": {
    "id": "uuid-here",
    "slug": "2026-04-09-atletico"
  }
}
```

**Response `404`**: Game with that slug not found.

---

### GET `/games/:gameId/signup-page`

Returns full Game Sign Up Page data: game details, roster, auth context.

**Auth**: Required (any authenticated user)  
**Role gate**: None — read-only for all authenticated users; `currentPlayerStatus` informs the frontend what actions are available.

**Path params**:

- `gameId` — UUID

**Response `200`** — `GameSignupPageDTO`:

```json
{
  "data": {
    "game": {
      "id": "uuid",
      "slug": "2026-04-09-atletico",
      "date": "2026-04-09T18:00:00-03:00",
      "status": "SCHEDULED",
      "maxPlayers": 18,
      "lineup": "4-3-3",
      "opponentTeam": { "id": "uuid", "name": "Atlético", "logoUrl": null },
      "playground": { "id": "uuid", "name": "Cancha Norte" }
    },
    "roster": [
      {
        "participantId": "uuid",
        "player": {
          "id": "uuid",
          "firstName": "Diego",
          "lastName": "Martín",
          "nickname": null,
          "jerseyNumber": 10,
          "position": "CMF",
          "playerType": "REGISTERED",
          "invitedById": null,
          "invitedByName": null
        },
        "confirmationStatus": "CONFIRMED",
        "confirmedById": null,
        "confirmedByName": null,
        "confirmedAt": "2026-04-09T12:00:00Z"
      }
    ],
    "confirmedCount": 1,
    "maxPlayers": 18,
    "isFull": false,
    "currentPlayerStatus": "not_signed_up",
    "currentPlayerId": "uuid"
  }
}
```

**Note on guest privacy**: The `lastName` field for `playerType: GUEST` roster entries is included in this response because it is the authenticated view (read-only admins and the inviting player both see full names). The public game detail page endpoint (`GET /games/:id`) is a separate endpoint that MUST omit guest `lastName`.

**Response `401`**: Not authenticated.

---

### POST `/games/:gameId/participants/signup`

Trimodal per-item signup endpoint. One call per attendee registration.

**Auth**: Required  
**Role gate**: `PLAYER` role (or PLAYER + admin dual role per Assumption)

**Path params**:

- `gameId` — UUID

**Request body** — `SignupRequestDTO` (tagged union):

**Mode: `self`**

```json
{ "mode": "self" }
```

**Mode: `guest`**

```json
{
  "mode": "guest",
  "firstName": "Marcos",
  "lastName": "López"
}
```

**Mode: `proxy`**

```json
{
  "mode": "proxy",
  "targetPlayerId": "uuid-of-target-player"
}
```

**Response `201`** — newly created `RosterEntry` + updated counts:

```json
{
  "data": {
    "entry": {
      "participantId": "uuid",
      "player": { "...": "..." },
      "confirmationStatus": "CONFIRMED",
      "confirmedById": "uuid",
      "confirmedByName": "Diego Martín",
      "confirmedAt": "2026-04-09T15:30:00Z"
    },
    "confirmedCount": 5,
    "isFull": false
  }
}
```

**Response `422`** — game not SCHEDULED:

```json
{
  "error": "El juego ya no está disponible para inscripciones",
  "code": "GAME_NOT_SCHEDULED"
}
```

**Response `422`** — capacity exceeded:

```json
{
  "error": "El cupo está completo",
  "code": "GAME_CAPACITY_EXCEEDED"
}
```

**Response `409`** — duplicate signup (self or proxy race condition):

```json
{
  "error": "Este jugador ya fue registrado. Refresca el navegador para visualizar los cambios",
  "code": "SIGNUP_DUPLICATE"
}
```

**Response `403`** — user has no linked player record or has non-PLAYER role:

```json
{
  "error": "Solo los jugadores registrados pueden inscribirse",
  "code": "FORBIDDEN"
}
```

---

### DELETE `/games/:gameId/participants/:participantId`

Remove a participant from a game (Admin/Editor only).

**Auth**: Required  
**Role gate**: `EDITOR` minimum (Admin or Editor; DT cannot remove)

**Path params**:

- `gameId` — UUID
- `participantId` — UUID of the `GameParticipant` record

**Response `200`**:

```json
{
  "data": {
    "participantId": "uuid",
    "confirmedCount": 4
  }
}
```

**Response `403`**: DT or PLAYER attempting removal.  
**Response `404`**: Participant not found in this game.

---

## Modified Endpoints

---

### GET `/games/:id` (existing)

No breaking changes. The response will include 3 new fields when present:

```json
{
  "data": {
    "...existing fields...",
    "maxPlayers": 18,
    "slug": "2026-04-09-atletico",
    "lineup": "4-3-3"
  }
}
```

**Guest privacy**: On this public endpoint, `GameParticipant` entries for `playerType: GUEST` players MUST NOT include the guest's `lastName` or `firstName`. Only attribution label ("Invitado por {Player Name}") is returned.

---

### POST `/games` (existing — create)

Adds 2 optional fields:

```json
{
  "opponentTeamId": "uuid",
  "date": "2026-04-09T18:00:00-03:00",
  "maxPlayers": 18,
  "lineup": "4-3-3"
}
```

`slug` is **not** a user-settable field. It is generated server-side from `date + opponentTeam.name`.

---

### PATCH `/games/:id` (existing — update)

Adds 2 optional fields. `lineup` is added to the DT-allowed field whitelist:

```json
{
  "maxPlayers": 20,
  "lineup": "4-4-2"
}
```

DT can now set `lineup` (previously blocked by `NON_ADMIN_ALLOWED_FIELDS`). `maxPlayers` requires EDITOR+.

---

## US-8 Contract Additions (added 2026-04-10 — FR-031)

---

### GET `/games` — PLAYER-authenticated response shape (FR-031)

When called with a valid JWT whose `role` is `PLAYER`, each game object in the `data` array gains a `currentPlayerStatus` field:

```json
{
  "data": [
    {
      "id": "uuid",
      "slug": "2026-04-15-atletico",
      "date": "2026-04-15T18:00:00-03:00",
      "status": "SCHEDULED",
      "maxPlayers": 18,
      "confirmedCount": 12,
      "opponentTeam": { "id": "uuid", "name": "Atlético", "logoUrl": null },
      "currentPlayerStatus": "available"
    },
    {
      "...": "...",
      "currentPlayerStatus": "signed_up"
    },
    {
      "...": "...",
      "currentPlayerStatus": "full"
    }
  ],
  "meta": { "total": 3, "page": 1, "limit": 20, "totalPages": 1 }
}
```

**`currentPlayerStatus` values**:

| Value         | Condition                                                                                                                                       |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `"available"` | Game is `SCHEDULED`, `confirmedCount < maxPlayers` (or `maxPlayers` is null), and the caller has no `CONFIRMED` `GameParticipant` for this game |
| `"signed_up"` | The caller has a `CONFIRMED` `GameParticipant` record for this game                                                                             |
| `"full"`      | `confirmedCount >= maxPlayers` regardless of whether the caller is signed up                                                                    |

**Non-PLAYER / unauthenticated callers**: `currentPlayerStatus` is omitted (not present in the JSON — the field is absent, not `null`).

**Performance notes**:

- The Redis cache is bypassed for PLAYER-authenticated requests (per-user state cannot be shared across cached responses).
- Non-PLAYER and anonymous requests continue to use the existing 5-minute Redis cache unchanged.
- The `confirmedCount` field in list responses requires `_count: { select: { participants: true } }` in `GameModel.findMany` — this is a pre-existing bug fix bundled into this feature.

**Auth header**: `Authorization: Bearer <token>` (optional — endpoint remains public without it).

---

## Frontend Routes

| Route                   | Page                                        | Auth           |
| ----------------------- | ------------------------------------------- | -------------- |
| `/games/:slug`          | Public game detail page                     | None           |
| `/games/:slug/signup`   | Game Sign Up Page                           | Required (any) |
| `/games/:uuid` (legacy) | Server middleware → 301 → `/games/:slug`    | None           |
| `/admin/games/:id/edit` | Admin game edit (gains maxPlayers + lineup) | EDITOR+        |
