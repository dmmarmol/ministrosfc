-- CreateEnum
CREATE TYPE "ImportJobStatus" AS ENUM ('queued', 'processing', 'completed', 'failed', 'cancelled');

-- CreateEnum
CREATE TYPE "ImportStage" AS ENUM ('start', 'jugadores', 'canchas', 'historial', 'apariciones', 'finish');

-- CreateTable
CREATE TABLE "ImportJob" (
    "id" TEXT NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'queued',
    "currentStage" "ImportStage" NOT NULL DEFAULT 'start',
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "submittedByUserId" TEXT,
    "fileChecksum" TEXT,
    "fileMeta" JSONB,
    "resultJson" JSONB,
    "warningsJson" JSONB,
    "errorJson" JSONB,
    "workerLockToken" TEXT,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "lastHeartbeatAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportStageProgress" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "stage" "ImportStage" NOT NULL,
    "percentComplete" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER,
    "totalRows" INTEGER,
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "detailsJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportStageProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportWarning" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "code" TEXT,
    "message" TEXT NOT NULL,
    "stage" "ImportStage",
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportWarning_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImportError" (
    "id" TEXT NOT NULL,
    "importJobId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stage" "ImportStage",
    "recoverable" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ImportError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ImportJob_status_idx"
    ON "ImportJob" ("status");

CREATE INDEX "ImportJob_submittedByUserId_idx"
    ON "ImportJob" ("submittedByUserId");

CREATE INDEX "ImportJob_fileChecksum_idx"
    ON "ImportJob" ("fileChecksum");

CREATE INDEX "ImportStageProgress_importJobId_idx"
    ON "ImportStageProgress" ("importJobId");

CREATE INDEX "ImportStageProgress_stage_idx"
    ON "ImportStageProgress" ("stage");

CREATE INDEX "ImportWarning_importJobId_idx"
    ON "ImportWarning" ("importJobId");

CREATE INDEX "ImportError_importJobId_idx"
    ON "ImportError" ("importJobId");

CREATE INDEX "ImportError_code_idx"
    ON "ImportError" ("code");

-- AddForeignKey
ALTER TABLE "ImportJob"
ADD CONSTRAINT "ImportJob_submittedByUserId_fkey"
FOREIGN KEY ("submittedByUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportStageProgress"
ADD CONSTRAINT "ImportStageProgress_importJobId_fkey"
FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportWarning"
ADD CONSTRAINT "ImportWarning_importJobId_fkey"
FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImportError"
ADD CONSTRAINT "ImportError_importJobId_fkey"
FOREIGN KEY ("importJobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
