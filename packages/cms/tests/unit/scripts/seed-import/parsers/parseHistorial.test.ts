import { parseHistorial } from "../../../../../src/scripts/seed-import/parsers/parseHistorial";
import type { HistorialRow } from "../../../../../src/scripts/seed-import/types";

// ─── helpers ──────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<HistorialRow> = {}): string {
  const defaults: HistorialRow = {
    Fecha: "15/03/2024",
    Torneo: "Liga",
    Comienzo: "20:00",
    "Finalización": "21:30",
    Equipo: "Ministros FC",
    Rival: "La Cocina",
    Estadio: "Campo Municipal",
    "Goles Convertidos": "2",
    "Goles Recibidos": "1",
    Resultado: "2-1",
    "Conclusión": "G",
    Apariciones: "8",
    DT: "Coach Bob",
    Comentarios: "Buen partido",
    Foto: "",
  };
  const row = { ...defaults, ...overrides };
  // Build CSV from the row object
  const headers = Object.keys(row).join(",");
  const values = Object.values(row)
    .map((v) => `"${String(v).replace(/"/g, '""')}"`)
    .join(",");
  return `${headers}\n${values}`;
}

function multiRowCsv(rows: Array<Partial<HistorialRow>>): string {
  const headers = [
    "Fecha",
    "Torneo",
    "Comienzo",
    "Finalización",
    "Equipo",
    "Rival",
    "Estadio",
    "Goles Convertidos",
    "Goles Recibidos",
    "Resultado",
    "Conclusión",
    "Apariciones",
    "DT",
    "Comentarios",
    "Foto",
  ];
  const defaults: HistorialRow = {
    Fecha: "15/03/2024",
    Torneo: "Liga",
    Comienzo: "20:00",
    "Finalización": "21:30",
    Equipo: "Ministros FC",
    Rival: "La Cocina",
    Estadio: "Campo Municipal",
    "Goles Convertidos": "2",
    "Goles Recibidos": "1",
    Resultado: "2-1",
    "Conclusión": "G",
    Apariciones: "8",
    DT: "",
    Comentarios: "",
    Foto: "",
  };
  const lines = rows.map((overrides) => {
    const r = { ...defaults, ...overrides } as Record<string, string>;
    return headers.map((h) => `"${(r[h] ?? "").replace(/"/g, '""')}"`).join(",");
  });
  return [headers.map((h) => `"${h}"`).join(","), ...lines].join("\n");
}

// ─── tests ─────────────────────────────────────────────────────────────────────

describe("parseHistorial", () => {
  describe("DD/MM/YYYY date parsing", () => {
    it("parses a valid date to ISO YYYY-MM-DD format", () => {
      const csv = makeRow({ Fecha: "15/03/2024" });
      const rows = parseHistorial(csv);
      expect(rows[0]!.parsedDate.toISOString().startsWith("2024-03-15")).toBe(true);
    });

    it("parses first-of-year dates correctly", () => {
      const csv = makeRow({ Fecha: "01/01/2023" });
      const rows = parseHistorial(csv);
      expect(rows[0]!.parsedDate.toISOString().startsWith("2023-01-01")).toBe(true);
    });
  });

  describe("column mapping", () => {
    it("maps all columns to HistorialRow fields", () => {
      const csv = makeRow({
        Torneo: "Amistoso",
        Rival: "River Oeste",
        Estadio: "Cancha Norte",
        "Goles Convertidos": "3",
        "Goles Recibidos": "0",
        "Conclusión": "G",
        DT: "Marcelo",
        Comentarios: "Gran juego",
      });
      const row = parseHistorial(csv)[0]!;
      expect(row.raw.Torneo).toBe("Amistoso");
      expect(row.raw.Rival).toBe("River Oeste");
      expect(row.raw.Estadio).toBe("Cancha Norte");
      expect(row.raw["Goles Convertidos"]).toBe("3");
      expect(row.raw["Goles Recibidos"]).toBe("0");
      expect(row.raw["Conclusión"]).toBe("G");
      expect(row.raw.DT).toBe("Marcelo");
      expect(row.raw.Comentarios).toBe("Gran juego");
    });
  });

  describe("row skipping", () => {
    it("skips rows where Rival is empty", () => {
      const csv = multiRowCsv([{ Rival: "" }, { Rival: "La Cocina" }]);
      const rows = parseHistorial(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.raw.Rival).toBe("La Cocina");
    });

    it("skips rows where Fecha is empty", () => {
      const csv = multiRowCsv([{ Fecha: "" }, { Fecha: "10/10/2024" }]);
      const rows = parseHistorial(csv);
      expect(rows).toHaveLength(1);
    });

    it('skips rows where Conclusión is "FALSE"', () => {
      const csv = multiRowCsv([
        { "Conclusión": "FALSE" },
        { "Conclusión": "G" },
        { "Conclusión": "P" },
        { "Conclusión": "E" },
        { "Conclusión": "" },
      ]);
      const rows = parseHistorial(csv);
      expect(rows).toHaveLength(4);
      rows.forEach((r) => expect(r.raw["Conclusión"]).not.toBe("FALSE"));
    });

    it("skips rows with an unparseable date", () => {
      const csv = multiRowCsv([
        { Fecha: "not-a-date" },
        { Fecha: "01/07/2024" },
      ]);
      const rows = parseHistorial(csv);
      expect(rows).toHaveLength(1);
    });
  });

  describe("returned shape", () => {
    it("returns { raw, parsedDate } objects", () => {
      const csv = makeRow();
      const row = parseHistorial(csv)[0]!;
      expect(row).toHaveProperty("raw");
      expect(row).toHaveProperty("parsedDate");
      expect(row.parsedDate).toBeInstanceOf(Date);
    });
  });
});
