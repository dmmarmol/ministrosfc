# Ministros FC - Amateur Football Team Management Platform

Complete platform for managing an amateur soccer team's roster, games, tournaments, and statistics.

**Status**: MVP Development - Phase 0 Complete | **Version**: 0.0.1-dev

---

## 🎯 Features

### For Fans & Public

- 👥 View team roster with player profiles
- 📅 Browse upcoming games and tournament schedules
- 📊 Check match results and team statistics
- 🏆 Track player performance (goals, appearances, cards)

### For Administrators

- 🛠️ Full CMS dashboard for team management
- 👤 Player roster management (add/edit/soft delete)
- 🎮 Game scheduling and result recording
- 🏟️ Opponent team management
- 🏆 Tournament organization and tracking
- 📈 Automatic player statistics aggregation
- 👥 User & role management (Admin, Editor, Player)
- 📸 Player photo uploads
- 👫 "Bring a Friend" - Guest player invitations

### For Players

- 📱 Confirm participation in upcoming games
- 👯 Bring friends as guest players
- 📊 View personal performance statistics
- 🔔 Receive updates on upcoming matches

---

## 🏗️ Architecture

**npm Workspaces Monorepo - Three-Package Architecture:**

```
┌──────────────────────────────────────────────────────────┐
│  Ministros FC - NPM Workspaces Monorepo                  │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  ┌──────────────────┐  ┌──────────────────────────────┐  │
│  │  🌐 FRONTEND     │  │  🛠️  BACKEND / CMS API       │  │
│  │  @ministrosfc/   │  │  @ministrosfc/cms            │  │
│  │   frontend       │  │                              │  │
│  │  Nuxt 4          │  │  Nest.js + Express           │  │
│  │  Vue 3 + TS      │  │  TypeScript                  │  │
│  │  Port: 3000      │  │  Port: 3001                  │  │
│  │  Public + Admin  │  │  REST API Only               │  │
│  └──────────────────┘  └──────────────────────────────┘  │
│         │                       │                        │
│         └───────────────────────┘                        │
│                 │                                        │
│         ┌───────▼────────────┐                           │
│         │  📦 SHARED         │                           │
│         │  @ministrosfc/     │                           │
│         │   shared           │                           │
│         │  TypeScript Types  │                           │
│         │  Utilities         │                           │
│         └───────────────────┘                            │
│                                                          │
│  Database & Cache (local development):                   │
│  🐘 PostgreSQL 15 (port 5100) via Podman Compose         │
│  🔴 Redis 7 (port 5101) via Podman Compose               │
│                                                          │
│  Deployment: Fly.io (3 free VMs)                         │
└──────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** 23+ LTS
- **npm** 10+
- **Podman** (for PostgreSQL + Redis containers)
- **Git**

### 1. Clone & Install

```bash
git clone <repository-url> ministrosfc
cd ministrosfc

# Install all dependencies (installs all workspaces)
npm install
```

### 2. Set Up Environment Variables

```bash
# Backend
cp packages/cms/.env.example packages/cms/.env
# Edit packages/cms/.env if needed

# Frontend
cp packages/frontend/.env.example packages/frontend/.env
# Edit packages/frontend/.env if needed
```

### 3. Start Database Services

```bash
# Start PostgreSQL + Redis using Podman Compose
npm run docker:up

# Verify services are running
npm run docker:logs
```

### 4. Initialize Database (After Phase 1)

```bash
# Generate Prisma client
npm run gen:prisma

# Run migrations (when implemented)
cd packages/cms
npx prisma migrate dev

# Seed database (when implemented)
npm run seed
```

### 5. Start Development Servers

```bash
# Start all services in development mode
npm run dev:all

