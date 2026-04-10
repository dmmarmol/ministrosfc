# Implementation Plan: Game Signup & Invitation — Amendment Wave 2

**Branch**: `chore/014-game-signup-invitation` | **Date**: 2026-04-10 | **Spec**: [spec.md](./spec.md)
**Input**: Analysis Pass 2026-04-10 amendments to `/specs/014-game-signup-invitation/spec.md`

> **Context**: T001–T059 are fully implemented (prior planning cycle). This plan covers only the
> new requirements introduced in the 2026-04-10 analysis pass: FR-016 (lineup non-nullable),
> FR-017 (remove "Sin formación"), FR-018/FR-021 (6/6 column layout), FR-034 (formation label),
> FR-035 (player self-unregistration), and FR-013b amendment (DT can unregister from SCHEDULED).

## Summary

Six targeted amendments to the existing Game Signup feature. The most structurally impactful
change is making `game.lineup` non-nullable (defaulting to `4-4-2`), which simplifies the
signup page by always showing the soccer field. The remaining changes are additive: a
symmetric 6/6 column split, a visible formation label, player self-unregistration capability,
and extending the DT role's remove-participant permission to SCHEDULED games.

No new entities, no new pages, no new shared types beyond what was introduced in T001–T059.

## Technical Context

**Language/Version**: TypeScript 5.x / Node 20  
**Primary Dependencies**: Express 4, Prisma 5 (PostgreSQL), Nuxt 3, Vue 3, Tailwind CSS  
**Storage**: PostgreSQL (via Prisma) — single DB migration required (lineup non-nullable)  
**Testing**: Jest (CMS), Vitest (frontend)  
**Target Platform**: Fly.io (CMS) + Nuxt SSR (frontend)  
**Project Type**: Web application (CMS API + Nuxt frontend in monorepo)  
**Performance Goals**: All signup mutations remain single-round-trip; no new N+1 queries  
**Constraints**: Backward-compatible API — existing callers that omit `lineup` receive "4-4-2"  
**Scale/Scope**: Same as T001–T059; no new endpoints except DELETE /participants/self

## Constitution Check

_GATE: All gates evaluated below. No violations._

- [x] **Shared types gate (Principle VII)**: No new shared types needed. All required types
  (`RosterEntry`, `GameSignupPageDTO`, `GameSignupState`, `SignupRequestDTO`) already live in
  `@ministrosfc/shared`. `GameSignupState` already covers the "signed_up" state used to drive
  the self-unregistration UI. No new cross-package types required.
- [x] **Page decomposition gate (Principle V)**: No new `pages/` files introduced. The
  "Cancelar inscripción" button is added to the already-extracted `SignupRegistrationRow.vue`.
  The admin row-level unregister action is added to the already-extracted `SignupPlayerTable.vue`.
  Both components live under `components/pages/games/signup/` — no decomposition required beyond
  what T051–T053 already established.
- [x] **Page meta declaration gate (Principle V)**: No new pages introduced. All existing pages
  already have `definePageMeta` declarations from the T001–T059 implementation.

## Project Structure

### Documentation (this feature)

```text
specs/014-game-signup-invitation/
├── plan.md              ← This file (updated)
├── research.md          ← From prior cycle; no new unknowns
├── data-model.md        ← Updated: lineup non-nullable migration strategy
├── quickstart.md        ← Updated: new migration step
├── contracts/
│   └── api.md           ← Updated: DELETE /participants/self contract
└── tasks.md             ← Updated: T060–T071 appended
```

### Source Files Touched

```text
packages/cms/
├── prisma/
│   └── schema.prisma                          T060  lineup non-nullable + migration
├── src/
│   ├── routes/
│   │   ├── games.ts                           T061  gameCreateSchema lineup default
│   │   └── participants.ts                    T065  DELETE /participants/self endpoint
│   └── services/
│       └── ParticipationService.ts            T064, T066  selfUnregister + DT SCHEDULED fix
│   tests/unit/
│       └── ParticipationService.test.ts       T070  updated + new test cases

packages/frontend/src/
├── pages/admin/games/[id]/edit.vue            T062  remove null option, default "4-4-2"
├── pages/games/[slug]/signup.vue              T063, T064  layout 6/6 + formation label
├── components/pages/games/signup/
│   ├── SignupRegistrationRow.vue              T067  "Cancelar inscripción" button
│   └── SignupPlayerTable.vue                  T068  per-row unregister action for mgmt roles
└── composables/
    ├── useGameSignup.ts                        T067  unregisterSelf() method
    └── __tests__/useGameSignup.test.ts         T071  new test case
```

