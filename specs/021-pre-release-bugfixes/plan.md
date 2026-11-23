# Implementation Plan: Pre-release bugfixes

**Branch**: `main` | **Date**: 2026-11-04 | **Spec**: [spec.md](spec.md)

**Feature directory**: `specs/021-pre-release-bugfixes/`

## Summary

Deliver the fixes in the spec within the existing Ministros FC monorepo. The work spans Nuxt/Vue navigation and admin/public UI, shared TypeScript contracts, CMS validation/import paths, and a PostgreSQL enum/data migration. It will standardize safe `returnUrl` handling, restore an in-progress game draft after opponent-team creation, refresh the admin games list, make roster search/filter behavior predictable, remove `SEASON` after converting existing records to `LEAGUE`, and align dashboard/theme behavior with existing project patterns. Spanish labels remain static application copy; this feature does not introduce an i18n framework.

## Technical Context

**Language/Version**: TypeScript 5.x; Vue 3; Nuxt 4; Node.js >=23 (workspace engine requirement).

**Primary Dependencies**: Existing Nuxt 4 / Vue 3, `@nuxt/ui`, Pinia, `@ministrosfc/shared`, Prisma 5, Express CMS API, Vitest/Vue Test Utils, and PostgreSQL. No new dependency is planned.

**Storage**: PostgreSQL through Prisma. No model fields are added, but existing `Game` and `Tournament` rows require a data-preserving enum migration (`SEASON` → `LEAGUE`) before removing the enum variant.

**Testing**: Frontend Vitest and Vue Test Utils; CMS Jest as currently configured; Prisma migration validation against a disposable or staging database; focused browser/E2E validation for multi-route flows. New testable behavior follows TDD and the constitution's coverage gates.

**Target Platform**: Server-rendered web application, public and authenticated/admin routes, desktop and mobile browsers.

**Project Type**: Existing npm-workspace monorepo web application (`packages/frontend`, `packages/cms`, `packages/shared`).

**Performance Goals**: Preserve current page and API response behavior; no new numeric latency target is specified by this bugfix feature.

**Constraints**:
- Restrict changes to this feature's documented scope and the existing architecture; do not add dependencies or a translation framework.
- Read and write route query state through `useQueryParams`; reject external, protocol-relative, malformed, and otherwise invalid `returnUrl` values.
- Reuse `@ministrosfc/shared` contracts for cross-package types and the existing CMS API contracts.
- Keep API transport in composables and page components focused on routing/composition.
- Centralize dark-mode styling in the existing Tailwind v4 `theme.css` tokens and support the spec's root `.dark` class; do not introduce hard-coded design colors or a separate theme system.
- Preserve all non-type data on migrated game/tournament rows; update the in-repository import mapping so it no longer emits the removed enum value.

**Scale/Scope**: Admin game/team/tournament/dashboard flows, public roster and game status presentation, shared back navigation, theme styling, shared game/competition/player contracts, CMS game/tournament validation and seed-import transforms, and one PostgreSQL enum/data migration. No new API endpoint or persistent entity is required.

## Constitution Check

*Gate: evaluated before research and re-evaluated after design.*

| Principle / gate | Assessment |
|---|---|
| I–III: feature scope, approved spec, plan before tasks | Pass: the feature spec and clarifications exist; this plan records design decisions and migration requirements before task generation. |
| IV: test-first and quality gates | Pass with implementation requirement: add focused regression tests before behavior changes; meet bug-fix coverage policy and run relevant package checks. |
| V: component isolation and page decomposition | Pass with implementation requirement: pages remain route/composition entry points; named UI blocks or templates over ~30 lines belong in page-scoped components. |
| V: page access metadata | Pass with implementation requirement: any touched/added page retains the required `definePageMeta` access declaration. |
| VI: data flow and query state | Pass: server remains the source of truth; `useQueryParams` is the sole query read/write abstraction; games list freshness is explicit. |
| VII: shared contracts | Pass: shared DTOs/enums remain in `packages/shared`; no duplicate frontend API DTOs. CMS-internal reusable schemas/types follow its domain type architecture. |
| VIII: changelogs | Not applicable to planning; no version bump or release is in scope. |
| Dependency, storage, and migration policy | Pass: no dependencies or model fields added; PostgreSQL enum replacement is ordered after data conversion and preserves all other row values. |
| CSS architecture | Pass: use the existing Tailwind v4 `theme.css` token system; align its dark selector with the specified root `.dark` state rather than introducing a second design system. |

No constitution violation or complexity exception is identified. These are implementation constraints to preserve in tasks.

## Design Decisions

