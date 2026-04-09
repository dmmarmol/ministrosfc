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