## Complexity Tracking

> No constitution violations. No justification required.

---

## Phase 0: Research

> **No `NEEDS CLARIFICATION` items.** All decisions resolved from codebase knowledge.

### Decision Log (inline)

**D1 — DB migration strategy for lineup non-nullable**
- **Decision**: Single migration: `ALTER TABLE games ALTER COLUMN lineup SET DEFAULT '4-4-2'; UPDATE games SET lineup = '4-4-2' WHERE lineup IS NULL; ALTER TABLE games ALTER COLUMN lineup SET NOT NULL;` — expressed as a Prisma migration.
- **Rationale**: All existing records with `lineup = null` are set to `4-4-2` in the same migration. No separate backfill script needed (unlike slug, which required opponentTeam lookups). The default ensures future INSERT statements that omit `lineup` get `4-4-2` automatically from the DB level.
- **Alternatives considered**: Keeping nullable and only defaulting in the service layer — rejected because it leaves schema and service state inconsistent; also breaks the guarantee that the frontend never needs a null-lineup fallback.

**D2 — Self-unregistration endpoint design**
- **Decision**: `DELETE /api/v1/games/:gameId/participants/self` — no body, PLAYER-only. Server resolves the authenticated user → linked `playerId` → `GameParticipant` for this game. Returns 404 if no such record, 422 if game is not SCHEDULED.
- **Rationale**: A dedicated `/self` route avoids a privilege check mismatch (player calling the existing `/participants/:participantId` Admin route). It also clarifies intent at the API layer.
- **Alternatives considered**: Reusing `DELETE /participants/:participantId` with a "caller-is-owner" check — rejected because it couples the admin removal and self-removal paths, complicating the role guard logic.

**D3 — Formation label placement (FR-034)**
- **Decision**: A `<p class="text-xs font-medium text-gray-600 mb-2">Formación: {{ effectiveLineup }}</p>` element is added in `signup.vue` directly above `<GameLineupField>`, using the same `effectiveLineup` computed (`game.lineup ?? "4-4-2"`).
- **Rationale**: Keeps `GameLineupField.vue` a pure SVG renderer with no label coupling. The label is trivial and does not justify a new sub-component.
- **Alternatives considered**: Embedding the label inside `GameLineupField.vue` as a prop — rejected (over-coupling SVG component with text UI).

**D4 — "Cancelar inscripción" button placement**
- **Decision**: Added to `SignupRegistrationRow.vue` as a conditional block shown when `currentPlayerStatus === "signed_up"`. The button replaces the `DropdownAddMore` form (since the player is already signed up). A `cancel-self` emit is added and wired to `useGameSignup.unregisterSelf()` in `signup.vue`.
- **Rationale**: `SignupRegistrationRow.vue` already holds all signup interaction logic for the current player — adding self-unregistration there keeps related actions co-located.
- **Alternatives considered**: Adding the button to `SignupPlayerTable.vue` rows — rejected because it mixes the in-table row management (admin action) with the current-player action (which belongs in the registration row area).

**D5 — Admin/Editor/DT row-level unregister action**
- **Decision**: `SignupPlayerTable.vue` gains an optional `canManageRoster: boolean` prop (default `false`). When `true`, each row renders a small `×` button that emits `unregister(participantId)`. In `signup.vue`, `canManageRoster` is set to `true` when `currentPlayerStatus === "no_player_linked"` OR when the auth store indicates the user holds a management role (ADMIN/EDITOR/DT). `signup.vue` handles the `unregister` emit by calling the existing `DELETE /participants/:participantId` endpoint.
- **Rationale**: Prop-driven approach keeps `SignupPlayerTable.vue` decoupled from auth concerns. The existing admin DELETE endpoint is reused; only the DT role guard is relaxed for SCHEDULED games.

---

## Phase 1: Design

### Data Model Changes

See [data-model.md](./data-model.md) — updated section: **lineup non-nullable migration**.

Key change: `lineup String? @db.VarChar(10)` → `lineup String @default("4-4-2") @db.VarChar(10)`

The Prisma schema migration must:
1. Set `DEFAULT '4-4-2'` on the column
2. Backfill all existing `NULL` rows to `'4-4-2'`
3. Add `NOT NULL` constraint

### API Contract Changes

See [contracts/api.md](./contracts/api.md) — new section: **DELETE `/games/:gameId/participants/self`**

### Quickstart

See [quickstart.md](./quickstart.md) — updated: run new migration after pulling.

---

## Tasks (T060–T071)

### Phase A — Schema & CMS Defaults (Lineup Non-Nullable)

