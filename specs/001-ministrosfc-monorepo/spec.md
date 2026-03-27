# Feature Specification: Ministros FC Monorepo Structure

**Feature Branch**: `feature/ministrosfc-monorepo`  
**Created**: March 17, 2026  
**Status**: Draft

## Overview

Establish a comprehensive monorepo structure for Ministros FC, an amateur soccer team management platform. The platform consists of two sub-projects:

1. **CMS**: A private admin system for managing team data (players, games, statistics, tournaments)
2. **Frontend**: A public-facing Nuxt.js application for displaying team information

Both sub-projects share types and utilities and communicate via REST JSON API.

---

## Clarifications

### Session 2026-03-17

- Q: Player photo uploads require persistent storage, but Fly.io VMs have ephemeral filesystems. Which storage strategy should be used? → A: External object storage (free tier, < 100 images total; Cloudflare R2, Cloudinary, or Supabase Storage recommended)
- Q: Frontend (separate Fly.io VM) calling Backend API requires CORS configuration. What CORS policy should be implemented? → A: Specific origins - Frontend domain in prod + localhost in dev (secure, enables proper dev workflow)
- Q: JWT authentication endpoints need protection from brute-force attacks. What rate limiting strategy should be used? → A: In-memory rate limiting (express-rate-limit, simple, no infrastructure dependency)
- Q: Production logging strategy for free-tier Fly.io deployment. What logging approach balances debuggability with resource efficiency? → A: Structured JSON logging with configurable levels (Pino: INFO+ in prod, DEBUG in dev)
- Q: Tournament standings calculation rules not specified in FR-036. What scoring/ranking system should be implemented? → A: OUT OF SCOPE for MVP - System only tracks Ministros FC games, not full tournament tables; tournaments are just groupings/categories for the team's own matches

---

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Admin Creates and Manages Team Roster (Priority: P1)

An admin logs into the CMS dashboard and needs to create team rosters, add new players, update player information, and assign them to teams. This is the foundation for all other team management operations.

**Why this priority**: Roster management is the core data that all other features depend on. Without working rosters, tournaments, matches, and statistics cannot be properly managed.

**Independent Test**: Can be fully tested by admin logging in, creating players, assigning them to teams, viewing the roster, and verifying the data persists. Frontend can independently consume the API and display this roster.

**Acceptance Scenarios**:

1. **Given** an admin is logged into the CMS, **When** they navigate to the Players section and click "Add Player", **Then** a form appears with fields for name, position, jersey number, contact info, and date of birth
2. **Given** an admin has created a player record, **When** they edit the player details and save, **Then** the changes persist and are reflected in the CMS and API
3. **Given** a player exists in the system, **When** an admin views the roster list, **Then** they see all players with key information (name, position, jersey number)
4. **Given** a player exists, **When** an admin deletes the player, **Then** the player is removed from the system and API responses reflect this removal
5. **Given** multiple players exist, **When** an admin searches/filters players by name or position, **Then** the list updates to show only matching players

---

### User Story 2 - Admin Schedules Games and Manages Match Data (Priority: P1)

An admin creates game schedules, records match results, and tracks statistics. This allows the system to display upcoming games and historical match data to the public.

**Why this priority**: Game scheduling and results are core content that public users want to view. Without this, the platform provides limited value to team supporters and players.

**Independent Test**: Can be fully tested by creating a game record, setting match details, recording results, and verifying the API returns complete game data that Frontend can display.

**Acceptance Scenarios**:

1. **Given** an admin is in the CMS Games section, **When** they create a new game with opponent, date, time, location, and competition type, **Then** the game is saved and appears in the schedule
2. **Given** a game has been scheduled, **When** the admin records the final result (goals, winner, advanced stats), **Then** the game status changes to "completed" and displays results
3. **Given** a completed game exists, **When** a public user visits the Frontend, **Then** they see the game in the schedule with results displayed
4. **Given** an admin views a game record, **When** they update match details (date changed due to weather, final scores), **Then** changes persist and Frontend reflects the update
5. **Given** multiple games exist, **When** the admin filters by date range or opponent, **Then** the list updates to show matching games

---

### User Story 3 - Admin Manages Tournaments and Track Statistics (Priority: P2)

An admin creates tournaments, associates games with tournaments, and the system automatically aggregates player statistics. This enables strategic analysis and ranking.

