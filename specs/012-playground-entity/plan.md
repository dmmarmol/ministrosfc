# Implementation Plan: Playground Entity (Game Locations)

**Branch**: `chore/012-playground-entity` | **Date**: 2026-04-17 | **Spec**: `/specs/012-playground-entity/spec.md`
**Input**: Feature specification from `/specs/012-playground-entity/spec.md`

## Summary

Add a `Playground` entity representing physical locations where Ministros FC plays games. This replaces the free-text `Game.location` input with a structured dropdown backed by a managed catalog. Admins and Editors can manage playgrounds via a new `/admin/playgrounds` CRUD section that renders a split layout: a 4-column table and an 8-column interactive OpenStreetMap. The game creation and edit forms gain a `PlaygroundSelect` component that supports inline creation of a new playground without leaving the form. Address geocoding is performed via OpenStreetMap Nominatim on every create/update; lat/lng are stored with the record and used to place map pins. Audit fields (`createdBy`, `updatedBy`) track which user created or last modified each playground. Legacy free-text `location` data is fully preserved — no data migration required.

**Technical approach**: New `Playground` Prisma model + FK on `Game`; new `/api/v1/playgrounds` REST resource + Nominatim geocoding in `PlaygroundService`; new `Playground` types in `@ministrosfc/shared`; frontend `usePlaygrounds` composable + `PlaygroundSelect.vue` (game forms) + `PlaygroundMap.vue` (Leaflet.js, admin list page only).

## Technical Context

**Language/Version**: TypeScript (Node 18+ LTS, Nuxt 4 / Vue 3)  
**Primary Dependencies**: Express + Prisma (CMS), Nuxt 4 + Pinia (frontend), Zod (request validation), `@ministrosfc/shared` (type contracts), Leaflet.js + OpenStreetMap tiles (admin map), OpenStreetMap Nominatim (geocoding)  
**Storage**: PostgreSQL (Prisma ORM) + Redis (session/cache — no changes for this feature)  
**Testing**: Jest (CMS unit/integration), Vitest (frontend unit), Playwright (E2E — optional for this feature)  
**Target Platform**: Web — CMS API (Express) + Nuxt frontend  
**Project Type**: Monorepo web application (`packages/shared`, `packages/cms`, `packages/frontend`)  
**Performance Goals**: Playground list endpoint p95 < 200ms; dropdown populates within 2s on game creation form; map pins visible within 3s of `/admin/playgrounds` page load (SC-006)  
**Constraints**:

1. Legacy `Game.location` text field must not be removed or cleared — no data loss.
2. Foreign key uses `onDelete: Restrict` — service layer catches violation and returns 409 before DB error surfaces.
3. New types shared across packages must be defined in `@ministrosfc/shared` before consumer packages reference them (Constitution Principle VII gate).
4. Address is required on create and edit; geocoding via Nominatim is performed before save — failure returns 422 `ADDRESS_NOT_FOUND`.
5. Google Maps MUST NOT be used anywhere in this feature.

**Scale/Scope**: Small catalog (order of magnitude: tens of playgrounds). No pagination required for list endpoint.

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

### Pre-Design Gate

1. **SPEC-FIRST**: PASS — `spec.md` exists with FR-001–023 and SC-001–006 fully defined.
2. **PLAN-DRIVEN**: PASS — this document is the plan artifact.
3. **TDD**: PASS — unit tests for `PlaygroundService` and `PlaygroundModel` are first-class tasks, ordered before implementation.
4. **Shared types gate (Principle VII)**: PASS (design decision) — `Playground`, `PlaygroundCreatePayload`, `PlaygroundUpdatePayload` are used by both CMS and frontend. They will be placed in `packages/shared/src/types/playground.ts` and exported from `@ministrosfc/shared` **before any CMS or frontend implementation tasks begin**.

### Post-Design Gate (Re-check)

1. No constitutional violations identified.
2. Complexity Tracking table not required (no exceptions to any principle).

## Project Structure

### Documentation (this feature)

```text
specs/012-playground-entity/
├── plan.md              ← this file
├── research.md          ← Phase 0 output
├── data-model.md        ← Phase 1 output
├── quickstart.md        ← Phase 1 output
├── contracts/
│   └── playground-contract.md  ← Phase 1 output
└── tasks.md             ← /speckit.tasks output (not yet created)
```

### Source Code (repository root)

