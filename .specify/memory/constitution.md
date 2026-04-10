<!--
SYNC IMPACT REPORT
==================
Version change: 1.6.0 → 1.7.0 (MINOR — Principle V amended: Page Component Decomposition added)
Ratified: 2026-03-17
Last Amended: 2026-04-09

Amendment: Principle V (Component Isolation and Reusability) extended with a mandatory
"Page Component Decomposition" sub-rule. Pages in `pages/` are now defined as routing
entry points only. Feature blocks exceeding ~30 lines of template MUST be extracted to
`components/pages/<feature-path>/`. This mirrors the `pages/` path hierarchy.
Applied immediately to Feature 014 pages (signup, public game detail, admin game detail).

Modified sections:
  ✅ Principle V — added "Page Component Decomposition" sub-rule
  ✅ File Organization — added components/pages/ to frontend layout
  ✅ Code Review Standards — new gate: page component decomposition check
  ✅ plan-template.md — Constitution Check bullet added for page decomposition gate

Prior amendments (preserved):
  ✅ v1.6.0 — Principle VII: Shared Types and Cross-Package Contracts
  ✅ v1.5.0 — Branch naming convention updated
  ✅ v1.4.0 — Package version bump prompt
  ✅ v1.3.0 — Speckit Workflow Continuity mandate

Follow-up TODOs:
  - Migrate ProfileData (packages/frontend/src/composables/useProfile.ts)
    into @ministrosfc/shared as the canonical profile response type
  - Replace inline data param type in ProfileService.updateProfile with a
    named type exported from @ministrosfc/shared
  - Gradually backfill existing pages (schedule.vue, roster.vue, etc.) with
    page-scoped sub-components on their next touch
-->

# Ministros FC Constitution

**Version**: 1.7.0 | **Ratified**: 2026-03-17 | **Last Amended**: 2026-04-09

This constitution establishes the architectural principles, development workflows, and governance rules for the Ministros FC platform—an amateur football team management system. It serves as the authoritative source of truth for all engineering decisions.

## Core Principles

### I. Feature-Driven Architecture

**MUST** start every feature as a discrete, well-scoped unit with clear user impact.

- Features represent changes users or administrators observe directly
- Each feature includes specification, design plan, and actionable task list
- Features are never partial or "WIP" when merged to main
- Feature scope is defined before implementation begins; scope creep requires a new feature

**Context:** Clear scope prevents rework, enables accurate planning, and provides team alignment.

**Examples:**

- ✅ Good: "Team roster management: add/edit/remove players with confirmation"
- ❌ Bad: "Start implementing database stuff"

**Enforcement:** Code review verification, spec-first workflow via Speckit templates

---

### II. Specification Before Implementation (SPEC-FIRST)

**MUST NOT** begin coding without an approved feature specification (spec.md).

- Specifications are written using the standard spec-template.md
- Specifications clearly define user stories, acceptance criteria, and scope boundaries
- Technical questions must be clarified before development starts
- Spec approval gates all task generation and implementation

**Context:** Specification prevents ambiguity, aligns stakeholders, and provides a contract between design and implementation.

**Examples:**

- ✅ Good: Complete spec with user stories, acceptance criteria, edge cases documented before any code
- ❌ Bad: Starting code after a Slack discussion about requirements

**Enforcement:** GitHub Actions CI check, PR template requirement, mandatory Speckit workflow

---

### III. Plan-Driven Implementation (NON-NEGOTIABLE)

**MUST** create a detailed implementation plan (plan.md) from the specification.

- Plans are created using the standard plan-template.md
- Plans include design decisions, technical architecture, and data models
- Plans identify dependencies, risks, and rollback procedures
- Plans are reviewed and approved before task generation

**Context:** Planning surfaces technical issues early, prevents rework, and enables accurate effort estimation.

**Examples:**

- ✅ Good: Plan includes API design, database schema changes, component hierarchy, state management strategy
- ❌ Bad: "We'll figure out the API as we go"

**Enforcement:** Plan review checklist, architectural decision sections, plan completeness gates

---

### IV. Test-Driven Quality Gates (NON-NEGOTIABLE)

