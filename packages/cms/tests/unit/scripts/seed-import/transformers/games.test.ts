import { buildGames } from "../../../../../src/scripts/seed-import/transformers/games";
import type { ParsedHistorialRow } from "../../../../../src/scripts/seed-import/parsers/parseHistorial";
import type { IdMap } from "../../../../../src/scripts/seed-import/types";

// ─── helpers ───────────────────────────────────────────────────────────────────

const TEAM_MAP: IdMap = {
  "La Cocina": "team-uuid-1",
  "River Oeste": "team-uuid-2",
};

const TOURNAMENT_MAP: IdMap = {
  "2024 Liga": "tournament-uuid-1",
  "2024 Amistoso": "tournament-uuid-2",
};

function makeRow(
  overrides: Partial<ParsedHistorialRow["raw"]> = {},
): ParsedHistorialRow {
  return {
    raw: {
      Fecha: "15/03/2024",
      Torneo: "Liga",
      Comienzo: "20:00",
      Finalización: "21:30",
      Equipo: "Ministros FC",
      Rival: "La Cocina",
      Estadio: "Campo Municipal",
      "Goles Convertidos": "2",
      "Goles Recibidos": "1",
      Resultado: "2-1",
      Conclusión: "G",
      Apariciones: "8",
      DT: "",
      Comentarios: "",
      Foto: "",
      ...overrides,
    },
    parsedDate: new Date("2024-03-15T00:00:00.000Z"),
  };
}

// ─── tests ─────────────────────────────────────────────────────────────────────

describe("buildGames", () => {
  describe("FK resolution", () => {
    it("resolves opponentTeamId from opponentTeamMap", () => {
      const rows = [makeRow({ Rival: "La Cocina" })];
      const { data } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
      expect(data[0]!.opponentTeamId).toBe("team-uuid-1");
    });

    it("resolves tournamentId from tournamentMap by year-prefixed key", () => {
      const rows = [makeRow({ Torneo: "Liga" })];
      const { data } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
      expect(data[0]!.tournamentId).toBe("tournament-uuid-1");
    });

    it("sets tournamentId to null when tournament not found in map", () => {
      const rows = [makeRow({ Torneo: "Desconocido" })];
      const { data } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
      expect(data[0]!.tournamentId).toBeNull();
    });
  });

  describe("notes assembly", () => {
    it("includes DT line when DT is present", () => {
      const rows = [makeRow({ DT: "Marcelo", Comentarios: "" })];
      const { data } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
      expect(data[0]!.notes).toContain("DT: Marcelo");
    });

    it("includes Horario line when Comienzo and Finalización are both present", () => {
      const rows = [
        makeRow({
          Comienzo: "20:00",
          Finalización: "21:30",
          DT: "",
          Comentarios: "",
        }),
      ];
      const { data } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
      expect(data[0]!.notes).toContain("Horario: 20:00–21:30");
    });

    it("includes Comentarios when non-empty", () => {
      const rows = [makeRow({ DT: "", Comentarios: "Gran partido" })];
      const { data } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
      expect(data[0]!.notes).toContain("Gran partido");
    });

    it("assembles all parts joined by newline", () => {
      const rows = [
        makeRow({
          DT: "Juan",
          Comienzo: "19:00",
          Finalización: "20:30",
          Comentarios: "Lluvia",
        }),
      ];
      const { data } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
      expect(data[0]!.notes).toBe("DT: Juan\nHorario: 19:00–20:30\nLluvia");
    });

    it("sets notes to null when all parts are empty", () => {
      const rows = [
        makeRow({ DT: "", Comienzo: "", Finalización: "", Comentarios: "" }),
      ];
      const { data } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
      expect(data[0]!.notes).toBeNull();
    });
  });

  describe("status derivation", () => {
    const completedValues = ["G", "P", "E"];
    completedValues.forEach((val) => {
      it(`maps Conclusión="${val}" to COMPLETED`, () => {
        const rows = [makeRow({ Conclusión: val })];
        const { data } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
        expect(data[0]!.status).toBe("COMPLETED");
      });
    });

    it("maps empty Conclusión to SCHEDULED", () => {
      const rows = [makeRow({ Conclusión: "" })];
      const { data } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
      expect(data[0]!.status).toBe("SCHEDULED");
    });
  });

  describe("gameMap", () => {
    it('builds gameMap keyed by "YYYY-MM-DD:rival-lowercase"', () => {
      const rows = [makeRow({ Rival: "La Cocina" })];
      const { gameMap } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
      expect(gameMap["2024-03-15:la cocina"]).toBeDefined();
    });

    it("gameMap value is the game UUID", () => {
      const rows = [makeRow({ Rival: "La Cocina" })];
      const { data, gameMap } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
      expect(gameMap["2024-03-15:la cocina"]).toBe(data[0]!.id);
    });
  });

  describe("score parsing", () => {
    it("parses homeTeamScore as integer", () => {
      const rows = [makeRow({ "Goles Convertidos": "3" })];
      const { data } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
      expect(data[0]!.homeTeamScore).toBe(3);
    });

    it("parses awayTeamScore as integer", () => {
      const rows = [makeRow({ "Goles Recibidos": "2" })];
      const { data } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
      expect(data[0]!.awayTeamScore).toBe(2);
    });

    it("sets score to null when field is empty", () => {
      const rows = [
        makeRow({ "Goles Convertidos": "", "Goles Recibidos": "" }),
      ];
      const { data } = buildGames(rows, TEAM_MAP, TOURNAMENT_MAP);
      expect(data[0]!.homeTeamScore).toBeNull();
      expect(data[0]!.awayTeamScore).toBeNull();
    });
  });
});