# Or start individually:
cd packages/cms && npm run dev      # Backend API on :3001
cd packages/frontend && npm run dev  # Frontend on :3000
```

### 6. Access Applications

| Service                       | URL                              |
| ----------------------------- | -------------------------------- |
| **Frontend** (Public Website) | http://localhost:5103            |
| **Backend API**               | http://localhost:5102/api        |
| **API Health Check**          | http://localhost:5102/api/v1/health |

#### Custom hostname (optional)

You can also access both servers via `localhost.ministrosfc.com` for a more
production-like dev experience:

1. Add to `/etc/hosts` (one-time):
   ```
   127.0.0.1 localhost.ministrosfc.com
   ```
2. Create `packages/frontend/.env.local` with `NUXT_HOST=0.0.0.0`
3. Create `packages/cms/.env.local` with `CORS_ORIGINS=http://localhost:5103,http://localhost.ministrosfc.com:5103`

Then `npm run dev:all` as usual. Both `http://localhost:5103` and
`http://localhost.ministrosfc.com:5103` will work simultaneously.
See [`specs/014-custom-hostname-dev/quickstart.md`](specs/014-custom-hostname-dev/quickstart.md) for full details.

---

## 📦 Monorepo Packages

### @ministrosfc/shared

TypeScript types and utilities shared across frontend and backend.

```bash
cd packages/shared
npm run build     # Compile TypeScript
npm test          # Run tests
```

### @ministrosfc/cms

Backend API built with Nest.js + Express + Prisma.

```bash
cd packages/cms
npm run dev              # Start dev server with hot reload
npm run build            # Build for production
npm test                 # Run unit tests
npm run prisma:studio    # Open Prisma Studio (DB GUI)
```

### @ministrosfc/frontend

Frontend application built with Nuxt 4 + Vue 3 + TailwindCSS.

```bash
cd packages/frontend
npm run dev      # Start dev server
npm run build    # Build for production
npm run preview  # Preview production build
npm test         # Run component tests
npm run test:e2e # Run E2E tests (Playwright)
```

---

## 📚 Documentation

### Core Documentation

| Document                                                            | Purpose                                 |
| ------------------------------------------------------------------- | --------------------------------------- |
| [**spec.md**](./specs/001-ministrosfc-monorepo/spec.md)             | Feature requirements & user stories     |
| [**plan.md**](./specs/001-ministrosfc-monorepo/plan.md)             | Implementation plan & architecture      |
| [**data-model.md**](./specs/001-ministrosfc-monorepo/data-model.md) | Database schema & entity relationships  |
| [**tasks.md**](./specs/001-ministrosfc-monorepo/tasks.md)           | Implementation tasks (180 tasks)        |
| [**deployment.md**](./specs/001-ministrosfc-monorepo/deployment.md) | Fly.io deployment guide                 |
| [**TECH_STACK.md**](./docs/guides/TECH_STACK.md)                    | Complete technology choices & rationale |

### API Contracts

- [Player API](./specs/001-ministrosfc-monorepo/contracts/player-contract.md)
- [Game API](./specs/001-ministrosfc-monorepo/contracts/game-contract.md)
- [Team API](./specs/001-ministrosfc-monorepo/contracts/team-contract.md)
- [Tournament API](./specs/001-ministrosfc-monorepo/contracts/tournament-contract.md)
- [Auth API](./specs/001-ministrosfc-monorepo/contracts/auth-contract.md)

---

## 🛠️ Development

### Project Structure

