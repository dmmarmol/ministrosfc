# Import Job API Contract

## POST /api/v1/import/csv

Creates a durable import job and returns immediately without waiting for import completion.

### Request

Multipart upload with required files:

- `historial` (required)
- `jugadores` (required)
- `apariciones` (required)
- `canchas` (optional)

### Success response

Status: `202 Accepted`

```json
{
  "data": {
    "jobId": "8d9315d4-ff5d-4f16-b7d2-57068f2a9001",
    "status": "queued",
    "currentStage": "start",
    "progressPercent": 0,
    "createdAt": "2026-10-27T14:13:00.000Z",
    "updatedAt": "2026-10-27T14:13:00.000Z"
  }
}
```

### Validation behavior

- Missing required CSVs -> `422` with an explanatory error.
- Duplicate or concurrent request handling -> either `202` with a queued job or a deterministic duplicate response, but never silent data loss.

## GET /api/v1/import/jobs/:jobId

Polls the current state of a specific import job.

### Success response

Status: `200 OK`

```json
{
  "data": {
    "jobId": "8d9315d4-ff5d-4f16-b7d2-57068f2a9001",
    "status": "processing",
    "currentStage": "historial",
    "progressPercent": 72,
    "warnings": [
      "apariciones: no matching game for ... row skipped"
    ],
    "result": {
      "players": { "created": 3, "updated": 0, "skipped": 0 },
      "games": { "created": 2, "updated": 0, "skipped": 0 },
      "appearances": { "created": 1, "updated": 0, "skipped": 1 },
      "playgrounds": { "created": 0, "updated": 0, "skipped": 0 },
      "warnings": ["apariciones: ..."]
    },
    "error": null,
    "startedAt": "2026-10-27T14:13:00.000Z",
    "updatedAt": "2026-10-27T14:15:01.000Z",
    "finishedAt": null
  }
}
```

### Terminal response

When the job is complete or failed, the same endpoint returns the final persisted state with `status` set to `completed` or `failed` and the terminal `result` or `error` payload attached.

## Error contract

If the job fails from a blocking issue, the response includes:

```json
{
  "data": {
    "jobId": "...",
    "status": "failed",
    "error": {
      "code": "CSV_PARSE_ERROR",
      "message": "CSV parse error: unexpected quote",
      "stage": "jugadores"
    }
  }
}
```

This contract intentionally mirrors the current importer result structure while wrapping it in a durable job lifecycle.
