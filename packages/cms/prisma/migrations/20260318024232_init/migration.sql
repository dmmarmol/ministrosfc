-- CreateEnum
CREATE TYPE "Role" AS ENUM ('ADMIN', 'EDITOR', 'PLAYER');

-- CreateEnum
CREATE TYPE "PlayerType" AS ENUM ('REGISTERED', 'GUEST');

-- CreateEnum
CREATE TYPE "PlayerStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "Position" AS ENUM ('GOALKEEPER', 'DEFENDER', 'MIDFIELDER', 'FORWARD');

-- CreateEnum
CREATE TYPE "Foot" AS ENUM ('LEFT', 'RIGHT', 'AMBIDEXTROUS');

-- CreateEnum
CREATE TYPE "GameStatus" AS ENUM ('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "CompetitionType" AS ENUM ('FRIENDLY', 'LEAGUE', 'CUP', 'TOURNAMENT', 'PLAYOFF');

-- CreateEnum
CREATE TYPE "TournamentFormat" AS ENUM ('LEAGUE', 'CUP', 'SEASON', 'FRIENDLY_SERIES');

-- CreateEnum
CREATE TYPE "ConfirmationStatus" AS ENUM ('NOT_RESPONDED', 'CONFIRMED', 'DECLINED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'PLAYER',
    "playerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Player" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "nickname" VARCHAR(100),
    "playerType" "PlayerType" NOT NULL DEFAULT 'REGISTERED',
    "status" "PlayerStatus" NOT NULL DEFAULT 'ACTIVE',
    "invitedById" TEXT,
    "position" "Position",
    "jerseyNumber" INTEGER,
    "dateOfBirth" TEXT,
    "height" INTEGER,
    "dominantFoot" "Foot",
    "nationalId" TEXT,
    "photoUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Player_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "phone" TEXT,
    "whatsapp" TEXT,
    "emergencyContact" TEXT,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OpponentTeam" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "logoUrl" TEXT,
    "colors" VARCHAR(100),
    "city" VARCHAR(255),
    "country" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OpponentTeam_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TeamInfo" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "foundedYear" INTEGER,
    "colors" VARCHAR(100),
    "logoUrl" TEXT,
    "location" VARCHAR(255),
    "contactEmail" VARCHAR(255),
    "website" VARCHAR(255),
    "socialLinks" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TeamInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tournament" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3) NOT NULL,
    "format" "TournamentFormat" NOT NULL DEFAULT 'LEAGUE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tournament_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Game" (
    "id" TEXT NOT NULL,
    "opponentTeamId" TEXT NOT NULL,
    "tournamentId" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "location" VARCHAR(255),
    "competitionType" "CompetitionType" NOT NULL DEFAULT 'FRIENDLY',
    "status" "GameStatus" NOT NULL DEFAULT 'SCHEDULED',
    "homeTeamScore" INTEGER,
    "awayTeamScore" INTEGER,
    "possession" DOUBLE PRECISION,
    "shotsOnTarget" INTEGER,
    "fouls" INTEGER,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Game_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GameParticipant" (
    "id" TEXT NOT NULL,
    "gameId" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "confirmationStatus" "ConfirmationStatus" NOT NULL DEFAULT 'NOT_RESPONDED',
    "confirmedById" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "notes" TEXT,
    "goalsScored" INTEGER DEFAULT 0,
    "assists" INTEGER DEFAULT 0,
    "yellowCards" INTEGER DEFAULT 0,
    "redCards" INTEGER DEFAULT 0,
    "minutesPlayed" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GameParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Statistics" (
    "id" TEXT NOT NULL,
    "playerId" TEXT NOT NULL,
    "tournamentId" TEXT,
    "gameId" TEXT,
    "goalsScored" INTEGER NOT NULL DEFAULT 0,
    "assists" INTEGER NOT NULL DEFAULT 0,
    "appearances" INTEGER NOT NULL DEFAULT 0,
    "yellowCards" INTEGER NOT NULL DEFAULT 0,
    "redCards" INTEGER NOT NULL DEFAULT 0,
    "totalMinutes" INTEGER NOT NULL DEFAULT 0,
    "goalsPerGame" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "passAccuracy" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastCalculatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Statistics_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_playerId_key" ON "User"("playerId");

-- CreateIndex
CREATE INDEX "User_email_idx" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "Player_status_idx" ON "Player"("status");

-- CreateIndex
CREATE INDEX "Player_playerType_idx" ON "Player"("playerType");

-- CreateIndex
CREATE INDEX "Player_position_idx" ON "Player"("position");

-- CreateIndex
CREATE INDEX "Player_invitedById_idx" ON "Player"("invitedById");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_playerId_key" ON "Contact"("playerId");

-- CreateIndex
CREATE UNIQUE INDEX "OpponentTeam_name_key" ON "OpponentTeam"("name");

-- CreateIndex
CREATE INDEX "OpponentTeam_name_idx" ON "OpponentTeam"("name");

-- CreateIndex
CREATE INDEX "Tournament_startDate_idx" ON "Tournament"("startDate");

-- CreateIndex
CREATE INDEX "Tournament_format_idx" ON "Tournament"("format");

-- CreateIndex
CREATE INDEX "Game_date_idx" ON "Game"("date");

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE INDEX "Game_opponentTeamId_idx" ON "Game"("opponentTeamId");

-- CreateIndex
CREATE INDEX "Game_tournamentId_idx" ON "Game"("tournamentId");

-- CreateIndex
CREATE INDEX "GameParticipant_gameId_idx" ON "GameParticipant"("gameId");

-- CreateIndex
CREATE INDEX "GameParticipant_playerId_idx" ON "GameParticipant"("playerId");

-- CreateIndex
CREATE INDEX "GameParticipant_confirmedById_idx" ON "GameParticipant"("confirmedById");

-- CreateIndex
CREATE INDEX "GameParticipant_confirmationStatus_idx" ON "GameParticipant"("confirmationStatus");

-- CreateIndex
CREATE UNIQUE INDEX "GameParticipant_gameId_playerId_key" ON "GameParticipant"("gameId", "playerId");

-- CreateIndex
CREATE INDEX "Statistics_playerId_idx" ON "Statistics"("playerId");

-- CreateIndex
CREATE INDEX "Statistics_tournamentId_idx" ON "Statistics"("tournamentId");

-- CreateIndex
CREATE INDEX "Statistics_gameId_idx" ON "Statistics"("gameId");

-- CreateIndex
CREATE UNIQUE INDEX "Statistics_playerId_tournamentId_gameId_key" ON "Statistics"("playerId", "tournamentId", "gameId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Player" ADD CONSTRAINT "Player_invitedById_fkey" FOREIGN KEY ("invitedById") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_opponentTeamId_fkey" FOREIGN KEY ("opponentTeamId") REFERENCES "OpponentTeam"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_confirmedById_fkey" FOREIGN KEY ("confirmedById") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statistics" ADD CONSTRAINT "Statistics_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statistics" ADD CONSTRAINT "Statistics_tournamentId_fkey" FOREIGN KEY ("tournamentId") REFERENCES "Tournament"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Statistics" ADD CONSTRAINT "Statistics_gameId_fkey" FOREIGN KEY ("gameId") REFERENCES "Game"("id") ON DELETE CASCADE ON UPDATE CASCADE;
