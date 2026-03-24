# API Contract: Players

**Version**: 1.0 | **Date**: March 17, 2026 | **Status**: Complete

---

## Overview

Player endpoints manage team roster data. Public endpoints allow viewing players; authenticated endpoints allow creation, updates, and management by authorized roles.

---

## Endpoints

### GET /api/v1/players

List all active players with optional filtering.

**Public Endpoint** (no authentication required)

**Query Parameters**

| Parameter  | Type    | Required | Description                                                   |
| ---------- | ------- | -------- | ------------------------------------------------------------- |
| `position` | string  | No       | Filter by position: GOALKEEPER, DEFENDER, MIDFIELDER, FORWARD |
| `limit`    | integer | No       | Number of results (default: 50, max: 100)                     |
| `offset`   | integer | No       | Pagination offset (default: 0)                                |
| `search`   | string  | No       | Search by player name (partial match)                         |

**Request**

```
GET /api/v1/players?position=FORWARD&limit=20&offset=0
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "players": [
      {
        "id": "player-1",
        "name": "João Silva",
        "nickname": "Pelé",
        "position": "FORWARD",
        "jerseyNumber": 9,
        "height": 180,
        "dominantFoot": "RIGHT",
        "avatar": "https://cdn.example.com/photos/player-1-avatar.jpg",
        "photos": [
          "https://cdn.example.com/photos/player-1-full.jpg",
          "https://cdn.example.com/photos/player-1-action.jpg"
        ],
        "isActive": true
      },
      {
        "id": "player-2",
        "name": "Carlos Mendes",
        "nickname": "Maestro",
        "position": "FORWARD",
        "jerseyNumber": 10,
        "height": 175,
        "dominantFoot": "LEFT",
        "avatar": "https://cdn.example.com/photos/player-2-avatar.jpg",
        "photos": [],
        "isActive": true
      }
    ],
    "pagination": {
      "total": 24,
      "limit": 20,
      "offset": 0,
      "hasMore": true
    }
  }
}
```

**Response - Failure (400 Bad Request)**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_FILTER",
    "message": "Invalid position value. Allowed: GOALKEEPER, DEFENDER, MIDFIELDER, FORWARD"
  },
  "statusCode": 400
}
```

**Notes**

- Only active players (isActive = true) are returned.
- `nationalId` excluded from public response (private field).
- Pagination required for large rosters (default 50 per page).
- Public endpoint: no authentication needed.

---

### GET /api/v1/players/{id}

Retrieve a single player's details.

**Public Endpoint** (no authentication required)

**Path Parameters**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Player ID   |

**Request**

```
GET /api/v1/players/player-1
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "player-1",
    "name": "João Silva",
    "nickname": "Pelé",
    "position": "FORWARD",
    "jerseyNumber": 9,
    "dateOfBirth": "1990-05-15",
    "height": 180,
    "dominantFoot": "RIGHT",
    "avatar": "https://cdn.example.com/photos/player-1-avatar.jpg",
    "photos": [
      "https://cdn.example.com/photos/player-1-full.jpg",
      "https://cdn.example.com/photos/player-1-action.jpg"
    ],
    "isActive": true,
    "createdAt": "2024-03-01T10:00:00Z"
  }
}
```

**Response - Failure (404 Not Found)**

```json
{
  "success": false,
  "error": {
    "code": "PLAYER_NOT_FOUND",
    "message": "Player with ID player-1 does not exist"
  },
  "statusCode": 404
}
```

**Notes**

- Contact info not included in public response.
- Inactive players return 404 (hidden from public).

---

### POST /api/v1/players

Create a new player record.

**Protected Endpoint** (Admin only)

**Authentication**: Required (Authorization header with access token)

**Request**

```json
POST /api/v1/players
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "name": "João Silva",
  "nickname": "Pelé",
  "position": "FORWARD",
  "jerseyNumber": 9,
  "dateOfBirth": "1990-05-15",
  "height": 180,
  "dominantFoot": "RIGHT",
  "nationalId": "12345678-A",
  "avatar": "https://cdn.example.com/photos/player-1-avatar.jpg",
  "photos": [
    "https://cdn.example.com/photos/player-1-full.jpg",
    "https://cdn.example.com/photos/player-1-action.jpg"
  ],
  "contact": {
    "phone": "+351-912-345-678",
    "whatsapp": "+351-912-345-678",
    "emergencyContact": "Maria Silva +351-913-999-999"
  }
}
```

**Response - Success (201 Created)**

```json
{
  "success": true,
  "data": {
    "id": "player-1",
    "name": "João Silva",
    "nickname": "Pelé",
    "position": "FORWARD",
    "jerseyNumber": 9,
    "dateOfBirth": "1990-05-15",
    "height": 180,
    "dominantFoot": "RIGHT",
    "avatar": "https://cdn.example.com/photos/player-1-avatar.jpg",
    "photos": [
      "https://cdn.example.com/photos/player-1-full.jpg",
      "https://cdn.example.com/photos/player-1-action.jpg"
    ],
    "isActive": true,
    "createdAt": "2024-03-17T14:30:00Z"
  }
}
```

**Response - Failure (400 Bad Request)**

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_JERSEY_NUMBER",
    "message": "Jersey number 9 is already assigned to another player"
  },
  "statusCode": 400
}
```

