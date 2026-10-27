# Tasks: Durable CSV Import Jobs

**Input**: Design documents from `/specs/021-durable-csv-import-jobs/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/import-job-api.md`

## Phase 1: Shared schema and job infrastructure

- [X] T001 [P] Add Prisma enums and `ImportJob`, `ImportStageProgress`, `ImportWarning`, and `ImportError` models in `packages/cms/prisma/schema.prisma`
- [X] T002 [P] Create the migration and regenerate Prisma client for the new import job schema
- [X] T003 Create typed DTOs and service boundary for `ImportJobService` in `packages/cms/src/services/import-jobs/`
- [X] T004 Add one failing integration test for the `POST /api/v1/import/csv` durable response flow in `packages/cms/tests/integration/import/csv-import-job.test.ts`

## Phase 2: User Story 1 - Immediate job creation (Priority: P1)

**Goal**: Accept import uploads immediately and create durable job records

**Independent Test**: Upload CSVs, assert a `202` response with a `jobId`, and confirm a persisted record exists in the database.

- [X] T005 [US1] Refactor `packages/cms/src/routes/import.ts` to create a `ImportJob` record before starting background work and return the job snapshot immediately
- [X] T006 [US1] Implement `createJob`, `updateJob`, and `getJobById` methods in the new import job service
- [X] T007 [US1] Add duplicate-job / concurrent-request guarding so the same import cannot silently overwrite another job record
- [X] T008 [US1] Persist raw file metadata (`historial`, `jugadores`, `apariciones`, `canchas`) on the job to preserve traceability

## Phase 3: User Story 2 - Polling, progress, and final result retrieval (Priority: P1)

**Goal**: Clients can poll job state and fetch the final importer payload after completion

**Independent Test**: Start a job, poll the job endpoint repeatedly, assert stage transitions, and verify the final result is visible after completion.

- [X] T009 [P] Add `GET /api/v1/import/jobs/:jobId` to expose the current job snapshot and final payload
- [X] T010 [P] Update `packages/cms/src/services/csv-import/handler.ts` so `onProgress` writes the current stage and percent to the DB-backed job state
- [X] T011 [US2] Persist stage snapshots (`ImportStageProgress`) and increment the `progressPercent` values during `jugadores`, `canchas`, `historial`, and `apariciones`
- [X] T012 [US2] Store `warnings` and final `CsvImportResultDTO` in the job record while keeping the importer result shape unchanged
- [X] T013 [US2] Ensure terminal jobs return the saved final result even when the original HTTP request has already completed

## Phase 4: User Story 3 - Durable worker execution and recovery (Priority: P1)

**Goal**: Survive restarts and machine lifecycle events without dropping progress or state

**Independent Test**: Simulate a restart mid-job or an interrupted process and confirm the job remains visible with the last persisted state.

- [X] T014 [US3] Create a recoverable async worker in the CMS service that picks up `queued` and `processing` jobs from Prisma
- [X] T015 [US3] Add the job lock/heartbeat pattern so a restarted app does not double-execute an import job
- [X] T016 [US3] Implement the startup recovery path to resume or flag interrupted jobs on boot without dropping the database record
- [X] T017 [US3] Ensure a processing job continues to show the last durable status and progress after application restart

## Phase 5: User Story 4 - Failure handling and compatibility (Priority: P2)

**Goal**: Keep legacy importer behavior while surfacing failures clearly and preserving warnings

**Independent Test**: Run a valid import and a failing import; verify counts match the current importer and the final job state surface failure reasons.

- [X] T018 [US4] Persist blocking errors and classify them with stage-aware metadata such as `CSV_PARSE_ERROR` or importer validation failures
- [X] T019 [US4] Keep successful jobs allowed to complete with warnings but never fail solely because warnings were present
- [X] T020 [US4] Verify durable job result counts remain equivalent to the legacy importer for valid CSV input
- [X] T021 [US4] Add test coverage for malformed CSV and bad-row scenarios to confirm failure and warning handling remain observable

## Phase 6: Validation and release readiness

- [X] T022 [P] Run the CSV import integration suite and confirm job lifecycle tests pass
- [X] T023 [P] Update admin-facing docs and release notes if required by the project workflow
- [X] T024 Run the feature quickstart and confirm all validation steps in `quickstart.md` pass

## Dependencies and execution order

- Phase 1 must complete before user-story work begins.
- Phase 2 and Phase 3 can proceed in parallel once the schema is stable.
- Phase 4 should validate recovery and state continuity before final polish.
- Phase 6 is the final gate, dependent on the successful completion of all user story tasks.
