# Implementation Tasks: Ministros FC MVP

**Feature**: Ministros FC Monorepo Structure & Platform MVP  
**Date Generated**: March 17, 2026  
**Spec Reference**: [spec.md](spec.md), [plan.md](plan.md), [data-model.md](data-model.md)  
**Total Tasks**: 87  
**Estimated Duration**: 4-6 weeks (single developer, MVP scope)  
**Architectural Decision**: Pure REST API backend (Nest.js) + Admin UI in Nuxt frontend (Option 3 - Split architecture)

### Architectural Decision: API-First Design

**Approach**: Admin UI is built in Nuxt (`packages/frontend/src/pages/admin/`), not in Nest.js backend.

**Benefits**:

- ✅ Backend focuses on REST API only (no view rendering)
- ✅ Admin UI shares Vue3/TypeScript stack with public frontend
- ✅ API reusable for future mobile/desktop apps
- ✅ Backend & frontend teams can work independently
- ✅ API-first design follows modern best practices
- ✅ Easier to scale frontend vs backend independently

**Structure**:

```
packages/cms/          → Pure REST API on :3001
  /src/controllers/    → API endpoints only
  /src/services/       → Business logic
  /src/middleware/     → Auth, RBAC, validation

packages/frontend/     → Public + Admin UI on :3000
  /src/pages/
    /roster.vue        → Public roster
    /schedule.vue      → Public schedule
    /admin/            ← Admin dashboard pages
      /players.vue     → Admin player CRUD
      /games.vue       → Admin game management
      /teams.vue       → Admin team management
      /dashboard.vue   → Admin home
  /src/middleware/
    /auth.ts           → Protects /admin/* routes
```

---

## Dependencies & Execution Strategy

### User Story Dependency Graph

```
Phase 0 (Setup) → Phase 1 (Backend Foundational)
                      ↓
Phase 2A (Backend APIs - US1, US2, US5 in parallel P1)
                      ↓
Phase 2B (Backend APIs - US3, US4, US6 in parallel P2)
                      ↓
Phase 3 (Frontend Setup - blocks Phase 4)
                      ↓
Phase 4A (Frontend Public Pages - independent)
                      ↓
Phase 4B (Frontend Admin + Player - depends on Phase 2)
                      ↓
Phase 5 (Testing & Deployment)
```

### Parallelization Opportunities

**Phase 2 (Backend APIs)**: US1 (Players), US2 (Games), and US5 (Public) can be implemented in parallel—they have minimal data dependencies. US3 (Tournaments) and US4 (Participation) depend on Games completing first.

**Phase 4 (Frontend)**: Public pages (Phase 4A) can be built during backend implementation. Admin components (Phase 4B) must wait for backend APIs.

**Phase 5 (Testing)**: Backend unit tests can run alongside new feature development. E2E tests run after Phase 4 completes.

### MVP Scope (Recommended First Pass)

**Phase 0 + Phase 1 + Phase 2A (US1, US2, US5) + Phase 3 + Phase 4A + Phase 5 (critical tests)** = **Functional MVP** (2-3 weeks)

- Admins can create players & manage rosters (via admin UI in Nuxt) ✅
- Admins can schedule & record games (via admin UI in Nuxt) ✅
- Public site shows roster, schedule, results ✅
- Basic authentication & role-based access (API enforces, Nuxt UI checks) ✅
- Admin routes protected by Nuxt middleware (uses JWT from API) ✅

**Phase 2B (US3, US4, US6) + Phase 4B** = **Post-MVP enhancements** (2-3 weeks)

- Tournament management & statistics ✅
- Player participation confirmation (UI in Nuxt admin) ✅
- Editor role management (UI in Nuxt admin) ✅

**Note**: All admin features build UI in `packages/frontend/src/pages/admin/`, not in backend. Backend only provides REST endpoints.

---

# Phase 0: Project Scaffolding & Monorepo Setup

## Goal

Initialize npm monorepo structure, configure build tools, database, and containerization.

## Independent Test Criteria

- [ ] `npm install` installs all dependencies without errors
- [ ] `npm run docker:up` successfully starts PostgreSQL and Redis
- [ ] `npm run build:all` compiles all packages (shared, cms, frontend) without errors
- [ ] TypeScript strict mode enabled across all packages with zero errors
- [ ] `.env.example` files exist with documented variables

---

### Tasks

- [ ] T001 Create monorepo root package.json with npm workspaces configuration referencing packages/shared, packages/cms, packages/frontend

- [ ] T002 [P] Create package.json for @ministrosfc/shared with TypeScript, build, and test scripts

- [ ] T002b [P] Create package.json for @ministrosfc/cms with Nest.js, Express, Prisma, Redis, JWT dependencies and build/dev/test scripts

- [ ] T003 [P] Create package.json for @ministrosfc/frontend with Nuxt 4, Vue 3, Pinia, TailwindCSS, and test scripts

- [ ] T004 Create tsconfig.base.json in root with strict mode, module resolution, path aliases (@ministrosfc/_, @/_)

- [ ] T005 Create tsconfig.json in packages/shared extending root, configured for UMD output

- [ ] T006 [P] Create tsconfig.json in packages/cms extending root, configured for CommonJS ES2020 output

- [ ] T007 [P] Create tsconfig.json in packages/frontend extending root, configured for module ESNext

- [ ] T008 Create .gitignore at root ignoring node_modules, dist, .env, .env.local, build artifacts

- [ ] T009 Create docker-compose.yml at root with PostgreSQL 15 (port 5432) and Redis 7 (port 6379) services, volumes for persistence

- [ ] T010 Create packages/cms/.env.example documenting all required variables: DATABASE_URL, JWT_SECRET, JWT_EXPIRY, REFRESH_TOKEN_EXPIRY, NODE_ENV, API_PORT

- [ ] T011 Create packages/cms/Dockerfile for production build (multi-stage with Node 18 LTS, compiled output)

- [ ] T012 Create packages/frontend/.env.example documenting: API_BASE_URL, NUXT_API_ENDPOINT, PUBLIC_BRAND_COLOR (gold), NODE_ENV

