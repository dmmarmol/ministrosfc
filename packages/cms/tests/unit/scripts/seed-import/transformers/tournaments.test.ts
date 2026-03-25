import { buildTournaments } from "../../../../../src/scripts/seed-import/transformers/tournaments";
import type { ParsedHistorialRow } from "../../../../../src/scripts/seed-import/parsers/parseHistorial";

// ─── helper ────────────────────────────────────────────────────────────────────

function makeRow(
  torneo: string,
  fecha: string,
  rival = "La Cocina"
): ParsedHistorialRow {
  const parts = fecha.split("/").map(Number);
  const day = parts[0]!;
  const month = parts[1]!;
  const year = parts[2]!;
  return {
    raw: {
      Fecha: fecha,
      Torneo: torneo,
      Comienzo: "20:00",
      "Finalización": "21:30",
      Equipo: "Ministros FC",
      Rival: rival,
      Estadio: "",
      "Goles Convertidos": "2",
      "Goles Recibidos": "1",
      Resultado: "2-1",
      "Conclusión": "G",
      Apariciones: "8",
      DT: "",
      Comentarios: "",
      Foto: "",
    },
    parsedDate: new Date(Date.UTC(year, month - 1, day)),
  };
}

// ─── tests ─────────────────────────────────────────────────────────────────────

describe("buildTournaments", () => {
  describe("year-prefix naming", () => {
    it('produces "YYYY TorneoName" format', () => {
      const rows = [makeRow("Amistoso", "15/03/2024")];
      const { data } = buildTournaments(rows);
      expect(data[0]!.name).toBe("2024 Amistoso");
    });

    it("creates separate tournaments for same torneo in different years", () => {
      const rows = [
        makeRow("Liga", "10/03/2023"),
        makeRow("Liga", "10/03/2024"),
      ];
      const { data } = buildTournaments(rows);
      expect(data).toHaveLength(2);
      const names = data.map((d) => d.name).sort();
      expect(names).toEqual(["2023 Liga", "2024 Liga"]);
    });

    it("groups games with same torneo+year into one tournament", () => {
      const rows = [
        makeRow("Liga", "01/03/2024"),
        makeRow("Liga", "15/04/2024"),
        makeRow("Liga", "20/05/2024"),
      ];
      const { data } = buildTournaments(rows);
      expect(data).toHaveLength(1);
    });
  });

  describe("startDate and endDate", () => {
    it("sets startDate to the earliest game date in the group", () => {
      const rows = [
        makeRow("Liga", "15/04/2024"),
        makeRow("Liga", "01/03/2024"),
        makeRow("Liga", "20/05/2024"),
      ];
      const { data } = buildTournaments(rows);
      expect(data[0]!.startDate).toEqual(new Date("2024-03-01T00:00:00.000Z"));
    });

    it("sets endDate to the latest game date in the group", () => {
      const rows = [
        makeRow("Liga", "15/04/2024"),
        makeRow("Liga", "01/03/2024"),
        makeRow("Liga", "20/05/2024"),
      ];
      const { data } = buildTournaments(rows);
      expect(data[0]!.endDate).toEqual(new Date("2024-05-20T00:00:00.000Z"));
    });
  });

  describe("competitionType mapping", () => {
    const cases: Array<[string, string]> = [
      ["Liga", "LEAGUE"],
      ["Amistoso", "FRIENDLY"],
      ["Torneo Apertura", "SEASON"],
      ["Torneo Clausura", "SEASON"],
      ["Torneo Mundialito", "CUP"],
      ["Copa de Oro", "CUP"],
    ];

    cases.forEach(([torneo, expectedType]) => {
      it(`maps "${torneo}" → ${expectedType}`, () => {
        const rows = [makeRow(torneo, "10/06/2024")];
        const { data } = buildTournaments(rows);
        expect(data[0]!.competitionType).toBe(expectedType);
      });
    });
  });

  describe("tournamentMap", () => {
    it("returns a map keyed by year-prefixed name", () => {
      const rows = [makeRow("Liga", "01/06/2024")];
      const { data, tournamentMap } = buildTournaments(rows);
      expect(tournamentMap["2024 Liga"]).toBeDefined();
      expect(tournamentMap["2024 Liga"]).toBe(data[0]!.id);
    });
  });

  describe("UUID assignment", () => {
    it("assigns a valid UUID to each tournament", () => {
      const rows = [makeRow("Liga", "01/06/2024")];
      const { data } = buildTournaments(rows);
      expect(data[0]!.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });
});
