import { GameStatus, type Game } from "@ministrosfc/shared";

export type ListGames = (
  status: GameStatus,
  limit: number,
  dateFrom?: string,
) => Promise<Game[]>;

/**
 * The next sheet for the home page: the earliest upcoming game that is
 * scheduled, live, or called off. The API lists games newest first, so a small
 * limit would drop the nearest ones; ask for upcoming games only (from the start
 * of today) and pick the earliest.
 */
export async function fetchNextGame(
  listGames: ListGames,
  now: Date = new Date(),
): Promise<Game | null> {
  const startOfToday = new Date(now);
  startOfToday.setHours(0, 0, 0, 0);
  const from = startOfToday.toISOString();
  const [scheduled, live, cancelled] = await Promise.all([
    listGames(GameStatus.SCHEDULED, 100, from),
    listGames(GameStatus.IN_PROGRESS, 1),
    listGames(GameStatus.CANCELLED, 100, from),
  ]);
  const candidates = [...scheduled, ...live, ...cancelled].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  return candidates[0] ?? null;
}