- [ ] T013 Create packages/frontend/Dockerfile for SSR production build (multi-stage with Node 18 LTS)

- [ ] T014 Create root README.md with: project overview, tech stack, quick start (clone → npm install → npm run docker:up → npm run dev:all), architecture diagram

- [ ] T015 [P] Create packages/shared directory structure: src/types/, src/utils/, src/index.ts

- [ ] T016 [P] Create packages/cms directory structure: src/config/, src/middleware/, src/models/, src/services/, src/routes/, src/utils/, src/scripts/

- [ ] T017 [P] Create packages/frontend directory structure: public/, src/components/, src/pages/, src/stores/, src/composables/, src/utils/

- [ ] T018 Create npm scripts in root package.json: docker:up, docker:down, docker:logs, build:all, dev:all, gen:prisma, test:all

---

# Phase 1: Backend Foundational (Core Infrastructure)

## Goal

Establish backend foundation: database schema, authentication, middleware, error handling, and seeding.

## Independent Test Criteria

- [ ] Prisma migrations generate and apply to PostgreSQL without errors
- [ ] JWT auth middleware validates tokens and rejects expired/invalid tokens
- [ ] RBAC middleware correctly enforces permissions (Admin > Editor > Player)
- [ ] Database seed creates test data reproducibly
- [ ] Error responses follow consistent format with proper HTTP status codes
- [ ] CMS backend starts without errors and health check endpoint responds

---

### Tasks

- [ ] T019 Create prisma/schema.prisma with User (role-based), Player, Team, Game, GameParticipant, Tournament, Statistics entities per data-model.md with all relationships, indexes, and validation

- [ ] T019a Create OpponentTeam entity in Prisma schema with fields: id (UUID), name (String), logoUrl (String, optional), primaryColor (String, optional), secondaryColor (String, optional), createdAt, updatedAt

- [ ] T019b Add opponentTeamId (UUID, optional) foreign key to Game model replacing opponent String field, create relation to OpponentTeam

- [ ] T019c Add PlayerType enum (REGISTERED, GUEST) and PlayerStatus enum (ACTIVE, INACTIVE) to Prisma schema

- [ ] T019d Add playerType (PlayerType), status (PlayerStatus, default ACTIVE), invitedById (UUID, optional), photoPath (String, optional) fields to Player model

- [ ] T019e Update GameParticipant model to add confirmedById (UUID, optional) field linking to Player who confirmed this participant

- [ ] T020 Create prisma/migrations folder and generate initial migration from schema (prisma migrate dev --name init_schema)

- [ ] T021 Create packages/cms/src/config/database.ts with Prisma client singleton, connection validation, and pool configuration

- [ ] T022 Create packages/cms/src/config/auth.ts with JWT secret, expiration times (24h access, 30d refresh), algorithm (HS256), token validation options

- [ ] T023 Create packages/cms/src/config/server.ts with Express app factory, middleware order, port configuration (3000 for CMS), CORS policy

- [ ] T024 Create packages/cms/src/middleware/auth.ts implementing JWT verification middleware: validates token, extracts userId/role, attaches to request body, handles expired tokens with 401 response

- [ ] T025 Create packages/cms/src/middleware/rbac.ts implementing role-based access control middleware: requires role parameter in decorator/middleware call, returns 403 Forbidden if user role lacks permission, supports role hierarchies (ADMIN > EDITOR > PLAYER)

- [ ] T026 Create packages/cms/src/middleware/errorHandler.ts with centralized error handling: catches exceptions, logs errors, returns consistent JSON error response with status code, message, and error code

- [ ] T027 Create packages/cms/src/middleware/validation.ts with input validation middleware: validates request body against schema, returns 400 with field-level errors if validation fails

- [ ] T028 Create packages/cms/src/utils/error-codes.ts with error code constants (INVALID_CREDENTIALS, PLAYER_NOT_FOUND, UNAUTHORIZED, FORBIDDEN, VALIDATION_ERROR, etc.) mapped to HTTP status codes

- [ ] T029 Create packages/cms/src/utils/constants.ts with role constants (ADMIN, EDITOR, PLAYER), status enums (SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED), position enums (GOALKEEPER, DEFENDER, MIDFIELDER, FORWARD)

- [ ] T030 Create packages/cms/src/utils/jwt.ts with JWT signing function (generates access + refresh tokens), verification function, refresh token validation, token payload structure

- [ ] T031 Create packages/cms/src/utils/password.ts with bcrypt hashing (cost 12) and verification functions for user authentication

- [ ] T032 Create packages/cms/src/scripts/seed-db.ts with test data seeding: creates 1 admin user, 1 editor user, 3 REGISTERED player users, 2 GUEST players (invited by player 1), 3 opponent teams, 5 games (3 completed with opponent teams, 2 scheduled), 2 tournaments, example statistics

- [ ] T033 Create packages/cms/src/main.ts as Express app entry point: initializes database connection, applies middleware in proper order (auth → rbac → validation → routes → errorHandler), starts server on configured port with startup log

- [ ] T034 [P] Create packages/shared/src/types/user.ts with TypeScript interfaces: User, UserRole, AuthPayload, JWTToken, RefreshTokenPayload

- [ ] T035 [P] Create packages/shared/src/types/player.ts with interfaces: Player, Position, Foot, Contact, PlayerStats allfieldsper data-model.md

- [ ] T036 [P] Create packages/shared/src/types/game.ts with interfaces: Game, GameStatus, CompetitionType, GameParticipant, ParticipationStatus

- [ ] T037 [P] Create packages/shared/src/types/tournament.ts with Tournament interface and TournamentStanding

- [ ] T038 [P] Create packages/shared/src/types/api.ts with response wrappers: ApiResponse<T>, ApiError, PaginatedResponse<T>, with success, data, error, pagination fields

- [ ] T039 Create packages/shared/src/types/index.ts exporting all type modules

- [ ] T040 Create packages/shared/src/utils/validation.ts with reusable validators: isValidEmail(), isValidJWT(), isValidUUID(), validatePlayerData(), validateGameData()

