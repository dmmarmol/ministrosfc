# Implementation Plan: Confirmation Modal

**Branch**: `feat/015-confirmation-modal` | **Date**: 2026-04-13 | **Spec**: [/specs/015-confirmation-modal/spec.md](./spec.md)
**Input**: Feature specification from `/specs/015-confirmation-modal/spec.md`

## Summary

Replace browser `confirm()` prompts across sensitive admin actions with a reusable `ConfirmationModal` built as a wrapper on top of `@nuxt/ui` Modal. Standardize confirmation UX, accessibility, async in-flight/error handling, and focus behavior while preserving existing business outcomes for delete/deactivate/irreversible actions.

## Technical Context

**Language/Version**: TypeScript 5.x, Vue 3, Nuxt 3  
**Primary Dependencies**: Nuxt 3, Tailwind CSS, `@nuxt/ui` (new module), Vitest, Vue Test Utils  
**Storage**: N/A (frontend-only behavior + existing backend endpoints)  
**Testing**: Vitest unit/component tests, existing frontend test suite  
**Target Platform**: Web (admin pages in Nuxt app)  
**Project Type**: Monorepo web application (`packages/frontend`)  
**Performance Goals**: No measurable page-level regressions; modal open/close interactions remain instant in admin UX  
**Constraints**: Preserve existing delete/deactivate outcomes; do not alter backend API contracts; keyboard accessibility required  
**Scale/Scope**: 1 shared UI component, 1 refactor (`PlayerDeleteModal`), 4+ admin pages replacing native `confirm()` usage

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- [x] **Shared types gate (Principle VII)**: No new cross-package types are required. Component prop types remain frontend-local.
- [x] **Page decomposition gate (Principle V)**: No new pages introduced. Existing admin pages get smaller by removing inline `confirm()` logic and reusing modal component.
- [x] **Page meta declaration gate (Principle V)**: No new `pages/` files are introduced; existing pages retain their `definePageMeta` declarations.

## Project Structure

### Documentation (this feature)

```text
specs/015-confirmation-modal/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── confirmation-modal.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/frontend/
├── nuxt.config.ts
├── package.json
├── src/
│   ├── components/
│   │   ├── ui/
│   │   │   └── ConfirmationModal.vue
│   │   └── player/
│   │       └── PlayerDeleteModal.vue
│   └── pages/admin/
│       ├── games/index.vue
│       ├── playgrounds/index.vue
│       ├── teams/index.vue
│       └── tournaments/index.vue
└── tests/
    ├── components/
    │   └── ConfirmationModal.test.ts
    └── unit/
        ├── admin-games-confirmation.test.ts
        ├── admin-teams-confirmation.test.ts
        ├── admin-tournaments-confirmation.test.ts
        ├── admin-playgrounds-confirmation.test.ts
        └── admin-users.test.ts
```

**Structure Decision**: Web-application structure focused on `packages/frontend`; no backend/schema changes.

## Phase 0: Research Output

See [research.md](./research.md) for decisions on:

- `@nuxt/ui` module integration approach in Nuxt 3
- Wrapper contract (controlled open state + callbacks)
- Async confirm failure/disabled behavior
- Scope for replacing existing source `confirm()` calls

## Phase 1: Design Output

- [data-model.md](./data-model.md): UI-state model and modal interaction state machine
- [contracts/confirmation-modal.md](./contracts/confirmation-modal.md): component contract for props/events/callback semantics
- [quickstart.md](./quickstart.md): implementation and validation runbook

## Constitution Check (Post-Design)

- [x] **Shared types gate (Principle VII)**: Still passing; no cross-package contract introduced.
- [x] **Page decomposition gate (Principle V)**: Passing; component extraction increases reuse and lowers page complexity.
- [x] **Page meta declaration gate (Principle V)**: Passing; no new pages created.

## Complexity Tracking

No constitution violations requiring justification.