**MUST** follow Test-Driven Development (TDD) for all testable code.

- Tests are written BEFORE implementation begins (red-green-refactor cycle)
- Unit tests cover business logic; integration tests cover user-facing workflows
- Test coverage MUST meet or exceed 80% for new code
- All tests MUST pass before code review; no "fix later" pending tests
- Acceptance criteria from spec translate directly to test cases

**Context:** TDD ensures code correctness, provides executable documentation, and enables refactoring confidence.

**Examples:**

- ✅ Good: Write failing test for "user can add player to roster" → implement feature → test passes
- ❌ Bad: Implement feature, add tests as afterthought, skip flaky tests in CI

**Enforcement:** Pre-commit hooks, CI pipeline test gates, code coverage reporting, PR template checklists

---

### V. Component Isolation and Reusability

**MUST** follow a structured component organization with clear responsibility boundaries.

- Components are single-responsibility: one feature per component, one purpose per utility
- Shared logic is extracted to dedicated utility modules (e.g., `utils/`, `services/`)
- Props/parameters are typed explicitly (TypeScript interfaces required)
- No circular dependencies; dependency direction flows from leaf components upward
- Component naming is descriptive and matches behavior (not generic names like "Container" or "Manager")

#### Page Component Decomposition (NON-NEGOTIABLE)

**MUST NOT** write large template blocks directly inside `pages/` files.

- A `pages/` file is a **routing entry point only**: it handles `definePageMeta`,
  top-level `useAsyncData` / `await`, `useHead`, high-level layout wiring, and
  composable injection. It MUST NOT double as a component tree.
- Any template block that represents a named feature area **OR** exceeds ~30 lines
  MUST be extracted to a dedicated sub-component.
- Page-scoped sub-components live under `components/pages/<feature-path>/`
  (mirroring the `pages/` directory hierarchy). They are not required to be
  reusable outside their page context—cohesion over premature generalization.
- State that is local to a sub-component (e.g., form toggle flags, search results)
  MUST live inside that component; only cross-component state belongs on the page.
- Examples of mandatory extractions: game header card, signup form, inline search
  panel, participant table, roster section.

**Context:** Over-loaded page files conflate routing concerns with UI rendering.
Extracting feature blocks improves readability, enables isolated unit tests per
block, and makes the page file a scannable table-of-contents for the feature.

**Examples:**

- ✅ Good: `pages/games/[slug]/signup.vue` contains only setup + composable injection;
  feature blocks live in `components/pages/games/signup/SignupGuestForm.vue`, etc.
- ❌ Bad: `pages/games/[slug]/signup.vue` with 400+ lines of mixed template + logic
- ✅ Good: `PlayerCard.tsx` (single player display), `RosterForm.tsx` (add/edit multiple players)
- ❌ Bad: `PlayerStuff.tsx`, `Utils.tsx` (too generic), bidirectional imports

**Enforcement:** ESLint rules (import analysis), code review checks, TypeScript strict mode,
page-decomposition gate in plan-template.md Constitution Check

---

### VI. Data Flow and State Management

**MUST** follow unidirectional data flow with explicit state ownership.

- Server-side state (DB) is the source of truth; UI state is derived
- UI state changes MUST trigger server synchronization before acknowledging user actions
- Caching strategies are explicit and documented with invalidation rules
- State mutations follow immutability principles (no in-place edits)
- Loading, error, and success states are handled explicitly—no "maybe it's undefined" patterns

**Context:** Clear data flow prevents race conditions, simplifies debugging, and ensures consistency.

**Examples:**

- ✅ Good: User submits form → validate locally → POST to API → wait for response → update UI → show success
- ❌ Bad: Update UI optimistically, hope the API succeeds later, silently fail on errors

**Enforcement:** TypeScript strict types, code review audits, integration test coverage

---

### VII. Shared Types and Cross-Package Contracts

**MUST** define all types shared between workspace packages in `packages/shared/src/types/` and import them via `@ministrosfc/shared`.

