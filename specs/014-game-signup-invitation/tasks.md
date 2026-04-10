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

- [x] T001 Update `packages/cms/prisma/schema.prisma` — add 4 new nullable fields to `Game` model: `maxPlayers Int?`, `slug String? @unique @db.VarChar(200)`, `lineup String? @db.VarChar(10)`, `endDate DateTime?`
- [x] T002 Create Prisma migration `packages/cms/prisma/migrations/YYYYMMDDHHMMSS_add_game_signup_fields/` — single migration adding all four nullable Game fields including `slug String? @unique @db.VarChar(200)` (PostgreSQL treats NULLs as distinct so the constraint is safe before backfill; no second migration needed)
- [x] T003 [P] Create one-time backfill script `packages/cms/src/scripts/backfill-game-slugs.ts` — iterate all existing games, generate `slug` from `date + opponentTeam.name` using the slug utility (`slug.ts`), handle duplicate suffix, write to DB; **depends on T007** (slug.ts must be implemented before this script can run)
- [x] T004 [P] Add 4 new error codes to `packages/cms/src/utils/error-codes.ts`: `GAME_CAPACITY_EXCEEDED`, `GAME_NOT_SCHEDULED`, `SIGNUP_DUPLICATE`, `PROXY_CONFLICT`

---

## Phase 2: Foundational — Shared Types (Principle VII Gate)

**Purpose**: All cross-package types MUST exist in `@ministrosfc/shared` before any implementation begins

**⚠️ CRITICAL**: No US-1 through US-7 implementation can begin until T005 and T006 are complete

