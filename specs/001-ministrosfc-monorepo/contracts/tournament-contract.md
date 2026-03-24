# API Contract: Tournaments & Statistics

**Version**: 1.0 | **Date**: March 17, 2026 | **Status**: Complete

---

## Overview

Tournament endpoints manage competitions and aggregate statistics. Statistics are automatically calculated from game participation records.

---

## Tournament Endpoints

### GET /api/v1/tournaments

List all tournaments.

**Public Endpoint** (no authentication required)

**Query Parameters**

| Parameter | Type    | Description                                                      |
| --------- | ------- | ---------------------------------------------------------------- |
| `format`  | string  | Filter by tournament format: LEAGUE, CUP, GROUP, FRIENDLY_SERIES |
| `limit`   | integer | Results per page (default: 20, max: 100)                         |
| `offset`  | integer | Pagination offset (default: 0)                                   |

**Request**

```
GET /api/v1/tournaments?format=LEAGUE&limit=10
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "tournaments": [
      {
        "id": "tournament-1",
        "name": "Winter League 2024",
        "description": "Regular season league",
        "startDate": "2024-01-01T00:00:00Z",
        "endDate": "2024-03-31T23:59:59Z",
        "format": "LEAGUE",
        "gameCount": 15,
        "createdAt": "2023-12-15T10:00:00Z"
      }
    ],
    "pagination": {
      "total": 8,
      "limit": 10,
      "offset": 0,
      "hasMore": false
    }
  }
}
```

---

### GET /api/v1/tournaments/{id}

Retrieve tournament details with Ministros FC's record (MVP scope: grouping only, not full league standings).

**Public Endpoint** (no authentication required)

**Path Parameters**

| Parameter | Type   | Description   |
| --------- | ------ | ------------- |
| `id`      | string | Tournament ID |

**Request**

```
GET /api/v1/tournaments/tournament-1
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "tournament-1",
    "name": "Winter League 2024",
    "description": "Regular season league",
    "startDate": "2024-01-01T00:00:00Z",
    "endDate": "2024-03-31T23:59:59Z",
    "format": "LEAGUE",
    "ministrosRecord": {
      "played": 15,
      "won": 11,
      "drawn": 2,
      "lost": 2,
      "goalsFor": 42,
      "goalsAgainst": 15,
      "goalDifference": 27
    },
    "games": [
      {
        "id": "game-1",
        "opponent": "Local Team A",
        "date": "2024-01-07T15:00:00Z",
        "status": "COMPLETED",
        "homeTeamScore": 3,
        "awayTeamScore": 1
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
    "code": "TOURNAMENT_NOT_FOUND",
    "message": "Tournament with ID tournament-1 does not exist"
  },
  "statusCode": 404
}
```

**Notes**

