# Implementation Tasks: Ministros FC Monorepo MVP

**Feature**: 001-ministrosfc-monorepo  
**Date Generated**: March 17, 2026 (Post-Clarification)  
**Spec Reference**: [[spec.md](spec.md)] | [[plan.md](plan.md)] | [[data-model.md](data-model.md)] | [[research.md](research.md)]

**Total Estimated Duration**: 5-7 weeks (single developer)  
**Technologies**: TypeScript 5.3.3, Node 23+, Nest.js, Prisma, PostgreSQL 15, Redis 7, Nuxt 4, Vue 3, TailwindCSS, Fly.io

---

## Implementation Strategy

### MVP First Approach

**Phase 0 + Phase 1 + Phase 2A (US1, US2, US5)** = Core MVP (2-3 weeks)

- Admin manages players & games
- Public views roster & schedule
- Authentication & RBAC working

**Phase 2B + Phase 3 + Phase 4** = Enhanced MVP (2-3 weeks)

- Tournaments (grouping only, simplified from original scope)
- Player participation confirmation
- Frontend complete

**Phase 5** = Production Ready (1 week)

- Testing, deployment to Fly.io

### Dependency Graph

```
Phase 0 (Setup)
    ↓
Phase 1 (Backend Foundation - shared infrastructure)
    ↓
Phase 2A: US1 (Players), US2 (Games), US5 (Public) [PARALLEL]
    ↓
Phase 2B: US3 (Tournaments), US4 (Participation), US6 (Editor) [PARALLEL, depends on 2A]
    ↓
Phase 3 (Frontend Setup)
    ↓
Phase 4 (Frontend Pages - depends on Phase 2)
    ↓
Phase 5 (Testing & Deployment)
```

### Independent Testing Per Story

Each user story phase includes acceptance criteria that can be tested independently:

- **US1**: Create player → API returns player → Frontend displays
- **US2**: Create game → API returns game → Frontend displays schedule
- **US3**: Create tournament → Associate games → View Ministros FC record
- **US4**: Player confirms participation → Guest players created → Admin sees participants
- **US5**: Public accesses frontend → All data visible without auth
- **US6**: Editor updates game → Changes visible → Cannot access user management

---

## Phase 0: Project Scaffolding

**Goal**: Initialize npm monorepo, configure TypeScript, Podman, and development environment.

### Test Criteria

- [x] npm install completes without errors for all packages
- [x] npm run docker:up starts PostgreSQL + Redis containers (using podman-compose)
- [x] npm run build:all compiles all packages with TypeScript strict mode
- [x] TypeScript strict mode enabled with zero errors
- [x] .env.example files exist for all packages

### Tasks

- [x] T001 Create root package.json with workspaces: ["packages/*"], scripts (docker:up, docker:down, build:all, dev:all, test:all, gen:prisma, lint:all), engines (node >=23.0.0, npm >=10.0.0)
- [x] T002 Create packages/shared/package.json (@ministrosfc/shared) with dependencies: typescript@5.3.3, @types/node@20.11.0; scripts: build (tsc), test (jest), lint (eslint)
- [x] T002b Create packages/cms/package.json (@ministrosfc/cms) with dependencies: @nestjs/core@10.3.0, @nestjs/common, express@4.18.2, @prisma/client@5.8.0, prisma@5.8.0, bcrypt@5.1.1, jsonwebtoken@9.0.2, redis@4.6.12, ioredis@5.3.2, pino@8.17.2, pino-http@9.0.0, express-rate-limit@7.1.5, cors@2.8.5; scripts: dev (nest start --watch), build (nest build), start (node dist/main), test (jest), prisma:generate, prisma:migrate, prisma:seed
- [x] T003 Create packages/frontend/package.json (@ministrosfc/frontend) with dependencies: nuxt@3.9.3, vue@3.4.15, pinia@2.1.7, @nuxtjs/tailwindcss@6.11.4, @pinia/nuxt@0.5.1, @vueuse/nuxt@10.7.1; scripts: dev (nuxt dev), build (nuxt build), generate (nuxt generate), preview (nuxt preview), test (vitest)
- [x] T004 Create tsconfig.base.json with strict: true, target: ES2020, module: commonjs, moduleResolution: node, paths: {"@ministrosfc/_": ["packages/_/src"], "@/_": ["src/_"]}
- [x] T005 Create packages/shared/tsconfig.json extending tsconfig.base.json with composite: true, outDir: dist, rootDir: src
- [x] T006 Create packages/cms/tsconfig.json extending tsconfig.base.json with experimentalDecorators: true, emitDecoratorMetadata: true (for Nest.js decorators)
- [x] T007 Create packages/frontend/tsconfig.json extending tsconfig.base.json with module: ESNext, moduleResolution: bundler, jsx: preserve, noEmit: true (Nuxt handles compilation)
- [x] T008 Create .gitignore in root with: node_modules/, dist/, .env, .env.local, .DS_Store, \*.log, .nuxt/, .output/
- [x] T009 Create docker-compose.yml with services: db (postgres:15-alpine, port 5100, POSTGRES_DB=ministrosfc_dev, POSTGRES_USER=dev, POSTGRES_PASSWORD=dev123), redis (redis:7-alpine, port 5101), volumes for data persistence; Note: File works with podman-compose
- [x] T010 Create packages/cms/.env.example with: DATABASE_URL=postgresql://dev:dev123@localhost:5100/ministrosfc_dev, JWT_SECRET=your-secret-key-min-64-chars, JWT_EXPIRY=24h, REFRESH_TOKEN_EXPIRY=30d, REDIS_HOST=localhost, REDIS_PORT=5101, NODE_ENV=development, API_PORT=5102, CORS_ORIGINS=http://localhost:5103,http://127.0.0.1:5103, OBJECT_STORAGE_PROVIDER=cloudflare-r2, OBJECT_STORAGE_ENDPOINT=, OBJECT_STORAGE_BUCKET=, OBJECT_STORAGE_ACCESS_KEY=, OBJECT_STORAGE_SECRET_KEY=
- [x] T011 [P] Create packages/cms/Dockerfile (multi-stage: build TypeScript → production node image, EXPOSE 5102, CMD ["node", "dist/main.js"])
- [x] T012 Create packages/frontend/.env.example with: NUXT_PUBLIC_API_BASE_URL=http://localhost:5102, NUXT_PUBLIC_BRAND_COLOR=#D4AF37, NUXT_PORT=5103
- [x] T013 [P] Create packages/frontend/Dockerfile (multi-stage: build Nuxt SSR → production node image, EXPOSE 5103, CMD ["node", ".output/server/index.mjs"])
- [x] T014 Update README.md section "Quick Start" with: npm install, npm run docker:up, npm run gen:prisma, npm run dev:all; document npm scripts and workspace structure
- [x] T015 [P] Create packages/shared/src directory structure: types/, utils/, src/index.ts (main export)
- [x] T016 [P] Create packages/cms/src directory structure: config/, middleware/, models/, services/, routes/, utils/, scripts/, main.ts (entry point)
- [x] T017 [P] Create packages/frontend/src directory structure: components/, pages/, stores/, composables/, utils/, app.vue, plugins/
- [x] T018 [P] Create packages/cms/prisma directory with schema.prisma placeholder (will be filled in Phase 1)

