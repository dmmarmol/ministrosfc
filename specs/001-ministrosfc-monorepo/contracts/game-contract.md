# API Contract: Games

**Version**: 1.0 | **Date**: March 17, 2026 | **Status**: Complete

---

## Overview

Game endpoints manage team matches/games including scheduling, results, and player participation. Games link to tournaments and accumulate statistics.

---

## Endpoints

### GET /api/v1/games

List all games with filtering and pagination.

**Public Endpoint** (no authentication required)

**Query Parameters**

| Parameter      | Type              | Required | Description                                                    |
| -------------- | ----------------- | -------- | -------------------------------------------------------------- |
| `status`       | string            | No       | Filter by status: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED |
| `from`         | string (ISO 8601) | No       | Filter from date (inclusive)                                   |
| `to`           | string (ISO 8601) | No       | Filter to date (inclusive)                                     |
| `homeTeamId`   | string (UUID)     | No       | Filter by home team ID                                         |
| `awayTeamId`   | string (UUID)     | No       | Filter by away team ID                                         |
| `tournamentId` | string            | No       | Filter by tournament                                           |
| `limit`        | integer           | No       | Results per page (default: 20, max: 100)                       |
| `offset`       | integer           | No       | Pagination offset (default: 0)                                 |

**Request**

```
GET /api/v1/games?status=COMPLETED&from=2024-01-01&to=2024-03-31&limit=10&offset=0
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "games": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "homeTeam": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "name": "Ministros F.C",
          "shortName": "MFC",
          "logo": "https://cdn.example.com/logos/ministros-fc.png"
        },
        "awayTeam": {
          "id": "550e8400-e29b-41d4-a716-446655440002",
          "name": "FC Porto",
          "shortName": "FCP",
          "logo": "https://cdn.example.com/logos/fc-porto.png"
        },
        "date": "2024-03-10T15:00:00Z",
        "location": "Estádio da Paz",
        "competitionType": "FRIENDLY",
        "status": "COMPLETED",
        "homeTeamScore": 2,
        "awayTeamScore": 1,
        "possession": 55.0,
        "shotsOnTarget": 8,
        "fouls": 12,
        "tournamentId": null,
        "createdAt": "2024-03-01T10:00:00Z",
        "updatedAt": "2024-03-10T17:00:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440003",
        "homeTeam": {
          "id": "550e8400-e29b-41d4-a716-446655440001",
          "name": "Ministros F.C",
          "shortName": "MFC",
          "logo": "https://cdn.example.com/logos/ministros-fc.png"
        },
        "awayTeam": {
          "id": "550e8400-e29b-41d4-a716-446655440004",
          "name": "Sporting CP",
          "shortName": "SCP",
          "logo": "https://cdn.example.com/logos/sporting-cp.png"
        },
        "date": "2024-03-17T18:00:00Z",
        "location": "Estádio Nacional",
        "competitionType": "LEAGUE",
        "status": "SCHEDULED",
        "homeTeamScore": null,
        "awayTeamScore": null,
        "possession": null,
        "shotsOnTarget": null,
        "fouls": null,
        "tournamentId": "550e8400-e29b-41d4-a716-446655440005",
        "createdAt": "2024-03-01T10:00:00Z",
        "updatedAt": "2024-03-01T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 36,
      "limit": 10,
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
    "code": "INVALID_DATE_RANGE",
    "message": "from date must be before to date"
  },
  "statusCode": 400
}
```

**Notes**

- Public endpoint: no authentication required.
- Cancelled games excluded from public list (Admin only).
- Results sorted by date descending (most recent first).
- UTC timezone storage, frontend responsible for local timezone conversion.

---

### GET /api/v1/games/{id}

Retrieve full game details including participants.

**Public Endpoint** (no authentication required)

**Path Parameters**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Game ID     |

**Request**