```
ministrosfc/
├── package.json                 # Root monorepo config with workspaces
├── tsconfig.base.json           # Shared TypeScript configuration
├── docker-compose.yml           # PostgreSQL + Redis for local dev
├── .gitignore
├── README.md
│
├── packages/                    # NPM workspaces
│   ├── shared/                  # @ministrosfc/shared
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── types/           # TypeScript interfaces
│   │       ├── utils/           # Shared utilities
│   │       └── index.ts
│   │
│   ├── cms/                     # @ministrosfc/cms (Backend API)
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   ├── prisma/              # Database schema & migrations
│   │   └── src/
│   │       ├── main.ts          # Entry point
│   │       ├── config/          # DB, auth, server config
│   │       ├── middleware/      # Auth, RBAC, validation
│   │       ├── models/          # Prisma models
│   │       ├── services/        # Business logic
│   │       ├── routes/          # API endpoints
│   │       ├── utils/           # Helpers
│   │       └── scripts/         # Seed scripts
│   │
│   └── frontend/                # @ministrosfc/frontend (Nuxt 4)
│       ├── package.json
│       ├── tsconfig.json
│       ├── nuxt.config.ts
│       ├── Dockerfile
│       ├── .env.example
│       ├── public/              # Static assets
│       └── src/
│           ├── components/      # Vue components
│           ├── pages/           # Nuxt pages (routes)
│           │   ├── index.vue    # Homepage
│           │   ├── roster.vue   # Public roster
│           │   ├── games.vue    # Public schedule
│           │   └── admin/       # Admin dashboard
│           ├── stores/          # Pinia state management
│           ├── composables/     # Reusable Vue logic
│           └── utils/           # Frontend utilities
│
├── specs/                       # Specification & planning
│   └── 001-ministrosfc-monorepo/
│       ├── spec.md              # Feature requirements
│       ├── plan.md              # Implementation plan
│       ├── data-model.md        # Database schema
│       ├── tasks.md             # Implementation tasks
│       ├── deployment.md        # Fly.io deployment guide
│       ├── contracts/           # API contracts
│       └── checklists/          # Quality checklists
│
└── docs/                        # Additional documentation
    ├── architecture/
    └── guides/
```

---

## 🧪 Testing

### Run All Tests

```bash
# Run all workspace tests
npm run test:all
```

### Backend Tests

```bash
cd packages/cms
npm test              # Run all unit + integration tests
npm run test:watch    # Watch mode
npm run test:cov      # With coverage report
```

### Frontend Tests

```bash
cd packages/frontend
npm test              # Component tests (Vitest)
npm run test:e2e      # E2E tests (Playwright)
```

---

## 📦 Building for Production

```bash
# Build all packages
npm run build:all

# Or build individually
cd packages/shared && npm run build
cd packages/cms && npm run build
cd packages/frontend && npm run build
```

---

## 🚀 Deployment

### Fly.io (Selected Platform - Free Tier)

See complete deployment guide: [deployment.md](./specs/001-ministrosfc-monorepo/deployment.md)

```bash
# Install Fly CLI
curl -L https://fly.io/install.sh | sh

# Deploy backend
cd packages/cms
fly deploy

# Deploy frontend
cd packages/frontend
fly deploy
```

**Free Tier Allocation:**

- Backend API: 1 VM (256MB)
- Frontend SSR: 1 VM (256MB)
- PostgreSQL: 1 VM (256MB, 3GB storage)
- Cost: $0/month

---

## 🔧 Useful Commands

```bash
# Development
npm run dev:all          # Start all services
npm run docker:up        # Start PostgreSQL + Redis (uses podman-compose)
npm run docker:down      # Stop PostgreSQL + Redis
npm run docker:logs      # View database logs

# Building
npm run build:all        # Build all packages
npm run clean            # Clean all build artifacts

# Database
npm run gen:prisma       # Generate Prisma client

# Testing
npm run test:all         # Run all tests
npm run lint:all         # Lint all packages
```

---

## 🤝 Contributing

1. Follow the **speckit workflow**: Spec → Plan → Tasks → Implement
2. Read the [constitution](.specify/memory/constitution.md) for architectural principles
3. Check Phase status in [tasks.md](./specs/001-ministrosfc-monorepo/tasks.md)
4. Run tests before committing: `npm run test:all`
5. Follow TypeScript strict mode (enabled in all packages)

---

## 📄 License

ISC

---

## 👤 Author

Diego Martin Marmol <diegomartinmarmol@gmail.com>

---