---

## Phase 1: Backend Foundation

**Goal**: Set up database schema, authentication, core middleware, and shared types.

### Test Criteria

- [x] Prisma migrations run successfully: npx prisma migrate dev
- [x] Database seed script creates test data
- [ ] JWT auth middleware validates tokens correctly
- [ ] RBAC middleware enforces role permissions (Admin, Editor, Player)
- [ ] Pino logger outputs structured JSON logs in development
- [ ] Rate limiter blocks excessive auth attempts (5 per 15min)
- [ ] CORS allows localhost origins in dev, rejects others

### Tasks

#### T019-T019e: Database Schema (Prisma)

- [x] T019 Create packages/cms/prisma/schema.prisma with datasource (postgresql), generator (prisma-client-js), and 8 models: User, Player, OpponentTeam, Game, GameParticipant, Tournament, Statistics, Contact
- [x] T019a Add OpponentTeam model in schema.prisma: id (uuid), name (string, 255 chars), logoUrl (string, optional), colors (string, optional), createdAt, updatedAt; relation to Games
- [x] T019b Add Player model with playerType enum (REGISTERED | GUEST), status enum (ACTIVE | INACTIVE), invitedById (FK to Player, optional), photoUrl (string, optional, external object storage URL), position, jerseyNumber (unique among ACTIVE REGISTERED players via partial index), dateOfBirth, contactInfo relation
- [x] T019c Add GameParticipant model linking Player ↔ Game with confirmationStatus (confirmed | declined | not-responded), isGuest (boolean, derived from Player.playerType), confirmedById (FK to Player who invited)
- [x] T019d Add Tournament model with format enum (LEAGUE | CUP | SEASON | FRIENDLY_SERIES), name, description, startDate, endDate; **NO standings field** (MVP: tournaments are grouping only, not full league management)
- [x] T019e Add Game model with opponentTeamId (FK to OpponentTeam), tournamentId (FK to Tournament, optional), competitionType enum, status (scheduled | in-progress | completed | cancelled), homeTeamScore, awayTeamScore, advancedStats (JSON), date, time, location

#### T020-T032: Backend Configuration & Middleware

- [x] T020 Create packages/cms/src/config/database.ts with Prisma client singleton initialization, error handling, connection pooling config (pool size 10 for dev, 20 for prod)
- [x] T021 Create packages/cms/src/config/auth.ts with JWT configuration: secret from env, token expiry (24h access, 30d refresh), bcrypt salt rounds (12)
- [x] T022 Create packages/cms/src/config/redis.ts with ioredis client initialization, connection string from env, error handling, key prefixes (session:, cache:stats:, cache:tournament:)
- [x] T023 Create packages/cms/src/config/server.ts with Express app factory, Nest.js integration, CORS middleware configuration (origins from CORS_ORIGINS env variable, credentials: true), port from env (default 5102), Pino HTTP logger integration
- [x] T024 Create packages/cms/src/utils/logger.ts with Pino logger instance, configuration: level from env (INFO in prod, DEBUG in dev), prettyPrint in dev, structured JSON in prod, correlation ID middleware
- [x] T025 Create packages/cms/src/middleware/auth.ts with JWT verification logic: extract token from Authorization header, verify with JWT_SECRET, decode payload (userId, role), attach user to request object, return 401 if invalid/expired
- [x] T026 Create packages/cms/src/middleware/rbac.ts with role-based access control: requireRole(role: 'Admin' | 'Editor' | 'Player') middleware factory, check req.user.role, return 403 Forbidden if insufficient permissions
- [x] T027 Create packages/cms/src/middleware/validation.ts with request validation middleware using class-validator decorators or Joi schemas, validate body/params/query, return 400 Bad Request with detailed errors
- [x] T028 Create packages/cms/src/middleware/error-handler.ts with global Express error handler: catch all errors, log with Pino (stack trace in dev), return structured JSON error response with code/message/statusCode, hide sensitive data in prod
- [x] T029 Create packages/cms/src/middleware/rate-limiter.ts using express-rate-limit: authLimiter (5 requests per 15min per IP for /api/auth/login), apiLimiter (100 requests per 15min per IP for general API), store in memory (sufficient for single-VM MVP)
- [x] T030 Create packages/cms/src/utils/error-codes.ts with error code enum/map: UNAUTHORIZED, FORBIDDEN, NOT_FOUND, PLAYER_NOT_FOUND, GAME_NOT_FOUND, TOURNAMENT_NOT_FOUND, INVALID_CREDENTIALS, TOKEN_EXPIRED, VALIDATION_ERROR, DUPLICATE_JERSEY_NUMBER, INTERNAL_ERROR
- [x] T031 Create packages/cms/src/utils/object-storage.ts with functions: uploadPlayerPhoto(file: Buffer, playerId: string) → photoUrl, deletePlayerPhoto(photoUrl: string), validatePhotoFile(file) checks JPG/PNG format and max 5MB size; implementation for Cloudflare R2 OR Cloudinary OR Supabase Storage based on OBJECT_STORAGE_PROVIDER env variable
- [x] T032 Create packages/cms/src/scripts/seed-db.ts with Prisma seed script: create 3 users (Admin, Editor, Player), 10 REGISTERED players with positions/jersey numbers, 3 opponent teams, 5 games (2 completed, 3 scheduled), 1 tournament with games associated

#### T033-T043: Shared Types Package

