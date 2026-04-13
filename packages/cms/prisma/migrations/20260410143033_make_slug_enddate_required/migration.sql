/*
  Warnings:

  - Made the column `slug` on table `Game` required. This step will fail if there are existing NULL values in that column.
  - Made the column `endDate` on table `Game` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Game" ALTER COLUMN "slug" SET NOT NULL,
ALTER COLUMN "endDate" SET NOT NULL;
