# Phase 1 Design: Data Model & Schema

**Date**: March 17, 2026 | **Status**: Complete | **Purpose**: Entity definitions, database schema, validation rules

---

## Data Model Overview

The Ministros FC platform uses a relational data model with the following core entities and relationships:

```
TeamInfo (1) ── Owner Team (Ministros F.C., hardcoded)

OpponentTeam (M) ── Referenced in Games as opponent

User (1) ── (0..1) Player [if role=Player, only for REGISTERED players]
     │
     └─ role: "Admin" | "Editor" | "Player"

Player (M) ── (M) Game [through GameParticipant]
      │
      ├─ (M) Statistics [aggregated per Tournament]
      ├─ playerType: "REGISTERED" | "GUEST"
      ├─ status: "ACTIVE" | "INACTIVE" (soft delete)
      └─ invitedBy (0..1) Player [for GUEST type, references inviting player]

Game (1) ── (1) OpponentTeam [opponent via opponentTeamId FK]
    │
    ├─ (M) GameParticipant [registered + guest players]
    ├─ (M) Statistics [from participants]
    └─ (0..1) Tournament

Tournament (1) ── (M) Game
           │
           └─ (M) Statistics [aggregated standings]

GameParticipant (M) ── (1) Game
               │
               ├─ (1) Player [registered or guest]
               └─ confirmedBy (0..1) Player [who added this participant]
```

---

## Entity Definitions & Prisma Schema

### 1. User Entity

**Purpose**: Authentication and authorization. Every admin must have a User record.

```prisma
model User {
  id              String      @id @default(uuid())
  email           String      @unique
  passwordHash    String      // bcrypt hashed password
  name            String
  role            Role        @default(PLAYER)  // ADMIN | EDITOR | PLAYER
  player          Player?     @relation(fields: [playerId], references: [id], onDelete: SetNull)
  playerId        String?     @unique

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  lastLoginAt     DateTime?

  @@index([email])
  @@index([role])
}

enum Role {
  ADMIN
  EDITOR
  PLAYER
}
```

**Validation Rules**:

- `email`: Must be valid email format, unique across system.
- `passwordHash`: 8+ characters before hashing, bcrypt cost factor 12.
- `role`: Only "ADMIN" and "EDITOR" can be assigned by admins. "PLAYER" auto-assigned when player creates account.
- `playerId`: Optional; links User → Player for player accounts. Ensures one User per Player.

**Access Control**:

- Only Admin can create/delete User records.
- User can update their own password; editors cannot view other users' passwords.

---

### 2. Player Entity

**Purpose**: Core entity representing registered team players and guest players (friends brought by registered players).

```prisma
model Player {
  id              String      @id @default(uuid())
  name            String      @db.VarChar(255)
  nickname        String?     @db.VarChar(100)  // Apodo - player's nickname/alias

  // Player type and status
  playerType      PlayerType  @default(REGISTERED)  // REGISTERED | GUEST
  status          PlayerStatus @default(ACTIVE)     // ACTIVE | INACTIVE (soft delete)

  // Guest player tracking
  invitedBy       Player?     @relation("GuestInvites", fields: [invitedById], references: [id], onDelete: SetNull)
  invitedById     String?     // FK to Player who invited (only for GUEST type)
  invitedGuests   Player[]    @relation("GuestInvites")  // Guests this player invited

  position        Position?   // GOALKEEPER | DEFENDER | MIDFIELDER | FORWARD (nullable for guests)
  jerseyNumber    Int?        // Nullable for GUEST players
  dateOfBirth     String?     // ISO 8601 format (YYYY-MM-DD), NULL if undefined
  height          Int?        // Height in centimeters
  dominantFoot    Foot?       // LEFT | RIGHT | AMBIDEXTROUS
  nationalId      String?     // DNI - National identification number (admin only visible)
  contactInfo     Contact?    @relation("PlayerContact")
  photoUrl        String?     // External object storage URL (Cloudflare R2, Cloudinary, or Supabase)

  // Relationships
  stats           Statistics[] @relation("PlayerStats")
  gameParticipants GameParticipant[] @relation("PlayerParticipant")
  user            User?       // Only REGISTERED players can have User accounts

  // Tracking
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@unique([jerseyNumber], where: { status: ACTIVE, playerType: REGISTERED })  // Unique among active registered players
  @@index([status])
  @@index([playerType])
  @@index([position])
  @@index([invitedById])
}

enum PlayerType {
  REGISTERED  // Normal team player with optional User account
  GUEST       // Friend brought by registered player ("Friend of...")
}

enum PlayerStatus {
  ACTIVE      // Visible in roster, can participate in games
  INACTIVE    // Deactivated (soft delete), hidden from roster but preserved in history
}

enum Foot {
  LEFT
  RIGHT
  AMBIDEXTROUS
}

model Contact {
  id              String      @id @default(uuid())
  playerId        String      @unique
  player          Player      @relation("PlayerContact", fields: [playerId], references: [id], onDelete: Cascade)

  phone           String?
  whatsapp        String?     // WhatsApp number for group notifications
  emergencyContact String?
}

enum Position {
  GOALKEEPER
  DEFENDER
  MIDFIELDER
  FORWARD
}
```