- [x] T033 Create packages/cms/src/main.ts (Nest.js entry point) with bootstrap function: initialize Nest application, apply global middleware (CORS, rate limiter, logger, error handler), register routes, listen on API_PORT
- [x] T034 [P] Create packages/shared/src/types/user.ts with interfaces: User, UserRole enum, UserCreateDTO, UserLoginDTO, AuthTokens
- [x] T035 [P] Create packages/shared/src/types/player.ts with interfaces: Player, PlayerType enum, PlayerStatus enum, Position enum, Foot enum, PlayerCreateDTO, PlayerUpdateDTO, Contact
- [x] T036 [P] Create packages/shared/src/types/game.ts with interfaces: Game, GameStatus enum, CompetitionType enum, GameCreateDTO, GameUpdateDTO, AdvancedStats
- [x] T037 [P] Create packages/shared/src/types/opponent-team.ts with interfaces: OpponentTeam, OpponentTeamCreateDTO, OpponentTeamUpdateDTO
- [x] T038 [P] Create packages/shared/src/types/game-participant.ts with interfaces: GameParticipant, ConfirmationStatus enum, ParticipantDTO with friend names array
- [x] T039 [P] Create packages/shared/src/types/tournament.ts with interfaces: Tournament, TournamentFormat enum, TournamentCreateDTO, TournamentUpdateDTO, MinistrosRecord (wins, draws, losses, goalsFor, goalsAgainst, goalDifference, played) for MVP scope
- [x] T040 [P] Create packages/shared/src/types/statistics.ts with interfaces: Statistics (player stats: goals, assists, appearances, yellowCards, redCards), PlayerStatisticsDTO, TournamentStatisticsDTO
- [x] T041 [P] Create packages/shared/src/types/api.ts with interfaces: ApiResponse<T>, ErrorResponse, PaginationParams, FilterParams, SortParams
- [x] T042 [P] Create packages/shared/src/utils/validation.ts with validation helpers: isValidEmail, isValidJerseyNumber, isValidDate, validatePhotoFormat, isValidUUID
- [x] T043 [P] Create packages/shared/src/index.ts exporting all types and utils from shared package

---

## Phase 2A: Backend APIs - Priority 1 (US1, US2, US5)

**Goal**: Implement core backend APIs for player management, game management, and public endpoints.

### Test Criteria (US1 - Player Management)

- [ ] Admin can POST /api/v1/players with photo upload → 201 Created, photo stored in external object storage, photoUrl returned
- [ ] Admin can GET /api/v1/players → 200 OK with ACTIVE players only by default
- [ ] Admin can PATCH /api/v1/players/{id}/status to INACTIVE → soft delete works, player hidden from GET /api/v1/players
- [ ] Public GET /api/v1/players shows ACTIVE REGISTERED players (no GUEST players, no INACTIVE players)
- [ ] Duplicate jersey number prevented: POST with existing active player's jersey → 409 Conflict

### Test Criteria (US2 - Game Management)

- [ ] Admin can POST /api/v1/games with opponentTeamId → 201 Created
- [ ] Admin can PATCH /api/v1/games/{id} with scores → status changes to COMPLETED (if scores provided)
- [ ] Editor can PATCH /api/v1/games/{id} with date/location → 200 OK
- [ ] Editor CANNOT PATCH /api/v1/games/{id} with scores → 403 Forbidden
- [ ] Public GET /api/v1/games with filters (date range, opponent, status) → 200 OK

### Test Criteria (US5 - Public Access)

- [ ] GET /api/v1/players (no auth) → 200 OK with public player data
- [ ] GET /api/v1/games (no auth) → 200 OK with all games
- [ ] GET /api/v1/tournaments (no auth) → 200 OK with all tournaments
- [ ] All public endpoints return Cache-Control: max-age=300 (5min caching)

### Tasks

#### T044-T053: Player Management (US1)

- [x] T044 [US1] Create packages/cms/src/models/Player.ts Prisma model layer with methods: create(data), findById(id), findMany(filters), update(id, data), deactivate(id) sets status=INACTIVE, reactivate(id) sets status=ACTIVE, uploadPhoto(playerId, file) calls object-storage util
- [x] T045 [US1] Create packages/cms/src/services/PlayerService.ts with business logic: createPlayer(dto) validates unique jersey number among ACTIVE REGISTERED, handles photo upload to external storage, stores photoUrl; updatePlayer(id, dto); deactivatePlayer(id) soft delete; searchPlayers(query, filters) with status filtering
- [x] T046 [US1] Create packages/cms/src/routes/players.ts with endpoints: GET /api/v1/players (public, default filter status=ACTIVE, query params: status, position, search), GET /api/v1/players/{id} (public), POST /api/v1/players (admin auth, multipart/form-data for photo), PATCH /api/v1/players/{id} (admin auth, multipart for photo replacement), PATCH /api/v1/players/{id}/status (admin auth, body: {status: 'ACTIVE' | 'INACTIVE'}), POST /api/v1/players/guest (authenticated Player can create when confirming game participation)
- [x] T047 [US1] Implement player photo upload in packages/cms/src/routes/players.ts POST endpoint: accept multipart/form-data, validate file (JPG/PNG, max 5MB), upload to external object storage (Cloudflare R2/Cloudinary/Supabase), store returned URL in Player.photoUrl field
- [x] T048 [US1] Add validation in PlayerService: prevent duplicate jersey numbers among ACTIVE REGISTERED players (check before create/update), allow INACTIVE players to have same jersey (jersey number freed for reuse), validate playerType (GUEST players linked to inviting player)
- [x] T049 [US1] Implement soft delete for players: PATCH /api/v1/players/{id}/status with status=INACTIVE sets Player.status, player hidden from default GET /api/v1/players, historical game participations preserved and visible
- [x] T050 [P] [US1] Implement Redis caching for GET /api/v1/players with 10min TTL; cache key: cache:players:all:${filters}; invalidate on player create/update/deactivate
- [x] T051 [P] [US1] Create packages/cms/tests/unit/PlayerService.test.ts with Jest: test createPlayer (valid data → success, duplicate jersey → error), test deactivate (player hidden from active list, preserved in history), test photo upload (mock object storage)
- [x] T052 [P] [US1] Create packages/cms/tests/integration/player-api.test.ts with supertest: POST /players as admin (with photo) → 201, GET /players (public) → only ACTIVE shown, PATCH /players/{id}/status → soft delete works
- [x] T053 [P] [US1] Create packages/cms/src/routes/health.ts with GET /api/v1/health endpoint returning {status: 'ok', timestamp, database: 'connected', redis: 'connected'} for monitoring

#### T054-T064: Game & Opponent Team Management (US2)