- [ ] T041 Create packages/shared/src/utils/constants.ts with shared constants: HTTP status codes, role hierarchy, error messages, API version (/api/v1)

- [ ] T042 Create packages/shared/src/utils/formatting.ts with formatters: formatDate(ISO→local), formatTime(24h), formatPlayerStats(), formatTeamName()

- [ ] T043 Create packages/shared/src/index.ts exporting all types, utils, and constants

---

# Phase 2A: Backend APIs - Priority 1 User Stories (Players, Games, Public)

## Goal

Implement core backend **REST APIs** (no view rendering) for player management, game scheduling, and public-facing data. These US1, US2, US5 can run in parallel. **Note**: Admin UI will be built separately in Nuxt (Phase 4B).

## Independent Test Criteria (per story)

**US1 - Roster Management**:

- [ ] Admin creates player via POST /api/v1/players with all required fields
- [ ] Admin updates player via PATCH /api/v1/players/{id}
- [ ] Admin deactivates player via PATCH /api/v1/players/{id}/status (soft delete, sets status=INACTIVE)
- [ ] Admin reactivates player via PATCH /api/v1/players/{id}/status (sets status=ACTIVE)
- [ ] GET /api/v1/players returns paginated list with filters by position, search, default excludes INACTIVE
- [ ] GET /api/v1/players?status=INACTIVE returns deactivated players (admin only)
- [ ] Duplicate jersey numbers rejected with 400 error
- [ ] Admin uploads player photo via POST /api/v1/players/{id}/photo (JPG/PNG, max 5MB)

**US2 - Game Management**:

- [ ] Admin creates game via POST /api/v1/games with opponentTeamId, date, time, location
- [ ] Admin records result via PATCH /api/v1/games/{id} with scores and stats
- [ ] GET /api/v1/games returns paginated list with date/status/opponent filters
- [ ] Game participants auto-tracked when created

**US5 - Public Browsing**:

- [ ] GET /api/v1/players returns public-visible fields only (no nationalId)
- [ ] GET /api/v1/games returns public-visible fields with results
- [ ] GET /api/v1/team returns team info
- [ ] GET /api/v1/teams/opponents returns all opponent teams (public list)
- [ ] Admin can create/update/delete opponent teams via /api/v1/teams/opponents
- [ ] All public endpoints accessible without authentication
- [ ] Pagination works correctly with limit/offset

---

### Tasks - User Story 1: Player Roster Management

- [ ] T044 [P] [US1] Create packages/cms/src/models/Player.ts Prisma model integration layer with findAll(), findById(), create(), update(), deactivate() (soft delete via status=INACTIVE), reactivate() (status=ACTIVE), default filter excludes INACTIVE players

- [ ] T045 [P] [US1] Create packages/cms/src/services/PlayerService.ts business logic: createPlayer (validate jersey uniqueness, default status=ACTIVE), updatePlayer (soft fields), deactivatePlayer (sets status=INACTIVE), reactivatePlayer (sets status=ACTIVE), getPlayersByPosition(), searchPlayers(), aggregateStats()

- [ ] T046 [P] [US1] Create packages/cms/src/routes/players.ts Express route handlers: GET /api/v1/players (public, paginated list, default filters status=ACTIVE), GET /api/v1/players/{id} (public), POST /api/v1/players (admin auth + validation), PATCH /api/v1/players/{id} (admin/editor auth), PATCH /api/v1/players/{id}/status (admin only, activates/deactivates), DELETE /api/v1/players/{id} (admin only, hard delete)

- [ ] T047 [P] [US1] Create packages/cms/src/utils/playerValidation.ts with validators: validatePlayerInput() (name, position, position, avatarUrl formats), validateJerseyUniqueness(), validatePlayerUpdate()

- [ ] T047a [P] [US1] Install multer package (npm install multer @types/multer) for file upload handling in CMS package

- [ ] T047b [P] [US1] Create packages/cms/src/middleware/upload.ts with multer configuration: file filter (JPG/PNG only), size limit (5MB), destination (packages/cms/public/uploads/players/), filename sanitization

- [ ] T047c [P] [US1] Add POST /api/v1/players/{id}/photo endpoint in players.ts routes with multer middleware, saves file to disk, updates player photoPath field, returns photo URL

---

### Tasks - User Story 2: Game Management

- [ ] T048 [P] [US2] Create packages/cms/src/models/Game.ts Prisma model layer with findAll(), findById(), create(), update(), getGamesByDateRange(), getGamesByTournament() methods, status transitions

- [ ] T049 [P] [US2] Create packages/cms/src/models/GameParticipant.ts Prisma model for player-game relationships with participation status tracking

- [ ] T050 [P] [US2] Create packages/cms/src/services/GameService.ts business logic: createGame(), recordResult(), updateGameStatus(), getGamesByFilters() (date, opponent, status), recalculateGameStats()

- [ ] T051 [P] [US2] Create packages/cms/src/routes/games.ts Express route handlers: GET /api/v1/games (public, with date/status filters), GET /api/v1/games/{id} (public, includes participants), POST /api/v1/games (admin auth), PATCH /api/v1/games/{id} (admin/editor auth, result recording), DELETE (admin only)

- [ ] T052 [P] [US2] Create packages/cms/src/utils/gameValidation.ts with validators: validateGameInput(), validateGameResult(), validateDateFormat(), validateTeamExists()

---

### Tasks - User Story 5: Public API Layer

- [ ] T053 [P] [US5] Create packages/cms/src/routes/health.ts with GET /api/v1/health endpoint returning {status: 'ok', timestamp} for monitoring

- [ ] T054 [P] [US5] Create packages/cms/src/routes/team.ts with GET /api/v1/team returning team info (name, logo, description) as static data or CMS-managed

- [ ] T054a [P] [US5] Create packages/cms/src/models/OpponentTeam.ts Prisma model layer with findAll(), findById(), create(), update(), delete() methods for opponent team management

- [ ] T054b [P] [US5] Create packages/cms/src/services/OpponentTeamService.ts business logic: createOpponentTeam(), updateOpponentTeam(), deleteOpponentTeam(), getAllOpponentTeams(), validateTeamName()

