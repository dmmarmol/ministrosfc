# Quickstart: Admin Player Delete with Role-Based Controls

**Feature**: `013-admin-player-delete`  
**Branch**: `013-admin-player-delete`

---

## Prerequisites

- Docker / Podman running (PostgreSQL + Redis)
- Node.js ≥ 18 installed
- `npm install` run at workspace root

```bash
# Start local services
docker-compose up -d

# If starting fresh
cd packages/cms && npx prisma migrate reset --force
```

---

## Apply the Schema Migration

This feature requires **one schema migration** (makes `GameParticipant.playerId` nullable).

```bash
# From workspace root or packages/cms/
cd packages/cms

# After updating prisma/schema.prisma:
npx prisma migrate dev --name nullable_game_participant_player

# Regenerate Prisma client
npx prisma generate
```

---

## Running the Backend (CMS)

```bash
# From workspace root
npm run dev:cms

# Or directly
cd packages/cms && npm run dev
```

API available at `http://localhost:5102`.

---

## Running the Frontend

```bash
# From workspace root
npm run dev:frontend

# Or directly
cd packages/frontend && npm run dev
```

Frontend available at `http://localhost:5103`.

---

## Testing the Delete Flow Manually

1. Log in as an Admin (seed credentials in `packages/cms/data/imports/`)
2. Navigate to `/admin/players`
3. Click **Eliminar** (Delete) on any player row → confirmation modal appears
4. Click **Confirmar** → player disappears from list
5. Log in as an Editor → **Eliminar** button is not visible
6. As Editor, call the API directly:
   ```bash
   curl -X DELETE http://localhost:5102/api/v1/players/<uuid> \
     -H "Authorization: Bearer <editor_token>"
   # Expected: 403 Forbidden
   ```

---

## Running CMS Tests

```bash
cd packages/cms

# All tests
npm test

# Unit tests only
npm test -- --testPathPattern=unit

# Integration tests (requires TEST_DATABASE_URL)
npm test -- --testPathPattern=integration

# Specific feature tests
npm test -- --testPathPattern=player-crud
npm test -- --testPathPattern=rbac
```

**Environment required for integration tests**:

```bash
export TEST_DATABASE_URL="postgresql://user:pass@localhost:5432/ministrosfc_test"
export REDIS_URL="redis://localhost:6379"
```

---

## Running Frontend Tests

```bash
cd packages/frontend

# All Vitest tests
npm run test

# Watch mode
npm run test:watch

# Specific component test
npm run test -- PlayerDeleteModal
```

---

## Running E2E Tests

```bash
cd packages/frontend

# Requires both dev servers running
npm run test:e2e

# Specific spec
npx playwright test tests/e2e/admin-player-delete.spec.ts
```

---

## Key Files to Implement (in order)

| Step | File                                                                     | Change                                                         |
| ---- | ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| 1    | `packages/cms/prisma/schema.prisma`                                      | `GameParticipant.playerId` → nullable + SetNull                |
| 2    | Run `prisma migrate dev`                                                 | Generates migration SQL                                        |
| 3    | `packages/cms/src/models/Player.ts`                                      | Add `deleteById()` method                                      |
| 4    | `packages/cms/src/services/PlayerService.ts`                             | Add `deletePlayer()` method                                    |
| 5    | `packages/cms/src/routes/players.ts`                                     | Add `DELETE /:id` route; fix status to `requireRole("EDITOR")` |
| 6    | `packages/frontend/src/pages/admin/players/PlayerDeleteModal.vue`        | New confirmation modal component                               |
| 7    | `packages/frontend/src/pages/admin/players/index.vue`                    | Admin-only Delete button + modal wiring                        |
| 8    | `packages/frontend/src/pages/admin/players/[id]/edit.vue`                | Admin-only Delete button on edit page                          |
| 9    | Write tests (CMS unit, CMS integration, frontend Vitest, Playwright E2E) | TDD per constitution                                           |

---

## Troubleshooting

**Migration fails with "column playerId cannot be null" constraint error**:  
All existing `GameParticipant` rows have a non-null `playerId`. The migration only changes the column constraint — it does not set any values to null. This should succeed cleanly.

**403 when testing status toggle as Editor**:  
Verify that `requireRole("EDITOR")` was applied to `PATCH /:id/status` in `packages/cms/src/routes/players.ts` (see research.md Finding 2).

**Delete button appears for Editor in the UI**:  
Ensure the Player list page wraps the Delete button with `v-if="authStore.isAdmin"`. Check that `useAuthStore()` is imported explicitly (constitution requires explicit imports).
