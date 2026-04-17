import { prisma } from "../../config/database";
import { ConfirmationStatus, PlayerStatus, PlayerType } from "@prisma/client";
import type { CsvImportResultDTO } from "@ministrosfc/shared";
import { parseCsv, parseDate, splitName } from "./helpers";
import { AparicionesCols } from "./column-maps";

/**
 * Parse apariciones.csv and upsert GameParticipant records.
 *
 * Accepts the player name → ID map built by importJugadores so that players
 * referenced by nickname or full name are resolved without extra DB lookups.
 * Players not present in the map are resolved via DB, and auto-created as
 * minimal records if not found (no appearance is ever silently lost).
 */
export async function importApariciones(
  buf: Buffer,
  result: CsvImportResultDTO,
  warnings: string[],
  playerNameToId: Map<string, string>,
): Promise<void> {
  const rows = parseCsv(buf);

  for (const row of rows) {
    const fechaRaw = row[AparicionesCols.fecha]?.trim();
    const date = parseDate(fechaRaw ?? "");
    if (!date) {
      warnings.push(`apariciones: invalid date "${fechaRaw}" — row skipped`);
      result.appearances.skipped++;
      continue;
    }

    const rivalName = row[AparicionesCols.rival]?.trim();
    const tournamentName = row[AparicionesCols.torneo]?.trim() || null;

    // Resolve tournament id
    let tournamentId: string | null = null;
    if (tournamentName) {
      const t = await prisma.tournament.findFirst({
        where: { name: { equals: tournamentName, mode: "insensitive" } },
        select: { id: true },
      });
      tournamentId = t?.id ?? null;
    }

    // Resolve opponent id
    const opponent = rivalName
      ? await prisma.opponentTeam.findFirst({
          where: { name: { equals: rivalName, mode: "insensitive" } },
          select: { id: true },
        })
      : null;

    // Lookup game
    const game = opponent
      ? await prisma.game.findFirst({
          where: {
            date,
            opponentTeamId: opponent.id,
            tournamentId: tournamentId ?? null,
          },
          select: { id: true },
        })
      : null;

    if (!game) {
      warnings.push(
        `apariciones: no matching game for ${fechaRaw} vs "${rivalName}" (${tournamentName ?? "no torneo"}) — row skipped`,
      );
      result.appearances.skipped++;
      continue;
    }

    const playerName = row[AparicionesCols.jugador]?.trim();
    if (!playerName) {
      result.appearances.skipped++;
      continue;
    }

    // Resolve player — check name map first (covers nicknames indexed in importJugadores)
    let resolvedPlayerId = playerNameToId.get(playerName.toLowerCase());
    if (!resolvedPlayerId) {
      const { firstName, lastName } = splitName(playerName);
      let player = await prisma.player.findFirst({
        where: {
          firstName: { equals: firstName, mode: "insensitive" },
          lastName: { equals: lastName, mode: "insensitive" },
        },
        select: { id: true },
      });

      if (!player) {
        // Auto-create minimal player so no appearance is lost
        player = await prisma.player.create({
          data: {
            firstName,
            lastName,
            playerType: PlayerType.REGISTERED,
            status: PlayerStatus.ACTIVE,
          },
          select: { id: true },
        });
        warnings.push(
          `apariciones: auto-created player "${playerName}" (not in jugadores.csv)`,
        );
      }

      resolvedPlayerId = player.id;
      playerNameToId.set(playerName.toLowerCase(), resolvedPlayerId);
    }

    const isStarterRaw = row[AparicionesCols.titularSuplente]
      ?.trim()
      .toLowerCase();
    const isStarter =
      isStarterRaw === "titular"
        ? true
        : isStarterRaw === "suplente"
          ? false
          : null;

    const appearanceData = {
      goalsScored: parseInt(row[AparicionesCols.goles] ?? "0", 10) || 0,
      yellowCards: parseInt(row[AparicionesCols.amarilla] ?? "0", 10) || 0,
      redCards: parseInt(row[AparicionesCols.roja] ?? "0", 10) || 0,
      assists: parseInt(row[AparicionesCols.asistencia] ?? "0", 10) || 0,
      isStarter,
      notes: row[AparicionesCols.comentarios]?.trim() || null,
      confirmationStatus: ConfirmationStatus.CONFIRMED,
    };

    const existing = await prisma.gameParticipant.findFirst({
      where: { gameId: game.id, playerId: resolvedPlayerId },
      select: { id: true },
    });

    if (existing) {
      await prisma.gameParticipant.update({
        where: { id: existing.id },
        data: appearanceData,
      });
      result.appearances.updated++;
    } else {
      await prisma.gameParticipant.create({
        data: {
          gameId: game.id,
          playerId: resolvedPlayerId,
          ...appearanceData,
        },
      });
      result.appearances.created++;
    }
  }
}
