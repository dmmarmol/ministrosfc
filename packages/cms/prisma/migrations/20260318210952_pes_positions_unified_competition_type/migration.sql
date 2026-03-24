/*
  Warnings:

  - The values [TOURNAMENT] on the enum `CompetitionType` will be removed. If these variants are still used in the database, this will fail.
  - The values [GOALKEEPER,DEFENDER,MIDFIELDER,FORWARD] on the enum `Position` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `format` on the `Tournament` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "CompetitionType_new" AS ENUM ('FRIENDLY', 'LEAGUE', 'CUP', 'PLAYOFF', 'SEASON');
ALTER TABLE "Game" ALTER COLUMN "competitionType" DROP DEFAULT;
ALTER TABLE "Game" ALTER COLUMN "competitionType" TYPE "CompetitionType_new" USING ("competitionType"::text::"CompetitionType_new");
ALTER TYPE "CompetitionType" RENAME TO "CompetitionType_old";
ALTER TYPE "CompetitionType_new" RENAME TO "CompetitionType";
DROP TYPE "CompetitionType_old";
ALTER TABLE "Game" ALTER COLUMN "competitionType" SET DEFAULT 'FRIENDLY';
COMMIT;

-- AlterEnum
BEGIN;
CREATE TYPE "Position_new" AS ENUM ('GK', 'CB', 'RB', 'LB', 'RWB', 'LWB', 'DMF', 'CMF', 'AMF', 'RMF', 'LMF', 'SS', 'CF', 'RWF', 'LWF');
ALTER TABLE "Player" ALTER COLUMN "position" TYPE "Position_new" USING ("position"::text::"Position_new");
ALTER TYPE "Position" RENAME TO "Position_old";
ALTER TYPE "Position_new" RENAME TO "Position";
DROP TYPE "Position_old";
COMMIT;

-- DropIndex
DROP INDEX "Tournament_format_idx";

-- AlterTable
ALTER TABLE "Tournament" DROP COLUMN "format",
ADD COLUMN     "competitionType" "CompetitionType" NOT NULL DEFAULT 'LEAGUE';

-- DropEnum
DROP TYPE "TournamentFormat";

-- CreateIndex
CREATE INDEX "Tournament_competitionType_idx" ON "Tournament"("competitionType");
