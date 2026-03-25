import { buildGameParticipants } from "../../../../../src/scripts/seed-import/transformers/gameParticipants";
import type { ParsedAparicionRow } from "../../../../../src/scripts/seed-import/parsers/parseApariciones";
import type { IdMap } from "../../../../../src/scripts/seed-import/types";

// ─── helpers ───────────────────────────────────────────────────────────────────

const GAME_MAP: IdMap = {
  "2023-09-09:la cocina": "game-uuid-1",
  "2024-03-15:river oeste": "game-uuid-2",
};

const PLAYER_BY_NAME: IdMap = {
  "diego marmol": "player-uuid-1",
  "ana lopez": "player-uuid-2",
};

const PLAYER_BY_NICKNAME: IdMap = {
  dieguito: "player-uuid-1",
  "la flaca": "player-uuid-2",
};

function makeRow(overrides: Partial<ParsedAparicionRow> = {}): ParsedAparicionRow {
  return {
    gameKey: "2023-09-09:la cocina",
    raw: {
      Fecha: "2023/09/09",
      Rival: "La Cocina",
      Torneo: "Liga",
      Resultado: "0-4",
      Jugador: "Diego Marmol",
      nickname: "Dieguito",
      Goles: "1",
      Amarilla: "0",
      Roja: "0",
      "Titular/Suplente": "Titular",
      Comentarios: "",
    },
    ...overrides,
  };
}

// ─── tests ─────────────────────────────────────────────────────────────────────

describe("buildGameParticipants", () => {
  describe("FK resolution", () => {
    it("resolves gameId from gameMap using the gameKey", () => {
      const rows = [makeRow()];
      const { data } = buildGameParticipants(rows, GAME_MAP, PLAYER_BY_NAME, PLAYER_BY_NICKNAME);
      expect(data[0]!.gameId).toBe("game-uuid-1");
    });

    it("resolves playerId by lowercased trimmed name", () => {
      const rows = [makeRow({ raw: { ...makeRow().raw, Jugador: "  Diego Marmol  " } })];
      const { data } = buildGameParticipants(rows, GAME_MAP, PLAYER_BY_NAME, PLAYER_BY_NICKNAME);
      expect(data[0]!.playerId).toBe("player-uuid-1");
    });

    it("uses nickname as fallback when name not found", () => {
      const rows = [makeRow({
        raw: {
          ...makeRow().raw,
          Jugador: "Unknown Name",
          nickname: "Dieguito",
        },
      })];
      const { data } = buildGameParticipants(rows, GAME_MAP, PLAYER_BY_NAME, PLAYER_BY_NICKNAME);
      expect(data[0]!.playerId).toBe("player-uuid-1");
    });
  });

  describe("row skipping", () => {
    it("skips row and logs warning when gameKey not found in gameMap", () => {
      const warnSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
      const rows = [makeRow({ gameKey: "1999-01-01:unknown team" })];
      const { data, skipped } = buildGameParticipants(rows, GAME_MAP, PLAYER_BY_NAME, PLAYER_BY_NICKNAME);
      expect(data).toHaveLength(0);
      expect(skipped).toHaveLength(1);
      warnSpy.mockRestore();
    });

    it("skips row when neither name nor nickname resolves to a player", () => {
      const warnSpy = jest.spyOn(process.stderr, "write").mockImplementation(() => true);
      const rows = [makeRow({
        raw: { ...makeRow().raw, Jugador: "Nobody", nickname: "ghost" },
      })];
      const { data, skipped } = buildGameParticipants(rows, GAME_MAP, PLAYER_BY_NAME, PLAYER_BY_NICKNAME);
      expect(data).toHaveLength(0);
      expect(skipped).toHaveLength(1);
      warnSpy.mockRestore();
    });
  });

  describe("constant field values", () => {
    it("sets confirmationStatus to CONFIRMED", () => {
      const rows = [makeRow()];
      const { data } = buildGameParticipants(rows, GAME_MAP, PLAYER_BY_NAME, PLAYER_BY_NICKNAME);
      expect(data[0]!.confirmationStatus).toBe("CONFIRMED");
    });

    it("sets assists to 0", () => {
      const rows = [makeRow()];
      const { data } = buildGameParticipants(rows, GAME_MAP, PLAYER_BY_NAME, PLAYER_BY_NICKNAME);
      expect(data[0]!.assists).toBe(0);
    });

    it("sets minutesPlayed to null", () => {
      const rows = [makeRow()];
      const { data } = buildGameParticipants(rows, GAME_MAP, PLAYER_BY_NAME, PLAYER_BY_NICKNAME);
      expect(data[0]!.minutesPlayed).toBeNull();
    });
  });

  describe("numeric fields", () => {
    it("parses Goles as goalsScored integer", () => {
      const rows = [makeRow({ raw: { ...makeRow().raw, Goles: "3" } })];
      const { data } = buildGameParticipants(rows, GAME_MAP, PLAYER_BY_NAME, PLAYER_BY_NICKNAME);
      expect(data[0]!.goalsScored).toBe(3);
    });

    it("parses Amarilla as yellowCards integer", () => {
      const rows = [makeRow({ raw: { ...makeRow().raw, Amarilla: "1" } })];
      const { data } = buildGameParticipants(rows, GAME_MAP, PLAYER_BY_NAME, PLAYER_BY_NICKNAME);
      expect(data[0]!.yellowCards).toBe(1);
    });

    it("parses Roja as redCards integer", () => {
      const rows = [makeRow({ raw: { ...makeRow().raw, Roja: "1" } })];
      const { data } = buildGameParticipants(rows, GAME_MAP, PLAYER_BY_NAME, PLAYER_BY_NICKNAME);
      expect(data[0]!.redCards).toBe(1);
    });

    it("defaults to 0 when numeric field is empty", () => {
      const rows = [makeRow({ raw: { ...makeRow().raw, Goles: "", Amarilla: "", Roja: "" } })];
      const { data } = buildGameParticipants(rows, GAME_MAP, PLAYER_BY_NAME, PLAYER_BY_NICKNAME);
      expect(data[0]!.goalsScored).toBe(0);
      expect(data[0]!.yellowCards).toBe(0);
      expect(data[0]!.redCards).toBe(0);
    });
  });
});