- [ ] **T060** Create Prisma migration for `lineup` non-nullable with default `"4-4-2"`:
  update `packages/cms/prisma/schema.prisma` — change `lineup String? @db.VarChar(10)` → `lineup String @default("4-4-2") @db.VarChar(10)`; generate migration SQL with three steps: `SET DEFAULT '4-4-2'`, `UPDATE games SET lineup = '4-4-2' WHERE lineup IS NULL`, add `NOT NULL`; run `prisma generate` to update the client.

- [ ] **T061** Update `packages/cms/src/routes/games.ts` — in `gameCreateSchema` (Zod): change `lineup` from `.nullable().optional()` to `.optional().default("4-4-2")`; in `gameUpdateSchema`: keep optional but ensure it cannot be set to null (use `.optional()` without `.nullable()`); no other changes needed (T033 already added `lineup` to `NON_ADMIN_ALLOWED_FIELDS`).

### Phase B — Admin Form (Remove "Sin formación")

- [ ] **T062** Update `packages/frontend/src/pages/admin/games/[id]/edit.vue`:
  - In the `watch(game, ...)` callback: change `form.lineup = g.lineup ?? null` → `form.lineup = g.lineup ?? "4-4-2"`
  - In the template `<select v-model="form.lineup">`: remove `<option :value="null">Sin formación</option>`, so the first option is `4-4-2` from the `FORMATIONS` loop
  - In `submit()`: change `lineup: form.lineup ?? null` → `lineup: form.lineup ?? "4-4-2"` (form.lineup should always be set, but guard for safety)
  - The reactive `form.lineup` default in `reactive({...})` should also be changed from `null as string | null` → `"4-4-2" as string`

### Phase C — Signup Page Layout + Formation Label

- [ ] **T063** Update `packages/frontend/src/pages/games/[slug]/signup.vue` — layout changes:
  - Add computed `effectiveLineup = computed(() => game.value?.lineup ?? "4-4-2")` 
  - Remove conditional `v-if="game?.lineup"` from the outer grid wrapper — always apply `md:grid md:grid-cols-12 md:gap-6` when roster section renders
  - Remove `v-if="game?.lineup"` guard on the field column — field always renders
  - Change `md:col-span-8` → `md:col-span-6` on the field column
  - Change `md:col-span-4` → `md:col-span-6` on the table column (remove the conditional ternary `:class`)
  - Pass `:lineup="effectiveLineup"` to `<GameLineupField>` (replaces `:lineup="game.lineup"` — handles legacy null records)

- [ ] **T064** Add formation label in `packages/frontend/src/pages/games/[slug]/signup.vue` — inside the field column div, render `<p class="text-xs font-medium text-gray-500 mb-2">Formación: {{ effectiveLineup }}</p>` directly above `<GameLineupField>` (FR-034); label is always visible to any authenticated visitor when the field section renders.

### Phase D — Self-Unregistration (Backend)

- [ ] **T065** Add `ParticipationService.selfUnregister(gameId: string, requestingUserId: string): Promise<void>` in `packages/cms/src/services/ParticipationService.ts`:
  - Fetch game: verify `status === GameStatus.SCHEDULED` → else throw 422 `GAME_NOT_SCHEDULED`
  - Fetch user: get `playerId` from `prisma.user.findUnique({ where: { id: requestingUserId }, select: { playerId: true } })` → if `playerId` is null throw 422 (no player linked)
  - Delete: `prisma.gameParticipant.deleteMany({ where: { gameId, playerId } })` (deleteMany is idempotent — no error if already removed)
  - Register `DELETE /api/v1/games/:gameId/participants/self` in `packages/cms/src/routes/participants.ts`: `authenticate` + require PLAYER role; call `ParticipationService.selfUnregister(gameId, req.user.userId)`; return 204 on success.

### Phase E — DT Role Removal Fix (Backend)

- [ ] **T066** Update `ParticipationService.removeParticipant` in `packages/cms/src/services/ParticipationService.ts`:
  - Remove the blanket `if (role === "DT") throw 403` guard at the top of the method
  - After fetching `game.status`, apply DT-specific check: `if (role === "DT" && game.status !== GameStatus.SCHEDULED) throw 403` — DT may only remove from SCHEDULED games
  - The existing EDITOR check remains: `if (role === "EDITOR" && game.status !== GameStatus.SCHEDULED) throw 403`
  - Net effect: DT and EDITOR have the same remove-participant permission (SCHEDULED only); ADMIN retains unrestricted remove access.

### Phase F — Self-Unregistration (Frontend)