- Any interface, enum, or type alias consumed by more than one package (`packages/cms`, `packages/frontend`, etc.) MUST originate in `@ministrosfc/shared`
- Local package types that grow to be used by another package MUST be migrated to `@ministrosfc/shared` before the feature spec is closed
- Frontend composables MUST NOT re-declare types already exported from `@ministrosfc/shared`
- CMS services MUST NOT inline domain enums (e.g., `PlayerStatus`, `PlayerType`, `Position`) — import from `@ministrosfc/shared`
- API response shapes used by both `packages/cms` route handlers and `packages/frontend` composables MUST have a named type in `@ministrosfc/shared`
- `@TODO` comments citing type-sync debt are treated as P1 issues and MUST be resolved before the feature spec is closed
- `Record<string, unknown>` is acceptable only inside a single service method as a transient intermediate; returning or accepting it across module boundaries is forbidden

**Rationale:** Duplicated type definitions create silent drift. The `ProfileData` interface in `useProfile.ts` and the inline `data` parameter of `ProfileService.updateProfile` are currently separate, requiring manual synchronisation on every field change. Centralizing in `@ministrosfc/shared` gives TypeScript end-to-end contract verification across the monorepo at compile time.

**Examples:**

- ✅ Good: `export interface PlayerProfileData { ... }` in `packages/shared/src/types/api.ts`; imported in both the CMS route response and the frontend composable
- ❌ Bad: `interface ProfileData { ... }` duplicated inside `packages/frontend/src/composables/useProfile.ts` alongside an unnamed inline type in `ProfileService.ts`

**Enforcement:** TypeScript project references (`tsconfig.json`), ESLint `no-restricted-imports` rule (future), code review gate, @TODO resolution required before spec close

---

## Development Stack and Constraints

### Technology Standards

- **Runtime**: Node.js (latest LTS, minimum v18)
- **Language**: TypeScript (strict mode MANDATORY)
- **Package Manager**: npm (pinned versions in package-lock.json)
- **Testing**: Vitest (unit/integration in `packages/frontend`; preferred in `packages/cms`), Playwright (E2E)
- **Code Quality**: ESLint, Prettier (enforced in pre-commit hooks)
- **Version Control**: Git with conventional commits

### Dependency Management

- **MUST NOT** add major dependencies without architectural review
- **MUST** document rationale for any new external package in a comment near the dependency
- **MUST** keep dependencies up-to-date; quarterly security audits required
- **MUST NOT** use deprecated or unmaintained packages
- Monorepo-safe practices: no global, workspace-only dependencies

### File Organization

```
ministrosfc/
├── src/
│   ├── features/        # Feature-specific code
│   │   ├── roster/      # Example: player roster management
│   │   │   ├── components/
│   │   │   ├── services/
│   │   │   ├── types/
│   │   │   └── __tests__/
│   │   └── ...
│   ├── shared/          # Shared utilities, types, components
│   │   ├── components/
│   │   ├── utils/
│   │   ├── hooks/
│   │   └── types/
│   ├── services/        # API clients, external integrations
│   ├── styles/          # Global styles
│   └── index.ts
├── tests/               # E2E and integration tests
├── public/              # Static assets
├── docs/                # Documentation
└── .specify/            # Speckit templates and governance
```

For `packages/frontend` (Nuxt 3, `srcDir: "src/"`):

```
packages/frontend/
├── src/
│   ├── pages/           # Routing entry points only (definePageMeta, useAsyncData, useHead)
│   ├── components/
│   │   ├── pages/       # Page-scoped sub-components (mirrors pages/ hierarchy)
│   │   │   ├── games/   # Sub-components for pages/games/
│   │   │   │   └── signup/   # Sub-components for pages/games/[slug]/signup.vue
│   │   │   └── admin/   # Sub-components for pages/admin/
│   │   ├── game/        # Reusable game display components
│   │   ├── player/      # Reusable player display components
│   │   ├── common/      # Layout chrome (Header, Footer, Navigation)
│   │   └── ui/          # Generic UI primitives
│   ├── composables/     # Reactive state + API wrappers
│   └── utils/           # Pure functions and constants
└── server/              # Nuxt server routes and middleware (outside srcDir)
    ├── middleware/
    └── routes/
```

