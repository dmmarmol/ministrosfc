# Quickstart: Ministros FC Local Development

**Version**: 1.0 | **Date**: March 17, 2026 | **Purpose**: Get CMS and Frontend running locally

---

## Prerequisites

- **Node.js**: v23 or higher (check with `node -v`)
- **npm**: v8 or higher (check with `npm -v`)
- **Docker**: Docker Desktop or equivalent (for PostgreSQL, Redis)
- **Git**: For version control

**Install Node.js**: https://nodejs.org/ (recommended: LTS version)  
**Install Docker**: https://www.docker.com/products/docker-desktop

---

## Project Structure

```
ministrosfc/
├── packages/
│   ├── shared/          # TypeScript types & utilities
│   ├── cms/             # Express backend API
│   └── frontend/        # Nuxt.js application
├── specs/               # Specifications & planning
├── docker-compose.yml   # PostgreSQL + Redis setup
├── package.json         # Root monorepo config
└── README.md
```

---

## Step 1: Clone Repository

```bash
git clone <repository-url> ministrosfc
cd ministrosfc
```

---

## Step 2: Install Dependencies

Install dependencies for all packages in the monorepo:

```bash
npm install
```

This command:

- Installs dependencies in root `node_modules/`
- Installs dependencies in each package (`packages/shared`, `packages/cms`, `packages/frontend`)
- Npm workspaces automatically link local packages (e.g., `@ministrosfc/shared`)

---

## Step 3: Start Docker Services

Start PostgreSQL and Redis locally:

```bash
npm run docker:up
```

Verify services are running:

```bash
docker ps
```

You should see:

- `ministrosfc-postgres` (port 5432)
- `ministrosfc-redis` (port 6379)

---

## Step 4: Setup Environment Variables

### Create CMS .env

```bash
cd packages/cms
cp .env.example .env
```

Edit `packages/cms/.env` and set:

```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/ministrosfc"

# JWT & Auth
JWT_SECRET="your-super-secret-jwt-key-min-32-characters-long"
JWT_EXPIRY=86400
REFRESH_TOKEN_EXPIRY=2592000

# Server
NODE_ENV=development
PORT=3001
CORS_ORIGIN="http://localhost:3000"

# Redis
REDIS_URL="redis://localhost:6379"
```

### Create Frontend .env

```bash
cd ../frontend
cp .env.example .env
```

Edit `packages/frontend/.env` and set:

```env
NUXT_PUBLIC_API_BASE_URL="http://localhost:3001/api/v1"
NODE_ENV=development
```

---

## Step 5: Initialize Database

Create database schema and run migrations:

```bash
cd packages/cms
npm run db:migrate
```

Expected output:

```
✓ Applied migration 001_initial_schema (123ms)
```

---

## Step 6: Seed Database (Optional)

Populate the database with sample data:

```bash
npm run db:seed
```

This creates:

- 1 admin user (admin@ministrosfc.com / password: Admin@123456)
- 1 editor user (editor@ministrosfc.com / password: Editor@123456)
- 1 player user (player1@ministrosfc.com / password: Player@123456)
- 20 sample players
- 5 sample games (past and upcoming)
- 2 sample tournaments

---

## Step 7: Start Development Servers

From the repository root, start both CMS and Frontend concurrently:

```bash
cd ../..
npm run dev
```

Expected output:

```
[cms] Server running on http://localhost:3001
[cms] API available at http://localhost:3001/api/v1

[frontend] Listening on http://localhost:3000
[frontend] ➜  local:   http://localhost:3000
```

Both servers are now running:

- **CMS API**: http://localhost:3001
- **Frontend**: http://localhost:3000

---

## Step 8: Access the Applications

### Frontend

Open http://localhost:3000 in your browser.

**Public pages** (no login required):

- Homepage: http://localhost:3000/
- Roster: http://localhost:3000/roster
- Schedule: http://localhost:3000/games
- Statistics: http://localhost:3000/statistics

**Authenticated pages** (requires login):

- My Games: http://localhost:3000/my-games (player only)
- Login: http://localhost:3000/login

### CMS API

Test API endpoints via curl or Postman:

**Login** (get access token):

```bash
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ministrosfc.com",
    "password": "Admin@123456"
  }'
```

Response:

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "...",
    "user": {
      "id": "...",
      "email": "admin@ministrosfc.com",
      "name": "Admin User",
      "role": "ADMIN"
    },
    "expiresIn": 86400
  }
}
```

**List Players**:

```bash
curl http://localhost:3001/api/v1/players
```

**Create Player** (Admin only):

```bash
curl -X POST http://localhost:3001/api/v1/players \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <accessToken>" \
  -d '{
    "name": "New Player",
    "position": "FORWARD",
    "jerseyNumber": 20,
    "dateOfBirth": "1995-06-15"
  }'
