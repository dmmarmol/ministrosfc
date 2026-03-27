# API Contract: Player Delete & Status Toggle (Feature 006)

**Version**: 1.0  
**Date**: 2026-03-25  
**Feature Branch**: `feature/admin-player-delete`  
**Base Path**: `/api/v1/players`

This contract documents the **new** `DELETE /api/v1/players/:id` endpoint and the **corrected** access control for `PATCH /api/v1/players/:id/status`.

---

## DELETE /api/v1/players/:id

Permanently removes a player record and all directly-owned child data. Game participation rows linked to the player are preserved but have their `playerId` nullified.

**Authentication**: Required (`Bearer` token)  
**Authorization**: `ADMIN` role only

### Path Parameters

| Parameter | Type        | Required | Description                                   |
| --------- | ----------- | -------- | --------------------------------------------- |
| `id`      | UUID string | Yes      | The unique identifier of the player to delete |

### Request

```
DELETE /api/v1/players/3f2504e0-4f89-11d3-9a0c-0305e82c3301
Authorization: Bearer <access_token>
```

No request body.

### Response — Success (204 No Content)

```
HTTP/1.1 204 No Content
```

No response body. The player has been permanently deleted.

### Response — 401 Unauthorized

Caller is not authenticated.

```json
{
  "code": "UNAUTHORIZED",
  "message": "Authentication required",
  "statusCode": 401
}
```

### Response — 403 Forbidden

Caller is authenticated but does not have the ADMIN role.

```json
{
  "code": "FORBIDDEN",
  "message": "Insufficient permissions",
  "statusCode": 403
}
```

### Response — 404 Not Found

No player exists with the given `id`.

```json
{
  "code": "PLAYER_NOT_FOUND",
  "message": "Player not found",
  "statusCode": 404
}
```

### Response — 400 Bad Request

`id` parameter is not a valid UUID.

```json
{
  "code": "VALIDATION_ERROR",
  "message": "Invalid UUID format",
  "statusCode": 400
}
```

### Side Effects

| Effect               | Description                                                      |
| -------------------- | ---------------------------------------------------------------- |
| Player record        | Permanently deleted from `Player` table                          |
| Contact record       | Cascade-deleted from `Contact` table                             |
| Statistics records   | Cascade-deleted from `Statistics` table                          |
| GameParticipant rows | `playerId` set to `null`; rows are **preserved**                 |
| Photo (Cloudinary)   | Best-effort deletion; does not affect response status            |
| Redis cache          | All `cache:stats:players:list:*` keys invalidated                |
| User record          | If linked, `User.playerId` set to `null`; user account preserved |

### Race Condition (concurrent deletes)

If two Admins attempt to delete the same player simultaneously, the second request returns `404 Not Found` — the player is already gone.

---

## PATCH /api/v1/players/:id/status (updated authorization)

Toggles a player's status between `ACTIVE` and `INACTIVE`. This is a **reversible** soft-disable operation.

**Authentication**: Required (`Bearer` token)  
**Authorization**: `EDITOR` role or higher (i.e., both `EDITOR` and `ADMIN`)

> **Change from previous version**: Previously restricted to `ADMIN` only. Now accessible to `EDITOR` as required by FR-009.

### Path Parameters

| Parameter | Type        | Required | Description                         |
| --------- | ----------- | -------- | ----------------------------------- |
| `id`      | UUID string | Yes      | The unique identifier of the player |

### Request Body

```json
{
  "status": "INACTIVE"
}
```

| Field    | Type   | Required | Allowed Values           |
| -------- | ------ | -------- | ------------------------ |
| `status` | string | Yes      | `"ACTIVE"`, `"INACTIVE"` |

### Response — Success (200 OK)

```json
{
  "data": {
    "id": "3f2504e0-4f89-11d3-9a0c-0305e82c3301",
    "name": "Diego Martín",
    "nickname": "El Mago",
    "status": "INACTIVE",
    "position": "CMF",
    "jerseyNumber": 10,
    "playerType": "REGISTERED",
    "photoUrl": "https://res.cloudinary.com/example/image/upload/player.jpg",
    "createdAt": "2025-01-15T10:30:00.000Z",
    "updatedAt": "2026-03-25T12:00:00.000Z"
  }
}
```

### Response — 401 / 403 / 404

Same structure as the DELETE endpoint above.

---

## Role Matrix Summary

| Operation             | PLAYER    | EDITOR    | ADMIN     |
| --------------------- | --------- | --------- | --------- |
| GET player(s)         | ✅ public | ✅ public | ✅ public |
| POST (create player)  | ❌ 403    | ❌ 403    | ✅        |
| PATCH (update player) | ❌ 403    | ❌ 403    | ✅        |
| PATCH status (toggle) | ❌ 403    | ✅        | ✅        |
| DELETE (permanent)    | ❌ 403    | ❌ 403    | ✅        |

---

## Frontend Visibility Contract

| UI Element                     | PLAYER | EDITOR       | ADMIN                       |
| ------------------------------ | ------ | ------------ | --------------------------- |
| Activate / Deactivate button   | Hidden | ✅ Visible   | ✅ Visible                  |
| Delete button                  | Hidden | Hidden       | ✅ Visible                  |
| Confirmation modal (delete)    | N/A    | N/A          | Shown before DELETE request |
| Confirmation required (status) | N/A    | Not required | Not required                |
