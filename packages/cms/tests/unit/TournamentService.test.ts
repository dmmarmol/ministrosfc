import { TournamentService } from "../../src/services/TournamentService";
import { TournamentModel } from "../../src/models/Tournament";

jest.mock("../../src/models/Tournament");

describe("TournamentService", () => {
  afterEach(() => jest.clearAllMocks());

  describe("createTournament", () => {
    it("creates tournament when startDate < endDate", async () => {
      const created = { id: "t1", name: "Liga 2026", format: "LEAGUE" };
      (TournamentModel.create as jest.Mock).mockResolvedValue(created);

      const result = await TournamentService.createTournament({
        name: "Liga 2026",
        format: "LEAGUE",
        startDate: "2026-01-01",
        endDate: "2026-12-31",
      } as any);
      expect(result.id).toBe("t1");
    });

    it("throws 400 when startDate is after endDate", async () => {
      await expect(
        TournamentService.createTournament({
          name: "Bad Dates",
          format: "LEAGUE",
          startDate: "2026-12-31",
          endDate: "2026-01-01",
        } as any),
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("getMinistrosRecord", () => {
    it("calculates wins, draws, losses from completed games", async () => {
      (TournamentModel.findById as jest.Mock).mockResolvedValue({ id: "t1" });
      // 3 completed games: 2-1 (win), 1-1 (draw), 0-2 (loss)
      (TournamentModel.calculateMinistrosRecord as jest.Mock).mockResolvedValue(
        {
          wins: 1,
          draws: 1,
          losses: 1,
          goalsFor: 3,
          goalsAgainst: 4,
          goalDifference: -1,
          played: 3,
        },
      );

      const record = await TournamentService.getMinistrosRecord("t1");
      expect(record.wins).toBe(1);
      expect(record.draws).toBe(1);
      expect(record.losses).toBe(1);
      expect(record.goalDifference).toBe(-1);
    });

    it("throws 404 when tournament not found", async () => {
      (TournamentModel.findById as jest.Mock).mockResolvedValue(null);
      await expect(
        TournamentService.getMinistrosRecord("missing"),
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("listTournaments", () => {
    const empty = {
      played: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
    };

    it("attaches each tournament's Ministros record", async () => {
      (TournamentModel.findMany as jest.Mock).mockResolvedValue({
        tournaments: [{ id: "t1" }, { id: "t2" }],
        total: 2,
        page: 1,
        limit: 20,
        totalPages: 1,
      });
      const t1 = { ...empty, played: 2, wins: 1, losses: 1 };
      (TournamentModel.calculateMinistrosRecords as jest.Mock).mockResolvedValue(
        new Map([["t1", t1]]),
      );

      const result = await TournamentService.listTournaments();

      expect(TournamentModel.calculateMinistrosRecords).toHaveBeenCalledWith([
        "t1",
        "t2",
      ]);
      expect(result.tournaments[0]).toMatchObject({ id: "t1", ministrosRecord: t1 });
      // A tournament without completed games still gets an all-zero record
      expect(result.tournaments[1]).toMatchObject({ id: "t2", ministrosRecord: empty });
      expect(result.total).toBe(2);
    });
  });
});