**Why this priority**: Tournaments and statistics provide deeper analytics but are secondary to core game scheduling. The platform functions with just games/roster, but tournaments add competitive structure.

**Independent Test**: Can be tested by creating a tournament, adding games to it, recording player performances, and verifying aggregated statistics are correct and displayed on Frontend.

**Acceptance Scenarios**:

1. **Given** an admin is in the Tournaments section, **When** they create a new tournament (name, date range, format), **Then** the tournament is created and ready to receive games
2. **Given** a tournament exists, **When** an admin associates existing games with this tournament, **Then** the games are linked and appear under that tournament
3. **Given** games with player statistics are recorded, **When** an admin views a player's stats, **Then** they see aggregated data (goals, assists, appearances) for the season/tournament
4. **Given** tournament games are completed, **When** a public user views the Frontend, **Then** they see tournament standings and individual player statistics

---

### User Story 4 - Player Confirms Game Participation (Priority: P2)

A player logs into the Frontend with their credentials, views upcoming games, confirms their attendance/participation status, and can bring non-registered friends to play. This helps the team with game preparation and allows flexible roster expansion.

**Why this priority**: Player participation confirmation is valuable for team organization and the "bring a friend" feature enables community growth and flexible team composition. Secondary to public-facing information but important for team logistics.

**Independent Test**: Can be tested by player logging in, viewing scheduled games, confirming attendance with optional friends, verifying guest player records are created, and admin seeing all participants (registered + guests) in CMS.

**Acceptance Scenarios**:

1. **Given** a player is logged into the Frontend, **When** they navigate to "My Games", **Then** they see upcoming games they're assigned to with option to confirm participation
2. **Given** a player views an upcoming game, **When** they click "Confirm Participation" and save, **Then** their status changes to "confirmed" in the system
3. **Given** a player is confirming participation, **When** they add friends' names (e.g., "Juan", "Carlos") via "Bring a Friend" form, **Then** the system creates guest player records named "Friend of [Player Name]" and adds them to the game participant list
4. **Given** a player has confirmed with 2 friends, **When** an admin views the game in CMS, **Then** they see the participant list showing the registered player (confirmed) and 2 guest players with names like "Friend of Diego"
5. **Given** a guest player was added to a game, **When** a public user views the game participants on Frontend, **Then** they see both registered and guest players clearly distinguished (e.g., badge or label "Guest")
6. **Given** a player modifies their confirmation status, **When** the admin refreshes the game view, **Then** the updated status is reflected immediately; guest players invited by that player remain in the participant list

---

### User Story 5 - Public User Browses Team Information (Priority: P1)

Fans, supporters, and community members visit the public Frontend to view team roster, upcoming games, results, and statistics without needing to log in.

**Why this priority**: The primary value of the platform is being a public-facing source of team information. All supporters expect to view schedules and results without authentication.

**Independent Test**: Can be tested by accessing the Frontend without login and verifying all public information (roster, games, past results, statistics) is displayed correctly.

**Acceptance Scenarios**:

1. **Given** a public user visits the Frontend homepage, **When** they view the page, **Then** they see key team information (name, description, current season highlights) without log in
2. **Given** a public user navigates to the roster page, **When** they view it, **Then** they see all players with positions, numbers, and photos
3. **Given** a public user views the schedule page, **When** they look at upcoming games, **Then** they see opponent, date, time, and location for each game
4. **Given** games have been completed, **When** a public user views past games, **Then** they see final scores and key statistics
5. **Given** public user visits the statistics page, **When** they view player stats, **Then** they see goals, assists, appearances, and other relevant metrics per player

---

### User Story 6 - Editor Maintains Content Accuracy (Priority: P2)

An editor with more limited permissions than admin can update game results, player stats, and tournament information but cannot manage users or system settings.

**Why this priority**: Editorial role allows content management delegation without full admin access, improving team efficiency. Secondary to core admin functions.

**Independent Test**: Can be tested by editor logging in, updating a game result, and verifying changes appear in API and Frontend, while editor cannot access user management areas.

**Acceptance Scenarios**:

1. **Given** an editor is logged into CMS, **When** they navigate to games section, **Then** they can view and edit game records
2. **Given** an editor attempts to access user management, **When** they try to navigate there, **Then** they see a permission denied message
3. **Given** an editor updates a player's statistics, **When** they save the changes, **Then** the updates are reflected in the API
4. **Given** an editor makes content updates, **When** an admin reviews the changes, **Then** they verify accuracy and can further edit if needed

