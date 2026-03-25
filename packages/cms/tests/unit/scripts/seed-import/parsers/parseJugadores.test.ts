import { parseJugadores } from "../../../../../src/scripts/seed-import/parsers/parseJugadores";

// ─── CSV builder ───────────────────────────────────────────────────────────────

interface RawJugadorOverrides {
  nameCol?: string; // the value of the player-name column
  headerName?: string; // the column header, e.g. "Jugador (61)"
  Apodo?: string;
  Nacimiento?: string;
  Edad?: string;
  Altura?: string;
  Numero?: string;
  Pie?: string;
  Posición?: string;
  DNI?: string;
  Telefono?: string;
  "Imagen (URL)"?: string;
}

// We build a minimal CSV with the given header for the name column.
function makeCsv(rows: RawJugadorOverrides[]): string {
  const firstRow = rows[0] ?? {};
  const nameHeader = firstRow.headerName ?? "Jugador (61)";
  const headers = [
    nameHeader,
    "Apodo",
    "Nacimiento",
    "Edad",
    "Altura",
    "Numero",
    "Pie",
    "Posición",
    "DNI",
    "Telefono",
    "Imagen (URL)",
  ];

  const defaultValues: Record<string, string> = {
    nameCol: "Diego Marmol",
    Apodo: "Dieguito",
    Nacimiento: "01/01/1990",
    Edad: "34",
    Altura: "175",
    Numero: "10",
    Pie: "Diestro",
    Posición: "CMF",
    DNI: "12345678",
    Telefono: "11-1234-5678",
    "Imagen (URL)": "https://example.com/img.jpg",
  };

  const lines = rows.map((overrides) => {
    const cols = [
      overrides.nameCol ?? defaultValues["nameCol"],
      overrides.Apodo ?? defaultValues["Apodo"],
      overrides.Nacimiento ?? defaultValues["Nacimiento"],
      overrides.Edad ?? defaultValues["Edad"],
      overrides.Altura ?? defaultValues["Altura"],
      overrides.Numero ?? defaultValues["Numero"],
      overrides.Pie ?? defaultValues["Pie"],
      overrides["Posición"] ?? defaultValues["Posición"],
      overrides.DNI ?? defaultValues["DNI"],
      overrides.Telefono ?? defaultValues["Telefono"],
      overrides["Imagen (URL)"] ?? defaultValues["Imagen (URL)"],
    ];
    return cols.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });

  return [headers.map((h) => `"${h}"`).join(","), ...lines].join("\n");
}

// ─── tests ─────────────────────────────────────────────────────────────────────

describe("parseJugadores", () => {
  describe("column mapping", () => {
    it("maps all fields to JugadorRow equivalents", () => {
      const csv = makeCsv([{}]);
      const row = parseJugadores(csv)[0]!;
      expect(row.name).toBe("Diego Marmol");
      expect(row.Apodo).toBe("Dieguito");
      expect(row.Nacimiento).toBe("01/01/1990");
      expect(row.Altura).toBe("175");
      expect(row.Numero).toBe("10");
      expect(row.Pie).toBe("Diestro");
      expect(row["Posición"]).toBe("CMF");
      expect(row.DNI).toBe("12345678");
      expect(row.Telefono).toBe("11-1234-5678");
    });
  });

  describe("?? nickname normalisation", () => {
    it('converts "??" Apodo to null', () => {
      const csv = makeCsv([{ Apodo: "??" }]);
      const row = parseJugadores(csv)[0]!;
      expect(row.Apodo).toBeNull();
    });

    it("preserves non-?? nicknames as-is", () => {
      const csv = makeCsv([{ Apodo: "Pelusa" }]);
      const row = parseJugadores(csv)[0]!;
      expect(row.Apodo).toBe("Pelusa");
    });
  });

  describe("row skipping", () => {
    it("skips rows where the player name is empty", () => {
      const csv = makeCsv([{ nameCol: "" }, { nameCol: "Juan Perez" }]);
      const rows = parseJugadores(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.name).toBe("Juan Perez");
    });
  });

  describe("dynamic header detection", () => {
    it('detects name column when header is "Jugador (61)"', () => {
      const csv = makeCsv([
        { headerName: "Jugador (61)", nameCol: "Ana Lopez" },
      ]);
      const row = parseJugadores(csv)[0]!;
      expect(row.name).toBe("Ana Lopez");
    });

    it('detects name column when header is "Jugador (40)" (count changed)', () => {
      const csv = makeCsv([
        { headerName: "Jugador (40)", nameCol: "Carlos Ruiz" },
      ]);
      const row = parseJugadores(csv)[0]!;
      expect(row.name).toBe("Carlos Ruiz");
    });
  });
});