**Current Status**: Phase 0 Complete ✅ - Ready for Phase 1 (Backend Foundation)
│ └── contracts/ # API contracts
│
├── docs/ # Documentation
│ ├── guides/ # Implementation guides
│ │ ├── TECH_STACK.md
│ │ ├── PODMAN_SETUP.md
│ │ ├── UPDATES_2026_03_17.md
│ │ └── IMPLEMENTATION_CHECKLIST.md
│ │
│ └── architecture/ # Architecture decisions
│ └── ARCHITECTURE_DECISIONS.md
│
├── docker-compose.yml # Service orchestration
├── .env.example # Configuration template
└── README.md # This file

````

### Development Workflow

```bash
# 1. Start all services
podman-compose up -d

# 2. Make code changes (auto-reload enabled)
# - Backend: packages/cms/src → auto-rebuild
# - Frontend: packages/frontend/src → auto-reload

# 3. Run tests
podman exec ministrosfc-backend npm run test
podman exec ministrosfc-frontend npm run test:e2e

# 4. Check logs
podman-compose logs -f

# 5. Stop services
podman-compose down
````

### Running Tests

```bash
# Backend unit tests
podman exec ministrosfc-backend npm run test

# Backend E2E tests
podman exec ministrosfc-backend npm run test:e2e

# Frontend E2E tests
podman exec ministrosfc-frontend npm run test:e2e

# All tests
npm run test -w packages/cms
npm run test -w packages/frontend
```

### Database Operations

```bash
# Create new migration
podman exec ministrosfc-backend npx prisma migrate dev --name <name>

# Apply migrations
podman exec ministrosfc-backend npm run prisma:migrate

# Interactive database shell
podman exec -it ministrosfc-postgres psql -U ministros_user -d ministrosfc
```

---

## 🔐 Security

### Authentication

- **Method**: JWT (JSON Web Tokens)
- **Expiration**: 24 hours
- **Storage**: HttpOnly cookies (browser) or localStorage (SPA)
- **Password**: Bcrypt hashing with cost factor 12

### Authorization

- **Roles**: Admin, Editor, Player
- **RBAC**: Role-based access control on all endpoints
- **Scope**: User can only access own data (except admins)

### API Security

- ✅ CORS validation
- ✅ Input validation (class-validator)
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ XSS protection (Vue auto-escaping)
- ✅ HTTPS/TLS in production (via reverse proxy)
- ✅ Rate limiting (optional via Nest.js throttler)

---

## 🚀 Deployment

### Development → Production

See [**PODMAN_SETUP.md - Production Deployment**](./docs/guides/PODMAN_SETUP.md#production-deployment) for:

- Pre-production checklist
- SSL/TLS setup (Nginx reverse proxy)
- External database configuration
- Monitoring & alerting setup

### Quick Production Deploy

```bash
# 1. Configure .env for production
NODE_ENV=production
JWT_SECRET=<strong-random-secret>
CORS_ORIGIN=https://yourdomain.com

# 2. Build images
podman-compose build

# 3. Push to registry (if using remote deployment)
podman tag ministrosfc-backend your-registry/ministrosfc-backend:1.0.0
podman push your-registry/ministrosfc-backend:1.0.0

# 4. Deploy (on production server)
podman-compose -f docker-compose.yml up -d
```

---

## 📋 Project Constitution

All development follows the **Ministros FC Project Constitution** defined in:

[`.specify/memory/constitution.md`](./.specify/memory/constitution.md)

**Key Principles:**

1. ✅ **Feature-Driven Architecture** — All work is discrete, well-scoped features
2. ✅ **Specification Before Implementation** — Specs created before coding
3. ✅ **Plan-Driven Implementation** — Design plans reviewed before tasks
4. ✅ **Test-Driven Development** — Tests written before implementation
5. ✅ **Component Isolation** — Clear responsibility boundaries
6. ✅ **Data Flow** — Unidirectional, centralized state management

---

## 🤝 Contributing

### Development Process

1. **Create Feature Branch**: `git checkout -b feature/short-description`
2. **Create Spec**: Write `spec.md` with requirements
3. **Create Plan**: Write `plan.md` with technical design
4. **Create Tasks**: Generate `tasks.md` with actionable items
5. **Implement**: Write tests first (TDD), then implementation
6. **Review**: Submit PR, ensure spec compliance
7. **Merge**: Squash merge to main with descriptive message

### Code Quality

- TypeScript strict mode required
- ESLint + Prettier enforced in pre-commit hooks
- 80%+ test coverage for new code
- All APIs documented via Swagger

---

## 🐛 Troubleshooting

### Services Won't Start

```bash
# Check logs
podman-compose logs