**Validation Rules**:

- `name`: Required, 1-255 characters. For GUEST players, format "Friend of {InvitingPlayerName}".
- `nickname`: Optional, 1-100 characters.
- `playerType`: Required, defaults to REGISTERED. GUEST players created when registered player confirms participation with friends.
- `status`: Required, defaults to ACTIVE. Set to INACTIVE for soft delete (preserves historical data).
- `invitedById`: Required for GUEST players, NULL for REGISTERED. References the Player who invited this guest.
- `position`: Required for REGISTERED players, nullable for GUEST players.
- `jerseyNumber`: Required for REGISTERED players, unique among ACTIVE REGISTERED players. Nullable for GUEST players.
- `dateOfBirth`: Optional, ISO 8601 format (YYYY-MM-DD).
- `photoUrl`: Optional, external object storage URL (Cloudflare R2, Cloudinary, or Supabase Storage). Uploaded photos validated: JPG/PNG, max 5MB. CMS uploads to object storage and stores returned URL.
- `nationalId`: Optional, PRIVATE FIELD (admin only).
- `user`: Only REGISTERED players can have linked User account. GUEST players cannot log in.

**Access Control**:

- **Public**: Can view ACTIVE REGISTERED players (name, nickname, position, jerseyNumber, photoUrl). GUEST players visible only in game context.
- **Authenticated Player**: Can view own full details (except nationalId).
- **Editor+**: Can view and edit all fields except nationalId.
- **Admin only**: Full CRUD including nationalId; can deactivate/reactivate players; can convert GUEST to REGISTERED.

---

### 3. OpponentTeam Entity

**Purpose**: Represents rival soccer teams that play against Ministros F.C. Provides admin-manageable opponent roster.

```prisma
model OpponentTeam {
  id              String      @id @default(uuid())
  name            String      @db.VarChar(255)  // Team name (e.g., "Sporting", "Real Madrid")
  logoUrl         String?     // URL to team logo/crest (optional)
  colors          String?     @db.VarChar(100)  // Team colors (e.g., "Red and White")
  city            String?     @db.VarChar(255)
  country         String?     @db.VarChar(100)

  // Relationships
  games           Game[]      @relation("OpponentGames")  // Games where this team is opponent

  // Tracking
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@unique([name])  // Team name must be unique
  @@index([name])
}
```

**Validation Rules**:

- `name`: Required, 1-255 characters. Must be unique across all opponent teams.
- `logoUrl`: Optional, valid URL format to team logo/crest image.
- `colors`: Optional, 1-100 characters (e.g., "Blue and Yellow").
- `city`, `country`: Optional, for display purposes.

**MVP Usage**:

- Admin creates opponent teams when scheduling games.
- Cannot delete opponent team if referenced in historical games (FK constraint returns 409).
- Public API exposes opponent teams for display in game schedules.

**Access Control**:

- **Public**: Can view all opponent team information.
- **Editor**: Can create and edit opponent teams.
- **Admin only**: Can delete opponent teams (if no historical game references).

---

### 4. TeamInfo Entity (Owner Team)

**Purpose**: Represents the owner team (Ministros F.C.) with complete information. Single record, hardcoded/seeded for MVP.

```prisma
model TeamInfo {
  id              String      @id @default(uuid())
  name            String      @db.VarChar(255)  // "Ministros F.C."
  description     String?     @db.Text
  foundedYear     Int?
  colors          String?     @db.VarChar(100)  // e.g., "Gold and Black"
  logoUrl         String?     // URL to team logo
  location        String?     @db.VarChar(255)  // City/neighborhood
  contactEmail    String?     @db.VarChar(255)
  website         String?     @db.VarChar(255)
  socialLinks     Json?       // {"facebook": "url", "instagram": "url", "twitter": "url"}

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
}
```

**Validation Rules**:

- `name`: Required, defaults to "Ministros F.C.".
- Single record constraint: System should only have ONE TeamInfo record (enforced via seeding, not editable in MVP).
- All other fields optional.