1. **Safe return navigation**: use the shared `useQueryParams` abstraction and a single reusable route-validation rule. Only application-local absolute paths beginning with one `/` are accepted; reject `//`, backslash/control-character tricks, malformed values, and external origins. Missing/invalid values use the caller's configured fallback. This prevents open redirects and keeps route query handling constitutional.
2. **Restore game draft from team creation**: before leaving game creation, persist only the in-progress form fields and participant identifiers in tab-scoped `sessionStorage`; navigate to team creation with `returnUrl=/admin/games/create`. After team creation, store its returned ID alongside the pending draft, then navigate back. On return, consume the draft once, select the new team as `opponentTeamId`, and do not submit the game. Do not place a potentially long participant list in the URL or persist auth/session credentials with the draft.
3. **Fresh game index**: after a successful create/update, route to a valid return destination or `/admin/games`; when the index is next opened, invalidate/bypass cached list data and fetch from the CMS. Preserve active list filters only where compatible with current route behavior.
4. **Competition type removal**: first update every `Game` and `Tournament` row with `SEASON` to `LEAGUE`; then replace the PostgreSQL enum without `SEASON`, preserving defaults and all unrelated columns. Remove `SEASON` from Prisma/shared types, CMS validation, frontend display/select mappings, and seed-import mappings. The owner-updated source CSV remains an external prerequisite; legacy labels such as “Torneo Apertura” and “Torneo Clausura” must map to `LEAGUE` rather than emit `SEASON`.
5. **Status/search/guest behavior**: use existing `PlayerType`, `PlayerStatus`, and `OPTION_FILTER_ALL` contracts. A non-empty search forces `Todos`, searches registered players across statuses, and excludes guests; clearing search retains `Todos`. The status selector emits its `selected` event when `Todos` is chosen.
6. **Static Spanish labels and dark mode**: use the project's existing Spanish display strings and canonical enums; use `Sin estado` or `Sin tipo` for missing/unknown display values. No `useI18n`/`useLocale` API or translation package is assumed or added. Keep theme values in `theme.css`; the existing stylesheet currently defines `[data-theme="dark"]`, while the spec requires compatibility with the root `.dark` class.
7. **Composable and dashboard patterns**: reuse `useGames` and add a `usePlayers` wrapper only for existing CMS player endpoints, importing shared DTOs. Render recent games with the existing admin `UTable`/`cellActions` pattern and route edits to `/admin/games/:id`.

## Project Structure

### Documentation (this feature)

```text
specs/021-pre-release-bugfixes/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── navigation.md
│   └── competition-type-api.md
├── checklists/
│   └── requirements.md
└── spec.md
```

### Relevant source areas (implementation scope only)

```text
packages/
├── frontend/
│   └── src/
│       ├── assets/theme.css
│       ├── components/
│       │   ├── game/
│       │   ├── pages/admin/games/
│       │   ├── ui/BackButton.vue
│       │   └── ui/TournamentCompetitionType.vue
│       ├── composables/
│       │   ├── useGames.ts
│       │   ├── usePlayers.ts                 # new wrapper if needed by dashboard
│       │   └── useQueryParams.ts
│       └── pages/
│           ├── admin/dashboard.vue
│           ├── admin/games/
│           ├── admin/teams/create.vue
│           ├── roster.vue
│           └── tournaments.vue
├── shared/src/types/
│   ├── game.ts                               # canonical CompetitionType
│   └── player.ts                             # existing Player contracts
└── cms/
    ├── prisma/
    │   ├── migrations/                       # data conversion + enum replacement
    │   └── schema.prisma
    └── src/
        ├── routes/games.ts
        ├── routes/tournaments.ts
        └── scripts/seed-import/transformers/
```

**Structure Decision**: Keep all work in existing workspace packages and feature documentation. No new backend service, endpoint, database entity, package, or UI framework is needed. The Prisma migration is required because the feature changes the PostgreSQL enum's supported values and converts existing records.

## Rollback and Risk Notes

- **Database migration**: exercise forward migration on a database snapshot before deployment. Ensure `SEASON` values are converted in both tables before the enum is replaced. Rollback must restore the prior enum only after an operator confirms there are no new `SEASON`-free constraints or writes requiring the new version; retain the database backup for recovery.
- **Source CSV alignment**: the spec assigns removal of the source CSV's “Temporada” value to its owner. The checked-in `packages/cms/data/imports` directory currently contains no CSV, so the owner must coordinate the source update; importer mappings in this repository still need to stop producing `SEASON`.
- **Client draft persistence**: session-scoped game-form draft data must be consumed/cleared on return and not restored into an unrelated later game-creation flow.
- **Branch context**: the worktree is currently on `main`; this plan documents the actual branch and does not switch branches or modify source implementation.

## Complexity Tracking

No constitution violations were identified; no exception is requested.
