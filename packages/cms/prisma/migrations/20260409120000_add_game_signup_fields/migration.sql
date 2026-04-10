-- AlterTable: Add game signup fields
-- maxPlayers: capacity gate (null = unlimited)
-- slug: SEO-friendly URL slug, UNIQUE (PostgreSQL treats NULLs as distinct, safe before backfill)
-- lineup: formation code, e.g. "4-3-3"
-- endDate: auto-computed server-side as date + 100 minutes; not user-editable
ALTER TABLE "Game"
  ADD COLUMN "maxPlayers" INTEGER,
  ADD COLUMN "slug"       VARCHAR(200),
  ADD COLUMN "lineup"     VARCHAR(10),
  ADD COLUMN "endDate"    TIMESTAMP(3);

-- CreateIndex: unique constraint on slug (NULLs are distinct in PostgreSQL)
CREATE UNIQUE INDEX "Game_slug_key" ON "Game"("slug");