**MVP Constraint**:

- **NOT admin-editable** in MVP. Hardcoded values seeded during database initialization.
- Post-MVP: Can add admin UI for team info management.

**Access Control**:

- **Public**: Can view all team info (used on homepage, about page).
- **Admin**: Read-only in MVP (future: full edit access).

---

### 5. Game Entity

**Purpose**: Represents scheduled and completed games/matches between two teams.

```prisma
model Game {
  id              String        @id @default(uuid())

  // Team relationships (flexible for future multi-team support)
  homeTeam        Team          @relation("HomeTeam", fields: [homeTeamId], references: [id], onDelete: Restrict)
  homeTeamId      String
  awayTeam        Team          @relation("AwayTeam", fields: [awayTeamId], references: [id], onDelete: Restrict)
  awayTeamId      String

  // Game details
  date            DateTime      // Game start datetime (stored UTC)
  location        String?       @db.VarChar(255)  // Stadium/field name
  competitionType CompetitionType @default(FRIENDLY)
  status          GameStatus    @default(SCHEDULED)

  // Scores and stats
  homeTeamScore   Int?          // Goals by home team
  awayTeamScore   Int?          // Goals by away team

  // Advanced stats (Ministros F.C. perspective)
  possession      Float?        // Ministros F.C. possession percentage (0-100)
  shotsOnTarget   Int?          // Ministros F.C. shots on target
  fouls           Int?          // Ministros F.C. fouls

  notes           String?       @db.Text

  // Relationships
  tournament      Tournament?   @relation(fields: [tournamentId], references: [id], onDelete: SetNull)
  tournamentId    String?

  participants   GameParticipant[] @relation("GameParticipants")  // Registered + Guest players
  statistics     Statistics[]  @relation("GameStats")

  // Tracking
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt

  @@index([date])
  @@index([status])
  @@index([opponentTeamId])
  @@index([tournamentId])
}

enum GameStatus {
  SCHEDULED
  IN_PROGRESS
  COMPLETED
  CANCELLED
}

enum CompetitionType {
  FRIENDLY
  LEAGUE
  CUP
  TOURNAMENT
  PLAYOFF
}
```

**Validation Rules**:

- `opponentTeamId`: Required. Must reference valid OpponentTeam.
- `date`: Required, must be valid datetime.
- `location`: Optional, typically stadium name or field address.
- `homeTeamScore`, `awayTeamScore`: Required for COMPLETED status, must be ≥0 and ≤200 (sanity check).
- `status`: Defaults to SCHEDULED. Admin can update to IN_PROGRESS, COMPLETED, CANCELLED.
- `possession`: If provided, must be 0-100 float.
- `shotsOnTarget`, `fouls`: If provided, must be ≥0.
- `tournamentId`: Optional; can be associated with 0 or 1 tournament.
- `competitionType`: Defaults to FRIENDLY, but can be LEAGUE, CUP, TOURNAMENT, PLAYOFF.

**Access Control**:

- Public: Can view all COMPLETED and SCHEDULED games (excludes CANCELLED for v1).
- Authenticated Player: Can view games assigned to them via GameParticipant.
- Editor+: Can view and edit game data (including results).
- Admin only: Can delete games, mark as CANCELLED.

---

### 6. GameParticipant Entity

**Purpose**: Junction table linking Players (registered and guest) to Games with participation metadata and tracking.

```prisma
model GameParticipant {
  id              String      @id @default(uuid())
  game            Game        @relation("GameParticipants", fields: [gameId], references: [id], onDelete: Cascade)
  gameId          String
  player          Player      @relation("PlayerParticipant", fields: [playerId], references: [id], onDelete: Cascade)
  playerId        String

  // Participation tracking
  confirmationStatus ConfirmationStatus @default(NOT_RESPONDED)

  // Guest player tracking
  confirmedBy     Player?     @relation("ConfirmedParticipants", fields: [confirmedById], references: [id], onDelete: SetNull)
  confirmedById   String?     // FK to Player who added/confirmed this participant (for guests or admin assignments)

  notes           String?     // e.g., "Injured", "Available after 6pm"

  // Performance stats (recorded by admin after game)
  goalsScored     Int?        @default(0)
  assists         Int?        @default(0)
  yellowCards     Int?        @default(0)
  redCards        Int?        @default(0)
  minutesPlayed   Int?        // 0-90+ (if applicable)

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  confirmedAt     DateTime?   // Timestamp when player confirmed

  @@unique([gameId, playerId])  // One entry per player per game
  @@index([gameId])
  @@index([playerId])
  @@index([confirmedById])
  @@index([confirmationStatus])
}

enum ConfirmationStatus {
  NOT_RESPONDED
  CONFIRMED
  DECLINED
}
```

