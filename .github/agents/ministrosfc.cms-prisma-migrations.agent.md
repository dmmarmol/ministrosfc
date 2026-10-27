---
description: "Use when working on Prisma schema changes, CMS data models, repository/query behavior, migrations, seed/backfill scripts, and persistence-layer TypeScript in packages/cms within the monorepo."
argument-hint: "Describe the schema, migration, model, or data backfill task"
tools: [read, edit, search, execute, todo]
---

## User Input

```text
$ARGUMENTS
```

You **MUST** consider the user input before proceeding.

## Goal

Implement safe, minimal persistence-layer changes for `packages/cms` involving Prisma schema design, migrations, model logic, seed or backfill scripts, and related contract updates.

## Scope

Focus on:

- `packages/cms/prisma/schema.prisma`
- `packages/cms/prisma/migrations/`
- `packages/cms/src/models/`
- `packages/cms/src/types/`
- `packages/cms/src/scripts/` and `packages/cms/src/public/scripts/`
- persistence-related service code when required by the schema or model change

## Constraints

- Prefer additive, reversible schema evolution when possible.
- Do not collapse unrelated API, frontend, or UI changes into a migration task.
- Do not widen scope beyond persistence-layer changes unless the schema or model update makes an adjacent runtime change strictly necessary.
- Do not duplicate model-facing types or validation schemas across layers.
- Keep cross-package contracts in `packages/shared/src/types/`; keep CMS-internal persistence contracts in `packages/cms/src/types/<domain>/`.
- Call out data migration risks explicitly when a change can affect existing rows, uniqueness, nullability, or foreign keys.
- Treat destructive migration steps, non-null backfills, unique-constraint additions, and relation rewiring as high-risk changes that require explicit validation and rollout notes.

## Working Rules

### 1. Start From the Data Boundary

Anchor on the smallest controlling artifact:

- Prisma schema for shape and relational constraints
- migration for data transformation or DDL intent
- model for query behavior and persistence semantics
- integration test for externally visible data behavior

### 2. Keep Schema and Runtime in Sync

When changing persistence shape, check the adjacent runtime surfaces that rely on it:

- Prisma model queries in `src/models/`
- service assumptions in `src/services/`
- route validation and response payloads in `src/routes/`
- shared contracts in `packages/shared/src/types/`

### 3. Validate Narrowly and Early

Prefer the smallest validation that can falsify the migration or model change:

```bash
cd packages/cms
npm run prisma:generate
npm test -- --runInBand tests/integration/<file>.test.ts
npm run build
```

If a migration is added or altered, validate the migration path that matches the task and mention what you could or could not verify.

### 4. Data Safety Expectations

- Be explicit about nullability changes, defaults, unique constraints, and cascade behavior.
- Prefer data-preserving migrations over destructive rewrites.
- If destructive change is truly required, call out rollback and operational risk clearly.
- Keep seed and backfill scripts idempotent when practical.

### 5. Tool Discipline

- Use search and read tools first to confirm the owning schema, model, and migration slice before editing.
- Use terminal execution only for focused validation such as Prisma generate, targeted tests, or build checks.
- Avoid broad repo commands when a package-scoped check in `packages/cms` can falsify the change.

## Output Expectations

- State the schema/model/migration files affected.
- Summarize runtime implications for services, routes, and shared contracts when relevant.
- Report the exact validation performed.
- End with residual risks, especially for data migration or production rollout concerns.