- [ ] **T067** Add `unregisterSelf()` to `packages/frontend/src/composables/useGameSignup.ts`:
  - Method: calls `DELETE /api/v1/games/{gameId}/participants/self`; on success: remove the current player's entry from `roster`, decrement `confirmedCount`, set `isFull = false` (capacity re-opened), reset `currentPlayerStatus` to `"available"`
  - Error handling: display error message inline on 422 (game not SCHEDULED), silent on 404 (already removed — idempotent).

- [ ] **T068** Update `packages/frontend/src/components/pages/games/signup/SignupRegistrationRow.vue` — add a "Cancelar inscripción" conditional block:
  - When `currentPlayerStatus === "signed_up"` AND NOT `isFull`: render `<button @click="$emit('cancel-self')" …>Cancelar inscripción</button>` instead of the `DropdownAddMore` form (the player is already registered; showing the form would be misleading)
  - Add `cancel-self` emit to the component's `defineEmits` 
  - Wire in `packages/frontend/src/pages/games/[slug]/signup.vue`: bind `@cancel-self="handleCancelSelf"` where `handleCancelSelf` calls `useGameSignup().unregisterSelf()`.

### Phase G — Admin/Editor/DT Row Unregister (Frontend)

- [ ] **T069** Update `packages/frontend/src/components/pages/games/signup/SignupPlayerTable.vue`:
  - Add optional `canManageRoster?: boolean` prop (default `false`)
  - When `canManageRoster` is `true`, append a small `×` button to each roster row that emits `unregister(participantId: string)`
  - The button MUST be outside any interactive link element and styled as a subtle destructive action icon (e.g., `text-red-400 hover:text-red-600`)
  - Wire in `signup.vue`: compute `canManageRoster = authStore.user?.role === 'ADMIN' || authStore.user?.role === 'EDITOR' || authStore.user?.role === 'DT'`; bind `@unregister="handleUnregister"` where `handleUnregister(participantId)` calls `DELETE /api/v1/games/:gameId/participants/:participantId` and removes the row from `roster` on success (reuses the existing admin delete endpoint).

### Phase H — Tests

- [ ] **T070** Update `packages/cms/tests/unit/ParticipationService.test.ts`:
  - Change existing test case covering `removeParticipant` with DT role: replace "DT removes → throws 403" with two cases: (a) "DT removes from SCHEDULED game → succeeds (deleteMany called)"; (b) "DT removes from COMPLETED game → throws 403"
  - Add new `selfUnregister` test group: (1) game is SCHEDULED and user has linked player → `deleteMany` called with correct `{ gameId, playerId }`; (2) game is not SCHEDULED → throws 422 `GAME_NOT_SCHEDULED`; (3) user has no linked playerId → throws 422; (4) deleteMany with no matching records → no error (idempotent).

- [ ] **T071** Update `packages/frontend/src/composables/__tests__/useGameSignup.test.ts`:
  - Add test case: `unregisterSelf()` calls DELETE and removes the caller's entry from `roster`, decrements `confirmedCount`, and resets `isFull` to `false`.
  - Add test case: `unregisterSelf()` on a non-SCHEDULED game returns 422 and sets `error` message.

---

## Dependency Order

```text
T060 → T061   (schema migration before route schema update)
T060          (no blocker for T062–T064)
T065 → T066   (selfUnregister depends on same service file; can run in parallel in separate branches)
T067 → T068   (composable first, then component wires it)
T069          (independent — adds prop to player table, no composable dep)
T070          (run alongside T065–T066 — TDD: write failing test, then implement)
T071          (run alongside T067 — TDD: write failing test, then implement)
```

### Parallel Groups

| Can run in parallel                          | Blocked until         |
| -------------------------------------------- | --------------------- |
| T060 + T065 + T067 init                      | —                     |
| T061 (after T060 prisma regenerated)         | T060 complete         |
| T062, T063, T064                             | —                     |
| T066                                         | T065 complete         |
| T068 (after T067 composable is implemented)  | T067 complete         |
| T069                                         | —                     |
| T070 (TDD pair with T065–T066)               | Write before T065     |
| T071 (TDD pair with T067)                    | Write before T067     |

---

## Constitution Check — Post-Design Re-Evaluation

- **Shared types gate**: No new cross-package types introduced. ✅
- **Page decomposition gate**: No new pages. Self-unregistration button goes into existing `SignupRegistrationRow.vue`; admin remove action goes into existing `SignupPlayerTable.vue`. ✅
- **Page meta declaration gate**: No new pages. ✅
- **Complexity gate**: No architectural complexity introduced. All changes are confined to existing files or trivially small new methods. ✅
