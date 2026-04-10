# Implementation Plan: Game Signup Invitation

**Branch**: `chore/014-game-signup-invitation` | **Date**: 2026-04-10 | **Spec**: [spec.md](./spec.md)  
**Input**: Feature specification from `/specs/014-game-signup-invitation/spec.md`

## Summary

Allow Admin/Editor/DT users to share a game signup link, and enable PLAYER users to register themselves, guests, and proxy-register other players for a game through a trimodal `DropdownAddMore` interaction. The feature also adds automatic game status transitions (SCHEDULED → IN_PROGRESS → COMPLETED) via a scheduled job, an SVG tactical field visualization, and a "Anotarse" CTA directly on public game cards for authenticated players (US-8, FR-031–FR-033).

**Technical approach**: Extend the existing `GameParticipant` model (no new DB tables) with a per-item atomic signup endpoint. Add `maxPlayers`, `slug`, `lineup`, and `endDate` to the `Game` model. Expose an optional-auth games list endpoint that embeds per-player signup state. Add `GameSignupState` to the shared package; restructure `GameCard.vue` to support nested actions without nested `<a>` elements.

## Technical Context

**Language/Version**: TypeScript 5.x (Node.js 20 LTS)  
**Primary Dependencies**:

- CMS: Express 4, Prisma 5 (PostgreSQL), Zod, jsonwebtoken, node-cron (new dependency for US-7 scheduled job), ioredis
- Frontend: Nuxt 3 (SSR), Vue 3, Pinia, Tailwind CSS 3, Vitest, Vue Test Utils
- Shared: `@ministrosfc/shared` — TypeScript type/constants package used by both CMS and Frontend  
  **Storage**: PostgreSQL 16 (Prisma ORM); Redis (response cache)  
  **Testing**: CMS — Jest + Supertest; Frontend — Vitest + Vue Test Utils  
  **Target Platform**: Linux server (Fly.io); HTTPS  
  **Project Type**: Web application (monorepo — CMS API + Nuxt SSO frontend)  
  **Performance Goals**: Signup round-trip < 500ms p95; games list < 300ms p95  
  **Constraints**: Auth is client-only (sessionStorage); SSR homepage fetches games without user context; Progressive enhancement for PLAYER-specific CTA  
  **Scale/Scope**: ~30 active players; ~2 games/month; single-club deployment

## Constitution Check

- [x] **Shared types gate (Principle VII)**: New types crossing package boundaries:
  - `GameSignupState` → `packages/shared/src/types/game.ts` ✓ (resolved in data-model.md)
  - `FormationCode`, `FORMATIONS` → already added to `packages/shared/src/types/game.ts` ✓
  - `SignupRequestDTO`, `RosterEntry`, `GameSignupPageDTO` → `packages/shared/src/types/game-participant.ts` ✓
  - All new cross-package types are in `@ministrosfc/shared`. Gate PASSES.

- [x] **Page decomposition gate (Principle V)**: New pages and their template block extractions:
  - `pages/games/[slug].vue` — routing entry point only; content blocks → existing `components/pages/games/`
  - `pages/games/[slug]/signup.vue` — routing entry point only; feature blocks → `components/pages/games/signup/` (already established pattern: `SignupGameHeader`, `SignupProxySearch`, etc.)
  - No violations — existing convention is followed. Gate PASSES.

**Re-check post-design**: Constitution check passes. No new violations introduced by US-8 additions (FR-031–FR-033). `GameCard.vue` is a UI component, not a page — no decomposition required.

## Project Structure

### Documentation (this feature)

```text
specs/014-game-signup-invitation/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # All unknowns resolved (US-8 additions appended 2026-04-10)
├── data-model.md        # Schema changes + GameSignupState type (US-8 appended 2026-04-10)
├── quickstart.md        # Dev workflow including US-8 CTA testing guide
├── contracts/
│   └── api.md           # All endpoints + FR-031 PLAYER list response (US-8 appended 2026-04-10)
└── tasks.md             # Phase 2 output (/speckit.tasks command — NOT created by /speckit.plan)
```

### Source Code

```text
packages/shared/src/types/
├── game.ts               MODIFY — add GameSignupState, GameSignupState extends Game (US-8)
│                                   (FormationCode, FORMATIONS, Game extensions already added)
└── game-participant.ts   MODIFY — SignupRequestDTO, RosterEntry, GameSignupPageDTO (already added)

packages/cms/
├── prisma/schema.prisma  MODIFY — Game: maxPlayers, slug, lineup, endDate (already migrated)
├── src/middleware/
│   └── auth.ts           MODIFY — add optionalAuthenticate (US-8 / FR-031)
├── src/models/
│   └── Game.ts           MODIFY — add _count.participants to findMany (pre-existing bug fix)
├── src/routes/
│   ├── games.ts          MODIFY — GET / with optionalAuthenticate + PLAYER currentPlayerStatus;
│   │                               GET /slug/:slug; updated create/update schemas
│   └── participants.ts   MODIFY — POST /:gameId/participants/signup (trimodal);
│                                   DELETE /:gameId/participants/:participantId
├── src/services/
│   ├── GameService.ts    MODIFY — createGame (slug gen), updateGame (endDate, lineup whitelist),
│   │                               searchGamesWithPlayerStatus (US-8)
│   └── ParticipationService.ts  MODIFY — signupParticipant (trimodal); getSignupPage
├── src/utils/
│   └── slug.ts           NEW — generateGameSlug (char map transliteration, dedup suffix)
├── src/jobs/
│   └── gameStatusJob.ts  NEW — scheduled node-cron job (US-7 / FR-026)
└── src/scripts/
    └── backfill-game-slugs.ts  NEW — one-time migration script

packages/frontend/src/
├── pages/
│   ├── index.vue                   MODIFY — pass auth header to games list; map currentPlayerStatus
│   │                                         to signupState prop on GameCard (US-8)
│   ├── games/
│   │   ├── [slug].vue              NEW — replaces [id].vue; public game detail page
│   │   └── [slug]/
│   │       └── signup.vue          NEW — Game Sign Up Page (authenticated)
│   └── admin/games/
│       └── [id]/
│           ├── index.vue           MODIFY — "Copiar link" button + share link
│           └── edit.vue (or form)  MODIFY — maxPlayers input + lineup select
├── components/
│   ├── game/
│   │   └── GameCard.vue            MODIFY — FR-032 signupState prop + FR-033 restructure
│   └── pages/
│       ├── games/
│       │   └── signup/             EXISTING — SignupGameHeader, SignupProxySearch, etc.
│       └── admin/games/            EXISTING — admin game detail/edit blocks
├── composables/
│   └── useGameSignup.ts            EXISTING — trimodal signup state machine
├── utils/
│   └── formations.ts               NEW — 14-formation slot lookup table
├── components/game/
│   └── GameLineupField.vue         NEW — SVG field visualization
└── server/
    ├── middleware/
    │   └── game-uuid-redirect.ts   NEW — UUID → slug 301 redirect
    └── routes/
        └── robots.txt.ts           NEW — robots.txt with Disallow: /games/*/signup
```

**Structure Decision**: Option 2 (Web application monorepo). The project uses the established `packages/cms` (Express API) + `packages/frontend` (Nuxt 3) + `packages/shared` (types) layout. US-8 does not introduce new packages or layers.

## Complexity Tracking

No constitution violations. No complexity justification required.
