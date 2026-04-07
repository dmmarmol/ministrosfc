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
      "latitude": -34.6037,
      "longitude": -58.3816,
      "createdAt": "2026-04-06T00:00:00.000Z",
      "updatedAt": "2026-04-06T00:00:00.000Z",
      "createdById": "user-uuid",
      "updatedById": null,
      "gameCount": 3
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
    "latitude": -34.6037,
    "longitude": -58.3816,
    "createdAt": "2026-04-06T00:00:00.000Z",
    "updatedAt": "2026-04-06T00:00:00.000Z",
    "createdById": "user-uuid",
    "updatedById": null,
    "gameCount": 3
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

| Field       | Type   | Required | Constraints                                                                                  |
| ----------- | ------ | -------- | -------------------------------------------------------------------------------------------- |
| `name`      | string | Yes      | 1–255 chars, trimmed                                                                         |
| `address`   | string | Yes      | 1–500 chars, trimmed; geocoded via Nominatim unless `latitude`+`longitude` are both provided |
| `latitude`  | number | No       | Valid float; must be paired with `longitude`; skips server-side geocoding when present       |
| `longitude` | number | No       | Valid float; must be paired with `latitude`; skips server-side geocoding when present        |

> **Note on `latitude`/`longitude`**: These optional fields are populated by the `AddressAutocompleteInput` frontend component when a user selects a suggestion. The coordinates come directly from Nominatim's search response and are forwarded to avoid a redundant server-side geocode round-trip. When both are absent, `PlaygroundService` geocodes `address` normally.

**Response 201**:

```json
{
  "data": {
    "id": "uuid",
    "name": "Cancha Municipal Norte",
    "address": "Av. Corrientes 1234, Buenos Aires",
    "latitude": -34.6037,
    "longitude": -58.3816,
    "createdAt": "2026-04-06T00:00:00.000Z",
    "updatedAt": "2026-04-06T00:00:00.000Z",
    "createdById": "user-uuid",
    "updatedById": null,
    "gameCount": 0
  }
}
```

**Response 422** (validation error — field missing or address failed geocoding):

```json
{ "code": "VALIDATION_ERROR", "message": "...", "statusCode": 422 }
```

**Response 422** (address not found by geocoding service):

```json
{
  "code": "ADDRESS_NOT_FOUND",
  "message": "La dirección no pudo ser validada. Verificá el texto e intentá nuevamente.",
  "statusCode": 422
}
```

---

## PATCH /api/v1/playgrounds/:id

Update a playground (partial update — only provided fields are changed).

**Auth**: EDITOR or ADMIN role required

**Request body** (all fields optional):

```json
{
  "name": "Nuevo nombre",
  "address": "Nueva dirección",
  "latitude": -34.6037,
  "longitude": -58.3816
}
```

| Field       | Type   | Required | Constraints                                                                             |
| ----------- | ------ | -------- | --------------------------------------------------------------------------------------- |
| `name`      | string | No       | 1–255 chars, trimmed                                                                    |
| `address`   | string | No       | 1–500 chars, trimmed; geocoded via Nominatim unless `latitude`+`longitude` also present |
| `latitude`  | number | No       | Valid float; only valid when `address` is also in the payload; skips geocoding          |
| `longitude` | number | No       | Valid float; only valid when `address` is also in the payload; skips geocoding          |

**Response 200**: same shape as GET single

**Response 404**: same shape as GET single 404

**Response 422** (address not found by geocoding service):

```json
{
  "code": "ADDRESS_NOT_FOUND",
  "message": "La dirección no pudo ser validada. Verificá el texto e intentá nuevamente.",
  "statusCode": 422
}
```

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
      "address": "...",
      "latitude": -34.6037,
      "longitude": -58.3816
    }
  }
}
```

If `playgroundId` is null, `playground` is `null`.