```text
packages/shared/
└── src/types/
    ├── playground.ts        ← NEW: Playground, PlaygroundCreatePayload, PlaygroundUpdatePayload
    ├── game.ts              ← MODIFIED: extend Game with playgroundId?, playground? (includes lat/lng)
    └── index.ts             ← MODIFIED: add export * from "./playground"

packages/cms/
├── prisma/
│   ├── schema.prisma        ← MODIFIED: add Playground model + Game.playgroundId FK
│   └── migrations/
│       └── <ts>_add_playground_entity/  ← NEW migration
├── src/
│   ├── models/
│   │   ├── PlaygroundModel.ts   ← NEW
│   │   └── GameModel.ts         ← MODIFIED: include playground expansion
│   ├── services/
│   │   ├── PlaygroundService.ts ← NEW (includes Nominatim geocoding)
│   │   └── GameService.ts       ← MODIFIED: pass playgroundId through
│   └── routes/
│       ├── playgrounds.ts       ← NEW
│       └── games.ts             ← MODIFIED: add playgroundId to create/update schemas
│   └── main.ts                  ← MODIFIED: mount /api/v1/playgrounds router
└── tests/
    └── unit/
        ├── PlaygroundModel.test.ts   ← NEW
        └── PlaygroundService.test.ts ← NEW (includes geocoding mock)

packages/frontend/
└── src/
    ├── composables/
    │   └── usePlaygrounds.ts        ← NEW
    ├── components/
    │   ├── PlaygroundSelect.vue     ← NEW (reused in admin game forms)
    │   └── PlaygroundMap.vue        ← NEW (Leaflet.js; used only on admin/playgrounds/index.vue)
    ├── pages/
    │   ├── admin/
    │   │   ├── playgrounds/
    │   │   │   ├── index.vue        ← NEW (12-col grid: table + map)
    │   │   │   ├── create.vue       ← NEW
    │   │   │   └── [id]/edit.vue    ← NEW
    │   │   └── games/
    │   │       ├── create.vue       ← MODIFIED: PlaygroundSelect replaces text input
    │   │       └── [id]/edit.vue    ← MODIFIED: PlaygroundSelect replaces text input
    └── layouts/
        └── admin.vue                ← MODIFIED: add "Canchas" nav link
```

**Structure Decision**: Monorepo web application layout. All changes are co-located in the existing package trio — no new packages.

## Phase Design

### Phase 1 — Shared Types (Gate)

Establish all cross-package type contracts before any implementation.

1. Create `packages/shared/src/types/playground.ts` — `Playground` (with `latitude`, `longitude`, `createdById`, `updatedById`), `PlaygroundCreatePayload`, `PlaygroundUpdatePayload`.
2. Extend `packages/shared/src/types/game.ts` — add `playgroundId?` and `playground?` (with `latitude`, `longitude`) to `Game` interface.
3. Update `packages/shared/src/types/index.ts` — add `export * from "./playground"`.
4. Run `npx tsc --noEmit` in `packages/shared` — must pass before Phase 2.

### Phase 2 — Database Migration

1. Add `Playground` model to `packages/cms/prisma/schema.prisma` (including `address` as required, `latitude?`, `longitude?`, `createdById` FK, `updatedById?` FK).
2. Add `playgroundId` FK on `Game` with `onDelete: Restrict`.
3. Run `prisma migrate dev --name add_playground_entity`.
4. Run `prisma generate` to update Prisma Client.

### Phase 3 — CMS: Playground Resource

Deliver the full CRUD backend for `Playground`.

1. `PlaygroundModel.ts` — all DB operations (`findAll`, `findById`, `create`, `update`, `delete`, `countGames`; `create`/`update` receive pre-geocoded `latitude`/`longitude` from the service layer).
2. `PlaygroundModel.test.ts` unit tests — mocked Prisma client.
3. `PlaygroundService.ts` — business rules: sort by name, 404 on missing, 409 `PLAYGROUND_IN_USE` on delete; **geocodes address via Nominatim** before create/update and rejects with 422 `ADDRESS_NOT_FOUND` if geocoding fails; sets `createdById`/`updatedById` from authenticated user context.
4. `PlaygroundService.test.ts` unit tests (mock Nominatim HTTP call with `jest.spyOn` or dependency injection).
5. `playgrounds.ts` route — all 5 endpoints with correct RBAC guards.
6. Mount `/api/v1/playgrounds` in `main.ts`.
7. Run `tsc --noEmit` and `npm test` in `packages/cms`.

