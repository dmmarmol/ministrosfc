# Contract: Post-Signup Onboarding

**Spec**: [spec.md](../spec.md) | **FRs**: FR-032 to FR-037

---

## GET /api/v1/onboarding/status

**Purpose**: Determine whether the authenticated user must complete onboarding.

**Auth**: JWT required

### Response — 200 OK

```json
{
  "data": {
    "needsOnboarding": true,
    "prefill": {
      "isPlayer": true,
      "jerseyNumber": null,
      "position": null
    }
  }
}
```

### Error Responses

| Status | Code             | Condition               |
| ------ | ---------------- | ----------------------- |
| 401    | `UNAUTHORIZED`   | Missing/invalid JWT     |
| 500    | `INTERNAL_ERROR` | Unexpected server error |

---

## POST /api/v1/onboarding/complete

**Purpose**: Persist onboarding answers as the single source of truth and finalize user/player state.

**Auth**: JWT required

### Request

```json
{
  "isPlayer": true,
  "jerseyNumber": 10,
  "position": "CMF"
}
```

### Validation Rules

- `isPlayer`: required boolean
- If `isPlayer = true`:
  - `position`: required enum value from `Position`
  - `jerseyNumber`: optional integer 1-99, validated for uniqueness among ACTIVE REGISTERED players
- If `isPlayer = false`:
  - `position` and `jerseyNumber` ignored if present

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
      "playerId": "uuid-or-null",
      "onboardingCompletedAt": "2026-03-29T12:00:00.000Z"
    },
    "nextStep": "/profile"
  }
}
```

### Error Responses

| Status | Code                      | Condition               |
| ------ | ------------------------- | ----------------------- |
| 400    | `VALIDATION_ERROR`        | Missing/invalid fields  |
| 401    | `UNAUTHORIZED`            | Missing/invalid JWT     |
| 409    | `DUPLICATE_JERSEY_NUMBER` | Jersey already taken    |
| 500    | `INTERNAL_ERROR`          | Unexpected server error |

### Side Effects

1. Sets `User.onboardingCompletedAt` to current timestamp.
2. If `isPlayer=true`, creates or updates linked `Player` record and links `User.playerId`.
3. If `isPlayer=false`, leaves `User.playerId` as `null`.
4. Endpoint is idempotent for already-completed onboarding.
