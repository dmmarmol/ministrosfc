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

## Decision 6: Use vue-select@beta as the underlying dropdown engine

- Decision: `DropdownAddMore.vue` wraps `vue-select@beta` (v4.x) rather than being built from scratch.
- Rationale: vue-select provides all base dropdown behaviours (open/close, outside-click, keyboard navigation, search/filter, loading state, empty-state slot, modal positioning via `appendToBody`) for free, reducing implementation scope from ~30 tasks to ~15. It has zero dependencies, MIT licence, and ~20 KB.
- Alternatives considered:
  - Build from scratch: rejected — unjustified complexity given a well-maintained library covers the exact requirements.
  - `vue-select` stable v3.x: rejected — Vue 2 only; incompatible with Nuxt 4 / Vue 3.
  - Headless UI / Radix Vue: rejected — opinionated styling overhead; vue-select's default CSS is easier to override with Tailwind custom properties.

## Decision 7: Installation and CSS import strategy

- Decision: Install `vue-select@beta` in `packages/frontend`. Import `vue-select/dist/vue-select.css` globally via the `css` array in `nuxt.config.ts`. Register `VueSelect` as a component locally inside `DropdownAddMore.vue` (not as a global Nuxt plugin).
- Rationale: Local registration keeps the bundle split clean and makes the dependency visible at the usage site. Global CSS import is consistent with the Leaflet pattern already used.
- Alternatives considered:
  - Nuxt plugin registration: rejected — no benefit when used in a single wrapper component.
  - SCSS import instead of compiled CSS: rejected — extra build configuration without clear gain.

## Decision 8: "Agregar nueva…" footer via list-footer slot

- Decision: Render the fixed "Agregar nueva…" button and inline creation mini-form inside vue-select's `list-footer` slot.
- Rationale: `list-footer` is always visible regardless of search state or scroll position, and is visually sticky at the bottom of the dropdown panel — exactly what the spec requires. The slot receives no props, keeping the implementation simple.
- Alternatives considered:
  - Inject footer as a fake option (`{ id: '__add_new__', label: '...' }`): rejected — requires special-casing in `onSelect`, pollutes option type, and disappears when search filters it out.
  - Portal-based separate overlay: rejected — unnecessary complexity; `appendToBody` + vue-select's own positioning is sufficient.

## Decision 9: Inline creation success handshake

- Decision: The `list-footer` slot renders a local `open_create` boolean (reactive ref in the wrapper). On submit, the wrapper calls the parent's creation handler (passed as a prop callback `onCreate: (payload) => Promise<DropdownOption>`), awaits the result, appends the `DropdownOption` to the internal working copy of `options`, and sets `modelValue` to the new option's `id`. The dropdown then closes.
- Rationale: Keeps the parent in control of domain logic (entity creation, API call) while the wrapper handles the selection side-effect automatically. This is the clearest separation of concerns.
- Alternatives considered:
  - Emit `submit-create` and wait for parent to set `modelValue` externally: rejected — creates a race condition where the dropdown may not close cleanly if the parent delays.
  - Two-way sync via shared reactive store: rejected — over-engineered for a UI component.

## Decision 10: Integration target — replace PlaygroundSelect.vue

- Decision: Replace `packages/frontend/src/components/PlaygroundSelect.vue` (a hand-rolled version of the same pattern) with `DropdownAddMore.vue` as the primary real-world integration target. Apply to both `admin/games/create.vue` and `admin/games/[id]/edit.vue`.
- Rationale: `PlaygroundSelect.vue` is the exact problem this component solves. Replacing it (a) validates re-usability (SC-005), (b) eliminates duplicate code, and (c) provides a real-world usage example for future adopters.
- Alternatives considered:
  - Create a new showcase page only: rejected — does not eliminate existing duplication and defers real integration risk.
  - Keep PlaygroundSelect.vue as-is: rejected — leaves technical debt and misses validation opportunity.
