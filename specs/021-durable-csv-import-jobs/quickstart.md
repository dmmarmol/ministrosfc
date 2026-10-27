# Quickstart: Durable CSV Import Validation

## Prerequisites

- PostgreSQL is running and the CMS app is configured via the repo env files.
- `npm install` and Prisma generation are complete.
- The auth/admin seed is present so an admin can upload CSVs.

## Validate initial response

1. Start the CMS service.
2. Submit a multipart request to `POST /api/v1/import/csv` using valid `historial`, `jugadores`, and `apariciones` files.
3. Confirm that the HTTP response is `202 Accepted` and includes:
   - `jobId`
   - `status` in `queued` or `processing`
   - `currentStage`
   - `progressPercent`

## Validate polling lifecycle

1. Poll `GET /api/v1/import/jobs/:jobId` every few seconds.
2. Confirm the job moves through the major stages: `start`, `jugadores`, `canchas`, `historial`, `apariciones`, and `finish`.
3. Confirm `progressPercent` increases and `updatedAt` changes across each poll.
4. Confirm the final state is `completed` and includes the final importer summary counts.

## Validate warnings and failure scenarios

- Upload a valid CSV with a harmless row-level warning and ensure the job completes with `status: completed` and warnings retained.
- Upload a malformed CSV or a row that triggers a blocking validation failure and confirm the job becomes `failed` with a persisted `error` payload.
- Restart the Node process or simulate a Fly machine start/stop and confirm the job remains visible in the database without silent reset.

## Validate importer parity

Run the same valid CSV through the old importer and the new durable job flow. Confirm the final result counts remain equivalent for the same input and the durable job flow produces the same imported data counts for `players`, `games`, `appearances`, and `playgrounds`.

## Expected outcomes

- The original request returns immediately.
- The job remains visible after the response is sent.
- A client can resolve the final result without re-running the import.
- Warnings and failures are persisted and readable from the job record.
