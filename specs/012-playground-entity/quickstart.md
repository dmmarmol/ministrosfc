# Quickstart: 012 — Playground Entity

**Branch**: `chore/012-playground-entity`

---

## Prerequisites

- Node.js 18+ (LTS)
- PostgreSQL running on port 5100
- Redis running on port 5101
- Docker/Podman for local services (`npm run docker:up`)

## Setup

```bash
# 1. Start services
npm run docker:up

# 2. Install dependencies
npm install

# 3. Generate Prisma client (after migration in Step 2 below)
npm run gen:prisma

# 4. Start dev servers
npm run dev:all
```

- CMS: http://localhost:5102
- Frontend: http://localhost:5103

## Implementation Order

Follow this sequence to avoid broken intermediate states. Run verification after each step.

---

### Step 1 — Shared types (`packages/shared`)

Add the `Playground` type definitions before any consumer package changes.

**New file**: `packages/shared/src/types/playground.ts`

```ts
export interface Playground {
  id: string;
  name: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
  updatedAt: string;
  createdById: string;
  updatedById: string | null;
}

export interface PlaygroundCreatePayload {
  name: string;
  address: string;
}

export interface PlaygroundUpdatePayload {
  name?: string;
  address?: string | null;
}
```

**Edit**: `packages/shared/src/types/game.ts` — extend the `Game` interface:

```ts
// Add to Game interface
playgroundId?: string | null;
playground?: { id: string; name: string; address: string; latitude: number | null; longitude: number | null } | null;
```

**Edit**: `packages/shared/src/types/index.ts` — add export:

```ts
export * from "./playground";
```

**Verify**:

```bash
cd packages/shared && npx tsc --noEmit
```

---

### Step 2 — Prisma migration (`packages/cms`)

Add the `Playground` model and foreign key on `Game`.

**Edit**: `packages/cms/prisma/schema.prisma`

```prisma
model Playground {
  id          String    @id @default(uuid()) @db.Uuid
  name        String    @db.VarChar(255)
  address     String    @db.VarChar(500)
  latitude    Float?
  longitude   Float?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  createdById String    @db.Uuid
  updatedById String?   @db.Uuid

  createdBy   User      @relation("PlaygroundCreatedBy", fields: [createdById], references: [id])
  updatedBy   User?     @relation("PlaygroundUpdatedBy", fields: [updatedById], references: [id])

  games       Game[]
}

// In existing Game model, add:
playgroundId  String?     @db.Uuid
playground    Playground? @relation(fields: [playgroundId], references: [id], onDelete: Restrict)
```

**Run migration**:

```bash
npm run prisma:migrate --workspace=@ministrosfc/cms
# When prompted: add_playground_entity

npm run gen:prisma
```

---

### Step 3 — CMS: Playground CRUD (`packages/cms`)

Add model, service, route, and mount it.

**New file**: `packages/cms/src/models/PlaygroundModel.ts`

- `findAll()`
- `findById(id: string)`
- `create(data: PlaygroundCreatePayload)`
- `update(id: string, data: PlaygroundUpdatePayload)`
- `delete(id: string)`
- `countGames(id: string)` — for deletion protection

**New file**: `packages/cms/src/services/PlaygroundService.ts`

- `list()` → sorted by name ASC
- `get(id)` → 404 if missing
- `create(data, userId)` → trim name and address; **geocode address via Nominatim**; reject with 422 `ADDRESS_NOT_FOUND` if geocoding fails; set `latitude`, `longitude`, `createdById = userId`
- `update(id, data, userId)` → 404 if missing; **re-geocode if address changed**; set `updatedById = userId`
- `remove(id)` → check `countGames(id) > 0` → throw 409 `PLAYGROUND_IN_USE`; otherwise delete

**New file**: `packages/cms/src/routes/playgrounds.ts`

- `GET /` — public
- `GET /:id` — public
- `POST /` — `requireRole("EDITOR")`
- `PATCH /:id` — `requireRole("EDITOR")`
- `DELETE /:id` — `requireRole("ADMIN")`

**Edit**: `packages/cms/src/main.ts` — mount playground router:

```ts
import playgroundsRouter from "./routes/playgrounds";
app.use("/api/v1/playgrounds", playgroundsRouter);
```

**Extend game integration**:

- `packages/cms/src/models/GameModel.ts` — include `playground` relation expansion in `findAll`/`findById` queries
- `packages/cms/src/routes/games.ts` — add `playgroundId: z.string().uuid().optional()` to `gameCreateSchema` and `gameUpdateSchema`
- `packages/cms/src/services/GameService.ts` — pass `playgroundId` through create/update payloads

**Verify**:

```bash
cd packages/cms && npx tsc --noEmit
npm test --workspace=@ministrosfc/cms
```

---

### Step 4 — Frontend: Admin CRUD + components (`packages/frontend`)

Add the composable, shared components, and pages.

**New file**: `packages/frontend/src/composables/usePlaygrounds.ts`