---

### Edge Cases

- What happens when a player is deactivated but games record they participated in? The player status changes to INACTIVE, they're hidden from active roster, but all historical game participations and statistics are preserved and remain visible in past games.
- What happens when a registered player who invited guest players is deactivated? The registered player becomes INACTIVE but guest player records remain intact with their invitedById reference preserved for historical traceability.
- What happens when an opponent team is deleted? Database FK constraint prevents deletion if team is referenced in any historical games, returning a 409 Conflict error.
- How does the system handle duplicate player records? The system prevents duplicate jersey numbers among ACTIVE REGISTERED players per season; INACTIVE players' jersey numbers can be reused.
- What if a registered player tries to bring a friend to a game that has already been played? The system prevents this with error "Cannot add participants to past games" (only Admin can modify post-match).
- What if a player confirms participation and brings 5 friends? The system accepts this and creates 5 guest player records, all linked to the confirming player via invitedById. Each guest appears in the participant list.
- Can a guest player be converted to a registered player later? Yes - Admin can create a proper Player record with playerType=REGISTERED and update historical GameParticipant records to reference the new player ID.
- How are large rosters (30+ active players + guest players) handled in the Frontend UI? The system provides pagination, filtering, and search; roster lists show only ACTIVE REGISTERED players by default.
- What if the CMS API becomes temporarily unavailable? The Frontend displays cached data (if available) with a notification that data may be out of date.
- How are timezone differences handled for game scheduling? Games are stored in UTC with local display based on team's configured timezone.
- What happens if file upload fails for player photo? The system returns a 400 Bad Request with error details (invalid format, file too large, etc.); player record creation/update fails atomically.
- Can guest players confirm other guests? No - only registered players with User accounts can confirm participation and bring friends. Guest players have no login credentials.
- What if duplicate guest names are added (e.g., two players each bring "Friend of..." to same game)? The system allows this - guest players are distinguished by their unique IDs and invitedById references.

---

## Requirements _(mandatory)_

### Functional Requirements

#### CMS System - Core

- **FR-001**: CMS MUST provide a web-based admin dashboard with user authentication and session management
- **FR-002**: CMS MUST implement role-based access control (RBAC) with three roles: Admin, Editor, and Player
- **FR-003**: Admin role MUST have full CRUD permissions for all data entities (players, games, tournaments, statistics, opponent teams)
- **FR-004**: Editor role MUST have read and update permissions for game metadata (date, location, notes, tournament association) but NOT game scores, player lists, user management, or system settings; only Admin can edit scores and assigned players
- **FR-005**: Player role MUST have read access to their own player record and associated games, and the ability to confirm participation status before matchday; Admin can override participation after match completion
- **FR-006**: CMS MUST persist all data changes to a persistent data store
- **FR-007**: CMS MUST support user creation/deletion/management for Admin and Editor roles

#### CMS System - Player Management

- **FR-008**: Admins MUST be able to create player records with fields: name, position, jersey number, date of birth, contact info, photo uploads (stored in external object storage), and season association
- **FR-009**: Admins MUST be able to edit existing player records
- **FR-010**: Admins MUST be able to deactivate players (soft delete) by setting status to INACTIVE; inactive players are hidden from roster but preserved in historical games
- **FR-011**: Admins MUST be able to reactivate previously deactivated players by setting status back to ACTIVE
- **FR-012**: The system MUST prevent creating players with duplicate jersey numbers among ACTIVE players within the same team/season
- **FR-013**: Players MUST be searchable by name, position, and other key attributes; searches default to ACTIVE players only
- **FR-014**: System MUST provide file upload functionality for player photos with validation (format: JPG/PNG, max size: 5MB) and storage in external object storage (Cloudflare R2, Cloudinary, or Supabase Storage)

#### CMS System - Game Management

- **FR-015**: Admins MUST be able to create game records with: opponent team (FK reference), date/time, location, competition type, and assigned players
- **FR-016**: Admins MUST be able to record game results including: final score, advanced statistics (possessions, shots, fouls), and game status; Editors can update game metadata but NOT scores or player assignments
- **FR-017**: The system MUST track game status: scheduled, in-progress, completed, cancelled
- **FR-018**: Games MUST be associable with tournaments
- **FR-019**: Games MUST support filtering by date range, opponent team, and tournament
- **FR-020**: Editors MUST be able to update game metadata (date, time, location, notes, tournament association) but NOT final scores or assigned player lists