### Phase 4 — CMS: Game Integration

Extend the game resource to accept and return playground data.

1. `GameModel.ts` — include `playground` relation expansion in `findAll`/`findById`.
2. `games.ts` route — add `playgroundId: z.uuid().optional()` to create/update Zod schemas.
3. `GameService.ts` — forward `playgroundId` in create/update payloads.
4. Run `tsc --noEmit` and `npm test` in `packages/cms`.

### Phase 5 — Frontend: Core Components

1. `usePlaygrounds.ts` composable — `fetchPlaygrounds`, `createPlayground`, `updatePlayground`, `deletePlayground`, loading state.
2. `PlaygroundSelect.vue` — dropdown with "Agregar nueva" inline mini-form trigger; emits `update:modelValue`.
3. `PlaygroundMap.vue` — Leaflet.js wrapper using OpenStreetMap tiles; accepts `playgrounds: Playground[]` prop; emits `pin-click(id)` and exposes `centerOn(id)` method; used only on `admin/playgrounds/index.vue`.

### Phase 6 — Frontend: Admin Pages

1. `admin/playgrounds/index.vue` — 12-column grid layout: 4-col table (playground name as edit link, address, "Eliminar" button for Admins only on right side, no filters) + 8-col `<PlaygroundMap>` panel; clicking a row calls `centerOn(id)` on the map; pin-click event highlights the corresponding row with the accent color.
2. `admin/playgrounds/create.vue` — create form.
3. `admin/playgrounds/[id]/edit.vue` — edit form, pre-populated.
4. `admin.vue` layout — add "Canchas" nav link.

### Phase 7 — Frontend: Game Form Integration

1. `admin/games/create.vue` — replace free-text location input with `<PlaygroundSelect>`.
2. `admin/games/[id]/edit.vue` — replace free-text location input with `<PlaygroundSelect>`; seed `playgroundId` from loaded game; show legacy `location` text as read-only context when present and no playground assigned.
3. Public pages — update location display logic: `game.playground?.name ?? game.location ?? ''`.
4. Run `tsc --noEmit` and `npm test` in `packages/frontend`.

### Phase 8 — Verification

1. Full test suite: `npm run test:all`.
2. SC-001 through SC-006 manual spot-checks per `quickstart.md`.
3. Commit planning artifacts: `git add specs/012-playground-entity/ && git commit`.

## Risks & Mitigations

1. **Risk**: `onDelete: Restrict` FK constraint surfaces as an opaque Prisma error if service-layer guard is bypassed.
   - **Mitigation**: Service-layer `countGames()` check runs before delete attempt. Error boundary in route handler catches any Prisma FK error and maps it to 409.

2. **Risk**: Legacy `Game.location` data silently overwritten by form edits.
   - **Mitigation**: Edit form renders `location` as read-only text, never sends it in the PATCH payload. `GameService.update()` preserves the `location` field unless explicitly included in the payload.

3. **Risk**: `PlaygroundSelect` inline creation leaves a stale dropdown if `usePlaygrounds` ref is not refreshed.
   - **Mitigation**: `createPlayground()` in composable calls `fetchPlaygrounds()` after POST resolves, then auto-selects the new id from the refreshed list.

4. **Risk**: OpenStreetMap Nominatim rate-limiting (1 request/second for free usage) could slow down rapid test runs or bulk creates.
   - **Mitigation**: Nominatim calls are always mocked in unit tests. In integration tests, use a single geocoded fixture. The CMS service adds a `User-Agent` header per Nominatim's usage policy.

### Schema rollback

1. Prisma migration is additive only (new model + nullable FK). Rolling back is `prisma migrate resolve --rolled-back <migration_name>` + dropping the new columns.
2. No existing data is modified — rollback has no data-loss risk.

### Code rollback

1. All new files (`PlaygroundModel.ts`, `PlaygroundService.ts`, `playgrounds.ts`, `usePlaygrounds.ts`, `PlaygroundSelect.vue`, new admin pages) can be deleted without affecting existing functionality.
2. Game form changes (`create.vue`, `edit.vue`) can be reverted to text input with no downstream breakage.
3. `main.ts` router mount and `admin.vue` nav link are one-line reversions.
