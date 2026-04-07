# Tasks: 012 — Playground Entity (Game Locations)

**Input**: Design documents from `/specs/012-playground-entity/`
**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓, contracts/ ✓

**Tests**: CMS unit tests (Jest) included per plan.md TDD constitution check. Frontend Vitest tests not included (no explicit request in spec).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)
- File paths use monorepo conventions from `plan.md`

---

## Phase 1: Setup — Shared Types (Gate)

**Purpose**: Establish all cross-package type contracts before any CMS or frontend implementation begins. Constitution Principle VII hard gate — `tsc --noEmit` must pass in `packages/shared` before Phase 2.

- [ ] T001 [P] Create `packages/shared/src/types/playground.ts` — define `Playground` interface with fields: `id`, `name`, `address`, `latitude: number | null`, `longitude: number | null`, `createdAt`, `updatedAt`, `createdById`, `updatedById: string | null`, `gameCount: number`; define `PlaygroundCreatePayload` with `name: string` and `address: string`; define `PlaygroundUpdatePayload` with `name?: string` and `address?: string`
- [ ] T002 [P] Extend `packages/shared/src/types/game.ts` — add `playgroundId?: string | null` and `playground?: { id: string; name: string; address: string; latitude: number | null; longitude: number | null } | null` to the existing `Game` interface
- [ ] T003 Update `packages/shared/src/types/index.ts` — add `export * from "./playground";`
- [ ] T004 Run `npx tsc --noEmit` in `packages/shared` — must complete with zero errors before Phase 2 begins

---

## Phase 2: Foundational — CMS Backend

**Purpose**: Full backend implementation for the Playground CRUD resource and the Game model extension. MUST be complete before any frontend user story work begins.

**⚠️ CRITICAL**: No Phase 3+ work can begin until this phase is complete and `npm test` passes in `packages/cms`.

### Tests — Write First (must FAIL before implementation)

- [ ] T005 [P] Create `packages/cms/tests/unit/PlaygroundModel.test.ts` — unit tests with mocked Prisma client covering: `findAll` returns records with `gameCount` mapped from `_count.games`; `findById` returns a single record; `create` calls `prisma.playground.create` with the correct payload; `update` applies a partial update; `delete` calls `prisma.playground.delete`; `countGames(id)` returns the game count for a given playground id
- [ ] T006 [P] Create `packages/cms/tests/unit/PlaygroundService.test.ts` — unit tests with mocked Nominatim HTTP (use `jest.spyOn` on the fetch/axios call or inject a mock geocoder) covering: `list` returns results sorted alphabetically by name; `findById` throws AppError 404 when the record is not found; `create` geocodes the address and stores the first result's lat/lng; `create` throws AppError 422 code `ADDRESS_NOT_FOUND` when Nominatim returns zero results; `update` re-geocodes only when the `address` field is present in the payload; `delete` throws AppError 409 code `PLAYGROUND_IN_USE` when `countGames` returns > 0

### Database Schema

- [ ] T007 Add `Playground` model to `packages/cms/prisma/schema.prisma` — fields: `id String @id @default(uuid()) @db.Uuid`, `name String @db.VarChar(255)`, `address String @db.VarChar(500)`, `latitude Float?`, `longitude Float?`, `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt`, `createdById String @db.Uuid` with relation `createdBy User @relation("PlaygroundCreatedBy", fields: [createdById], references: [id], onDelete: Restrict)`, `updatedById String? @db.Uuid` with relation `updatedBy User? @relation("PlaygroundUpdatedBy", fields: [updatedById], references: [id], onDelete: SetNull)`, `games Game[]`
- [ ] T008 Add playground FK fields to the `Game` model in `packages/cms/prisma/schema.prisma` — add `playgroundId String? @db.Uuid` and `playground Playground? @relation(fields: [playgroundId], references: [id], onDelete: Restrict)`
- [ ] T009 Run `npx prisma migrate dev --name add_playground_entity` then `npx prisma generate` in `packages/cms` — confirm migration applies cleanly and Prisma client regenerates

### Backend Implementation

