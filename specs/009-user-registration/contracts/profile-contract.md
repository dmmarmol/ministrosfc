# Contract: User Profile

**Spec**: [spec.md](../spec.md) | **FRs**: FR-016, FR-026, FR-027, FR-028, FR-029, FR-030

---

## GET /api/v1/profile

**Purpose**: Retrieve the authenticated user's profile (User + Player + Contact + invited guests).

**Auth**: Bearer JWT (any authenticated user)

### Response — 200 OK

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "jugador@ejemplo.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "PLAYER",
      "hasPassword": true,
      "hasGoogle": false,
      "createdAt": "2026-03-25T10:00:00.000Z"
    },
    "player": {
      "id": "uuid",
      "firstName": "Juan",
      "lastName": "Pérez",
      "nickname": "Juanchi",
      "position": "CMF",
      "jerseyNumber": 10,
      "dateOfBirth": "1990-05-15",
      "address": "Av. Corrientes 1234, CABA",
      "photoUrl": "https://res.cloudinary.com/...",
      "status": "ACTIVE",
      "playerType": "REGISTERED"
    },
    "contact": {
      "phone": "+54 11 1234-5678",
      "whatsapp": "+54 11 1234-5678",
      "emergencyContact": "María Pérez - +54 11 8765-4321"
    },
    "invitedGuests": [
      {
        "id": "uuid",
        "firstName": "Carlos",
        "lastName": "Gómez",
        "game": {
          "id": "uuid",
          "date": "2026-03-20T18:00:00.000Z",
          "opponent": "Los Pumas FC"
        }
      }
    ]
  }
}
```

**Notes:**

- `hasPassword` / `hasGoogle` are booleans derived from `passwordHash != null` and `googleSubjectId != null` — the actual values are never exposed
- `invitedGuests` are Player records where `invitedById` = current user's `playerId` AND `playerType=GUEST`

### Error Responses

| Status | Code           | Condition                                                         |
| ------ | -------------- | ----------------------------------------------------------------- |
| 401    | `UNAUTHORIZED` | No or invalid JWT                                                 |
| 404    | `NOT_FOUND`    | User exists but has no linked Player (should not happen post-015) |

---

## PATCH /api/v1/profile

**Purpose**: Update the authenticated user's profile fields.

**Auth**: Bearer JWT (any authenticated user)

### Request

All fields optional — only send what changed:

```json
{
  "firstName": "Juan Carlos",
  "lastName": "Pérez",
  "nickname": "Juanchi",
  "position": "AMF",
  "jerseyNumber": 7,
  "dateOfBirth": "1990-05-15",
  "address": "Av. Corrientes 1234, CABA",
  "phone": "+54 11 1234-5678",
  "whatsapp": "+54 11 1234-5678",
  "emergencyContact": "María Pérez"
}
```

**Validation:**

- `firstName`: 1–255 chars (updates both User and Player)
- `lastName`: 1–255 chars (updates both User and Player)
- `nickname`: 0–100 chars
- `position`: valid Position enum value
- `jerseyNumber`: integer, unique among ACTIVE REGISTERED players (excluding self)
- `dateOfBirth`: ISO date string or null
- `address`: 0–500 chars
- `phone`, `whatsapp`, `emergencyContact`: 0–255 chars each

### Response — 200 OK

Returns the full updated profile (same shape as GET /api/v1/profile).

### Error Responses

| Status | Code                      | Condition                                               |
| ------ | ------------------------- | ------------------------------------------------------- |
| 400    | `VALIDATION_ERROR`        | Invalid field values                                    |
| 401    | `UNAUTHORIZED`            | No or invalid JWT                                       |
| 409    | `DUPLICATE_JERSEY_NUMBER` | Jersey number taken by another ACTIVE REGISTERED player |

### Side Effects

1. Updates User.firstName/lastName (if changed)
2. Updates Player fields (position, jerseyNumber, nickname, dateOfBirth, address)
3. Updates or creates Contact record (phone, whatsapp, emergencyContact)
4. Invalidates player search cache in Redis

---

## PUT /api/v1/profile/photo

**Purpose**: Upload or replace the authenticated user's profile photo.

**Auth**: Bearer JWT (any authenticated user)
**Content-Type**: `multipart/form-data`

### Request

```
photo: <file> (image/jpeg, image/png, image/webp — max 5MB)
```

### Response — 200 OK

```json
{
  "data": {
    "photoUrl": "https://res.cloudinary.com/..."
  }
}
```

### Error Responses

| Status | Code               | Condition                                  |
| ------ | ------------------ | ------------------------------------------ |
| 400    | `VALIDATION_ERROR` | Invalid MIME type, file too large, no file |
| 401    | `UNAUTHORIZED`     | No or invalid JWT                          |

### Side Effects

1. Uploads to Cloudinary at `users/{userId}/photo` (overwrites previous)
2. Updates `Player.photoUrl` with the new URL
3. Deletes old Cloudinary asset (best effort)
4. Invalidates player search cache

---

## GET /api/v1/profile/jersey-availability

**Purpose**: Check which jersey numbers are available (for the jersey number tooltip in FR-029).

**Auth**: Bearer JWT (any authenticated user)

### Request (query params)

```
?exclude=<playerId>   (optional — exclude self from the taken list)
```

### Response — 200 OK

```json
{
  "data": {
    "taken": [1, 2, 3, 5, 7, 9, 10, 11]
  }
}
```

Returns an array of jersey numbers currently assigned to ACTIVE REGISTERED players. The frontend uses this to show a tooltip listing taken numbers and validate the user's choice.

### Error Responses

| Status | Code           | Condition         |
| ------ | -------------- | ----------------- |
| 401    | `UNAUTHORIZED` | No or invalid JWT |