- [ ] T054c [P] [US5] Add opponent team routes to packages/cms/src/routes/teams.ts: GET /api/v1/teams/opponents (public list), GET /api/v1/teams/opponents/{id} (public), POST /api/v1/teams/opponents (admin auth), PATCH /api/v1/teams/opponents/{id} (admin), DELETE /api/v1/teams/opponents/{id} (admin)

- [ ] T054d [P] [US5] Create packages/cms/src/utils/opponentTeamValidation.ts with validators: validateOpponentTeamInput(), validateTeamNameUniqueness(), validateColorFormat()

- [ ] T055 [P] [US5] Implement public response filtering in PlayerService: exclude nationalId, contactInfo from public GET /api/v1/players responses

- [ ] T056 [P] [US5] Implement public response filtering in GameService: exclude internal fields from public GET /api/v1/games responses

- [ ] T057 [P] [US5] Create Cache-Control headers middleware: set max-age=300 (5min) for public GET endpoints, no-cache for protected endpoints

---

# Phase 2B: Backend APIs - Priority 2 User Stories (Tournaments, Participation, Stats)

## Goal

Implement tournament management, player participation confirmation, and statistics aggregation.

## Independent Test Criteria (per story)

**US3 - Tournaments & Statistics**:

- [ ] Admin creates tournament via POST /api/v1/tournaments
- [ ] Admin associates games with tournaments via PATCH /api/v1/tournaments/{id}/games
- [ ] GET /api/v1/tournaments/{id}/standings returns auto-calculated standings
- [ ] GET /api/v1/statistics/{tournamentId} returns aggregated player stats (goals, assists, appearances)
- [ ] Statistics recalculated on game result changes

**US4 - Participation Confirmation**:

- [ ] Player can GET /api/v1/my-games returns their assigned games
- [ ] Player can PATCH /api/v1/my-games/{gameId}/status to confirm/deny participation
- [ ] Player can bring friends via POST /api/v1/players/guest creating GUEST player records
- [ ] Player confirming participation can add friends array, creates GUEST players with "Friend of {playerName}"
- [ ] GET /api/v1/players returns both REGISTERED and GUEST players (GUEST filtered from roster display by frontend)
- [ ] Admin can see participation statuses in GET /api/v1/games/{id} response
- [ ] Participation confirmation not allowed for past games

**US6 - Editor Role Enforcement**:

- [ ] Editor can read players, games, tournaments (GET endpoints)
- [ ] Editor can update game results & tournament data (PATCH games, tournaments)
- [ ] Editor cannot create/delete users (POST/DELETE /api/v1/users returns 403)
- [ ] Editor cannot modify system settings
- [ ] Admin can always perform all operations

---

### Tasks - User Story 3: Tournaments & Statistics

- [ ] T058 [US3] Create packages/cms/src/models/Tournament.ts Prisma model layer with create(), findById(), associateGames(), calculateStandings(), getGames() methods

- [ ] T059 [US3] Create packages/cms/src/models/Statistics.ts Prisma model for player statistics per tournament with fields: playerId, tournamentId, goals, assists, appearances, yellowCards, redCards, createdAt, updatedAt

- [ ] T060 [US3] Create packages/cms/src/services/StatisticsService.ts with aggregatePlayerStats (per tournament), calculateStandings (W-D-L, goal diff), recalculateOnGameChange (triggered after game result update), getTopScorers(), getMostAppearances()

- [ ] T061 [US3] Create packages/cms/src/routes/tournaments.ts with GET /api/v1/tournaments (public list), GET /api/v1/tournaments/{id} (public, with standings), POST /api/v1/tournaments (admin auth), PATCH /api/v1/tournaments/{id} (admin/editor), PATCH /api/v1/tournaments/{id}/games (admin to associate)

- [ ] T062 [US3] Create packages/cms/src/routes/statistics.ts with GET /api/v1/statistics/tournaments/{tournamentId} (public standings), GET /api/v1/statistics/players/{playerId} (public player career stats), GET /api/v1/statistics/top-scorers (public), GET /api/v1/statistics/season/{season} (season aggregates)

- [ ] T063 [US3] Create packages/cms/src/utils/statisticsCalculation.ts with functions: calculateGoals(), calculateassists(), calculateWinLossStats(), calculateGoalDifference(), determineTopPerformers()

- [ ] T064 [US3] Implement Redis caching for statistics: cache tournament standings (5min TTL), cache top scorers (5min TTL), invalidate on game result change via GameService

---

### Tasks - User Story 4: Player Participation Confirmation

- [ ] T065 [US4] Create packages/cms/src/models/ParticipationStatus enum (UNCONFIRMED, CONFIRMED, DECLINED, INJURED) and extend GameParticipant model

- [ ] T066 [US4] Create packages/cms/src/routes/participation.ts with PATCH /api/v1/games/{id}/participants/{playerId}/status (player auth) updating participation status, validates game not past, logs confirmation timestamp

- [ ] T066a [US4] Add POST /api/v1/players/guest endpoint in players.ts routes (player auth) creating guest player records with playerType=GUEST, invitedById set to authenticated player, auto-generates name "Friend of {playerName}"

- [ ] T066b [US4] Enhance PATCH /api/v1/games/{id}/participants/{playerId}/confirm endpoint to accept optional friends array (names), creates GUEST players for each, adds them as GameParticipants with confirmedById

- [ ] T066c [US4] Add business logic to PlayerService.createGuestPlayer(): validates inviter is REGISTERED player, sets playerType=GUEST, status=ACTIVE, photoPath=null, links invitedById

- [ ] T066d [US4] Create packages/cms/src/utils/guestPlayerValidation.ts with validators: validateGuestPlayerInput(), validateInviterIsRegistered(), validateFriendNameFormat()

- [ ] T067 [US4] Add GET /api/v1/my-games route returning authenticated player's assigned games with participation statuses, filters to upcoming games for confirmation

- [ ] T068 [US4] Update GameParticipant response in GET /api/v1/games/{id} to include participation statuses visible to admin/editor, hidden for public

---