**Response - Failure (403 Forbidden)**

```json
{
  "success": false,
  "error": {
    "code": "FORBIDDEN",
    "message": "User role EDITOR cannot create players"
  },
  "statusCode": 403
}
```

**Validation**

- `name`: Required, 1-255 characters.
- `nickname`: Optional, 1-100 characters. Unique display name.
- `position`: Required, must be GOALKEEPER | DEFENDER | MIDFIELDER | FORWARD.
- `jerseyNumber`: Required, integer 1-99, must be unique per team.
- `dateOfBirth`: Optional, ISO 8601 format (YYYY-MM-DD), used for age calculation. Can be undefined/null.
- `height`: Optional, integer in centimeters (150-220 typical range).
- `dominantFoot`: Optional, must be LEFT | RIGHT | AMBIDEXTROUS.
- `nationalId`: Optional (admin only), typically DNI/ID number. Private field.
- `avatar`: Optional, valid URL format. Main/default photo for player display.
- `photos`: Optional array of URLs, default empty array. Gallery of additional player photos.
- `contact.phone`, `contact.whatsapp`: Optional, phone number format.

**Notes**

- Jersey number uniqueness validated before insert.
- Contact info optional; if provided, Contact record created linked to Player.
- Duplicate jersey number returns 400 (not 409 Conflict for consistency).

---

### PATCH /api/v1/players/{id}

Update an existing player's details.

**Protected Endpoint** (Admin and Editor)

**Path Parameters**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Player ID   |

**Request**

```json
PATCH /api/v1/players/player-1
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "name": "João Silva Updated",
  "nickname": "JJ",
  "position": "MIDFIELDER",
  "height": 182,
  "dominantFoot": "RIGHT",
  "avatar": "https://cdn.example.com/photos/player-1-new-avatar.jpg",
  "photos": [
    "https://cdn.example.com/photos/player-1-recent.jpg",
    "https://cdn.example.com/photos/player-1-training.jpg"
  ],
  "contact": {
    "phone": "+351-912-345-678"
  }
}
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "player-1",
    "name": "João Silva Updated",
    "nickname": "JJ",
    "position": "MIDFIELDER",
    "jerseyNumber": 9,
    "dateOfBirth": "1990-05-15",
    "height": 182,
    "dominantFoot": "RIGHT",
    "avatar": "https://cdn.example.com/photos/player-1-new-avatar.jpg",
    "photos": [
      "https://cdn.example.com/photos/player-1-recent.jpg",
      "https://cdn.example.com/photos/player-1-training.jpg"
    ],
    "isActive": true,
    "updatedAt": "2024-03-17T15:00:00Z"
  }
}
```

**Response - Failure (404 Not Found)**

```json
{
  "success": false,
  "error": {
    "code": "PLAYER_NOT_FOUND",
    "message": "Player with ID player-1 does not exist"
  },
  "statusCode": 404
}
```

**Notes**

- Partial updates supported (only include changed fields).
- Jersey number cannot be changed to an already-used number.
- `nationalId` can only be updated by Admin.
- `avatar` and `photos` array can be updated independently (partial updates work fine).
- Cannot reactivate players via this endpoint (use separate endpoint if needed).
- Statistics retained when player info updated.

---

### DELETE /api/v1/players/{id}

Soft-delete a player (mark as inactive).

**Protected Endpoint** (Admin only)

**Path Parameters**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Player ID   |

**Request**

```
DELETE /api/v1/players/player-1
Authorization: Bearer <accessToken>
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "message": "Player deactivated successfully",
  "data": {
    "id": "player-1",
    "isActive": false,
    "updatedAt": "2024-03-17T15:05:00Z"
  }
}
```

**Response - Failure (404 Not Found)**

```json
{
  "success": false,
  "error": {
    "code": "PLAYER_NOT_FOUND",
    "message": "Player with ID player-1 does not exist"
  },
  "statusCode": 404
}
```

