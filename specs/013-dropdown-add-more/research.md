# Research: Dropdown with Inline Add-More

## Decision 1: Component API uses typed props/emits with optional fetch callback

- Decision: Use a generic TypeScript contract with `options`, `modelValue`, state props (`loading`, `error`), configurable labels, explicit emits (`select`, `request-create-open`, `submit-create`, `cancel-create`, `retry`, `update:modelValue`), and optional `fetchOptions(query?)` callback.
- Rationale: Keeps component reusable and entity-agnostic (FR-014), supports parent-managed state flow, and satisfies explicit fetch support requirement (FR-002).
- Alternatives considered:
  - Event-only fetch (`request-fetch`) without callback: rejected because spec explicitly requires fetch-function support.
  - Hardcoded entity-specific props (e.g., `playgrounds`): rejected because it breaks reuse.

## Decision 2: Spanish defaults with overridable labels

- Decision: Provide Spanish defaults for add-new, empty, no-results, loading, and retry copy; allow parent override for all labels.
- Rationale: Aligns with product language assumptions and FR-015 while preserving flexibility.
- Alternatives considered:
  - Hardcoded labels only: rejected because FR-015 requires configurability.
  - Full i18n integration now: rejected as out of scope for this feature.

## Decision 3: State handling and no-delete guarantee

- Decision: Define explicit UI states (closed, open-list, open-create, loading, empty, error) and guarantee no delete action/event/callback in the component contract.
- Rationale: Makes behavior deterministic across stories and enforces FR-006.
- Alternatives considered:
  - Implicit state from scattered booleans only: rejected due to increased edge-case risk.
  - Generic action menus including delete: rejected by scope and FR-006.

## Decision 4: Integration-first targets and developer sandbox

- Decision: Validate reusability by integrating into `admin/games/create.vue` and `admin/games/[id]/edit.vue`, and provide a dedicated playground route for state checks.
- Rationale: Covers SC-005 and reduces risk before broader adoption.
- Alternatives considered:
  - Integrate in one page only: rejected because it does not demonstrate cross-context reuse.
  - Skip playground route: rejected because it reduces fast manual verification for edge states.

## Decision 5: Testing strategy

- Decision: Add Vitest unit coverage for behaviors across US1-US4, including fetch callback and retry behavior, plus no-delete assertions.
- Rationale: Constitution principle IV requires TDD-quality gates and >=80% coverage for new testable behavior.
- Alternatives considered:
  - Manual checks only: rejected as insufficient for regression safety.
  - E2E-only coverage: rejected because component contract semantics are best protected with unit tests.
