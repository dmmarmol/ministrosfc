# Phase 0 Research: Technical Decisions for Ministros FC Monorepo

**Date**: March 17, 2026 | **Status**: Complete | **Purpose**: Resolve all NEEDS CLARIFICATION technical decisions

---

## 1. Database Technology: PostgreSQL

### Decision

**CHOSEN: PostgreSQL 15+**

### Rationale

- **RBAC & Complex Queries**: Ministros FC requires role-based access control, complex joins for statistics aggregation (players ← games ← tournaments), and queries with multiple filters (by date, opponent, status, season). PostgreSQL excels at complex relational queries.
- **Data Integrity**: Tournament standings and statistics aggregations require ACID transactions to ensure consistency when updating game scores. PostgreSQL provides strong consistency guarantees.
- **Team Preferences**: Most Node.js teams default to PostgreSQL for relational data requiring type safety (can be validated at DB schema level).
- **Ecosystem**: Superior TypeORM/Prisma support. More comprehensive monitoring and logging tools in Node.js ecosystem.
- **Performance**: Indexing on (playerId, tournamentId), (gameId), and (status, date) provides <100ms queries for statistics aggregation and filtering (meets <500ms API requirement).
- **Development**: Free and open-source. Excellent Docker support for local development (docker-compose with PostgreSQL, Redis).

### Alternatives Considered

- **MongoDB**: Flexible schema suitable for v1 single-team install, but:
  - Weaker ACID guarantees without transactions (PostgreSQL 15 has savepoints for precise rollback).
  - Relational queries (join player → game → tournament → stats) require multiple database calls in MongoDB, increasing latency.
  - Less mature TypeORM support; Mongoose adds overhead.
  - Team less familiar with NoSQL optimization patterns.
  - **Decision: NOT CHOSEN**

- **SQLite**: Suitable for development-only but:
  - Single-writer limitation problematic for concurrent admin users (SC-004: handle 50+ concurrent admins).
  - Production deployments require file storage on durable hardware with replication—defeats purpose of SQLite simplicity.
  - **Decision: NOT CHOSEN** (useful as development database)

---

## 2. ORM Framework: Prisma

### Decision

**CHOSEN: Prisma 5.x**

### Rationale

- **Type Safety**: Prisma generates TypeScript types directly from schema. Code generation from schema → types is automatically in sync, preventing type mismatches with shared package.
- **Schema as Source of Truth**: Single prisma.schema file defines database models and relationships. Migrations auto-generated, preventing SQL drift.
- **Developer Experience**: Prisma Studio provides GUI for data inspection during development, useful for debugging complex RBAC and tournament standing calculations.
- **Composable Queries**: Prisma's select/where/include patterns are more readable than SQL string construction. Easier for team to review RBAC queries in code review.
- **Ecosystem Maturity**: Prisma has excellent documentation, large community, well-tested for production use (used by Vercel, Slack building blocks, many SaaS).
- **Compatibility**: Works seamlessly with Jest, provides test data seeding via prisma/seed.js.

### Alternatives Considered

- **TypeORM**: More flexible (supports decorators, migrations via separate files) but:
  - Decorator-based syntax adds complexity vs Prisma's schema language.
  - Separate migration files can drift from type definitions without discipline.
  - More configuration required for relations and indexes.
  - **Decision: NOT CHOSEN** (TypeORM more suitable for complex microservice setups)

- **Knex.js**: Lower-level query builder, suitable for simple queries but:
  - Type generation requires additional plugins (typescript-plugin-etc).
  - Manual migration management prone to human error.
  - Less helpful for rapid API endpoint generation.
  - **Decision: NOT CHOSEN**

---

## 3. Caching Strategy: Redis + HTTP Cache Headers

### Decision

**CHOSEN: Hybrid approach using Redis for sessions and strategic HTTP caching**

### Rationale

- **Session Storage**: JWT tokens stored in Redis with 24-hour expiration (per spec). Enables token revocation (logout) and refresh token validation.
- **Statistics Caching**: Player statistics aggregations cached in Redis with 5-minute TTL. Re-calculated on game completion or manual admin trigger (PATCH /api/games/{id}). Reduces database load for frequent statistics queries.
- **API Response Headers**: Public endpoints (/api/players, /api/games on GET) include Cache-Control headers (5-min max-age for unauthenticated clients). Frontend can cache aggressively, reducing API calls.
- **Performance Impact**: Statistics aggregation (top scorers, tournament standings) goes from <500ms PostgreSQL query to cached <50ms Redis lookup. Meets SC-009 requirement (5-second tournament standings calculation after game completion).

