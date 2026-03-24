# Ministros FC - Tech Stack Summary

**Version**: 1.0 | **Date**: March 17, 2026 | **Status**: Approved

---

## Overview

Ministros FC uses a modern, containerized architecture with three main services:

1. **Frontend**: Nuxt 4 (Vue 3 + TypeScript)
2. **Backend/CMS**: Nest.js (Node.js + Express adapter)
3. **Database**: PostgreSQL 15+

All services run via **PODMAN** with **docker-compose.yml** for orchestration.

---

## Frontend Stack

### Technology Choices

| Component            | Technology        | Version | Rationale                                               |
| -------------------- | ----------------- | ------- | ------------------------------------------------------- |
| **Framework**        | Nuxt 4            | 4.x     | Modern meta-framework for Vue 3, SSR support, great DX  |
| **UI Library**       | Vue 3             | 3.4+    | Latest Vue with Composition API, TypeScript first-class |
| **Styling**          | TailwindCSS       | 3.x     | Utility-first CSS, rapid development, small bundle      |
| **HTTP Client**      | Fetch API + axios | Latest  | Modern, with optional middleware for interceptors       |
| **State Management** | Pinia             | 2.x     | Official Vue state management, lightweight, TypeScript  |
| **Form Validation**  | Vee-Validate      | 4.x     | Declarative form validation for Vue 3                   |
| **Testing (Unit)**   | Vitest            | Latest  | Fast unit testing for Nuxt                              |
| **Testing (E2E)**    | Playwright        | Latest  | Cross-browser E2E testing                               |
| **Linting**          | ESLint + Prettier | Latest  | Code quality and formatting                             |
| **TypeScript**       | 5.x               | 5.x     | Type safety throughout frontend                         |

### Key Features

- ✅ **Server-Side Rendering (SSR)** — Better SEO, faster initial load
- ✅ **API Integration** — Consumes Nest.js backend API
- ✅ **Authentication** — JWT token management via middleware
- ✅ **Role-Based Access** — Routes protected by user role
- ✅ **Responsive Design** — Mobile-first with Tailwind
- ✅ **Dark Mode Support** — Optional theme switching
- ✅ **Accessible** — WCAG 2.1 AA compliance

### Build Output

- Static SSR: Pre-rendered pages + JavaScript
- Bundle Size Target: <100KB gzipped
- Performance Target: Lighthouse >85

---

## Backend/CMS Stack

### Technology Choices

| Component          | Technology         | Version | Rationale                                                 |
| ------------------ | ------------------ | ------- | --------------------------------------------------------- |
| **Framework**      | Nest.js            | 10.x+   | Enterprise Node framework, scalable, RBAC, DI built-in    |
| **HTTP Adapter**   | Express            | 4.x     | Industry standard, mature, extensive middleware ecosystem |
| **Language**       | TypeScript         | 5.x     | Type safety, better IDE support, catching errors early    |
| **ORM**            | Prisma             | 5.x     | Type-safe DB access, auto-migrations, excellent DX        |
| **Database**       | PostgreSQL         | 15+     | ACID compliance, JSON support, production-ready           |
| **Validation**     | class-validator    | Latest  | Decorator-based validation for DTO                        |
| **Serialization**  | class-transformer  | Latest  | Serialize/deserialize objects                             |
| **Authentication** | JWT (jsonwebtoken) | Latest  | Stateless auth, industry standard                         |
| **Authorization**  | Custom @Guard      | N/A     | Role-based access control (Admin, Editor, Player)         |
| **Caching**        | Redis (optional)   | 7.x     | Session management, email verification tokens             |
| **Testing**        | Jest               | Latest  | Unit and integration testing                              |
| **API Docs**       | Swagger/OpenAPI    | 7.x     | Auto-generated interactive API documentation              |
| **Linting**        | ESLint + Prettier  | Latest  | Code quality                                              |

### Architecture

```
Nest.js Application
├── Controllers          # HTTP request handlers
├── Services            # Business logic
├── Guards              # Authentication/Authorization
├── Filters             # Error handling
├── Interceptors        # Logging, transformation
└── Modules             # Feature organization
    ├── Auth (login, JWT)
    ├── Users (CRUD, roles)
    ├── Players (roster)
    ├── Games (matches, scheduling)
    ├── Tournaments (competitions)
    └── Statistics (aggregation)
```

### Key Features

- ✅ **RESTful API** — JSON endpoints following REST principles
- ✅ **Role-Based Access Control** — Admin, Editor, Player roles
- ✅ **JWT Authentication** — 24h token expiration
- ✅ **Swagger API Docs** — /api/docs auto-generated
- ✅ **Input Validation** — DTO + class-validator
- ✅ **Error Handling** — Consistent error responses
- ✅ **Logging** — Debug/info/error level logging
- ✅ **Database Migrations** — Prisma migrate for schema changes

### API Performance

- Target: <300ms average response time
- Max concurrent users: 50+ without degradation
- Database queries: Optimized with indexes

