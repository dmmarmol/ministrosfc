# ministrosfc Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-30

## Active Technologies
- TypeScript (Node 18+, Nuxt 4/Vue 3) + Express, Prisma, Zod, google-auth-library, Pinia (009-user-registration)
- TypeScript 5.x, Vue 3 (Nuxt 3 app, ESM) + Nuxt, Vue, Tailwind CSS, Pinia, Vitest, @vue/test-utils (012-dropdown-add-more)
- N/A (UI component; parent owns data-fetch and persistence) (012-dropdown-add-more)

- TypeScript 5 (strict mode, both packages) + Express 4, Prisma 5, Zod, Nuxt 3, Vue 3, Pinia, Tailwind CSS (006-admin-player-delete)
- PostgreSQL (Prisma ORM) + Redis (cache invalidation) (006-admin-player-delete)
- TypeScript 5.3, Node ≥ 23 + Nuxt 3 / Vite (frontend dev server), Express 4 (backend) (007-custom-hostname-dev)
- N/A — no database changes (007-custom-hostname-dev)
- TypeScript 5 (strict mode, both packages) + Express 4, Prisma 5, Zod v4, Nuxt 3.21, Vue 3.5, Pinia, Tailwind CSS, `google-auth-library` (new — Google OAuth) (009-user-registration)
- PostgreSQL (Prisma ORM) + Redis (JWT refresh tokens, search cache) + Cloudinary (S3-compatible photo storage) (009-user-registration)

- TypeScript 5.3.3 / Node.js 23+ + npm workspaces (no added libs — this phase is config only) (002-monorepo-setup)
- PostgreSQL 15 (dev, port 5100), Redis 7 (dev, port 5101) — docker-compose.yml (002-monorepo-setup)
- TypeScript 5.3 (strict mode) / Node.js 20.18.1 (LTS) + Prisma 5.x (already present), `csv-parse` (new), `dotenv` (new) (003-data-hydration)
- PostgreSQL 16 via Podman container on port 5100 — Prisma client already configured (003-data-hydration)

- **Language/Runtime**: TypeScript 5.x, Node.js 23+ LTS
- **Backend**: Nest.js + Express, Prisma 5.x ORM, PostgreSQL 15+
- **Frontend**: Nuxt 4, Vue 3, Pinia, TailwindCSS 3, shadcn/ui
- **Cache/Sessions**: Redis 7.x (sessions, statistics), HTTP cache headers
- **Testing**: Jest (backend unit/integration), Playwright (E2E)
- **Logging**: Pino (structured JSON logs, INFO+ in prod, DEBUG in dev)
- **File Storage**: External object storage (Cloudflare R2, Cloudinary, or Supabase)
- **Security**: bcrypt (cost 12), JWT auth (24h expiry), express-rate-limit (in-memory)
- **API**: REST JSON, CORS (specific origins), rate limiting on auth endpoints
- **Deployment**: Fly.io (3 free VMs: Backend, Frontend, PostgreSQL)
- **Development**: npm workspaces monorepo, Docker Compose (PostgreSQL + Redis local)

Feature: 001-ministrosfc-monorepo

## Project Structure

```text
ministrosfc/                        # Root monorepo
├── packages/
│   ├── shared/                     # @ministrosfc/shared - Types & utilities
│   │   └── src/types/              # Shared TypeScript interfaces
│   ├── cms/                        # @ministrosfc/cms - Backend API (Nest.js)
│   │   ├── src/
│   │   │   ├── config/             # DB, auth, server config
│   │   │   ├── middleware/         # Auth, RBAC, validation, error handling
│   │   │   ├── models/             # Prisma models
│   │   │   ├── services/           # Business logic
│   │   │   ├── routes/             # Express route handlers
│   │   │   └── utils/              # Logging, helpers
│   │   └── prisma/                 # Prisma schema, migrations, seeds
│   └── frontend/                   # @ministrosfc/frontend - Nuxt 4 app
│       ├── src/
│       │   ├── components/         # Vue components (player, game, tournament)
│       │   ├── pages/              # Nuxt pages
│       │   ├── stores/             # Pinia stores
│       │   └── composables/        # Vue composables
│       └── public/                 # Static assets
├── specs/                          # Feature specifications
│   └── 001-ministrosfc-monorepo/
│       ├── spec.md                 # Feature specification
│       ├── plan.md                 # Implementation plan
│       ├── data-model.md           # Database schema
│       ├── contracts/              # API contracts
│       └── tasks.md                # Task breakdown
└── docker-compose.yml              # Local dev (PostgreSQL + Redis)
```

## Commands

```bash
# Development
npm run dev:all                    # Start all packages in dev mode
npm run docker:up                  # Start PostgreSQL + Redis containers
npm run docker:down                # Stop containers

# Building
npm run build:all                  # Build all packages
npm run gen:prisma                 # Generate Prisma client

# Testing
npm run test:all                   # Run tests for all packages
npm run lint:all                   # Lint all packages

# Database (CMS package)
cd packages/cms
npx prisma migrate dev             # Create and run migrations
npx prisma db seed                 # Seed database
npx prisma studio                  # Open Prisma Studio GUI
```

## Code Style

- **TypeScript**: Strict mode enabled globally (tsconfig.base.json)
- **Backend**: Nest.js decorator conventions, dependency injection patterns
- **Frontend**: Vue 3 Composition API, Pinia for state management
- **API**: REST JSON responses with consistent structure: `{ success, data, error, statusCode }`
- **Logging**: Pino structured JSON logs with correlation IDs
- **Testing**: TDD approach (write tests before implementation), 80%+ coverage target

## Key Architectural Decisions

- **MVP Scope**: Tournaments are grouping/categorization only (NOT full league standings calculation)
- **Player Photos**: Stored in external object storage (photoUrl field), not local filesystem
- **CORS**: Specific origins (production domain + localhost in dev), credentials enabled
- **Rate Limiting**: express-rate-limit (in-memory), 5 login attempts per 15 min per IP
- **Soft Deletes**: Players use status field (ACTIVE | INACTIVE), preserved in historical data
- **Guest Players**: playerType=GUEST, linked to inviting player via invitedById

## Recent Changes
- 012-dropdown-add-more: Added TypeScript 5.x, Vue 3 (Nuxt 3 app, ESM) + Nuxt, Vue, Tailwind CSS, Pinia, Vitest, @vue/test-utils
- 009-user-registration: Added TypeScript (Node 18+, Nuxt 4/Vue 3) + Express, Prisma, Zod, google-auth-library, Pinia

- 009-user-registration: Added TypeScript 5 (strict mode, both packages) + Express 4, Prisma 5, Zod v4, Nuxt 3.21, Vue 3.5, Pinia, Tailwind CSS, `google-auth-library` (new — Google OAuth)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
