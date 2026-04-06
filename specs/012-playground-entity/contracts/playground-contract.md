# API Contract: Playground Resource

**Base path**: `/api/v1/playgrounds`  
**Auth**: Bearer JWT (same mechanism as all existing routes)

---

## GET /api/v1/playgrounds

List all playgrounds, sorted alphabetically by name.

**Auth**: None required (public)

**Response 200**:
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Cancha Municipal Norte",
      "address": "Av. Corrientes 1234, Buenos Aires",
      "createdAt": "2026-04-06T00:00:00.000Z",
      "updatedAt": "2026-04-06T00:00:00.000Z"
    }
  ]
}
```

---

## GET /api/v1/playgrounds/:id

Get a single playground by ID.

**Auth**: None required (public)

**Response 200**:
```json
{
  "data": {
    "id": "uuid",
    "name": "Cancha Municipal Norte",
    "address": "Av. Corrientes 1234, Buenos Aires",
    "createdAt": "2026-04-06T00:00:00.000Z",
    "updatedAt": "2026-04-06T00:00:00.000Z"
  }
}
```

**Response 404**:
```json
{ "code": "NOT_FOUND", "message": "Playground not found", "statusCode": 404 }
```

---

## POST /api/v1/playgrounds

Create a new playground.

**Auth**: EDITOR or ADMIN role required

**Request body**:
```json
{
  "name": "Cancha Municipal Norte",
  "address": "Av. Corrientes 1234, Buenos Aires"
}
```

| Field     | Type   | Required | Constraints           |
|-----------|--------|----------|-----------------------|
| `name`    | string | Yes      | 1–255 chars, trimmed  |
| `address` | string | No       | max 500 chars, trimmed|

**Response 201**:
```json
{
  "data": {
    "id": "uuid",
    "name": "Cancha Municipal Norte",
    "address": "Av. Corrientes 1234, Buenos Aires",
    "createdAt": "2026-04-06T00:00:00.000Z",
    "updatedAt": "2026-04-06T00:00:00.000Z"
  }
}
```

**Response 422** (validation error):
```json
{ "code": "VALIDATION_ERROR", "message": "...", "statusCode": 422 }
```

---

## PATCH /api/v1/playgrounds/:id

Update a playground (partial update — only provided fields are changed).

**Auth**: EDITOR or ADMIN role required

**Request body** (all fields optional):
```json
{
  "name": "Nuevo nombre",
  "address": "Nueva dirección"
}
```

**Response 200**: same shape as GET single

**Response 404**: same shape as GET single 404

---

## DELETE /api/v1/playgrounds/:id

Delete a playground. Fails if the playground is referenced by any game.

**Auth**: ADMIN role required

**Response 204**: No content

**Response 404**:
```json
{ "code": "NOT_FOUND", "message": "Playground not found", "statusCode": 404 }
```

**Response 409** (in use):
```json
{
  "code": "PLAYGROUND_IN_USE",
  "message": "No se puede eliminar: la cancha está asociada a uno o más partidos",
  "statusCode": 409
}
```

---

## Game Resource — Playground Integration

The existing `/api/v1/games` endpoints are extended:

### POST /api/v1/games — new optional field

```json
{
  "playgroundId": "uuid-or-null"
}
```

### PATCH /api/v1/games/:id — new optional field

```json
{
  "playgroundId": "uuid-or-null"
}
```

Setting `playgroundId: null` clears the playground link.

### GET /api/v1/games — expanded game response

When a game has a linked playground, the response includes an expanded `playground` object:

```json
{
  "data": {
    "id": "game-uuid",
    "location": "legacy text or null",
    "playgroundId": "uuid-or-null",
    "playground": {
      "id": "uuid",
      "name": "Cancha Municipal Norte",
      "address": "..."
    }
  }
}
```

If `playgroundId` is null, `playground` is `null`.
