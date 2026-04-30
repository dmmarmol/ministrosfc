# Implementation Plan: Frontend Dependency Upgrade Baseline

**Branch**: `chore/020-upgrade-nuxt-ui-tailwind` | **Date**: 2026-04-28 | **Spec**: `/specs/020-upgrade-nuxt-ui-tailwind/spec.md`
**Input**: Feature specification from `/specs/020-upgrade-nuxt-ui-tailwind/spec.md`

## Summary

Upgrade the frontend dependency baseline to the latest stable versions of Nuxt, Nuxt UI, and Tailwind (locked at branch creation), while preserving existing behavior through strict automated test gates. Use a staged rollout fallback only when compatibility blocks a full simultaneous upgrade, with blocker documentation and mandatory follow-up tracking.

## Technical Context

**Language/Version**: TypeScript 5.3.x; Vue 3; Node.js >=23; npm >=10  
**Primary Dependencies**: Nuxt, @nuxt/ui, @nuxtjs/tailwindcss + tailwindcss, Vue, Pinia  
**Storage**: N/A for this feature (no data model persistence changes)  
**Testing**: Vitest (frontend unit/integration), Playwright (frontend e2e)  
**Target Platform**: Web app (Nuxt SSR/client), Node.js runtime for build/test  
**Project Type**: Monorepo web application (frontend + backend + shared package)  
**Performance Goals**: No regression to current user-visible responsiveness; build/test pipeline remains green  
**Constraints**: Zero new frontend automated test failures; frontend test suite must be green before and after each upgrade wave; scope limited to compatibility updates only  
**Scale/Scope**: Affects `packages/frontend` dependency graph and related compatibility fixes only

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Shared types gate (Principle VII)**: No new shared cross-package domain types are introduced by this upgrade feature.
- [x] **Page decomposition gate (Principle V)**: No new frontend pages are introduced; no new page template decomposition required.
- [x] **Page meta declaration gate (Principle V)**: No new `pages/` files are introduced; no new `definePageMeta` declarations required.

Post-design re-check: PASS. Phase 1 artifacts do not introduce new pages or shared domain types.

## Project Structure

### Documentation (this feature)

```text
specs/020-upgrade-nuxt-ui-tailwind/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── upgrade-validation-contract.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/
├── frontend/
│   ├── src/
│   ├── tests/
│   ├── nuxt.config.ts
│   ├── package.json
│   └── tailwind.config.js
├── cms/
│   ├── src/
│   ├── tests/
│   └── package.json
└── shared/
    └── src/types/

package.json
```

**Structure Decision**: Keep the existing monorepo structure unchanged. Perform dependency and compatibility updates in `packages/frontend` only, and use frontend test commands as the release evidence source.

## Complexity Tracking

No constitution violations requiring justification.
