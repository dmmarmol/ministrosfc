# Research: Game Signup Invitation (014)

**Branch**: `chore/014-game-signup-invitation`  
**Date**: 2026-04-09  
**Status**: Complete — all unknowns resolved

---

## Codebase Archaeology

### Prisma Schema (`packages/cms/prisma/schema.prisma`)

**`Game` model** — current fields:

- `id` (UUID), `opponentTeamId`, `tournamentId?`, `date`, `location?`, `playgroundId?`, `competitionType`, `status (GameStatus)`, scores, stats, `notes`, `participants`
- **Missing (must add)**: `maxPlayers Int?`, `slug String @unique`, `lineup String?`
- `GameStatus` enum: `SCHEDULED | IN_PROGRESS | COMPLETED | CANCELLED` (all 4 exist; spec gates on `SCHEDULED` only)

**`Player` model** — `playerType: PlayerType (REGISTERED|GUEST)`, `status: PlayerStatus (ACTIVE|INACTIVE)`, `invitedById?` FK → self-reference (`onDelete: SetNull`), `invitedGuests` back-relation — **no new fields needed for guest players**.

**`GameParticipant` model** — `confirmationStatus: ConfirmationStatus (NOT_RESPONDED|CONFIRMED|DECLINED)`, `confirmedById?` FK → `Player`, `confirmedAt?` — **`GameSignup` is a semantic alias; no new table needed**.

- `@@unique([gameId, playerId])` — already enforces FR-005 (no duplicate signups).
- `confirmedById` relation already exists; proxy signup just sets this field.

### Shared Types (`packages/shared/src/types/`)

| File                  | Current state                                                                                                                           | Changes needed                                                                                                                                                                             |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `game.ts`             | `Game`, `GameCreateDTO`, `GameUpdateDTO`, `GameStatus`, `CompetitionType`                                                               | Add `slug`, `maxPlayers`, `lineup` to `Game`; add `maxPlayers`, `lineup` to `GameCreateDTO`/`GameUpdateDTO`; add `FORMATION_VALUES` const array and `FormationCode` type alias             |
| `game-participant.ts` | `GameParticipant`, `ParticipantDTO`, `ParticipantStatsUpdateDTO`, `ConfirmationStatus`                                                  | Add `GameSignupDTO` (self-signup), `GuestSignupDTO` (guest creation), `ProxySignupDTO` (proxy); add `GameSignupPageDTO` response type; deprecate/keep `ParticipantDTO` for backward compat |
| `player.ts`           | `Player`, `PlayerPublic`, `PlayerCreateDTO`, `PlayerUpdateDTO`, `PlayerType`, `PlayerStatus`, `Position`, `Foot`, `PositionDisplayName` | No new types needed — `invitedById` already on `Player`; `playerType: GUEST` already exists                                                                                                |

**New types required in `@ministrosfc/shared` (Principle VII gate)**:

1. `FormationCode` — string union of 14 formation values
2. `FORMATIONS` — const array of valid formation strings (shared between CMS validation and frontend select)
3. `GameSignupDTO` — `{ mode: 'self' }`
4. `GuestSignupDTO` — `{ mode: 'guest'; firstName: string; lastName: string }`
5. `ProxySignupDTO` — `{ mode: 'proxy'; targetPlayerId: string }`
6. `SignupRequestDTO` — tagged union of the 3 above
7. `GameSignupPageDTO` — game state + roster + auth context for the signup page response
8. `RosterEntry` — normalized roster row (registered or guest) with `confirmedById?`, `invitedById?`, `confirmedAt`
9. `SlugLookupDTO` — `{ gameId: string; slug: string }` for CMS → frontend redirect

### CMS Routes

**`packages/cms/src/routes/games.ts`** — existing endpoints:

- `GET /api/v1/games` — public, paginated search
- `GET /api/v1/games/:id` — public, by UUID
- `POST /api/v1/games` — EDITOR+
- `PATCH /api/v1/games/:id` — DT+ with field whitelist (`NON_ADMIN_ALLOWED_FIELDS = { date, notes, tournamentId, playgroundId }`)
- `DELETE /api/v1/games/:id` — ADMIN only

