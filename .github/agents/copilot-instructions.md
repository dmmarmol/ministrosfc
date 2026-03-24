# ministrosfc Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-17

## Active Technologies

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

- 001-ministrosfc-monorepo: Added monorepo structure with shared/cms/frontend packages
- Deployment platform: Fly.io (3 free VMs)
- External object storage for player photos (< 100 images)
- Tournament scope simplified: grouping only (no full league management in MVP)

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
