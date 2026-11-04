# Implementation Plan: Pre-release bugfixes

**Branch**: `021-pre-release-bugfixes` | **Date**: 2026-10-30 | **Spec**: `/specs/021-pre-release-bugfixes/spec.md`

**Input**: Feature specification from `/specs/021-pre-release-bugfixes/spec.md`

## Summary

This release-prep feature consolidates a set of UI, navigation, and composable bugs discovered during manual QA. The fix scope is intentionally narrow: preserve route context via a shared `returnUrl` flow, refresh admin game data after save, normalize display labels for statuses and competition types, improve roster filter/search behavior, add dark mode contrast support, and align dashboard/admin tables and shared frontend composition with existing patterns.

## Technical Context

**Language/Version**: TypeScript 5.x, Vue 3, Nuxt 4, Node.js 23+ LTS

**Primary Dependencies**: Nuxt, Vue, @nuxt/ui, Pinia, @ministrosfc/shared, Express CMS API, Prisma models on the backend side

**Storage**: PostgreSQL via CMS + Redis for session/cache support (no new schema changes required for this bugfix set)

**Testing**: Vitest + Vue Test Utils for frontend unit tests; existing Jest/Playwright coverage where relevant; focused verification runs for touched screens and composables

**Target Platform**: Web application (public site + admin dashboard), desktop and mobile browsers, with dark-mode support via HTML `dark` class

**Project Type**: Web application (frontend + existing CMS backend)

**Performance Goals**: Preserve current page response behavior; no new synchronous heavy work in the UI, prioritizing small DOM/state updates and existing caches

**Constraints**: Must remain within existing shared DTO contracts, avoid broad refactors, keep UI success paths accessible, and preserve admin navigation context via a shared navigation pattern

**Scale/Scope**: Mostly frontend route and component fixes across the admin panel, public roster views, shared back-navigation component, and dashboard data composition; no database migration planned for this feature

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

This feature passes the constitution gate because it is a scoped, user-visible bugfix feature with a completed specification, no data model migration, and no broad architecture expansion. It preserves the requirement to keep pages thin and extracted components cohesive, uses shared contracts from `@ministrosfc/shared`, and avoids introducing new cross-package DTOs without justification. The work will still be organized around page-scoped sub-components where the UI blocks are substantial.

Pass conditions satisfied:
- Feature is discrete and user-facing
- Spec exists and is filled out before implementation
- TDD expected for any new frontend behavior
- Shared contracts and UI composition patterns remain aligned with repo guidance
- No constitution violation requiring a complexity exception

## Project Structure

### Documentation (this feature)

```text
specs/021-pre-release-bugfixes/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (if needed for route contract notes)
├── checklists/
│   └── requirements.md  # Spec checklist
└── spec.md              # Feature specification
```

### Source Code (repository root)

```text
packages/
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── ui/
│   │   │   └── tournament/
│   │   ├── composables/
│   │   │   ├── admin/
│   │   │   └── useGames.ts
│   │   ├── pages/
│   │   │   ├── admin/
│   │   │   ├── rosters/
│   │   │   └── tournaments/
│   │   └── utils/
│   └── tests/
├── cms/
│   └── src/
│       ├── routes/
│       ├── services/
│       └── models/
└── shared/
    └── src/
        └── types/
```

**Structure Decision**: This feature remains in the existing monorepo structure. The adjustments are concentrated in the frontend `pages`, `components`, and `composables`, with the CMS API consumed through the established routes and shared type contracts rather than a new backend domain or schema change.

## Complexity Tracking

No constitution violations were identified for this work, so no formal complexity exception is required.
