import { buildPlayers } from "../../../../../src/scripts/seed-import/transformers/players";
import type { ParsedJugadorRow } from "../../../../../src/scripts/seed-import/parsers/parseJugadores";

// ─── helper ────────────────────────────────────────────────────────────────────

function makeRow(overrides: Partial<ParsedJugadorRow> = {}): ParsedJugadorRow {
  return {
    firstName: "Diego",
    lastName: "Marmol",
    Apodo: "Dieguito",
    Nacimiento: "01/01/1990",
    Edad: "34",
    Altura: "175",
    Numero: "10",
    Pie: "Diestro",
    Posición: "CMF",
    DNI: "12345678",
    Telefono: "",
    "Imagen (URL)": "https://example.com/img.jpg",
    ...overrides,
  };
}

// ─── tests ─────────────────────────────────────────────────────────────────────

describe("buildPlayers", () => {
  describe("guest detection", () => {
    const guestNames = [
      "Amigo de Juan",
      "AMIGO DE PEDRO",
      "amigo del vecino",
      "El Amigo del barrio",
    ];
    guestNames.forEach((fullName) => {
      it(`marks "${fullName}" as GUEST (name match)`, () => {
        const spaceIdx = fullName.indexOf(" ");
        const first = spaceIdx > 0 ? fullName.slice(0, spaceIdx) : fullName;
        const last = spaceIdx > 0 ? fullName.slice(spaceIdx + 1) : "";
        const row = makeRow({ firstName: first, lastName: last, Apodo: null });
        const { players } = buildPlayers([row]);
        expect(players[0]!.playerType).toBe("GUEST");
      });
    });

    it("marks GUEST when nickname contains 'amigo de'", () => {
      const row = makeRow({
        firstName: "Desconocido",
        lastName: "1",
        Apodo: "Amigo de Carlos",
      });
      const { players } = buildPlayers([row]);
      expect(players[0]!.playerType).toBe("GUEST");
    });

    it("marks REGISTERED for normal players", () => {
      const row = makeRow({
        firstName: "Juan",
        lastName: "Perez",
        Apodo: "Juancito",
      });
      const { players } = buildPlayers([row]);
      expect(players[0]!.playerType).toBe("REGISTERED");
    });
  });

  describe("position mapping", () => {
    it("maps SMF to CMF", () => {
      const row = makeRow({ Posición: "SMF" });
      const { players } = buildPlayers([row]);
      expect(players[0]!.position).toBe("CMF");
    });

    it("maps LIB to CB", () => {
      const row = makeRow({ Posición: "LIB" });
      const { players } = buildPlayers([row]);
      expect(players[0]!.position).toBe("CB");
    });

    it("keeps valid schema positions as-is", () => {
      const row = makeRow({ Posición: "GK" });
      const { players } = buildPlayers([row]);
      expect(players[0]!.position).toBe("GK");
    });

    it("takes the first valid position from a comma-separated list", () => {
      const row = makeRow({ Posición: "CMF,AMF" });
      const { players } = buildPlayers([row]);
      expect(players[0]!.position).toBe("CMF");
    });

    it("applies remap on first value in comma list (SMF,CB → CMF)", () => {
      const row = makeRow({ Posición: "SMF,CB" });
      const { players } = buildPlayers([row]);
      expect(players[0]!.position).toBe("CMF");
    });

    it("sets position to null when no valid enum value found", () => {
      const row = makeRow({ Posición: "UNKNOWN" });
      const { players } = buildPlayers([row]);
      expect(players[0]!.position).toBeNull();
    });
  });

  describe("photoUrl", () => {
    it("always sets photoUrl to the placeholder", () => {
      const row = makeRow({ "Imagen (URL)": "https://real-photo.com/img.jpg" });
      const { players } = buildPlayers([row]);
      expect(players[0]!.photoUrl).toBe(
        "https://placehold.co/200x200?text=Player",
      );
    });
  });

  describe("status", () => {
    it("always sets status to ACTIVE", () => {
      const { players } = buildPlayers([makeRow()]);
      expect(players[0]!.status).toBe("ACTIVE");
    });
  });

  describe("Contact creation", () => {
    it("creates a Contact when Telefono is non-empty", () => {
      const row = makeRow({ Telefono: "11-1234-5678" });
      const { contacts } = buildPlayers([row]);
      expect(contacts).toHaveLength(1);
      expect(contacts[0]!.phone).toBe("11-1234-5678");
    });

    it("does NOT create a Contact when Telefono is empty", () => {
      const row = makeRow({ Telefono: "" });
      const { contacts } = buildPlayers([row]);
      expect(contacts).toHaveLength(0);
    });

    it("Contact.playerId matches the Player UUID", () => {
      const row = makeRow({
        firstName: "Ana",
        lastName: "Lopez",
        Telefono: "999",
      });
      const { players, contacts } = buildPlayers([row]);
      expect(contacts[0]!.playerId).toBe(players[0]!.id);
    });
  });

  describe("lookup maps", () => {
    it("playerMapByName is keyed by lowercased trimmed full name", () => {
      const row = makeRow({ firstName: "  Diego  ", lastName: "  Marmol  " });
      const { playerMapByName } = buildPlayers([row]);
      expect(playerMapByName["diego marmol"]).toBeDefined();
    });

    it("playerMapByNickname is keyed by lowercased trimmed nickname", () => {
      const row = makeRow({
        firstName: "Diego",
        lastName: "Marmol",
        Apodo: "  Dieguito  ",
      });
      const { playerMapByNickname } = buildPlayers([row]);
      expect(playerMapByNickname["dieguito"]).toBeDefined();
    });

    it("playerMapByNickname does not include null nicknames", () => {
      const row = makeRow({ Apodo: null });
      const { playerMapByNickname } = buildPlayers([row]);
      expect(Object.keys(playerMapByNickname)).toHaveLength(0);
    });
  });
});
