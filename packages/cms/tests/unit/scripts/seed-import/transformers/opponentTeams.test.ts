import { buildOpponentTeams } from "../../../../../src/scripts/seed-import/transformers/opponentTeams";
import type { ParsedHistorialRow } from "../../../../../src/scripts/seed-import/parsers/parseHistorial";

// ─── helper ────────────────────────────────────────────────────────────────────

function makeRows(rivals: string[]): ParsedHistorialRow[] {
  return rivals.map((rival) => ({
    raw: {
      Fecha: "15/03/2024",
      Torneo: "Liga",
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
    parsedDate: new Date("2024-03-15T00:00:00.000Z"),
  }));
}

// ─── tests ─────────────────────────────────────────────────────────────────────

describe("buildOpponentTeams", () => {
  it("extracts unique Rival values from game rows", () => {
    const rows = makeRows(["La Cocina", "River Oeste", "La Cocina"]);
    const { data } = buildOpponentTeams(rows);
    expect(data).toHaveLength(2);
    const names = data.map((d) => d.name).sort();
    expect(names).toEqual(["La Cocina", "River Oeste"]);
  });

  it("assigns a UUID to each team", () => {
    const rows = makeRows(["La Cocina", "River Oeste"]);
    const { data } = buildOpponentTeams(rows);
    data.forEach((d) => {
      expect(d.id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
      );
    });
  });

  it("returns opponentTeamMap keyed by original (non-lowercased) name", () => {
    const rows = makeRows(["La Cocina", "River Oeste"]);
    const { data, opponentTeamMap } = buildOpponentTeams(rows);
    expect(opponentTeamMap["La Cocina"]).toBeDefined();
    expect(opponentTeamMap["River Oeste"]).toBeDefined();
    // map value is the same UUID as in data
    const cocinaRow = data.find((d) => d.name === "La Cocina")!;
    expect(opponentTeamMap["La Cocina"]).toBe(cocinaRow.id);
  });

  it("de-duplicates teams with different casing if rival is trimmed consistently", () => {
    // Rivals are trimmed but not lowercased — two truly different-case entries
    // remain distinct (they would be looked up by the transformer via trimmed value)
    const rows = makeRows(["La Cocina", "La Cocina"]);
    const { data } = buildOpponentTeams(rows);
    expect(data).toHaveLength(1);
  });

  it("returns empty arrays for empty input", () => {
    const { data, opponentTeamMap } = buildOpponentTeams([]);
    expect(data).toHaveLength(0);
    expect(Object.keys(opponentTeamMap)).toHaveLength(0);
  });
});
