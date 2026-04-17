-- AlterTable
ALTER TABLE "Tournament" ADD COLUMN     "playgroundId" TEXT;

-- AddForeignKey
ALTER TABLE "Tournament" ADD CONSTRAINT "Tournament_playgroundId_fkey" FOREIGN KEY ("playgroundId") REFERENCES "Playground"("id") ON DELETE SET NULL ON UPDATE CASCADE;
