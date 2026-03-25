# Tasks: Admin Player Delete with Role-Based Controls

**Feature**: `013-admin-player-delete`  
**Date**: 2026-03-25  
**Spec**: [spec.md](spec.md) | **Plan**: [plan.md](plan.md) | **Contract**: [contracts/player-delete-contract.md](contracts/player-delete-contract.md)  
**Packages**: `packages/cms` (Express + Prisma) · `packages/frontend` (Nuxt 3 + Vue 3)

## Format: `[ID] [P?] [Story?] Description with file path`

- **[P]**: Parallelizable — different files, no dependency on an incomplete task in this run
- **[USn]**: User story label — required for all user story phase tasks
- **TDD mandate**: All test tasks MUST be written first and confirmed failing before implementation begins

---

## Phase 1: Setup — Prisma Schema Migration

**Purpose**: Apply the single required schema change before any other work. `GameParticipant.playerId` must be nullable before a player delete can satisfy FR-005 (preserve game history). **All user story phases block on this.**

**⚠️ CRITICAL**: No implementation or test task should be attempted until T003 completes successfully.

- [x] T001 Modify `GameParticipant` model in `packages/cms/prisma/schema.prisma` — change `playerId String` → `playerId String?` and `onDelete: Cascade` → `onDelete: SetNull` on the `PlayerParticipant` relation field
- [x] T002 Run `npx prisma migrate dev --name nullable_game_participant_player` from `packages/cms/` to generate `packages/cms/prisma/migrations/<timestamp>_nullable_game_participant_player/migration.sql`
- [x] T003 Run `npx prisma generate` from `packages/cms/` to regenerate the Prisma client with updated `GameParticipant` types (`playerId: string | null`, `player: Player | null`)

**Checkpoint**: Migration applied, Prisma client regenerated — all existing CMS TypeScript compiles with the updated nullable types.

---

## Phase 2: Foundational (No Additional Blocking Prerequisites)

> All authentication middleware (`authenticate`, `requireRole`), Express routing, Zod UUID validation, Redis cache utilities, and Nuxt 3 / Pinia infrastructure are already in place. The `isAdmin` getter is already defined in `packages/frontend/src/stores/auth.ts`. Proceed directly to user story phases after Phase 1.

---

## Phase 3: User Story 1 — Admin Permanently Deletes a Player (Priority: P1) 🎯 MVP

**Goal**: An Admin can permanently remove a player via a confirmation modal on both the players list and player edit pages. The backend exposes `DELETE /api/v1/players/:id` (Admin-only, 204 on success) with cascade/SetNull behaviour, best-effort Cloudinary photo cleanup, and Redis cache invalidation.

**Independent Test**: Log in as ADMIN → navigate to `/admin/players` → click "Delete" on any player → confirm modal → player disappears from list and is absent on re-query. Direct `DELETE /api/v1/players/:id` with Admin token returns `204 No Content`.

### Tests for User Story 1 ⚠️ — Write BEFORE implementation, confirm they FAIL first

- [x] T004 [P] [US1] Add `deletePlayer` unit test cases to `packages/cms/tests/unit/PlayerService.test.ts` — cover: 204 on success, 404 when player not found, `invalidateCache` called, `deletePlayerPhoto` called best-effort (does not reject on photo error). **Use Vitest imports (`import { describe, it, expect, vi } from 'vitest'`) per constitution §Testing — new CMS test files MUST prefer Vitest.**
- [x] T005 [P] [US1] Add `DELETE /api/v1/players/:id` integration test cases to `packages/cms/tests/integration/player-crud.test.ts` — cover: 204 success + record absent on follow-up GET, 404 for unknown UUID, 400 for invalid UUID format. **Use Vitest imports (`import { describe, it, expect } from 'vitest'`) per constitution §Testing.**
- [x] T006 [P] [US1] Create `packages/frontend/tests/components/PlayerDeleteModal.test.ts` — Vitest component test verifying: `confirm` event emitted on "Confirm Delete" click, `cancel` event emitted on Cancel click, `cancel` event emitted on Escape keydown, player name rendered in modal body
- [x] T007 [P] [US1] Create `packages/frontend/tests/e2e/admin-player-delete.spec.ts` — Playwright E2E: Admin opens `/admin/players`, clicks Delete, modal shows with player name, confirms → player absent from list; opens modal, clicks Cancel → no change; opens player edit page, confirms delete → redirected to list with player absent

