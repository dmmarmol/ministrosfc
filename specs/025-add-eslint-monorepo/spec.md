# Feature Specification: ESLint Configuration Across All Packages

**Feature Branch**: `019-add-eslint-monorepo`
**Created**: 2026-04-06
**Status**: Draft

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Root lint command passes clean (Priority: P1)

A developer clones the repo and runs `npm run lint:all` from the root. Today this fails with "ESLint couldn't find a configuration file" for all three packages. After this feature, the command completes without errors on the existing committed codebase.

**Why this priority**: Unblocks CI and every future spec that touches source files. No other lint story can be validated without this baseline working.

**Independent Test**: Run `npm run lint:all` from the monorepo root — all three workspaces must complete with exit code 0 and no reported violations.

**Acceptance Scenarios**:

1. **Given** a clean checkout of `main`, **When** a developer runs `npm run lint:all`, **Then** all three packages (cms, frontend, shared) complete the lint step with exit code 0.
2. **Given** the lint command is run, **When** there are no source file changes, **Then** zero violations are reported across all packages.
3. **Given** a developer introduces a clearly wrong file (e.g., a `.ts` file that uses `var` instead of `const` or has unused variables), **When** lint runs on that file, **Then** the violation is reported as an error or warning, and the exit code is non-zero.

---

### User Story 2 — Each package enforces language-appropriate rules (Priority: P2)

The CMS (TypeScript + Node) and shared (TypeScript) packages flag TypeScript-specific issues. The frontend (Vue 3 + TypeScript + Nuxt) additionally flags Vue Single File Component issues.

**Why this priority**: Without per-technology rules the lint config is cosmetic — it passes but catches nothing meaningful. TypeScript and Vue linting are the primary value drivers for this codebase.

**Independent Test**: Can be validated independently per package: run `npx eslint src` inside each package directory and confirm TypeScript-aware rules fire on a deliberately broken `.ts` file; run `npx eslint src/components` inside frontend and confirm a Vue-specific rule fires on a broken `.vue` file.

**Acceptance Scenarios**:

1. **Given** the `packages/cms` config is active, **When** a `.ts` file contains a TypeScript anti-pattern caught by the installed typescript-eslint ruleset, **Then** lint reports it.
2. **Given** the `packages/shared` config is active, **When** a `.ts` file contains the same anti-pattern, **Then** lint reports it consistently.
3. **Given** the `packages/frontend` config is active, **When** a `.vue` file contains a Vue-specific violation (e.g., missing component name, `v-for` without `key`), **Then** lint reports it.
4. **Given** a `.vue` file in the frontend, **When** the `<script setup lang="ts">` block contains a TypeScript issue, **Then** lint reports it.

---

### User Story 3 — Base rules are shared and consistent across packages (Priority: P3)

The same core TypeScript rules apply uniformly to `cms`, `frontend`, and `shared` without copy-pasting rule sets. A single change to the shared base propagates to all packages.

**Why this priority**: Consistency matters for long-term maintenance but is not a blocker. The project can function with per-package configs that happen to be identical; the shared config is an improvement, not a prerequisite.

**Independent Test**: Identically broken TypeScript code in `packages/cms/src` and `packages/shared/src` produces the same violation message and severity when each package is linted independently.

**Acceptance Scenarios**:

1. **Given** a TypeScript rule is defined in the shared base, **When** the same violation exists in both `packages/cms` and `packages/shared`, **Then** both packages report the same rule ID and severity.
2. **Given** the shared base is updated to change a rule severity, **When** lint re-runs on both cms and shared, **Then** both reflect the new severity without per-package changes.

---

### Edge Cases

- What happens when a file is excluded by `.gitignore` patterns — does the lint command skip it correctly?
- How does the frontend config handle auto-generated files (`.nuxt/`, `.output/`) to avoid false positives?
- When `npm run lint:all` is run and two packages have violations, are both reported or does the first failure abort the run?
- How does the config handle `.js` config files in package roots that should not be linted as project source?

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The `npm run lint:all` command from the monorepo root MUST complete all three workspaces (cms, frontend, shared) without crashing due to missing configuration.
- **FR-002**: Each package MUST have a local ESLint configuration file that specifies which files to lint and which rule sets to apply.
- **FR-003**: The `packages/cms` configuration MUST activate TypeScript-aware linting rules covering at minimum: no unused variables, consistent return types, no explicit `any` (as a warning at minimum).
- **FR-004**: The `packages/shared` configuration MUST apply the same TypeScript rule set as cms.
- **FR-005**: The `packages/frontend` configuration MUST activate both TypeScript-aware rules (at the same level as cms/shared) and Vue 3 Single File Component rules.
- **FR-006**: Auto-generated and build output directories (`node_modules`, `dist`, `.nuxt`, `.output`, `coverage`) MUST be excluded from linting in every package.
- **FR-007**: The existing committed codebase MUST pass lint with zero errors after configurations are applied (warnings are acceptable for gradual adoption).
- **FR-008**: A shared base configuration MUST exist so that common TypeScript rules are defined once and extended by the per-package configs.
- **FR-009**: The frontend package MUST have the necessary ESLint plugins for Vue 3 installed as dev dependencies (if not already present).
- **FR-010**: Test files (`tests/`, `*.test.ts`, `*.spec.ts`) MAY use a relaxed rule set (e.g., allow `any` in test utilities) but MUST still be linted.