### Tasks - User Story 6: Editor Role Management & RBAC

- [ ] T069 [US6] Enhance RBAC middleware to support endpoint-level role requirements (e.g., POST /api/v1/users enforces ADMIN, PATCH /api/v1/games allows ADMIN|EDITOR)

- [ ] T070 [US6] Create packages/cms/src/routes/users.ts with GET /api/v1/users (admin), POST /api/v1/users (admin creates user), PATCH /api/v1/users/{id}/role (admin), DELETE /api/v1/users/{id} (admin), each enforcing RBAC

- [ ] T071 [US6] Implement API permission matrix in RBAC middleware: Admin=all, Editor=read+update for data, Player=read own + participation, returns 403 for unauthorized

- [ ] T072 [P] [US6] Add audit logging to sensitive operations: user creation/deletion, game result changes, player data modifications (log user ID, action, timestamp, IP)

---

# Phase 3: Frontend Setup & Public Pages

## Goal

Initialize Nuxt 4 application with public-facing pages (roster, schedule, statistics) consuming backend APIs.

## Independent Test Criteria

- [ ] Nuxt dev server starts without errors on http://localhost:3001
- [ ] all pages load without 404 errors (index, roster, games, tournaments, statistics)
- [ ] API calls work correctly with backend running (fetches roster data)
- [ ] TailwindCSS styling applies correctly (gold/black/white theme components render)
- [ ] Components render with proper error boundaries (displays fallback if API unavailable)
- [ ] Responsive design works on mobile (pagination, layout reflows)

---

### Tasks

- [ ] T073 Create packages/frontend/nuxt.config.ts with: modules (Pinia, TailwindCSS), api config (@ministrosfc/shared types), ssr enabled, productionSourceMaps disabled, public runtimeConfig (API_BASE_URL)