### Implementation Details

- **Technology**: Redis 7.x with ioredis Node.js client library.
- **Local Development**: redis-stack-server via Docker (includes Redis Insight GUI).
- **Invalidation Strategy**:
  - When admin records game result: invalidate tournament standings cache, player statistics cache.
  - When admin edits player: invalidate player cache key only.
  - When admin creates/deletes player: invalidate roster cache.

### Alternatives Considered

- **In-Memory Caching Only**: Node.js lru-cache or similar:
  - Each CMS instance has separate cache. Multi-instance deployments have cache inconsistencies.
  - No cache sharing across CMS instances during scaling.
  - Suitable for v1 single-instance, but hampers future scaling.
  - **Decision: NOT CHOSEN for production, acceptable for v1 development-only**

- **Memcached**: Similar to Redis but:
  - Less rich data structures (no cache expiration, no pub/sub).
  - Requires more boilerplate for complex cache patterns.
  - Redis more commonly paired with Node.js in industry.
  - **Decision: NOT CHOSEN**

---

## 4. Testing Framework: Jest + Playwright

### Decision

**CHOSEN: Jest for unit/integration CMS tests + Playwright for Frontend E2E tests**

### Rationale

- **Jest Configuration**:
  - Industry standard for Node.js and Frontend testing.
  - Excellent TypeScript support via ts-jest preset (no separate configuration).
  - Parallel test execution (runs 50+ CMS tests in <5 seconds locally).
  - Built-in mocking, snapshot testing, and coverage reporting.
  - Test database: Use ephemeral SQLite (prisma.sqlite-test) per Jest worker, transactions for isolation (faster than PostgreSQL per-test setup).

- **Playwright for Frontend E2E**:
  - Headless browser automation for testing real user workflows (e.g., player login → confirm game participation → verify on admin dashboard).
  - Supports multiple browsers (Chrome, Firefox, Safari) in CI for comprehensive coverage.
  - Better than Cypress for monorepo (can wait for both CMS and Frontend to start via docker-compose).

- **TDD Enforcement**: Pre-commit hooks via husky enforce tests pass before commit (supports SC-004: all tests pass before code review).

### Coverage Targets

- **CMS Backend**: 80% unit/integration coverage (services, middleware, route handlers).
- **Frontend**: 60% component coverage (critical components: PlayerCard, GameSchedule, LoginForm) + 100% E2E coverage for core user flows (login, confirm participation, view roster).

### Alternatives Considered

- **Vitest**: Faster than Jest but:
  - Newer, smaller ecosystem for monorepo setups.
  - Team likely more familiar with Jest.
  - **Decision: NOT CHOSEN (Vitest is competitive for future optimization)**

- **Mocha + Chai**: Lower-level, requires more boilerplate:
  - Jest is more batteries-included.
  - **Decision: NOT CHOSEN**

---

## 5. Frontend UI Library: Tailwind CSS + shadcn/ui

### Decision

**CHOSEN: Tailwind CSS v3 + shadcn/ui component library**

### Rationale

- **Tailwind CSS**:
  - Utility-first approach speeds up development (no context-switching between component files and CSS files).
  - Works seamlessly with Nuxt.js (via @nuxtjs/tailwindcss plugin).
  - Smaller bundle size than Bootstrap (only used utilities are included in final bundle).
  - Excellent mobile-first responsive design (meets FR-061).

- **shadcn/ui**:
  - Provides pre-built, accessible components (buttons, forms, modals, dropdowns) that can be customized.
  - Built on Radix UI primitives (proven accessibility).
  - Copy-paste component approach (not a dependency) allows modifications without constraints.
  - Tailwind-compatible styling out of the box.
  - Perfect for teams building custom design systems.

- **Performance**: Minimal JavaScript overhead (components are vanilla + Tailwind). Critical for SC-005 (frontend homepage <1s load time).

### Development Speed

- **With shadcn/ui**: Build component and page layouts in 30-50% less time vs custom CSS or Bootstrap templates.
- **Maintainability**: Tailwind's utility classes are self-documenting; no mystery CSS files.

### Alternatives Considered