### Implementation for User Story 1

- [x] T008 [P] [US1] Add `deleteById(id: string): Promise<void>` method to `packages/cms/src/models/Player.ts` — calls `prisma.player.delete({ where: { id } })`; Prisma propagates Cascade (Contact, Statistics) and SetNull (GameParticipant) automatically
- [x] T009 [US1] Add `deletePlayer(id: string): Promise<void>` method to `packages/cms/src/services/PlayerService.ts` — logic: `findById(id)` throws 404 if not found; `PlayerModel.deleteById(id)`; `deletePlayerPhoto(player.photoUrl).catch(() => {})` if photoUrl exists; `invalidateCache()` (depends on T008)
- [x] T010 [US1] Add `DELETE /:id` route handler to `packages/cms/src/routes/players.ts` — middleware chain: `authenticate`, `requireRole("ADMIN")`, existing `uuidSchema` param validation; calls `playerService.deletePlayer(id)`; responds `204 No Content` on success (depends on T009)
- [x] T011 [P] [US1] Create `packages/frontend/src/components/player/PlayerDeleteModal.vue` — props: `player: { id: string; name: string }`; emits: `confirm`, `cancel`; displays player name and permanence warning; traps Escape key and background-click to emit `cancel`; uses explicit `useAuthStore` import and Tailwind classes. **⚠️ Must NOT be placed under `pages/` — Nuxt auto-registers every `.vue` in `pages/` as a navigable route.**
- [x] T012 [US1] Update `packages/frontend/src/pages/admin/players/index.vue` — add `deleteTarget: Ref<Player | null>` reactive state; render Delete button per row wrapped in `v-if="authStore.isAdmin"`; import and render `<PlayerDeleteModal>` controlling visibility via `deleteTarget`; on modal `confirm` call `DELETE /api/v1/players/:id` then refresh player list; on modal `cancel` clear `deleteTarget` (depends on T011)
- [x] T013 [US1] Update `packages/frontend/src/pages/admin/players/[id]/edit.vue` — add Admin-only Delete button wrapped in `v-if="authStore.isAdmin"`; render `<PlayerDeleteModal>` for the current player; on `confirm` call `DELETE /api/v1/players/:id` then `navigateTo('/admin/players')`; on `cancel` close modal (depends on T011)

**Checkpoint**: Admin can delete a player from both the list page and the edit page. All US1 tests pass: unit (T004), integration (T005), component (T006), E2E (T007).

---

## Phase 4: User Story 2 — Editor Cannot Delete a Player (Priority: P1)

**Goal**: Editor-role users see no Delete control anywhere in the frontend. Direct API calls to `DELETE /api/v1/players/:id` from an Editor token return `403 Forbidden`. Unauthenticated calls return `401 Unauthorized`.

**Independent Test**: Log in as EDITOR → open player list → no Delete button visible on any row → open any edit page → no Delete option. `DELETE /api/v1/players/:id` with Editor token → `403 Forbidden`.

### Tests for User Story 2 ⚠️ — Write BEFORE verification, confirm they FAIL first

- [x] T014 [P] [US2] Add RBAC test cases to `packages/cms/tests/integration/rbac.test.ts` — cover: DELETE returns 403 for EDITOR token (player record unchanged), DELETE returns 401 for unauthenticated request (no Authorization header), concurrent delete returns 404 on second Admin attempt. **Use Vitest imports (`import { describe, it, expect } from 'vitest'`) per constitution §Testing.**
- [x] T015 [P] [US2] Add Editor-guard E2E scenario to `packages/frontend/tests/e2e/admin-player-delete.spec.ts` — log in as EDITOR, assert no Delete button is rendered on `/admin/players` list rows and on `/admin/players/:id/edit` page

### Verification for User Story 2

The `requireRole("ADMIN")` middleware guard was placed in T010. The `v-if="authStore.isAdmin"` visibility guard was placed in T012 and T013. These tasks verify correct wiring and confirm tests pass.

- [x] T016 [US2] Verify `requireRole("ADMIN")` is the active guard on the `DELETE /:id` route in `packages/cms/src/routes/players.ts` and confirm all T014 RBAC test cases pass (depends on T010, T014)
- [x] T017 [US2] Verify `v-if="authStore.isAdmin"` wraps every Delete button in `packages/frontend/src/pages/admin/players/index.vue` and `[id]/edit.vue`; confirm T015 E2E scenario passes (depends on T012, T013, T015)

