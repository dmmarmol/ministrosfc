import { randomUUID } from "crypto";
import { Position } from "@prisma/client";
import type { ParsedJugadorRow } from "../parsers/parseJugadores";
import type { IdMap } from "../types";

const PLACEHOLDER_PHOTO = "https://placehold.co/200x200?text=Player";

// Valid Position enum values from Prisma schema
const VALID_POSITIONS = new Set([
  "GK",
  "CB",
  "RB",
  "LB",
  "RWB",
  "LWB",
  "DMF",
  "CMF",
  "AMF",
  "RMF",
  "LMF",
  "SS",
  "CF",
  "RWF",
  "LWF",
]);

const POSITION_REMAP: Record<string, string> = {
  SMF: "CMF",
  LIB: "CB",
};

type Foot = "LEFT" | "RIGHT" | "AMBIDEXTROUS";
const FOOT_MAP: Record<string, Foot> = {
  Zurdo: "LEFT",
  Diestro: "RIGHT",
  Ambidiestro: "AMBIDEXTROUS",
};

const GUEST_PATTERNS = ["amigo de", "amigo del"];

function isGuest(name: string, nickname: string | null): boolean {
  const lName = name.toLowerCase();
  const lNick = (nickname ?? "").toLowerCase();
  return GUEST_PATTERNS.some((p) => lName.includes(p) || lNick.includes(p));
}

function resolvePosition(raw: string): Position | null {
  if (!raw?.trim()) return null;
  const parts = raw.split(",").map((p) => p.trim());
  for (const part of parts) {
    const remapped = POSITION_REMAP[part] ?? part;
    if (VALID_POSITIONS.has(remapped)) return remapped as Position;
  }
  return null;
}

interface PlayerData {
  id: string;
  name: string;
  nickname: string | null;
  dateOfBirth: string | null;
  height: number | null;
  jerseyNumber: number | null;
  dominantFoot: Foot | null;
  position: Position | null;
  nationalId: string | null;
  photoUrl: string;
  playerType: "REGISTERED" | "GUEST";
  status: "ACTIVE";
  invitedById: null;
}

interface ContactData {
  playerId: string;
  phone: string;
  whatsapp: null;
  emergencyContact: null;
}

interface BuildPlayersResult {
  players: PlayerData[];
  contacts: ContactData[];
  playerMapByName: IdMap;
  playerMapByNickname: IdMap;
}

/**
 * Transform parsed Jugadores rows into Player and Contact records.
 * Pre-generates UUIDs for all players before returning.
 */
export function buildPlayers(rows: ParsedJugadorRow[]): BuildPlayersResult {
  const players: PlayerData[] = [];
  const contacts: ContactData[] = [];
  const playerMapByName: IdMap = {};
  const playerMapByNickname: IdMap = {};

  for (const row of rows) {
    const id = randomUUID();
    const nickname = row.Apodo; // already null-normalised by parseJugadores

    players.push({
      id,
      name: row.name.trim(),
      nickname,
      dateOfBirth: parseDOB(row.Nacimiento),
      height: parseIntOrNull(row.Altura),
      jerseyNumber: parseIntOrNull(row.Numero),
      dominantFoot: FOOT_MAP[row.Pie?.trim()] ?? null,
      position: resolvePosition(row["Posición"]),
      nationalId: row.DNI?.trim() || null,
      photoUrl: PLACEHOLDER_PHOTO,
      playerType: isGuest(row.name, nickname) ? "GUEST" : "REGISTERED",
      status: "ACTIVE",
      invitedById: null,
    });

    // Lookup maps use lowercased trimmed keys
    playerMapByName[row.name.trim().toLowerCase()] = id;
    if (nickname) {
      playerMapByNickname[nickname.trim().toLowerCase()] = id;
    }

    // Contact — only when phone is present
    const phone = row.Telefono?.trim();
    if (phone) {
      contacts.push({
        playerId: id,
        phone,
        whatsapp: null,
        emergencyContact: null,
      });
    }
  }

  return { players, contacts, playerMapByName, playerMapByNickname };
}

function parseIntOrNull(value: string | undefined): number | null {
  if (!value?.trim()) return null;
  const n = parseInt(value.trim(), 10);
  return isNaN(n) ? null : n;
}

function parseDOB(value: string | undefined): string | null {
  if (!value?.trim()) return null;
  // Accept DD/MM/YYYY → return YYYY-MM-DD
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return null;
  const dayStr = match[1];
  const monthStr = match[2];
  const yearStr = match[3];
  if (!dayStr || !monthStr || !yearStr) return null;
  const day = parseInt(dayStr, 10).toString().padStart(2, "0");
  const month = parseInt(monthStr, 10).toString().padStart(2, "0");
  const year = yearStr;
  return `${year}-${month}-${day}`;
}