### Naming Conventions

- **Components**: PascalCase (`PlayerCard.tsx`, `RosterForm.tsx`)
- **Functions/utilities**: camelCase (`formatTeamData()`, `validateEmail()`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_PLAYERS_PER_TEAM`, `API_TIMEOUT_MS`)
- **Import paths**: absolute (using `baseUrl` in tsconfig.json)
- **Database entities**: singular PascalCase (`Player`, `Team`, not `Players`, `Teams`)
- **Routes/URLs**: kebab-case (`/player-roster`, `/match-schedule`, not /playerRoster)

---

## Development Workflow

### Feature Development Lifecycle

1. **Specification Phase**
   - Write feature spec using spec-template.md
   - Get stakeholder approval on acceptance criteria
   - Clarify ambiguities using Speckit clarify agent if needed
   - Commit spec to feature branch

2. **Planning Phase**
   - Create implementation plan (plan.md)
   - Document architecture decisions (APIs, database changes, etc.)
   - Identify dependencies and risks
   - Get architecture review approval

3. **Task Generation**
   - Generate actionable tasks from plan using Speckit tasks agent
   - Order tasks by dependency
   - Estimate effort and assign
   - Tasks MUST be atomic and independently reviewable

4. **Implementation**
   - Create tests first (TDD)
   - Implement feature to make tests pass
   - Run full test suite locally before pushing
   - Keep commits atomic and descriptive

5. **Code Review**
   - Verify all tests passing in CI
   - Check TypeScript compilation with no errors
   - Ensure spec acceptance criteria match implementation
   - Verify naming conventions and file organization
   - At least one approval required before merge

6. **Merge and Deploy**
   - Squash merge to main (one commit per feature)
   - Verify deployment in staging
   - Tag release version for production
   - Update CHANGELOG

### Speckit Workflow Continuity

**MUST** output a **Next Steps** recommendation at the end of every speckit agent run.

- Every speckit command MUST conclude with a clearly labelled `## Next Steps` block visible to the user.
- The block MUST name the recommended next speckit command (e.g., `/speckit.plan`) and explain why it
  is the appropriate action given the current artifact state.
- If multiple paths are valid (e.g., run `/speckit.clarify` to tighten scope vs. proceed
  directly to `/speckit.plan`), the agent MUST indicate which is recommended and why.
- If no further speckit step is needed (e.g., after `/speckit.implement` on a completed feature),
  the agent MUST state that explicitly and suggest a non-speckit follow-up (e.g., open a PR,
  run E2E tests, tag a release).
- The recommendation MUST be based on the actual state of the feature artifacts, not be generic.

**Canonical command sequence and typical next-step mapping:**

| Current command         | Typical next command                            | When to deviate                                    |
| ----------------------- | ----------------------------------------------- | -------------------------------------------------- |
| `speckit.specify`       | `speckit.clarify` or `speckit.plan`             | Skip clarify only if spec is unambiguous           |
| `speckit.clarify`       | `speckit.plan`                                  | Re-run clarify if outstanding gaps remain          |
| `speckit.plan`          | `speckit.tasks`                                 | Run `speckit.analyze` first if design is uncertain |
| `speckit.tasks`         | `speckit.analyze` then `speckit.implement`      | Skip analyze only for trivial task sets            |
| `speckit.analyze`       | `speckit.implement` (if clean) or fix artifacts | Fix HIGH findings before implementing              |
| `speckit.implement`     | PR / merge / tag release                        | Re-run `speckit.analyze` if new issues arise       |
| `speckit.checklist`     | Whichever command surfaces the gap              | Context-dependent                                  |
| `speckit.constitution`  | Update affected templates / commit              | Cascade spec/plan/tasks if principles changed      |
| `speckit.taskstoissues` | Project management / sprint planning            | N/A                                                |

**Context:** Without explicit guidance the caller must infer the next step from sparse output, which
creates friction and invites workflow mistakes. A mandatory recommendation eliminates that ambiguity.

**Enforcement:** Agent file review during constitution amendments; treat missing Next Steps block as
a constitution violation in PR reviews.

---

### Package Version Management

**MUST** prompt the user to bump the root `package.json` version when a feature specification is completed.

- After `/speckit.specify` finishes writing and validating `spec.md`, the agent MUST ask the user:
  > "Feature spec complete. Choose a version bump for `package.json` (current: X.Y.Z):
  > **A) Minor** (X.Y+1.0) — new feature or capability
  > **B) Patch** (X.Y.Z+1) — improvement, fix, or refinement
  > **C) Skip** — do not bump version now"