**Notes**

- Soft delete: sets isActive = false, retains all historical data.
- Player remains in statistics, game participation records preserved for historical analysis.
- Cannot be undone via API (admin can manually update database if needed).

---

## Player Statistics & Performance Tracking

Player performance statistics are tracked at two levels:

### Per-Game Stats (GameParticipant)

Each player appearance in a game is tracked with individual performance metrics:

- **Goals Scored**: Number of goals the player scored in the game
- **Assists**: Number of assists (created scoring opportunities)
- **Yellow Cards**: Disciplinary cards received
- **Red Cards**: Sent-off incidents (typically results in removal from game)
- **Minutes Played**: Time on field (0-90+ minutes depending on extra time)

These stats are recorded by admin/editor after game completion via the GameParticipant relation.

### Aggregated Tournament Stats (Statistics)

Season or tournament-level statistics are automatically calculated:

- **Appearances**: Total games the player participated in
- **Goals Scored**: Sum of all goals across tournament games
- **Assists**: Sum of all assists across tournament games
- **Yellow Cards**: Total yellow cards during tournament
- **Red Cards**: Total red cards during tournament
- **Total Minutes**: Sum of all minutes played
- **Goals Per Game**: Calculated metric (goalsScored / appearances)

Available via: `GET /api/v1/players/{id}/statistics?tournamentId={tournamentId}`

### Access Control for Statistics

- **Public**: Can view aggregated tournament-level stats (top scorers, etc), plus player avatar/photos
- **Authenticated Player**: Can view own statistics and full profile including avatar/photos
- **Editor+**: Can view and edit game-level stats (record performance after game), manage player photos
- **Admin**: Can view all stats, request recalculation, modify historical records, update player photos

---

## Error Codes

| Code                      | HTTP Status | Meaning                                         |
| ------------------------- | ----------- | ----------------------------------------------- |
| `PLAYER_NOT_FOUND`        | 404         | Player with given ID does not exist             |
| `DUPLICATE_JERSEY_NUMBER` | 400         | Jersey number already assigned                  |
| `INVALID_FILTER`          | 400         | Invalid query parameter value                   |
| `UNAUTHORIZED`            | 401         | No valid authentication token                   |
| `FORBIDDEN`               | 403         | User role lacks permission for operation        |
| `VALIDATION_ERROR`        | 400         | Invalid field value (e.g., invalid date format) |
| `INTERNAL_ERROR`          | 500         | Server error                                    |

---

## Role-Based Permissions

| Operation            | Admin | Editor | Player | Public                    |
| -------------------- | ----- | ------ | ------ | ------------------------- |
| GET /players         | ✓     | ✓      | ✓      | ✓ (avatar/photos visible) |
| GET /players/{id}    | ✓     | ✓      | ✓      | ✓ (own/all public)        |
| POST /players        | ✓     | ✗      | ✗      | ✗                         |
| PATCH /players/{id}  | ✓     | ✓      | ✗      | ✗                         |
| DELETE /players/{id} | ✓     | ✗      | ✗      | ✗                         |

---

## Response Format

All endpoint responses follow this format:

```json
{
  "success": boolean,
  "data": object | array | null,
  "error": {
    "code": string,
    "message": string
  } | null,
  "statusCode": number,
  "timestamp": string (ISO 8601)
}
```

---

## Testing

**Test Cases**:

1. List players without filter → 200 OK, all players returned.
2. List players with position filter → 200 OK, only matching players.
3. Get single player → 200 OK, player details.
4. Get non-existent player → 404 Not Found.
5. Create player as Admin → 201 Created.
6. Create player with duplicate jersey → 400 Bad Request.
7. Create player as Editor → 403 Forbidden.
8. Update player as Admin/Editor → 200 OK.
9. Update player as Player → 403 Forbidden.
10. Delete player as Admin → 200 OK, player marked inactive.
11. Public list excludes inactive players.

---

## Pagination Best Practices

- Always include `limit` and `offset` in responses.
- Default limit: 50, max limit: 100 (prevent DoS via excessive pagination).
- Include `hasMore` flag to indicate if more results available.
- Frontend can implement infinite scroll or traditional pagination UI using these fields.

---

## Caching Strategy

- **GET /players**: Cache 5 minutes (HTTP Cache-Control: max-age=300, public).
- **GET /players/{id}**: Cache 10 minutes (HTTP Cache-Control: max-age=600, public).
- **POST/PATCH/DELETE**: No cache (Cache-Control: no-store, private).