- **Vuetify**: Material Design components for Vue:
  - Heavier JavaScript bundle (~300KB gzipped).
  - Less flexibility for custom designs.
  - **Decision: NOT CHOSEN** (shadcn/ui lighter weight)

- **Bootstrap**: CSS-first responsive framework:
  - Overkill for modern app needing custom branding.
  - Larger CSS footprint.
  - **Decision: NOT CHOSEN**

- **Unheadless UI (Headless UI)**: Provides only unstyled components:
  - Requires more manual styling.
  - Good for teams wanting full design control; Ministros FC benefits from shadcn's pre-built UI patterns.
  - **Decision: NOT CHOSEN**

---

## 6. Error Handling & Logging: Pino + API Error Codes

### Decision

**CHOSEN: Pino for structured logging + Custom error code mapping**

### Rationale

- **Pino Logger**:
  - Extremely fast structured JSON logging (optimal for high-throughput APIs).
  - Built-in log levels (debug, info, warn, error) and contextual fields (requestId, userId, role).
  - Works with Winston but Pino more lightweight.
  - Integrates well with APM tools (Datadog, New Relic, Sentry).

- **Error Code Mapping**:
  - Define error codes in @ministrosfc/shared/types/ErrorCode.ts (e.g., PLAYER_NOT_FOUND, UNAUTHORIZED, INVALID_GAME_DATE).
  - API responses include error code + human-readable message + context (invalid field, etc).
  - Frontend can show localized error messages based on error code.
  - Example: `{ error: "UNAUTHORIZED", message: "User lacks permission to edit game", statusCode: 403 }`

- **Production Observability**: Structured logs enable filtering in log aggregation (e.g., grep for "RBAC_VIOLATION" to find authorization issues).

### Logging Strategy

- **CMS Backend**:
  - Log all auth failures (attempts with invalid token, role mismatch).
  - Log statistics calculations (when triggered, duration, result).
  - Log database errors with full stack trace for debugging.

- **Frontend**: Client-side error logging (Sentry integration optional for v1, can add in Phase 2).

### Alternatives Considered

- **Winston**: More features, larger configuration surface:
  - Pino simpler for most use cases and faster.
  - **Decision: NOT CHOSEN** (Winston good for multi-transport complex setups)

- **Bunyan**: Structured logging pioneer:
  - Now superseded by Pino (faster, simpler API).
  - **Decision: NOT CHOSEN**

---

## 7. Deployment & Infrastructure: Docker + Vercel/Self-Hosted Flexibility

### Decision

**CHOSEN: Containerized approach with Docker; CMS deployable on any Node.js host; Frontend on Vercel or self-hosted Nuxt**

### Rationale

- **CMS Backend**:
  - Dockerfile for Express API (multi-stage build: build TypeScript, run compiled Node.js).
  - Environment variables for database URL, JWT secret, Redis URL, Node env (development|production).
  - Health check endpoint (/api/health) for container orchestration.
  - Stateless design (all state in PostgreSQL + Redis) enables horizontal scaling.

- **Frontend**:
  - Deployable to Vercel (recommended for fast CDN, serverless functions, Analytics) OR self-hosted Nuxt server.
  - Nuxt auto-detects deployment target via nuxt.config.ts (Vercel, Node.js preset).
  - Environment variables for CMS API base URL (per-deployment).

- **Development**: Local `docker-compose.yml` with PostgreSQL, Redis, CMS, Frontend enables full-stack local development.

### Environment Management

- `.env.example` committed to git (shows required variables).
- `.env` (actual values) gitignored.
- Production secrets managed by deployment platform (Vercel env vars, Docker secrets, AWS Secrets Manager, etc).

### Alternatives Considered

- **Heroku**: Simpler deployment but:
  - More expensive than self-hosted at scale.
  - Requires dyno credits; not ideal for long-running development team.
  - **Decision: NOT CHOSEN** (future option if team prefers managed hosting)

- **AWS Elastic Beanstalk**: More infrastructure to manage:
  - Overkill for MVP. Self-hosted or Vercel simpler.
  - **Decision: NOT CHOSEN** (future option for enterprise scaling)

---

## 8. Development Tools: npm Scripts + Concurrency

### Decision

**CHOSEN: Root package.json with workspace scripts; local development via turbo or npm workspaces concurrency**

### Rationale