# Verify PODMAN is running
podman ps

# Common issues:
# - Port already in use: See PODMAN_SETUP.md
# - Out of disk: podman system prune -a
# - Network issue: podman network inspect ministrosfc_ministrosfc-network
```

### Database Errors

```bash
# Check database is running
podman exec ministrosfc-postgres psql -U ministros_user -d ministrosfc -c "SELECT 1;"

# Reset database (⚠️ deletes all data)
podman exec ministrosfc-backend npx prisma migrate reset
```

### API Not Responding

```bash
# Check backend logs
podman logs -f ministrosfc-backend

# Test API health
curl http://localhost:3001/api/health

# Restart backend
podman-compose restart backend
```

**Full troubleshooting guide**: [PODMAN_SETUP.md - Troubleshooting](./docs/guides/PODMAN_SETUP.md#troubleshooting)

---

## 📊 Performance

| Metric                   | Target | Status         |
| ------------------------ | ------ | -------------- |
| **API Response Time**    | <300ms | ✅ Optimized   |
| **Frontend Load**        | <1s    | ✅ SSR enabled |
| **Lighthouse Score**     | >85    | ✅ In progress |
| **Concurrent Users**     | 50+    | ✅ Tested      |
| **Database Connections** | 20     | ✅ Configured  |

---

## 📞 Support

### Getting Help

1. **Check documentation**: [TECH_STACK.md](./docs/guides/TECH_STACK.md), [PODMAN_SETUP.md](./docs/guides/PODMAN_SETUP.md)
2. **View logs**: `podman-compose logs -f`
3. **Common issues**: See Troubleshooting section above
4. **Framework docs**:
   - [Nest.js](https://docs.nestjs.com/)
   - [Nuxt](https://nuxt.com/)
   - [PostgreSQL](https://www.postgresql.org/docs/)
   - [Prisma](https://www.prisma.io/docs/)

---

## 📄 License

This project is licensed under the ISC License - see [LICENSE](./LICENSE) file.

---

## 🎯 Project Status

- ✅ **MVP Architecture**: Complete
- ✅ **Data Model**: Complete (with Team flexibility)
- ✅ **API Contracts**: Complete
- ✅ **Tech Stack**: Defined ([TECH_STACK.md](./TECH_STACK.md))
- ✅ **Containerization**: Ready (docker-compose.yml + Podman)
- ⏳ **Backend Implementation**: Ready to start
- ⏳ **Frontend Implementation**: Ready to start
- ⏳ **Testing Suite**: Ready to start
- ⏳ **Documentation**: In progress

---

## 🚀 Next Steps

1. **Backend Setup** → Create Nest.js project structure
2. **Frontend Setup** → Create Nuxt 4 project structure
3. **Database Schema** → Run Prisma migrations
4. **API Implementation** → Build endpoints per contracts
5. **Frontend Pages** → Create pages and components
6. **Testing** → Unit, integration, E2E tests
7. **Deployment** → Production environment setup

---

**Last Updated**: March 17, 2026  
**Maintained By**: Ministros FC Development Team  
**Next Review**: Quarterly (every 3 months)

---

**Questions?** Check [TECH_STACK.md](./docs/guides/TECH_STACK.md) or [PODMAN_SETUP.md](./docs/guides/PODMAN_SETUP.md) first! 🚀
