import { describe, it, expect } from "vitest";
import { positionToSlotType, assignPlayersToSlots } from "../formations";

// ------------------------------------------------------------------
// positionToSlotType
// ------------------------------------------------------------------
describe("positionToSlotType", () => {
  it("returns GK for goalkeeper", () => {
    expect(positionToSlotType("GK")).toBe("GK");
  });

  it("returns DEF for central and full-back positions", () => {
    expect(positionToSlotType("CB")).toBe("DEF");
    expect(positionToSlotType("RB")).toBe("DEF");
    expect(positionToSlotType("LWB")).toBe("DEF");
  });

  it("returns MID for midfield positions", () => {
    expect(positionToSlotType("CMF")).toBe("MID");
    expect(positionToSlotType("AMF")).toBe("MID");
    expect(positionToSlotType("SS")).toBe("MID");
  });

  it("returns FWD for forward positions", () => {
    expect(positionToSlotType("CF")).toBe("FWD");
    expect(positionToSlotType("RWF")).toBe("FWD");
    expect(positionToSlotType("LWF")).toBe("FWD");
  });
});

// ------------------------------------------------------------------
// assignPlayersToSlots
// ------------------------------------------------------------------
describe("assignPlayersToSlots", () => {
  const makeEntry = (id: string, position: string | null, ms = 0) => ({
    participantId: id,
    confirmedAt: new Date(ms).toISOString(),
    confirmationStatus: "CONFIRMED",
    confirmedById: null,
    confirmedByName: null,
    player: {
      id,
      firstName: "Test",
      lastName: "Player",
      jerseyNumber: null,
      position,
      playerType: "REGISTERED" as const,
      invitedById: null,
      invitedByName: null,
    },
  });

  it("returns 11 null slots for an empty roster", () => {
    const result = assignPlayersToSlots("4-4-2", []);
    expect(result).toHaveLength(11);
    expect(result.every((s) => s === null)).toBe(true);
  });

  it("returns 11 null slots for an unknown formation", () => {
    const result = assignPlayersToSlots("9-1-0", [makeEntry("p1", "GK")]);
    expect(result).toHaveLength(11);
    expect(result.every((s) => s === null)).toBe(true);
  });

  it("places GK in slot 0 for 4-4-2", () => {
    const gk = makeEntry("gk", "GK", 0);
    const result = assignPlayersToSlots("4-4-2", [gk]);
    expect(result[0]).toMatchObject({ participantId: "gk" });
  });

  it("fills slots in confirmedAt ASC order when positions are null", () => {
    const players = [
      makeEntry("p3", null, 300),
      makeEntry("p1", null, 100),
      makeEntry("p2", null, 200),
    ];
    const result = assignPlayersToSlots("4-4-2", players);
    const placed = result.filter(Boolean).map((e) => e.participantId);
    expect(placed).toEqual(["p1", "p2", "p3"]);
  });

  it("places 11 players when roster has exactly 11", () => {
    const players = Array.from({ length: 11 }, (_, i) =>
      makeEntry(`p${i}`, null, i * 100),
    );
    const result = assignPlayersToSlots("4-4-2", players);
    expect(result.filter(Boolean)).toHaveLength(11);
  });

  it("only uses first 11 players when roster exceeds 11", () => {
    const players = Array.from({ length: 15 }, (_, i) =>
      makeEntry(`p${i}`, null, i * 100),
    );
    const result = assignPlayersToSlots("4-4-2", players);
    expect(result.filter(Boolean)).toHaveLength(11);
  });
});