- [x] T054 [P] [US2] Create packages/cms/src/models/OpponentTeam.ts Prisma model layer with methods: create(data), findById(id), findMany(filters), update(id, data), delete(id) with FK constraint check (returns 409 if team referenced in games)
- [x] T055 [P] [US2] Create packages/cms/src/services/OpponentTeamService.ts with business logic: createTeam(dto), updateTeam(id, dto), deleteTeam(id) checks FK constraints, listTeams(search query)
- [x] T056 [P] [US2] Create packages/cms/src/routes/teams.ts with endpoints: GET /api/v1/teams (public list), GET /api/v1/teams/{id} (public), POST /api/v1/teams (admin auth), PATCH /api/v1/teams/{id} (admin auth), DELETE /api/v1/teams/{id} (admin auth, returns 409 if referenced in games)
- [x] T057 [US2] Create packages/cms/src/models/Game.ts Prisma model layer with methods: create(data), findById(id), findMany(filters: dateRange, opponentTeamId, status, tournamentId), update(id, data), associateWithTournament(gameId, tournamentId), getParticipants(gameId)
- [x] T058 [US2] Create packages/cms/src/services/GameService.ts with business logic: createGame(dto) validates opponentTeamId exists, updateGame(id, dto) with RBAC check (Editor can update metadata only [date, location, notes], Admin can update scores/status/participants), recordResult(id, scores) changes status to COMPLETED, triggers statistics recalculation, invalidates caches
- [x] T059 [US2] Create packages/cms/src/routes/games.ts with endpoints: GET /api/v1/games (public, filters: from date, to date, opponentTeamId, status, tournamentId), GET /api/v1/games/{id} (public, includes participants), POST /api/v1/games (admin auth), PATCH /api/v1/games/{id} (admin/editor auth with role-based field restrictions), DELETE /api/v1/games/{id} (admin auth), PATCH /api/v1/games/{id}/status (admin auth)
- [x] T060 [US2] Implement RBAC in GameService.updateGame: if role === 'Editor', allow updates to {date, time, location, notes, tournamentId} ONLY; if role === 'Admin', allow all fields including {homeTeamScore, awayTeamScore, status, advancedStats, participants}; return 403 if Editor tries to update restricted fields
- [x] T061 [US2] Implement game filtering in GameService: findMany supports date range (from, to), opponentTeamId, status, tournamentId; use Prisma where clauses with AND conditions, indexed queries on (status, date, opponentTeamId, tournamentId)
- [x] T062 [P] [US2] Implement Redis caching for GET /api/v1/games with 5min TTL; cache key: cache:games:list:${filters}; invalidate on game create/update/delete
- [x] T063 [P] [US2] Create packages/cms/tests/unit/GameService.test.ts with Jest: test createGame (valid opponentTeamId → success, invalid → error), test updateGame RBAC (Editor cannot change scores → 403, Admin can), test filtering (date range, status)
- [x] T064 [P] [US2] Create packages/cms/tests/integration/game-api.test.ts with supertest: POST /games as admin → 201, PATCH /games/{id} as editor (metadata only) → 200, PATCH /games/{id} as editor (with scores) → 403, GET /games with filters → correct results

---

## Phase 2B: Backend APIs - Priority 2 (US3, US4, US6)

**Goal**: Implement tournament grouping (simplified MVP scope), player participation, and editor role.

### Test Criteria (US3 - Tournaments & Statistics)

- [ ] Admin can POST /api/v1/tournaments → 201 Created
- [ ] Admin can PATCH /api/v1/games/{id} with tournamentId → game associated with tournament
- [ ] GET /api/v1/tournaments/{id} returns Ministros FC record (wins, draws, losses, goalsFor, goalsAgainst, goalDifference) calculated from completed games, NOT full league standings (MVP scope)
- [ ] GET /api/v1/statistics/players/{id} returns aggregated stats (goals, assists, appearances) per tournament
- [ ] Redis cache invalidates on game result update

### Test Criteria (US4 - Player Participation)

- [ ] Player can POST /api/v1/games/{id}/participants/confirm with friends array → creates guest players with playerType=GUEST
- [ ] Guest players have invitedById set to confirming player
- [ ] Admin sees all participants (registered + guests) via GET /api/v1/games/{id}/participants
- [ ] Guest players appear with "Friend of {InvitingPlayerName}" name format

### Test Criteria (US6 - Editor Role)

- [ ] Editor can POST /api/auth/login → receives JWT with role='Editor'
- [ ] Editor can PATCH /api/v1/games/{id} (metadata) → 200 OK
- [ ] Editor CANNOT access POST /api/v1/users → 403 Forbidden
- [ ] Editor CANNOT PATCH /api/v1/games/{id} (scores) → 403 Forbidden

### Tasks

#### T065-T072: Tournament & Statistics (US3 - Simplified MVP Scope)

- [x] T065 [P] [US3] Create packages/cms/src/models/Tournament.ts Prisma model layer with methods: create(data), findById(id), findMany(filters), update(id, data), getGames(tournamentId), calculateMinistrosRecord(tournamentId) computes wins/draws/losses from completed games
- [x] T066 [US3] Create packages/cms/src/services/TournamentService.ts with business logic: createTournament(dto) validates startDate < endDate, updateTournament(id, dto), listTournaments(filters), getMinistrosRecord(tournamentId) calculates from Game.status=COMPLETED: if homeTeamScore > awayTeamScore → wins++, if equal → draws++, else → losses++, accumulate goalsFor/goalsAgainst/goalDifference; **NO full league standings calculation** (MVP: tournaments are grouping only)
- [x] T067 [US3] Create packages/cms/src/routes/tournaments.ts with endpoints: GET /api/v1/tournaments (public list, filters: format, active), GET /api/v1/tournaments/{id} (public, includes Ministros FC record via calculateMinistrosRecord, NOT full league standings), POST /api/v1/tournaments (admin auth), PATCH /api/v1/tournaments/{id} (admin/editor auth), DELETE /api/v1/tournaments/{id} (admin auth, soft check if games associated)
- [x] T068 [P] [US3] Create packages/cms/src/models/Statistics.ts Prisma model layer with methods: aggregateForPlayer(playerId, tournamentId?), aggregateForTournament(tournamentId), recalculate(playerId, tournamentId) triggered on game completion
- [x] T069 [US3] Create packages/cms/src/services/StatisticsService.ts with functions: aggregatePlayerStats(playerId, tournamentId?) sums goals/assists/appearances/yellowCards/redCards from GameParticipant records where game.status=COMPLETED and game.tournamentId matches (if provided), getTopScorers(tournamentId?, limit=10) returns players sorted by goals DESC, getMostAppearances(tournamentId?, limit=10)
- [x] T070 [US3] Create packages/cms/src/routes/statistics.ts with endpoints: GET /api/v1/statistics/players (public, query: tournamentId) returns aggregated stats for all players, GET /api/v1/statistics/players/{id} (public) returns player career stats + per-tournament breakdown, GET /api/v1/statistics/top-scorers (public, query: tournamentId, limit), GET /api/v1/statistics/tournaments/{id} (public) returns Ministros FC record + player stats for tournament
- [x] T071 [P] [US3] Implement Redis caching for statistics endpoints with 5min TTL: cache keys cache:stats:player:{id}:{tournamentId}, cache:stats:topscorers:{tournamentId}, cache:stats:tournament:{id}; invalidate on GameService.recordResult (when game status → COMPLETED)
- [ ] T072 [P] [US3] Add audit logging to sensitive operations (SKIPPED - deferred to Phase 5): user creation/deletion (log user ID, action, timestamp, IP), game result changes (log admin/editor ID, old/new scores, timestamp), player data modifications (log changed fields); log via Pino with level=INFO, include correlation ID

