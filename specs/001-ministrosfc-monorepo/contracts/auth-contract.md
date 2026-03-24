# API Contract: Authentication

**Version**: 1.0 | **Date**: March 17, 2026 | **Status**: Complete

---

## Overview

The Ministros FC API uses JWT (JSON Web Token) based authentication. Users authenticate with email/password and receive access and refresh tokens. Tokens are stored in HttpOnly cookies (for web) or localStorage (for SPA).

---

## Endpoints

### POST /api/v1/auth/login

Authenticate user with email and password. Returns access token and refresh token.

**Request**

```json
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "admin@ministrosfc.com",
  "password": "SecurePassword123"
}
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": "user-123",
      "email": "admin@ministrosfc.com",
      "name": "Admin User",
      "role": "ADMIN"
    },
    "expiresIn": 86400
  }
}
```

**Response - Failure (401 Unauthorized)**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "Email or password is incorrect"
  },
  "statusCode": 401
}
```

**Validation**

- `email`: Required, valid email format.
- `password`: Required, 8+ characters.

**Notes**

- Access token expires in 24 hours (86400 seconds).
- Refresh token expires in 30 days and is stored in Redis.
- Failed login attempts logged (rate-limiting recommended for production: max 5 attempts per IP per 15 min).

---

### POST /api/v1/auth/refresh

Refresh expired access token using refresh token.

**Request**

```json
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 86400
  }
}
```

**Response - Failure (401 Unauthorized)**

```json
{
  "success": false,
  "error": {
    "code": "INVALID_REFRESH_TOKEN",
    "message": "Refresh token is expired or invalid"
  },
  "statusCode": 401
}
```

**Notes**

- Requires valid refresh token (not expired, present in Redis).
- Returns new access token only (refresh token remains same).

---

### POST /api/v1/auth/logout

Invalidate current session (delete tokens from Redis).

**Request**

```json
POST /api/v1/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response - Success (200 OK)**

```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Response - Failure (401 Unauthorized)**

```json
{
  "success": false,
  "error": {
    "code": "UNAUTHORIZED",
    "message": "No valid authentication token provided"
  },
  "statusCode": 401
}
```

**Notes**

- Requires valid access token in Authorization header.
- Deletes refresh token from Redis, preventing further token refreshes.

---

## Authentication Header

All protected endpoints require the Authorization header:

```
Authorization: Bearer <accessToken>
```

**Token Format**: JWT with HMAC-SHA256 signing.

**Payload Structure**

```json
{
  "sub": "user-123",
  "email": "admin@ministrosfc.com",
  "role": "ADMIN",
  "iat": 1710705600,
  "exp": 1710792000
}
```

---

## Error Codes

| Code                    | HTTP Status | Meaning                                                |
| ----------------------- | ----------- | ------------------------------------------------------ |
| `INVALID_CREDENTIALS`   | 401         | Email or password incorrect                            |
| `INVALID_REFRESH_TOKEN` | 401         | Refresh token expired or not found                     |
| `UNAUTHORIZED`          | 401         | No token provided or token invalid                     |
| `FORBIDDEN`             | 403         | User lacks permission for endpoint                     |
| `TOKEN_EXPIRED`         | 401         | Access token expired (client should use refresh token) |
| `INTERNAL_ERROR`        | 500         | Server error during auth processing                    |

---

## Security Considerations

1. **HTTPS Only**: All auth endpoints must use HTTPS in production (no http://).
2. **Password Hashing**: Passwords hashed with bcrypt (cost factor 12) before storage.
3. **Token Signing**: JWT tokens signed with strong secret (64+ character random key).
4. **HttpOnly Cookies** (future): Tokens can be stored in HttpOnly cookies to prevent XSS attacks.
5. **CORS**: Auth endpoints allow cross-origin requests from specific origins only (production frontend domain + localhost in development); credentials (cookies/auth headers) allowed.
6. **Rate Limiting**: Login endpoint rate-limited via express-rate-limit (in-memory) to prevent brute-force attacks (5 attempts per IP per 15 min).

---

## Role-Based Access Control (RBAC)

**Roles Define Permissions**:

- **ADMIN**: Can create, read, update, delete all resources (users, players, games, tournaments).
- **EDITOR**: Can read all, update games/statistics/tournaments, but cannot create/delete or manage users.
- **PLAYER**: Can read own data and update participation status for games assigned to them.

**RBAC Middleware**: All protected endpoints include middleware checking `req.user.role` against endpoint requirements.

**Example**:

```
POST /api/v1/players (create)
  Required role: ADMIN
  Response: 403 Forbidden if user.role !== 'ADMIN'
```

---

## Implementation Notes

- JWT signed using HS256 algorithm (symmetric, secret key stored in environment variable).
- Token validation happens in auth middleware before reaching route handlers.
- Refresh tokens stored in Redis with key format: `refresh_token:{userId}`, value: `{token}`.
- Session invalidation (logout) removes refresh token from Redis; access token remains valid until expiry (can be mitigated with token blacklist in production).

---

## Testing

**Test Cases**:

1. Login with valid credentials → 200 OK, tokens returned.
2. Login with invalid password → 401 Unauthorized.
3. Login with non-existent email → 401 Unauthorized.
4. Refresh with valid token → 200 OK, new access token.
5. Refresh with expired refresh token → 401 Unauthorized.
6. Access protected endpoint without token → 401 Unauthorized.
7. Access protected endpoint with invalid token → 401 Unauthorized.
8. Logout invalidates refresh token → subsequent refresh fails.

---

## Future Enhancements

- Two-factor authentication (2FA) support.
- OAuth 2.0 integration (e.g., login with Google, GitHub).
- Single sign-on (SSO) for admin users.
- Token blacklist for immediate logout (token still valid until expiry without this).
