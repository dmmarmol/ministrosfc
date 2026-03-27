# Research: Monorepo Setup

**Date**: 2026-03-21 | **Status**: Complete — Feature Already Implemented
**Purpose**: Document verification findings; no unknowns to resolve

---

## Verification Summary

All 10 functional requirements from `spec.md` are satisfied by the existing codebase. The feature was implemented as part of the initial `feature/ministrosfc-monorepo` delivery. No new code or configuration is needed.

---

## §1 — FR-001: Root package.json workspaces and scripts

**Decision**: npm workspaces with `packages/*` glob  
**Rationale**: Natural fit for npm-based monorepo; avoids pnpm/yarn complexity for a small team  
**Verification**:

- `workspaces: ["packages/*"]` ✅
- Scripts `docker:up`, `docker:down`, `build:all`, `dev:all`, `test:all`, `gen:prisma`, `lint:all` all present ✅

---

## §2 — FR-002: Node.js / npm engine constraint

**Decision**: `engines: { node: ">=23.0.0", npm: ">=10.0.0" }`  
**Rationale**: Node 23 LTS required for latest Prisma, Nuxt 3.x, and Vitest 2.x compatibility  
**Verification**: Present in root `package.json` ✅  
**Minor discrepancy**: README Quick Start says "npm 9+" — should be updated to "npm 10+" to match engines field. Non-blocking.

---

## §3 — FR-003: tsconfig.base.json

**Decision**: Shared base config with `strict: true`, `target: ES2020`, `@ministrosfc/*` path aliases  
**Rationale**: Single source of truth for TypeScript strictness; prevents per-package drift  
**Verification**:

- `strict: true` ✅
- `target: "ES2020"` ✅
- `paths: { "@ministrosfc/*": ["packages/*/src"] }` ✅
- Additional strict flags: `strictNullChecks`, `noUnusedLocals`, `noUncheckedIndexedAccess`, etc. ✅

---

## §4 — FR-004: Per-package tsconfig.json extending base

**Decision**: Each package extends `../../tsconfig.base.json` with minimal overrides  
**Rationale**: Package-specific needs (decorators for CMS, bundler resolution for frontend, composite for shared output)  
**Verification**:

- `packages/cms/tsconfig.json`: `experimentalDecorators: true`, `emitDecoratorMetadata: true` ✅
- `packages/frontend/tsconfig.json`: `module: ESNext`, `moduleResolution: bundler` ✅
- `packages/shared/tsconfig.json`: `composite: true`, `declaration: true` ✅

---

## §5 — FR-005: docker-compose.yml (Podman compatible)

**Decision**: PostgreSQL 15 on port 5100, Redis 7 on port 5101; named volumes; Podman Compose compatible  
**Rationale**: Non-standard ports avoid conflicts; Podman is the local container runtime per project docs  
**Verification**:

- `db` service: `postgres:15-alpine`, port `${DB_PORT:-5100}:5432`, health check ✅
- `redis` service: `redis:7-alpine`, port `${REDIS_PORT:-5101}:6379`, health check ✅
- Named volumes: `postgres_data`, `redis_data` ✅
- Root script: `docker:up` calls `podman-compose up -d` ✅

---

## §6 — FR-006: CMS .env.example

**Decision**: Cloudinary as object storage provider (free tier 25GB)  
**Rationale**: Simpler SDK than R2/Supabase; alternatives documented in comments  
**Verification**: All required variables present:

- `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRY`, `REFRESH_TOKEN_EXPIRY` ✅
- `REDIS_HOST`, `REDIS_PORT` ✅
- `NODE_ENV`, `API_PORT=5102` ✅
- `CORS_ORIGIN` ✅ (note: named `CORS_ORIGIN` not `CORS_ORIGINS` as spec suggests — minor naming difference, not a functional gap)
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` ✅

---

## §7 — FR-007: Frontend .env.example

**Decision**: Minimal 3-variable config (`NUXT_PUBLIC_API_BASE_URL`, `NUXT_PUBLIC_BRAND_COLOR`, `NUXT_PORT`)  
**Verification**: All required variables present ✅  
**Bonus**: `NUXT_PUBLIC_TEAM_NAME` added (not required by spec; harmless)

---

## §8 — FR-008 + FR-009: Dockerfiles and source directories

**Decision**: Multi-stage Dockerfiles (TypeScript compilation → lean runtime image) in each package  
**Verification**:

- `packages/cms/Dockerfile` exists ✅
- `packages/frontend/Dockerfile` exists ✅
- CMS `src/`: `config/`, `middleware/`, `models/`, `routes/`, `services/`, `scripts/`, `utils/` ✅
- Frontend `src/`: `app.vue`, `components/`, `composables/`, `layouts/`, `middleware/`, `pages/`, `plugins/`, `stores/`, `utils/` ✅
- Shared: `src/` and `dist/` present ✅

---

## §9 — FR-010: README Quick Start

**Decision**: README includes Quick Start section with prerequisites and commands  
**Verification**: `## 🚀 Quick Start` section present with prerequisites (Node.js 23+, Podman/Docker) ✅  
**Action item**: Update "npm 9+" → "npm 10+" to match `engines` field (low priority)

---

## Conclusion

No unknowns remain. Feature 002 is complete. The only remediation item is a documentation inconsistency (README npm version mention) which can be fixed as part of the verification task in `tasks.md`.
