import { describe, it, expect } from "vitest";
import { GameStatus, type Game } from "@ministrosfc/shared";
import { fetchNextGame, type ListGames } from "~/utils/nextGame";

const game = (id: string, date: string, status: GameStatus): Game =>
  ({ id, date, status, slug: id }) as unknown as Game;

/** Behaves like the real API: filters by status and dateFrom, newest first, then limits. */
function fakeApi(all: Game[]): ListGames {
  return async (status, limit, dateFrom) =>
    all
      .filter((g) => g.status === status)
      .filter((g) => !dateFrom || new Date(g.date) >= new Date(dateFrom))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, limit);
}

const NOW = new Date("2026-11-25T12:00:00");

describe("fetchNextGame", () => {
  it("picks the nearest upcoming game even when more than five are scheduled", async () => {
    const dates = [
      "2027-03-20", "2027-03-06", "2027-02-20", "2027-02-13",
      "2027-02-06", "2027-01-30", "2027-01-27",
    ];
    const all = dates.map((d) => game(d, `${d}T22:00:00.000Z`, GameStatus.SCHEDULED));
    const next = await fetchNextGame(fakeApi(all), NOW);
    expect(next?.id).toBe("2027-01-27");
  });

  it("ignores games before today", async () => {
    const all = [
      game("past", "2026-11-01T22:00:00.000Z", GameStatus.SCHEDULED),
      game("soon", "2026-12-05T22:00:00.000Z", GameStatus.SCHEDULED),
    ];
    expect((await fetchNextGame(fakeApi(all), NOW))?.id).toBe("soon");
  });

  it("prefers a live game that started before a later scheduled one", async () => {
    const all = [
      game("live", "2026-11-25T10:00:00.000Z", GameStatus.IN_PROGRESS),
      game("later", "2026-12-05T22:00:00.000Z", GameStatus.SCHEDULED),
    ];
    expect((await fetchNextGame(fakeApi(all), NOW))?.id).toBe("live");
  });

  it("shows a called-off game when it is the earliest upcoming one", async () => {
    const all = [
      game("off", "2026-11-30T22:00:00.000Z", GameStatus.CANCELLED),
      game("later", "2026-12-05T22:00:00.000Z", GameStatus.SCHEDULED),
    ];
    expect((await fetchNextGame(fakeApi(all), NOW))?.id).toBe("off");
  });

  it("returns null when nothing is upcoming", async () => {
    expect(await fetchNextGame(fakeApi([]), NOW)).toBeNull();
  });
});