**Checkpoint**: All RBAC test cases for DELETE pass. No Delete control renders for Editor-role sessions.

---

## Phase 5: User Story 3 — Editor Toggles Player Status (Priority: P2)

**Goal**: Both Editors and Admins can toggle a player's status between ACTIVE and INACTIVE. The `PATCH /api/v1/players/:id/status` endpoint becomes accessible to `EDITOR` role (currently restricted to ADMIN only). The UI makes Activate/Deactivate controls visible to both roles.

**Independent Test**: Log in as EDITOR → open player list → toggle a player's status → status badge updates in place. `PATCH /api/v1/players/:id/status` with Editor token → `200 OK`.

### Tests for User Story 3 ⚠️ — Write BEFORE implementation, confirm they FAIL first

- [x] T018 [P] [US3] Add Editor status-toggle test cases to `packages/cms/tests/integration/rbac.test.ts` — cover: PATCH status returns 200 for EDITOR token with `{ status: "INACTIVE" }`, PATCH status returns 200 for EDITOR token with `{ status: "ACTIVE" }`, EDITOR cannot call DELETE (already covered in T014, cross-check passes). **Use Vitest imports (`import { describe, it, expect } from 'vitest'`) per constitution §Testing.**
- [x] T019 [P] [US3] Add Editor status-toggle E2E scenario to `packages/frontend/tests/e2e/admin-player-delete.spec.ts` — log in as EDITOR, find an ACTIVE player, click Deactivate → status badge changes to INACTIVE, click Activate → reverts to ACTIVE; confirm no Delete button is present throughout

### Implementation for User Story 3

- [x] T020 [US3] Change `requireRole("ADMIN")` to `requireRole("EDITOR")` on the `PATCH /:id/status` route in `packages/cms/src/routes/players.ts` (single-line fix per research.md Finding 2)
- [x] T021 [P] [US3] Verify Activate/Deactivate buttons in `packages/frontend/src/pages/admin/players/index.vue` are NOT gated by `v-if="authStore.isAdmin"` (must be visible to both EDITOR and ADMIN) — update visibility guard to `v-if="authStore.isEditor"` or remove role guard if status controls are already unrestricted

**Checkpoint**: EDITOR can toggle player status via both API and UI. All US3 tests pass (T018, T019).

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Ensure TypeScript strict compliance, explicit import conventions, and 80% coverage thresholds across all new code.

- [x] T022 [P] Audit all new `.vue` files — `PlayerDeleteModal.vue` (`src/components/player/`), updated `index.vue` and updated `[id]/edit.vue` (`src/pages/admin/players/`) — for explicit composable and store imports; no auto-import-only usage per constitution rule
- [x] T023 [P] Audit all new frontend source files in `packages/frontend/src/` for use of `useRuntime()` composable instead of direct `import.meta.client` / `import.meta.server` wherever client/server branching is needed
- [x] T024 [P] Run `npm test -- --coverage` in `packages/cms/` and verify ≥ 80% branch/line coverage on new code paths: `PlayerModel.deleteById`, `PlayerService.deletePlayer`, `DELETE /:id` route handler
- [x] T025 [P] Run `npm run test -- --coverage` in `packages/frontend/` and verify ≥ 80% branch/line coverage on `PlayerDeleteModal.vue`
- [x] T026 Run full test suite in both packages (`npm test` in `packages/cms/` and `npm run test` in `packages/frontend/`) and confirm all pre-existing tests still pass after the schema migration (T001–T003) and status route role change (T020)

**Checkpoint**: All new code meets strict TypeScript, explicit import, and 80% coverage requirements. Full regression suite is green.

---

## Dependencies

### Story Completion Order

```
Phase 1 (T001–T003: Schema migration)
    │
    ▼
Phase 3 US1 (T004–T013: Admin delete flow)   ◄── MVP
    │
    ├──────────────────────────┐
    ▼                          ▼
Phase 4 US2                Phase 5 US3
(T014–T017: Editor guard)  (T018–T021: Editor status toggle)
    │                          │
    └──────────┬───────────────┘
               ▼
         Phase 6 (T022–T026: Polish)
```

US2 and US3 can be implemented in parallel after US1 is complete — they touch different route lines and different test files.

### Within-Story Dependencies

