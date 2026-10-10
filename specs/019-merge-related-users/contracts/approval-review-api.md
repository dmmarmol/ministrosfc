# Contract - Approval Review API (Spec 019)

Base path: `/api/v1/admin/users`
Auth: Bearer token required
Authorization: `EDITOR` or `ADMIN` unless noted

## 0) Register returns pending (related auth contract)

`POST /api/v1/auth/register`

Response 202:

```json
{
  "status": "pending",
  "message": "Tu cuenta está pendiente de aprobación"
}
```

Notes:

- Response MUST NOT include JWT access or refresh tokens.

## 1) List pending registrations

`GET /api/v1/admin/users/pending-approvals`

Query params:

- `page?: number` default 1
- `limit?: number` default 20, max 100
- `search?: string` matches first name / last name / email

Notes:

- Curated `suggestions` are limited to top 5 candidates per pending user.
- Candidates with `matchScore < 0.30` are excluded from curated suggestions.

Response 200:

```json
{
  "data": [
    {
      "userId": "uuid",
      "firstName": "Juan",
      "lastName": "Perez",
      "email": "juan@example.com",
      "submittedAt": "2026-04-27T10:00:00.000Z",
      "updatedAt": "2026-04-27T10:00:00.000Z",
      "suggestions": [
        {
          "playerId": "uuid",
          "firstName": "Juan",
          "lastName": "Perez",
          "status": "ACTIVE",
          "matchScore": 0.93,
          "matchReasons": ["name_similarity", "email_match"]
        }
      ]
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

Errors:

- `401` unauthenticated
- `403` insufficient role

## 2) Search orphan players for manual merge selection

`GET /api/v1/admin/users/pending-approvals/:userId/orphan-players`

Query params:

- `search?: string`
- `page?: number`
- `limit?: number`

Response 200:

```json
{
  "data": [
    {
      "playerId": "uuid",
      "firstName": "Carlos",
      "lastName": "Lopez",
      "status": "INACTIVE"
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

Errors:

- `404` pending user not found
- `409` request already decided

## 3) Approve without merge

`POST /api/v1/admin/users/pending-approvals/:userId/approve`

Request body:

```json
{
  "expectedUpdatedAt": "2026-04-27T10:00:00.000Z"
}
```

Response 200:

```json
{
  "data": {
    "userId": "uuid",
    "decisionType": "APPROVE_NO_MERGE",
    "playerId": null,
    "approvedAt": "2026-04-27T11:00:00.000Z",
    "approvedBy": "uuid"
  }
}
```

Errors:

- `400` validation error
- `404` pending user not found
- `409` stale update or already decided

## 4) Approve with merge

`POST /api/v1/admin/users/pending-approvals/:userId/approve-merge`

Request body:

```json
{
  "mergePlayerId": "uuid",
  "expectedUpdatedAt": "2026-04-27T10:00:00.000Z"
}
```

Response 200:

```json
{
  "data": {
    "userId": "uuid",
    "decisionType": "APPROVE_WITH_MERGE",
    "playerId": "uuid",
    "approvedAt": "2026-04-27T11:00:00.000Z",
    "approvedBy": "uuid"
  }
}
```

Errors:

- `400` validation error
- `404` pending user or merge player not found
- `409` merge player already linked, stale update, or request already decided

## 5) Deny pending registration

`POST /api/v1/admin/users/pending-approvals/:userId/deny`

Request body:

```json
{
  "reason": "No coincide con registros del plantel",
  "expectedUpdatedAt": "2026-04-27T10:00:00.000Z"
}
```

Response 204: no content

Notes:

- `reason` is mandatory for reviewer confirmation/validation.
- After successful denial, the pending account is hard-deleted and rejected-application data is not retained.

Errors:

- `400` validation error
- `404` pending user not found
- `409` stale update or already decided

## 6) Post-approval merge from user edition view

`POST /api/v1/admin/users/:userId/merge-player`

Request body:

```json
{
  "mergePlayerId": "uuid",
  "expectedUpdatedAt": "2026-04-27T10:00:00.000Z"
}
```

Response 200:

```json
{
  "data": {
    "userId": "uuid",
    "playerId": "uuid",
    "approvedBy": "uuid",
    "approvedAt": "2026-04-27T11:00:00.000Z"
  }
}
```

Errors:

- `400` validation error
- `404` user or player not found
- `409` player already linked or stale update