**Changes needed to `games.ts`:**

1. `GET /api/v1/games/slug/:slug` — resolve slug → UUID redirect (or return game directly by slug)
2. `gameCreateSchema` — add `maxPlayers`, `lineup`, normalize `opponentName` → `slug` (server-side)
3. `gameUpdateSchema` — add `maxPlayers`, `lineup`; add `lineup` to `NON_ADMIN_ALLOWED_FIELDS` (DT whitelist)
4. `GameService.createGame` — generate slug from `date + opponentTeam.name` (requires fetching opponent name at create time)
5. `GameService.updateGame` — add `maxPlayers`, `lineup` passthrough; `lineup` whitelisted for DT

**`packages/cms/src/routes/participants.ts`** — existing endpoints:

- `GET /api/v1/games/:gameId/participants` — public
- `POST /api/v1/games/:gameId/participants/confirm` — PLAYER (no auth)
- `PATCH /api/v1/games/:gameId/participants/:playerId/status` — PLAYER

**Changes needed to `participants.ts`:**

1. `POST /api/v1/games/:gameId/participants/signup` — new trimodal endpoint (self / guest / proxy)
   - Replaces old batch `confirm` for the new per-item model
   - Auth: PLAYER role
   - Body: `SignupRequestDTO` tagged union
   - Returns: `RosterEntry` of the newly created participant + updated capacity count
   - Enforces: `game.status === SCHEDULED` (FR-024, 422), `maxPlayers` gate (FR-006, 422), de-dup (FR-005, 409)
2. `DELETE /api/v1/games/:gameId/participants/:participantId` — Admin/Editor remove participant (FR-013b, FR-014)
   - Not DT; decrements capacity by removing the `GameParticipant` record

### CMS Services

**`ParticipationService`** — current `confirmParticipation` is a batch method (self + friends array). The new feature replaces this with per-item atomic calls. The old method can be kept for backward compatibility (existing integration tests reference it). New `signupParticipant(gameId, userId, dto: SignupRequestDTO)` method dispatches by `dto.mode`.

**`GameService.createGame`** — needs to generate `slug` from `date + opponent name`. Requires `prisma.opponentTeam.findUnique` to get `name` at create time, then apply slug normalization. Need a shared slug utility in `packages/cms/src/utils/slug.ts`.

### Frontend Pages

**Existing**: `packages/frontend/src/pages/games/[id].vue` — UUID-based, public game detail page.

**Changes needed**:

1. Rename `[id].vue` → `[slug].vue` (route becomes `/games/:slug`)
2. Add `server/routes/redirect.ts` or Nuxt server route handler for legacy `/games/:uuid` → 301 → `/games/:slug` (UUID detection: `[0-9a-f]{8}-[0-9a-f]{4}-…`)
3. New page: `pages/games/[slug]/signup.vue` — Game Sign Up Page (authenticated)
4. Admin game edit page `pages/admin/games/[id]/edit.vue` — add `maxPlayers` input + `lineup` select
5. `pages/admin/games/[id]/index.vue` (or edit) — add "Copiar link de convocatoria" button

**Frontend auth middleware** — already handles `?redirect=` param for unauthenticated redirects (spec 005). The signup page will use `middleware: 'auth'` with a custom check for PLAYER role.

### Composables

**Needed (new)**:

- `composables/useGameSignup.ts` — trimodal signup state machine: fetches game + roster, exposes `signupSelf()`, `signupGuest(firstName, lastName)`, `signupProxy(playerId)`; handles optimistic UI update from server response; handles 422/409 errors.

### Slug Normalization

**Decision**: Implement `slugify(date: string, opponentName: string): string` in `packages/cms/src/utils/slug.ts` using the `transliteration` npm package (or custom lookup).

**Rationale**: The `transliteration` package (npm, 4kB gzip, actively maintained) handles accented Spanish chars (`á→a`, `é→e`, `ñ→n`, `ü→u`) correctly. Alternative: manual lookup table. Decision: use a lean manual lookup table in a utility function to avoid adding a new dependency. Pattern: lowercase → char map for `á,é,í,ó,ú,ü,ñ` → replace non-alphanumeric with `-` → collapse repeated `-` → trim `-`.

