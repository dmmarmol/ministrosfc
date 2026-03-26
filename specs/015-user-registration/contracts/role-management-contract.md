# Contract: Role Management (Admin)

**Spec**: [spec.md](../spec.md) | **FRs**: FR-018, FR-019, FR-020, FR-021, FR-022, FR-023

---

## GET /api/v1/admin/users

**Purpose**: List all users with their roles and linked player status. Admin user management page.

**Auth**: Bearer JWT, requires ADMIN role

### Request (query params)

```
?role=PLAYER&search=juan&page=1&limit=20
```

- `role`: optional filter by role (ADMIN, EDITOR, DT, PLAYER)
- `search`: optional search by email, firstName, or lastName (case-insensitive contains)
- `page`: 1-indexed, default 1
- `limit`: 1–500, default 20

### Response — 200 OK

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "jugador@ejemplo.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "PLAYER",
      "createdAt": "2026-03-25T10:00:00.000Z",
      "lastLoginAt": "2026-03-25T14:00:00.000Z",
      "player": {
        "id": "uuid",
        "status": "ACTIVE",
        "jerseyNumber": 10,
        "photoUrl": "https://..."
      }
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### Error Responses

| Status | Code           | Condition         |
| ------ | -------------- | ----------------- |
| 401    | `UNAUTHORIZED` | No or invalid JWT |
| 403    | `FORBIDDEN`    | Non-ADMIN user    |

---

## PATCH /api/v1/admin/users/:id/role

**Purpose**: Promote or demote a user's role.

**Auth**: Bearer JWT, requires ADMIN role

### Request

```json
{
  "role": "DT"
}
```

**Validation:**

- `role`: must be a valid Role enum value (ADMIN, EDITOR, DT, PLAYER)
- Cannot change role of another ADMIN (FR-019)
- Cannot change own role
- Target user must exist

**Promotion/demotion rules (FR-018, FR-019):**

| Current Role | Allowed New Roles                    |
| ------------ | ------------------------------------ |
| PLAYER       | DT, EDITOR, ADMIN                    |
| DT           | PLAYER, EDITOR, ADMIN                |
| EDITOR       | PLAYER, DT, ADMIN                    |
| ADMIN        | ❌ Cannot be changed by other ADMINs |

### Response — 200 OK

```json
{
  "data": {
    "id": "uuid",
    "email": "jugador@ejemplo.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "DT"
  }
}
```

### Error Responses

| Status | Code               | Condition                                |
| ------ | ------------------ | ---------------------------------------- |
| 400    | `VALIDATION_ERROR` | Invalid role value, same role as current |
| 401    | `UNAUTHORIZED`     | No or invalid JWT                        |
| 403    | `FORBIDDEN`        | Non-ADMIN user, or target is ADMIN       |
| 404    | `NOT_FOUND`        | User not found                           |

### Side Effects

1. Updates `User.role`
2. No impact on Player.status (role change ≠ deactivation)

---

## PATCH /api/v1/admin/users/:id/player-status

**Purpose**: Deactivate or reactivate a user's linked player (FR-020).

**Auth**: Bearer JWT, requires EDITOR or ADMIN role

### Request

```json
{
  "status": "INACTIVE"
}
```

**Validation:**

- `status`: must be `ACTIVE` or `INACTIVE`
- Target user must have a linked Player record

### Response — 200 OK

```json
{
  "data": {
    "id": "uuid",
    "email": "jugador@ejemplo.com",
    "firstName": "Juan",
    "lastName": "Pérez",
    "role": "PLAYER",
    "player": {
      "id": "uuid",
      "status": "INACTIVE"
    }
  }
}
```

### Error Responses

| Status | Code               | Condition                          |
| ------ | ------------------ | ---------------------------------- |
| 400    | `VALIDATION_ERROR` | Invalid status value               |
| 401    | `UNAUTHORIZED`     | No or invalid JWT                  |
| 403    | `FORBIDDEN`        | User lacks EDITOR+ role            |
| 404    | `NOT_FOUND`        | User not found or no linked Player |

### Side Effects

1. Updates `Player.status`
2. Invalidates player search cache in Redis
3. INACTIVE players are excluded from game participation and roster selection (existing behavior)
4. INACTIVE players can still log in and edit their profile (FR-016)

---

## DELETE /api/v1/admin/users/:id/player

**Purpose**: Hard-delete a user's linked Player record (FR-021).

**Auth**: Bearer JWT, requires ADMIN role only

### Response — 204 No Content

### Error Responses

| Status | Code           | Condition                          |
| ------ | -------------- | ---------------------------------- |
| 401    | `UNAUTHORIZED` | No or invalid JWT                  |
| 403    | `FORBIDDEN`    | Non-ADMIN user                     |
| 404    | `NOT_FOUND`    | User not found or no linked Player |

### Side Effects

1. Hard-deletes Player record (cascades to Contact)
2. Sets `GameParticipant.playerId` to null (existing SetNull behavior)
3. Sets `User.playerId` to null
4. Invalidates player search cache in Redis

---

## Notes

- All role management is from the admin UI (`/admin/users`), NOT from the user's own profile (FR-022)
- The existing player endpoints (`/api/v1/players`) continue to work for player CRUD by admins
- The new admin endpoints (`/api/v1/admin/users`) operate on User entities with their linked Players
- DT role permissions for game tactics (FR-024, FR-025) are covered by updates to existing game routes, not new admin endpoints
