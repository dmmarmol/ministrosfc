# Changelog — @ministrosfc/cms

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added

- `GET /api/v1/tournaments` returns `ministrosRecord` on every tournament, computed for all rows in a single query (`TournamentModel.calculateMinistrosRecords`); the tally logic is shared in `utils/ministros-record.ts`.

---

## [0.15.0] — 2026-11-23

### Summary

Minor release for the first production launch: environment-aware startup validation, optional photo storage and Redis, and no idle database activity. See the root changelog for the full release.

### Changed

- Startup validation: `APP_ENV` (required when `NODE_ENV=production`), `REDIS_URL` required in production, `REDIS_DISABLED` allowed outside production, all-or-none photo storage credentials, HTTPS non-localhost CORS origins in production.
- `/api/v1/health` no longer queries the database or Redis.
- Game statuses sync at startup and, at most every 5 minutes, when games are read; the recurring timer is removed.
- Photo uploads fail with 503 `PHOTO_STORAGE_UNAVAILABLE` (Spanish message) while storage is not configured; deleting photos becomes a no-op.

### Added

- `GET /api/v1/health/ready` (database and Redis, cached 30 s) and `GET /api/v1/config`.
- Per-environment Fly config files and a release command that runs migrations over `DIRECT_URL`.

### Fixed

- The container image no longer copies `.env*` files.

## [0.13.0] - 2026-11-23

### Summary

Minor release: removes the `SEASON` competition type with a data migration and localizes API errors to Spanish.

### Changed

- API error and validation messages (including Multer upload errors and the CSV import warnings) are returned in Spanish; unexpected 500 errors always return a generic Spanish message.

### Added

- Migration `remove_season_competition_type` and shared seed-import competition type mapping.

### Removed

- `SEASON` from the Prisma `CompetitionType` enum; existing games and tournaments are converted to `LEAGUE`.

## [0.12.0] — 2026-05-03

### Added

- `registrationStatus RegistrationStatus @default(PENDING_APPROVAL)` field on Prisma `User` model; `UserApprovalDecision` model (id, userId, reviewerId, decisionType, mergePlayerId, createdAt) with Prisma migration `add-registration-approval`.
- `UserApprovalService` with `matchOrphanPlayers`, `getPendingApprovals`, `approveWithoutMerge`, `approveWithMerge`, `deny`, and `mergeApprovedUser` methods. Merge is executed as a Prisma transaction with orphan validation and optimistic lock enforcement.
- `NoOpNotificationSender` implementing `NotificationSender` from `@ministrosfc/shared`: `send`/`sendCC`/`sendCCO` resolve silently; `sendSafe` swallows errors and logs a warning.
- Approval API endpoints under existing admin-users surface: `GET /api/v1/admin/users/pending-approvals`, `GET .../pending-approvals/:userId/orphan-players`, `POST .../pending-approvals/:userId/approve`, `POST .../pending-approvals/:userId/deny`, `POST .../pending-approvals/:userId/approve-merge`, `POST /api/v1/admin/users/:userId/merge-player`.
- `PlayerModel.findOrphans(options)` paginated query for players with no linked user account.
- `UserModel.findPendingApprovals(options)` paginated query.
- `PENDING_APPROVAL` error code in `src/utils/error-codes.ts`.
- Approval flow integration tests: `approval-queue.test.ts`, `approval-merge.test.ts`, `user-merge.test.ts`.
- Unit tests: `UserApprovalService.test.ts`, `NoOpNotificationSender.test.ts`.

### Changed

- `AuthService.register` now returns `202 { status: "pending", message: "Tu cuenta está pendiente de aprobación" }` without issuing JWT tokens.
- `AuthService.login` rejects users with `registrationStatus === PENDING_APPROVAL` with `403 { code: "PENDING_APPROVAL" }`.
- Admin auto-approve logic: users with role `ADMIN` are created with `APPROVED` status directly.

### Fixed

- Replaced `bcrypt` (native addon) with `bcryptjs` to fix CI build hangs on ARM/musl environments.
- Admin seed credentials now sourced from environment variables, removing hardcoded defaults.

### Added

- `FRONTEND_URL` documented as an explicit CMS runtime variable for environment-specific auth redirects.
- Google OAuth integration coverage for frontend-origin fallback behavior.

### Changed

- CSV import date handling now applies kickoff time to persisted `Game.date` values instead of storing midnight-only datetimes.
- CSV import game matching was aligned around calendar-day lookup so `historial.csv` and `apariciones.csv` remain idempotent even when kickoff times are normalized.

### Fixed