**Alternatives considered**:

- `transliteration` package: works well but adds a dependency. Rejected because the character set for Spanish team names is small and predictable.
- `slugify` package: similar reason.
- Manual map: chosen — zero dependencies, fully testable, covers the exact chars needed.

### SVG Field Visualization

**Decision**: Pure SVG rendered client-side in a Vue component `GameLineupField.vue`. No Canvas API.

**Rationale**: SVG is more accessible (ARIA), easier to style with Tailwind/CSS, and integrates naturally with Vue reactivity (bind `@mouseenter`/`@mouseleave` on `<circle>` elements). Canvas would require manual hit-testing for hover interactions.

**Formation lookup table**: Static TypeScript object `FORMATION_SLOTS` mapping each of 14 formation strings to an array of 11 `{ x: number; y: number; slot: 'GK'|'DEF'|'MID'|'FWD' }` objects (normalized 0–1 coordinates). This lives in `packages/frontend/src/utils/formations.ts`. The position-to-slot mapping (`Position → slot type`) is a small lookup in the same file.

**Alternatives considered**: Canvas (rejected — no native hover), libraries like D3 (rejected — overkill for a fixed-layout SVG field), server-computed positions (rejected — spec mandates client-side only).

### robots.txt

**Decision**: Nuxt server route at `packages/frontend/server/routes/robots.txt.ts` returning a static text response with `Disallow: /games/*/signup`.

**Rationale**: No `@nuxtjs/robots` module is installed and the spec recommends not adding unnecessary modules. Nuxt's `server/routes/` supports direct file-based server routes.

**Alternatives considered**: Adding `@nuxtjs/robots` module — rejected to avoid new dependency.

### Capacity Enforcement (Concurrency Safety)

**Decision**: Enforce capacity gate inside a Prisma `$transaction` block that (1) counts confirmed participants, (2) checks vs `maxPlayers`, (3) creates the `GameParticipant` in one atomic operation. The `@@unique([gameId, playerId])` DB constraint catches any race conditions for duplicate signups.

**Rationale**: PostgreSQL serializable isolation + unique constraint gives first-write-wins semantics at DB level. The FR-006 capacity check and FR-005 duplicate check are both resolved by the same transaction pattern.

### Proxy Signup Concurrency (FR-025)

The `@@unique([gameId, playerId])` constraint on `GameParticipant` catches the exact race condition where two users simultaneously proxy-register the same target player. The second write will throw a Prisma `P2002` unique constraint error, which maps to HTTP 409.

### Error Codes

New error codes to add to `packages/cms/src/utils/error-codes.ts`:

- `GAME_CAPACITY_EXCEEDED` — FR-006 / FR-024
- `GAME_NOT_SCHEDULED` — FR-024
- `SIGNUP_DUPLICATE` — FR-005 (differs from generic CONFLICT)
- `PROXY_CONFLICT` — FR-025 concurrency

---

## US-8 Research (added 2026-04-10 — FR-031, FR-032, FR-033)

### US-8-R1. JWT Payload Has No `playerId`

**Finding**: `packages/cms/src/middleware/auth.ts` — `JwtPayload` contains `{ userId, role }` only. `playerId` is not in the token.

**Resolution**: To compute `currentPlayerStatus` for a PLAYER caller, derive `playerId` via `prisma.user.findUnique({ where: { id: userId }, select: { playerId: true } })` — same pattern already used in `ParticipationService.ts` (line 82-86). Parallelize this lookup with the `GameParticipant` query.

### US-8-R2. No `optionalAuthenticate` Middleware Exists

**Finding**: The existing `authenticate` function blocks unauthenticated with 401. `GET /api/v1/games` is public.

**Resolution**: Add `optionalAuthenticate` to `packages/cms/src/middleware/auth.ts`. If no token or invalid/expired token → silently call `next()` without populating `req.user`. Valid token → populate `req.user` as usual.

