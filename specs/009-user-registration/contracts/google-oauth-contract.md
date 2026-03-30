# Contract: Google OAuth

**Spec**: [spec.md](../spec.md) | **FRs**: FR-008 to FR-011, FR-032 to FR-037
**Research**: [research.md](../research.md#topic-1)

---

## GET /api/v1/auth/google

**Purpose**: Initiate Google OAuth Authorization Code flow. Redirects the browser to Google's consent screen.

**Auth**: None (public)

### Request

No body. Browser navigation (link or `window.location`).

### Response — 302 Found

```
Location: https://accounts.google.com/o/oauth2/v2/auth?
  client_id=GOOGLE_CLIENT_ID&
  redirect_uri=http://localhost:5102/api/v1/auth/google/callback&
  response_type=code&
  scope=openid+email+profile&
  prompt=select_account&
  state=<csrf_token>
```

**CSRF protection**: Generate a random `state` parameter, store in a short-lived cookie (5 min, httpOnly, sameSite=lax). Validate on callback.

---

## GET /api/v1/auth/google/callback

**Purpose**: Google redirects here after user consents. Exchanges authorization code for tokens, creates/links user account, redirects to frontend.

**Auth**: None (Google redirect)

### Request (query params)

```
?code=4/0AX4X...&state=<csrf_token>
```

### Processing

1. Validate `state` matches the cookie → 403 if mismatch
2. Exchange `code` for tokens via `google-auth-library` `OAuth2Client.getToken(code)`
3. Verify ID token → extract `sub`, `email`, `given_name`, `family_name`
4. Account resolution:
   a. Find User by `googleSubjectId` = `sub` → sign in existing account
   b. Find User by `email` → link `googleSubjectId`, sign in
   c. No match → create User (`passwordHash=null`, `googleSubjectId=sub`, `role=PLAYER`, `onboardingCompletedAt=null`) → sign in
5. Generate JWT access token + refresh token (same as login/register)
6. Store refresh token in Redis (30d TTL)
7. Redirect to frontend callback where onboarding gate decides next route

### Response — 302 Found

Redirect to frontend with tokens:

```
Location: http://localhost:5103/auth/google/callback?token=<accessToken>&refresh=<refreshToken>
```

### Error Responses

| Status                                | Condition                                                      |
| ------------------------------------- | -------------------------------------------------------------- |
| 302 → `/login?error=google_cancelled` | User cancelled Google consent (`error=access_denied` in query) |
| 302 → `/login?error=google_failed`    | Token exchange or verification failed                          |
| 302 → `/login?error=csrf_mismatch`    | State parameter doesn't match cookie                           |

Note: Errors redirect to frontend login page with error query param (not JSON), since this is a browser redirect flow.

---

## Frontend: /auth/google/callback (Nuxt page)

**Purpose**: Receive JWT tokens from the CMS callback redirect, store in auth state, navigate to landing page.

### Logic

```
1. Read `token` and `refresh` from route.query
2. Read `error` from route.query (if present → redirect to /login with error toast)
3. Store tokens in auth store (same as login flow)
4. Decode access token to get user info (or fetch /api/v1/auth/me)
5. Clear query params from URL
6. Call onboarding status endpoint
7. Navigate to `/auth/onboarding` when incomplete, else role-appropriate landing page
```

### Error display (on /login)

| Error param        | Spanish message                                         |
| ------------------ | ------------------------------------------------------- |
| `google_cancelled` | "Inicio de sesión con Google cancelado"                 |
| `google_failed`    | "Error al iniciar sesión con Google. Intentá de nuevo." |
| `csrf_mismatch`    | "Error de seguridad. Intentá de nuevo."                 |

---

## Environment Variables (new)

```env
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=http://localhost:5102/api/v1/auth/google/callback
```

Add to CMS `src/config/auth.ts`:

```ts
googleClientId: process.env.GOOGLE_CLIENT_ID ?? "",
googleClientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:5102/api/v1/auth/google/callback",
```
