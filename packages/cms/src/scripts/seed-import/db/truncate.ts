import { PrismaClient } from "@prisma/client";

const TRUNCATE_TABLES = [
  "GameParticipant",
  "Statistics",
  "Game",
  "Contact",
  "Player",
  "Tournament",
  "OpponentTeam",
] as const;

/**
 * Truncate all target tables in reverse FK order.
 * Uses CASCADE to clear any remaining FK references.
 * Must be called inside a Prisma interactive transaction.
 */
export async function truncateAll(
  tx: Omit<
    PrismaClient,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
  >,
): Promise<void> {
  const tableList = TRUNCATE_TABLES.map((t) => `"${t}"`).join(",");
  await tx.$executeRawUnsafe(`TRUNCATE ${tableList} CASCADE`);
}
