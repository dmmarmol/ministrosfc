/*
  Warnings:

  - A unique constraint covering the columns `[date,opponentTeamId,tournamentId]` on the table `Game` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "coach" VARCHAR(255),
ADD COLUMN     "endTime" VARCHAR(5),
ADD COLUMN     "photoUrl" TEXT,
ADD COLUMN     "startTime" VARCHAR(5);

-- AlterTable
ALTER TABLE "GameParticipant" ADD COLUMN     "isStarter" BOOLEAN;

-- CreateIndex
CREATE UNIQUE INDEX "Game_date_opponentTeamId_tournamentId_key" ON "Game"("date", "opponentTeamId", "tournamentId");
