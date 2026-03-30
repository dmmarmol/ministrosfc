# Contract: Auth Registration

**Spec**: [spec.md](../spec.md) | **FRs**: FR-001 to FR-007, FR-012 to FR-017, FR-031 to FR-037

---

## POST /api/v1/auth/register

**Purpose**: Create a new user account via email + password and start unified onboarding flow.

**Auth**: None (public)
**Rate limit**: 5 requests per 15 minutes per IP

### Request

```json
{
  "email": "jugador@ejemplo.com",
  "password": "MiClave123!",
  "passwordConfirmation": "MiClave123!",
  "firstName": "Juan",
  "lastName": "Pérez",
  "isPlayer": true
}
```

**Validation (Zod):**

- `email`: valid email format, max 255 chars
- `password`: 8–128 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char (shared `passwordSchema`)
- `passwordConfirmation`: must match `password`
- `firstName`: 1–255 chars, trimmed
- `lastName`: 1–255 chars, trimmed
- `isPlayer`: optional boolean, defaults to `true`

### Response — 201 Created

```json
{
  "data": {
    "user": {
      "id": "uuid",
      "email": "jugador@ejemplo.com",
      "firstName": "Juan",
      "lastName": "Pérez",
      "role": "PLAYER",
      "onboardingCompletedAt": null
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ...",
    "nextStep": "/auth/onboarding"
  }
}
```

### Error Responses

| Status | Code               | Condition                                           |
| ------ | ------------------ | --------------------------------------------------- |
| 400    | `VALIDATION_ERROR` | Invalid email, weak password, mismatch, blank names |
| 409    | `CONFLICT`         | Email already registered                            |
| 429    | `RATE_LIMITED`     | Too many registration attempts                      |

### Side Effects

1. Creates `User` record with `role=PLAYER`, `passwordHash` (bcrypt, cost 12)
2. Sets `onboardingCompletedAt = null`
3. Stores initial `isPlayer` preference for onboarding prefill (optional implementation detail)
4. Stores refresh token in Redis with 30d TTL (`session:refresh:{token}`)
5. Returns `nextStep` pointing to `/auth/onboarding`
6. `Player` record creation is deferred to onboarding completion endpoint

---

## POST /api/v1/auth/login (EXISTING — updated schema)

**Changes**: Request body uses `email` + `password` (unchanged). Response returns `firstName` + `lastName` instead of `name`.

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
      "onboardingCompletedAt": "2026-03-25T14:00:00.000Z"
    },
    "accessToken": "eyJ...",
    "refreshToken": "eyJ..."
  }
}
```

**Note**: Deactivated players (Player.status=INACTIVE) CAN still log in (FR-016). The login endpoint does not check Player status.

---

## POST /api/v1/auth/refresh (EXISTING — unchanged)

No changes. Returns new token pair.

---

## POST /api/v1/auth/logout (EXISTING — unchanged)

No changes. Removes refresh token from Redis.