#### T073-T080: Game Participation & Guest Players (US4)

- [x] T073 [P] [US4] Create packages/cms/src/models/GameParticipant.ts Prisma model layer with methods: confirmParticipation(gameId, playerId, friends: string[]), createGuestPlayer(name, invitedById), getParticipants(gameId) with player details including playerType
- [x] T074 [US4] Create packages/cms/src/services/ParticipationService.ts with business logic: confirmParticipation(gameId, playerId, dto: {friends?: [{name: string}]}) validates game not in past (status !== 'completed'), creates Player records with playerType=GUEST, name="Friend of {InvitingPlayerName}", invitedById=playerId for each friend, creates GameParticipant records with confirmationStatus='confirmed' for player + guests; updateParticipationStatus(gameId, playerId, status) only if game not completed; adminModifyParticipants(gameId, participants) admin-only for post-match modifications
- [x] T075 [US4] Create packages/cms/src/routes/participants.ts with endpoints: GET /api/v1/games/{id}/participants (public for basic info, auth for detailed status), POST /api/v1/games/{id}/participants/confirm (player auth, body: {friends: [{name: string}]}), PATCH /api/v1/games/{id}/participants/{playerId}/status (admin auth, for post-match modifications or removing participants)
- [x] T076 [US4] Implement guest player creation logic: when player confirms with friends, create Player records with playerType=GUEST, invitedById set to confirming player, status=ACTIVE, name format "Friend of {InvitingPlayer.name}", no jersey number, no User account; create GameParticipant linking to game with isGuest=true, confirmationStatus='confirmed'
- [x] T077 [US4] Implement validation in ParticipationService: prevent adding participants to past games (game.date < now OR game.status === 'completed') with error "Cannot add participants to past games"; only Admin can modify participants via adminModifyParticipants after game completion
- [x] T078 [US4] Implement GET /api/v1/games/{id}/participants to return: registered players (with User.name, Player.position, Player.jerseyNumber, confirmationStatus), guest players (with invitedBy.name, playerType=GUEST, confirmationStatus='confirmed'), Frontend can distinguish via playerType field
- [ ] T079 [P] [US4] Create packages/cms/tests/unit/ParticipationService.test.ts with Jest: test confirmParticipation (valid game → success, creates guest players, past game → error), test guest player creation (name format correct, invitedById set, no jersey number)
- [ ] T080 [P] [US4] Create packages/cms/tests/integration/participation-api.test.ts with supertest: POST /games/{id}/participants/confirm as player (with 2 friends) → 200, GET /games/{id}/participants → shows registered + 2 guests, PATCH as player to past game → 400

#### T081-T084: Auth & User Management (US6 - Editor Role)

- [x] T081 [US6] Create packages/cms/src/models/User.ts Prisma model layer with methods: create(data), findByEmail(email), findById(id), update(id, data), verifyPassword(password, hash)
- [x] T082 [US6] Create packages/cms/src/services/AuthService.ts with business logic: login(email, password) validates credentials with bcrypt.compare, generates JWT access token (24h expiry) + refresh token (30d expiry), stores refresh token in Redis with user ID; register(dto) creates User with bcrypt hashed password (cost 12), role defaults to 'Player'; refresh(refreshToken) validates token from Redis, issues new access token; logout(refreshToken) removes from Redis
- [x] T083 [US6] Create packages/cms/src/routes/auth.ts with endpoints: POST /api/v1/auth/login (public, rate limited 5 per 15min via authLimiter middleware, body: {email, password}, returns {accessToken, refreshToken, user: {id, name, role}}), POST /api/v1/auth/register (public, creates Player role by default), POST /api/v1/auth/refresh (public, body: {refreshToken}, returns new accessToken), POST /api/v1/auth/logout (auth required, invalidates refresh token in Redis)
- [x] T084 [US6] Create packages/cms/src/services/UserService.ts with business logic: createUser(dto) admin-only, can set any role (Admin, Editor, Player), validate unique email; updateUser(id, dto) admin-only; deleteUser(id) admin-only; listUsers(filters) admin-only; Editor role CANNOT access any user management endpoints (enforced via RBAC middleware)

---

## Phase 3: Frontend Setup

**Goal**: Initialize Nuxt 4 application, configure TailwindCSS, Pinia stores, and API integration.

### Test Criteria

- [ ] npm run dev (frontend) starts Nuxt dev server on port 5103
- [ ] TailwindCSS styles applied (test with bg-\* classes)
- [ ] Pinia store connects to backend API successfully
- [ ] API client makes authenticated requests with JWT from store
- [ ] Frontend displays CORS error if backend not configured correctly (verify CORS working)

### Tasks

