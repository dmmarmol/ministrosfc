# API Contract: Teams

**Version**: 1.0 | **Date**: March 17, 2026 | **Status**: Complete

---

## Overview

Team endpoints manage team data. This flexible structure supports MVP (single Ministros FC team) and future multi-team tournaments. Teams represent soccer teams including opponent teams and our own team.

---

## Endpoints

### GET /api/v1/teams

List all teams with optional filtering.

**Public Endpoint** (no authentication required)

**Query Parameters**

| Parameter   | Type    | Required | Description                                          |
| ----------- | ------- | -------- | ---------------------------------------------------- |
| `isOurTeam` | boolean | No       | Filter: true = only our team, false = only opponents |
| `search`    | string  | No       | Search by team name (partial match)                  |
| `limit`     | integer | No       | Results per page (default: 50, max: 100)             |
| `offset`    | integer | No       | Pagination offset (default: 0)                       |

**Request**

```
GET /api/v1/teams?limit=20&offset=0
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "teams": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440001",
        "name": "Ministros F.C",
        "shortName": "MFC",
        "logo": "https://cdn.example.com/logos/ministros-fc.png",
        "city": "Lisbon",
        "country": "Portugal",
        "foundedYear": 2010,
        "isOurTeam": true,
        "createdAt": "2024-01-01T00:00:00Z",
        "updatedAt": "2024-03-17T10:00:00Z"
      },
      {
        "id": "550e8400-e29b-41d4-a716-446655440002",
        "name": "FC Porto",
        "shortName": "FCP",
        "logo": "https://cdn.example.com/logos/fc-porto.png",
        "city": "Porto",
        "country": "Portugal",
        "foundedYear": 1893,
        "isOurTeam": false,
        "createdAt": "2024-02-15T12:30:00Z",
        "updatedAt": "2024-02-15T12:30:00Z"
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
    "message": "Invalid isOurTeam value. Must be true or false"
  },
  "statusCode": 400
}
```

**Notes**

- All teams listed (both ours and opponents).
- Public endpoint: no authentication required.
- Sorted by name alphabetically.

---

### GET /api/v1/teams/{id}

Retrieve a single team's details.

**Public Endpoint** (no authentication required)

**Path Parameters**

| Parameter | Type          | Description |
| --------- | ------------- | ----------- |
| `id`      | string (UUID) | Team ID     |

**Request**

```
GET /api/v1/teams/550e8400-e29b-41d4-a716-446655440001
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440001",
    "name": "Ministros F.C",
    "shortName": "MFC",
    "logo": "https://cdn.example.com/logos/ministros-fc.png",
    "city": "Lisbon",
    "country": "Portugal",
    "foundedYear": 2010,
    "isOurTeam": true,
    "createdAt": "2024-01-01T00:00:00Z",
    "updatedAt": "2024-03-17T10:00:00Z"
  }
}
```

**Response - Failure (404 Not Found)**

```json
{
  "success": false,
  "error": {
    "code": "TEAM_NOT_FOUND",
    "message": "Team with ID 550e8400-e29b-41d4-a716-446655440001 does not exist"
  },
  "statusCode": 404
}
```

**Notes**

- Public endpoint: no authentication required.

---

### POST /api/v1/teams

Create a new team record.

**Protected Endpoint** (Editor+ only)

**Authentication**: Required (Authorization header with access token)

**Request**

```json
POST /api/v1/teams
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "name": "Sporting CP",
  "shortName": "SCP",
  "logo": "https://cdn.example.com/logos/sporting-cp.png",
  "city": "Lisbon",
  "country": "Portugal",
  "foundedYear": 1906,
  "isOurTeam": false
}
```

**Response - Success (201 Created)**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "name": "Sporting CP",
    "shortName": "SCP",
    "logo": "https://cdn.example.com/logos/sporting-cp.png",
    "city": "Lisbon",
    "country": "Portugal",
    "foundedYear": 1906,
    "isOurTeam": false,
    "createdAt": "2024-03-17T14:30:00Z",
    "updatedAt": "2024-03-17T14:30:00Z"
  }
}
```

**Response - Failure (400 Bad Request)**

```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_TEAM_NAME",
    "message": "Team with name 'Sporting CP' already exists"
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
    "message": "User role PLAYER cannot create teams"
  },
  "statusCode": 403
}
```

**Validation**

- `name`: Required, 1-255 characters. Must be unique per country (MVP: Portugal unique).
- `shortName`: Optional, 1-50 characters.
- `logo`: Optional, valid URL format.
- `city`: Optional, 1-255 characters.
- `country`: Optional, valid country name.
- `foundedYear`: Optional, 1900-current year.
- `isOurTeam`: Required, boolean. Only Admin can set this to true. In MVP, only one team should have this set.

**Notes**

- Team name uniqueness validated before insert.
- `isOurTeam` flag can only be set by Admin.
- For MVP: Exactly one team must have `isOurTeam` = true (Ministros F.C).
- If `isOurTeam` = true is set on new team, Admin should verify Ministros FC and update if needed.

---

### PATCH /api/v1/teams/{id}

Update an existing team's details.

**Protected Endpoint** (Editor+ only)

**Path Parameters**

| Parameter | Type          | Description |
| --------- | ------------- | ----------- |
| `id`      | string (UUID) | Team ID     |

**Request**

```json
PATCH /api/v1/teams/550e8400-e29b-41d4-a716-446655440002
Content-Type: application/json
Authorization: Bearer <accessToken>

