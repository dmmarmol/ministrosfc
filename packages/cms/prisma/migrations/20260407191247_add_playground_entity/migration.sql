-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "playgroundId" TEXT;

-- CreateTable
CREATE TABLE "Playground" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(500) NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "createdById" TEXT NOT NULL,
    "updatedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Playground_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Playground_name_idx" ON "Playground"("name");

-- CreateIndex
CREATE INDEX "Playground_createdById_idx" ON "Playground"("createdById");

-- AddForeignKey
ALTER TABLE "Game" ADD CONSTRAINT "Game_playgroundId_fkey" FOREIGN KEY ("playgroundId") REFERENCES "Playground"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playground" ADD CONSTRAINT "Playground_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Playground" ADD CONSTRAINT "Playground_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
