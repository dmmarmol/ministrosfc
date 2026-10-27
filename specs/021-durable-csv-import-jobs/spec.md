# Feature Specification: Durable CSV Import Jobs

**Feature Branch**: `feature/021-durable-csv-import-jobs`

**Created**: 2026-10-27

**Status**: Draft

**Input**: User description: "Add a durable import job model and API workflow for long-running CSV imports. Replace the current request-lifetime soft-timeout behavior with a job-backed flow that returns immediately with a jobId/status. Persist job status, progress, warnings, final result, and errors in the database. Allow clients to poll job status and retrieve final data after completion. Ensure long-running imports survive app restarts and Fly machine auto-stop / start cycles. Support progress updates during `jugadores`, `canchas`, `historial`, and `apariciones` stages. Preserve existing CSV importer behavior and result counts, while making execution durable and observable."

## User Scenarios & Testing _(mandatory)_

### User Story 1 — Submit a CSV import and receive immediate feedback (Priority: P1)

An administrator uploads a CSV file through the CMS import workflow. Instead of waiting for the full import to complete within the current request lifetime, they receive an immediate acknowledgement with a unique job ID and current job status. The import continues in the background so the administrator can continue working without a long-running request timeout.

**Why this priority**: This is the core user-facing change. Large CSV imports are long-running by nature, and the ability to submit a request and continue immediately is the entire reason for the durable job flow.

**Independent Test**: Upload a CSV through the import endpoint and verify that the request returns promptly with a `jobId` and a status such as `queued` or `processing`, while the import work continues without the original HTTP request staying open.

**Acceptance Scenarios**:

1. **Given** an administrator submits a valid CSV file for import, **When** the request is accepted, **Then** the system returns a unique `jobId` and a non-terminal job status immediately.
2. **Given** an import job has been created, **When** the original request completes, **Then** the CSV processing continues asynchronously in a durable job record rather than being tied to the request lifecycle.
3. **Given** the imported CSV has validation issues or unsupported structure, **When** the import starts, **Then** the job records the failure reason and stops without leaving the request hanging on a timeout.

---

### User Story 2 — Monitor progress and final results through polling (Priority: P1)

A user who started a CSV import wants to see how far the job has progressed and whether it has completed successfully. They poll the job endpoint to retrieve the latest status, stage progress, warnings, and final counts. Once the processing is done, they can retrieve the final imported result details and use them as the final dataset output.

**Why this priority**: The import should be visible and verifiable while it runs. Polling gives users a predictable way to observe status without blocking the main workflow.

**Independent Test**: Start an import, poll the job status repeatedly, confirm the progress updates move through each stage, and after completion confirm the final result data and summaries are returned consistently.

**Acceptance Scenarios**:

1. **Given** a job is queued or processing, **When** the client polls the job status endpoint, **Then** the response includes the current status, current stage, progress percentage, and timestamps for the job lifecycle.
2. **Given** the import is in progress, **When** the system reaches a stage such as `jugadores`, `canchas`, `historial`, or `apariciones`, **Then** the job status reflects the active stage and the corresponding progress update for that stage.
3. **Given** a job completes successfully, **When** the client retrieves the final result, **Then** the response includes the final result summary, warnings, and any data the importer historically produced for the same CSV.
4. **Given** a job fails or encounters validation issues, **When** the client checks the job result, **Then** the system returns the recorded error information with a final failed status instead of an incomplete or silent result.

---

### User Story 3 — Durable execution survives restarts and machine lifecycle events (Priority: P1)

An administrator runs a long import and then the application restarts or the hosting environment pauses and resumes the machine. The import job continues to exist in the system with its status and progress intact, and the processing can resume or be observed without losing the result state already recorded.

**Why this priority**: Long-running imports are business-critical and can outlive app restarts; without durable persistence, import jobs may fail unpredictably under deployment and infrastructure lifecycle events.

**Independent Test**: Start a large import, simulate an application restart or machine stop/start, and verify the job remains in the database with its final known state, with no data loss and no silent reset of progress or final result.

**Acceptance Scenarios**:

1. **Given** an import job is in progress, **When** the application restarts, **Then** the job remains persisted and its last known status remains visible to clients.
2. **Given** the hosting environment auto-stops and later starts a machine, **When** the job is resumed or restarted, **Then** the system continues tracking the job without losing progress, warnings, or errors already saved.
3. **Given** a job had progressed through earlier stages before the interruption, **When** the job resumes, **Then** the system continues from the last durable state rather than starting from the beginning unless the business rules require a fresh import.

---

### User Story 4 — Preserve importer behavior while improving observability (Priority: P2)

A person familiar with the existing CSV importer expects the current result counts and stored outcomes to remain unchanged. The new durable job model must preserve the same downstream behaviors and count totals while adding job tracking, warnings, and status visibility around the same underlying import logic.

**Why this priority**: The durable flow is valuable only if it does not change the meaning or reliability of the imported data. This preserves trust in the existing importer while improving operational transparency.

**Independent Test**: Run the same CSV through the legacy importer logic and the new durable job flow, then verify that the final result counts, affected records, and success/failure outcome match for equivalent input.

**Acceptance Scenarios**:

1. **Given** the same CSV is processed in the existing importer and in the new durable workflow, **When** both complete, **Then** their final result counts and outcomes are equivalent for the same valid input.
2. **Given** an import job emits warnings for non-critical issues, **When** the job completes, **Then** the final result remains valid while warnings are preserved for review.
3. **Given** a malformed CSV or unsupported data section, **When** the importer reaches a point of failure, **Then** the system records that failure without discarding previously valid results or changing established counting logic.