```
GET /api/v1/games/550e8400-e29b-41d4-a716-446655440000
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "homeTeam": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Ministros F.C",
      "shortName": "MFC",
      "logo": "https://cdn.example.com/logos/ministros-fc.png"
    },
    "awayTeam": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "FC Porto",
      "shortName": "FCP",
      "logo": "https://cdn.example.com/logos/fc-porto.png"
    },
    "date": "2024-03-10T15:00:00Z",
    "location": "Estádio da Paz",
    "competitionType": "FRIENDLY",
    "status": "COMPLETED",
    "homeTeamScore": 2,
    "awayTeamScore": 1,
    "possession": 55.0,
    "shotsOnTarget": 8,
    "fouls": 12,
    "tournamentId": null,
    "notes": "Great performance in second half",
    "createdAt": "2024-03-01T10:00:00Z",
    "updatedAt": "2024-03-10T17:00:00Z",
    "participants": [
      {
        "id": "participant-1",
        "playerId": "player-1",
        "player": {
          "id": "player-1",
          "name": "João Silva",
          "position": "FORWARD",
          "jerseyNumber": 9
        },
        "confirmationStatus": "CONFIRMED",
        "goalsScored": 2,
        "assists": 1,
        "yellowCards": 0,
        "redCards": 0,
        "minutesPlayed": 90,
        "confirmedAt": "2024-03-08T10:00:00Z"
      },
      {
        "id": "participant-2",
        "playerId": "player-2",
        "player": {
          "id": "player-2",
          "name": "Carlos Mendes",
          "position": "FORWARD",
          "jerseyNumber": 10
        },
        "confirmationStatus": "CONFIRMED",
        "goalsScored": 0,
        "assists": 0,
        "yellowCards": 1,
        "redCards": 0,
        "minutesPlayed": 60,
        "confirmedAt": "2024-03-08T11:00:00Z"
      }
    ]
  }
}
```

**Response - Failure (404 Not Found)**

```json
{
  "success": false,
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "Game with ID 550e8400-e29b-41d4-a716-446655440000 does not exist"
  },
  "statusCode": 404
}
```

**Notes**

- Public response excludes participant confirmation metadata (timestamps, notes).
- Authenticated requests (Admin/Editor) include full participation data.
- Team objects embed: id, name, shortName, logo (immutable snapshot of team state at game creation).

---

### POST /api/v1/games

Create a new game record.

**Protected Endpoint** (Admin only)

**Request**

```json
POST /api/v1/games
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "homeTeamId": "550e8400-e29b-41d4-a716-446655440001",
  "awayTeamId": "550e8400-e29b-41d4-a716-446655440002",
  "date": "2024-03-10T15:00:00Z",
  "location": "Estádio da Paz",
  "competitionType": "FRIENDLY",
  "tournamentId": null,
  "notes": "First friendly of the season"
}
```

**Response - Success (201 Created)**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "homeTeam": {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Ministros F.C",
      "shortName": "MFC",
      "logo": "https://cdn.example.com/logos/ministros-fc.png"
    },
    "awayTeam": {
      "id": "550e8400-e29b-41d4-a716-446655440002",
      "name": "FC Porto",
      "shortName": "FCP",
      "logo": "https://cdn.example.com/logos/fc-porto.png"
    },
    "date": "2024-03-10T15:00:00Z",
    "location": "Estádio da Paz",
    "competitionType": "FRIENDLY",
    "status": "SCHEDULED",
    "homeTeamScore": null,
    "awayTeamScore": null,
    "tournamentId": null,
    "createdAt": "2024-03-01T10:00:00Z",
    "updatedAt": "2024-03-01T10:00:00Z"
  }
}
```

**Response - Failure (400 Bad Request)**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_MVP_CONSTRAINT",
    "message": "In MVP, home team must be Ministros F.C (ID: 550e8400-e29b-41d4-a716-446655440001)"
  },
  "statusCode": 400
}
```

**Validation**

- `homeTeamId`: Required, must reference valid Team ID. In MVP, must be Ministros F.C team.
- `awayTeamId`: Required, must reference valid Team ID. Must be different from homeTeamId.
- `date`: Required, ISO 8601 datetime, must be in future (cannot schedule past games).
- `location`: Optional, 1-255 characters.
- `competitionType`: Required, one of: FRIENDLY | LEAGUE | CUP | TOURNAMENT | PLAYOFF.
- `tournamentId`: Optional, if provided must reference existing tournament.
- `notes`: Optional, free-form text.

**Notes**