- Google OAuth callback redirect now prefers explicit `FRONTEND_URL`, then falls back to the first configured CORS origin before using localhost.
- DEV import flows no longer lose match time information during persistence.

## [0.10.0] — 2026-04-21

### Added

- `POST /api/v1/import/csv`: batch-imports `historial.csv`, `jugadores.csv`, `apariciones.csv`, and optional `canchas.csv` via multipart upload; idempotent upsert on natural keys; maps `G/P/E` outcome codes and `DD/MM/YYYY` / `YYYY/MM/DD` date formats.
- `canchas.csv` import: upserts Playground records by name; links historical games via `Game.playgroundId`; unmatched games emit a warning in `CsvImportResultDTO`.
- Statistics endpoints: `GET /api/v1/statistics/team/summary`, `/team/by-year`, `/team/by-tournament`, `/team/by-rival`, `/team/rivals/:rivalId`, `/players`, `/players/:id` — Redis-cached (5-min TTL).
- `GET /api/v1/statistics/players` accepts optional `status` query param (`ACTIVE` | `INACTIVE`).
- Prisma schema: `startTime`, `endTime`, `coach`, `photoUrl` on `Game`; `isStarter` on `GameParticipant`; `@@unique([date, opponentTeamId, tournamentId])` composite index on `Game`.
- Integration tests: `csv-import.test.ts` and `team-stats.test.ts` suites.

### Changed

- `positionMap` and `spanishPositionMap` moved to `@ministrosfc/shared`; `helpers.ts` now imports them from shared.

### Fixed

- Docker builder stage: `prisma generate` now runs before `tsc` (fixes TS2305 on `CompetitionType`, `GameStatus`, `Foot`, `PlayerType`).
- `redis.ts`: explicit `number` type on `retryStrategy` parameters and `Error` type on error event callback (fixes TS7006 under `strict`).
- `ioredis` declared as a direct dependency (was a transitive dep only, absent from `package.json`).
- `tsconfig.json`: `@ministrosfc/shared` path alias resolves to `../shared/dist` for Docker builds.
- `tsconfig.test.json`: overrides path alias back to `../shared/src` for `ts-jest` test-time resolution.
- CI: production deploys restricted to published GitHub Releases; `workflow_dispatch` limited to `development` environment only.
- CSV import: `cleanDatabase()` teardown order corrected (FK violation on playground delete).
- CSV import: jugadores idempotency (name fallback after externalId miss), Spanish position mapping, `splitName` last-token strategy.
- CSV import: `ZodError` now returns HTTP 400 with `.issues` (Zod v4) instead of 500.
- CI Redis port: `env-setup.js` reads `REDIS_HOST`/`REDIS_PORT` env vars with local-dev fallbacks.

---

## [0.9.0] — 2026-04-16

### Added

- `PATCH /api/v1/admin/users/:id/role`: role update with optimistic-concurrency guard (`expectedUpdatedAt`), self-demotion protection (403), and transactional player hard-delete on demotion.
- Duplicate-email 409 and stale-write 409 with distinct error codes.
- Rate-limiter middleware on sensitive admin endpoints.
- `/api/v1/auth/register`, `/auth/google`, `/auth/google/callback` authentication flows.
- 31 integration tests including T022 (player record integrity on hard-delete) and T030 regression suite.

### Changed

- User model: `name` split into `firstName`/`lastName`; `DT` role and `googleSubjectId` added.

---

## [0.8.1] — 2026-04-13

### Fixed

- Game edit payload validation: date/time now validated as ISO 8601 with timezone offset.
- Game validation error messages improved; `SEASON` competition type added.

---

## [0.8.0] — 2026-04-13

### Fixed

- Redis disconnect and global Jest teardown handling; eliminates lingering open-handle warnings.
- Pagination limit cap raised to 500 for players route.
- Spurious UUID constraint removed from `tournamentId`; seed uses proper UUID v4 format.

---

## [0.7.0] — 2026-04-07

### Added

- Playground CRUD: `GET/POST /api/v1/playgrounds`, `GET/PATCH /api/v1/playgrounds/:id`.
- `GET /api/v1/address/search`: server-side Nominatim proxy (debounced, Argentina-biased); forwards geocoded coordinates from selected suggestions.
- `Game` entity gains optional `playgroundId` FK; legacy `location` text field preserved.

### Fixed

- Validation error details restricted to authenticated users only.

---

## [0.6.3] — prior

### Added

- Seed-import CLI (`src/scripts/seed-import.ts`): TDD implementation for hydrating historical CSV data via Prisma.
- Redis client: `REDIS_URL` env var support (Upstash / full connection string); env validation on startup.
- `fly.toml` release command: runs `prisma migrate deploy` atomically before traffic switches.