---

## Database Stack

### Technology Choice

| Component  | Technology | Version  | Rationale                                              |
| ---------- | ---------- | -------- | ------------------------------------------------------ |
| **RDBMS**  | PostgreSQL | 15+      | ACID, JSON support, reliable, open-source              |
| **ORM**    | Prisma     | 5.x      | Type-safe queries, auto-migrations, excellent for Node |
| **Backup** | pg_dump    | Built-in | Native PostgreSQL backup tool                          |
| **CLI**    | psql       | Built-in | Native PostgreSQL CLI tool                             |

### Schema Highlights

```sql
-- Core Entities
Teams              -- Team information (Ministros FC + opponents)
Users              -- Authentication (Admin, Editor, Player)
Players            -- Player roster with contact info
Games              -- Match records (home/away team)
GameParticipants   -- Player appearance + performance (goals, cards)
Tournaments        -- Competition organization
Statistics         -- Aggregated player stats per tournament

-- Key Constraints
- UUIDs as primary keys
- Foreign keys with cascading deletes
- Unique constraints (email, jersey number per team)
- Soft deletes on Player (isActive flag)
- Timestamps (createdAt, updatedAt) on all entities
```

### Performance Optimizations

- ✅ **Indexes** on frequently queried columns (date, status, team_id)
- ✅ **Connection pooling** via Prisma
- ✅ **Query optimization** with Prisma relations
- ✅ **Statistics caching** in Redis (optional)

---

## DevOps/Containerization Stack

### Technology Choices

| Component             | Technology         | Version | Rationale                                       |
| --------------------- | ------------------ | ------- | ----------------------------------------------- |
| **Container Runtime** | PODMAN             | 4.x+    | Docker-compatible, lightweight, rootless-ready  |
| **Orchestration**     | docker-compose.yml | 3.9     | PODMAN Compose for multi-container coordination |
| **Image Registry**    | Docker Hub / Quay  | Any     | For storing built images                        |

### Services

```yaml
5 Containerized Services:
1. PostgreSQL (db)        — Database storage
2. Redis (redis)          — Cache/sessions
3. Nest.js Backend        — CMS API server
4. Nuxt Frontend          — Public website + admin UI
5. Network (bridge)       — Internal service networking
```

### Dockerfile Strategies

**Multi-Stage Builds**: Frontend & Backend

- Stage 1: Dependencies (base image + npm ci)
- Stage 2: Builder (compile TypeScript, build assets)
- Stage 3: Production (minimal runtime image, no dev deps)

**Benefits**:

- ~70% smaller final image
- Faster deployment
- Better security (fewer packages)
- Faster pull times

### Health Checks

All services include health checks:

```yaml
PostgreSQL: pg_isready (10s interval, 5 retries)
Redis: redis-cli ping (10s interval)
Backend: curl /api/health (15s interval)
Frontend: curl / (15s interval)
```

Unhealthy services are automatically restarted.

---

## Development Tools

### Code Quality

| Tool                     | Purpose                          |
| ------------------------ | -------------------------------- |
| **TypeScript**           | Static type checking             |
| **ESLint**               | Linting (errors, best practices) |
| **Prettier**             | Code formatting                  |
| **Husky + Lint-Staged**  | Pre-commit hooks                 |
| **SonarQube** (optional) | Code quality analysis            |

### Testing

| Type                  | Tool           | Command            |
| --------------------- | -------------- | ------------------ |
| **Unit Tests**        | Jest           | `npm run test`     |
| **Integration Tests** | Jest           | `npm run test:e2e` |
| **E2E Frontend**      | Playwright     | `npm run test:e2e` |
| **E2E API**           | Jest/Supertest | `npm run test:api` |

### Development Environment

```bash
# Local development with hot-reload
podman-compose up -d

# Watch source files for changes (automatic rebuild)
• Backend:  packages/cms/src → auto-rebuild via nodemon
• Frontend: packages/frontend/* → auto-rebuild via Nuxt dev server

# Live debugging
podman exec -it ministrosfc-backend npm run start:debug
```

---

## Environment Configuration

All configuration via `.env` file:

```env
NODE_ENV=development|production

# Database
DATABASE_URL=postgresql://user:pass@db:5100/ministrosfc

# Redis
REDIS_URL=redis://:password@redis:5101

# JWT
JWT_SECRET=your-secret-key-min-32-chars
JWT_EXPIRATION=24h

# API
API_URL=http://backend:5102/api (internal)
API_URL_PUBLIC=http://localhost:5102/api (external)

# CORS
CORS_ORIGIN=http://localhost:5103,http://domain.com
```

---

## Security Standards

### Authentication & Authorization

- ✅ JWT tokens (24h expiration)
- ✅ Bcrypt password hashing
- ✅ Role-based access control (RBAC)
- ✅ HTTPS/TLS in production (via reverse proxy)

### API Security

- ✅ CORS validation
- ✅ Rate limiting (Nest.js throttler)
- ✅ Input validation (class-validator)
- ✅ SQL injection prevention (Prisma parameterized queries)
- ✅ XSS protection (Vue automatic escaping)