| Task | Depends on                                    |
| ---- | --------------------------------------------- |
| T009 | T008 (Service calls Model)                    |
| T010 | T009 (Route calls Service)                    |
| T012 | T011 (List page uses Modal component)         |
| T013 | T011 (Edit page uses Modal component)         |
| T016 | T010 + T014 (verify guard + RBAC tests)       |
| T017 | T012 + T013 + T015 (verify guards + E2E test) |

All [P]-marked tasks within a phase are independent of each other and can run in parallel.

---

## Parallel Execution Examples

### US1: Backend and Frontend in Parallel (after T003)

**Terminal A — CMS backend**:

```
T004 (write unit tests) → T005 (write integration tests) → T008 (model) → T009 (service) → T010 (route)
```

**Terminal B — Frontend**:

```
T006 (write component tests) → T007 (write E2E tests) → T011 (modal component) → T012 (list page) → T013 (edit page)
```

### US2 + US3 in Parallel (after US1 complete)

**Terminal A — US2 (RBAC enforcement)**:

```
T014 (RBAC tests) → T015 (E2E guard tests) → T016 (verify DELETE guard) → T017 (verify UI guard)
```

**Terminal B — US3 (Editor status toggle)**:

```
T018 (status RBAC tests) → T019 (status E2E) → T020 (one-line route fix) → T021 (verify UI visibility)
```

---

## Implementation Strategy

### MVP Scope (Phase 1 + Phase 3)

Deliver **Phase 1 + Phase 3 (US1)** as the first shippable increment:

1. Prisma migration (`playerId` nullable + SetNull)
2. `PlayerModel.deleteById()` + `PlayerService.deletePlayer()`
3. `DELETE /api/v1/players/:id` route (Admin-only, 204)
4. `PlayerDeleteModal.vue` component
5. Admin-only Delete button on list and edit pages
6. Unit + integration + component + E2E tests for the full delete flow

This delivers the core admin delete capability as a fully tested, independently deployable increment.

### Incremental Additions

- **Phase 4 (US2)**: RBAC test cases + E2E Editor guard — verifies existing guards, no new source code
- **Phase 5 (US3)**: Single `requireRole` change on status route + Editor visibility check — low-effort delivery
- **Phase 6**: Coverage audit + regression suite — final quality gate before merge

---

## Format Validation

All 26 tasks conform to: `- [ ] [TaskID] [P?] [Story?] Description with file path`

| Check                                         | Result |
| --------------------------------------------- | ------ |
| All tasks start with `- [ ]` checkbox         | ✅     |
| All tasks have sequential TaskID (T001–T026)  | ✅     |
| `[P]` present on all parallelizable tasks     | ✅     |
| `[USn]` present on all user story phase tasks | ✅     |
| Setup and Polish tasks have no story label    | ✅     |
| All tasks include an explicit file path       | ✅     |

---

## Summary

| Phase     | Scope                               | Tasks                                 | Count  |
| --------- | ----------------------------------- | ------------------------------------- | ------ |
| Phase 1   | Setup — Prisma migration            | T001–T003                             | 3      |
| Phase 2   | Foundational                        | _(no tasks — infra already in place)_ | 0      |
| Phase 3   | US1 — Admin delete flow (P1) 🎯 MVP | T004–T013                             | 10     |
| Phase 4   | US2 — Editor cannot delete (P1)     | T014–T017                             | 4      |
| Phase 5   | US3 — Editor status toggle (P2)     | T018–T021                             | 4      |
| Phase 6   | Polish & cross-cutting              | T022–T026                             | 5      |
| **Total** |                                     |                                       | **26** |

**Task distribution by user story**:

- US1 (Admin delete): 10 tasks (4 tests + 6 implementation)
- US2 (Editor guard): 4 tasks (2 tests + 2 verification)
- US3 (Editor status): 4 tasks (2 tests + 2 implementation)

**Parallel opportunities**: 14 of 26 tasks are `[P]`-marked

**Independent test criteria per story**:

- US1: Admin token → `DELETE /api/v1/players/:id` → 204; player absent from list
- US2: Editor token → `DELETE /api/v1/players/:id` → 403; no Delete button in UI
- US3: Editor token → `PATCH /api/v1/players/:id/status` → 200; status badge updates

**Suggested MVP**: Phase 1 + Phase 3 (US1) — 13 tasks, delivers core admin delete capability
