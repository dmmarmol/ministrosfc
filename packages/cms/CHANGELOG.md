# Changelog — @ministrosfc/cms

All notable changes to this package will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

---

## [0.0.1] — 2026-04-21

### Added

- **CSV import endpoint** (`POST /api/v1/import/csv`): batch-imports `historial.csv`, `jugadores.csv`, `apariciones.csv`, and optional `canchas.csv` via multipart upload; idempotent upsert on natural keys.
- **Statistics endpoints**: `GET /api/v1/statistics/team/summary`, `/team/by-year`, `/team/by-tournament`, `/team/by-rival`, `/team/rivals/:rivalId`, `/players`, `/players/:id` — Redis-cached (5-min TTL).
- **Address autocomplete proxy**: `GET /api/v1/address/search` server-side Nominatim proxy (debounced, Argentina-biased).
- **Playground CRUD**: `GET/POST /api/v1/playgrounds`, `GET/PATCH /api/v1/playgrounds/:id`.
- **Admin role management**: `PATCH /api/v1/admin/users/:id/role` with optimistic-concurrency guard, self-demotion protection, and transactional player hard-delete on demotion.
- **User registration & onboarding**: `/api/v1/auth/register`, `/api/v1/auth/google`, `/api/v1/auth/google/callback` flows.
- **Global ZodError handler**: `src/middleware/error-handler.ts` returns HTTP 400 with `.issues` (Zod v4 API) on validation failures.
- **Redis client** (`src/config/redis.ts`): lazy-connect ioredis client with retry strategy; supports `REDIS_URL` (Upstash) or individual `REDIS_HOST`/`REDIS_PORT` vars.
- **Prisma schema**: `Game` (`startTime`, `endTime`, `coach`, `photoUrl`, `playgroundId`), `GameParticipant` (`isStarter`), `Playground`, `Tournament`, `OpponentTeam`, `Statistics`.
- **`ensureExternalIds` helper**: idempotent UUID injection + duplicate-column disambiguation for CSV pre-processing.
- **`splitName` helper**: last-token-as-lastName strategy for Spanish full names.
- **`spanishPositionMap` and `positionMap`**: imported from `@ministrosfc/shared` (moved from local helpers).
- **Integration test suite**: 437 tests across authentication, players, games, playgrounds, CSV import, statistics, and admin flows; serial execution (`maxWorkers: 1`).
- **`ioredis`** declared as a direct dependency (was previously only a transitive dep, missing from `package.json`).

### Fixed

- Docker builder stage: `prisma generate` now runs **before** `tsc` so `@prisma/client` types (`CompetitionType`, `GameStatus`, `Foot`, `PlayerType`) are available at compile time.
- `tsconfig.json`: `@ministrosfc/shared` path alias resolves to `../shared/dist` (pre-built) for Docker builds.
- `tsconfig.test.json`: overrides path alias back to `../shared/src` so `ts-jest` resolves types from source at test time.
- `redis.ts`: explicit `number` type on `retryStrategy` parameter and `Error` type on `error` event callback (resolves TS7006 under `strict`).
- `cleanDatabase()` teardown: correct FK delete order (`gameParticipant → statistics → game → playground → player → opponentTeam → tournament → user`).
- CI Redis port: `env-setup.js` reads `REDIS_HOST`/`REDIS_PORT` env vars with local-dev fallbacks, eliminating port mismatch between local Docker Compose and CI.
