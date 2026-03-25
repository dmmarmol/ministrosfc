import { parseApariciones } from "../../../../../src/scripts/seed-import/parsers/parseApariciones";

// ─── CSV builder ───────────────────────────────────────────────────────────────

interface AparicionOverrides {
  Fecha?: string;
  Rival?: string;
  Torneo?: string;
  Resultado?: string;
  conclusion?: string; // unnamed col 4
  playerName?: string; // col 5  "Jugador"
  playerNickname?: string; // col 6  "Jugador"
  Goles?: string;
  Amarilla?: string;
  Roja?: string;
  "Titular/Suplente"?: string;
  Comentarios?: string;
}

function makeCsv(rows: AparicionOverrides[]): string {
  // Column 4 intentionally has no header to replicate the real spreadsheet
  const headers = [
    "Fecha",
    "Rival",
    "Torneo",
    "Resultado",
    "", // unnamed col 4
    "Jugador",
    "Jugador",
    "Goles",
    "Amarilla",
    "Roja",
    "Titular/Suplente",
    "Comentarios",
  ];

  const defaults: Record<string, string> = {
    Fecha: "2023/09/09",
    Rival: "La Cocina",
    Torneo: "Liga",
    Resultado: "0-4",
    conclusion: "P",
    playerName: "Diego Marmol",
    playerNickname: "Dieguito",
    Goles: "1",
    Amarilla: "0",
    Roja: "0",
    "Titular/Suplente": "Titular",
    Comentarios: "",
  };

  const lines = rows.map((overrides) => {
    const vals = [
      overrides.Fecha ?? defaults["Fecha"],
      overrides.Rival ?? defaults["Rival"],
      overrides.Torneo ?? defaults["Torneo"],
      overrides.Resultado ?? defaults["Resultado"],
      overrides.conclusion ?? defaults["conclusion"],
      overrides.playerName ?? defaults["playerName"],
      overrides.playerNickname ?? defaults["playerNickname"],
      overrides.Goles ?? defaults["Goles"],
      overrides.Amarilla ?? defaults["Amarilla"],
      overrides.Roja ?? defaults["Roja"],
      overrides["Titular/Suplente"] ?? defaults["Titular/Suplente"],
      overrides.Comentarios ?? defaults["Comentarios"],
    ];
    return vals.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",");
  });

  return [headers.map((h) => `"${h}"`).join(","), ...lines].join("\n");
}

// ─── tests ─────────────────────────────────────────────────────────────────────

describe("parseApariciones", () => {
  describe("date parsing — YYYY/MM/DD format", () => {
    it("converts YYYY/MM/DD to a YYYY-MM-DD ISO date string in gameKey", () => {
      const csv = makeCsv([{ Fecha: "2023/09/09", Rival: "La Cocina" }]);
      const row = parseApariciones(csv)[0]!;
      expect(row.gameKey).toBe("2023-09-09:la cocina");
    });

    it("handles leading-zero months and days", () => {
      const csv = makeCsv([{ Fecha: "2024/01/05", Rival: "River Oeste" }]);
      const row = parseApariciones(csv)[0]!;
      expect(row.gameKey).toBe("2024-01-05:river oeste");
    });
  });

  describe("composite lookup key", () => {
    it("produces key in YYYY-MM-DD:rival-lowercase format", () => {
      const csv = makeCsv([{ Fecha: "2024/06/15", Rival: "Sporting Club" }]);
      const row = parseApariciones(csv)[0]!;
      expect(row.gameKey).toBe("2024-06-15:sporting club");
    });

    it("lowercases rival name in the key", () => {
      const csv = makeCsv([{ Rival: "Casino Atletico" }]);
      const row = parseApariciones(csv)[0]!;
      expect(row.gameKey).toMatch(/:casino atletico$/);
    });

    it("trims whitespace in rival name", () => {
      const csv = makeCsv([{ Rival: "  El Rincon  " }]);
      const row = parseApariciones(csv)[0]!;
      expect(row.gameKey).toMatch(/:el rincon$/);
    });
  });

  describe("row skipping", () => {
    it("skips rows where player name column is empty", () => {
      const csv = makeCsv([{ playerName: "" }, { playerName: "Juan Perez" }]);
      const rows = parseApariciones(csv);
      expect(rows).toHaveLength(1);
      expect(rows[0]!.raw.Jugador).toBe("Juan Perez");
    });
  });

  describe("returned shape", () => {
    it("exposes raw.Jugador (name) and raw.nickname", () => {
      const csv = makeCsv([
        { playerName: "Diego Marmol", playerNickname: "Dieguito" },
      ]);
      const row = parseApariciones(csv)[0]!;
      expect(row.raw.Jugador).toBe("Diego Marmol");
      expect(row.raw.nickname).toBe("Dieguito");
    });

    it("exposes numeric columns as strings", () => {
      const csv = makeCsv([{ Goles: "2", Amarilla: "1", Roja: "0" }]);
      const row = parseApariciones(csv)[0]!;
      expect(row.raw.Goles).toBe("2");
      expect(row.raw.Amarilla).toBe("1");
      expect(row.raw.Roja).toBe("0");
    });
  });
});
