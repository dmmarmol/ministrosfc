BEGIN;

UPDATE "Game"
SET "competitionType" = 'LEAGUE'
WHERE "competitionType"::text = 'SEASON';

UPDATE "Tournament"
SET "competitionType" = 'LEAGUE'
WHERE "competitionType"::text = 'SEASON';

ALTER TABLE "Game" ALTER COLUMN "competitionType" DROP DEFAULT;
ALTER TABLE "Tournament" ALTER COLUMN "competitionType" DROP DEFAULT;

ALTER TYPE "CompetitionType" RENAME TO "CompetitionType_old";
CREATE TYPE "CompetitionType" AS ENUM ('FRIENDLY', 'LEAGUE', 'CUP', 'PLAYOFF');

ALTER TABLE "Game"
  ALTER COLUMN "competitionType" TYPE "CompetitionType"
  USING ("competitionType"::text::"CompetitionType");

ALTER TABLE "Tournament"
  ALTER COLUMN "competitionType" TYPE "CompetitionType"
  USING ("competitionType"::text::"CompetitionType");

DROP TYPE "CompetitionType_old";

ALTER TABLE "Game"
  ALTER COLUMN "competitionType" SET DEFAULT 'LEAGUE'::"CompetitionType";

ALTER TABLE "Tournament"
  ALTER COLUMN "competitionType" SET DEFAULT 'FRIENDLY'::"CompetitionType";

COMMIT;
