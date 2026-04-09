# Tasks: Game Signup & Invitation (014)

**Input**: Design documents from `/specs/014-game-signup-invitation/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/api.md ✅, quickstart.md ✅  
**Branch**: `chore/014-game-signup-invitation`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story this task belongs to (US1–US7)
- Exact file paths included in all task descriptions

---

## Phase 1: Setup

**Purpose**: Prisma schema changes, DB migration, backfill script, and new error codes

- [ ] T001 Update `packages/cms/prisma/schema.prisma` — add 4 new nullable fields to `Game` model: `maxPlayers Int?`, `slug String? @unique @db.VarChar(200)`, `lineup String? @db.VarChar(10)`, `endDate DateTime?`
- [ ] T002 Create Prisma migration `packages/cms/prisma/migrations/YYYYMMDDHHMMSS_add_game_signup_fields/` — single migration adding all four nullable Game fields including `slug String? @unique @db.VarChar(200)` (PostgreSQL treats NULLs as distinct so the constraint is safe before backfill; no second migration needed)
- [ ] T003 [P] Create one-time backfill script `packages/cms/src/scripts/backfill-game-slugs.ts` — iterate all existing games, generate `slug` from `date + opponentTeam.name` using the slug utility (`slug.ts`), handle duplicate suffix, write to DB; **depends on T007** (slug.ts must be implemented before this script can run)
- [ ] T004 [P] Add 4 new error codes to `packages/cms/src/utils/error-codes.ts`: `GAME_CAPACITY_EXCEEDED`, `GAME_NOT_SCHEDULED`, `SIGNUP_DUPLICATE`, `PROXY_CONFLICT`

---

## Phase 2: Foundational — Shared Types (Principle VII Gate)

**Purpose**: All cross-package types MUST exist in `@ministrosfc/shared` before any implementation begins

**⚠️ CRITICAL**: No US-1 through US-7 implementation can begin until T005 and T006 are complete

- [ ] T005 [P] Update `packages/shared/src/types/game.ts` — add `FORMATIONS` const array (14 formation strings), `FormationCode` type alias; extend `Game` interface with `maxPlayers?: number | null`, `slug?: string | null`, `lineup?: FormationCode | null`, `endDate?: string | null` (read-only); add `maxPlayers?: number` and `lineup?: FormationCode` to `GameCreateDTO` and `GameUpdateDTO` (explicitly exclude `endDate` from both DTOs with comments)
- [ ] T006 [P] Create `packages/shared/src/types/game-participant.ts` — add `SelfSignupDTO`, `GuestSignupDTO` (`firstName`, `lastName`, **optional `position?: string | null`**), `ProxySignupDTO` (`targetPlayerId`), `SignupRequestDTO` tagged union; add `RosterEntry` interface (participantId, player fields incl. playerType/invitedByName/jerseyNumber/**position**, confirmationStatus, confirmedById, confirmedByName, confirmedAt); add `GameSignupPageDTO` interface (game details, roster array, confirmedCount, maxPlayers, isFull, currentPlayerStatus enum, currentPlayerId)

**Checkpoint**: Shared types complete — all packages can now import from `@ministrosfc/shared`

---

## Phase 3: User Story 1 — Admin Generates Signup Link (Priority: P1) 🎯 MVP

**Goal**: Admin/Editor/DT can set `maxPlayers`, game gets a shareable slug URL, and admin panel exposes share-link actions for signup and game detail pages.

**Independent Test**: Navigate to a game's admin edit page, set `maxPlayers`, save; verify slug is generated in DB; copy the share-signup and share-detail links from the `/admin/games` table; confirm the share-detail link appears even for COMPLETED games.

### Implementation

- [ ] T007 [US1] Create `packages/cms/src/utils/slug.ts` — implement `generateGameSlug(date: Date, opponentName: string, prisma: PrismaClient, existingGameId?: string): Promise<string>`; manual Spanish char map (á→a, é→e, í→i, ó→o, ú→u, ü→u, ñ→n); lowercase; replace non-alphanumeric with `-`; collapse consecutive hyphens; trim; reject empty result with validation error; check DB for conflict and append `-2`, `-3`, etc. as needed
- [ ] T008 [US1] Update `packages/cms/src/services/GameService.ts` — in `createGame`: call `generateGameSlug()` and set `endDate = date + exactly 100 minutes` (no rounding); in `updateGame`: if `date` is in the payload, recompute `endDate = newDate + 100 min`; strip `endDate` from input (handled by schema, confirmed here for safety)
- [ ] T009 [US1] Update `packages/cms/src/routes/games.ts` — update `gameCreateSchema` and `gameUpdateSchema` (Zod) to include `maxPlayers` (int ≥ 1 or null), `lineup` (one of FORMATIONS or null), and explicitly `.strip()` any `endDate` or `slug` field from client payloads; register `GET /api/v1/games/slug/:slug` endpoint returning `{ id, slug }` or 404
- [ ] T010 [P] [US1] Add "Cupo máximo" `maxPlayers` number input (min: 1, step: 1, nullable) to `packages/frontend/src/pages/admin/games/[id]/edit.vue`; include in PATCH payload
- [ ] T011 [P] [US1] Add "Copiar link de convocatoria" button to admin game detail/index view (`packages/frontend/src/pages/admin/games/[id]/index.vue`) — visible only when `status = SCHEDULED` and game has a `slug`; copies `{baseUrl}/games/{slug}/signup` to clipboard with confirmation toast
- [ ] T012 [US1] Render share-signup link action in the `/admin/games` list table (`packages/frontend/src/pages/admin/games/index.vue` or the relevant games table component) — visible for rows where `status = SCHEDULED` AND (`signedUpCount < maxPlayers` OR `maxPlayers IS NULL`); copies `{baseUrl}/games/{slug}/signup` and invokes `navigator.share` on supporting devices; falls back to clipboard-only with toast
- [ ] T013 [US1] Render share-detail link action in the `/admin/games` list table for ALL game rows regardless of status — copies `{baseUrl}/games/{slug}` and invokes `navigator.share` on supporting devices; falls back to clipboard-only with toast (FR-028)

**Checkpoint**: US-1 complete — `maxPlayers` persists, slugs are auto-generated, admin panel has share links for both signup and detail URLs

---

## Phase 4: User Story 7 — Game Status Auto-Transition (Priority: P1)

**Goal**: Background job auto-transitions `SCHEDULED → IN_PROGRESS → COMPLETED`; `endDate` is auto-recomputed on every date change; status-based access guards enforced in CMS routes.

**Independent Test**: (1) Create game with `date = now − 5 min`; run job → verify `status = IN_PROGRESS`. (2) Create game with `date = now − 101 min`; run job → verify `status = COMPLETED` directly (double-transition). (3) Attempt signup on IN_PROGRESS game → verify HTTP 422.

### Implementation

- [ ] T014 [US7] Create `packages/cms/src/jobs/GameStatusTransitionJob.ts` — implement `runTransitions()` with two sequential idempotent `prisma.game.updateMany` calls: step 1 sets `status = IN_PROGRESS` where `status = SCHEDULED AND date <= now`; step 2 sets `status = COMPLETED` where `status = IN_PROGRESS AND (endDate IS NOT NULL AND endDate <= now) OR (endDate IS NULL AND date < now − 24h)`; no-op for COMPLETED/CANCELLED games
- [ ] T015 [US7] Register `GameStatusTransitionJob` in `packages/cms/src/main.ts` (or CMS bootstrap) — call `runTransitions()` immediately on startup then every 5 minutes via `setInterval`
- [ ] T016 [P] [US7] Update `packages/cms/src/services/GameService.ts` `updateGame` method — when ADMIN updates `date` on a game with `status = IN_PROGRESS` and the new date is in the future: wrap in `prisma.$transaction`, atomically set `status = SCHEDULED` and recompute `endDate = newDate + 100 min` in the same transaction (FR-030 revert mechanism)
- [ ] T017 [P] [US7] Add HTTP 403 status guards to `packages/cms/src/routes/games.ts` and `packages/cms/src/routes/participants.ts` — reject Editor/DT requests for any mutation on `IN_PROGRESS` games; reject Editor/DT requests to modify `lineup` or add/remove participants on `COMPLETED` games; ADMIN bypasses all status guards

**Checkpoint**: US-7 complete — transition job runs on schedule, endDate auto-computes, status guards enforce access control

---

## Phase 5: User Story 2 + User Story 3 — Player Signup Flow (Priority: P1)

**Goal**: Authenticated players can sign up (self, guest, proxy) via the Game Sign Up Page at `/games/{slug}/signup`; each confirm action is atomic with capacity and duplicate enforcement.

**Independent Test**: Visit signup URL as authenticated player → see DropdownAddMore pre-filled with own name → click confirm → verify self appears in roster. Then add a guest (firstName + lastName) → verify inline with "Invitado por {name}". Then proxy-register another active player → verify "Agregado por: {name}" attribution. Attempt signup on full-capacity game → see "El cupo está completo".

### Implementation

- [ ] T018 [P] [US2] Add `GET /api/v1/games/:gameId/signup-page` endpoint to `packages/cms/src/routes/games.ts` — returns `GameSignupPageDTO`: game details + ordered roster + confirmedCount + isFull + `currentPlayerStatus` (`not_signed_up` | `signed_up` | `no_player_linked` | `not_player_role`) derived from JWT; guest `lastName` included (authenticated view)
- [ ] T019 [US2] Implement `ParticipationService.signupParticipant(gameId, requestingUserId, dto: SignupRequestDTO)` in `packages/cms/src/services/ParticipationService.ts` — inside `prisma.$transaction`: (1) verify `game.status = SCHEDULED` → else throw `GAME_NOT_SCHEDULED`; (2) count confirmed participants vs `maxPlayers` → else throw `GAME_CAPACITY_EXCEEDED`; (3) dispatch by `dto.mode`: self → create/upsert `GameParticipant`; guest → create `Player(GUEST, invitedById, position: dto.position ?? null)` + `GameParticipant`; proxy → verify target is REGISTERED+ACTIVE, create `GameParticipant(confirmedById=requestingUser)`; returns normalized `RosterEntry`
- [ ] T020 [US2] Create `POST /api/v1/games/:gameId/participants/signup` in `packages/cms/src/routes/participants.ts` — validate `SignupRequestDTO` body with Zod (tagged union), require PLAYER role; call `ParticipationService.signupParticipant`; return 201 with `{ entry: RosterEntry, confirmedCount, isFull }`; map Prisma P2002 in a **mode-aware** way: `mode = 'proxy'` → HTTP 409 `PROXY_CONFLICT`; `mode = 'self' | 'guest'` → HTTP 409 `SIGNUP_DUPLICATE`; map `GAME_CAPACITY_EXCEEDED` / `GAME_NOT_SCHEDULED` → HTTP 422 with error message
- [ ] T021 [P] [US2] Implement `ParticipationService.removeParticipant(gameId, participantId, requestingUserId, role)` in `packages/cms/src/services/ParticipationService.ts` + register `DELETE /api/v1/games/:gameId/participants/:participantId` in `packages/cms/src/routes/participants.ts` — enforce FR-013b: Admin+Editor allowed on SCHEDULED; ADMIN-only on IN_PROGRESS/COMPLETED; DT always 403; hard-delete `GameParticipant` record (decrements capacity); **reuse the status-guard middleware/helper introduced in T017** rather than re-implementing a separate guard; depends on T017
- [ ] T022 [P] [US3] Create `packages/frontend/src/pages/games/[slug]/signup.vue` — Game Sign Up Page skeleton: route `/games/[slug]/signup`, apply `auth` middleware (redirect to `/login?redirect=...` if unauthenticated), **`useHead` MUST include `<meta name="robots" content="noindex,nofollow">`** (non-optional, FR-015); page layout with game header (rival, date, playground, `confirmedCount` / `maxPlayers`)
- [ ] T023 [P] [US3] Create `packages/frontend/src/composables/useGameSignup.ts` — reactive state: `game`, `roster`, `confirmedCount`, `isFull`, `currentPlayerStatus`, `error`; methods: `signupSelf()`, `signupGuest(firstName, lastName, position?: string | null)`, `signupProxy(targetPlayerId)`; on each success update `roster` and counts from server response without page refresh; handle 422 (set `error` message, disable confirm button); handle 409 (set conflict message)
- [ ] T024 [US3] Implement trimodal `DropdownAddMore` integration in `signup.vue` player table (depends on T022, T023) — self mode: pre-fill own player name when `currentPlayerStatus = not_signed_up`; guest mode: show "Agregar invitado" option → firstName + lastName inputs **+ optional position `<select>` (all `Position` enum values plus "Sin posición" blank option) + an × dismiss button that clears the form and restores the `DropdownAddMore` to its default dropdown state without submitting**; proxy mode: searchable dropdown filtered to `playerType = REGISTERED`, `status = ACTIVE`, not confirmed for this game; each row has an adjacent confirm button wired to the appropriate `useGameSignup` method
- [ ] T025 [US3] Implement capacity-full UI state in `signup.vue` (depends on T024) — when `isFull` is true on load or becomes true after a signup, replace the `DropdownAddMore` row with "El cupo está completo" message immediately; no additional request needed
- [ ] T026 [US3] Render player table in `signup.vue` (depends on T022) — list all confirmed attendees in `confirmedAt ASC` order (registered and guests intermixed); registered players: jersey number + position abbreviation + full name; guests inline at signup position: "Inv." prefix + **position abbreviation (or "—" if none)** + "Invitado por {Player Name}" (guest's own name visible to inviting player and admin/editor/dt in read-only view); proxy-registered players: "Agregado por: {Inviting Player Name}" in smaller font below name

**Checkpoint**: US-2 + US-3 complete — full trimodal signup flow works end-to-end; capacity and duplicate enforcement verified

---

## Phase 6: User Story 4 — Updated Public Game Detail Page (Priority: P2)

**Goal**: Public game routes use slug URLs; UUID URLs 301-redirect; homepage filters by status; public roster hides guest last names.

**Independent Test**: Visit `/games/2026-04-09-atlantico` as anonymous user → game detail renders. Visit `/games/{old-UUID}` → 301 redirect lands on slug URL in one hop. Check homepage "next games" → only SCHEDULED; "past games" → only COMPLETED.

### Implementation

- [ ] T027 [US4] Rename `packages/frontend/src/pages/games/[id].vue` → `packages/frontend/src/pages/games/[slug].vue`; update internal data fetch to call `GET /api/v1/games/slug/:slug` first to resolve slug → UUID, then fetch full game by UUID; update any import or internal references from `[id]` to `[slug]`
- [ ] T028 [P] [US4] Create `packages/frontend/server/middleware/game-uuid-redirect.ts` — detect UUID pattern (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) in `/games/:param`; call `GET /api/v1/games/:id` to resolve slug; issue `301` redirect to `/games/:slug`; return 404 if game not found
- [ ] T029 [P] [US4] Update public homepage (`packages/frontend/src/pages/index.vue` or equivalent) — filter "next games" API call or response to `status = SCHEDULED` only; filter "past games" to `status = COMPLETED` only; exclude CANCELLED and IN_PROGRESS from all sections; update game detail links to use `games/{slug}` URL format (FR-029, US-4 AC-5–6)
- [ ] T030 [US4] Update `[slug].vue` player roster display — render guests inline in `confirmedAt ASC` order with registered players (no bottom-grouping, no separator); guest rows: "Inv." prefix, no jersey number, **position abbreviation if set (or "—")**, "Invitado por {Player Name}" (hide guest `lastName` on public page); ensure no lineup field visualization is rendered on this public page (FR-022)
- [ ] T031 [P] [US4] Filter guest players out of the public player roster listing page (`packages/frontend/src/pages/players/index.vue` or equivalent) — ensure players with `playerType = GUEST` are excluded from the general roster display (FR-011)

**Checkpoint**: US-4 complete — slug routing works, 301 redirect verified, homepage filters correct, guest display correct

---

## Phase 7: User Story 5 — Admin Sets Game Lineup (Priority: P2)

**Goal**: Admin/Editor/DT can select a tactical formation for a game; formation stored as lineup code; DT whitelist updated to allow lineup changes.

**Independent Test**: Select "4-3-3" from the lineup dropdown in admin edit page, save; verify `lineup = "4-3-3"` in DB. Log in as DT user, update lineup via PATCH → verify 200. Log in as DT and try to update an IN_PROGRESS game → verify 403.

### Implementation

- [ ] T032 [P] [US5] Add "Formación" `<select>` to `packages/frontend/src/pages/admin/games/[id]/edit.vue` — populate options from `FORMATIONS` constant (imported from `@ministrosfc/shared`) plus a "Sin formación" blank option (null value); include `lineup` in the PATCH payload on save; no `endDate` input anywhere in this form
- [ ] T033 [P] [US5] In `packages/cms/src/routes/games.ts` add `lineup` to `NON_ADMIN_ALLOWED_FIELDS` (DT whitelist) so DT users can set/modify formation on SCHEDULED games; update `gameUpdateSchema` to validate `lineup` against `FORMATIONS` array (or null); ensure existing status guards from T017 still block DT on IN_PROGRESS games

**Checkpoint**: US-5 complete — lineup settable by Admin/Editor/DT on SCHEDULED games; stored and retrievable

---

## Phase 8: User Story 6 — Game Sign Up Page Visual Lineup Display (Priority: P2)

**Goal**: SVG soccer field renders on Game Sign Up Page when lineup is set; 11 position circles show player assignments; hover/tap highlights player table row.

**Independent Test**: With 8 registered players + 2 guests for a "4-3-3" game, verify field shows 8 registered in best-match positions, 2 guest circles (`I1`, `I2`), 1 `TBD` slot; remaining players all in adjacent table; field hidden when lineup is null.

### Implementation

- [ ] T034 [US6] Create `packages/frontend/src/utils/formations.ts` — export `FORMATION_SLOTS` static lookup: 14 formation strings → array of 11 `{ x: number; y: number; slotType: 'GK'|'DEF'|'MID'|'FWD' }` objects (normalized 0–1 coordinates for SVG viewport); export `positionToSlotType(position: string): 'GK'|'DEF'|'MID'|'FWD'` mapping for all `Position` enum values
- [ ] T035 [P] [US6] Create `packages/frontend/src/components/game/GameLineupField.vue` — SVG component accepting `lineup: FormationCode` and `roster: RosterEntry[]`; renders soccer field background + 11 `<circle>` elements positioned by `FORMATION_SLOTS[lineup]`; labels: assigned registered player → jersey number (or initials e.g. `JG` if null); assigned guest → `I{n}` (1-based); unassigned → `TBD`; emits `circle-hover(participantId)` and `circle-unhover` events for table row highlighting
- [ ] T036 [P] [US6] Implement player-to-position assignment function in `packages/frontend/src/utils/formations.ts` or `useGameSignup.ts` — algorithm: (1) collect ALL players (registered and guest) who have a non-null `position`; assign each to the best-matching slot type sorted by `confirmedAt ASC` across all position-matched players regardless of `playerType`; (2) fill remaining slots with all players (registered and guest) who have `position = null`, sorted by `confirmedAt ASC`; (3) first 11 by this combined ordering are placed on the field; all attendees remain in the table
- [ ] T037 [US6] Integrate `GameLineupField.vue` into `packages/frontend/src/pages/games/[slug]/signup.vue` (depends on T035, T036) — 8/12 grid columns on ≥768 px alongside player table at 4/12 cols; field and table stack vertically (field full-width on top) on mobile (<768 px); hidden entirely when `lineup` is null (FR-022)
- [ ] T038 [US6] Wire hover/tap interactions in `signup.vue` (depends on T037) — on `circle-hover(participantId)` highlight corresponding row in player table (e.g. add CSS highlight class); on `circle-unhover` remove highlight; on mobile, tap another circle removes previous highlight; no tooltip overlay on the field (FR-023)

**Checkpoint**: US-6 complete — field renders with correct position assignment; hover/tap cross-highlighting works; responsive layout verified

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: SEO/robots, guest badges in admin, E2E validation

- [ ] T039 [P] Create `packages/frontend/server/routes/robots.txt.ts` — return static text response with `User-agent: *`, `Disallow: /admin`, `Disallow: /games/*/signup` (FR-015); no `@nuxtjs/robots` module
- [ ] T041 [P] Add "Invitado" badge to guest player entries in admin players list `packages/frontend/src/pages/admin/players/index.vue` (or equivalent) — show badge when `player.playerType = GUEST`; badge is not editable (FR-010)
- [ ] T042 [P] Add "Invitante eliminado" warning pill in admin players list for guest players whose `invitedById` references a soft-deleted player — detect via `invitedByName = null AND invitedById IS NOT NULL`; display a warning pill next to the guest entry (FR-010 edge case)
- [ ] T043 Write Playwright E2E test `packages/frontend/tests/e2e/game-signup.spec.ts` — cover: (1) full self-signup flow (link → unauthenticated redirect → login → self-confirm → appear in roster), asserting total flow completes within 60 s (SC-001); (2) guest signup (firstName + lastName + position → guest row with "Invitado por" label and position abbreviation), asserting form-open-to-roster-update completes within 30 s (SC-002); (3) guest row dismiss (click × → `DropdownAddMore` returns to default state, no record created); (4) capacity full rejection → "El cupo está completo"; (5) UUID → 301 → slug redirect in single hop (SC-003)
- [ ] T044 [P] Update `GET /api/v1/games` list endpoint in `packages/cms/src/routes/games.ts` to include `_count: { select: { participants: { where: { confirmationStatus: 'CONFIRMED' } } } }` in the Prisma query; expose result as `confirmedCount` in the response so the admin games table can evaluate `signedUpCount < maxPlayers` for the share-signup-link visibility condition (FR-027, M2 fix)
- [ ] T045 [P] Update `GET /api/v1/games/:id` public game endpoint response serialization in `packages/cms/src/routes/games.ts` to set `lastName = null` (or omit) for all roster entries where `player.playerType = 'GUEST'`; authenticated endpoints (`GET /api/v1/games/:gameId/signup-page`) continue returning guest `lastName` in full (FR-012, M5 fix)
- [ ] T046 [P] Update the player PATCH endpoint (`packages/cms/src/routes/players.ts` or equivalent) to add `status` to the DT-allowed field whitelist **when the target player has `playerType = 'GUEST'`**; DT setting `status = INACTIVE` on a guest player MUST succeed (HTTP 200); DT setting `status` on a `REGISTERED` player MUST remain rejected (HTTP 403) (FR-013a, M1 fix)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; T003 and T004 can run in parallel after T001
- **Phase 2 (Foundational)**: Depends on Phase 1 — T005 and T006 can run in parallel; **BLOCKS all user story phases**
- **Phase 3 (US-1)**: Depends on Phase 2 — T007 must precede T008; T008 and T009 can overlap; T010–T013 are frontend tasks parallelizable after Phase 2; **T003 also depends on T007** (backfill script requires the slug utility to exist — T003 should be run after T007 is implemented even though it is listed in Phase 1)
- **Phase 4 (US-7)**: Depends on Phase 2 — T014 and T016 can run in parallel (**exception: T016 depends on T008** — both modify `GameService.updateGame`; implement T008 first to establish the endDate compute baseline, then T016 extends it with IN_PROGRESS revert logic); T015 depends on T014
- **Phase 5 (US-2+US-3)**: Depends on Phase 2, and T009 (signup-page endpoint shares `games.ts`) — T018+T021 and T022+T023 can run in parallel per layer
- **Phase 6 (US-4)**: Depends on Phase 2 and T027 (rename) — T028, T029, T031 can run in parallel after T027
- **Phase 7 (US-5)**: Depends on Phase 2 — T032 and T033 fully parallel
- **Phase 8 (US-6)**: Depends on Phase 5 (signup.vue) and Phase 7 (lineup in DB) — T034 first; T035 + T036 parallel after T034
- **Phase 9 (Polish)**: Depends on all previous phases — T039–T042 fully parallel; T043 depends on all

### User Story Dependencies

| Story          | Depends on                                       | Can parallelize with             |
| -------------- | ------------------------------------------------ | -------------------------------- |
| US-1 (P1)      | Phase 2                                          | US-7 (different files)           |
| US-7 (P1)      | Phase 2                                          | US-1 (different files)           |
| US-2+US-3 (P1) | Phase 2, US-7 (for status guards)                | US-4 frontend if slugs available |
| US-4 (P2)      | Phase 2, US-1 (slug generation must exist)       | US-5, US-6                       |
| US-5 (P2)      | Phase 2                                          | US-4, US-6 backend               |
| US-6 (P2)      | Phase 5 (signup.vue exists), US-5 (lineup in DB) | —                                |

### Within Each User Story

- CMS utilities and services before routes
- Backend routes before frontend pages
- Composables and utils before component integration
- Core page before interactive enhancements (field, hover)

---

## Parallel Execution Examples

### Phase 2 (Foundational)

```
Parallel:
  T005 — Update packages/shared/src/types/game.ts
  T006 — Create packages/shared/src/types/game-participant.ts
```

### Phase 3 (US-1)

```
Sequential setup:
  T007 → T008 (GameService needs slug.ts)
  T009 (games.ts schemas + slug endpoint, parallel with T008 once T007 done)

Then frontend in parallel:
  T010 — maxPlayers input in edit.vue
  T011 — share-signup button in game detail index
  T012 → T013 — share links in admin games list (same file, sequential)
```

### Phase 4 (US-7)

```
Parallel:
  T014 — GameStatusTransitionJob.ts (new file)
  T016 — GameService.ts updateGame revert logic

Sequential:
  T015 (depends on T014)
  T017 (status guards — relates to T014 job outputs, but route code independent)
```

### Phase 5 (US-2+US-3)

```
CMS layer:
  T018 [P] — signup-page endpoint (games.ts)
  T019 → T020 — signupParticipant + route (sequential)
  T021 [P] — removeParticipant + DELETE route

Frontend layer (can start after Phase 2):
  T022 [P] — signup.vue skeleton
  T023 [P] — useGameSignup.ts composable

  Then:
  T024 → T025 → T026 (sequential — build on T022+T023)
```

### Phase 8 (US-6)

```
T034 (formations.ts) →
  T035 [P] — GameLineupField.vue
  T036 [P] — assignment algorithm

Then:
  T037 → T038 (integration + wire-up in signup.vue)
```

---

## Implementation Strategy

### MVP First (US-1 only)

1. Complete Phase 1 (Setup)
2. Complete Phase 2 (Foundational — Principle VII gate)
3. Complete Phase 3 (US-1) — admin can set maxPlayers, game has slug, share links in admin panel
4. **STOP AND VALIDATE**: slug URLs work, maxPlayers persists, share-link copies correct URL
5. This is a shippable increment — admin workflow is unblocked

### Incremental Delivery

1. **Setup + Foundational** → DB schema migrated, shared types exported
2. **US-1** → maxPlayers + slugs + admin share links (P1 MVP)
3. **US-7** → auto-transition job + status guards (P1; unblocks signup page eligibility)
4. **US-2+US-3** → full trimodal signup flow at `/games/{slug}/signup` (P1 complete)
5. **US-4** → slug routing on public pages, homepage filtering (P2)
6. **US-5** → lineup dropdown in admin (P2)
7. **US-6** → SVG field visualization (P2)
8. **Polish** → robots.txt, badges, E2E

### Suggested MVP Scope

**Phases 1–3** (T001–T013) deliver the shareable signup link mechanism — the entry point of the feature. This is independently deployable once slug generation and admin share-link actions are verified.

---

## Task Count Summary

| Phase                 | Story     | Tasks         | [P] tasks  |
| --------------------- | --------- | ------------- | ---------- |
| Phase 1: Setup        | —         | T001–T004 (4) | 2          |
| Phase 2: Foundational | —         | T005–T006 (2) | 2          |
| Phase 3               | US-1      | T007–T013 (7) | 3          |
| Phase 4               | US-7      | T014–T017 (4) | 2          |
| Phase 5               | US-2+US-3 | T018–T026 (9) | 4          |
| Phase 6               | US-4      | T027–T031 (5) | 3          |
| Phase 7               | US-5      | T032–T033 (2) | 2          |
| Phase 8               | US-6      | T034–T038 (5) | 2          |
| Phase 9               | Polish    | T039–T043 (5) | 4          |
| **Total**             |           | **43 tasks**  | **24 [P]** |