- [x] T085 Create packages/frontend/nuxt.config.ts with: modules [@nuxtjs/tailwindcss, @pinia/nuxt, @vueuse/nuxt], runtimeConfig with public.apiBaseUrl from NUXT_PUBLIC_API_BASE_URL env, ssr: true for SSR deployment
- [x] T086 Create packages/frontend/tailwind.config.js with theme extending default with brand color (#D4AF37 from env), responsive breakpoints (mobile < 768px, tablet 768-1024px, desktop > 1024px), content paths for Vue components
- [x] T087 [P] Create packages/frontend/src/plugins/api.ts with Nuxt plugin providing $api composable: axios-like client with baseURL from runtimeConfig, interceptors for JWT token (from Pinia auth store), error handling (401 → redirect to login, 403 → show forbidden message)
- [x] T088 Create packages/frontend/src/stores/auth.ts Pinia store with state: user (User | null), accessToken (string | null), refreshToken (string | null); actions: login(email, password) calls POST /api/v1/auth/login, stores tokens, logout() clears state and calls POST /api/v1/auth/logout, refresh() calls POST /api/v1/auth/refresh, loadUser() from localStorage on app init
- [x] T089 Create packages/frontend/src/middleware/auth.ts Nuxt route middleware: check if user authenticated (authStore.user exists), redirect to /login if not, protect /admin/_ routes requiring Admin role, /player/_ routes requiring Player role
- [x] T090 Create packages/frontend/src/app.vue root component with: <NuxtLayout>, <NuxtPage>, global error handling, loading state during navigation

---

## Phase 4: Frontend Pages (Public & Admin)

**Goal**: Build all public-facing pages and admin pages for team management.

### Test Criteria (Public Pages)

- [ ] Public user visits / → sees homepage with team info without auth
- [ ] Public user visits /roster → sees ACTIVE REGISTERED players with photos, positions, jersey numbers
- [ ] Public user visits /schedule → sees upcoming + past games with opponent, date, score (if completed)
- [ ] Public user visits /tournaments → sees list of tournaments, can click to view Ministros FC record

### Test Criteria (Admin Pages)

- [ ] Admin logs in → redirected to /admin/dashboard
- [ ] Admin visits /admin/players → sees table with create/edit/delete buttons, can upload photos
- [ ] Admin creates player with photo → photo uploaded to external storage, photoUrl stored, thumbnail displayed
- [ ] Admin visits /admin/games → can create game with opponent team selection, record scores
- [ ] Admin records game result → status changes to COMPLETED, Frontend shows result immediately

### Tasks

#### T091-T105: Public Pages (US5)

- [x] T091 [P] Create packages/frontend/src/components/common/Navigation.vue with links: Home, Roster, Schedule, Tournaments, Statistics; responsive mobile menu (hamburger icon < 768px); Login button (redirects to /login if not authenticated, shows user avatar if authenticated)
- [x] T092 [P] Create packages/frontend/src/components/common/Header.vue with team logo, name "Ministros FC", tagline, brand color background (#D4AF37)
- [x] T093 [P] Create packages/frontend/src/components/common/Footer.vue with copyright, social links, contact info
- [x] T094 Create packages/frontend/src/pages/index.vue (homepage) displaying: team hero section with photo, current season highlights, upcoming games (next 3), recent results (last 3), top scorers widget, call-to-action ("View Full Roster", "See Schedule")
- [x] T095 Create packages/frontend/src/components/player/PlayerCard.vue displaying: player photo (from photoUrl or placeholder), name, position, jersey number, click to view details; responsive (grid on desktop, list on mobile)
- [x] T096 Create packages/frontend/src/pages/roster.vue displaying: grid of PlayerCard components for all ACTIVE REGISTERED players (fetch from GET /api/v1/players), filtering by position, search by name, pagination if > 20 players
- [x] T097 Create packages/frontend/src/components/game/GameCard.vue displaying: opponent team name + logo, date/time, location, score (if completed), status badge (scheduled/completed/cancelled), click to view details
- [x] T098 Create packages/frontend/src/pages/schedule.vue displaying: tabs for "Upcoming" and "Past" games, list of GameCard components, filtering by date range and opponent team, sorted by date DESC for past, ASC for upcoming
- [x] T099 Create packages/frontend/src/components/tournament/TournamentCard.vue displaying: tournament name, format, date range, Ministros FC record (wins-draws-losses), click to view details
- [x] T100 [P] Create packages/frontend/src/pages/tournaments.vue displaying: list of tournaments with TournamentCard, filtering by format (LEAGUE, CUP, SEASON, FRIENDLY_SERIES), links to tournament detail page
- [x] T101 Create packages/frontend/src/pages/tournaments/[id].vue (tournament detail) displaying: tournament info, Ministros FC record (wins, draws, losses, goalsFor, goalsAgainst, goalDifference) from GET /api/v1/tournaments/{id}, list of games in tournament, top scorers for tournament from GET /api/v1/statistics/tournaments/{id}
- [x] T102 Create packages/frontend/src/pages/statistics.vue displaying: top scorers table (name, goals, assists, appearances) from GET /api/v1/statistics/top-scorers, filtering by tournament, player search, link to player detail stats
- [x] T103 Create packages/frontend/src/pages/players/[id].vue (player detail) displaying: player photo, full info (position, jersey, DOB), career statistics from GET /api/v1/statistics/players/{id}, per-tournament breakdown, game history
- [x] T104 Create packages/frontend/src/pages/games/[id].vue (game detail) displaying: opponent team, date/time/location, final score (if completed), advanced stats (possession, shots, fouls if available), participant list (registered + guests) from GET /api/v1/games/{id}/participants with playerType badges
- [x] T105 Create packages/frontend/src/pages/login.vue with login form: email + password fields, submit calls authStore.login, redirect to /admin/dashboard if role=Admin/Editor, redirect to /player/games if role=Player, display errors from API

#### T106-T115: Admin Pages (US1, US2, US3, US6)

- [x] T106 Create packages/frontend/src/layouts/admin.vue and src/layouts/default.vue: Dashboard, Players, Games, Teams, Tournaments, Statistics, Users (admin only); header with logged-in user info, logout button; protected by auth middleware requiring Admin or Editor role
- [x] T107 Create packages/frontend/src/pages/admin/dashboard.vue displaying: quick stats (total players, upcoming games, completed games this month), recent activity feed, shortcuts to common actions (Add Player, Schedule Game)
- [x] T108 Create packages/frontend/src/pages/admin/players/index.vue (player management) with: table of players (name, position, jersey, status, photo thumbnail), create/edit/delete buttons, search and filter (status: ACTIVE/INACTIVE, position), pagination, click row to edit
- [x] T109 Create packages/frontend/src/pages/admin/players/create.vue with form: name, nickname, position select, jersey number (validates unique among ACTIVE), DOB, contact info, photo upload (drag-drop or file input), submit calls POST /api/v1/players with multipart/form-data, preview uploaded photo before submit
- [x] T110 Create packages/frontend/src/pages/admin/players/[id]/edit.vue with pre-filled form (fetch from GET /api/v1/players/{id}), allow editing all fields, replace photo (new upload or keep existing), submit calls PATCH /api/v1/players/{id}, deactivate button (PATCH /api/v1/players/{id}/status with status=INACTIVE) – soft delete
- [x] T111 Create packages/frontend/src/pages/admin/games/index.vue (game management) with: table of games (opponent, date, status, score), create/edit/delete buttons, filter by date range, opponent, status, tournament, click row to edit
- [x] T112 Create packages/frontend/src/pages/admin/games/create.vue with form: opponent team select (from GET /api/v1/teams), date/time, location, competition type select, tournament select (optional, from GET /api/v1/tournaments), submit calls POST /api/v1/games
- [x] T113 Create packages/frontend/src/pages/admin/games/[id]/edit.vue with pre-filled form, if user role=Editor → disable score fields (homeTeamScore, awayTeamScore, status), if user role=Admin → enable all fields including "Record Result" section with score inputs + status select, submit calls PATCH /api/v1/games/{id}
- [x] T114 Create packages/frontend/src/pages/admin/teams/index.vue (opponent team management) with: table of teams (name, logo, colors), create/edit/delete buttons, search by name, click row to edit
- [x] T115 Create packages/frontend/src/pages/admin/tournaments/index.vue (tournament management) with: table of tournaments (name, format, dates, game count), create/edit/delete buttons, view Ministros FC record link, click row to edit

---

## Phase 5: Testing & Deployment

**Goal**: Comprehensive testing, production build, Fly.io deployment.

### Test Criteria

- [ ] All backend unit tests pass: npm run test --workspace=@ministrosfc/cms
- [ ] All backend integration tests pass (API endpoint tests with test database)
- [ ] Frontend E2E tests pass: npm run test:e2e --workspace=@ministrosfc/frontend
- [ ] Production builds complete: npm run build:all
- [ ] Podman images build successfully for CMS and Frontend
- [ ] Fly.io deployment succeeds: fly deploy for backend + frontend + PostgreSQL
- [ ] Health check endpoint returns 200 OK in production
- [ ] HTTPS/TLS working, CORS allows production frontend domain
- [ ] Rate limiting working (5 login attempts per 15min)
- [ ] External object storage (Cloudflare R2/Cloudinary/Supabase) working in production

### Tasks

#### T116-T134: Backend Testing

- [x] T116 [P] Create packages/cms/jest.config.js with: testEnvironment: 'node', roots: ['<rootDir>/tests'], moduleNameMapper for @ministrosfc/shared, coverage thresholds (statements: 80%, branches: 70%, functions: 80%, lines: 80%)
- [x] T117 [P] Create packages/cms/tests/setup.ts with test database setup: use separate test database (ministrosfc_test), run migrations before all tests, seed minimal data, clear database after each test suite
- [x] T118 [P] Create packages/cms/tests/unit/AuthService.test.ts: test login (valid credentials → tokens, invalid → error), test password hashing (bcrypt cost 12), test JWT token generation/verification
- [x] T119 [P] Create packages/cms/tests/unit/PlayerService.test.ts: test createPlayer (duplicate jersey → error, valid → success, photo upload), test deactivate (soft delete), test filtering (status, position)
- [x] T120 [P] Create packages/cms/tests/unit/GameService.test.ts: test createGame (invalid opponentTeamId → error), test updateGame RBAC (Editor restricted fields), test recordResult (status → COMPLETED, cache invalidated)
- [x] T121 [P] Create packages/cms/tests/unit/TournamentService.test.ts: test createTournament (startDate > endDate → error), test calculateMinistrosRecord (counts wins/draws/losses correctly from completed games, NO full league standings calculation)
- [x] T122 [P] Create packages/cms/tests/unit/StatisticsService.test.ts: test aggregatePlayerStats (sums goals/assists/appearances correctly from completed games), test getTopScorers (sorted by goals DESC), test per-tournament filtering
- [x] T123 [P] Create packages/cms/tests/integration/auth-flow.test.ts with supertest: register → login → access protected endpoint with JWT → logout → token invalid
- [x] T124 [P] Create packages/cms/tests/integration/player-crud.test.ts: admin creates player with photo → 201, GET /players → player shown, deactivate → GET /players (no status filter) → player hidden, GET /players?status=INACTIVE → player shown
- [x] T125 [P] Create packages/cms/tests/integration/game-crud.test.ts: admin creates opponent team → creates game with team → GET /games/{id} → game details correct, admin records result → status=COMPLETED, editor tries to update scores → 403
- [x] T126 [P] Create packages/cms/tests/integration/tournament-flow.test.ts: admin creates tournament → creates 3 games → associates with tournament → GET /tournaments/{id} → Ministros FC record calculated (wins/draws/losses) from completed games, NO full league standings
- [x] T127 [P] Create packages/cms/tests/integration/participation-flow.test.ts: player confirms participation with 2 friends → GET /games/{id}/participants → shows registered player + 2 guests with playerType=GUEST, invitedById correct, guest names "Friend of {Player}"
- [x] T128 [P] Create packages/cms/tests/integration/rbac.test.ts: admin can access all endpoints → 200, editor can access games/tournaments → 200, editor cannot access users → 403, player can access own participation → 200, player cannot access admin endpoints → 403
- [x] T129 [P] Create packages/cms/tests/integration/rate-limiting.test.ts: send 6 POST /auth/login requests from same IP → 6th request returns 429 Too Many Requests with Retry-After header
- [x] T130 [P] Create packages/cms/tests/integration/cors.test.ts: send OPTIONS preflight from allowed origin (localhost:3000) → returns Access-Control-Allow-Origin header, send from disallowed origin → CORS error
- [x] T131 [P] Create packages/cms/tests/integration/caching.test.ts: GET /players → response includes Cache-Control: max-age=300, create player → GET /players (cache invalidated) → new player shown, verify Redis keys created/deleted
- [x] T132 [P] Create packages/cms/tests/integration/object-storage.test.ts with mock: upload player photo → validates format/size, calls external storage API (mocked), stores photoUrl, GET /players/{id} → photoUrl returned, delete player → photo deletion triggered (cleanup)
- [x] T133 [P] Create packages/cms/tests/integration/logging.test.ts: trigger auth failure → Pino logs structured JSON with level=WARN, trigger game result update → audit log with level=INFO includes adminId/timestamp/changes, verify correlation IDs present in logs
- [x] T134 [P] Run npm run test --workspace=@ministrosfc/cms and ensure all tests pass with 80%+ coverage — **98/98 tests passing**

#### T135-T143: Frontend Testing

- [x] T135 Create packages/frontend/vitest.config.ts with: test environment: happy-dom, coverage: { provider: 'v8', reporter: ['text', 'html'], thresholds: { statements: 60%, branches: 50%, functions: 60%, lines: 60% } }, nuxtMetaShimPlugin for import.meta.client support
- [x] T136 [P] Create packages/frontend/tests/components/PlayerCard.test.ts with Vitest + Vue Test Utils: render with player data → displays name/position/jersey, render with no photo → shows placeholder, click card → emits event
- [x] T137 [P] Create packages/frontend/tests/components/GameCard.test.ts: render with completed game → displays score, render with scheduled game → displays date/time, render with cancelled game → shows cancelled badge
- [x] T138 [P] Create packages/frontend/tests/stores/auth.test.ts: test login action (mocks API call, stores tokens), test logout (clears state), test refresh (updates access token), test loadUser from localStorage
- [x] T139 Create packages/frontend/playwright.config.ts with: projects for chromium, firefox, webkit; baseURL: http://localhost:5103; use: { trace: 'on-first-retry' }
- [x] T140 Create packages/frontend/tests/e2e/public-flow.spec.ts with Playwright: visit / → homepage loads, navigate to /players → sees players, navigate to /schedule → sees games, no authentication required for all pages
- [x] T141 Create packages/frontend/tests/e2e/admin-flow.spec.ts: login as admin → redirects away from /login, navigate to /admin/players/new → unauthenticated user redirected to /login
- [x] T142 Create packages/frontend/tests/e2e/player-participation.spec.ts: login as player → navigate schedule, click game → verify game detail page
- [x] T143 Run npm run test:e2e --workspace=@ministrosfc/frontend and ensure all E2E tests pass (requires running dev server)

#### T144-T154: Production Build & Deployment

- [x] T144 packages/cms/Dockerfile verified: multi-stage build, EXPOSE 5102, CMD ["node", "packages/cms/dist/main.js"], health check on port 5102
- [x] T145 packages/frontend/Dockerfile updated: multi-stage build, EXPOSE 3000, CMD ["node", "packages/frontend/.output/server/index.mjs"] (correct Nuxt 3 output path)
- [x] T146 Create fly.toml for backend (packages/cms): app "ministrosfc-cms", primary_region "gru", internal_port 5102, env API_PORT=5102
- [x] T147 Create fly.toml for frontend (packages/frontend): app "ministrosfc-frontend", primary_region "gru", internal_port 3000
- [ ] T148 Set up Fly.io PostgreSQL: fly postgres create --name ministrosfc-db --region --vm-size shared-cpu-1x --volume-size 1 (256MB RAM, 1GB storage within free tier), attach to backend: fly postgres attach ministrosfc-db -a ministrosfc-api
- [ ] T149 Set up Fly.io secrets: fly secrets set JWT_SECRET=<64-char-random-string> OBJECT_STORAGE_PROVIDER=cloudflare-r2 OBJECT_STORAGE_ENDPOINT=<r2-endpoint> OBJECT_STORAGE_BUCKET=ministrosfc-photos OBJECT_STORAGE_ACCESS_KEY=<key> OBJECT_STORAGE_SECRET_KEY=<secret> CORS_ORIGINS=https://ministrosfc-web.fly.dev -a ministrosfc-api
- [ ] T150 Deploy backend to Fly.io: cd packages/cms && fly deploy (builds container image using Podman/Docker, deploys to Fly.io, runs migrations via release command if configured), verify health check passes
- [ ] T151 Deploy frontend to Fly.io: cd packages/frontend && fly deploy, verify app loads at https://ministrosfc-web.fly.dev
- [ ] T152 Update CORS_ORIGINS in Fly.io backend secrets to include production frontend domain: fly secrets set CORS_ORIGINS=https://ministrosfc-web.fly.dev -a ministrosfc-api, restart backend
- [ ] T153 Configure external object storage: create Cloudflare R2 bucket "ministrosfc-photos" (or equivalent in Cloudinary/Supabase), generate API keys, update secrets in Fly.io, test photo upload in production
- [ ] T154 Verify production deployment: access https://ministrosfc-web.fly.dev → homepage loads, login as admin → upload player photo → verify stored in external storage, create game → record result → verify stats calculated, check Pino logs via fly logs -a ministrosfc-api

---

## Summary & Next Steps

### Task Totals by Phase

| Phase                         | Tasks          | Estimated Duration |
| ----------------------------- | -------------- | ------------------ |
| Phase 0: Scaffolding          | 18             | 1 week             |
| Phase 1: Backend Foundation   | 25 (T019-T043) | 1 week             |
| Phase 2A: Backend APIs P1     | 21 (T044-T064) | 1 week             |
| Phase 2B: Backend APIs P2     | 20 (T065-T084) | 1 week             |
| Phase 3: Frontend Setup       | 6 (T085-T090)  | 2 days             |
| Phase 4: Frontend Pages       | 25 (T091-T115) | 1.5 weeks          |
| Phase 5: Testing & Deployment | 39 (T116-T154) | 1 week             |
| **Total**                     | **154**        | **5-7 weeks**      |

### Parallel Execution Opportunities

**Within Phase 2A**: Tasks T044-T053 (US1 Player APIs) and T054-T064 (US2 Game APIs) can be implemented in parallel by different developers or in alternating work sessions (different files, minimal dependencies).

**Within Phase 2B**: Tasks T065-T072 (US3 Tournaments - simplified scope) and T073-T080 (US4 Participation) can be implemented in parallel.

**Within Phase 4**: Once backend APIs are complete, all Frontend page tasks (T091-T115) can be implemented in any order (each page consumes APIs independently).

### Critical Path

Phase 0 → Phase 1 → Phase 2A (US1, US2 must complete before US3) → Phase 2B → Phase 3 → Phase 4 → Phase 5

**Bottleneck**: Phase 1 (Backend Foundation) blocks all subsequent phases. Prioritize completing T019-T043 first.

### MVP Delivery (Recommended First Pass)

**Core MVP** (3 weeks): Phase 0 + Phase 1 + Phase 2A (T044-T064: US1 Players, US2 Games, US5 Public) + Phase 3 + Phase 4 Public Pages (T091-T105) + Phase 5 Critical Tests (T116-T134 backend, T140 E2E public, T144-T154 deployment)

**Enhanced MVP** (2 weeks): Phase 2B (T065-T084: US3 Tournaments simplified, US4 Participation, US6 Editor) + Phase 4 Admin Pages (T106-T115) + Remaining Tests (T135-T143)

### Key Architectural Notes

1. **External Object Storage**: Player photos stored in Cloudflare R2, Cloudinary, or Supabase Storage (NOT local filesystem). Tasks T031, T047, T109, T110, T132, T141, T153 implement photo upload flow.

2. **CORS Configuration**: Task T023 implements CORS with specific origins (localhost in dev, production domain in prod). Task T130 tests CORS, Task T152 configures production.

3. **Rate Limiting**: Task T029 implements express-rate-limit (in-memory, 5 login attempts per 15min). Task T129 tests rate limiting.

4. **Pino Logging**: Task T024 implements structured JSON logging (INFO+ in prod, DEBUG in dev). Task T072 adds audit logging, Task T133 tests logging.

5. **Tournament Scope Simplified**: Tasks T065-T071 implement tournaments as **grouping only** (calculate Ministros FC record: wins/draws/losses from completed games), **NOT full league standings** with all teams. This is the MVP scope as clarified.

6. **Test Coverage**: Backend 80%+ (T116-T134), Frontend 60%+ (T135-T143). E2E tests cover critical flows (T140-T142).

### Deployment Architecture (Fly.io Free Tier)

- **Backend API**: 1 VM (256MB RAM), always-on
- **Frontend SSR**: 1 VM (256MB RAM), always-on
- **PostgreSQL**: 1 VM (256MB RAM, 3GB storage)
- **Redis**: Optional 4th VM (would exceed free tier) OR use Upstash free tier (10k req/day)
- **Object Storage**: External (Cloudflare R2 10GB free OR Cloudinary 25GB free OR Supabase 1GB free)
- **Total Cost**: $0/month within free tier limits

**Next Command**: Begin implementation with Phase 0 (T001-T018). Run `npm install` after completing T001-T003 to verify workspace configuration.
