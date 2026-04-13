// T034: Formation slot definitions — 14 formations, each with 11 slot positions.
// Coordinates are normalized 0–1 (x = horizontal, y = vertical, 0=top/goal, 1=bottom/goal).
// slotType maps to player position groups for assignment.

import type { Position } from "@ministrosfc/shared";

export type SlotType = "GK" | "DEF" | "MID" | "FWD";

export interface FormationSlot {
  x: number;
  y: number;
  slotType: SlotType;
}

/** Normalized (x, y) positions for an SVG viewport. GK always at y≈0.9. */
export const FORMATION_SLOTS: Record<string, FormationSlot[]> = {
  "4-4-2": [
    { x: 0.5, y: 0.9, slotType: "GK" },
    { x: 0.15, y: 0.7, slotType: "DEF" },
    { x: 0.38, y: 0.7, slotType: "DEF" },
    { x: 0.62, y: 0.7, slotType: "DEF" },
    { x: 0.85, y: 0.7, slotType: "DEF" },
    { x: 0.15, y: 0.45, slotType: "MID" },
    { x: 0.38, y: 0.45, slotType: "MID" },
    { x: 0.62, y: 0.45, slotType: "MID" },
    { x: 0.85, y: 0.45, slotType: "MID" },
    { x: 0.35, y: 0.18, slotType: "FWD" },
    { x: 0.65, y: 0.18, slotType: "FWD" },
  ],
  "4-3-3": [
    { x: 0.5, y: 0.9, slotType: "GK" },
    { x: 0.15, y: 0.72, slotType: "DEF" },
    { x: 0.38, y: 0.72, slotType: "DEF" },
    { x: 0.62, y: 0.72, slotType: "DEF" },
    { x: 0.85, y: 0.72, slotType: "DEF" },
    { x: 0.25, y: 0.45, slotType: "MID" },
    { x: 0.5, y: 0.45, slotType: "MID" },
    { x: 0.75, y: 0.45, slotType: "MID" },
    { x: 0.2, y: 0.18, slotType: "FWD" },
    { x: 0.5, y: 0.18, slotType: "FWD" },
    { x: 0.8, y: 0.18, slotType: "FWD" },
  ],
  "4-2-3-1": [
    { x: 0.5, y: 0.9, slotType: "GK" },
    { x: 0.15, y: 0.75, slotType: "DEF" },
    { x: 0.38, y: 0.75, slotType: "DEF" },
    { x: 0.62, y: 0.75, slotType: "DEF" },
    { x: 0.85, y: 0.75, slotType: "DEF" },
    { x: 0.35, y: 0.55, slotType: "MID" },
    { x: 0.65, y: 0.55, slotType: "MID" },
    { x: 0.2, y: 0.35, slotType: "MID" },
    { x: 0.5, y: 0.35, slotType: "MID" },
    { x: 0.8, y: 0.35, slotType: "MID" },
    { x: 0.5, y: 0.15, slotType: "FWD" },
  ],
  "3-5-2": [
    { x: 0.5, y: 0.9, slotType: "GK" },
    { x: 0.25, y: 0.72, slotType: "DEF" },
    { x: 0.5, y: 0.72, slotType: "DEF" },
    { x: 0.75, y: 0.72, slotType: "DEF" },
    { x: 0.1, y: 0.48, slotType: "MID" },
    { x: 0.3, y: 0.48, slotType: "MID" },
    { x: 0.5, y: 0.48, slotType: "MID" },
    { x: 0.7, y: 0.48, slotType: "MID" },
    { x: 0.9, y: 0.48, slotType: "MID" },
    { x: 0.35, y: 0.18, slotType: "FWD" },
    { x: 0.65, y: 0.18, slotType: "FWD" },
  ],
  "3-4-3": [
    { x: 0.5, y: 0.9, slotType: "GK" },
    { x: 0.25, y: 0.72, slotType: "DEF" },
    { x: 0.5, y: 0.72, slotType: "DEF" },
    { x: 0.75, y: 0.72, slotType: "DEF" },
    { x: 0.15, y: 0.48, slotType: "MID" },
    { x: 0.38, y: 0.48, slotType: "MID" },
    { x: 0.62, y: 0.48, slotType: "MID" },
    { x: 0.85, y: 0.48, slotType: "MID" },
    { x: 0.2, y: 0.18, slotType: "FWD" },
    { x: 0.5, y: 0.18, slotType: "FWD" },
    { x: 0.8, y: 0.18, slotType: "FWD" },
  ],
  "5-3-2": [
    { x: 0.5, y: 0.9, slotType: "GK" },
    { x: 0.1, y: 0.72, slotType: "DEF" },
    { x: 0.3, y: 0.72, slotType: "DEF" },
    { x: 0.5, y: 0.72, slotType: "DEF" },
    { x: 0.7, y: 0.72, slotType: "DEF" },
    { x: 0.9, y: 0.72, slotType: "DEF" },
    { x: 0.25, y: 0.45, slotType: "MID" },
    { x: 0.5, y: 0.45, slotType: "MID" },
    { x: 0.75, y: 0.45, slotType: "MID" },
    { x: 0.35, y: 0.18, slotType: "FWD" },
    { x: 0.65, y: 0.18, slotType: "FWD" },
  ],
  "5-4-1": [
    { x: 0.5, y: 0.9, slotType: "GK" },
    { x: 0.1, y: 0.72, slotType: "DEF" },
    { x: 0.3, y: 0.72, slotType: "DEF" },
    { x: 0.5, y: 0.72, slotType: "DEF" },
    { x: 0.7, y: 0.72, slotType: "DEF" },
    { x: 0.9, y: 0.72, slotType: "DEF" },
    { x: 0.15, y: 0.45, slotType: "MID" },
    { x: 0.38, y: 0.45, slotType: "MID" },
    { x: 0.62, y: 0.45, slotType: "MID" },
    { x: 0.85, y: 0.45, slotType: "MID" },
    { x: 0.5, y: 0.18, slotType: "FWD" },
  ],
  "4-1-4-1": [
    { x: 0.5, y: 0.9, slotType: "GK" },
    { x: 0.15, y: 0.75, slotType: "DEF" },
    { x: 0.38, y: 0.75, slotType: "DEF" },
    { x: 0.62, y: 0.75, slotType: "DEF" },
    { x: 0.85, y: 0.75, slotType: "DEF" },
    { x: 0.5, y: 0.6, slotType: "MID" },
    { x: 0.15, y: 0.42, slotType: "MID" },
    { x: 0.38, y: 0.42, slotType: "MID" },
    { x: 0.62, y: 0.42, slotType: "MID" },
    { x: 0.85, y: 0.42, slotType: "MID" },
    { x: 0.5, y: 0.18, slotType: "FWD" },
  ],
  "4-4-1-1": [
    { x: 0.5, y: 0.9, slotType: "GK" },
    { x: 0.15, y: 0.72, slotType: "DEF" },
    { x: 0.38, y: 0.72, slotType: "DEF" },
    { x: 0.62, y: 0.72, slotType: "DEF" },
    { x: 0.85, y: 0.72, slotType: "DEF" },
    { x: 0.15, y: 0.5, slotType: "MID" },
    { x: 0.38, y: 0.5, slotType: "MID" },
    { x: 0.62, y: 0.5, slotType: "MID" },
    { x: 0.85, y: 0.5, slotType: "MID" },
    { x: 0.5, y: 0.32, slotType: "FWD" },
    { x: 0.5, y: 0.15, slotType: "FWD" },
  ],
  "4-3-2-1": [
    { x: 0.5, y: 0.9, slotType: "GK" },
    { x: 0.15, y: 0.75, slotType: "DEF" },
    { x: 0.38, y: 0.75, slotType: "DEF" },
    { x: 0.62, y: 0.75, slotType: "DEF" },
    { x: 0.85, y: 0.75, slotType: "DEF" },
    { x: 0.25, y: 0.55, slotType: "MID" },
    { x: 0.5, y: 0.55, slotType: "MID" },
    { x: 0.75, y: 0.55, slotType: "MID" },
    { x: 0.35, y: 0.35, slotType: "FWD" },
    { x: 0.65, y: 0.35, slotType: "FWD" },
    { x: 0.5, y: 0.15, slotType: "FWD" },
  ],
  "3-4-2-1": [
    { x: 0.5, y: 0.9, slotType: "GK" },
    { x: 0.25, y: 0.75, slotType: "DEF" },
    { x: 0.5, y: 0.75, slotType: "DEF" },
    { x: 0.75, y: 0.75, slotType: "DEF" },
    { x: 0.15, y: 0.55, slotType: "MID" },
    { x: 0.38, y: 0.55, slotType: "MID" },
    { x: 0.62, y: 0.55, slotType: "MID" },
    { x: 0.85, y: 0.55, slotType: "MID" },
    { x: 0.35, y: 0.32, slotType: "FWD" },
    { x: 0.65, y: 0.32, slotType: "FWD" },
    { x: 0.5, y: 0.15, slotType: "FWD" },
  ],
  "4-5-1": [
    { x: 0.5, y: 0.9, slotType: "GK" },
    { x: 0.15, y: 0.73, slotType: "DEF" },
    { x: 0.38, y: 0.73, slotType: "DEF" },
    { x: 0.62, y: 0.73, slotType: "DEF" },
    { x: 0.85, y: 0.73, slotType: "DEF" },
    { x: 0.1, y: 0.45, slotType: "MID" },
    { x: 0.3, y: 0.45, slotType: "MID" },
    { x: 0.5, y: 0.45, slotType: "MID" },
    { x: 0.7, y: 0.45, slotType: "MID" },
    { x: 0.9, y: 0.45, slotType: "MID" },
    { x: 0.5, y: 0.18, slotType: "FWD" },
  ],
  "5-2-3": [
    { x: 0.5, y: 0.9, slotType: "GK" },
    { x: 0.1, y: 0.72, slotType: "DEF" },
    { x: 0.3, y: 0.72, slotType: "DEF" },
    { x: 0.5, y: 0.72, slotType: "DEF" },
    { x: 0.7, y: 0.72, slotType: "DEF" },
    { x: 0.9, y: 0.72, slotType: "DEF" },
    { x: 0.35, y: 0.48, slotType: "MID" },
    { x: 0.65, y: 0.48, slotType: "MID" },
    { x: 0.2, y: 0.18, slotType: "FWD" },
    { x: 0.5, y: 0.18, slotType: "FWD" },
    { x: 0.8, y: 0.18, slotType: "FWD" },
  ],
  "4-2-4": [
    { x: 0.5, y: 0.9, slotType: "GK" },
    { x: 0.15, y: 0.72, slotType: "DEF" },
    { x: 0.38, y: 0.72, slotType: "DEF" },
    { x: 0.62, y: 0.72, slotType: "DEF" },
    { x: 0.85, y: 0.72, slotType: "DEF" },
    { x: 0.35, y: 0.48, slotType: "MID" },
    { x: 0.65, y: 0.48, slotType: "MID" },
    { x: 0.15, y: 0.18, slotType: "FWD" },
    { x: 0.38, y: 0.18, slotType: "FWD" },
    { x: 0.62, y: 0.18, slotType: "FWD" },
    { x: 0.85, y: 0.18, slotType: "FWD" },
  ],
};

