import { prisma } from "../config/database";
import { logger } from "../utils/logger";
import { GameStatus } from "@ministrosfc/shared";

/**
 * Background job that auto-transitions game statuses:
 *   SCHEDULED → IN_PROGRESS  (when date <= now)
 *   IN_PROGRESS → COMPLETED  (when endDate <= now, or date < now - 24h if endDate is null)
 */
export async function runTransitions(): Promise<void> {
  try {
    const now = new Date();

    // Step 1: SCHEDULED → IN_PROGRESS
    const toInProgress = await prisma.game.updateMany({
      where: {
        status: GameStatus.SCHEDULED,
        date: { lte: now },
      },
      data: { status: GameStatus.IN_PROGRESS },
    });

    // Step 2: IN_PROGRESS → COMPLETED
    const toCompleted = await prisma.game.updateMany({
      where: {
        status: GameStatus.IN_PROGRESS,
        endDate: { lte: now },
      },
      data: { status: GameStatus.COMPLETED },
    });

    if (toInProgress.count > 0 || toCompleted.count > 0) {
      logger.info(
        { toInProgress: toInProgress.count, toCompleted: toCompleted.count },
        "GameStatusTransitionJob: transitions applied",
      );
    }
  } catch (err) {
    logger.error({ err }, "GameStatusTransitionJob: error during transitions");
  }
}