**Validation Rules**:

- `gameId`, `playerId`: Both required; combination must be unique.
- `confirmationStatus`: Defaults to NOT_RESPONDED.
  - Registered players can confirm before matchday.
  - Guest players auto-set to CONFIRMED when created.
  - Only Admin can modify after game completion.
- `confirmedById`:
  - NULL if self-confirmed (registered player confirms own participation).
  - Set to inviting player ID when guest is brought by registered player.
  - Set to Admin user's linked player ID when Admin assigns participants.
- `goalsScored`, `assists`, `yellowCards`, `redCards`: All must be ≥0.
- `minutesPlayed`: If game is completed, typically 0-90 (or 90+ for extra time).
- `confirmedAt`: Auto-timestamped when confirmationStatus changes to CONFIRMED.

**Access Control**:

- **Public**: Can view participant list (names only), not confirmation status.
- **Authenticated Player with playerId**: Can update own confirmation status (only before matchday); can add friends (creates GUEST players).
- **Editor+**: Can view confirmation status and stats.
- **Admin only**: Can modify participants list, performance stats, confirmation status at any time.

---

### 6. Tournament Entity

**Purpose**: Groups Ministros FC games by competition or season (MVP scope: categorization only, NOT full league management tracking all teams' results).

```prisma
model Tournament {
  id              String      @id @default(uuid())
  name            String      @db.VarChar(255)
  description     String?     @db.Text
  startDate       DateTime
  endDate         DateTime
  format          TournamentFormat @default(LEAGUE)

  // Relationships
  games           Game[]      @relation()
  statistics      Statistics[] @relation("TournamentStats")

  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  @@index([startDate])
  @@index([format])
}

enum TournamentFormat {
  LEAGUE           // Participating in a league
  CUP              // Participating in a cup competition
  SEASON           // General season grouping
  FRIENDLY_SERIES  // Series of friendly matches
}
```

**Validation Rules**:

- `name`: Required, 1-255 characters.
- `startDate`, `endDate`: Both required, endDate must be after startDate.
- `description`: Optional, free-form text.
- `format`: Required, must be one of enum values.

**MVP Scope Notes**:

- **Tournaments group Ministros FC's own games only** (e.g., "Spring League 2026")
- **NO full league standings calculation** - system does NOT track other teams' results or calculate league-wide positions
- **Statistics**: Aggregates Ministros FC player statistics within tournament (goals, assists, appearances)
- **Ministros FC record**: Can calculate wins/draws/losses for Ministros FC within tournament from Game.status
- **Future enhancement**: Full league management (tracking all teams, calculating standings) deferred post-MVP (FR-036 deferred)

**Access Control**:

- Public: Can view all tournaments and Ministros FC's record within each tournament.
- Editor+: Can update tournament info (not game association—that's via Game record).
- Admin only: Can create and delete tournaments.

---

### 7. Statistics Entity

**Purpose**: Aggregated player performance metrics, calculated from GameParticipant records.

```prisma
model Statistics {
  id              String      @id @default(uuid())

  // Aggregation scope
  player          Player      @relation("PlayerStats", fields: [playerId], references: [id], onDelete: Cascade)
  playerId        String

  tournament      Tournament? @relation("TournamentStats", fields: [tournamentId], references: [id], onDelete: Cascade)
  tournamentId    String?

  game            Game?       @relation("GameStats", fields: [gameId], references: [id], onDelete: Cascade)
  gameId          String?     // Per-game snapshot (for history)

  // Aggregated metrics
  goalsScored     Int         @default(0)
  assists         Int         @default(0)
  appearances     Int         @default(0)  // Number of games participated
  yellowCards     Int         @default(0)
  redCards        Int         @default(0)
  totalMinutes    Int         @default(0)

  // Derived metrics
  goalsPerGame    Float       @default(0)   // goalsScored / appearances
  passAccuracy    Float?      // 0-100, nullable (only if tracked)

  createdAt       DateTime    @default(now())
  lastCalculatedAt DateTime   @updatedAt

  @@unique([playerId, tournamentId, gameId])  // Per-player, per-tournament aggregate
  @@index([playerId])
  @@index([tournamentId])
  @@index([gameId])
}
```

**Validation Rules**:

- `playerId`: Required.
- `tournamentId` OR `gameId`: At least one must be present (tournament-level aggregate or game-level snapshot).
- All numeric metrics: Must be ≥0.
- `goalsPerGame`: Calculated as goalsScored / appearances (if appearances > 0); otherwise 0.

**Calculation Strategy**:

1. **Trigger**: When admin completes a game:
   - For each player in GameParticipant:
     - Aggregate their stats from all games in that tournament.
     - Update Statistics record (or create if not exists).
2. **On-Demand**: FE or admin dashboard can request stats recalculation for specific tournament (PATCH /api/statistics/recalculate/{tournamentId}).

**Access Control**:

- Public: Can view tournament-level stats (top scorers, best rated players).
- Authenticated Player: Can view own stats.
- Editor+: Can view all player stats, request recalculation.

---

## Database Constraints & Indexes

### Unique Constraints

```prisma
User:       email (must be unique, case-insensitive if using PostgreSQL CITEXT)
Player:     jerseyNumber (unique per team, v1 single-team)
GameParticipant: (gameId, playerId) — one entry per player per game
Statistics: (playerId, tournamentId, gameId) — prevents duplicate aggregates
```

### Indexes for Performance

```prisma
User:           email, role
Player:         isActive, position
Game:           date, status, tournamentId, opponent
GameParticipant: gameId, playerId, confirmationStatus
Tournament:     startDate, format
Statistics:     playerId, tournamentId
```

**Rationale**:

- `Game.date`: Filtering by date range (past/upcoming games).
- `Game.status`: Finding only active games (SCHEDULED, IN_PROGRESS).
- `GameParticipant.confirmationStatus`: Finding confirmed players for a game.
- `Statistics.tournamentId`: Aggregating standings for a tournament.

---

## Data Integrity & Consistency

### Cascade Rules

- **Soft Delete Pattern**: Players marked inactive (isActive = false) retain historical data. GameParticipants and Statistics preserved.
- **Hard Delete Cascade**: If game is deleted, GameParticipants and associated Statistics are deleted (cascade constraints).
- **User Delete**: If User deleted, linked Player record remains (playerId set null, player data preserved).

### Transaction Requirements

- **Game Score Update**: Transactional block:
  1. Update Game.homeTeamScore, awayTeamScore, status.
  2. Recalculate Tournament standings (if tournamentId set).
  3. Recalculate player Statistics for this tournament.
  4. If rollback: all changes reverted.

- **Statistics Recalculation**: Transactional block:
  1. Query all GameParticipants for tournament.
  2. Aggregate goals, assists, appearances.
  3. Update or create Statistics record.
  4. If rollback: Statistics unchanged.

---

## API Response Types (TypeScript in @ministrosfc/shared)

```typescript
// Player Types
export interface Player {
  id: string;
  name: string;
  position: Position;
  jerseyNumber: number;
  dateOfBirth?: Date;
  photoUrl?: string; // External object storage URL (Cloudflare R2, Cloudinary, Supabase)
  isActive: boolean;
}

export interface PlayerWithContact extends Player {
  contact?: {
    phone?: string;
    whatsapp?: string;
    emergencyContact?: string;
  };
}

// Game Types
export interface Game {
  id: string;
  opponent: string;
  date: string; // ISO 8601 in UTC
  location?: string;
  competitionType: CompetitionType;
  status: GameStatus;
  homeTeamScore?: number;
  awayTeamScore?: number;
  possession?: number;
  shotsOnTarget?: number;
  fouls?: number;
  tournamentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GameWithParticipants extends Game {
  participants: GameParticipant[];
}

// GameParticipant Types
export interface GameParticipant {
  id: string;
  playerId: string;
  gameId: string;
  confirmationStatus: ConfirmationStatus;
  goalsScored: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed?: number;
}

// Statistics Types
export interface PlayerStatistics {
  playerId: string;
  tournamentId?: string;
  goalsScored: number;
  assists: number;
  appearances: number;
  yellowCards: number;
  redCards: number;
  goalsPerGame: number;
}

export interface TournamentStandings {
  rank: number;
  teamName: string;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}
```

---

## Prisma Schema Summary

**File Location**: `packages/cms/prisma/schema.prisma`

**Key Configuration**:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

// All models defined above in this document
```

**Migration Strategy**:

- Development: `npm run db:migrate` creates migration files.
- Production: Migrations applied via CI/CD (e.g., Flyway or Prisma Migrate in production).
- Testing: Ephemeral SQLite database per test run (no migrations needed, schema auto-created).

---

## Next Steps

1. **Finalize Prisma Schema**: Review model definitions, validate relationships, confirm indexes.
2. **Create Migration**: `npx prisma migrate dev --name init` generates migrations/ folder.
3. **Seed Database**: Create seed script populating test data (teams, players, past games).
4. **Proceed to API Contracts**: Design endpoints consuming these models.