#### CMS System - Opponent Team Management

- **FR-021**: Admins MUST be able to create opponent team records with: name, logo URL (optional), colors (optional)
- **FR-022**: Admins MUST be able to edit and delete opponent teams; teams referenced in historical games are protected by database constraints
- **FR-023**: Opponent teams MUST be searchable by name
- **FR-024**: API MUST provide GET /api/teams to list all opponent teams (public)
- **FR-025**: API MUST provide POST /api/teams (Admin only), PATCH /api/teams/{id} (Admin only), DELETE /api/teams/{id} (Admin only)

#### CMS System - Game Participation & Guest Players

- **FR-026**: Registered players MUST be able to confirm their own participation in upcoming games before matchday
- **FR-027**: Registered players MUST be able to confirm participation of non-registered friends (guest players) when confirming their own participation
- **FR-028**: When a player confirms a friend's participation, the system MUST create a temporary guest player record with playerType=GUEST and name format "Friend of {inviting player name}"
- **FR-029**: Guest players MUST be linked to the inviting player via invitedById field for traceability
- **FR-030**: Guest players MUST NOT be able to log in or have User accounts
- **FR-031**: Guest players MUST appear in game participant lists and statistics but be clearly marked as guests
- **FR-032**: Admin MUST be able to convert guest players to registered players by creating proper player records and updating historical participations
- **FR-033**: Only Admin can modify game participant lists after match completion (regular players can only confirm before matchday)

#### CMS System - Tournament Management

- **FR-034**: Admins MUST be able to create tournaments with: name, date range, format (league, cup, etc.), and description
- **FR-035**: Admins MUST be able to associate games with tournaments
- **FR-036**: ~~The system MUST automatically calculate tournament standings based on game results and scoring rules~~ **DEFERRED POST-MVP**: Tournaments in MVP are grouping/categorization only for Ministros FC games; full league standings calculation not in scope
- **FR-037**: Admins MUST be able to view tournament summaries with Ministros FC's record (wins/draws/losses) and aggregate player statistics for games in that tournament

#### CMS System - Statistics & Reporting

- **FR-038**: The system MUST automatically aggregate player statistics per tournament/season (goals, assists, appearances, yellow cards, red cards) for both registered and guest players
- **FR-039**: The system MUST provide reporting views for admin analysis (top scorers, most appearances, win rates, etc.)
- **FR-040**: Statistics MUST be recalculable if game data is corrected
- **FR-041**: Guest player statistics MUST be aggregated separately and clearly marked as guest contributions

#### API Contract - Overall

- **FR-042**: CMS MUST expose a REST JSON API with proper HTTP method semantics (GET for reads, POST for creates, PATCH/PUT for updates, DELETE for deletion)
- **FR-043**: API MUST implement proper HTTP status codes (200 for success, 400 for client errors, 401 for auth failures, 403 for permissions, 404 for not found, 500 for server errors)
- **FR-044**: API MUST require authentication via JWT tokens or session-based auth for protected endpoints
- **FR-045**: API MUST enforce role-based access control on all endpoints, returning 403 Forbidden for unauthorized requests
- **FR-046**: API responses MUST follow a consistent JSON structure with proper error messages

#### API Contract - Player Endpoints

- **FR-047**: API MUST provide `GET /api/players` to list all ACTIVE players by default (public, with optional filtering); Admin can include status=INACTIVE to see deactivated players
- **FR-048**: API MUST provide `GET /api/players/{id}` to retrieve a single player's details (public, includes playerType and invitedBy for guest players)
- **FR-049**: API MUST provide `POST /api/players` to create registered players (Admin only, requires auth, supports multipart/form-data for photo upload)
- **FR-050**: API MUST provide `PATCH /api/players/{id}` to update player data (Admin only, requires auth, supports photo replacement)
- **FR-051**: API MUST provide `PATCH /api/players/{id}/status` to deactivate/reactivate players (Admin only, sets status to ACTIVE or INACTIVE)
- **FR-052**: API MUST provide `POST /api/players/{id}/photo` to upload player photo (Admin only, multipart/form-data, validates file type/size)
- **FR-053**: API MUST provide `POST /api/players/guest` to create guest player records (authenticated Player can create when confirming game participation with friends)