```

**List Games**:

```bash
curl http://localhost:3001/api/v1/games
```

See [API Contracts](contracts/) directory for complete endpoint documentation.

---

## Step 9: Run Tests

### Unit & Integration Tests (CMS)

```bash
cd packages/cms
npm run test
```

Watch mode (re-run tests on file changes):

```bash
npm run test:watch
```

### Frontend Component Tests

```bash
cd packages/frontend
npm run test
```

### End-to-End Tests (Frontend)

```bash
npm run test:e2e
```

---

## Step 10: Build for Production

### Build CMS

```bash
cd packages/cms
npm run build
```

Output: `dist/` directory with compiled JavaScript

### Build Frontend

```bash
cd packages/frontend
npm run build
```

Output: `.nuxt/` and `dist/` directories

### Build All Packages

```bash
cd ../..
npm run build
```

---

## Development Workflow

### Code Changes

1. **Edit code** in any package (shared, cms, frontend)
2. **Dev servers auto-reload** on save (Nodemon for CMS, HMR for Nuxt)
3. **No manual linking needed** (npm workspaces handle it)

### Adding Dependencies

To add a new dependency to CMS:

```bash
cd packages/cms
npm install express-validator
```

Dependency added to `packages/cms/package.json` and root `package-lock.json`.

### Accessing Shared Types

Both CMS and Frontend can import from `@ministrosfc/shared`:

```typescript
// In packages/cms/src/services/PlayerService.ts
import { PlayerType, Position } from "@ministrosfc/shared";

// In packages/frontend/src/composables/usePlayers.ts
import { PlayerType } from "@ministrosfc/shared";
```

No build step needed; TypeScript resolves via tsconfig paths.

---

## Troubleshooting

### Port Already in Use

If port 3000 or 3001 is already in use:

```bash
# Find process on port 3000
lsof -i :3000

# Kill process (macOS/Linux)
kill -9 <PID>

# Or change port in .env
PORT=3002
```

### Database Connection Error

If CMS fails to connect to PostgreSQL:

```bash
# Check PostgreSQL is running
docker ps | grep postgres

# If not running, start docker
npm run docker:up

# Check DATABASE_URL in .env
cat packages/cms/.env | grep DATABASE_URL
```

### Redis Connection Error

If CMS fails to connect to Redis:

```bash
# Check Redis is running
docker ps | grep redis

# Test Redis connection
docker exec ministrosfc-redis redis-cli ping
# Should respond: PONG
```

### Frontend Can't Reach API

If frontend shows "Failed to connect to API":

1. Verify CMS is running: http://localhost:3001/api/v1/health
2. Check `NUXT_PUBLIC_API_BASE_URL` in `packages/frontend/.env`
3. Verify CORS is enabled in CMS (should allow localhost:3000)

### Migration Fails

If database migration fails:

```bash
# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Or view migration status
npx prisma migrate status
```

---

## Useful Commands

| Command               | Purpose                             |
| --------------------- | ----------------------------------- |
| `npm run dev`         | Start CMS and Frontend concurrently |
| `npm run build`       | Build all packages                  |
| `npm run test`        | Run all tests                       |
| `npm run lint`        | Lint all packages                   |
| `npm run docker:up`   | Start PostgreSQL and Redis          |
| `npm run docker:down` | Stop PostgreSQL and Redis           |
| `npm run db:migrate`  | Run database migrations             |
| `npm run db:seed`     | Populate database with sample data  |

---

## API Documentation

For detailed API endpoint specifications, see:

- [Authentication Contract](contracts/auth-contract.md)
- [Players Contract](contracts/player-contract.md)
- [Games Contract](contracts/game-contract.md)
- [Tournaments & Statistics Contract](contracts/tournament-contract.md)

---

## Next Steps

1. **Explore Frontend**: Visit http://localhost:3000, login with credentials from seed data
2. **Test API**: Use Postman or curl to test endpoints (see examples above)
3. **Review Code**: Check `packages/cms/src` for backend structure, `packages/frontend/src` for frontend
4. **Modify Data**: Create new players, games, tournaments via API
5. **Run Tests**: Execute test suites to verify existing functionality

---

## Common Development Tasks

### Add a New API Endpoint

1. Create route handler in `packages/cms/src/routes/`
2. Create service method in `packages/cms/src/services/`
3. Add TypeScript types to `packages/shared/src/types/`
4. Deploy types to shared: types auto-available to frontend
5. Write tests in `packages/cms/tests/`

### Add a New Frontend Page

1. Create page component in `packages/frontend/src/pages/`
2. Create composable in `packages/frontend/src/composables/` for API calls
3. Create components in `packages/frontend/src/components/`
4. Import types from `@ministrosfc/shared`

### Update Database Schema

1. Modify `packages/cms/prisma/schema.prisma`
2. Run `npm run db:migrate -- --name descriptive_name`
3. Prisma types auto-update
4. Regenerate client: `npx prisma generate`

---

## Stopping Development

To stop development servers:

```bash
# Stop dev servers (Ctrl+C in terminal)

# Stop Docker services
npm run docker:down

# Verify containers stopped
docker ps
```

---

## Getting Help

- Check `.specify/memory/constitution.md` for architectural principles
- Review [Data Model](data-model.md) for entity definitions
- See [API Contracts](contracts/) for endpoint specifications
- Check `README.md` in each package for package-specific guidance

---

## Ready to Code!

You now have:
✅ CMS API running on http://localhost:3001  
✅ Frontend running on http://localhost:3000  
✅ PostgreSQL database seeded with sample data  
✅ Redis cache running  
✅ Hot-reload development environment

Start building features! 🚀
