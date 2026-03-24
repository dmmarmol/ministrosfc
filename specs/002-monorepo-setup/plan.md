# Implementation Plan: Monorepo Setup

**Branch**: `002-monorepo-setup` | **Date**: 2026-03-21 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-monorepo-setup/spec.md`

> **Status: ALREADY IMPLEMENTED** — All 10 FRs verified against the existing codebase. This plan serves as documentation and verification record. No new code needs to be written. `/speckit.tasks` will generate a verification-only task list.

## Summary

Establish the foundational npm monorepo structure: workspace configuration, shared TypeScript base config, Docker/Podman-compose service definitions for local PostgreSQL (5100) and Redis (5101), per-package `.env.example` files, multi-stage Dockerfiles, and source directory scaffolding. All artifacts already exist in the repository; this plan confirms compliance with the spec.

## Technical Context

**Language/Version**: TypeScript 5.3.3 / Node.js 23+  
**Primary Dependencies**: npm workspaces (no added libs — this phase is config only)  
**Storage**: PostgreSQL 15 (dev, port 5100), Redis 7 (dev, port 5101) — docker-compose.yml  
**Testing**: N/A (no testable logic — scaffold/config only)  
**Target Platform**: macOS/Linux local dev; Podman Compose compatible  
**Project Type**: Monorepo infrastructure (config, Dockerfiles, tsconfig hierarchy)  
**Performance Goals**: `npm install` + `docker:up` + `build:all` in < 5 minutes  
**Constraints**: Podman Compose compatibility; non-standard ports (5100–5103) to avoid local conflicts  
**Scale/Scope**: 3 packages (cms, frontend, shared); 4 environment services

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

| Rule                            | Status  | Notes                                                                                            |
| ------------------------------- | ------- | ------------------------------------------------------------------------------------------------ |
| I. Feature-Driven Architecture  | ✅ PASS | Scope is clearly bounded: scaffolding only, no application logic                                 |
| II. Spec-First                  | ✅ PASS | spec.md exists and is complete before implementation                                             |
| III. Plan-Driven Implementation | ✅ PASS | This document                                                                                    |
| IV. TDD Quality Gates           | ✅ PASS | No testable business logic in this phase; config files and build scripts verified by `build:all` |
| V. Component Isolation          | ✅ PASS | Each package has its own package.json, tsconfig, and src/ tree                                   |
| VI. Data Flow                   | ✅ N/A  | No data flow or state management in this phase                                                   |
| Technology Standards            | ✅ PASS | TypeScript strict mode, Node 23+, npm workspaces                                                 |
| Testing Standards (C-2)         | ✅ N/A  | No test files in this phase                                                                      |

## Project Structure

### Documentation (this feature)

```text
specs/002-monorepo-setup/
├── plan.md              # This file
├── research.md          # Phase 0 output — implementation already exists, no unknowns
├── quickstart.md        # Phase 1 output — developer setup commands
└── tasks.md             # Phase 2 output (/speckit.tasks — verification tasks only)
```

_Note: data-model.md and contracts/ are N/A for this feature — no entities, no external API._

### Source Code Layout (already exists)

```text
ministrosfc/                        # repo root
├── package.json                    # workspaces, engines, root scripts
├── tsconfig.base.json              # strict TS base shared by all packages
├── docker-compose.yml              # db (postgres:15, 5100) + redis (redis:7, 5101)
├── README.md                       # Quick Start section
│
├── packages/
│   ├── cms/
│   │   ├── package.json            # @ministrosfc/cms
│   │   ├── tsconfig.json           # extends base; decorators enabled
│   │   ├── Dockerfile              # multi-stage: build → runtime
│   │   ├── .env.example            # all 10 required vars documented
│   │   └── src/
│   │       ├── config/
│   │       ├── middleware/
│   │       ├── models/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── scripts/
│   │       └── utils/
│   │
│   ├── frontend/
│   │   ├── package.json            # @ministrosfc/frontend
│   │   ├── tsconfig.json           # extends base; ESNext/bundler
│   │   ├── Dockerfile              # multi-stage: build → runtime
│   │   ├── .env.example            # 3 required vars documented
│   │   └── src/
│   │       ├── components/
│   │       ├── composables/
│   │       ├── layouts/
│   │       ├── middleware/
│   │       ├── pages/
│   │       ├── plugins/
│   │       ├── stores/
│   │       └── utils/
│   │
│   └── shared/
│       ├── package.json            # @ministrosfc/shared
│       ├── tsconfig.json           # extends base; composite: true
│       └── src/
```

**Structure Decision**: npm workspaces monorepo with 3 packages (cms, frontend, shared). No src/features/ layer — each package owns its own feature code directly to reduce indirection for a small team.