#### API Contract - Game Endpoints

- **FR-054**: API MUST provide `GET /api/games` to list games with filtering (public, can filter by date, opponent team ID, status)
- **FR-055**: API MUST provide `GET /api/games/{id}` to retrieve game details including participants (registered and guests) and results (public)
- **FR-056**: API MUST provide `POST /api/games` to create games (Admin only, requires auth, requires opponentTeamId FK)
- **FR-057**: API MUST provide `PATCH /api/games/{id}` to update game metadata (Admin/Editor); only Admin can update scores and player assignments
- **FR-058**: API MUST provide `DELETE /api/games/{id}` to delete games (Admin only, requires auth)
- **FR-059**: API MUST provide `PATCH /api/games/{id}/status` to update game status (Admin only)

#### API Contract - Game Participation Endpoints

- **FR-060**: API MUST provide `GET /api/games/{id}/participants` to list all participants (registered and guests) with confirmation status (public for basic info, auth required for detailed status)
- **FR-061**: API MUST provide `POST /api/games/{id}/participants/confirm` for registered players to confirm their own participation and optionally bring friends (requires player auth, only before matchday)
- **FR-062**: When confirming with friends via FR-061, request body MUST accept `friends: [{name: string}]` array to create guest player records
- **FR-063**: API MUST provide `PATCH /api/games/{id}/participants/{playerId}/status` for Admin to modify any participant status or remove participants after match completion

#### API Contract - Tournament Endpoints

- **FR-064**: API MUST provide `GET /api/tournaments` to list tournaments (public)
- **FR-065**: API MUST provide `GET /api/tournaments/{id}` to get tournament details with standings (public)
- **FR-066**: API MUST provide `POST /api/tournaments` to create tournaments (Admin only)
- **FR-067**: API MUST provide `PATCH /api/tournaments/{id}` to update tournament data (Admin/Editor)

#### API Contract - Statistics Endpoints

- **FR-068**: API MUST provide `GET /api/statistics/players` to get player statistics (public, aggregated by season/tournament, distinguishes registered vs guest players)
- **FR-069**: API MUST provide `GET /api/statistics/players/{id}` to get individual player statistics (public, includes guest appearances count)
- **FR-070**: API MUST provide `GET /api/statistics/tournament/{id}` to get tournament-wide statistics (public)

#### Frontend Application

- **FR-071**: Frontend MUST consume the CMS REST API to fetch and display team data
- **FR-072**: Frontend MUST be built with Nuxt.js v4 and TypeScript
- **FR-073**: Frontend MUST display team roster with ACTIVE player information only (name, position, number, uploaded photo); guest players shown only in game contexts
- **FR-074**: Frontend MUST display game schedule with upcoming and past games showing opponent team names and logos
- **FR-075**: Frontend MUST display game results with scores and statistics, distinguishing registered players from guests
- **FR-076**: Frontend MUST display tournament information with standings and schedules
- **FR-077**: Frontend MUST display player statistics pages with aggregated metrics, separating registered and guest contributions
- **FR-078**: Frontend MUST be fully functional for unauthenticated users viewing public information
- **FR-079**: Frontend MUST provide player authentication to allow players to confirm game participation before matchday
- **FR-080**: Frontend MUST display a personalized "My Games" view for authenticated players with option to "Bring a Friend" when confirming participation
- **FR-081**: Frontend MUST provide a form for players to add friend names when confirming participation (creates guest player records)
- **FR-082**: Frontend MUST have a responsive design that works on mobile (< 768px), tablet (768-1024px), and desktop (> 1024px) with appropriate breakpoints

#### Monorepo Structure & Development

- **FR-083**: Monorepo MUST use npm workspaces to manage CMS and Frontend as sub-projects
- **FR-084**: Monorepo MUST include a shared package with common types and utility functions (including PlayerType enum for REGISTERED | GUEST)
- **FR-085**: Both sub-projects MUST use TypeScript with strict mode enabled
- **FR-086**: Both sub-projects MUST have clear folder structure (src/components, src/pages, src/services, etc.)
- **FR-087**: Monorepo MUST have a root package.json that defines workspace scripts (build, test, dev for all projects)
- **FR-088**: Monorepo MUST have proper .gitignore configuration for dependencies and build artifacts
- **FR-089**: Development environment MUST support running both CMS and Frontend concurrently
- **FR-090**: Both sub-projects MUST be independently deployable while maintaining API compatibility