- [x] T005 [P] Update `packages/shared/src/types/game.ts` — add `FORMATIONS` const array (14 formation strings), `FormationCode` type alias; extend `Game` interface with `maxPlayers?: number | null`, `slug?: string | null`, `lineup?: FormationCode | null`, `endDate?: string | null` (read-only); add `maxPlayers?: number` and `lineup?: FormationCode` to `GameCreateDTO` and `GameUpdateDTO` (explicitly exclude `endDate` from both DTOs with comments)
- [x] T006 [P] Create `packages/shared/src/types/game-participant.ts` — add `SelfSignupDTO`, `GuestSignupDTO` (`firstName`, `lastName`, **optional `position?: string | null`**), `ProxySignupDTO` (`targetPlayerId`), `SignupRequestDTO` tagged union; add `RosterEntry` interface (participantId, player fields incl. playerType/invitedByName/jerseyNumber/**position**, confirmationStatus, confirmedById, confirmedByName, confirmedAt); add `GameSignupPageDTO` interface (game details, roster array, confirmedCount, maxPlayers, isFull, currentPlayerStatus enum, currentPlayerId)

**Checkpoint**: Shared types complete — all packages can now import from `@ministrosfc/shared`

---

## Phase 3: User Story 1 — Admin Generates Signup Link (Priority: P1) 🎯 MVP

**Goal**: Admin/Editor/DT can set `maxPlayers`, game gets a shareable slug URL, and admin panel exposes share-link actions for signup and game detail pages.

**Independent Test**: Navigate to a game's admin edit page, set `maxPlayers`, save; verify slug is generated in DB; copy the share-signup and share-detail links from the `/admin/games` table; confirm the share-detail link appears even for COMPLETED games.

### Implementation

- [x] T007 [US1] Create `packages/cms/src/utils/slug.ts` — implement `generateGameSlug(date: Date, opponentName: string, prisma: PrismaClient, existingGameId?: string): Promise<string>`; manual Spanish char map (á→a, é→e, í→i, ó→o, ú→u, ü→u, ñ→n); lowercase; replace non-alphanumeric with `-`; collapse consecutive hyphens; trim; reject empty result with validation error; check DB for conflict and append `-2`, `-3`, etc. as needed
- [x] T008 [US1] Update `packages/cms/src/services/GameService.ts` — in `createGame`: call `generateGameSlug()` and set `endDate = date + exactly 100 minutes` (no rounding); in `updateGame`: if `date` is in the payload, recompute `endDate = newDate + 100 min`; strip `endDate` from input (handled by schema, confirmed here for safety)
- [x] T009 [US1] Update `packages/cms/src/routes/games.ts` — update `gameCreateSchema` and `gameUpdateSchema` (Zod) to include `maxPlayers` (int ≥ 1 or null), `lineup` (one of FORMATIONS or null), and explicitly `.strip()` any `endDate` or `slug` field from client payloads; register `GET /api/v1/games/slug/:slug` endpoint returning `{ id, slug }` or 404
- [x] T010 [P] [US1] Add "Cupo máximo" `maxPlayers` number input (min: 1, step: 1, nullable) to `packages/frontend/src/pages/admin/games/[id]/edit.vue`; include in PATCH payload
- [x] T011 [P] [US1] Add "Copiar link de convocatoria" button to admin game detail/index view (`packages/frontend/src/pages/admin/games/[id]/index.vue`) — visible only when `status = SCHEDULED` and game has a `slug`; copies `{baseUrl}/games/{slug}/signup` to clipboard with confirmation toast
- [x] T012 [US1] Render share-signup link action in the `/admin/games` list table (`packages/frontend/src/pages/admin/games/index.vue` or the relevant games table component) — visible for rows where `status = SCHEDULED` AND (`signedUpCount < maxPlayers` OR `maxPlayers IS NULL`); copies `{baseUrl}/games/{slug}/signup` and invokes `navigator.share` on supporting devices; falls back to clipboard-only with toast
- [x] T013 [US1] Render share-detail link action in the `/admin/games` list table for ALL game rows regardless of status — copies `{baseUrl}/games/{slug}` and invokes `navigator.share` on supporting devices; falls back to clipboard-only with toast (FR-028)

**Checkpoint**: US-1 complete — `maxPlayers` persists, slugs are auto-generated, admin panel has share links for both signup and detail URLs

---

## Phase 4: User Story 7 — Game Status Auto-Transition (Priority: P1)

**Goal**: Background job auto-transitions `SCHEDULED → IN_PROGRESS → COMPLETED`; `endDate` is auto-recomputed on every date change; status-based access guards enforced in CMS routes.

**Independent Test**: (1) Create game with `date = now − 5 min`; run job → verify `status = IN_PROGRESS`. (2) Create game with `date = now − 101 min`; run job → verify `status = COMPLETED` directly (double-transition). (3) Attempt signup on IN_PROGRESS game → verify HTTP 422.

### Implementation

- [x] T014 [US7] Create `packages/cms/src/jobs/GameStatusTransitionJob.ts` — implement `runTransitions()` with two sequential idempotent `prisma.game.updateMany` calls: step 1 sets `status = IN_PROGRESS` where `status = SCHEDULED AND date <= now`; step 2 sets `status = COMPLETED` where `status = IN_PROGRESS AND (endDate IS NOT NULL AND endDate <= now) OR (endDate IS NULL AND date < now − 24h)`; no-op for COMPLETED/CANCELLED games
- [x] T015 [US7] Register `GameStatusTransitionJob` in `packages/cms/src/main.ts` (or CMS bootstrap) — call `runTransitions()` immediately on startup then every 5 minutes via `setInterval`
- [x] T016 [P] [US7] Update `packages/cms/src/services/GameService.ts` `updateGame` method — when ADMIN updates `date` on a game with `status = IN_PROGRESS` and the new date is in the future: wrap in `prisma.$transaction`, atomically set `status = SCHEDULED` and recompute `endDate = newDate + 100 min` in the same transaction (FR-030 revert mechanism)
- [x] T017 [P] [US7] Add HTTP 403 status guards to `packages/cms/src/routes/games.ts` and `packages/cms/src/routes/participants.ts` — reject Editor/DT requests for any mutation on `IN_PROGRESS` games; reject Editor/DT requests to modify `lineup` or add/remove participants on `COMPLETED` games; ADMIN bypasses all status guards

**Checkpoint**: US-7 complete — transition job runs on schedule, endDate auto-computes, status guards enforce access control

---

## Phase 5: User Story 2 — Player Signs Up via the Link (Priority: P1)

**Goal**: Authenticated players can confirm their attendance via the signup-page API; capacity and duplicate constraints are enforced atomically; admins can remove participants.

**Independent Test**: Call `GET /api/v1/games/:gameId/signup-page` → receive `GameSignupPageDTO`. POST `signup` as authenticated player → 201 with `RosterEntry`. POST again (duplicate) → 409 `SIGNUP_DUPLICATE`. Sign up to full-capacity game → 422 `GAME_CAPACITY_EXCEEDED`. Proxy-register another player → 201 with `confirmedById` set.

### Implementation

- [x] T018 [P] [US2] Add `GET /api/v1/games/:gameId/signup-page` endpoint to `packages/cms/src/routes/games.ts` — returns `GameSignupPageDTO`: game details + ordered roster + confirmedCount + isFull + `currentPlayerStatus` (`not_signed_up` | `signed_up` | `no_player_linked` | `not_player_role`) derived from JWT; guest `lastName` included (authenticated view)
- [x] T019 [US2] Implement `ParticipationService.signupParticipant(gameId, requestingUserId, dto: SignupRequestDTO)` in `packages/cms/src/services/ParticipationService.ts` — inside `prisma.$transaction`: (1) verify `game.status = SCHEDULED` → else throw `GAME_NOT_SCHEDULED`; (2) count confirmed participants vs `maxPlayers` → else throw `GAME_CAPACITY_EXCEEDED`; (3) dispatch by `dto.mode`: self → create/upsert `GameParticipant`; guest → create `Player(GUEST, invitedById, position: dto.position ?? null)` + `GameParticipant`; proxy → verify target is REGISTERED+ACTIVE, create `GameParticipant(confirmedById=requestingUser)`; returns normalized `RosterEntry`
- [x] T020 [US2] Create `POST /api/v1/games/:gameId/participants/signup` in `packages/cms/src/routes/participants.ts` — validate `SignupRequestDTO` body with Zod (tagged union), require PLAYER role; call `ParticipationService.signupParticipant`; return 201 with `{ entry: RosterEntry, confirmedCount, isFull }`; map Prisma P2002 in a **mode-aware** way: `mode = 'proxy'` → HTTP 409 `PROXY_CONFLICT`; `mode = 'self' | 'guest'` → HTTP 409 `SIGNUP_DUPLICATE`; map `GAME_CAPACITY_EXCEEDED` / `GAME_NOT_SCHEDULED` → HTTP 422 with error message
- [x] T021 [P] [US2] Implement `ParticipationService.removeParticipant(gameId, participantId, requestingUserId, role)` in `packages/cms/src/services/ParticipationService.ts` + register `DELETE /api/v1/games/:gameId/participants/:participantId` in `packages/cms/src/routes/participants.ts` — enforce FR-013b: Admin+Editor allowed on SCHEDULED; ADMIN-only on IN_PROGRESS/COMPLETED; DT always 403; hard-delete `GameParticipant` record (decrements capacity); **reuse the status-guard middleware/helper introduced in T017** rather than re-implementing a separate guard; depends on T017

**Checkpoint**: US-2 complete — backend signup API (self/guest/proxy) and remove-participant endpoint are fully functional with capacity and duplicate guards

---

## Phase 6: User Story 3 — DropdownAddMore Trimodal Signup (Priority: P1)

**Goal**: Game Sign Up Page at `/games/{slug}/signup` renders the trimodal `DropdownAddMore` for self, guest (with optional position + × dismiss), and proxy signup; each confirm triggers an independent atomic request; page updates reactively.

**Independent Test**: As signed-in unconfirmed player, visit Game Sign Up Page: (1) click confirm on pre-filled self-signup row → row appears in roster; (2) select "Agregar invitado", type name, (optionally) select position, confirm → guest row with "Inv." prefix and position abbreviation appears; (3) click "Agregar invitado" then × → `DropdownAddMore` returns to default state, no record created; (4) proxy-register another active player → row appears with "Agregado por" label. Verify all steps complete without page refresh.

### Sub-components (Constitution Principle V — Page Decomposition gate)

**⚠️ CRITICAL**: `signup.vue` is a routing entry point only. All feature template blocks MUST live in `components/pages/games/signup/`. Create sub-components T051–T053 before wiring them in T022–T026.

- [x] T051 [P] [US3] Create `packages/frontend/src/components/pages/games/signup/SignupGameHeader.vue` — accepts props: `game: Game` (opponent name, date, playground name), `confirmedCount: number`, `maxPlayers: number | null`; renders the game header block (rival, date, playground, confirmed/max counter); no signup logic
- [x] T052 [P] [US3] Create `packages/frontend/src/components/pages/games/signup/SignupPlayerTable.vue` — accepts props: `roster: RosterEntry[]`, `highlightedParticipantId?: string | null`; renders the full confirmed-attendees table in `confirmedAt ASC` order (registered and guests intermixed); registered player rows: jersey number + position abbreviation + full name; guest rows: "Inv." prefix + position abbreviation (or "—") + "Invitado por {Player Name}" (guest name visible only when `currentPlayerStatus` indicates inviting player or admin/editor/dt context); proxy-registered rows: "Agregado por: {Inviting Player Name}" in smaller font below name; emits `row-highlight(participantId)` for hover sync with `GameLineupField`
- [x] T053 [P] [US3] Create `packages/frontend/src/components/pages/games/signup/SignupRegistrationRow.vue` — accepts props: `currentPlayerStatus: SignupPagePlayerStatus`, `isFull: boolean`, `availablePlayers: Player[]`; contains the trimodal `DropdownAddMore` logic: self mode (pre-fill when `not_signed_up`), guest mode (firstName + lastName inputs + optional position `<select>` with all `Position` enum values + "Sin posición" blank + × dismiss button), proxy mode (searchable dropdown filtered to `REGISTERED` + `ACTIVE` + not already confirmed); each mode has an adjacent confirm button; emits `signup-self()`, `signup-guest(firstName, lastName, position?)`, `signup-proxy(targetPlayerId)`, `dismiss()`; when `isFull` renders "El cupo está completo" instead of the form

### Implementation

- [x] T022 [P] [US3] Create `packages/frontend/src/pages/games/[slug]/signup.vue` — Game Sign Up Page routing entry point: apply `auth` middleware (redirect to `/login?redirect=...` if unauthenticated), **`useHead` MUST include `<meta name="robots" content="noindex,nofollow">`** (non-optional, FR-015); inject `useGameSignup()` composable; compose `<SignupGameHeader>`, `<SignupPlayerTable>`, and `<SignupRegistrationRow>` sub-components (T051–T053); wire composable methods to component emits — page file MUST NOT contain inline template feature blocks exceeding ~30 lines
- [x] T023 [P] [US3] Create `packages/frontend/src/composables/useGameSignup.ts` — reactive state: `game`, `roster`, `confirmedCount`, `isFull`, `currentPlayerStatus`, `error`; methods: `signupSelf()`, `signupGuest(firstName, lastName, position?: string | null)`, `signupProxy(targetPlayerId)`; on each success update `roster` and counts from server response without page refresh; handle 422 (set `error` message, disable confirm button); handle 409 (set conflict message)
- [x] T024 [US3] Wire trimodal signup flow in `signup.vue` (depends on T022, T023, T053) — bind `SignupRegistrationRow` emits to `useGameSignup` methods: `signup-self` → `signupSelf()`, `signup-guest` → `signupGuest(firstName, lastName, position)`, `signup-proxy` → `signupProxy(targetPlayerId)`, `dismiss` → reset composable error state
- [x] T025 [US3] Implement capacity-full UI state — `SignupRegistrationRow` (T053) handles `isFull` prop: when true renders "El cupo está completo" replacing the form; `signup.vue` passes reactive `isFull` from `useGameSignup` to the sub-component
- [x] T026 [US3] Wire player table in `signup.vue` (depends on T022, T052) — pass reactive `roster` from `useGameSignup` to `<SignupPlayerTable>`; wire `row-highlight` emit to `highlightedParticipantId` state fed to `GameLineupField` in Phase 9

**Checkpoint**: US-3 complete — full trimodal signup flow works end-to-end on the frontend; `signup.vue` is a thin routing entry; guest form dismiss and position assignment verified

---

## Phase 7: User Story 4 — Updated Public Game Detail Page (Priority: P2)

**Goal**: Public game routes use slug URLs; UUID URLs 301-redirect; homepage filters by status; public roster hides guest last names.

**Independent Test**: Visit `/games/2026-04-09-atlantico` as anonymous user → game detail renders. Visit `/games/{old-UUID}` → 301 redirect lands on slug URL in one hop. Check homepage "next games" → only SCHEDULED; "past games" → only COMPLETED.

### Implementation

- [x] T027 [US4] Rename `packages/frontend/src/pages/games/[id].vue` → `packages/frontend/src/pages/games/[slug].vue`; update internal data fetch to call `GET /api/v1/games/slug/:slug` first to resolve slug → UUID, then fetch full game by UUID; update any import or internal references from `[id]` to `[slug]`
- [x] T028 [P] [US4] Create `packages/frontend/server/middleware/game-uuid-redirect.ts` — detect UUID pattern (`/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i`) in `/games/:param`; call `GET /api/v1/games/:id` to resolve slug; issue `301` redirect to `/games/:slug`; return 404 if game not found
- [x] T029 [P] [US4] Update public homepage (`packages/frontend/src/pages/index.vue` or equivalent) — filter "next games" API call or response to `status = SCHEDULED` only; filter "past games" to `status = COMPLETED` only; exclude CANCELLED and IN_PROGRESS from all sections; update game detail links to use `games/{slug}` URL format (FR-029, US-4 AC-5–6)
- [x] T030 [US4] Update `[slug].vue` player roster display — render guests inline in `confirmedAt ASC` order with registered players (no bottom-grouping, no separator); guest rows: "Inv." prefix, no jersey number, **position abbreviation if set (or "—")**, "Invitado por {Player Name}" (hide guest `lastName` on public page); ensure no lineup field visualization is rendered on this public page (FR-022)
- [x] T031 [P] [US4] Filter guest players out of the public player roster listing page (`packages/frontend/src/pages/players/index.vue` or equivalent) — ensure players with `playerType = GUEST` are excluded from the general roster display (FR-011)

**Checkpoint**: US-4 complete — slug routing works, 301 redirect verified, homepage filters correct, guest display correct

---

## Phase 8: User Story 5 — Admin Sets Game Lineup (Priority: P2)

**Goal**: Admin/Editor/DT can select a tactical formation for a game; formation stored as lineup code; DT whitelist updated to allow lineup changes.

**Independent Test**: Select "4-3-3" from the lineup dropdown in admin edit page, save; verify `lineup = "4-3-3"` in DB. Log in as DT user, update lineup via PATCH → verify 200. Log in as DT and try to update an IN_PROGRESS game → verify 403.

### Implementation

- [x] T032 [P] [US5] Add "Formación" `<select>` to `packages/frontend/src/pages/admin/games/[id]/edit.vue` — populate options from `FORMATIONS` constant (imported from `@ministrosfc/shared`) plus a "Sin formación" blank option (null value); include `lineup` in the PATCH payload on save; no `endDate` input anywhere in this form
- [x] T033 [P] [US5] In `packages/cms/src/routes/games.ts` add `lineup` to `NON_ADMIN_ALLOWED_FIELDS` (DT whitelist) so DT users can set/modify formation on SCHEDULED games; update `gameUpdateSchema` to validate `lineup` against `FORMATIONS` array (or null); ensure existing status guards from T017 still block DT on IN_PROGRESS games

**Checkpoint**: US-5 complete — lineup settable by Admin/Editor/DT on SCHEDULED games; stored and retrievable

---

## Phase 9: User Story 6 — Game Sign Up Page Visual Lineup Display (Priority: P2)

**Goal**: SVG soccer field renders on Game Sign Up Page when lineup is set; 11 position circles show player assignments; hover/tap highlights player table row.

**Independent Test**: With 8 registered players + 2 guests for a "4-3-3" game, verify field shows 8 registered in best-match positions, 2 guest circles (`I1`, `I2`), 1 `TBD` slot; remaining players all in adjacent table; field hidden when lineup is null.

### Implementation

- [x] T034 [US6] Create `packages/frontend/src/utils/formations.ts` — export `FORMATION_SLOTS` static lookup: 14 formation strings → array of 11 `{ x: number; y: number; slotType: 'GK'|'DEF'|'MID'|'FWD' }` objects (normalized 0–1 coordinates for SVG viewport); export `positionToSlotType(position: string): 'GK'|'DEF'|'MID'|'FWD'` mapping for all `Position` enum values
- [x] T035 [P] [US6] Create `packages/frontend/src/components/game/GameLineupField.vue` — SVG component accepting `lineup: FormationCode` and `roster: RosterEntry[]`; renders soccer field background + 11 `<circle>` elements positioned by `FORMATION_SLOTS[lineup]`; labels: assigned registered player → jersey number (or initials e.g. `JG` if null); assigned guest → `I{n}` (1-based); unassigned → `TBD`; emits `circle-hover(participantId)` and `circle-unhover` events for table row highlighting
- [x] T036 [P] [US6] Implement player-to-position assignment function in `packages/frontend/src/utils/formations.ts` or `useGameSignup.ts` — algorithm: (1) collect ALL players (registered and guest) who have a non-null `position`; assign each to the best-matching slot type sorted by `confirmedAt ASC` across all position-matched players regardless of `playerType`; (2) fill remaining slots with all players (registered and guest) who have `position = null`, sorted by `confirmedAt ASC`; (3) first 11 by this combined ordering are placed on the field; all attendees remain in the table
- [x] T037 [US6] Integrate `GameLineupField.vue` into `packages/frontend/src/pages/games/[slug]/signup.vue` (depends on T035, T036) — 8/12 grid columns on ≥768 px alongside player table at 4/12 cols; field and table stack vertically (field full-width on top) on mobile (<768 px); hidden entirely when `lineup` is null (FR-022)
- [x] T038 [US6] Wire hover/tap interactions in `signup.vue` (depends on T037) — on `circle-hover(participantId)` highlight corresponding row in player table (e.g. add CSS highlight class); on `circle-unhover` remove highlight; on mobile, tap another circle removes previous highlight; no tooltip overlay on the field (FR-023)

**Checkpoint**: US-6 complete — field renders with correct position assignment; hover/tap cross-highlighting works; responsive layout verified

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: SEO/robots, guest badges in admin, confirmedCount fix, E2E validation

- [x] T039 [P] Create `packages/frontend/server/routes/robots.txt.ts` — return static text response with `User-agent: *`, `Disallow: /admin`, `Disallow: /games/*/signup` (FR-015); no `@nuxtjs/robots` module
- [x] T040 [P] Add "Invitado" badge to guest player entries in admin players list `packages/frontend/src/pages/admin/players/index.vue` (or equivalent) — show badge when `player.playerType = GUEST`; badge is not editable (FR-010)
- [x] T041 [P] Add "Invitante eliminado" warning pill in admin players list for guest players whose `invitedById` references a soft-deleted player — detect via `invitedByName = null AND invitedById IS NOT NULL`; display a warning pill next to the guest entry (FR-010 edge case)
- [x] T042 Write Playwright E2E test `packages/frontend/tests/e2e/game-signup.spec.ts` — cover: (1) full self-signup flow (link → unauthenticated redirect → login → self-confirm → appear in roster), asserting total flow completes within 60 s (SC-001); (2) guest signup (firstName + lastName + position → guest row with "Invitado por" label and position abbreviation), asserting form-open-to-roster-update completes within 30 s (SC-002); (3) guest row dismiss (click × → `DropdownAddMore` returns to default state, no record created); (4) capacity full rejection → "El cupo está completo"; (5) UUID → 301 → slug redirect in single hop (SC-003)
- [x] T043 [P] Update `GET /api/v1/games` list endpoint in `packages/cms/src/routes/games.ts` to include `_count: { select: { participants: { where: { confirmationStatus: 'CONFIRMED' } } } }` in the Prisma query; expose result as `confirmedCount` in the response so the admin games table can evaluate `signedUpCount < maxPlayers` for the share-signup-link visibility condition (FR-027, M2 fix) — **⚠️ T048 (US-8) depends on this task; complete T043 before beginning T048**
- [x] T044 [P] Update `GET /api/v1/games/:id` public game endpoint response serialization in `packages/cms/src/routes/games.ts` to set `lastName = null` (or omit) for all roster entries where `player.playerType = 'GUEST'`; authenticated endpoints (`GET /api/v1/games/:gameId/signup-page`) continue returning guest `lastName` in full (FR-012, M5 fix)
- [x] T045 [P] Update the player PATCH endpoint (`packages/cms/src/routes/players.ts` or equivalent) to add `status` to the DT-allowed field whitelist **when the target player has `playerType = 'GUEST'`**; DT setting `status = INACTIVE` on a guest player MUST succeed (HTTP 200); DT setting `status` on a `REGISTERED` player MUST remain rejected (HTTP 403) (FR-013a, M1 fix)

---

## Phase 11: User Story 8 — Authenticated Player Sees Signup CTA on Game Cards (Priority: P1)

**Goal**: Logged-in PLAYER users see an "Anotarse" / "Ya anotado" / "Completo" action on each SCHEDULED game card on the public homepage. Non-PLAYER and unauthenticated visitors see no signup UI — existing behaviour is fully preserved.

**Independent Test**: Log in as a PLAYER; visit homepage → each SCHEDULED card has an "Anotarse" link. Click it → navigates to `/games/:slug/signup`. Confirm attendance → return to homepage; same card now shows "Ya anotado". As Admin, set the game to full capacity → card shows "Completo". Log out → no CTA on any card.

### Implementation

- [x] T046 [P] Add `GameSignupState = "available" | "signed_up" | "full"` type alias to `packages/shared/src/types/game.ts`; add optional `currentPlayerStatus?: GameSignupState | null` to the `Game` interface (read-only, server-computed for PLAYER callers, never in create/update DTOs); verify the type is exported via the existing `export * from "./types"` chain in `packages/shared/src/index.ts`
- [x] T047 [P] Add `optionalAuthenticate` function to `packages/cms/src/middleware/auth.ts` — if `Authorization: Bearer <token>` header is absent, invalid, or expired: silently call `next()` without setting `req.user` (never returns 401); if token is valid: populate `req.user` identically to the existing `authenticate` middleware; export the function alongside the existing `authenticate` export
- [x] T048 [US8] Update `GET /api/v1/games` handler in `packages/cms/src/routes/games.ts` (depends on T043, T046, T047) — prepend `optionalAuthenticate` middleware; when `req.user?.role === "PLAYER"`: skip Redis cache; run the existing `GameModel.findMany(query)` then in `Promise.all` also query `prisma.user.findUnique({ where: { id: req.user.userId }, select: { playerId: true } })` and `prisma.gameParticipant.findMany({ where: { gameId: { in: gameIds }, playerId, confirmationStatus: "CONFIRMED" } })`; build a `Set<string>` of signed-up `gameId`s; for each game set `currentPlayerStatus: GameSignupState` — `"signed_up"` if the game is in the signed-up set, `"full"` if `confirmedCount >= maxPlayers && maxPlayers !== null`, otherwise `"available"`; when caller is not PLAYER or unauthenticated: use existing cache path and omit `currentPlayerStatus` from all game objects
- [x] T049 [P] [US8] Restructure `packages/frontend/src/components/game/GameCard.vue` (FR-032, FR-033) — replace the outer `<NuxtLink>` wrapper with a `<div class="group bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100">` container; nest an inner `<NuxtLink :to="detailUrl" class="flex items-center gap-4 p-4">` wrapping opponent logo, game info, and score/status columns; add `signupState` optional prop typed `GameSignupState | undefined` (import from `@ministrosfc/shared`); append a conditional right-side action element **outside** the inner `<NuxtLink>`: `signupState === "available" && game.status === "SCHEDULED"` → `<NuxtLink :to="signupUrl" class="...">Anotarse</NuxtLink>`; `signupState === "signed_up"` → non-interactive `<span>Ya anotado</span>`; `signupState === "full"` → non-interactive `<span>Completo</span>`; when `signupState` is absent/undefined render nothing (preserves unauthenticated/non-PLAYER behaviour unchanged); `signupUrl` = `` `/games/${game.slug}/signup` ``; the existing status badge ("Próximo", etc.) is only shown when no CTA is rendered
- [x] T050 [US8] Update `packages/frontend/src/pages/index.vue` (depends on T049) — read `packages/frontend/src/plugins/api.ts` to confirm whether `$api` auto-injects the `Authorization` header for authenticated users; if yes, no change to the fetch call is needed; map `game.currentPlayerStatus` from the upcoming-games API response to the `signupState` prop on each `<GameCard>` in the SCHEDULED section; type the `upcomingGames` computed value to include the optional `currentPlayerStatus` field from the shared `Game` type (replace `any[]` with `Game[]`)

**Checkpoint**: US-8 complete — PLAYER users see signup CTAs on game cards; card state updates correctly after signup; unauthenticated and non-PLAYER users see no CTA; no nested `<a>` elements in `GameCard.vue`

---

## Phase 12: Unit Tests (Constitution Principle IV — TDD Gate)

**Purpose**: Unit tests for all new CMS services, utilities, jobs, and frontend composables. Constitution Principle IV is NON-NEGOTIABLE: 80% coverage required for new code. Tests are written alongside implementation (red-green-refactor).

**⚠️ CRITICAL**: Each test task MUST be started (failing test written) before its corresponding implementation task is marked done.

- [x] T054 [P] Write Jest unit tests `packages/cms/src/utils/__tests__/slug.test.ts` — test `generateGameSlug`: (1) standard Spanish char transliteration (á→a, é→e, í→i, ó→o, ú→u, ü→u, ñ→n); (2) consecutive hyphens collapsed; (3) empty/all-hyphen result throws validation error; (4) duplicate slug appends `-2`, `-3` suffix via DB conflict check (mock PrismaClient); (5) `existingGameId` excludes own slug from conflict check
- [x] T055 [P] Write Jest unit tests `packages/cms/src/jobs/__tests__/GameStatusTransitionJob.test.ts` — test `runTransitions()`: (1) SCHEDULED game with `date <= now` → sets `IN_PROGRESS`; (2) SCHEDULED game with `date > now` → unchanged; (3) IN_PROGRESS game with `endDate <= now` → sets `COMPLETED`; (4) IN_PROGRESS legacy game with `endDate = null` and `date < now − 24h` → sets `COMPLETED`; (5) COMPLETED/CANCELLED games → no update; (6) double-transition in one run (date and endDate both past) → SCHEDULED → COMPLETED; mock `prisma.game.updateMany` to verify correct `where` conditions
- [x] T056 [P] Write Jest unit tests `packages/cms/src/services/__tests__/ParticipationService.test.ts` — test `signupParticipant`: (1) self mode creates `GameParticipant` for requesting user; (2) guest mode creates `Player(GUEST)` + `GameParticipant` with correct `invitedById` and `position`; (3) proxy mode creates `GameParticipant` with `confirmedById` set; (4) `game.status ≠ SCHEDULED` throws `GAME_NOT_SCHEDULED`; (5) `confirmedCount >= maxPlayers` throws `GAME_CAPACITY_EXCEEDED`; (6) Prisma P2002 on self/guest mode throws `SIGNUP_DUPLICATE`; (7) Prisma P2002 on proxy mode throws `PROXY_CONFLICT`; test `removeParticipant`: (8) Admin removes on SCHEDULED → hard-delete succeeds; (9) DT removes → throws 403; (10) Editor removes on COMPLETED → throws 403; mock `prisma.$transaction` and all Prisma calls
- [x] T057 [P] Write Jest unit tests `packages/cms/src/middleware/__tests__/auth.test.ts` — test `optionalAuthenticate`: (1) missing `Authorization` header → calls `next()` with `req.user` undefined; (2) malformed token (not Bearer) → calls `next()` with `req.user` undefined, no 401; (3) expired token → calls `next()` with `req.user` undefined, no 401; (4) valid token → populates `req.user` with `{ userId, role }` identically to `authenticate`; test `authenticate` boundary: (5) missing token → returns 401; (6) valid token → populates `req.user`; mock `jsonwebtoken.verify`
- [x] T058 [P] Write Vitest unit tests `packages/frontend/src/utils/__tests__/formations.test.ts` — test player-to-position assignment algorithm (T036): (1) registered player with matching position placed in correct slot type; (2) guest with non-null position treated same as registered for slot matching; (3) players with `position = null` fill remaining slots in `confirmedAt ASC` order; (4) first 11 only placed on field, rest appear in table only; (5) ties on slot type resolved deterministically by `confirmedAt ASC`; (6) all 14 formation codes produce exactly 11 slot entries from `FORMATION_SLOTS`; pure function — no mocking required
- [x] T059 [P] Write Vitest unit tests `packages/frontend/src/composables/__tests__/useGameSignup.test.ts` (Vitest + `setActivePinia(createTestingPinia({ createSpy: vi.fn }))`) — test `useGameSignup`: (1) `signupSelf()` posts `{ mode: "self" }` and updates `roster` + `confirmedCount` from response without full page reload; (2) `signupGuest(firstName, lastName, position)` posts `{ mode: "guest", ... }` and guest entry appears in `roster`; (3) `signupProxy(targetPlayerId)` posts `{ mode: "proxy", ... }` and proxy row appears with `confirmedByName` set; (4) 422 response sets `error` message and does not update `roster`; (5) 409 response sets conflict message; (6) successful signup that fills capacity sets `isFull = true`; mock `$api` / `useFetch` at the composable boundary

**Checkpoint**: Unit test suite passes — CMS slug utility, transition job, ParticipationService, optionalAuthenticate, formations algorithm, and useGameSignup composable all have ≥80% coverage

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; T003 and T004 can run in parallel after T001; **T003 depends on T007** (backfill script requires slug utility — run T003 after T007 is implemented even though it is listed in Phase 1)
- **Phase 2 (Foundational)**: Depends on Phase 1 — T005 and T006 can run in parallel; **BLOCKS all user story phases**
- **Phase 3 (US-1)**: Depends on Phase 2 — T007 must precede T008; T008 and T009 can overlap after T007; T010–T013 are frontend tasks parallelizable after Phase 2
- **Phase 4 (US-7)**: Depends on Phase 2 — T014 → T015 sequential; **T016 depends on T008** (both modify `GameService.updateGame`; implement T008 first, then T016 extends it with IN_PROGRESS revert logic); T017 parallelizable after Phase 2
- **Phase 5 (US-2)**: Depends on Phase 2 AND T017 (status guards must exist before signup endpoint references them) — T018 and T021 can run in parallel; T019 → T020 sequential
- **Phase 6 (US-3)**: T051–T053 (sub-components) can start after Phase 2; T022 and T023 can run in parallel after T051–T053; T024 depends on T022 + T023 + T053; T025 and T026 wire sub-components into page
- **Phase 7 (US-4)**: Depends on Phase 3 (slug exists in DB) and T027 (rename) — T028, T029, T031 parallelizable after T027
- **Phase 8 (US-5)**: Depends on Phase 2 — T032 and T033 fully parallel
- **Phase 9 (US-6)**: Depends on Phase 6 (signup.vue + T052 SignupPlayerTable) and Phase 8 (lineup in DB) — T034 first; T035 + T036 parallel after T034; T037 → T038 sequential
- **Phase 10 (Polish)**: Depends on all previous phases — T039–T045 fully parallel; T042 (E2E) depends on all; **T043 MUST be complete before starting T048 (US-8 backend)**
- **Phase 11 (US-8)**: T046 and T047 have no dependencies (new file/function) — start immediately after Phase 1; **T048 depends on T043 (confirmedCount fix — complete Phase 10 T043 first) + T046 + T047**; T049 is independent (component restructure, no backend dependency); T050 depends on T049
- **Phase 12 (Unit Tests)**: Each test task runs in parallel with its corresponding implementation task (TDD: write failing test first, then implement)

### User Story Dependencies

| Story     | Depends on                                                           | Can parallelize with          |
| --------- | -------------------------------------------------------------------- | ----------------------------- |
| US-1 (P1) | Phase 2                                                              | US-7 (different files)        |
| US-7 (P1) | Phase 2                                                              | US-1 (different files)        |
| US-2 (P1) | Phase 2, T017 (status guards)                                        | US-4 frontend after Phase 3   |
| US-3 (P1) | Phase 5 (US-2 API contract available)                                | US-4 after slug routing ready |
| US-4 (P2) | Phase 3 (slug generation must exist)                                 | US-5, US-7                    |
| US-5 (P2) | Phase 2                                                              | US-4, US-6 backend            |
| US-6 (P2) | Phase 6 (signup.vue exists), Phase 8 (lineup in DB)                  | —                             |
| US-8 (P1) | **T043** (confirmedCount — Phase 10), T046 (type), T047 (middleware) | T049 fully parallel with all  |

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

### Phase 5 (US-2)

```
Parallel:
  T018 — GET signup-page endpoint (games.ts)
  T021 — removeParticipant + DELETE route

Sequential:
  T019 → T020 — signupParticipant service + route
```

### Phase 6 (US-3)

```
Parallel first (sub-components — Principle V gate):
  T051 — SignupGameHeader.vue
  T052 — SignupPlayerTable.vue
  T053 — SignupRegistrationRow.vue

Then parallel:
  T022 — signup.vue skeleton (wires sub-components)
  T023 — useGameSignup.ts composable

Then wire-up:
  T024 — bind emits in signup.vue
  T025 — isFull state (already in T053)
  T026 — wire roster to SignupPlayerTable
```

### Phase 9 (US-6)

```
T034 (formations.ts) →
  T035 [P] — GameLineupField.vue
  T036 [P] — assignment algorithm

Then:
  T037 → T038 (integration + wire-up in signup.vue)
```

### Phase 11 (US-8)

```
Prerequisite (from Phase 10 — must be done first):
  T043 — confirmedCount fix in GET /api/v1/games

Parallel immediately (no other dependencies):
  T046 — Add GameSignupState to shared/types/game.ts
  T047 — optionalAuthenticate in middleware/auth.ts
  T049 — GameCard.vue restructure + signupState prop

Sequential after T043 + T046 + T047:
  T048 — GET /api/v1/games PLAYER-aware handler

Then:
  T050 — index.vue mapping currentPlayerStatus → signupState
```

### Phase 12 (Unit Tests)

```
All parallel, each paired with its implementation task (TDD):
  T054 — slug.test.ts (alongside T007)
  T055 — GameStatusTransitionJob.test.ts (alongside T014)
  T056 — ParticipationService.test.ts (alongside T019 + T021)
  T057 — auth.test.ts (alongside T047)
  T058 — formations.test.ts (alongside T036)
  T059 — useGameSignup.test.ts (alongside T023)
```

---

### MVP First (US-1 only)

1. Complete Phase 1 (Setup) — write T054 (slug tests) alongside T007
2. Complete Phase 2 (Foundational — Principle VII gate)
3. Complete Phase 3 (US-1) — admin can set maxPlayers, game has slug, share links in admin panel
4. **STOP AND VALIDATE**: slug URLs work, maxPlayers persists, share-link copies correct URL
5. This is a shippable increment — admin workflow is unblocked

### Incremental Delivery

1. **Setup + Foundational** → DB schema migrated, shared types exported; T054 (slug tests) written first
2. **US-1** → maxPlayers + slugs + admin share links (P1 MVP)
3. **US-7** → auto-transition job + status guards (P1; T055 job tests + T057 auth tests written first)
4. **US-2** → signup API endpoints — T056 service tests written first; self/guest/proxy + remove-participant (P1 backend)
5. **US-3** → T051–T053 sub-components first (Principle V); T059 composable tests written first; trimodal flow + guest position/dismiss (P1 frontend complete)
6. **Polish → T043 confirmedCount fix FIRST** (required blocker for US-8 backend)
7. **US-8** → T046–T047 + T049 parallel; T048 after T043 ready; T050 last (P1)
8. **US-4** → slug routing on public pages, homepage filtering (P2)
9. **US-5** → lineup dropdown in admin (P2)
10. **US-6** → SVG field visualization (P2; T058 formations tests written first)
11. **Unit Tests** → all T054–T059 must pass at each phase gate

### Suggested MVP Scope

**Phases 1–3** (T001–T013) deliver the shareable signup link mechanism — the entry point of the feature. This is independently deployable once slug generation and admin share-link actions are verified.

---

## Task Count Summary

| Phase                 | Story | Tasks                     | [P] tasks  |
| --------------------- | ----- | ------------------------- | ---------- |
| Phase 1: Setup        | —     | T001–T004 (4)             | 2          |
| Phase 2: Foundational | —     | T005–T006 (2)             | 2          |
| Phase 3               | US-1  | T007–T013 (7)             | 3          |
| Phase 4               | US-7  | T014–T017 (4)             | 2          |
| Phase 5               | US-2  | T018–T021 (4)             | 2          |
| Phase 6               | US-3  | T051–T053 + T022–T026 (8) | 5          |
| Phase 7               | US-4  | T027–T031 (5)             | 3          |
| Phase 8               | US-5  | T032–T033 (2)             | 2          |
| Phase 9               | US-6  | T034–T038 (5)             | 2          |
| Phase 10: Polish      | —     | T039–T045 (7)             | 5          |
| Phase 11              | US-8  | T046–T050 (5)             | 3          |
| Phase 12: Unit Tests  | —     | T054–T059 (6)             | 6          |
| **Total**             |       | **59 tasks**              | **37 [P]** |