### Database Security

- ✅ Encrypted password storage (bcrypt)
- ✅ Private fields excluded from API (nationalId hidden)
- ✅ Soft deletes preserve audit trail
- ✅ UTC timestamps for consistency

---

## Deployment Architecture

### Development

```
Local Machine (PODMAN)
├── Frontend (port 3000)
├── Backend (port 3001)
├── PostgreSQL (port 5432, local only)
└── Redis (port 6379, local only)
```

### Production

```
Cloud/VPS (PODMAN)
├── Reverse Proxy (Nginx/Caddy) ← HTTPS
│   ├── → Frontend (3000)
│   └── → Backend (3001)
├── Frontend Container (Nuxt SSR)
├── Backend Container (Nest.js)
├── PostgreSQL (external service or container)
└── Redis (external service or container)
```

---

## Performance Targets

| Metric                   | Target                   | Method                              |
| ------------------------ | ------------------------ | ----------------------------------- |
| **API Response Time**    | <300ms avg               | Indexed queries, connection pooling |
| **Frontend Load Time**   | <1s                      | SSR, lazy loading, code splitting   |
| **Lighthouse Score**     | >85                      | Optimization, caching, compression  |
| **Concurrent Users**     | 50+                      | Horizontal scaling, caching         |
| **Database Connections** | 20 (default Prisma pool) | Adjustable via env var              |

---

## Scaling Considerations

### Horizontal Scaling

**Current (MVP)**:

- Single instance per service
- Suitable for <100 concurrent users

**Future**:

```
Load Balancer
├── Backend Instance 1 ┐
├── Backend Instance 2 ├─ All connect to shared DB/Redis
└── Backend Instance N ┘

Frontend can be served via CDN (static files)
```

### Vertical Scaling

- **Backend**: Increase CPU/Memory allocation
- **Database**: Increase RAM for query caching
- **Redis**: Increase RAM for larger session storage

---

## Cost Optimization

### Current Stack Costs (Estimate)

| Service             | Option            | Cost/Month      |
| ------------------- | ----------------- | --------------- |
| **Hosting**         | PODMAN on VPS     | $5-20/month     |
| **Database**        | PostgreSQL on VPS | Included in VPS |
| **Cache**           | Redis on VPS      | Included in VPS |
| **CDN** (optional)  | Cloudflare Free   | $0              |
| **SSL Certificate** | Let's Encrypt     | $0              |

### Cost-Saving Tips

1. Use PODMAN instead of Docker (lighter footprint)
2. Consolidate services on single VPS initially
3. Use managed services for scaling (later)
4. Leverage open-source tools (ESLint, Jest, etc.)

---

## Monitoring & Observability

### Logging

```bash
# View live logs
podman logs -f ministrosfc-backend
podman logs -f ministrosfc-frontend

# Structured logging in backend (JSON format)
# Each request logged with: timestamp, level, message, metadata
```

### Health Checks

```bash
# All services expose health endpoints
curl http://localhost:3001/api/health
curl http://localhost:3000/
```

### Metrics (Optional Future)

- Prometheus (metrics collection)
- Grafana (visualization)
- DataDog (APM)
- Sentry (error tracking)

---

## Summary Table

| Layer                | Technology        | Purpose                         |
| -------------------- | ----------------- | ------------------------------- |
| **UI/Frontend**      | Nuxt 4 + Vue 3    | Public website, admin dashboard |
| **API/Backend**      | Nest.js + Express | CMS, REST API, business logic   |
| **Database**         | PostgreSQL 15     | Relational data storage         |
| **Cache**            | Redis 7           | Sessions, caching               |
| **ORM**              | Prisma            | Type-safe database access       |
| **Runtime**          | Node.js 23+       | JavaScript runtime              |
| **Containerization** | PODMAN            | Container runtime               |
| **Orchestration**    | docker-compose    | Multi-container coordination    |
| **Language**         | TypeScript 5.x    | Type safety everywhere          |

---

## Implementation Timeline

**Phase 1 (MVP - v1.0)**: Single instance of each service

- Estimated: 4-6 weeks
- Suitable for: <50 concurrent users

**Phase 2 (v1.1+)**: Add monitoring, caching optimization

- Estimated: 2-3 weeks
- Suitable for: 50-200 concurrent users

**Phase 3 (v2.0+)**: Horizontal scaling, multi-team support

- Services ready (no code changes needed)
- Add load balancer, multiple instances

---

## Resources & Documentation

- [PODMAN Docs](https://docs.podman.io/)
- [Nest.js Docs](https://docs.nestjs.com/)
- [Nuxt 4 Docs](https://nuxt.com/)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Setup Guide](./PODMAN_SETUP.md) — Complete PODMAN instructions

---

**Approval Date**: March 17, 2026  
**Approved By**: Ministros FC Development Team  
**Next Review**: September 17, 2026 (quarterly)
