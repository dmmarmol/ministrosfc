/*
  Warnings:

  - You are about to drop the column `colors` on the `OpponentTeam` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "OpponentTeam" DROP COLUMN "colors",
ADD COLUMN     "notes" TEXT,
ADD COLUMN     "primaryColor" VARCHAR(50),
ADD COLUMN     "secondaryColor" VARCHAR(50),
ADD COLUMN     "shortName" VARCHAR(10);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "firstName" DROP NOT NULL,
ALTER COLUMN "lastName" DROP NOT NULL;
