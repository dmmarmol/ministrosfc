# Implementation Plan: Game Signup & Invitation (014)

**Branch**: `chore/014-game-signup-invitation` | **Date**: 2026-04-09 | **Spec**: [./spec.md](./spec.md)  
**Input**: Feature specification from `/specs/014-game-signup-invitation/spec.md`

---

## Summary

Add a self-service game signup system with three modes (self / guest / proxy), an SVG formation field visualiser, slug-based public game pages (301 redirect from UUID URLs), admin share-link actions, homepage game filtering (SCHEDULED = upcoming, COMPLETED = past), and a background job that auto-transitions game status `SCHEDULED → IN_PROGRESS → COMPLETED` based on `game.date` and `game.endDate` (auto-computed as `date + exactly 100 min`, server-side only, not editable).

Existing entities cover all new concepts:

- `GameParticipant` (with `confirmationStatus: CONFIRMED`) is the signup record — no new table.
- `Player` with `playerType: GUEST` is the guest player record — no new table.

New Prisma fields on `Game`: `maxPlayers Int?`, `slug String? @unique`, `lineup String?`, `endDate DateTime?`.

---

## Technical Context

**Language/Version**: TypeScript 5.x strict  
**Primary Dependencies**: Nuxt 3 (SSR), Express 4, Prisma 5 (PostgreSQL), Pinia 2, Zod  
**Storage**: PostgreSQL via Prisma  
**Testing**: Vitest (frontend unit), Jest (CMS unit), Playwright (E2E)  
**Target Platform**: Node.js 20 (CMS) + Nuxt SSR (frontend), Docker / Fly.io  
**Project Type**: Monorepo web application (CMS API + Nuxt frontend + shared types)  
**Performance Goals**: Capacity check must be atomic (no race condition under concurrent signups)  
**Constraints**:

- No new major npm dependencies
- No `@nuxtjs/robots` module — use `server/routes/robots.txt.ts` instead
- Slug normalization uses a manual char map (no `slugify` package)
- endDate is never sent to the client as an editable field; payloads containing it are stripped silently

---

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Shared types gate (Principle VII)**: New types cross `packages/cms` ↔ `packages/frontend`. The following types MUST be added to `packages/shared/src/types/` and exported from `@ministrosfc/shared` **before** any implementation task begins:
  - `game.ts`: `FORMATIONS` const array, `FormationCode` type, `Game` extended (+`maxPlayers`, `slug`, `lineup`, `endDate` read-only), `GameCreateDTO` (+`maxPlayers`, `lineup`; no `endDate`), `GameUpdateDTO` (+`maxPlayers`, `lineup`; no `endDate`)
  - `game-participant.ts` (new): `SelfSignupDTO`, `GuestSignupDTO`, `ProxySignupDTO`, `SignupRequestDTO` tagged union, `RosterEntry`, `GameSignupPageDTO`

**Post-design re-check**: ✅ All new shared types are catalogued in `data-model.md`. No violations. No complexity tracking entry required.

---

## Architectural Decisions

| Decision                 | Choice                                                                                          | Rationale                                                                                            |
| ------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `GameSignup` entity      | Alias for `GameParticipant` (`confirmationStatus: CONFIRMED`)                                   | `@@unique([gameId,playerId])` already enforces FR-005; no new table                                  |
| `GuestPlayer` entity     | `Player` with `playerType: GUEST`                                                               | `invitedById` FK + `PlayerType.GUEST` already exist; no new table                                    |
| Slug normalization       | Manual char map (no third-party library)                                                        | Spanish characters are predictable; zero new runtime dep                                             |
| Field visualisation      | SVG (not Canvas)                                                                                | Native hover events, Vue reactivity, full accessibility                                              |
| `robots.txt`             | `server/routes/robots.txt.ts` in Nuxt                                                           | No `@nuxtjs/robots` module needed                                                                    |
| Capacity atomicity       | `prisma.$transaction` + `@@unique` constraint                                                   | PostgreSQL prevents races; no optimistic UI                                                          |
| endDate computation      | `date + exactly 100 min`, server-side only                                                      | Not user-editable; computed on create and every date update                                          |
| Admin IN_PROGRESS revert | ADMIN changing `date` to future atomically reverts status to `SCHEDULED` + recomputes `endDate` | FR-030                                                                                               |
| Status job frequency     | Every 5 minutes                                                                                 | Acceptable real-time approximation; double-transition allowed (zero IN_PROGRESS duration observable) |
| Slug migration           | Single migration with `@unique` on `slug` (PostgreSQL treats NULLs as distinct, so the constraint is safe before backfill) + backfill script | Simpler than 3-step; safe — multiple NULL values never conflict in a UNIQUE column |

---

## Project Structure

### Documentation (this feature)

```text
specs/014-game-signup-invitation/
├── plan.md              ← this file
├── research.md          ← codebase archaeology + decisions
├── data-model.md        ← Prisma changes + shared types
├── quickstart.md        ← dev setup + migration steps
├── contracts/
│   └── api.md           ← new + modified endpoint contracts
└── tasks.md             ← (Phase 2 — generated by /speckit.tasks)
```

### Source Code (repository root)

