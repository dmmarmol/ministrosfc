# Implementation Plan: Dropdown with Inline Add-More

**Branch**: `feat/012-dropdown-add-more` | **Date**: 2026-03-30 | **Spec**: `/specs/012-dropdown-add-more/spec.md`
**Input**: Feature specification from `/specs/012-dropdown-add-more/spec.md`

## Summary

Build a reusable frontend dropdown component that supports selecting existing options and launching an inline creation flow from a fixed last entry, while enforcing no-delete behavior. The component will be generic (entity-agnostic), use configurable labels with Spanish defaults, support loading/empty/error states, and be integrated first in game create/edit location inputs.

## Technical Context

**Language/Version**: TypeScript 5.x, Vue 3 (Nuxt 3 app, ESM)
**Primary Dependencies**: Nuxt, Vue, Tailwind CSS, Pinia, Vitest, @vue/test-utils
**Storage**: N/A (UI component; parent owns data-fetch and persistence)
**Testing**: Vitest unit tests in `packages/frontend/tests/components` and targeted manual validation in playground + admin pages
**Target Platform**: Web browsers (desktop + mobile responsive layouts)
**Project Type**: Web application frontend component
**Performance Goals**: Option rendering within 500ms after data availability; search filtering responsive for typical list sizes
**Constraints**: Must keep "Agregar nueva..." as fixed last option; no delete affordance/events/callbacks; all labels configurable with Spanish defaults; close on outside click; entity-agnostic API
**Scale/Scope**: One reusable component, one type contract module, one playground page, two initial page integrations (admin game create/edit)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

- Principle I (Feature-Driven Architecture): PASS. Scope is a discrete UI capability with clear user outcomes.
- Principle II (Spec-First): PASS. Spec is present and sufficiently detailed with stories/requirements.
- Principle III (Plan-Driven): PASS. This plan defines architecture, data model, contracts, and rollout.
- Principle IV (TDD Non-Negotiable): PASS WITH ACTION. Plan defines unit tests as required for all testable behaviors; implementation must execute tests before completion.
- Principle V (Component Isolation/Reusability): PASS. Component API is typed and entity-agnostic.
- Principle VI (Data Flow/State Management): PASS. Parent remains source of truth for async data and creation outcomes.

## Project Structure

### Documentation (this feature)

```text
specs/012-dropdown-add-more/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── dropdown-add-more.contract.md
└── tasks.md
```

### Source Code (repository root)

```text
packages/frontend/
├── src/
│   ├── components/
│   │   └── ui/
│   │       └── DropdownAddMore.vue
│   ├── pages/
│   │   ├── admin/games/create.vue
│   │   ├── admin/games/[id]/edit.vue
│   │   └── playground-dropdown-playground.vue
│   └── types/
│       └── dropdown-add-more.ts
└── tests/
    └── components/
        └── DropdownAddMore.test.ts
```

**Structure Decision**: Use existing web-application frontend structure under `packages/frontend`, keeping reusable UI in `src/components/ui`, contracts/types in `src/types`, and component tests in `tests/components` to align with current repository testing patterns.

## Phase 0: Research Outcomes

- Resolved component contract shape (props/emits/slots + optional fetch callback) and Spanish default-label strategy.
- Resolved state behavior for loading, empty, error, retry, and outside-click close.
- Resolved integration pattern for create/edit game pages and a dedicated playground route.
- Captured testing approach and required behavior coverage.

Reference artifact: `/specs/012-dropdown-add-more/research.md`

## Phase 1: Design Outputs

- Data model for option entities, labels, state machine, and create-flow payloads.
- Interface contract for reusable component API.
- Quickstart with implementation and validation steps.

Reference artifacts:

- `/specs/012-dropdown-add-more/data-model.md`
- `/specs/012-dropdown-add-more/contracts/dropdown-add-more.contract.md`
- `/specs/012-dropdown-add-more/quickstart.md`

## Post-Design Constitution Re-Check

- Principle I (Feature-Driven Architecture): PASS
- Principle II (Spec-First): PASS
- Principle III (Plan-Driven): PASS
- Principle IV (TDD Non-Negotiable): PASS (design defines explicit unit test coverage for component contract and critical behaviors)
- Principle V (Component Isolation/Reusability): PASS
- Principle VI (Data Flow/State Management): PASS

No unjustified violations detected.

## Complexity Tracking

No constitution violations requiring exception handling.
