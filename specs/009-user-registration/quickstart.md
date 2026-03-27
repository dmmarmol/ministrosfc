# Quickstart: 009 — User Registration & Sign-In

**Branch**: `feat/009-user-registration`

---

## Prerequisites

- Node.js 18+ (LTS)
- PostgreSQL running on port 5100
- Redis running on port 5101
- Docker/Podman for local services (`npm run docker:up`)

## Setup

```bash
# 1. Start services
npm run docker:up

# 2. Install dependencies
npm install

# 3. Generate Prisma client
npm run gen:prisma

# 4. Run migrations
npm run prisma:migrate --workspace=@ministrosfc/cms

# 5. Start dev servers
npm run dev:all
```

- CMS: http://localhost:5102
- Frontend: http://localhost:5103

## Environment Variables (new for this feature)

Add to `packages/cms/.env`:

```env
# Existing
DATABASE_URL=postgresql://ministros:ministros@localhost:5100/ministrosfc
REDIS_URL=redis://localhost:5101
JWT_SECRET=your-secret-here
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# New for Google OAuth (FR-008–FR-011)
GOOGLE_CLIENT_ID=<from Google Cloud Console>
GOOGLE_CLIENT_SECRET=<from Google Cloud Console>
GOOGLE_REDIRECT_URI=http://localhost:5102/api/v1/auth/google/callback
```

**Google OAuth setup:**

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select project → APIs & Services → Credentials
3. Create OAuth 2.0 Client ID (Web application)
4. Authorized redirect URI: `http://localhost:5102/api/v1/auth/google/callback`
5. Copy Client ID and Client Secret to `.env`

## Testing

```bash
# Run all tests
npm run test:all

# CMS tests only
npm test --workspace=@ministrosfc/cms

# Frontend tests only
npm test --workspace=@ministrosfc/frontend

# E2E tests
npm run test:e2e --workspace=@ministrosfc/frontend
```

## Key Endpoints (new/modified)

| Method | Path                                    | Auth    | Description                                |
| ------ | --------------------------------------- | ------- | ------------------------------------------ |
| POST   | `/api/v1/auth/register`                 | Public  | Email registration (creates User + Player) |
| GET    | `/api/v1/auth/google`                   | Public  | Initiate Google OAuth flow                 |
| GET    | `/api/v1/auth/google/callback`          | Public  | Google OAuth callback                      |
| GET    | `/api/v1/profile`                       | JWT     | Get authenticated user's profile           |
| PATCH  | `/api/v1/profile`                       | JWT     | Update profile fields                      |
| PUT    | `/api/v1/profile/photo`                 | JWT     | Upload profile photo                       |
| GET    | `/api/v1/profile/jersey-availability`   | JWT     | Get taken jersey numbers                   |
| GET    | `/api/v1/admin/users`                   | ADMIN   | List users with roles                      |
| PATCH  | `/api/v1/admin/users/:id/role`          | ADMIN   | Promote/demote user role                   |
| PATCH  | `/api/v1/admin/users/:id/player-status` | EDITOR+ | Activate/deactivate player                 |
| DELETE | `/api/v1/admin/users/:id/player`        | ADMIN   | Hard-delete player                         |

## Key Frontend Pages (new/modified)

| Path                    | Description                                       |
| ----------------------- | ------------------------------------------------- |
| `/login`                | MODIFIED — sign-in/sign-up toggle + Google button |
| `/auth/google/callback` | NEW — Google OAuth token receiver                 |
| `/profile`              | NEW — user profile with edit + jersey SVG         |
| `/admin/users`          | NEW — admin user management (role mgmt)           |

## Database Migrations

Two migrations will be generated:

1. **`split_user_name_fields`** (custom SQL): Splits `User.name` and `Player.name` into `firstName` + `lastName`, adds `Player.address`
2. **`add_dt_role_google_auth`**: Adds `DT` to Role enum, `User.googleSubjectId`, makes `User.passwordHash` nullable

## New Dependency

| Package               | Why                                                                           |
| --------------------- | ----------------------------------------------------------------------------- |
| `google-auth-library` | Google OAuth Authorization Code flow — token exchange + ID token verification |

Install: `npm install google-auth-library --workspace=@ministrosfc/cms`