- [ ] T074 Create packages/frontend/tailwind.config.ts with custom colors (gold: #D4AF37, black: #000000, white: #FFFFFF), custom theme, plugins for form styling

- [ ] T075 Create packages/frontend/app.vue as root component with Navigation, RouterView, Footer layout

- [ ] T076 Create packages/frontend/src/components/common/Navigation.vue displaying logo, nav links (Roster, Games, Tournaments, Stats), responsive mobile menu

- [ ] T077 Create packages/frontend/src/components/common/Header.vue displaying team name, tagline, sponsor banner with Ministros FC branding

- [ ] T078 Create packages/frontend/src/components/common/Footer.vue with contact info, social links, copyright

- [ ] T079 Create packages/frontend/src/pages/index.vue (homepage) displaying: team name, welcome message, featured players carousel, latest game results, season highlights, call-to-action links

- [ ] T080 [P] Create packages/frontend/src/pages/roster.vue (public roster page) listing: all players with PlayerCard component, filtering by position, search by name, pagination, responsive grid

- [ ] T081 [P] Create packages/frontend/src/components/player/PlayerCard.vue displaying: player photo/avatar, name, number, position, stats (if season started), responsive styling

- [ ] T082 [P] Create packages/frontend/src/pages/games.vue (schedule/results page) displaying: list of games with GameCard component, filtering by status (upcoming/past), date range picker, opponent filter, pagination, results sorted by date descending

- [ ] T083 [P] Create packages/frontend/src/components/game/GameCard.vue displaying: date, time, opponent, location, status badge, score if completed, compact/expanded view options

- [ ] T084 [P] Create packages/frontend/src/pages/tournaments.vue displaying: list of tournaments with TournamentCard, filtering by completion status, links to standings per tournament

- [ ] T085 [P] Create packages/frontend/src/pages/statistics.vue displaying: top scorers table, most appearances, season aggregates, tournament selector, pagination on tables

- [ ] T086 [P] Create packages/frontend/src/composables/useApi.ts with auto-retry logic (max 3 retries), error boundary, loading states, works with both public + authenticated endpoints

- [ ] T087 [P] Create packages/frontend/src/stores/ui.ts (Pinia) managing: activeFilters, pagination state, mobileMenuOpen, theme preferences (persisted to localStorage)

- [ ] T088 [P] Create packages/frontend/src/utils/api-client.ts with typed fetch wrapper: calls backend /api/v1/\* endpoints, includes auth token if available, transforms responses using @ministrosfc/shared types

- [ ] T089 Create packages/frontend/error.vue (error boundary) displaying: error code, retry button, fallback UI for API unavailable scenarios

- [ ] T090 Create packages/frontend/app.config.ts with branding constants: teamName, brandColor, season, supportEmail

---

# Phase 4: Frontend Admin & Authentication

## Goal

Implement authentication, admin dashboard, CRUD components, and player participation confirmation interface.

## Independent Test Criteria

- [ ] User logs in successfully with admin credentials, JWT stored in localStorage
- [ ] Admin dashboard displays after login, inaccessible without auth
- [ ] Admin creates player via form, player appears in roster after save
- [ ] Admin updates game result, public pages reflect updated data
- [ ] Unauthorized users cannot access admin routes (redirect to /login)
- [ ] Player logs in, sees "My Games", confirms participation, admin sees updated status
- [ ] Auth token refresh works automatically on expiry

---

### Tasks

- [ ] T091 Create packages/frontend/src/pages/login.vue with email/password form, error handling, JWT storage, redirect to admin dashboard on success

- [ ] T092 Create packages/frontend/src/components/auth/LoginForm.vue with: email/password inputs, validation, loading state, error messages, submit button

- [ ] T093 Create packages/frontend/src/stores/auth.ts (Pinia) managing: currentUser, accessToken, refreshToken, login(), logout(), refreshAccessToken(), isAuthenticated computed, userRole computed

- [ ] T094 Create packages/frontend/src/composables/useAuth.ts with logout function, auth guard logic, token refresh middleware

- [ ] T095 Create packages/frontend/src/middleware/requireAuth.ts (Nuxt navigation guard) redirecting unauthenticated users to /login

- [ ] T096 Create packages/frontend/src/middleware/requireAdmin.ts checking user.role === 'ADMIN', redirecting to /login if not authorized

- [ ] T097 Create packages/frontend/src/pages/admin/dashboard.vue (protected) displaying: navigation menu (Players, Games, Tournaments, Stats), welcome message, quick stats (total players, upcoming games)

- [ ] T098 Create packages/frontend/src/pages/admin/players/index.vue (admin player list) with: table showing players, search/filter, pagination, "Add Player" button leading to /admin/players/new, edit/delete buttons

- [ ] T099 Create packages/frontend/src/pages/admin/players/[id].vue (edit player) with: form pre-filled with player data, fields: name, position, jersey, avatar URL, save/cancel buttons, handles photo array (external URLs)

- [ ] T100 Create packages/frontend/src/pages/admin/players/new.vue (create player) with: empty form, all required fields, avatar/photo upload (file or URL), submit/cancel

- [ ] T101 Create packages/frontend/src/components/admin/PlayerForm.vue reusable form: inputs for all player fields, validation, error display, save/cancel buttons, emits save event with player data

- [ ] T102 Create packages/frontend/src/pages/admin/games/index.vue (admin game list) with: table of games, status/date filters, pagination, "Schedule Game" button, edit/record-result/delete buttons

- [ ] T103 Create packages/frontend/src/pages/admin/games/[id].vue (edit game) with: form showing opponent, date, time, location, status, result fields (if completed), save/cancel

- [ ] T104 Create packages/frontend/src/pages/admin/games/new.vue (schedule game) with: form for new game, select opponent from team dropdown, date/time picker, location, competition type, auto-assign players from roster

- [ ] T105 Create packages/frontend/src/components/admin/GameForm.vue reusable form: fields for game creation/editing, validation, date/time picker integration, participant selection (multi-select players)

- [ ] T106 Create packages/frontend/src/pages/admin/games/[id]/result.vue (record result) with: form for final score, advanced stats (possession, shots, fouls), save/cancel, validates game status

- [ ] T107 Create packages/frontend/src/pages/admin/tournaments/index.vue (tournament management) with: table of tournaments, create/edit/delete buttons, view standings link

- [ ] T108 Create packages/frontend/src/components/admin/TournamentForm.vue form for tournament creation/editing: name, date range, format, description, save/cancel

- [ ] T109 Create packages/frontend/src/pages/player/my-games.vue (player confirms participation) with: list of upcoming games player is assigned to, "Confirm/Decline" buttons per game, success/error messages, refreshes after action

- [ ] T110 Create packages/frontend/src/components/player/GameConfirmationModal.vue modal for: showing game details, Confirm/Decline buttons, notes/reasoning optional field

- [ ] T110a Create packages/frontend/src/components/player/BringFriendModal.vue modal for "bring a friend" feature: input fields for friend names (up to 5), inline validation, preview list of friends to add, Save/Cancel buttons

- [ ] T110b Update packages/frontend/src/pages/player/my-games.vue to add "Bring a Friend" button next to each confirmed game, triggers BringFriendModal, displays added guest players with "Friend of {playerName}" labels

- [ ] T111 Create packages/frontend/src/pages/logout.vue (redirect on logout) clearing tokens, redirecting to homepage, displaying "See you soon!" message

- [ ] T112 Implement packages/frontend/src/middleware/auth-interceptor.ts auto-attaching JWT to all API requests, handles 401 responses by calling token refresh, retries request

- [ ] T113 Create packages/frontend/src/composables/usePagination.ts managing pagination state (limit, offset), computed properties for page number, previous/next URL params

- [ ] T114 Create packages/frontend/src/stores/admin.ts (Pinia) managing: players list, games list, tournaments list, loading/error states, CRUD action dispatchers

- [ ] T115 Create packages/frontend/src/types/api-responses.ts local types extending @ministrosfc/shared for frontend-specific response models (includes pagination metadata)

---

# Phase 5: Testing, Deployment & Final Integration

## Goal

Implement comprehensive testing (unit, integration, E2E), dockerize packages, finalize deployment readiness.

## Independent Test Criteria

- [ ] Backend unit tests: >80% coverage on services, all edge cases covered (auth failures, validation, RBAC)
- [ ] Backend integration tests: full API workflows for each user story (login → create player → create game → verify API)
- [ ] Frontend component tests: >60% coverage on critical components (LoginForm, PlayerCard, GameCard, PlayerForm)
- [ ] Frontend E2E tests: admin creates player & game, player confirms participation, public user views roster (all pass)
- [ ] Docker images build successfully, services start in docker-compose
- [ ] Health checks pass (GET /api/v1/health returns 200)
- [ ] No TypeScript errors across entire codebase

---

### Tasks - Backend Testing

- [ ] T116 Create packages/cms/tests/unit/services/AuthService.test.ts testing: login with valid credentials, login with invalid password, token refresh, token expiry

- [ ] T117 Create packages/cms/tests/unit/services/PlayerService.test.ts testing: createPlayer success, duplicate jersey rejection, updatePlayer, deactivatePlayer (status=INACTIVE), reactivatePlayer (status=ACTIVE), searchPlayers filters, getByPosition excludes INACTIVE by default

- [ ] T118 Create packages/cms/tests/unit/services/GameService.test.ts testing: createGame, recordResult, getGamesByDateRange, recalculateStats after result

- [ ] T119 Create packages/cms/tests/unit/services/StatisticsService.test.ts testing: aggregatePlayerStats, calculateStandings, topScorers calculation, goalDifference logic

- [ ] T119a Create packages/cms/tests/unit/services/OpponentTeamService.test.ts testing: createOpponentTeam success, duplicate team name rejection, updateOpponentTeam, deleteOpponentTeam, getAllOpponentTeams

- [ ] T119b Create packages/cms/tests/unit/services/GuestPlayerService.test.ts testing: createGuestPlayer with valid inviter, rejects if inviter not REGISTERED, auto-generates name "Friend of {player}", sets playerType=GUEST

- [ ] T119c Create packages/cms/tests/unit/middleware/upload.test.ts testing: accepts JPG/PNG files, rejects non-image files, enforces 5MB size limit, sanitizes filenames, saves to correct directory

- [ ] T120 Create packages/cms/tests/unit/middleware/auth.test.ts testing: valid token acceptance, expired token rejection, malformed token handling, missing token returns 401

- [ ] T121 Create packages/cms/tests/unit/middleware/rbac.test.ts testing: Admin full access, Editor read+update restriction, Player role restriction, 403 responses for unauthorized

- [ ] T122 Create packages/cms/tests/unit/utils/validation.test.ts testing: email validation, UUID format, player data schema, game data schema, invalid inputs rejected

- [ ] T123 Create packages/cms/tests/integration/auth-flow.test.ts testing: user login → token generation → request with token → token refresh after expiry → logout

- [ ] T124 Create packages/cms/tests/integration/player-flow.test.ts testing: admin creates player → player appears in roster → update player → deactivate player (soft delete) → verify status=INACTIVE → reactivate player

- [ ] T125 Create packages/cms/tests/integration/game-flow.test.ts testing: admin schedules game → assigns players → records result → statistics update → public API returns game with results

- [ ] T126 Create packages/cms/tests/integration/tournament-flow.test.ts testing: admin creates tournament → adds games → standings calculated → stats aggregated → public sees standings

- [ ] T126a Create packages/cms/tests/integration/opponent-team-flow.test.ts testing: admin creates opponent team → team appears in GET /api/v1/teams/opponents → admin creates game with opponentTeamId → public sees game with team name

- [ ] T126b Create packages/cms/tests/integration/guest-player-flow.test.ts testing: player confirms participation → adds 2 friends via friends array → GUEST players created with "Friend of {player}" → participants include guests with confirmedById → admin sees all participants

- [ ] T126c Create packages/cms/tests/integration/file-upload-flow.test.ts testing: admin uploads player photo → file saved to correct path → player photoPath updated → GET /api/v1/players/{id} returns photo URL

- [ ] T127 Create packages/cms/tests/fixtures/seed-test-data.ts generating reproducible test data: admin user, editor user, 3 players, 5 games, 1 tournament (no side effects, transaction rollbacks)

- [ ] T128 Create packages/cms/jest.config.ts configuring Jest: TypeScript support (ts-jest), test database (SQLite in-memory), coverage reporting, timeout 10s per test

- [ ] T129 Update packages/cms/package.json with test scripts: test (run all), test:watch, test:coverage with >80% report

---

### Tasks - Frontend Testing

- [ ] T130 Create packages/frontend/tests/unit/components/player/PlayerCard.test.ts testing: renders player data, formats position correctly, image loads, click event emitted

- [ ] T131 Create packages/frontend/tests/unit/components/game/GameCard.test.ts testing: renders game info, score display if completed, status badge, date formatting

- [ ] T132 Create packages/frontend/tests/unit/components/auth/LoginForm.test.ts testing: email/password rendering, form submission, error display on invalid credentials, loading state

- [ ] T132a Create packages/frontend/tests/unit/components/player/BringFriendModal.test.ts testing: renders friend input fields, validates friend names, emits save event with friends array, limits to 5 friends max

- [ ] T133 Create packages/frontend/tests/unit/stores/auth.test.ts testing: login sets user + tokens, logout clears tokens, refresh token renews access token, isAuthenticated computed

- [ ] T134 Create packages/frontend/tests/unit/stores/ui.test.ts testing: pagination state, filters update, mobile menu toggle persisted

- [ ] T135 Create packages/frontend/tests/unit/composables/useApi.test.ts testing: fetch wrapper adds auth header, handles 401 with refresh, retries failed requests, transforms responses

- [ ] T136 Create packages/frontend/tests/e2e/admin-workflow.spec.ts (Playwright) testing: admin login → create player (form submit, verify roster) → create game (schedule, assign players) → record result (verify stat update on public page)

- [ ] T137 Create packages/frontend/tests/e2e/player-confirmation.spec.ts (Playwright) testing: player login → view my-games → confirm participation → bring a friend (adds 2 guest players) → admin sees status updated and guest players in participants list

- [ ] T138 Create packages/frontend/tests/e2e/public-browsing.spec.ts (Playwright) testing: public user views homepage → roster (filters by position) → games (filters by date) → statistics (sees top scorers)

- [ ] T139 Create packages/frontend/playwright.config.ts configuring: baseURL (http://localhost:3001), webServer (Nuxt dev server), browser (chromium, firefox), reporters, screenshots on failure

- [ ] T140 Create packages/frontend/vitest.config.ts or jest.config.ts for component tests: tests mounting Vue components, DOM assertions, event handling

- [ ] T141 Update packages/frontend/package.json with test scripts: test, test:watch, e2e, e2e:ui

---

### Tasks - Deployment & Docker

- [ ] T142 Update docker-compose.yml to include cms and frontend services: cms image (built from packages/cms), frontend image (built from packages/frontend), depends_on PostgreSQL/Redis, port mappings (3000 for CMS, 3001 for Frontend)

- [ ] T143 Create .dockerignore at root excluding: node_modules, .git, .env, dist, build, coverage, .next, .nuxt

- [ ] T144 Create docker/production-compose.yml for production use: separate containers for cms, frontend, PostgreSQL (persistent volume), Redis with no persistence (cache), health checks on all services

- [ ] T145 Create scripts/deploy.sh for production deployment: builds docker images, pushes to registry (optional), runs database migrations, starts services via docker-compose, runs health checks

- [ ] T146 Create .github/workflows/ci.yml (or equivalent CI config) running: npm install, lint (npm run lint:all if linter configured), tests (npm run test:all), build (npm run build:all), Docker image build on push to main branch

- [ ] T147 Update root README.md with: development quick start (npm install → npm run docker:up → npm run dev:all), production deployment (docker-compose up), monitoring (health check endpoints), troubleshooting section

---

### Tasks - Final Integration & QA

- [ ] T148 Run full integration test: backend + frontend + database running, admin login → create opponent team → create player with photo → schedule game with opponent team → record result → player can confirm participation and add 2 friends → public can view all data including guest players

- [ ] T149 Test edge cases: very large roster (100+ players), pagination window edge cases, 2-year game history filtering, concurrent game result updates, expired token handling with refresh

- [ ] T150 Verify API response times: GET /api/v1/players <200ms, GET /api/v1/games <300ms, GET /api/v1/statistics/tournaments/{id} <500ms (respects SC-009)

- [ ] T151 Performance validation: Lighthouse score >85 on frontend public pages, console warnings/errors none

- [ ] T152 Security checklist: JWT properly validated, RBAC enforced on all protected endpoints, no sensitive data in logs, passwordHash bcrypted (cost 12), environment variables not exposed

- [ ] T153 Documentation: Update /specs/001-ministrosfc-monorepo/README.md with architecture diagram, API endpoint reference, deployment guide, troubleshooting

- [ ] T154 Generate API reference docs using swagger/openapi-generator from route handlers, serve at /api/v1/docs

---

## Summary by User Story

| User Story               | Priority | Phase    | Task Count | Key Deliveries                                                          |
| ------------------------ | -------- | -------- | ---------- | ----------------------------------------------------------------------- |
| US1: Roster Management   | P1       | 2A       | 7          | Player CRUD API, service layer, validation, soft delete, file upload    |
| US2: Game Management     | P1       | 2A       | 5          | Game CRUD API, result recording, status tracking, opponent team support |
| US5: Public Browsing     | P1       | 2A, 3, 4 | 22         | Public API, opponent teams CRUD, frontend pages (roster, games, stats)  |
| US3: Tournaments & Stats | P2       | 2B       | 7          | Tournament API, statistics aggregation, standings calc, Redis caching   |
| US4: Participation       | P2       | 2B, 4    | 8          | Participation status API, guest player creation, "bring a friend" UI    |
| US6: Editor Role         | P2       | 2B, 4    | 4          | RBAC enforcement, user management API, permission matrix                |

---

## Parallel Execution Recommendations

### **Scenario A: Single Developer (Sequential, 4-6 weeks)**

1. Phase 0 (scaffolding): 1 week
2. Phase 1 (backend core): 1 week
3. Phase 2A (player/game/public APIs): 1 week
4. Phase 3 (frontend public): 1 week
5. Phase 2B (tournaments/stats/participation): 0.5 week
6. Phase 4 (admin + player UIs): 1 week
7. Phase 5 (testing + deployment): 0.5 week

### **Scenario B: 2 Developers (Parallel, 3-4 weeks)**

- **Dev A** → Phase 0 + Phase 1 + Phase 2A backend
- **Dev B** → Phase 3 + Phase 4 frontend (waits for Phase 2A APIs)
- **Both** → Phase 2B, Phase 5 integration

### **Scenario C: 3+ Developers (Full Parallelization, 2-3 weeks)**

- **Dev A** → Phase 0 + Phase 1 (backend foundation)
- **Dev B** → Phase 2A + 2B (all backend APIs, parallel within)
- **Dev C** → Phase 3 + 4 (all frontend, after Phase 2A APIs available)
- **All** → Phase 5 (testing, integration, deployment)

---

## Critical Path for MVP (Minimum Viable Product)

**Fastest route to demo-ready system: 2-3 weeks**

```
Phase 0 (Days 1-2): Scaffolding
  ↓
Phase 1 (Days 3-5): Backend core, auth, DB
  ↓
Phase 2A (Days 6-8): Player, Game, Public APIs (can parallelize)
  ↓
Phase 3 (Days 9-10): Frontend public pages
  ↓
Phase 4A (Days 11-12): Admin player/game interfaces + Frontend Auth
  ↓
Phase 5 (Days 13-14): Integration tests, Docker, deploy
```

**Post-MVP (Weeks 3-4)**:

- Phase 2B (Tournament management, statistics, participation)
- Phase 4B (Admin tournament interface, player confirmation flow)
- Phase 5 continued (E2E tests, performance optimization)

---

## Task Dependencies Matrix

**Blocking tasks** (others depend on these):

- T019 (Prisma schema) → blocks all backend tasks
- T021 (Database config) → blocks all services
- T022 (Auth config) → blocks all auth routes
- T033 (Express app entry) → blocks all route exports
- T073 (Nuxt config) → blocks all frontend pages
- T091 (Login page) → blocks admin dashboard access

**Can run in parallel**:

- T002-T002b-T003 (package.json setup)
- T004-T007 (TypeScript configs)
- T044-T056 (Player, Game, Public services)
- T080-T085 (Frontend components)
- T116-T122 (Backend unit tests)

---

## Validation Checklist

- [x] All tasks assigned unique IDs (T001-T154 + new tasks T002b, T019a-e, T047a-c, T054a-d, T066a-d, T110a-b, T119a-c, T126a-c, T132a = ~180 total)
- [x] File paths explicitly specified for all tasks
- [x] Story labels applied to Priority 1 & 2 user story tasks only
- [x] [P] parallelization markers applied to independent tasks
- [x] Dependencies documented in task descriptions and matrix
- [x] MVP scope clearly delineated (Phase 0, 1, 2A, 3, 4A baseline)
- [x] Each user story independently testable
- [x] Tech stack aligned with plan.md (Nest.js, Nuxt 4, Prisma, PostgreSQL, Redis)
- [x] All API contract endpoints mapped to task handlers
- [x] Test tasks included (Jest for backend, Playwright for frontend E2E)
- [x] Deployment tasks included (Docker, CI/CD, health checks)
- [x] OpponentTeam CRUD tasks added (T019a-b, T054a-d, T119a, T126a)
- [x] Player soft delete tasks updated (T044-T046, T117, T124)
- [x] Guest player feature tasks added (T019c-e, T066a-d, T110a-b, T119b, T126b, T132a, T137)
- [x] File upload tasks added (T047a-c, T119c, T126c)

---

**Generated**: March 17, 2026  
**Updated**: March 17, 2026 - Added OpponentTeam, soft delete, guest players, file upload tasks  
**Next Steps**: Pick Phase 0, Task 1 and begin scaffolding. Recommend running Phase 0 + Phase 1 to establish shared foundation, then parallelize Phase 2 backend with Phase 3 frontend setup.