- Status initialized as SCHEDULED.
- Participants not created here; use separate endpoint to add players.
- If tournamentId provided, game associated with that tournament.

---

### PATCH /api/v1/games/{id}

Update game details and results.

**Protected Endpoint** (Admin and Editor)

**Path Parameters**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Game ID     |

**Request**

```json
PATCH /api/v1/games/game-1
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "status": "COMPLETED",
  "homeTeamScore": 2,
  "awayTeamScore": 1,
  "possession": 55.0,
  "shotsOnTarget": 8,
  "fouls": 12,
  "notes": "Great performance in second half"
}
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "game-1",
    "opponent": "FC Porto",
    "date": "2024-03-10T15:00:00Z",
    "status": "COMPLETED",
    "homeTeamScore": 2,
    "awayTeamScore": 1,
    "possession": 55.0,
    "shotsOnTarget": 8,
    "fouls": 12,
    "updatedAt": "2024-03-10T17:00:00Z"
  }
}
```

**Response - Failure (403 Forbidden)**

```json
{
  "success": false,
  "error": {
    "code": "GAME_LOCK_EXPIRED",
    "message": "Game results can only be updated within 7 days of completion"
  },
  "statusCode": 403
}
```

**Validation**

- `homeTeamScore`, `awayTeamScore`: If status COMPLETED, both required and ≥0.
- `possession`, `shotsOnTarget`, `fouls`: Optional, if provided must be valid numbers (0-100 for possession).
- `status`: If changing to COMPLETED, results must be provided.
- **Edit Window**: Game results locked 7 days after completion (configurable).

**Notes**

- Partial updates supported (only include changed fields).
- Changing status to COMPLETED triggers:
  - Validation of scores and stats.
  - Statistics recalculation for tournament (if tournamentId set).
  - Tournament standings update.
- Tournament standings recalculated via async job (completes within 5 seconds, SC-009).

---

### DELETE /api/v1/games/{id}

Delete a game record (soft delete via CANCELLED status).

**Protected Endpoint** (Admin only)

**Request**

```
DELETE /api/v1/games/game-1
Authorization: Bearer <accessToken>
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "message": "Game cancelled successfully",
  "data": {
    "id": "game-1",
    "status": "CANCELLED",
    "updatedAt": "2024-03-17T15:05:00Z"
  }
}
```

**Response - Failure (404 Not Found)**

```json
{
  "success": false,
  "error": {
    "code": "GAME_NOT_FOUND",
    "message": "Game with ID game-1 does not exist"
  },
  "statusCode": 404
}
```

**Notes**

- Marks game as CANCELLED (soft delete, data retained).
- Cancelled games excluded from public GET endpoints.
- Participants retain confirmation status (records preserved for history).

---

## Game Participation Endpoints

### GET /api/v1/games/{id}/participants

List players assigned to a game.

**Public Endpoint** (confirmation status not included in public response)

**Path Parameters**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Game ID     |

**Request**

```
GET /api/v1/games/game-1/participants
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "gameId": "game-1",
    "participants": [
      {
        "id": "participant-1",
        "playerId": "player-1",
        "player": {
          "id": "player-1",
          "name": "João Silva",
          "position": "FORWARD",
          "jerseyNumber": 9
        },
        "confirmationStatus": "CONFIRMED",
        "goalsScored": 2,
        "assists": 1,
        "yellowCards": 0,
        "redCards": 0,
        "minutesPlayed": 90
      }
    ]
  }
}
```

---

### POST /api/v1/games/{id}/participants

Add a player to a game roster.

**Protected Endpoint** (Admin and Editor)

**Request**

```json
POST /api/v1/games/game-1/participants
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "playerId": "player-1"
}
```

**Response - Success (201 Created)**

```json
{
  "success": true,
  "data": {
    "id": "participant-1",
    "gameId": "game-1",
    "playerId": "player-1",
    "confirmationStatus": "NOT_RESPONDED"
  }
}
```

**Response - Failure (400 Bad Request)**

```json
{
  "success": false,
  "error": {
    "code": "PLAYER_ALREADY_IN_GAME",
    "message": "Player player-1 is already assigned to this game"
  },
  "statusCode": 400
}
```

---

### PATCH /api/v1/games/{id}/participants/{playerId}/status

