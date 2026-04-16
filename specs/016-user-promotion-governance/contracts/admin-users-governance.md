# Contract: Admin Users Governance

## Scope

Contract for admin user directory listing, profile edits, role governance, and player lifecycle actions under `/api/v1/admin/users`.

## Authentication and authorization

- All endpoints require `Authorization: Bearer <accessToken>`.
- Access matrix:
  - `GET /` and `PATCH /:id`: Editor+
  - `PATCH /:id/role`: Editor+ with policy constraints
  - `PATCH /:id/player-status`: Editor+
  - `DELETE /:id/player`: Admin only

## Shared response envelope

```json
{
  "data": {},
  "meta": {}
}
```

Error envelope:

```json
{
  "code": "FORBIDDEN",
  "message": "Insufficient permissions",
  "statusCode": 403
}
```

## Endpoint 1: List users

- Method: `GET /api/v1/admin/users`
- Query:
  - `page?: number` (default 1)
  - `limit?: number` (default 20, max 500)
  - `role?: ADMIN|EDITOR|DT|PLAYER`
  - `search?: string` (email/firstName/lastName)
- Success `200`:

```json
{
  "data": [
    {
      "id": "uuid",
      "email": "user@club.test",
      "firstName": "Diego",
      "lastName": "Martin",
      "role": "EDITOR",
      "createdAt": "2026-04-13T10:00:00.000Z",
      "lastLoginAt": "2026-04-13T11:00:00.000Z",
      "player": {
        "id": "uuid",
        "status": "ACTIVE",
        "jerseyNumber": 10,
        "photoUrl": null
      }
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1
  }
}
```

## Endpoint 2: Update user profile

- Method: `PATCH /api/v1/admin/users/:id`
- Request:

```json
{
  "firstName": "Diego",
  "lastName": "Martin",
  "email": "diego@club.test",
  "expectedUpdatedAt": "2026-04-13T10:00:00.000Z"
}
```

- Success `200`: updated user list item shape.
- Validation failures:
  - `400 VALIDATION_ERROR` for invalid email or missing fields.
  - `409 CONFLICT` for duplicate email.
  - `409 CONFLICT` for stale `expectedUpdatedAt`.

## Endpoint 3: Change role

- Method: `PATCH /api/v1/admin/users/:id/role`
- Request:

```json
{
  "role": "DT",
  "expectedUpdatedAt": "2026-04-13T10:00:00.000Z"
}
```

- Success `200`:

```json
{
  "data": {
    "id": "uuid",
    "role": "DT"
  }
}
```

- Authorization rules:
  - Admin can assign any role to other users (including promoting to ADMIN and demoting from ADMIN).
  - Admin CANNOT change their own role (self-demotion prevention).
  - Editor can assign only `PLAYER` or `DT` and cannot perform demotions.
  - DT/Player cannot change roles.
- Error cases:
  - `403 FORBIDDEN` unauthorized matrix transition.
  - `403 FORBIDDEN` with message "Cannot demote yourself" when admin attempts to change their own role.
  - `404 NOT_FOUND` unknown target user.
  - `409 CONFLICT` stale update precondition.

## Endpoint 4: Change linked player status

- Method: `PATCH /api/v1/admin/users/:id/player-status`
- Request:

```json
{
  "status": "INACTIVE"
}
```

- Success `200`: returns user item plus updated `player.status`.
- Error cases:
  - `404 NOT_FOUND` when user has no linked player.
  - `403 FORBIDDEN` insufficient role.

## Endpoint 5: Delete linked player user

- Method: `DELETE /api/v1/admin/users/:id/player`
- Success `204 No Content`.
- Semantics:
  - Admin-only.
  - Deletes both linked `User` and `Player` in one transaction.
  - Must preserve DB integrity (no orphan relation breaks).
- Error cases:
  - `404 NOT_FOUND` if linked player does not exist.
  - `403 FORBIDDEN` for non-admin actor.

## Frontend interaction contract

- All role/status/delete actions must pass through confirmation modal before API call.
- Edit entry point is the full-name interaction (clicking name opens inline edit or edit row state).
- UI must show operation result feedback (success toast/banner or inline error) per mutation.

---

## Implementation Notes (T032, 2026-04-15)

### Error response shape (all endpoints)

```json
{
  "code": "CONFLICT",
  "message": "Email already in use",
  "statusCode": 409
}
```

- `code` is one of: `CONFLICT`, `FORBIDDEN`, `NOT_FOUND`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `INTERNAL_ERROR`
- `message` is human-readable; for `CONFLICT` on duplicate email it is exactly `"Email already in use"`
- Stale-write conflicts use the same `409 CONFLICT` code with a distinct message referencing `expectedUpdatedAt`

### Idempotent role change

Sending the same role that is already set returns `200 OK` with the current user state and performs **no database write**.

### Self-demotion prevention — dual layer

1. **Backend**: Route returns `403 FORBIDDEN` with `"Cannot demote yourself"` when `req.user.id === userId`.
2. **Frontend**: Role `<select>` is rendered with `:disabled="user.id === authStore.user?.id"` and `title="No podés cambiar tu propio rol"`. Any attempt is blocked at the UI level before the confirmation modal is shown.

### Transactional player delete

`DELETE /:id/player` uses a single Prisma transaction to:

1. Clear `user.playerId` (set to `null`)
2. Delete the `Player` record

After the call, neither `Player` nor the `user.playerId` foreign key reference remain.

### Confirmation modal pattern

All sensitive frontend actions use `ConfirmationModal` with these text keys:

- Role change: _"Cambiar rol"_ / action description with old → new role names
- Status toggle (deactivate): _"Desactivar jugador"_ / _"impedir que participe en nuevos partidos"_
- Status toggle (reactivate): _"Activar jugador"_
- Delete player: _"Eliminar usuario y jugador"_ / _"no se puede deshacer"_