/** T034: Map a Position enum value to the corresponding SlotType. */
export function positionToSlotType(position: Position): SlotType {
  if (position === "GK") return "GK";
  if (["CB", "RB", "LB", "RWB", "LWB"].includes(position)) return "DEF";
  if (["DMF", "CMF", "AMF", "RMF", "LMF", "SS"].includes(position))
    return "MID";
  return "FWD"; // CF, RWF, LWF
}

/** T036: Assign roster entries to 11 field slots for a given formation.
 *
 * Algorithm:
 * 1. Players with `position != null` are sorted by confirmedAt ASC and assigned
 *    to matching slotType slots first.
 * 2. Remaining slots are filled with all remaining players (position-matched
 *    overflow + position-null), sorted by confirmedAt ASC.
 * 3. First 11 players by this ordering are placed on the field.
 *
 * Returns an array of 11 elements, each being a RosterEntry or null.
 */
export function assignPlayersToSlots(
  lineup: string,
  roster: any[],
): Array<any | null> {
  const slots = FORMATION_SLOTS[lineup];
  if (!slots || !roster.length) return Array(11).fill(null);

  const sorted = [...roster].sort(
    (a, b) =>
      new Date(a.confirmedAt ?? 0).getTime() -
      new Date(b.confirmedAt ?? 0).getTime(),
  );

  const assignment: Array<any | null> = Array(11).fill(null);
  const usedIds = new Set<string>();

  // Pass 1: assign by matching slotType
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i]!;
    const match = sorted.find(
      (p) =>
        !usedIds.has(p.participantId) &&
        p.player.position &&
        positionToSlotType(p.player.position) === slot.slotType,
    );
    if (match) {
      assignment[i] = match;
      usedIds.add(match.participantId);
    }
  }

  // Pass 2: fill remaining slots with leftover players (sorted by confirmedAt)
  const remaining = sorted.filter((p) => !usedIds.has(p.participantId));
  for (let i = 0; i < slots.length; i++) {
    if (assignment[i] === null && remaining.length > 0) {
      assignment[i] = remaining.shift()!;
    }
  }

  return assignment;
}
