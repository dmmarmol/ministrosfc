# Research: 012 — Playground Entity + Address Autocomplete (Extension)

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

---

## Extension: Address Autocomplete

### Address Search API

**Decision**: Use Nominatim `/search` endpoint as-is for autocomplete, proxied through a new CMS route `GET /api/v1/address/search?q=...`.  
**Rationale**: Nominatim's `/search?q=...&format=json&limit=5` endpoint works well as an autocomplete source — it returns `display_name`, `lat`, `lon`, and `place_id` in a single call. The same API is already integrated in `PlaygroundService.ts` for post-save geocoding; reusing it avoids adding any new external dependency. Nominatim is fully open source (OSM data under ODbL license), has no API keys, and has no billing.  
**Alternatives considered**:

- **Photon (komoot.io)** — purpose-built OSM autocomplete with faster response times and fuzzy matching, but introduces a dependency on a third-party service with no formal SLA. At Ministros FC scale (< 10 concurrent admins), Nominatim quality is sufficient.
- **Direct browser → Nominatim** — rejected because Nominatim requires a `User-Agent` header that browsers cannot set for cross-origin requests (CORS preflight blocks non-simple headers); maintaining this in the server proxy is cleaner.
- **Pelias (self-hosted)** — powerful open source geocoder but requires running a separate service with significant infrastructure overhead (Elasticsearch + import pipeline); overkill for a single-team app.

---

### CMS Proxy Architecture

**Decision**: New Express route module `packages/cms/src/routes/address.ts` + service `AddressSearchService.ts`. No auth required on the endpoint.  
**Rationale**: The address search data is entirely public (Nominatim/OSM). Making it public on our side is correct. Player profile forms are used by any authenticated user; Playground forms by EDITOR+. Centralizing auth at the page/layout level (already done) avoids coupling a utility search endpoint to role checks.  
**Alternatives considered**: Require authentication (over-engineering for public open data); put Nominatim URL in frontend env and call directly (rejected — CORS + User-Agent issues).

---

### Rate Limiting and Debouncing

**Decision**: 400ms frontend debounce, 3-character minimum input length.  
**Rationale**: Nominatim usage policy asks for ≤ 1 req/s from a single server. At team size (< 10 concurrent users), 400ms debounce effectively limits peak load to ~2.5 req/s which is within safe range on the server (bounded further by the small team). The 3-char minimum eliminates noise queries ("Bu", "Co") that produce overly broad results.  
**Alternatives considered**: Server-side rate limiter per IP (valid but adds complexity; deferred to future if team grows); 300ms debounce (too tight for Nominatim policy); 500ms (unnecessary UX penalty).

---

### Pre-Geocoded Coordinates Optimization

**Decision**: Extend `PlaygroundCreatePayload` and `PlaygroundUpdatePayload` with optional `latitude` and `longitude` fields. When these are present in the CMS request body, `PlaygroundService` skips the Nominatim geocode call.  
**Rationale**: When a user selects from the autocomplete dropdown, the `AddressSuggestion` already contains `lat`/`lon` from the search response. Forwarding these prevents a redundant second Nominatim round-trip on the server (which adds ~300–800ms of latency and an extra usage count). The server still geocodes as a fallback when `lat`/`lon` are absent (e.g., user manually typed an address without selecting from the dropdown).  
**Alternatives considered**: Always geocode on the server (simpler but wastes Nominatim calls and adds latency); cache the coords client-side only (rejected — server is authoritative for the stored Playground record).

---

### Component Design

**Decision**: Single `AddressAutocompleteInput.vue` combobox component with `v-model` (text) + optional `@select` event (full `AddressSuggestion` with `lat`/`lon`).  
**Rationale**: Two call sites have different needs — playground forms need `lat`/`lon` for the optimization; profile form only needs the text. Using a single event pair (`update:modelValue` + `select`) keeps the component API clean and non-prescriptive: callers opt into coordinate handling independently.  
**Alternatives considered**: Two separate components (unnecessary duplication); emitting coords always via `update:modelValue` with a different `modelValue` type (couples the text-only callers to a richer object, breaking simplicity).

---

### Country Bias

**Decision**: Hardcode `countrycodes=ar` (Argentina) in `AddressSearchService.ts`; make it overridable via env var `ADDRESS_SEARCH_COUNTRY`.  
**Rationale**: Ministros FC is an Argentine amateur team; all games are played in Argentina. Biasing results to AR produces far more relevant suggestions. The env var override makes the code reusable for future forks or deployments.  
**Alternatives considered**: Expose country as a component prop (unnecessary complexity at this stage — no multi-country use case); no country bias (produces many irrelevant international results for short queries like "cordoba").