- [ ] T010 Create `packages/cms/src/models/PlaygroundModel.ts` — implement five methods using the Prisma client: `findAll` (query with `include: { _count: { select: { games: true } } }`, `orderBy: { name: 'asc' }`, map each record's `_count.games` to a `gameCount` property), `findById(id)`, `create(data)`, `update(id, data)`, `delete(id)`, and `countGames(id): Promise<number>`
- [ ] T011 Create `packages/cms/src/services/PlaygroundService.ts` — implement `list` (delegates to model), `findById` (throws AppError 404 on miss), `create` (geocodes address via `https://nominatim.openstreetmap.org/search?q=...&format=json` with a `User-Agent` header per Nominatim usage policy, uses the first result's `lat` and `lon` as `latitude`/`longitude`, throws AppError 422 `ADDRESS_NOT_FOUND` if results array is empty, sets `createdById` and `updatedById` from `req.user.id`), `update` (re-geocodes only when `address` is present in the payload, sets `updatedById`), `delete` (calls `countGames` first, throws AppError 409 `PLAYGROUND_IN_USE` if count > 0)
- [ ] T012 Create `packages/cms/src/routes/playgrounds.ts` — define 5 Express endpoints: `GET /` (list, requires authentication), `GET /:id` (single, requires authentication), `POST /` (create, requires Admin or Editor role, Zod body: `{ name: z.string().min(1).max(255), address: z.string().min(1).max(500) }`), `PATCH /:id` (update, requires Admin or Editor role, Zod body: `{ name: z.string().min(1).max(255).optional(), address: z.string().min(1).max(500).optional() }`), `DELETE /:id` (delete, requires Admin role only)
- [ ] T013 Mount the playgrounds router in `packages/cms/src/main.ts` — add `app.use('/api/v1/playgrounds', playgroundsRouter)` after the existing route mounts
- [ ] T014 [P] Extend `packages/cms/src/models/GameModel.ts` — add `include: { playground: true }` to the `findAll` and `findById` Prisma queries so the expanded playground relation is returned in game responses
- [ ] T015 [P] Add `playgroundId: z.string().uuid().optional().nullable()` to both the create and update Zod request body schemas in `packages/cms/src/routes/games.ts`
- [ ] T016 Extend `packages/cms/src/services/GameService.ts` — forward `playgroundId` (when present in the validated payload) as part of the data passed to `GameModel.create` and `GameModel.update`; do not include the `location` field in update payloads (it must never be overwritten by this feature)
- [ ] T017 Run `npx tsc --noEmit` in `packages/cms`, then `npm test` — T005 and T006 tests must pass; no existing game or auth tests may regress

**Checkpoint**: CMS API complete — all 5 playground endpoints operational, tests green, game endpoints return playground expansion.

---

## Phase 3: User Story 1 — Admin Playground Management + Map (Priority: P1) 🎯 MVP

**Goal**: Admins and Editors can list, create, edit, and delete playgrounds at `/admin/playgrounds`. The list page renders a 12-column split layout: 4-col playground table with name link, address, and a right-aligned "Eliminar" button (Admin only, disabled with tooltip when `gameCount > 0`); 8-col interactive Leaflet.js / OpenStreetMap map with pins. Clicking a table row centers the map; clicking a pin highlights the row.

**Independent Test**: Navigate to `/admin/playgrounds` — table and map render. Create a playground with a real address → row appears and pin is placed. Clicking the name link → edit page opens pre-populated. Admin clicks "Eliminar" on a playground with `gameCount === 0` → deleted. "Eliminar" is disabled and shows tooltip when `gameCount > 0`. Editor sees no "Eliminar" button.

- [ ] T018 [US1] Install `leaflet` and `@types/leaflet` in `packages/frontend` — run `npm install leaflet` and `npm install --save-dev @types/leaflet` from the `packages/frontend` directory
- [ ] T019 [US1] Create `packages/frontend/src/composables/usePlaygrounds.ts` — expose reactive state: `playgrounds: Ref<Playground[]>`, `loading: Ref<boolean>`, `error: Ref<string | null>`; implement `fetchPlaygrounds()` (GET `/api/v1/playgrounds`, stores result in `playgrounds`), `createPlayground(payload: PlaygroundCreatePayload): Promise<Playground>` (POST then calls `fetchPlaygrounds()` and returns the newly created record so the caller can auto-select it), `updatePlayground(id: string, payload: PlaygroundUpdatePayload): Promise<void>` (PATCH), `deletePlayground(id: string): Promise<void>` (DELETE then calls `fetchPlaygrounds()`)
- [ ] T020 [US1] Create `packages/frontend/src/components/PlaygroundMap.vue` — Leaflet.js wrapper component: dynamically import `leaflet` using `import('leaflet')` (deferred import for Nuxt SSR compatibility); initialize the map inside `onMounted` using `import.meta.client` guard; use OpenStreetMap tile layer `https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png` with attribution; accept `playgrounds: Playground[]` prop and render a `L.marker([lat, lng])` for each playground with valid `latitude`/`longitude`; emit `pin-click` with the playground `id` when a marker is clicked; expose `centerOn(id: string)` method that calls `map.setView([lat, lng], zoom)` for the matching playground; clear and re-render all markers reactively when the `playgrounds` prop changes
- [ ] T021 [US1] Create `packages/frontend/src/pages/admin/playgrounds/index.vue` — 12-column responsive grid: left 4 columns contain a `<table>` with columns Name (rendered as `<NuxtLink :to="\`/admin/playgrounds/${p.id}/edit\`">{{ p.name }}</NuxtLink>`), Address, and a right-aligned Actions column (show `<button @click="confirmDelete(p)" :disabled="p.gameCount > 0" title="Cancha en uso">Eliminar</button>` only when the authenticated user has Admin role; hide the Actions column entirely for Editors); right 8 columns contain `<PlaygroundMap :playgrounds="playgrounds" @pin-click="highlightRow" ref="mapRef" />`; clicking any table row calls `mapRef.centerOn(p.id)`; `highlightRow(id)` applies an accent-color CSS class to the matching `<tr>`; calls `fetchPlaygrounds()` on mount via `usePlaygrounds`; no search or filter controls
- [ ] T022 [US1] Create `packages/frontend/src/pages/admin/playgrounds/create.vue` — form with `name` (required `<input type="text">`) and `address` (required `<input type="text">`) fields; on submit calls `usePlaygrounds().createPlayground({ name, address })`; on success redirects to `/admin/playgrounds`; on API error with code `ADDRESS_NOT_FOUND` displays an inline validation message "No se pudo geocodificar la dirección. Por favor, verifica el domicilio."
- [ ] T023 [US1] Create `packages/frontend/src/pages/admin/playgrounds/[id]/edit.vue` — on mount fetches `GET /api/v1/playgrounds/:id` and pre-populates form fields with current `name` and `address`; on submit calls `usePlaygrounds().updatePlayground(id, payload)`; on success redirects to `/admin/playgrounds`; on API error code `ADDRESS_NOT_FOUND` displays same validation message as create page
- [ ] T024 [US1] Add "Canchas" navigation link to `packages/frontend/src/layouts/admin.vue` — insert a `<NuxtLink to="/admin/playgrounds">Canchas</NuxtLink>` (or equivalent nav item component) in the admin sidebar in a logical position relative to existing nav items

**Checkpoint**: US1 fully functional and independently testable — CRUD, map interaction, and delete protection all working.

---

## Phase 4: User Story 2 — Game Creation Dropdown (Priority: P1)

**Goal**: The "Ubicación" field in the game creation form is replaced by a `PlaygroundSelect` dropdown listing all playgrounds alphabetically. Users can inline-create a new playground (with required name and address fields that geocode via the API) without leaving the form. Leaving the field empty is valid.

**Independent Test**: Navigate to `/admin/games/create` — the Location field is a dropdown listing all playgrounds. Select one → game saved with `playgroundId`. Click "Agregar nueva…" → inline mini-form appears; fill in name + address → new playground created and auto-selected in the dropdown. Leave dropdown empty → game saved without a location.

- [ ] T025 [US2] Create `packages/frontend/src/components/PlaygroundSelect.vue` — a `<select>` or combobox component that: uses `usePlaygrounds().fetchPlaygrounds()` on mount to populate options; renders each option as `{{ p.name }} — {{ p.address }}`; shows "No hay canchas registradas" placeholder option when the list is empty; renders an "Agregar nueva…" option at the bottom of the list that, when selected, toggles an inline mini-form with `name` (required) and `address` (required) inputs; on mini-form submit calls `usePlaygrounds().createPlayground(payload)` → on success closes the mini-form and auto-selects the new playground's id; emits `update:modelValue` with the selected playground id (`string`) or `null` when cleared; accepts `modelValue: string | null` prop for v-model compatibility
- [ ] T026 [US2] Replace the free-text location `<input>` with `<PlaygroundSelect v-model="form.playgroundId" />` in `packages/frontend/src/pages/admin/games/create.vue`; include `playgroundId: form.playgroundId ?? null` in the game create request payload; remove the old `location` text input (the legacy field is preserved in the DB but is no longer set on new games)

**Checkpoint**: US2 functional — game creation uses the playground dropdown with inline-add support.

---

## Phase 5: User Story 3 — Game Edit Dropdown (Priority: P2)

**Goal**: The "Ubicación" field in the game edit form uses `<PlaygroundSelect>` pre-populated with the game's current playground. Legacy games with a free-text `location` and no `playgroundId` display the legacy text as read-only context above the empty dropdown.

**Independent Test**: Edit a game that has a `playgroundId` → dropdown shows the current playground pre-selected. Change selection → updated correctly on save. Edit a legacy game (has `location` text, no `playgroundId`) → legacy text shown as read-only; dropdown empty; user can optionally select a new playground going forward.

- [ ] T027 [US3] Replace the free-text location input with `<PlaygroundSelect v-model="form.playgroundId" />` in `packages/frontend/src/pages/admin/games/[id]/edit.vue`; after loading the game, seed `form.playgroundId` from `game.playgroundId`; when `game.playground` is `null` but `game.location` is a non-empty string, render `<p class="text-sm text-gray-500">Ubicación anterior: {{ game.location }}</p>` as read-only context above the dropdown; include `playgroundId: form.playgroundId` in the PATCH payload on save; do NOT include `location` in the PATCH payload
- [ ] T028 [US3] Verify `packages/cms/src/services/GameService.ts` — confirm that the `update` method never includes `location` in the data passed to the model when processing game edit requests (defensive guard: if `location` is somehow present in the payload, strip it before forwarding to the model); add the guard if not already present

**Checkpoint**: US3 functional — game edit uses dropdown; legacy free-text location is preserved and displayed as read-only context.

---

## Phase 6: User Story 4 — Public Pages Location Display (Priority: P3)

**Goal**: Public visitors viewing the game schedule or game details page see the playground name when a game has one assigned, falling back to the legacy `location` text otherwise. Games with neither source display no location.

**Independent Test**: View the public schedule page — games with `playground` assigned show `playground.name`; legacy games (no playground, has `location` text) show `game.location`; games with neither display no location element.

- [ ] T029 [US4] Update all public-facing page and component templates in `packages/frontend/src/` that currently render a game's location — replace any direct reference to `game.location` with the expression `game.playground?.name ?? game.location ?? ''`; when the result is an empty string, do not render the location element (or render a visually hidden placeholder); identify all affected templates by searching for `game.location` in the frontend `src/` directory

**Checkpoint**: US4 functional — public location display uses playground name with graceful fallback.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T030 [P] Run `npx tsc --noEmit` in all three packages — `packages/shared`, `packages/cms`, and `packages/frontend` must each report zero TypeScript errors
- [ ] T031 [P] Run the full test suite (`npm run test:all` from the workspace root) — all existing and new tests must pass; no regressions in any package
- [ ] T032 Run manual SC-001–SC-006 verification per `specs/012-playground-entity/quickstart.md` — confirm each scenario passes; document any unexpected behavior for follow-up

**Checkpoint**: Feature complete — all types valid, all tests green, all acceptance scenarios verified.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Shared Types)**: No dependencies — start immediately; blocks all phases
- **Phase 2 (CMS Backend)**: Requires Phase 1 complete — blocks all frontend phases
- **Phase 3 (US1)**: Requires Phase 2 complete — no dependency on Phases 4–5
- **Phase 4 (US2)**: Requires Phase 2 complete + Phase 3 complete (`usePlaygrounds.ts` used by T025)
- **Phase 5 (US3)**: Requires Phase 4 complete (`PlaygroundSelect.vue` from T025 is reused)
- **Phase 6 (US4)**: Requires Phase 2 complete only — can run in parallel with Phases 3–5
- **Phase 7 (Polish)**: Requires all selected stories complete

### User Story Dependencies

- **US1 (P1)**: Starts after Phase 2 — independent of US2/US3/US4
- **US2 (P1)**: Starts after Phase 2 + US1 frontend core (`usePlaygrounds`)
- **US3 (P2)**: Starts after US2 (`PlaygroundSelect.vue` must exist)
- **US4 (P3)**: Starts after Phase 2 — can run in parallel with US1

### Within Phase 2 (Execution Order)

1. T005 + T006 in parallel (write tests — they must FAIL before T010–T011)
2. T007 → T008 sequential (schema changes), then T009 (migration)
3. T010 → T011 → T012 → T013 sequential (model → service → route → mount)
4. T014 + T015 in parallel (game model and route extensions)
5. T016 after T015 (GameService depends on route schema change)
6. T017 last (validates everything)

### Parallel Opportunities

- **Phase 1**: T001 and T002 are parallel (different files)
- **Phase 2 tests**: T005 and T006 are parallel (different files)
- **Phase 2 game extensions**: T014 and T015 are parallel
- **Phase 3 pages**: T021, T022, T023 are parallel (different page files, after T019 and T020)
- **Phase 6 + Phase 3**: T029 can start immediately after Phase 2, concurrent with Phase 3
- **Phase 7**: T030 and T031 are parallel

---

## Parallel Execution Examples

### Phase 2 — CMS Backend

```
# Step 1 — Write tests in parallel (before schema):
Task T005: "Create PlaygroundModel.test.ts (mocked Prisma)"
Task T006: "Create PlaygroundService.test.ts (mocked Nominatim)"

# Step 2 — Schema (sequential):
Task T007: "Add Playground model to schema.prisma"
  → Task T008: "Add playgroundId FK to Game in schema.prisma"
    → Task T009: "Run prisma migrate dev + prisma generate"

# Step 3 — Core backend (sequential):
Task T010: "Create PlaygroundModel.ts"
  → Task T011: "Create PlaygroundService.ts"
    → Task T012: "Create playgrounds.ts route"
      → Task T013: "Mount router in main.ts"

# Step 4 — Game extensions (parallel with each other, after T009):
Task T014: "Extend GameModel.ts to include playground"
Task T015: "Add playgroundId to games.ts Zod schemas"
  → Task T016: "Extend GameService.ts to forward playgroundId"

# Step 5 — Validation:
Task T017: "tsc --noEmit + npm test in packages/cms"
```

### Phase 3 — US1 Admin Pages

```
# After T019 (usePlaygrounds.ts) and T020 (PlaygroundMap.vue):
Task T021: "Create admin/playgrounds/index.vue"    ← parallel
Task T022: "Create admin/playgrounds/create.vue"   ← parallel
Task T023: "Create admin/playgrounds/[id]/edit.vue" ← parallel
  → Task T024: "Add Canchas nav to admin.vue"
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

1. Complete Phase 1: Shared Types (Gate)
2. Complete Phase 2: CMS Backend (critical — blocks all frontend work)
3. Complete Phase 3: US1 — Admin Playground CRUD + Map
4. **STOP and VALIDATE**: Test admin playground management independently
5. Complete Phase 4: US2 — Game Creation Dropdown
6. **STOP and VALIDATE**: Test game creation with playground selector
7. Deploy/demo if ready

### Full Feature Scope

Continue with:
8. Phase 5: US3 — Game Edit Dropdown
9. Phase 6: US4 — Public Pages Location Display
10. Phase 7: Polish and verification

---

## Task Summary

| Phase | Tasks | User Story | Parallel |
|-------|-------|-----------|---------|
| 1 — Shared Types (Gate) | T001–T004 | Setup | T001, T002 |
| 2 — CMS Backend | T005–T017 | Foundational | T005+T006, T014+T015 |
| 3 — US1 Admin + Map | T018–T024 | US1 (P1) | T021, T022, T023 |
| 4 — US2 Game Create | T025–T026 | US2 (P1) | — |
| 5 — US3 Game Edit | T027–T028 | US3 (P2) | — |
| 6 — US4 Public Display | T029 | US4 (P3) | runs in parallel with Phase 3 |
| 7 — Polish | T030–T032 | Cross-cutting | T030, T031 |

**Total tasks**: 32  
**Parallelizable**: ~12 tasks across all phases  
**MVP scope**: Phases 1–4 (T001–T026, 26 tasks)