### US-8-R3. Redis Cache Cannot Serve Player-Specific Responses

**Finding**: `GameService.searchGames` serializes filter options as the cache key. The same cache entry would be returned to all callers of the same query shape, regardless of who the PLAYER is.

**Resolution**: Skip Redis cache for PLAYER-authenticated requests. Compute `currentPlayerStatus` live. Non-PLAYER and anonymous requests continue using the existing 5-min cache unchanged.

### US-8-R4. `_count.participants` Not Included in `GameModel.findMany`

**Finding**: `GET /api/v1/games` route maps `_count?.participants` → `confirmedCount` (line ~175 in games.ts), but `GameModel.findMany` does not include `_count` in its `include` clause — so `confirmedCount` is always `0` for list responses today.

**Resolution**: Add `_count: { select: { participants: true } }` to `GameModel.findMany`'s Prisma `include` block. This is a pre-existing bug that must be fixed to support both the existing feature and FR-031 capacity checks.

### US-8-R5. `GameSignupState` Type Is New — Goes in `@ministrosfc/shared`

**Finding**: `CurrentPlayerStatus` in `game-participant.ts` is for the per-game signup page detail view (`"not_signed_up" | "signed_up" | "no_player_linked" | "not_player_role"`). FR-031/FR-032 need a different, narrower type for the games list card signal.

**Resolution**: Add `GameSignupState = "available" | "signed_up" | "full"` to `packages/shared/src/types/game.ts`. Export from `@ministrosfc/shared`. Referenced by both the CMS response shape and the frontend `GameCard.vue` prop.

### US-8-R6. `GameCard.vue` Is a Single `<NuxtLink>` Wrapper

**Finding**: `GameCard.vue` uses `<NuxtLink :to="...">` as the outermost element wrapping all card content (opponent logo, game info, score/badge). Adding another `<NuxtLink>` for "Anotarse" inside would create nested `<a>` elements — invalid HTML.

**Resolution (FR-033)**: Replace the outer `<NuxtLink>` with a `<div class="group ...">` or `<article>`. Move the detail navigation to an inner `<NuxtLink>` wrapping the content columns. Append a conditional CTA section (separate `<NuxtLink>` or non-interactive `<span>`) in the right-side action area. The `group` Tailwind class on the container preserves group-hover behaviour.

### US-8-R7. Frontend `$api` Plugin Auth Header Injection

**Finding**: `useGameSignup.ts` calls `/api/v1/games/:id/signup-page` (an authenticated endpoint) without explicitly passing `Authorization` headers — suggesting the `$api` plugin auto-injects the token from the auth store.

**Resolution**: Before implementing, read `packages/frontend/src/plugins/api.ts` (or equivalent) to confirm. If the plugin injects the header automatically for all calls, `GET /api/v1/games` will already receive the token for PLAYER callers. The CMS-side `optionalAuthenticate` middleware handles the rest. No change to `index.vue` may be needed.

**Action**: Verify `$api` plugin — resolve before tasks are generated in `/speckit.tasks`.

---

## Resolved Unknowns

| Unknown                            | Resolution                                                   |
| ---------------------------------- | ------------------------------------------------------------ |
| Slug normalization library         | Manual char map (no new dep)                                 |
| SVG vs Canvas for field            | SVG — hover + accessibility                                  |
| `robots.txt` approach              | Nuxt `server/routes/robots.txt.ts`                           |
| `GameSignup` as new table?         | No — alias for `GameParticipant`                             |
| `GuestPlayer` as new table?        | No — `Player` with `playerType: GUEST`                       |
| Capacity atomicity                 | Prisma `$transaction` + unique constraint                    |
| Old UUID route backward compat     | Nuxt server middleware — UUID pattern → 301                  |
| DropdownAddMore — new component?   | Existing `components/ui/DropdownAddMore.vue` — reuse         |
| Lineup field — existing component? | No — new `GameLineupField.vue`                               |
| Auth middleware redirect param     | Already implemented in `middleware/auth.ts` via `?redirect=` |