### Key Entities

#### User

Represents an authenticated user with a role in the system.

- **Attributes**: id, email, passwordHash, name, role (Admin | Editor | Player), createdAt, updatedAt, lastLoginAt
- **Relationships**: If role is Player, linked to one Player record
- **Constraints**: Email must be unique, password must be securely hashed

#### Player

Represents a team player (registered) or a guest player (friend brought by registered player).

- **Attributes**: id, name, position, jerseyNumber, dateOfBirth, contactInfo, photoUrl (external object storage URL), seasonAssociations, playerType (REGISTERED | GUEST), invitedById (FK to Player who invited, null for registered), status (ACTIVE | INACTIVE), createdAt, updatedAt
- **Relationships**: May be linked to a User (only for REGISTERED players); participates in Games; has Statistics records; invitedBy references another Player (for GUEST type)
- **Constraints**: Jersey number must be unique among ACTIVE REGISTERED players per season/team; GUEST players can have null jersey numbers; status defaults to ACTIVE; GUEST players cannot have User accounts

#### OpponentTeam

Represents a rival team that plays against the owner team (Ministros F.C.).

- **Attributes**: id, name, logoUrl (optional), colors (optional), createdAt, updatedAt
- **Relationships**: Referenced in Games as opponent; can participate in Tournaments via games
- **Constraints**: Name should be unique; teams referenced in historical games are protected by database FK constraints

#### Game (Match)

Represents a single scheduled or completed game/match.

- **Attributes**: id, opponentTeamId (FK to OpponentTeam), date, time, location, competitionType, status (scheduled|in-progress|completed|cancelled), homeTeamScore (Ministros F.C. score), awayTeamScore (opponent score), advancedStats (possession, shots, fouls, etc.), notes, createdAt, updatedAt
- **Relationships**: References OpponentTeam; has multiple Participants (Player participation records); belongs to zero or one Tournament; has Statistics entries
- **Constraints**: Cannot be in past with scheduled status; scores required for completed status; opponentTeamId must reference valid OpponentTeam

#### GameParticipant

Represents a player's (registered or guest) association with and participation status in a game.

- **Attributes**: id, gameId, playerId, confirmationStatus (confirmed|declined|not-responded), isGuest (boolean, derived from Player.playerType), confirmedById (FK to Player who confirmed this participant, null if self-confirmed), notes, createdAt, updatedAt
- **Relationships**: References Game and Player; confirmedBy references the Player who invited/confirmed (for guest players)
- **Constraints**: One entry per player per game; guest players automatically have confirmed status when created

#### Tournament

Represents a competition or season grouping for Ministros FC games (MVP scope: categorization only, not full league management).

- **Attributes**: id, name, dateRange (start, end), format (league|cup|friendly|season), description, createdAt, updatedAt
- **Relationships**: Contains multiple Games (Ministros FC games only); has aggregate Statistics for Ministros FC players
- **Constraints**: End date must be after start date
- **MVP Note**: Tournaments group Ministros FC's own games; system does NOT track other teams' results or calculate league-wide standings

#### TeamStatistics

Aggregated metrics for a player, season, or tournament.

- **Attributes**: id, playerId, tournamentId (or seasonId), goals, assists, appearances, yellowCards, redCards, fouls, shotsOnTarget, passAccuracy, createdAt, lastCalculatedAt
- **Relationships**: References Player and Tournament/Season
- **Constraints**: All counters must be >= 0; calculated from game participation records

#### TeamInfo

Represents the owner team (Ministros F.C.) with complete information.

- **Attributes**: id, name, description, foundedYear, colors, location, contactInfo, website, socialLinks
- **Relationships**: Conceptually owns all Players; all Games are played by this team against OpponentTeams
- **Constraints**: Single record per installation (hardcoded/seeded for MVP, not admin-editable)