- **Root package.json Scripts**:

  ```json
  {
    "scripts": {
      "dev": "npm -ws run dev",
      "build": "npm -ws run build",
      "test": "npm -ws run test",
      "test:watch": "npm -ws run test:watch",
      "lint": "npm -ws run lint",
      "db:migrate": "cd packages/cms && npx prisma migrate dev",
      "db:seed": "cd packages/cms && npx prisma db seed",
      "docker:up": "docker-compose up -d",
      "docker:down": "docker-compose down"
    }
  }
  ```

- **Workspace Link**: npm workspaces auto-link local packages (no manual npm link needed).
  - Frontend can `import { PlayerType } from '@ministrosfc/shared'` without separate linking.
  - Changes to @ministrosfc/shared instantly available to dependent packages.

- **Monitoring Development**: `npm run dev` starts both CMS (port 5102) and Frontend (port 5103) concurrently.
  - Each outputs to console with namespace (e.g., `[cms] Server running on 5102`, `[frontend] Listening on 5103`).

### Alternatives Considered

- **Turbo**: Advanced monorepo caching:
  - Overkill for 3-package monorepo. Benefits appear >5 packages.
  - npm workspaces sufficient for MVP.
  - **Decision: NOT CHOSEN** (future optimization if monorepo grows)

- **Yarn workspaces**: Older standard:
  - npm 8+ workspaces mature enough; npm is default.
  - **Decision: NOT CHOSEN**

---

## 9. File Storage Strategy: External Object Storage

### Decision

**CHOSEN: External object storage with free tier (Cloudflare R2, Cloudinary, or Supabase Storage)**

### Rationale

- **Problem**: Player photo uploads (FR-014, FR-052) require persistent storage. Fly.io VMs have ephemeral filesystems—uploaded photos would be lost on VM restart or redeployment.
- **Scale**: < 100 images estimated total (small amateur team), making free tiers viable.
- **Recommended Options**:
  - **Cloudflare R2**: 10GB storage free forever, zero egress fees, S3-compatible API.
  - **Cloudinary**: 25GB storage + 25GB bandwidth/month free tier, image transformation CDN.
  - **Supabase Storage**: 1GB free forever, sufficient for 100 optimized images (<500KB each after resize).

- **Implementation**:
  - Player entity stores `photoUrl` (external URL from object storage), not local file path.
  - Upload flow: CMS receives multipart/form-data → validates file (JPG/PNG, max 5MB) → uploads to object storage → stores returned URL in database.
  - Frontend displays photos via `<img :src="player.photoUrl">` with CDN caching.

### Alternatives Considered

- **Fly.io Volumes**: Persistent disk storage ($0.15/GB/month):
  - Exceeds free tier budget.
  - **Decision: NOT CHOSEN**

- **Database BLOB storage**: Store images directly in PostgreSQL:
  - Increases backup size, slower queries, not recommended for files >1MB.
  - **Decision: NOT CHOSEN**

- **Local server storage**: Store in packages/cms/public/uploads/:
  - Lost on Fly.io VM restart (ephemeral filesystem).
  - **Decision: NOT CHOSEN for production** (acceptable for local dev only)

---

## 10. API Security: CORS Policy & Rate Limiting

### CORS Policy Decision

**CHOSEN: Specific origins with environment-based configuration**

### Rationale

- **Problem**: Frontend (Nuxt SSR on separate Fly.io VM or domain) calls Backend API (different origin). CORS headers required or browser blocks API calls.
- **Configuration**:
  - **Production**: Allow only production frontend domain (e.g., `https://ministrosfc.fly.dev`)
  - **Development**: Allow localhost origins (`http://localhost:5103`, `http://127.0.0.1:5103`)
  - **Credentials**: Enable `Access-Control-Allow-Credentials: true` for JWT cookie/header auth
- **Implementation**: Express CORS middleware with origin whitelist from environment variable.

```typescript
const allowedOrigins = process.env.CORS_ORIGINS?.split(",") || [
  "http://localhost:5103",
];
app.use(cors({ origin: allowedOrigins, credentials: true }));
```

### Alternatives Considered

- **Wildcard (\*)**: Allow all origins:
  - Insecure, enables CSRF attacks.
  - **Decision: NOT CHOSEN**

- **Same-origin only**: No CORS needed (backend/frontend on same domain via reverse proxy):
  - Requires more complex Fly.io infrastructure setup.
  - **Decision: NOT CHOSEN for MVP** (simpler to separate VMs)