- If the user chooses A or B, the agent MUST update the `version` field in the **root** `package.json`
  and commit the change together with the spec (or as a follow-up commit on the same branch).
- If the user chooses C (skip), no version change is made. The user may bump manually later.
- The bump applies only to the root `package.json`. Workspace package versions
  (`packages/cms/package.json`, `packages/frontend/package.json`, etc.) are NOT modified
  automatically—they follow their own release cadence.
- MAJOR version bumps are excluded from this prompt; they require a constitution-level
  amendment discussion per §Governance.

**Context:** Tying version increments to spec creation ensures every feature is traceable to a
version number. Without a prompt, versions stagnate and lose meaning.

**Enforcement:** `speckit.specify` agent file includes the prompt; constitution review checks
for compliance.

---

### Git and Commit Conventions

**Branch naming:**

```
{type}/{spec_number}-{spec_name}
```

Where `{spec_number}` is the zero-padded spec directory number (e.g., `009`) and
`{spec_name}` is the kebab-case spec directory suffix (e.g., `user-registration`).

Allowed types:

| Prefix     | Purpose                            |
| ---------- | ---------------------------------- |
| `feat/`    | New features                       |
| `fix/`     | Bug fixes                          |
| `chore/`   | Build, deps, tooling, housekeeping |
| `release/` | Release preparation branches       |

Examples:

```
feat/009-user-registration
fix/005-auth-ssr-redirect
chore/008-rename-specs-branches
release/1.0.0
```

> `release/` branches use a semver tag instead of a spec number because they
> span multiple specs.

**MUST NOT** create branches that omit the spec number prefix (except `main`
and `release/*` branches).

**Commit messages (conventional commits):**

```
feat(roster): add player to team roster with validation
fix(auth): resolve token expiration race condition
docs(contributing): update deployment procedures
refactor(api): consolidate player endpoints
chore(deps): upgrade typescript to 5.x
```

**MUST NOT** commit:

- Unfinished features (use feature flags if necessary)
- Disabled tests or skipped tests in main
- Console.log() statements (use proper logging)
- Secrets or credentials
- Commented-out code (delete or explain in commit message)

### Code Review Standards

**MUST verify in every PR:**

- [ ] Spec and plan exist and are reviewed
- [ ] All tests passing in CI
- [ ] No regressions in other features
- [ ] TypeScript compiles with no errors
- [ ] Naming conventions followed
- [ ] New code has adequate tests
- [ ] Breaking changes are documented
- [ ] CHANGELOG updated if user-facing
- [ ] Types used by more than one package are defined in `@ministrosfc/shared`, not duplicated locally
- [ ] **Page decomposition (Principle V)**: No `pages/` file contains inline template blocks exceeding ~30 lines; feature areas extracted to `components/pages/<feature-path>/`

**Review focus areas:**

- Does implementation match specification?
- Are error cases handled explicitly?
- Are performance implications considered?
- Are type annotations clear and complete?
- Are functions/components single-responsibility?

---

## Quality and Testing Standards

### Test Coverage Requirements

- **New features**: Minimum 80% code coverage
- **Bug fixes**: Tests demonstrating the bug and the fix
- **Refactors**: Same coverage as original code
- **Shared utilities**: 100% coverage (shared code breaks multiple features)

### Test Organization

```
feature/
├── components/
│   ├── PlayerCard.tsx
│   └── __tests__/
│       └── PlayerCard.test.tsx     # Unit tests
├── services/
│   ├── rosterService.ts
│   └── __tests__/
│       └── rosterService.test.ts
└── __tests__/
    └── roster.integration.test.ts    # Feature integration tests
```

