# Data Model: Durable CSV Import Jobs

## Domain entities

### ImportJob

Represents a single CSV import attempt created when the request is accepted.

| Field | Type | Notes |
| --- | --- | --- |
| id | `String` | Primary key, UUID |
| externalId / jobId | `String` | Public identifier exposed to clients; can be same as `id` or a separate slug |
| status | `ImportJobStatus` | `queued`, `processing`, `completed`, `failed` |
| currentStage | `ImportStage` | `jugadores`, `canchas`, `historial`, `apariciones`, or `finished` |
| progressPercent | `Int` | 0-100; computed from stage completed ratio |
| startedAt | `DateTime` | Set when worker begins or when record created |
| finishedAt | `DateTime?` | Terminal timestamp |
| createdAt | `DateTime` | DB audit |
| updatedAt | `DateTime` | DB audit |
| submittedByUserId | `String?` | Link to admin user |
| fileChecksum | `String?` | Optional dedupe / replay check |
| fileMeta | `Json` | Original CSV file names, sizes, and optional metadata |
| resultJson | `Json?` | Final importer result payload (`CsvImportResultDTO`) |
| warningsJson | `Json?` | Serialized non-blocking warnings |
| errorJson | `Json?` | Final blocking error info |
| workerLockToken | `String?` | Used to prevent two workers from acting on same job |
| lastHeartbeatAt | `DateTime?` | Useful for interrupted jobs |

### ImportStageProgress

Tracks progress increments for each stage and snapshots them over time.

| Field | Type | Notes |
| --- | --- | --- |
| id | `String` | Primary key |
| importJobId | `String` | FK to `ImportJob` |
| stage | `ImportStage` | e.g. `jugadores`, `historial`, `apariciones` |
| percentComplete | `Int` | 0-100 for that stage |
| processedRows | `Int?` | Number of rows processed |
| totalRows | `Int?` | Total expected rows |
| startedAt | `DateTime?` | Stage start |
| finishedAt | `DateTime?` | Stage completion |
| detailsJson | `Json?` | Extra worker metadata |

### ImportWarning

Captures non-blocking warnings that remain visible in the final job result.

| Field | Type | Notes |
| --- | --- | --- |
| id | `String` | Primary key |
| importJobId | `String` | FK to `ImportJob` |
| code | `String?` | Optional classification |
| message | `String` | Warning text |
| stage | `ImportStage?` | Which stage created it |
| createdAt | `DateTime` | Audit |

### ImportError

Captures blocking errors or failed imports.

| Field | Type | Notes |
| --- | --- | --- |
| id | `String` | Primary key |
| importJobId | `String` | FK to `ImportJob` |
| code | `String` | Error classification e.g `CSV_PARSE_ERROR` |
| message | `String` | Human-readable error |
| stage | `ImportStage?` | Stage at which it failed |
| recoverable | `Boolean` | `false` for terminal job failures |
| createdAt | `DateTime` | Audit |

## Enums

### ImportJobStatus

- `queued`
- `processing`
- `completed`
- `failed`
- `cancelled` (optional, if cancellation is added later)

### ImportStage

- `start`
- `jugadores`
- `canchas`
- `historial`
- `apariciones`
- `finish`

## Relationships

- `ImportJob` has many `ImportStageProgress` snapshots.
- `ImportJob` has many `ImportWarning` rows.
- `ImportJob` has many `ImportError` rows.
- `ImportJob` is linked to a CMS `User` (admin user who submitted the import) when available.

## Validation rules

- `status` must be terminal in `completed` and `failed` states; no additional mutation should be allowed after that.
- `progressPercent` must remain between `0` and `100`.
- Warnings may coexist with a successful job; blocking errors should mark the job `failed`.
- `resultJson` must remain stored after completion so a client can retrieve the importer output without re-running the import.
- `errorJson` should be null for successful jobs; `resultJson` should be null for failed jobs unless a partial summary is explicitly preserved.

## Schema impact on current tables

The feature adds a new Prisma model set to `packages/cms/prisma/schema.prisma` and reuses the current CSV importer logic rather than redefining the import business rules. Existing `Player`, `Game`, `GameParticipant`, and `Playground` tables continue to be the source of truth for imported data. The new import job model does not replace the existing result model; it wraps it in a durable lifecycle record.