- MVP Scope: System tracks Ministros FC games only (not full league with all teams' results).
- `ministrosRecord`: Calculated from Ministros FC's completed games in this tournament.
- Games sorted by date descending (most recent first).
- Full league standings calculation (FR-036) deferred post-MVP.

---

### POST /api/v1/tournaments

Create a new tournament.

**Protected Endpoint** (Admin only)

**Request**

```json
POST /api/v1/tournaments
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "name": "Summer Cup 2024",
  "description": "End-of-summer championship",
  "startDate": "2024-06-01T00:00:00Z",
  "endDate": "2024-08-31T23:59:59Z",
  "format": "CUP"
}
```

**Response - Success (201 Created)**

```json
{
  "success": true,
  "data": {
    "id": "tournament-2",
    "name": "Summer Cup 2024",
    "description": "End-of-summer championship",
    "startDate": "2024-06-01T00:00:00Z",
    "endDate": "2024-08-31T23:59:59Z",
    "format": "CUP",
    "createdAt": "2024-03-17T14:00:00Z"
  }
}
```

**Validation**

- `name`: Required, 1-255 characters.
- `startDate`, `endDate`: Required, ISO 8601 datetime, endDate after startDate.
- `format`: Required, one of LEAGUE | CUP | SEASON | FRIENDLY_SERIES.
- `description`: Optional.

**Notes**

- Ministros FC record (wins/draws/losses) calculated from completed games in this tournament.
- Games associated via Game.tournamentId.
- MVP Scope: No full league standings (only tracks Ministros FC games).

---

### PATCH /api/v1/tournaments/{id}

Update tournament details.

**Protected Endpoint** (Admin and Editor)

**Request**

```json
PATCH /api/v1/tournaments/tournament-1
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "name": "Winter League 2024 - Updated",
  "endDate": "2024-04-30T23:59:59Z"
}
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "tournament-1",
    "name": "Winter League 2024 - Updated",
    "endDate": "2024-04-30T23:59:59Z",
    "updatedAt": "2024-03-17T15:00:00Z"
  }
}
```

**Notes**

- Partial updates supported.
- Cannot modify format once created.

---

### DELETE /api/v1/tournaments/{id}

Delete a tournament.

**Protected Endpoint** (Admin only)

**Response - Success (200 OK)**

```json
{
  "success": true,
  "message": "Tournament deleted successfully"
}
```

**Notes**

- Only tournaments with no associated games can be deleted.
- Associated games must be deleted/unassociated first.

---

## Statistics Endpoints

### GET /api/v1/statistics/players

List top player statistics aggregated by tournament.

**Public Endpoint** (no authentication required)

**Query Parameters**

| Parameter      | Type   | Description                                           |
| -------------- | ------ | ----------------------------------------------------- |
| `tournamentId` | string | Required, tournament to aggregate stats for           |
| `metric`       | string | Sort by: goals, assists, appearances (default: goals) |

**Request**

```
GET /api/v1/statistics/players?tournamentId=tournament-1&metric=goals
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "tournamentId": "tournament-1",
    "topScorers": [
      {
        "rank": 1,
        "playerId": "player-1",
        "playerName": "João Silva",
        "position": "FORWARD",
        "goals": 12,
        "assists": 3,
        "appearances": 15,
        "goalsPerGame": 0.8
      },
      {
        "rank": 2,
        "playerId": "player-2",
        "playerName": "Carlos Mendes",
        "position": "MIDFIELDER",
        "goals": 8,
        "assists": 5,
        "appearances": 15,
        "goalsPerGame": 0.53
      }
    ]
  }
}
```

---

### GET /api/v1/statistics/players/{id}

Get detailed statistics for a single player.

**Public Endpoint** (no authentication required)

**Path Parameters**

| Parameter | Type   | Description |
| --------- | ------ | ----------- |
| `id`      | string | Player ID   |

**Query Parameters**

| Parameter      | Type   | Description                                        |
| -------------- | ------ | -------------------------------------------------- |
| `tournamentId` | string | Optional, filter by tournament (default: all-time) |

**Request**

```
GET /api/v1/statistics/players/player-1?tournamentId=tournament-1
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "playerId": "player-1",
    "playerName": "João Silva",
    "position": "FORWARD",
    "tournaments": [
      {
        "tournamentId": "tournament-1",
        "tournamentName": "Winter League 2024",
        "goals": 12,
        "assists": 3,
        "appearances": 15,
        "yellowCards": 2,
        "redCards": 0,
        "totalMinutes": 1320,
        "goalsPerGame": 0.8
      }
    ],
    "allTimeStats": {
      "goals": 32,
      "assists": 8,
      "appearances": 42,
      "yellowCards": 5,
      "redCards": 1
    }
  }
}
```

---

### GET /api/v1/statistics/tournament/{tournamentId}

Get aggregate tournament statistics and records.

**Public Endpoint** (no authentication required)

**Path Parameters**

| Parameter      | Type   | Description   |
| -------------- | ------ | ------------- |
| `tournamentId` | string | Tournament ID |

**Request**

```
GET /api/v1/statistics/tournament/tournament-1
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "tournamentId": "tournament-1",
    "tournamentName": "Winter League 2024",
    "summary": {
      "totalGames": 15,
      "totalGoals": 42,
      "averageGoalsPerGame": 2.8,
      "totalYellowCards": 38,
      "totalRedCards": 2
    },
    "topScorer": {
      "playerId": "player-1",
      "playerName": "João Silva",
      "goals": 12
    },
    "topAssists": {
      "playerId": "player-3",
      "playerName": "Miguel Costa",
      "assists": 6
    },
    "mostAppearances": {
      "playerId": "player-5",
      "playerName": "Pedro Oliveira",
      "appearances": 15
    }
  }
}
```

---

### POST /api/v1/statistics/recalculate/{tournamentId}

Trigger manual statistics recalculation for a tournament.

**Protected Endpoint** (Admin and Editor only)

**Path Parameters**

| Parameter      | Type   | Description               |
| -------------- | ------ | ------------------------- |
| `tournamentId` | string | Tournament to recalculate |

**Request**

```
POST /api/v1/statistics/recalculate/tournament-1
Authorization: Bearer <accessToken>
```

**Response - Success (202 Accepted)**

```json
{
  "success": true,
  "message": "Statistics recalculation queued",
  "data": {
    "tournamentId": "tournament-1",
    "jobId": "job-recalc-12345",
    "estimatedCompletionTime": "5s"
  }
}
```

**Notes**

- Async job (not blocking).
- Normally triggered automatically when game results updated.
- Use for manual corrections or if auto-calculation failed.

---

## Error Codes

| Code                   | HTTP Status | Meaning                                        |
| ---------------------- | ----------- | ---------------------------------------------- |
| `TOURNAMENT_NOT_FOUND` | 404         | Tournament with given ID does not exist        |
| `TOURNAMENT_HAS_GAMES` | 400         | Cannot delete tournament with associated games |
| `INVALID_DATE_RANGE`   | 400         | Tournament dates invalid                       |
| `UNAUTHORIZED`         | 401         | No valid authentication token                  |
| `FORBIDDEN`            | 403         | User role lacks permission                     |
| `INTERNAL_ERROR`       | 500         | Server error                                   |

---

## Role-Based Permissions

| Operation                         | Admin | Editor | Player | Public |
| --------------------------------- | ----- | ------ | ------ | ------ |
| GET /tournaments                  | ✓     | ✓      | ✓      | ✓      |
| GET /tournaments/{id}             | ✓     | ✓      | ✓      | ✓      |
| POST /tournaments                 | ✓     | ✗      | ✗      | ✗      |
| PATCH /tournaments/{id}           | ✓     | ✓      | ✗      | ✗      |
| DELETE /tournaments/{id}          | ✓     | ✗      | ✗      | ✗      |
| GET /statistics/players           | ✓     | ✓      | ✓      | ✓      |
| GET /statistics/players/{id}      | ✓     | ✓      | ✓      | ✓      |
| GET /statistics/tournament/{id}   | ✓     | ✓      | ✓      | ✓      |
| POST /statistics/recalculate/{id} | ✓     | ✓      | ✗      | ✗      |

---

## Caching Strategy

- **GET /tournaments**: Cache 10 minutes.
- **GET /tournaments/{id}**: Cache 5 minutes (Ministros FC record can change when games completed).
- **GET /statistics/\***: Cache 10 minutes (stats change when games completed).
- Invalidate tournament cache when game results updated.
- Invalidate statistics cache when game results updated.

---

## Statistics Calculation

**Triggers**:

1. Admin completes a game (status → COMPLETED, scores recorded).
2. Async job recalculates Ministros FC record for that tournament.
3. Recalculates player statistics aggregates.

**Calculation Logic**:

```
For each completed game in tournament:
  For each player in game:
    aggregatedStats.appearances += 1
    aggregatedStats.goals += player.goalsScored
    aggregatedStats.assists += player.assists
    aggregatedStats.yellowCards += player.yellowCards
    aggregatedStats.redCards += player.redCards
    aggregatedStats.totalMinutes += player.minutesPlayed
  aggregatedStats.goalsPerGame = goals / appearances
```

**Ministros FC Record** (MVP Scope):

```
For each completed game in tournament:
  If homeTeamScore > awayTeamScore: wins += 1
  Else if homeTeamScore == awayTeamScore: draws += 1
  Else: losses += 1
  goalsFor += homeTeamScore
  goalsAgainst += awayTeamScore
  goalDifference = goalsFor - goalsAgainst
  played = wins + draws + losses
```

Note: Full league standings (tracking all teams) deferred post-MVP.

---

## Testing

**Test Cases**:

1. List tournaments → 200 OK.
2. Filter by format → 200 OK.
3. Get tournament with Ministros FC record → 200 OK, record calculated correctly.
4. Get player statistics → 200 OK, aggregated correctly.
5. Get tournament statistics → 200 OK, player stats correct.
6. Create tournament as Admin → 201 Created.
7. Update tournament → 200 OK.
8. Delete tournament with no games → 200 OK.
9. Delete tournament with games → 400 Bad Request.
10. Recalculate statistics → 202 Accepted, job queued.
