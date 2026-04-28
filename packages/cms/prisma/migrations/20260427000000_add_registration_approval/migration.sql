-- CreateEnum
CREATE TYPE "RegistrationStatus" AS ENUM ('PENDING_APPROVAL', 'APPROVED', 'DENIED');

-- CreateEnum
CREATE TYPE "ApprovalDecisionType" AS ENUM ('APPROVE_NO_MERGE', 'APPROVE_WITH_MERGE');

-- AlterTable
ALTER TABLE "User"
ADD COLUMN "registrationStatus" "RegistrationStatus" NOT NULL DEFAULT 'PENDING_APPROVAL';

-- CreateTable
CREATE TABLE "UserApprovalDecision" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "reviewerId" TEXT NOT NULL,
    "decisionType" "ApprovalDecisionType" NOT NULL,
    "mergePlayerId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserApprovalDecision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_registrationStatus_idx" ON "User"("registrationStatus");

-- CreateIndex
CREATE INDEX "UserApprovalDecision_userId_idx" ON "UserApprovalDecision"("userId");

-- CreateIndex
CREATE INDEX "UserApprovalDecision_reviewerId_idx" ON "UserApprovalDecision"("reviewerId");

-- CreateIndex
CREATE INDEX "UserApprovalDecision_createdAt_idx" ON "UserApprovalDecision"("createdAt");

-- AddForeignKey
ALTER TABLE "UserApprovalDecision"
ADD CONSTRAINT "UserApprovalDecision_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserApprovalDecision"
ADD CONSTRAINT "UserApprovalDecision_reviewerId_fkey"
FOREIGN KEY ("reviewerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