```text
packages/cms/
├── prisma/
│   ├── schema.prisma                              ← Game: +maxPlayers +slug +lineup +endDate
│   └── migrations/
│       └── YYYYMMDDHHMMSS_add_game_signup_fields/ ← new migration
├── src/
│   ├── scripts/
│   │   └── backfill-game-slugs.ts                 ← new: one-time backfill
│   ├── utils/
│   │   ├── slug.ts                                ← new: slug generation (manual char map)
│   │   └── error-codes.ts                         ← +GAME_CAPACITY_EXCEEDED, GAME_NOT_SCHEDULED,
│   │                                                   SIGNUP_DUPLICATE, PROXY_CONFLICT
│   ├── routes/
│   │   ├── games.ts                               ← +slug endpoint, +schemas, +NON_ADMIN lineup
│   │   └── participants.ts                        ← +POST /signup, +DELETE /:participantId
│   ├── services/
│   │   ├── GameService.ts                         ← +endDate compute/revert, +status guards
│   │   └── ParticipationService.ts                ← +signupParticipant() trimodal, +removeParticipant()
│   └── jobs/
│       └── GameStatusTransitionJob.ts             ← new: SCHEDULED→IN_PROGRESS→COMPLETED, every 5 min

packages/shared/
└── src/
    └── types/
        ├── game.ts                                ← +FORMATIONS, FormationCode, Game/DTO extensions
        └── game-participant.ts                    ← +SignupRequestDTO, RosterEntry, GameSignupPageDTO

packages/frontend/
├── server/
│   ├── routes/
│   │   └── robots.txt.ts                         ← new: disallow /admin
│   └── middleware/
│       └── game-uuid-redirect.ts                 ← new: 301 /games/:uuid → /games/:slug
├── src/
│   ├── pages/
│   │   └── games/
│   │       ├── [slug].vue                        ← renamed from [id].vue
│   │       └── [slug]/
│   │           └── signup.vue                    ← new: public signup page
│   ├── pages/admin/games/
│   │   └── [id]/
│   │       └── edit.vue                          ← +maxPlayers field, +lineup select (NO endDate)
│   ├── composables/
│   │   └── useGameSignup.ts                      ← new: trimodal signup state machine
│   ├── components/game/
│   │   └── GameLineupField.vue                   ← new: SVG formation visualiser
│   └── utils/
│       └── formations.ts                         ← new: position label helpers
└── tests/
    └── e2e/
        └── game-signup.spec.ts                   ← new: Playwright E2E for signup flow
```

**Structure Decision**: Monorepo Option 2 (CMS backend + Nuxt frontend + shared types package). All three packages are modified. New files follow existing conventions in each package (`src/jobs/`, `src/utils/`, `server/routes/`, `src/composables/`).

---

## Status Permission Matrix (Binding — Assumption 8)

| Status        | Editor / DT                                 | ADMIN                                                         |
| ------------- | ------------------------------------------- | ------------------------------------------------------------- |
| `SCHEDULED`   | Normal role permissions (whitelist applies) | Full access                                                   |
| `IN_PROGRESS` | HTTP 403 on all mutations                   | Full access; changing `date` to future reverts to `SCHEDULED` |
| `COMPLETED`   | HTTP 403 on lineup + participant mutations  | lineup + participants editable                                |

---

## Migration Plan (3-Step Slug Strategy)

1. **Migration**: Create a single migration adding all four fields: `maxPlayers Int?`, `slug String? @unique @db.VarChar(200)`, `lineup String? @db.VarChar(10)`, `endDate DateTime?`. PostgreSQL treats NULL values as distinct, so `@unique` on the nullable `slug` column is safe before backfill — all existing rows will have `slug = NULL` and do not conflict with each other.
2. **Backfill**: Run `backfill-game-slugs.ts` to populate `slug` for all existing rows (`YYYY-MM-DD-{opponent-slug}`). After backfill all rows have a unique non-NULL slug.

---

## Key Invariants (Implementation Must Enforce)

| #    | Invariant                                                                                      | Where enforced                                      |
| ---- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| I-1  | `endDate = date + exactly 100 min`, UTC; not user-settable                                     | `GameService.createGame` + `updateGame`             |
| I-2  | Client payloads containing `endDate` are stripped silently                                     | `gameCreateSchema` / `gameUpdateSchema` Zod strip   |
| I-3  | Signup blocked when `game.status ≠ SCHEDULED` (includes `IN_PROGRESS`)                         | `ParticipationService.signupParticipant` → HTTP 422 |
| I-4  | Capacity check + insert atomic                                                                 | `prisma.$transaction`                               |
| I-5  | Slug generated from `date + opponentTeam.name`; unique                                         | `GameService.createGame` (calls `slug.ts`)          |
| I-6  | DT role may set `lineup` (formation code only); `NON_ADMIN_ALLOWED_FIELDS` updated             | `games.ts` route whitelist                          |
| I-7  | ADMIN updating `date` on `IN_PROGRESS` game to a future time → status reverts to `SCHEDULED`   | `GameService.updateGame`                            |
| I-8  | Detail-link share button appears on all statuses in `/admin/games`                             | US-1 FR-028                                         |
| I-9  | Signup-link share button appears only when `status = SCHEDULED AND capacity not full`          | US-1 FR-027                                         |
| I-10 | Homepage: `SCHEDULED` → upcoming section; `COMPLETED` → past section; everything else excluded | FR-029                                              |
