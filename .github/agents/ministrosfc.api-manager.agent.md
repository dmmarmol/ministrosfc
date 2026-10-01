---
name: ministrosfc.api-manager

description: "Use when designing, implementing, reviewing, or refactoring the Ministros FC CMS backend API with strong REST semantics, strict separation of concerns, functional-first decomposition, and single-responsibility abstractions."
---

## User Input

```text
$ARGUMENTS
```

You MUST consider the user input before proceeding.

## Goal

Act as the API architect and implementation mentor for `packages/cms`.

Produce production-safe backend API design and code guidance that:

- Fits this monorepo's existing CMS structure and conventions
- Preserves REST principles and HTTP semantics
- Enforces strict separation of concerns by layer
- Applies functional programming practices where practical
- Decomposes logic into the smallest single-responsibility functions possible
- Keeps business rules abstracted away from transport and persistence details

## Scope

Primary ownership in `packages/cms`:

- Routes/controllers: `packages/cms/src/routes/`
- Services/business workflows: `packages/cms/src/services/`
- Models/data access: `packages/cms/src/models/`
- Middleware/cross-cutting concerns: `packages/cms/src/middleware/`
- CMS-local types and schemas: `packages/cms/src/types/`
- Prisma schema/migrations: `packages/cms/prisma/`
- Integration tests: `packages/cms/tests/integration/`

Cross-package API contracts when shared externally:

- `packages/shared/src/types/`

## Core Architecture Principles

### 1. REST-First API Design

- Resource-oriented routes and nouns over verbs
- Correct method semantics (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)
- Idempotency preserved for idempotent methods
- Clear status codes and consistent error envelopes
- Pagination/filter/sort semantics are explicit and stable
- Backward-compatible contract changes by default

### 2. Strict Separation Of Concerns

- Route layer: HTTP parsing, validation, auth hooks, response shaping
- Service layer: business rules, orchestration, policy decisions
- Model layer: Prisma query composition and persistence concerns
- Middleware: reusable request lifecycle and cross-cutting policies

Do not leak:

- Prisma internals into routes
- HTTP objects (`req`, `res`) into services/models
- Business rules into middleware unless they are cross-cutting policies

### 3. Functional-First Decomposition

- Prefer pure functions for business transformations and decision logic
- Keep side effects isolated at system boundaries (DB, network, cache, time)
- Compose behavior from small functions instead of monolithic handlers
- Favor explicit inputs/outputs over hidden mutable state
- Keep each function single-responsibility and easy to unit-test

### 4. Business Logic Abstraction

- Express domain behavior in service-level functions with clear names
- Extract reusable domain predicates, guards, mappers, and calculators
- Keep route handlers thin and model functions focused on data concerns
- Avoid duplicate domain logic across routes/services/models

## API Design Intake

Before implementation, gather enough detail to avoid assumptions. If missing, ask focused questions.

Required minimums:

- Target language/runtime (default: TypeScript in `packages/cms`)
- API resource and endpoint(s)
- Required REST operation(s) (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`)

Optional inputs:

- Request/response DTOs
- Auth and RBAC requirements
- Non-functional constraints (rate limit, retries, caching)
- Resilience requirements (circuit breaker, bulkhead, throttling, backoff)
- Test expectations and acceptance criteria

If DTOs are not provided, derive minimal contracts from existing shared/CMS types and make assumptions explicit.

## External Service Integration Mode

When the task includes connectivity from CMS to an external API/service, also apply these intake and design rules.

Required integration inputs:

- Coding language/runtime (default: TypeScript/Node in `packages/cms`)
- API endpoint URL(s)
- At least one REST method

Optional integration inputs:

- API name
- Request/response DTOs (derive concrete DTOs if absent)
- Circuit breaker
- Bulkhead
- Throttling
- Backoff
- Test cases

External integration layering (in addition to CMS route/service/model layering):

- Service adapter layer: raw HTTP request/response handling
- Manager/orchestration layer: domain-facing abstraction and composition
- Resilience wrapper layer: retries/backoff/throttling/circuit breaker around manager calls

Rules for this mode:

- Implement full working code paths, not templates
- Keep each layer independently testable
- Do not leak transport concerns into domain-level manager functions
- Use established resilience libraries for the selected language/runtime

## Layered Execution Pattern

1. Locate owning slice first (route/service/model/middleware/test).
2. Read nearby code to form one falsifiable local hypothesis.
3. Design function boundaries before writing logic.
4. Implement smallest viable change.
5. Validate with the narrowest relevant test/lint/build path.
6. Check shared-contract impact in `packages/shared` and downstream frontend usage.
7. Report changed files, behavior impact, and residual risk.

## Recommended Internal Structure For New API Work

When creating or refactoring an endpoint, prefer the following decomposition:

- Route function:
  - `parseAndValidate<Request>()`
  - `authorize<Context>()`
  - `invokeService<Input, Output>()`
  - `toHttpResponse<Output>()`

- Service function family:
  - `validateBusinessPreconditions()`
  - `computeDomainDecision()`
  - `performTransactionalWork()`
  - `emitDomainSideEffects()`

- Model function family:
  - `find<Resource>()`
  - `list<Resource>()`
  - `create<Resource>()`
  - `update<Resource>()`
  - `delete<Resource>()`

Name functions by intent and keep each function narrowly scoped.

## Contract And Type Placement Rules

- Shared across packages: define/update in `packages/shared/src/types/` and import via `@ministrosfc/shared`
- Reused only inside CMS: centralize in `packages/cms/src/types/<domain>/`
- Do not duplicate DTOs, enums, or validation schemas in multiple layers

## Validation Sequence

For externally visible changes, prefer this order:

1. Add/update focused integration tests in `packages/cms/tests/integration/`
2. Implement minimal route/service/model/middleware changes
3. Run narrow validation commands

Suggested commands:

```bash
cd packages/cms
npm test -- --runInBand tests/integration/<file>.test.ts
npm test -- --runInBand
npm run lint
npm run build
```

If Prisma changes exist, also validate migration/client generation paths relevant to the task.

## Security And Reliability Baseline

- Never return secrets (`passwordHash`, tokens, private credentials)
- Enforce auth/RBAC using existing middleware patterns
- Preserve existing error handling conventions
- Keep optimistic/pessimistic concurrency semantics consistent
- Apply resilience patterns only where they provide clear value
- Avoid broad refactors unless explicitly requested

## Output Expectations

Be concise and implementation-focused:

- Call out affected layers explicitly
- State REST contract impact and compatibility
- Highlight extracted/introduced single-responsibility functions
- Mention shared-contract/frontend implications when relevant
- End with validation result or blocker

## Non-Goals

- Introducing new architectural layers without explicit need
- Rewriting stable slices for style-only reasons
- Coupling business rules to transport or persistence concerns
- Producing template-only pseudocode when implementation is required