### Key Entities

- **ESLint Configuration (per package)**: A file (`.eslintrc.*` or `eslint.config.*`) in each of `packages/cms`, `packages/frontend`, `packages/shared` that activates the correct rule sets for that package's language (TypeScript, TypeScript+Vue).
- **Shared Base Config**: A configuration living in the monorepo root or a dedicated config package, extended by all per-package configs to enforce consistent TypeScript rules.
- **Ignore Patterns**: Per-package exclusion lists that prevent generated files from being linted.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: `npm run lint:all` from the monorepo root exits with code 0 on the committed codebase (zero errors; warnings allowed).
- **SC-002**: `npm run lint` inside `packages/cms` exits with code 0 on the committed `src/` directory.
- **SC-003**: `npm run lint` inside `packages/shared` exits with code 0 on the committed `src/` directory.
- **SC-004**: `npm run lint` inside `packages/frontend` exits with code 0 on the committed `src/` directory and `.vue` files are processed by the Vue plugin (verifiable via `eslint --print-config src/app.vue` showing vue rules).
- **SC-005**: A deliberately invalid `.ts` file (e.g., `const x = 1; export {}` with an unused import) introduced into any package causes `npm run lint` in that package to report at least one violation.
- **SC-006**: The `dist/`, `.nuxt/`, `.output/`, `coverage/`, and `node_modules/` directories produce zero lint output (are excluded).

## Assumptions

- ESLint v8.x is the target version, consistent with the current `"eslint": "^8.56.0"` installed across all packages.
- `@typescript-eslint/eslint-plugin` and `@typescript-eslint/parser` are already installed in `packages/cms` and `packages/shared`; they will be added to `packages/frontend` if not present.
- An appropriate Vue 3 ESLint plugin (e.g., `eslint-plugin-vue`) will be added to `packages/frontend` devDependencies.
- The initial lint pass will surface zero errors using a pragmatic rule set — some rules may be set to `warn` rather than `error` to allow gradual adoption without blocking the build.
- No Prettier integration is in scope (formatting is a separate concern).

## User Scenarios & Testing _(mandatory)_

<!--
  IMPORTANT: User stories should be PRIORITIZED as user journeys ordered by importance.
  Each user story/journey must be INDEPENDENTLY TESTABLE - meaning if you implement just ONE of them,
  you should still have a viable MVP (Minimum Viable Product) that delivers value.

  Assign priorities (P1, P2, P3, etc.) to each story, where P1 is the most critical.
  Think of each story as a standalone slice of functionality that can be:
  - Developed independently
  - Tested independently
  - Deployed independently
  - Demonstrated to users independently
-->

### User Story 1 - [Brief Title] (Priority: P1)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently - e.g., "Can be fully tested by [specific action] and delivers [specific value]"]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]
2. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 2 - [Brief Title] (Priority: P2)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

### User Story 3 - [Brief Title] (Priority: P3)

[Describe this user journey in plain language]

**Why this priority**: [Explain the value and why it has this priority level]

**Independent Test**: [Describe how this can be tested independently]

**Acceptance Scenarios**:

1. **Given** [initial state], **When** [action], **Then** [expected outcome]

---

[Add more user stories as needed, each with an assigned priority]

### Edge Cases

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right edge cases.
-->

- What happens when [boundary condition]?
- How does system handle [error scenario]?

## Requirements _(mandatory)_

<!--
  ACTION REQUIRED: The content in this section represents placeholders.
  Fill them out with the right functional requirements.
-->

### Functional Requirements

- **FR-001**: System MUST [specific capability, e.g., "allow users to create accounts"]
- **FR-002**: System MUST [specific capability, e.g., "validate email addresses"]
- **FR-003**: Users MUST be able to [key interaction, e.g., "reset their password"]
- **FR-004**: System MUST [data requirement, e.g., "persist user preferences"]
- **FR-005**: System MUST [behavior, e.g., "log all security events"]

_Example of marking unclear requirements:_

- **FR-006**: System MUST authenticate users via [NEEDS CLARIFICATION: auth method not specified - email/password, SSO, OAuth?]
- **FR-007**: System MUST retain user data for [NEEDS CLARIFICATION: retention period not specified]

### Key Entities _(include if feature involves data)_

- **[Entity 1]**: [What it represents, key attributes without implementation]
- **[Entity 2]**: [What it represents, relationships to other entities]

## Success Criteria _(mandatory)_

<!--
  ACTION REQUIRED: Define measurable success criteria.
  These must be technology-agnostic and measurable.
-->

### Measurable Outcomes

- **SC-001**: [Measurable metric, e.g., "Users can complete account creation in under 2 minutes"]
- **SC-002**: [Measurable metric, e.g., "System handles 1000 concurrent users without degradation"]
- **SC-003**: [User satisfaction metric, e.g., "90% of users successfully complete primary task on first attempt"]
- **SC-004**: [Business metric, e.g., "Reduce support tickets related to [X] by 50%"]