{
  "logo": "https://cdn.example.com/logos/fc-porto-updated.png",
  "city": "Vila do Conde"
}
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440002",
    "name": "FC Porto",
    "shortName": "FCP",
    "logo": "https://cdn.example.com/logos/fc-porto-updated.png",
    "city": "Vila do Conde",
    "country": "Portugal",
    "foundedYear": 1893,
    "isOurTeam": false,
    "createdAt": "2024-02-15T12:30:00Z",
    "updatedAt": "2024-03-17T15:45:00Z"
  }
}
```

**Response - Failure (404 Not Found)**

```json
{
  "success": false,
  "error": {
    "code": "TEAM_NOT_FOUND",
    "message": "Team with ID 550e8400-e29b-41d4-a716-446655440002 does not exist"
  },
  "statusCode": 404
}
```

**Notes**

- Partial updates supported (only include changed fields).
- Team name cannot be changed to an already-used name.
- `isOurTeam` flag can only be updated by Admin.
- Changing `isOurTeam` updates the team status globally (use with caution).

---

### DELETE /api/v1/teams/{id}

Delete a team record.

**Protected Endpoint** (Admin only)

**Path Parameters**

| Parameter | Type          | Description |
| --------- | ------------- | ----------- |
| `id`      | string (UUID) | Team ID     |

**Request**

```
DELETE /api/v1/teams/550e8400-e29b-41d4-a716-446655440003
Authorization: Bearer <accessToken>
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "message": "Team deleted successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440003",
    "deletedAt": "2024-03-17T16:00:00Z"
  }
}
```

**Response - Failure (400 Bad Request)**

```json
{
  "success": false,
  "error": {
    "code": "CANNOT_DELETE_OUR_TEAM",
    "message": "Cannot delete the Ministros F.C team"
  },
  "statusCode": 400
}
```

**Response - Failure (409 Conflict)**

```json
{
  "success": false,
  "error": {
    "code": "TEAM_HAS_GAMES",
    "message": "Cannot delete team that has associated games. Delete games first."
  },
  "statusCode": 409
}
```

**Notes**

- Hard delete: removes team record completely.
- Cannot delete if team has associated games (referential integrity).
- Cannot delete the team marked as `isOurTeam` = true (Ministros F.C).
- Admin only operation.

---

## Error Codes

| Code                     | HTTP Status | Meaning                                  |
| ------------------------ | ----------- | ---------------------------------------- |
| `TEAM_NOT_FOUND`         | 404         | Team with given ID does not exist        |
| `DUPLICATE_TEAM_NAME`    | 400         | Team name already exists in system       |
| `INVALID_FILTER`         | 400         | Invalid query parameter value            |
| `UNAUTHORIZED`           | 401         | No valid authentication token            |
| `FORBIDDEN`              | 403         | User role lacks permission for operation |
| `VALIDATION_ERROR`       | 400         | Invalid field value (e.g., invalid URL)  |
| `CANNOT_DELETE_OUR_TEAM` | 400         | Ministros F.C team cannot be deleted     |
| `TEAM_HAS_GAMES`         | 409         | Team has associated games, cannot delete |
| `INTERNAL_ERROR`         | 500         | Server error                             |

---

## Role-Based Permissions

| Operation          | Admin | Editor | Player | Public |
| ------------------ | ----- | ------ | ------ | ------ |
| GET /teams         | ✓     | ✓      | ✓      | ✓      |
| GET /teams/{id}    | ✓     | ✓      | ✓      | ✓      |
| POST /teams        | ✓     | ✓      | ✗      | ✗      |
| PATCH /teams/{id}  | ✓     | ✓      | ✗      | ✗      |
| PATCH isOurTeam    | ✓     | ✗      | ✗      | ✗      |
| DELETE /teams/{id} | ✓     | ✗      | ✗      | ✗      |

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

1. List teams without filter → 200 OK, all teams returned.
2. List teams with isOurTeam=true filter → 200 OK, only Ministros F.C.
3. Search teams by name → 200 OK, matching teams.
4. Get single team → 200 OK, team details.
5. Get non-existent team → 404 Not Found.
6. Create team as Editor → 201 Created.
7. Create team with duplicate name → 400 Bad Request.
8. Create team as Player → 403 Forbidden.
9. Update team as Editor → 200 OK.
10. Update team as Player → 403 Forbidden.
11. Delete team as Admin → 200 OK (if no games).
12. Delete Ministros F.C team → 400 Bad Request.
13. Delete team with games → 409 Conflict.

---

## MVP Constraints

**Important**: In MVP (Ministros FC v1.0):

1. **One Team as Ours**: Exactly one team record must have `isOurTeam` = true (Ministros F.C).
2. **Home Team Always Ours**: All games created MUST have this team as homeTeam.
3. **Away Teams**: Can be any opponent team (created via POST /teams).
4. **Future Multi-Team**: When expanding to multi-team tournaments, multiple teams can have `isOurTeam` = true.
5. **Migration Path**: API and schema already support flexible team relationships; MVP just constrains usage.

---

## Pagination Best Practices

- Always include `limit` and `offset` in responses.
- Default limit: 50, max limit: 100 (prevent DoS via excessive pagination).
- Include `hasMore` flag to indicate if more results available.
- Frontend can implement infinite scroll or traditional pagination UI using these fields.

---

## Caching Strategy

- **GET /teams**: Cache 10 minutes (HTTP Cache-Control: max-age=600, public).
- **GET /teams/{id}**: Cache 15 minutes (HTTP Cache-Control: max-age=900, public).
- **POST/PATCH/DELETE**: No cache (Cache-Control: no-store, private).
