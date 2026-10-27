# Research: Durable CSV Import Jobs

## Decision

Use a DB-backed `ImportJob` lifecycle managed by Prisma/PostgreSQL in the CMS backend, with the existing `CsvImportService.parseAndImport()` kept as the source-of-truth import engine. The HTTP handler will create a durable job row immediately, then schedule the actual CSV pipeline in a background worker. Job status, stage progress, warning count, final result JSON, and terminal errors will all be persisted instead of stored only in an in-flight request or Redis process memory.

## Rationale

- The repo is already built around Prisma + PostgreSQL and Express routes in `packages/cms`.
- The legacy CSV importer is a pure orchestration pipeline already emitting progress through `onProgress`; it can be reused without reimplementing business rules.
- The feature explicitly requires survival across application restarts and Fly machine lifecycle events, which rules out request-scoped or in-memory state.
- The current `POST /api/v1/import/csv` uses a soft timeout pattern (`CSV_IMPORT_SOFT_TIMEOUT_MS`) that is not durable; replacing it with a persisted job record aligns with the existing API surface while preserving SQL-backed consistency.

## Alternatives considered

### 1. Redis- or in-memory queue only

Rejected because Redis state is still ephemeral and survivability is weaker than PostgreSQL persistence. It also does not provide the same transactional visibility, auditability, and final-result retention required by the spec.

### 2. External queue (BullMQ/RabbitMQ/SQS)

Rejected for the initial version because the project assumptions explicitly call for a small-to-medium import volume without an event bus or external broker. This feature is primarily about durable persistence and API clarity, not distributed orchestration.

### 3. Keep the current request-lifetime execution model

Rejected because it fails FR-002, FR-010, and SC-007 by leaving the work tied to the original HTTP request lifespan and browser connection.

## Major design decisions

- The job model will contain persisted state for `status`, `stage`, `progress`, `resultJson`, `warnings`, `errorJson`, and timestamps.
- The worker will be a single async task per job with a recoverable state machine: `queued -> processing -> completed | failed`.
- We will keep the import stages ordered exactly as the existing importer expects: `jugadores` -> `canchas` -> `historial` -> `apariciones`.
- Stage updates will be mapped to job progress snapshots so clients can poll and see a fresh `currentStage` and `percentComplete`.
- We will not alter the CSV parser or per-CSV import logic in a way that changes counts; we will wrap the existing importer around a durable lifecycle.

## Open technical constraints to confirm in implementation

- The feature is scoped to the CMS backend and uses Postgres as the source of truth.
- The initial implementation does not require a dedicated event bus or horizontal worker pool; a single app-level worker loop is acceptable.
- Duplicate job requests for the same source should either be queued or rejected with a deterministic status, as long as the same client sees an observable outcome.
