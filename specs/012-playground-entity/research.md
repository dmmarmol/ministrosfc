# Research: 012 — Playground Entity

## Current State of Game Locations

**Decision**: Preserve `Game.location` text field; add new `playgroundId` FK relation.  
**Rationale**: Zero data loss. Legacy games keep their text. New games can optionally link a structured Playground. Display logic: show playground name if linked, else fall back to `location` text.  
**Alternatives considered**: Replace `location` with FK (rejected — destroys existing data); rename `location` to `legacyLocation` (rejected — unnecessary migration churn).

---

## Prisma Schema Change

**Decision**: New `Playground` model with `id`, `name`, `address`; add optional `playgroundId FK` + `playground` relation on `Game`.  
**Rationale**: Standard Prisma 1:N — one Playground, many Games. Deletion protection via `onDelete: Restrict` (Prisma-level; also enforced in service layer for clear error messages).  
**Alternatives considered**: `onDelete: SetNull` (rejected — silently loses the link; better to surface the constraint and let admin decide).

---

## API Endpoints

**Decision**: New resource `/api/v1/playgrounds` with CRUD. Integrate `playgroundId` into existing `/api/v1/games` create and update schemas.  
**Rationale**: Follows existing pattern — each entity has its own route file mounted in `main.ts`. Minimal surface area: `GET /`, `POST /`, `PATCH /:id`, `DELETE /:id`.  
**Alternatives considered**: Embed playground management inside game routes (rejected — violates single-responsibility; harder to test in isolation).

---

## Shared Types

**Decision**: Add `Playground` interface and updated `Game` interface (with `playgroundId?` and `playground?` expansion fields) to `packages/shared/src/types/`.  
**Rationale**: Constitution Principle VII — types used by both CMS and frontend must live in `@ministrosfc/shared`. `PlaygroundResponseDTO` used in both the route handler and any frontend composable.  
**Alternatives considered**: Local types per package (rejected — Principle VII violation).

---

## Frontend Architecture

**Decision**: New composable `usePlaygrounds.ts`; new pages `admin/playgrounds/index.vue`, `admin/playgrounds/create.vue`, `admin/playgrounds/[id]/edit.vue`; shared `PlaygroundSelect.vue` component reused in both game create and game edit.  
**Rationale**: Mirrors the exact pattern of `admin/players/*`. `PlaygroundSelect.vue` encapsulates the dropdown + inline-add flow, preventing duplication between game create and game edit.  
**Alternatives considered**: Inline playground selection logic in each game form (rejected — duplicates ~40 lines of async dropdown code in two pages).

---

## Inline "Add New" Playground Flow

**Decision**: `PlaygroundSelect.vue` detects "Agregar nueva cancha" option selected; renders an inline mini-form (name + address) below the dropdown; on submit calls `POST /api/v1/playgrounds`, then refreshes the list and auto-selects the new playground.  
**Rationale**: Spec explicitly requires no navigation away from game form. Inline form is the simplest solution: no modal dependency, no router push.  
**Alternatives considered**: Full-page redirect to `/admin/playgrounds/create` with a `?returnTo=` param (rejected — breaks the "no page leave" requirement of SC-005); dedicated `PlaygroundCreateModal.vue` (rejected — over-engineering for a 2-field form).

---

## Deletion Protection

**Decision**: `PlaygroundService.delete()` checks `prisma.game.count({ where: { playgroundId } })` before deleting. Throws 409 CONFLICT with `"PLAYGROUND_IN_USE"` error code.  
**Rationale**: Frontend delete button conditionally shows based on `game_count` returned in the list response (pre-emptive UX). Backend enforces as authoritative guard.  
**Alternatives considered**: Rely solely on Prisma `onDelete: Restrict` FK error (rejected — produces an opaque DB error; better to return a clean 409 with a human-readable message).

---

## RBAC

**Decision**: List and read = public; Create and Edit = EDITOR+; Delete = ADMIN only. Mirrors player routes exactly.  
**Rationale**: Consistent with existing permissions model. Editors manage game data; Admins own destructive operations.  
**Alternatives considered**: Any — no alternatives needed; pattern is established.

---

## Caching

**Decision**: Playground list is cached in Redis with key `playgrounds:all`; invalidated on any write. TTL: 5 minutes (same as player search cache).  
**Rationale**: Playground list rarely changes and is read on every game create/edit form load. Caching reduces DB load.  
**Alternatives considered**: No cache (acceptable at this scale, but inconsistent with existing pattern).
