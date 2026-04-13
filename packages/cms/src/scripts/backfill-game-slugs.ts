/**
 * One-time backfill script: generate slugs for all existing games that don't have one.
 * Run with: npx ts-node --project tsconfig.json src/scripts/backfill-game-slugs.ts
 */
import { PrismaClient } from "@prisma/client";
import { generateGameSlug } from "../utils/slug";

const prisma = new PrismaClient();

async function main() {
  const games = await prisma.game.findMany({
    where: { slug: null },
    select: {
      id: true,
      date: true,
      opponentTeam: {
        select: { name: true },
      },
    },
    orderBy: { date: "asc" },
  });

  console.log(`Found ${games.length} game(s) without slugs.`);

  let success = 0;
  let failed = 0;

  for (const game of games) {
    try {
      const slug = await generateGameSlug(
        game.date,
        game.opponentTeam.name,
        prisma,
        game.id,
      );
      await prisma.game.update({
        where: { id: game.id },
        data: { slug },
      });
      console.log(`  ✓ ${game.id} → ${slug}`);
      success++;
    } catch (err) {
      console.error(`  ✗ ${game.id}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${success} updated, ${failed} failed.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
