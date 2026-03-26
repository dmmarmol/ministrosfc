-- Split User.name → firstName + lastName
-- Split Player.name → firstName + lastName
-- Add Player.address
-- Add DT to Role enum
-- Add User.googleSubjectId, make User.passwordHash nullable

-- =============================================
-- 1. Add DT to Role enum
-- =============================================
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'DT';

-- =============================================
-- 2. User: split name → firstName + lastName
-- =============================================

-- Step 1: Add new columns as nullable
ALTER TABLE "User" ADD COLUMN "firstName" VARCHAR(255);
ALTER TABLE "User" ADD COLUMN "lastName" VARCHAR(255);

-- Step 2: Backfill from name (split on first space)
UPDATE "User"
SET
  "firstName" = CASE
    WHEN POSITION(' ' IN "name") > 0
    THEN LEFT("name", POSITION(' ' IN "name") - 1)
    ELSE "name"
  END,
  "lastName" = CASE
    WHEN POSITION(' ' IN "name") > 0
    THEN SUBSTRING("name" FROM POSITION(' ' IN "name") + 1)
    ELSE ''
  END;

-- Step 3: Set NOT NULL after backfill
ALTER TABLE "User" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "lastName" SET NOT NULL;

-- Step 4: Drop old column
ALTER TABLE "User" DROP COLUMN "name";

-- =============================================
-- 3. User: add googleSubjectId, make passwordHash nullable
-- =============================================
ALTER TABLE "User" ADD COLUMN "googleSubjectId" TEXT;
ALTER TABLE "User" ALTER COLUMN "passwordHash" DROP NOT NULL;
CREATE UNIQUE INDEX "User_googleSubjectId_key" ON "User"("googleSubjectId");
CREATE INDEX "User_googleSubjectId_idx" ON "User"("googleSubjectId");

-- =============================================
-- 4. Player: split name → firstName + lastName, add address
-- =============================================

-- Step 1: Add new columns as nullable
ALTER TABLE "Player" ADD COLUMN "firstName" VARCHAR(255);
ALTER TABLE "Player" ADD COLUMN "lastName" VARCHAR(255);

-- Step 2: Backfill from name (split on first space)
UPDATE "Player"
SET
  "firstName" = CASE
    WHEN POSITION(' ' IN "name") > 0
    THEN LEFT("name", POSITION(' ' IN "name") - 1)
    ELSE "name"
  END,
  "lastName" = CASE
    WHEN POSITION(' ' IN "name") > 0
    THEN SUBSTRING("name" FROM POSITION(' ' IN "name") + 1)
    ELSE ''
  END;

-- Step 3: Set NOT NULL after backfill
ALTER TABLE "Player" ALTER COLUMN "firstName" SET NOT NULL;
ALTER TABLE "Player" ALTER COLUMN "lastName" SET NOT NULL;

-- Step 4: Drop old column
ALTER TABLE "Player" DROP COLUMN "name";

-- Step 5: Add address column
ALTER TABLE "Player" ADD COLUMN "address" VARCHAR(500);