---

### Edge Cases

- What happens when the application crashes or restarts while a job is mid-stage? The system must keep the last durable job status and continue from the last persisted state or mark the import as interrupted without losing the record.
- What happens when a CSV contains mixed valid and invalid rows? The job remains active or fails cleanly, but valid results and warning records must be retained and the final summary must remain understandable.
- What happens when a polling client requests status after the job is complete? The system must return a terminal status and final result payload without requiring a re-run.
- What happens when a stage fails during `jugadores`, `canchas`, `historial`, or `apariciones` processing? The error must be persisted, the job status must become terminal, and the user must see why the import stopped.
- What happens when a CSV import is requested while another long-running job is already active for the same source? The system must either queue the job or reject the duplicate in a defined, observable way without silently dropping work.
- What happens when import warnings accumulate during processing? Warnings must be stored in the job record and remain visible in the final result without causing the job to fail unless the warning represents a blocking issue.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST create a durable import job record the moment a CSV import is accepted for processing.
- **FR-002**: The import submission flow MUST return immediately with a job identifier and an initial status such as `queued` or `processing`, instead of keeping the original request open until the full import completes.
- **FR-003**: The system MUST persist job status, current stage, progress percentage, timestamps, warnings, final result summary, and terminal errors in the database for each import job.
- **FR-004**: The system MUST support job lifecycle states including at minimum `queued`, `processing`, `completed`, and `failed`, with clear terminal states for each outcome.
- **FR-005**: The system MUST allow clients to poll the status of a specific job using the job identifier and retrieve the most recent job snapshot.
- **FR-006**: The system MUST retain the final imported data or the final result payload after completion so clients can retrieve the result without re-running the import.
- **FR-007**: The system MUST update progress during each major import stage: `jugadores`, `canchas`, `historial`, and `apariciones`.
- **FR-008**: The system MUST persist warnings raised during import processing and expose them in the final job record without preventing successful completion when they are non-blocking.
- **FR-009**: The system MUST persist errors for blocking issues and expose them in the terminal job result so the cause of a failed import is visible to clients.
- **FR-010**: The system MUST ensure long-running imports survive application restarts and Fly machine stop/start cycles by storing the job state outside the request lifecycle and outside ephemeral in-memory process state.
- **FR-011**: The system MUST preserve the behavior and result counts of the current CSV importer so the job-backed flow remains equivalent to the historical import outcome for the same valid input.
- **FR-012**: The system MUST keep the final job result tied to the original import job so clients can differentiate between a still-running job, a failed import, and a completed import.
- **FR-013**: The system MUST clearly distinguish between valid warnings and blocking errors so that a job can complete with warnings but only fail on actual blocking conditions.
- **FR-014**: The system MUST make the job status and final result available after completion even when the original HTTP request has already returned.
- **FR-015**: The system MUST handle duplicate or repeated status queries without creating conflicting job states or silently overriding the original job state.

### Key Entities

- **ImportJob**: Represents a single CSV import attempt. Key attributes include a unique job identifier, source file metadata, current status, created/updated timestamps, stage progress, and final result summary.
- **ImportStageProgress**: Captures progress for an individual stage such as `jugadores`, `canchas`, `historial`, or `apariciones`, including the current stage name, progress percentage, and completion timestamps.
- **ImportWarning**: Represents non-blocking issues encountered during import, such as skipped rows, recovered values, or records that were accepted with caution.
- **ImportError**: Represents blocking or meaningful operational errors that require the job to fail or stop; includes the error classification, message, and whether the import can continue.
- **ImportResult**: Represents the final result payload returned after completion, including summary counts and the final data produced by the CSV importer equivalent to the existing behavior.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Job submission returns a usable response with `jobId` and status in under 2 seconds for the normal CSV import flow, even when the CSV is large enough to require extended processing.
- **SC-002**: A client can poll job status and observe stage progress updates during `jugadores`, `canchas`, `historial`, and `apariciones` without stale or conflicting job states.
- **SC-003**: At least 99% of job records remain visible and recoverable after application restarts or Fly machine stop/start cycles, with no silent loss of the recorded job status or final result.
- **SC-004**: Final result counts from the durable job flow match the legacy importer result counts for the same valid CSV input within a defined tolerance equivalent to the existing importer output.
- **SC-005**: The final job result and warnings are retrievable after completion without re-running the import, and clients can access them from the job record within 10 seconds of the job reaching a terminal status.
- **SC-006**: Users can detect failed imports clearly and understand the blocking cause through the persisted error information, while non-blocking warnings remain visible without obscuring the successful result.
- **SC-007**: The system supports import jobs long enough for multi-minute or multi-hour processing without degrading the request flow or requiring a client to hold a request open for the entire job duration.

## Assumptions

- The existing CSV importer contains the source-of-truth validation logic and result count calculations; the durable job flow MUST preserve that behavior instead of changing business rules.
- Import jobs are initiated through the CMS administrative workflow and are not required to support real-time UI streaming updates in the initial version.
- Job records are persisted in the application's durable data store so they survive application restarts and hosted machine lifecycle events.
- The system is expected to handle a small-to-medium volume of concurrent imports without requiring an event bus or external queue in this feature; the focus is durable persistence, observability, and API contract clarity.
- The stage order for the import is `jugadores`, `canchas`, `historial`, and `apariciones`, and each stage can emit progress updates as work advances.
