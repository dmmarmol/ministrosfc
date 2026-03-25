-- DropForeignKey
ALTER TABLE "GameParticipant" DROP CONSTRAINT "GameParticipant_playerId_fkey";

-- AlterTable
ALTER TABLE "GameParticipant" ALTER COLUMN "playerId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "GameParticipant" ADD CONSTRAINT "GameParticipant_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