---

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: Admin can create a complete player roster (20+ players) in under 10 minutes using the CMS interface
- **SC-002**: Frontend loads roster page with 20+ players in under 2 seconds on standard internet connection
- **SC-003**: API responds to all game/player queries in under 500ms on average
- **SC-004**: CMS system handles 50+ concurrent admin users without performance degradation
- **SC-005**: Frontend homepage loads in under 1 second and displays core team information without authentication
- **SC-006**: Admin can schedule a game with all details (opponent, date, time, location) in under 1 minute
- **SC-007**: Players can confirm game participation in under 30 seconds after logging in
- **SC-008**: All RBAC checks are enforced correctly - Editors cannot access user management, Players cannot modify game data (100% enforcement verified through testing)
- **SC-009**: Tournament standings calculate correctly within 5 seconds of final game completion
- **SC-010**: Player statistics aggregation is accurate (matches manual calculation verification) for all test scenarios
- **SC-011**: 95% of public Frontend pages function correctly without any authentication required
- **SC-012**: API documentation is complete and provides clear examples for CMS-Frontend integration
- **SC-013**: Monorepo build completes for both CMS and Frontend in under 60 seconds on developer machines
- **SC-014**: Shared types package provides 90%+ type safety coverage across CMS and Frontend (zero type errors in integration tests)
- **SC-015**: Deployment script successfully deploys CMS and Frontend independently without conflicts

---

## Assumptions & Design Decisions

### Authentication & Security

- CMS authentication uses email/password with JWT token-based session management for API
- Player authentication on Frontend uses the same credentials as Player users in CMS
- Passwords are hashed using bcrypt or equivalent with salt
- JWT tokens have 24-hour expiration with refresh token mechanism
- HTTPS/TLS required for all API endpoints in production
- Rate limiting on authentication endpoints using in-memory rate limiter (express-rate-limit) to prevent brute-force attacks

### Data & Storage

- All dates are stored in UTC and displayed in team's local timezone
- Single owner team installation (Ministros F.C.); opponent teams are admin-manageable entities
- Player photos are uploaded to external object storage (Cloudflare R2, Cloudinary, or Supabase Storage free tier; < 100 images total estimated), with URLs stored in database photoUrl field
- File uploads validated: JPG/PNG formats only, max 5MB per file
- Historical statistics are preserved even if game data is corrected; amendments create new stat records
- Players use soft-delete pattern (status: ACTIVE | INACTIVE); inactive players are hidden from roster but preserved in historical games and statistics
- Guest players (brought by registered players) are stored as Player records with playerType=GUEST and linked to the inviting player via invitedById
- Opponent teams can be deleted; database foreign key constraints prevent deletion if referenced in historical games (returns 409 Conflict)

### API Design

- API versioning via URL path (/api/v1/) for future compatibility
- Pagination implemented with limit, offset on list endpoints
- Filtering via query parameters (e.g., ?status=completed&from=2024-01-01)
- Error responses always include error code and human-readable message
- API follows REST principles with resource-oriented endpoints
- CORS policy: Allow specific origins (production frontend domain + localhost origins in development); credentials allowed for auth cookies/headers

### Frontend Architecture

- Nuxt.js 4 with App Router (Nuxt 4 standard)
- UI framework: TBD by implementation team (could be Tailwind, shadcn/ui, etc.) - not specified
- State management via composables and pinia store as needed
- Image optimization via Nuxt Image component
- Mobile-first responsive design
- 404 error pages when API data is not found; graceful handling of API errors

### Development Practices

- Shared types package centralized in `/packages/types` with TypeScript strict mode
- Shared utilities package for common functions (formatting, calculations, validation)
- Git-based version control with feature branch workflow
- Environment configuration via .env files (not committed)
- Both CMS and Frontend can be developed/tested independently
- Logging: Structured JSON logging via Pino with environment-based levels (INFO+ in production, DEBUG in development); includes request correlation IDs and audit logging for sensitive operations

---

## Notes & Future Considerations

- This specification focuses on MVP scope: roster, game scheduling, basic statistics, and RBAC
- Future enhancements could include: full tournament/league management with standings calculation (tracking all teams' results, not just Ministros FC), email notifications for game confirmations, coaching staff management, video highlights integration, real-time match commentary, mobile app, social features
- Performance optimizations and caching strategies will be determined during implementation planning
- Specific UI/UX design details and component libraries are deferred to design phase
- Database choice (PostgreSQL, MongoDB, etc.) is deferred to implementation planning
- Specific deployment platform (Vercel, self-hosted, etc.) is deferred to infrastructure planning
