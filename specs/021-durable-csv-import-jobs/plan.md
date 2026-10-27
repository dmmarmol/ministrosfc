# Implementation Plan: Durable CSV Import Jobs

**Branch**: `021-durable-csv-import-jobs` | **Date**: 2026-10-27 | **Spec**: `/specs/021-durable-csv-import-jobs/spec.md`

**Input**: Feature specification from `/specs/021-durable-csv-import-jobs/spec.md`

## Summary

Replace the current request-lifetime soft-timeout flow with a durable DB-backed import job model in the CMS backend. The system will create a persisted `ImportJob` the moment a CSV upload is accepted, return a `jobId` immediately, and continue execution in the background using the existing `CsvImportService.parseAndImport()` logic without changing the importer result semantics. Job state, stage progress, warnings, final result summaries, and terminal errors will be stored in PostgreSQL via Prisma so clients can poll job status after the original HTTP request has returned and survive application restarts or Fly machine lifecycle events.

## Technical Context

**Language/Version**: TypeScript 5.3, Node >=23, Express 4.18, Prisma 5.8

**Primary Dependencies**: PostgreSQL + Prisma, Express + multer, existing importer orchestration under `packages/cms/src/services/csv-import`, Pino logging, JWT auth + admin RBAC middleware

**Storage**: PostgreSQL in `packages/cms/prisma/schema.prisma`; durable import records and stage snapshots stored in DB; CSV files remain in the request memory until the worker reads them, with no long-lived request state

**Testing**: Jest + Supertest integration tests in `packages/cms/tests/integration/import/`

**Target Platform**: Linux server hosting the CMS API (Fly / containerized deployment)

**Project Type**: Web service / CMS backend API

**Performance Goals**: `POST /api/v1/import/csv` returns within ~2 seconds with a usable `jobId`, while long-running jobs continue in the background; polling status should be <=1s once the job is active

**Constraints**: Requests must not remain open for the entire CSV processing time; import jobs must survive app restarts and machine stop/start cycles; worker state must not depend on local memory alone; result counts must remain equivalent to the present CSV importer

**Scale/Scope**: Small-to-medium volumes of admin-triggered imports; no external queue required in this phase; current CSV pipeline order remains `jugadores` -> `canchas` -> `historial` -> `apariciones`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

This feature complies with the constitution:

- Feature-driven architecture: The change is a discrete admin workflow with visible product behavior and a durable backend contract.
- Specification-first: The feature specification has already defined stories, functional requirements, success criteria, and edge cases.
- Plan-driven implementation: This plan is written before code changes and will be used as the implementation baseline.
- Test-driven quality gates: New implementation work must add failing integration tests for the job-acceptance and polling workflow before final feature completion.
- Component isolation and reuse: The existing importer logic remains centralized in `packages/cms/src/services/csv-import`, and the worker logic stays in a dedicated service boundary rather than embedded in the route layer.

No constitutional violations require a special exception.

## Project Structure

### Documentation (this feature)

```text
specs/021-durable-csv-import-jobs/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── import-job-api.md
├── tasks.md
└── spec.md
```

### Source Code (repository root)

```text
packages/cms/
├── prisma/
│   └── schema.prisma
├── src/
│   ├── config/
│   ├── middleware/
│   ├── routes/
│   │   └── import.ts
│   ├── services/
│   │   ├── CsvImportService.ts
│   │   └── csv-import/
│   │       ├── handler.ts
│   │       ├── import-jugadores.ts
│   │       ├── import-canchas.ts
│   │       ├── import-historial.ts
│   │       └── import-apariciones.ts
│   └── types/
└── tests/
    └── integration/
        └── import/
            └── csv-import.test.ts
```

**Structure Decision**: Keep the existing import engine in `packages/cms/src/services/csv-import` and add a dedicated durable job service adjacent to the import route layer. The feature remains within the CMS backend and avoids introducing a new package or cross-project architectural boundary. Prisma schema changes live in `packages/cms/prisma/schema.prisma`; Express route changes remain in `packages/cms/src/routes/import.ts`.

## Design approach

### 1. Durable import job model

Add a Prisma model set for `ImportJob`, `ImportStageProgress`, `ImportWarning`, and `ImportError` in `packages/cms/prisma/schema.prisma`. The job record is the single source of truth for the current status and final outcome.

### 2. Immediate acceptance endpoint

`POST /api/v1/import/csv` will no longer hold a request open until the importer finishes. Instead:

1. Validate required files and admin authorization.
2. Create the `ImportJob` row with `queued` status and file metadata.
3. Return `202` with the initial job snapshot (`jobId`, `status`, `currentStage`, `progressPercent`).
4. Start the async worker in the same process or a recoverable app-level worker loop that reads the saved job and processes the CSVs.

### 3. Worker lifecycle and recovery

The worker will read the job row from Prisma, update status to `processing`, and then invoke the existing `CsvImportService.parseAndImport()` with a callback that persists `onProgress` updates after each stage. The job remains durable even if the process exits mid-import; on startup, the application will scan for `queued` and `processing` jobs and complete or mark them as interrupted based on the last persisted `status` and heartbeat.

### 4. Polling endpoints

The API will expose a polling endpoint for the job snapshot and final result payload:

- `GET /api/v1/import/jobs/:jobId` returns the current persisted record.
- The response includes `status`, `currentStage`, `progressPercent`, `warnings`, `result`, and an optional terminal `error`.
- Terminal states (`completed` and `failed`) remain visible even when the original request finished long ago.

### 5. Progress reporting and failure handling

The existing importer already emits progress snapshots and warnings while processing each stage. The durable layer will translate those notifications into persisted job updates:

- `jugadores` stage: status updates and mapped-player counts
- `canchas` stage: optional playground mapping
- `historial` stage: games and warnings
- `apariciones` stage: row-by-row progress and final appearances summary

Blocking issues become `ImportError` rows and set the job to `failed`; non-blocking warnings remain as `ImportWarning` rows and do not prevent a successful import.

### 6. Compatibility safeguards

The durable job flow wraps the existing logic rather than rewriting it. `CsvImportService.parseAndImport()` remains the source-of-truth importer and must keep the same result counts for valid input. This ensures compatibility with the existing CSV fixtures and with downstream data produced by the importer.

## Project implementation sequence

1. Add the Prisma models and migration for the durable import job entities.
2. Build the job service to create, update, and read job state without embedding DB code in the route layer.
3. Replace the request-scoped soft-timeout logic in `packages/cms/src/routes/import.ts` with a `202` response + durable job creation.
4. Add the background worker and startup recovery path so queued or processing jobs survive restarts.
5. Persist stage progress, warnings, and final result payloads using the existing importer callbacks.
6. Validate via integration tests covering happy path, polling, warning retention, and failure states.

## Complexity Tracking

No complexity exceptions are required for this feature. The design stays inside the existing CMS backend boundaries and does not require a new package, external broker, or cross-application queue solution.