Update player's participation confirmation status.

**Protected Endpoint** (Player can update own; Admin/Editor can update any)

**Path Parameters**

| Parameter  | Type   | Description |
| ---------- | ------ | ----------- |
| `id`       | string | Game ID     |
| `playerId` | string | Player ID   |

**Request**

```json
PATCH /api/v1/games/game-1/participants/player-1/status
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "confirmationStatus": "CONFIRMED",
  "notes": "Available all match"
}
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "participant-1",
    "gameId": "game-1",
    "playerId": "player-1",
    "confirmationStatus": "CONFIRMED",
    "confirmedAt": "2024-03-08T10:00:00Z"
  }
}
```

**Response - Failure (400 Bad Request)**

```json
{
  "success": false,
  "error": {
    "code": "GAME_ALREADY_PLAYED",
    "message": "Cannot confirm participation for a game that has already been played"
  },
  "statusCode": 400
}
```

**Validation**

- `confirmationStatus`: One of NOT_RESPONDED | CONFIRMED | DECLINED.
- Cannot confirm participation for past games.

**Notes**

- Player can only update own confirmation status (playerId must match user's Player profile).
- Admin/Editor can update any player's confirmation status.
- `confirmedAt` auto-set when status changes to CONFIRMED.

---

## Error Codes

| Code                     | HTTP Status | Meaning                                            |
| ------------------------ | ----------- | -------------------------------------------------- |
| `GAME_NOT_FOUND`         | 404         | Game with given ID does not exist                  |
| `INVALID_GAME_DATE`      | 400         | Game date invalid or in past                       |
| `GAME_LOCK_EXPIRED`      | 403         | Game results cannot be edited (beyond lock window) |
| `INVALID_DATE_RANGE`     | 400         | Filter date range invalid                          |
| `INVALID_FILTER`         | 400         | Invalid query parameter                            |
| `PLAYER_NOT_FOUND`       | 404         | Player with given ID not found                     |
| `PLAYER_ALREADY_IN_GAME` | 400         | Player already assigned to game                    |
| `GAME_ALREADY_PLAYED`    | 400         | Game already completed or past                     |
| `UNAUTHORIZED`           | 401         | No valid authentication token                      |
| `FORBIDDEN`              | 403         | User role lacks permission                         |
| `INTERNAL_ERROR`         | 500         | Server error                                       |

---

## Role-Based Permissions

| Operation                          | Admin | Editor | Player  | Public |
| ---------------------------------- | ----- | ------ | ------- | ------ |
| GET /games                         | ✓     | ✓      | ✓       | ✓      |
| GET /games/{id}                    | ✓     | ✓      | ✓       | ✓      |
| POST /games                        | ✓     | ✗      | ✗       | ✗      |
| PATCH /games/{id}                  | ✓     | ✓      | ✗       | ✗      |
| DELETE /games/{id}                 | ✓     | ✗      | ✗       | ✗      |
| GET /games/{id}/participants       | ✓     | ✓      | ✓       | ✓      |
| POST /games/{id}/participants      | ✓     | ✓      | ✗       | ✗      |
| PATCH .../participants/{id}/status | ✓     | ✓      | ✓ (own) | ✗      |

---

## Caching Strategy

- **GET /games**: Cache 5 minutes (frequently changes).
- **GET /games/{id}**: Cache 10 minutes.
- **POST/PATCH/DELETE**: No cache (server state changes).
- Invalidate game caches when results updated or game deleted.

---

## Testing

**Test Cases**:

1. List upcoming games → 200 OK, only SCHEDULED status.
2. Filter games by date range → 200 OK, matching games.
3. Filter by opponent → 200 OK, matching games.
4. Get single game with participants → 200 OK, all data.
5. Create game as Admin → 201 Created.
6. Create game as Editor → 403 Forbidden.
7. Update game status to COMPLETED with scores → 200 OK, standings updated.
8. Update game after lock window → 403 Forbidden.
9. Add player to game → 201 Created.
10. Add duplicate player → 400 Bad Request.
11. Player confirms participation → 200 OK.
12. Cannot confirm past game → 400 Bad Request.
13. Delete game → 200 OK, status CANCELLED.