---

### Rate Limiting Decision

**CHOSEN: In-memory rate limiting via express-rate-limit**

### Rationale

- **Problem**: JWT auth endpoints (/api/auth/login) vulnerable to brute-force attacks without rate limiting. Could also exhaust free tier Fly.io resources.
- **Configuration**:
  - Auth endpoints: 5 requests per IP per 15 minutes
  - API endpoints: 100 requests per IP per 15 minutes (general protection)
- **Implementation**: `express-rate-limit` middleware applied to specific routes.

```typescript
import rateLimit from "express-rate-limit";

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: "Too many login attempts, please try again later",
});

app.use("/api/auth/login", authLimiter);
```

- **Benefits**:
  - No infrastructure dependency (works without Redis)
  - Sufficient for single-VM MVP deployment
  - Low overhead (<1ms per request)

### Alternatives Considered

- **Redis-based rate limiting**: Distributed rate limiting across multiple instances:
  - Requires Redis setup, adds complexity.
  - Not needed for single-VM free tier deployment.
  - **Decision: DEFERRED** (future upgrade if scaling to multiple VMs)

- **Cloudflare Workers rate limiting**: Free tier 100k req/day with DDoS protection:
  - Requires Cloudflare DNS setup.
  - **Decision: DEFERRED** (future optimization if under attack)

- **No rate limiting**: Rely on monitoring only:
  - Unacceptable security risk.
  - **Decision: NOT ACCEPTABLE**

---

## 11. Tournament Scope Clarification: MVP Simplification

### Decision

**CHOSEN: Tournaments as categorization/grouping only (NOT full league management)**

### Rationale

- **MVP Scope**: System tracks only Ministros FC games (vs opponent teams), not all teams' results.
- **Tournament Entity**: Groups Ministros FC's own games by competition (e.g., "Spring League 2026", "Summer Cup 2026").
- **Statistics**: Aggregates Ministros FC player stats within tournament (goals, assists, appearances by tournament).
- **Out of Scope**: Full league standings calculation (tracking other teams' results, calculating league-wide positions).

### Implementation Impact

- **Tournament.standings field**: Removed from data model (FR-036 deferred post-MVP)
- **FR-037 modified**: Admins view tournament summaries showing Ministros FC's record (wins/draws/losses) + player stats, NOT full league table
- **Simplified database schema**: No need to model other teams' game results or multi-team standings logic
- **Future Enhancement**: Full league management (tracking all teams' results) can be added post-MVP as separate feature

### Workflow

1. Admin creates tournament: "Spring League 2026"
2. Admin schedules games (Ministros FC vs various opponents)
3. Admin associates games with tournament
4. After matchday, admin records match result (score, player stats)
5. System aggregates Ministros FC player statistics for that tournament
6. Frontend displays: "Spring League 2026 - 5 wins, 2 draws, 3 losses" + top scorers for tournament

### Alternatives Considered

- **Full league management**: Track all teams, calculate standings per FIFA rules (Win=3pts, Draw=1pt, tiebreakers):
  - Significantly more complex (requires modeling other teams' games)
  - Out of scope for MVP focused on Ministros FC team management
  - **Decision: DEFERRED POST-MVP**

---

## Summary & Implementation Next Steps

**All NEEDS CLARIFICATION items resolved:**

| Item             | Technology                                                       |
| ---------------- | ---------------------------------------------------------------- |
| Database         | PostgreSQL 15+                                                   |
| ORM              | Prisma 5.x                                                       |
| Caching          | Redis 7.x (sessions, statistics) + HTTP headers                  |
| Testing          | Jest (Node), Playwright (E2E)                                    |
| UI Library       | Tailwind CSS 3 + shadcn/ui                                       |
| Logging          | Pino (structured logs) + error code mapping                      |
| Deployment       | Docker + Fly.io (3 free VMs)                                     |
| Dev Tools        | npm workspaces + workspace scripts                               |
| File Storage     | External object storage (Cloudflare R2, Cloudinary, or Supabase) |
| CORS Policy      | Specific origins (prod domain + localhost in dev)                |
| Rate Limiting    | express-rate-limit (in-memory, no Redis dependency)              |
| Tournament Scope | Grouping/categorization only (NOT full league management)        |

**Proceed to Phase 1**: Design includes data model (with Prisma schema outline), API contracts, and quickstart guide with these technologies confirmed.