### Test Types and Responsibilities

- **Unit tests**: Individual functions, components, pure logic
- **Integration tests**: Feature workflows, API interactions, data flow
- **E2E tests** (Playwright): User-facing scenarios, multi-step workflows
- **Snapshot tests**: Sparingly, only for stable UI structures; require explicit reviews

### Testing Tooling and Conventions

- **MUST** use **Vitest** as the test runner in `packages/frontend`.
- **SHOULD** use **Vitest** in `packages/cms`. Jest remains acceptable until a migration is feasible; any
  new CMS test file MUST prefer Vitest if the suite has already been migrated.
- **MUST** write explicit imports in every Nuxt-related file (components, composables, pages, plugins),
  even when `nuxt.config.ts` auto-imports are enabled. Explicit imports ensure test mocking works
  correctly and prevent missing IntelliSense references during refactoring.
- **MUST** annotate unit test mock objects with explicit TypeScript types. `vi.fn()` / `jest.fn()`
  wrappers MUST carry the correct function signature; stub objects MUST satisfy the matching
  interface or type alias (no `as any` escape hatches in test setup code).
- **MUST** use the `useRuntime()` composable (`src/composables/useRuntime.ts`) instead of
  `import.meta.client` or `import.meta.server` anywhere in `packages/frontend` source code
  (stores, components, composables, plugins). Direct access to these Vite meta fields is only
  permitted inside the `useRuntime` composable itself. This ensures test suites can mock the
  runtime environment via `vi.mock('~/composables/useRuntime')` without patching import.meta.

---

### Performance Standards

- [TODO]: Define performance benchmarks (page load time, API response time, etc.)
- [TODO]: Define monitoring and alerting thresholds

---

## Governance

### Constitution Authority

This constitution supersedes all other documentation, conventions, and practices. In conflicts:

1. Constitution takes precedence
2. Amendments require the process outlined below
3. Questions are resolved via code review and architect consensus

### Amendment Process

**Version Bumping Rules:**

- **MAJOR** (X.0.0): Breaking changes to existing principles or workflow removal
- **MINOR** (0.X.0): New principles, new constraints, expanded scope
- **PATCH** (0.0.X): Clarifications, example improvements, typo fixes

**Amendment Steps:**

1. Propose amendment (spec document with rationale)
2. Discussion and consensus with team (in PR)
3. Update constitution with new version and SYNC IMPACT REPORT
4. Update affected templates (spec, plan, tasks)
5. Document migration plan for existing features if needed
6. Merge to main with descriptive commit message

**Amendment commit example:**

```
docs: amend constitution to v1.1.0 (add performance standards principle)

- Added VI. Performance and Optimization principle
- Updated tasks-template.md with performance review checklist
- Related: #123 (performance baseline discussion)
```

### Compliance Verification

**Quarterly reviews:** First week of each quarter

- Audit recent PRs for constitution violations
- Document patterns and improvements
- Propose amendments if needed

**Breaking Change Approval:** Requires unanimous team agreement

- Cannot add new NON-NEGOTIABLE principles without consensus
- Cannot remove existing principles without migration plan
- Must provide 2-week advance notice

**Source of Truth Hierarchy:**

1. Constitution (.specify/memory/constitution.md) — final authority
2. Feature Specs (spec.md) — detailed requirements
3. Implementation Plans (plan.md) — technical design
4. Code Review — enforcement
5. Tests & CI — automated verification

### Conflict Resolution

**When principles conflict:**

1. Constitution supersedes all practices
2. If constitution is unclear, raise an issue
3. Amendment proposal required if constitution needs clarification
4. Architect decides interpretation pending amendment

---

## Runtime Development Guidance

For detailed development guidance, workflows, and tool-specific practices, see:

- `.instructions.md` — IDE setup and workflow
- `docs/` — Architecture, API design, database schema
- `.specify/templates/` — Template guidance for specs, plans, and tasks

---

**Maintained by**: Project constitutional governance process  
**Next Review**: 2026-06-17 (quarterly)  
**Questions/Proposals**: Create an issue with tag `[constitution]`
