# CMS API Architecture Overview

## Lucid Chart

In this Lucid Chart the user can visualize the following schema: [Chart](https://lucid.app/lucidchart/eed127de-3e96-4dbe-8bad-78bf27e0d5b6/edit?beaconFlowId=F74764F875B6FEBC&invitationId=inv_004ef9c1-cb82-427f-a113-4aa489d0c905&page=0_0#)

## Entry Point

`src/main.ts` boots the API in this order:

1. Validate environment variables.
2. Connect to database (Prisma).
3. Start background job for game status transitions.
4. Create Express app via `createApp()`.
5. Start HTTP server.
6. Handle graceful shutdown (`SIGINT`/`SIGTERM`).

## Layered Request Flow

```text
HTTP Request
  -> Middleware stack
  -> Route handler
  -> Service layer
  -> Model layer
  -> Prisma client
  -> PostgreSQL
```

## App Bootstrap and Middleware

`src/config/server.ts` configures Express and mounts all `/api/v1/*` routes.

Typical middleware pipeline:

- CORS + JSON parsing + pino HTTP logging
- Rate limiting
- Authentication (`authenticate` / `optionalAuthenticate`)
- Role checks (`requireRole`)
- Validation (Zod)
- Global error handler (last)

## Route Organization

All routes are grouped in `src/routes` and mounted under `/api/v1`.

- `/health` -> `health.ts`
- `/auth` -> `auth.ts`
- `/players` -> `players.ts`
- `/teams` -> `teams.ts`
- `/games` -> `games.ts`
- `/games/:gameId/participants` -> `participants.ts`
- `/tournaments` -> `tournaments.ts`
- `/statistics` -> `statistics.ts`
- `/profile` -> `profile.ts`
- `/admin/users` -> `users.ts`
- `/onboarding` -> `onboarding.ts`
- `/playgrounds` -> `playgrounds.ts`
- `/address` -> `address.ts`
- `/import` -> `import.ts`

## Handler Pattern (Controller-in-Route)

This project does not use a separate controller layer. Route files contain the handlers directly:

- Parse/validate input (Zod)
- Call service methods
- Return JSON response
- Forward errors to `next(err)`

## Service Layer

Business logic lives in `src/services`.

Main services include:

- `AuthService`
- `UserService`
- `UserApprovalService`
- `PlayerService`
- `GameService`
- `ParticipationService`
- `TournamentService`
- `StatisticsService`
- `ProfileService`
- `PlaygroundService`
- `OpponentTeamService`
- `AddressSearchService`
- `OnboardingService`
- `CsvImportService`

## Model Layer

Data access wrappers in `src/models` encapsulate Prisma operations:

- `User`
- `Player`
- `Game`
- `GameParticipant`
- `Tournament`
- `Playground`
- `OpponentTeam`
- `Statistics`

## Prisma and Database Access

- Prisma client singleton is defined in `src/config/database.ts`.
- Services/models import this shared client directly.
- This forms the persistence path: Service -> Model -> Prisma.

## Background Jobs

- `src/jobs/game-status-transitions.ts` runs on startup and then every 5 minutes.
- Purpose: transition game statuses automatically based on time and rules.

## Supporting Utilities and Config

Utilities (`src/utils`):

- `logger.ts` (Pino)
- `error-codes.ts`
- `object-storage.ts`
- `slug.ts`

Config (`src/config`):

- `env-validation.ts`
- `auth.ts`
- `redis.ts`
- `database.ts`

## Suggested Lucidchart Blocks

For the diagram, model these components:

1. API Entry (`main.ts`)
2. Express App (`config/server.ts`)
3. Middleware Layer
4. Route Layer (`routes/*`)
5. Service Layer (`services/*`)
6. Model Layer (`models/*`)
7. Prisma Client (`config/database.ts`)
8. PostgreSQL
9. External Systems (Redis, Object Storage, Address API)
10. Background Jobs (`jobs/*`)