- `playgrounds` ref, `loading` ref
- `fetchPlaygrounds()` — `$api('/api/v1/playgrounds')`
- `createPlayground(data)` — POST + refresh
- `updatePlayground(id, data)` — PATCH + refresh
- `deletePlayground(id)` — DELETE + refresh

**New file**: `packages/frontend/src/components/PlaygroundSelect.vue`

- `<select>` dropdown from `usePlaygrounds`; emits `update:modelValue`
- Includes "Agregar nueva" option
- When "Agregar nueva" selected → renders inline mini-form (name + address fields)
- On inline submit: `createPlayground()` → auto-select new playground's id → hide mini-form
- Props: `modelValue: string | null`, `disabled?: boolean`

**New file**: `packages/frontend/src/components/PlaygroundMap.vue`

- Leaflet.js map with OpenStreetMap tiles (no Google Maps)
- Accepts `playgrounds: Playground[]` prop
- Renders a pin at `(latitude, longitude)` for each playground that has geocoded coords
- Emits `pin-click(id: string)` when a marker is clicked
- Exposes `centerOn(id: string)` method to pan the map to a specific pin

**New pages**:

| File                                        | Description                                                                                                                                                                                            |
| ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/pages/admin/playgrounds/index.vue`     | 12-column grid: 4-col table (name as edit link, address, "Eliminar" for Admins; no filters) + 8-col `<PlaygroundMap>`; row click → `centerOn(id)`; `pin-click` event → highlight row with accent color |
| `src/pages/admin/playgrounds/create.vue`    | Create form                                                                                                                                                                                            |
| `src/pages/admin/playgrounds/[id]/edit.vue` | Edit form (pre-populated)                                                                                                                                                                              |

**Edit**: `packages/frontend/src/layouts/admin.vue` — add sidebar nav link:

```html
<NuxtLink to="/admin/playgrounds">Canchas</NuxtLink>
```

**Edit game forms**:

- `src/pages/admin/games/create.vue` — replace text `location` input with `<PlaygroundSelect v-model="form.playgroundId" />`
- `src/pages/admin/games/[id]/edit.vue` — same replacement; seed `form.playgroundId` from loaded game

**Update public pages** (if used):

- Any public page displaying a game's location: render `game.playground?.name ?? game.location ?? ''`

**Verify**:

```bash
cd packages/frontend && npx tsc --noEmit
npm test --workspace=@ministrosfc/frontend
```

---

### Step 5 — Full suite verification

```bash
# All tests
npm run test:all

# Type-check all packages
npm run typecheck:all  # or equivalent per-package tsc --noEmit
```

---

## Key Endpoints (new/modified)

| Method   | Path                      | Auth    | Description                                   |
| -------- | ------------------------- | ------- | --------------------------------------------- |
| `GET`    | `/api/v1/playgrounds`     | Public  | List all playgrounds (name ASC)               |
| `GET`    | `/api/v1/playgrounds/:id` | Public  | Get single playground                         |
| `POST`   | `/api/v1/playgrounds`     | EDITOR+ | Create playground                             |
| `PATCH`  | `/api/v1/playgrounds/:id` | EDITOR+ | Update playground                             |
| `DELETE` | `/api/v1/playgrounds/:id` | ADMIN   | Delete playground (404/409 guards)            |
| `POST`   | `/api/v1/games`           | EDITOR+ | **Modified**: accepts `playgroundId`          |
| `PATCH`  | `/api/v1/games/:id`       | EDITOR+ | **Modified**: accepts `playgroundId`          |
| `GET`    | `/api/v1/games`           | Public  | **Modified**: includes `playground` expansion |

## Key Frontend Pages (new/modified)

| Path                           | Description                                          |
| ------------------------------ | ---------------------------------------------------- |
| `/admin/playgrounds`           | Playground list with CRUD actions                    |
| `/admin/playgrounds/create`    | Create form                                          |
| `/admin/playgrounds/[id]/edit` | Edit form                                            |
| `/admin/games/create`          | **Modified**: `PlaygroundSelect` replaces text input |
| `/admin/games/[id]/edit`       | **Modified**: `PlaygroundSelect` replaces text input |

## Success Criteria Verification

| SC     | Check                                                                                                                                     |
| ------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| SC-001 | `curl /api/v1/playgrounds` → returns `{ data: [...] }` (empty array on fresh DB)                                                          |
| SC-002 | Inspect existing `games` rows — `location` text values preserved, `playgroundId` is NULL                                                  |
| SC-003 | Create a game with `playgroundId` → game detail returns `{ playground: { name: "..." } }`                                                 |
| SC-004 | Attempt `DELETE /api/v1/playgrounds/:id` when in use → 409 `PLAYGROUND_IN_USE`                                                            |
| SC-005 | In `/admin/games/create`, select "Agregar nueva" → inline form appears → submit → new playground auto-selected                            |
| SC-006 | Navigate to `/admin/playgrounds` → map renders with pins within 3 seconds; clicking a row pans the map; clicking a pin highlights the row |
