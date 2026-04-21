# Changelog — @ministrosfc/cms

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

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
