-- Set default so new rows always get 4-4-2 even before the NOT NULL constraint is added
ALTER TABLE "Game" ALTER COLUMN "lineup" SET DEFAULT '4-4-2';

-- Backfill existing NULL rows before enforcing NOT NULL
UPDATE "Game" SET "lineup" = '4-4-2' WHERE "lineup" IS NULL;

-- Now safe to add NOT NULL constraint
ALTER TABLE "Game" ALTER COLUMN "lineup" SET NOT NULL;
