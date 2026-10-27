import { prisma } from "../../config/database";
import { Foot, PlayerType } from "@prisma/client";
import type { CsvImportResultDTO } from "@ministrosfc/shared";
import {
  parseCsv,
  parseDOB,
  stripCountAnnotation,
  splitName,
  mapFoot,
  mapPosition,
  mapPlayerStatus,
  ensureExternalIds,
} from "./helpers";
import { JugadoresCols } from "./column-maps";

/**
 * Parse jugadores.csv and upsert Player + Contact records.
 *
 * Returns a name/nickname → Player ID map used by importApariciones to resolve
 * player references without extra DB lookups.
 *
 * Two-pass structure:
 *   Pass 1 — upsert all players (and contacts), build the name map
 *   Pass 2 — resolve "Invitado Por" foreign keys using the populated map
 */
export async function importJugadores(
  buf: Buffer,
  result: CsvImportResultDTO,
): Promise<Map<string, string>> {
  // Guarantee every row has a stable UUID in the "ID" column before parsing.
  // If the uploaded CSV already has IDs they are preserved; missing ones are generated.
  const normalised = ensureExternalIds(buf, "ID");
  const rows = parseCsv(normalised);
  const playerNameToId = new Map<string, string>();

  // ── Pass 1: upsert players ──────────────────────────────────────────────────
  for (const row of rows) {
    // Primary name column is "Nombre". Fall back to any "Jugador (N)" header for
    // backward-compatibility with older CSV exports.
    const fullName =
      row[JugadoresCols.nombre]?.trim() ||
      (() => {
        const fallbackCol = Object.keys(row).find((k) =>
          k.startsWith("Jugador"),
        );
        const raw = fallbackCol ? row[fallbackCol] : undefined;
        return raw ? stripCountAnnotation(raw.trim()) : undefined;
      })();

    if (!fullName) {
      result.players.skipped++;
      continue;
    }

    const cleanName = stripCountAnnotation(fullName);
    const { firstName, lastName } = splitName(cleanName);
    const externalId = row[JugadoresCols.id]?.trim() || null;

    // Two-step lookup: prefer externalId when present; always fall back to name
    // match in case the CSV has no persistent ID column and ensureExternalIds
    // generated a fresh UUID on this upload (idempotency guard).
    let existing: { id: string } | null = null;
    if (externalId) {
      existing = await prisma.player.findFirst({
        where: { externalId },
        select: { id: true },
      });
    }
    if (!existing) {
      existing = await prisma.player.findFirst({
        where: {
          firstName: { equals: firstName, mode: "insensitive" },
          lastName: { equals: lastName, mode: "insensitive" },
        },
        select: { id: true },
      });
    }

    const playerData = {
      externalId,
      firstName,
      lastName,
      nickname: row[JugadoresCols.apodo]?.trim() || null,
      dateOfBirth: parseDOB(row[JugadoresCols.nacimiento] ?? ""),
      // "Edad" intentionally omitted — age is derived at read-time from dateOfBirth
      height: row[JugadoresCols.altura]
        ? parseInt(row[JugadoresCols.altura]!, 10) || null
        : null,
      jerseyNumber: row[JugadoresCols.numero]
        ? parseInt(row[JugadoresCols.numero]!, 10) || null
        : null,
      dominantFoot: mapFoot(row[JugadoresCols.pie] ?? "") as Foot | null,
      position: mapPosition(row[JugadoresCols.posicion] ?? "") as any,
      nationalId: row[JugadoresCols.dni]?.trim() || null,
      photoUrl: row[JugadoresCols.imagenUrl]?.trim() || null,
      playerType: PlayerType.REGISTERED,
      status: mapPlayerStatus(row[JugadoresCols.status] ?? ""),
    };

    let playerId: string;
    if (existing) {
      await prisma.player.update({
        where: { id: existing.id },
        data: playerData,
      });
      playerId = existing.id;
      result.players.updated++;
    } else {
      const created = await prisma.player.create({ data: playerData });
      playerId = created.id;
      result.players.created++;
    }

    playerNameToId.set(cleanName.toLowerCase(), playerId);

    const nickname = playerData.nickname;
    if (nickname) {
      playerNameToId.set(nickname.toLowerCase(), playerId);
    }

    // Upsert Contact from Telefono column
    const telefono = row[JugadoresCols.telefono]?.trim() || null;
    if (telefono) {
      await prisma.contact.upsert({
        where: { playerId },
        update: { phone: telefono, whatsapp: telefono },
        create: { playerId, phone: telefono, whatsapp: telefono },
      });
    }
  }

  // ── Pass 2: resolve invitedById ─────────────────────────────────────────────
  for (const row of rows) {
    const fullName =
      row[JugadoresCols.nombre]?.trim() ||
      (() => {
        const fallbackCol = Object.keys(row).find((k) =>
          k.startsWith("Jugador"),
        );
        const raw = fallbackCol ? row[fallbackCol] : undefined;
        return raw ? stripCountAnnotation(raw.trim()) : undefined;
      })();

    if (!fullName) continue;
    const cleanName = stripCountAnnotation(fullName);
    const invitadoPor = row[JugadoresCols.invitadoPor]?.trim();
    if (!invitadoPor) continue;

    const playerId = playerNameToId.get(cleanName.toLowerCase());
    const invitedById = playerNameToId.get(invitadoPor.toLowerCase());
    if (playerId && invitedById && playerId !== invitedById) {
      await prisma.player.update({
        where: { id: playerId },
        data: { invitedById },
      });
    }
  }

  return playerNameToId;
}
