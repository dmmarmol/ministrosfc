import { prisma } from "../../config/database";
import { ConfirmationStatus, PlayerStatus, PlayerType } from "@prisma/client";
import type { CsvImportResultDTO } from "@ministrosfc/shared";
import { logger } from "../../utils/logger";
import { parseCsv, parseDate, splitName, ensureExternalIds } from "./helpers";
import { AparicionesCols } from "./column-maps";

export interface AparicionesProgress {
  processedRows: number;
  totalRows: number;
  elapsedMs: number;
  created: number;
  updated: number;
  skipped: number;
  warnings: number;
}

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
  onProgress?: (progress: AparicionesProgress) => void,
): Promise<void> {
  // Ensure every row has a stable JugadorID UUID.
  // Also disambiguates the duplicate "Jugador" header (col 5 = full name, col 6 = nickname → JugadorNickname).
  const normalised = ensureExternalIds(buf, "JugadorID", [
    { header: "Jugador", occurrenceIndex: 1, newName: "JugadorNickname" },
  ]);
  const rows = parseCsv(normalised);
  const totalRows = rows.length;
  const stageStartMs = Date.now();
  const progressEveryRows = 100;

  const emitProgress = (processedRows: number): void => {
    const progress: AparicionesProgress = {
      processedRows,
      totalRows,
      elapsedMs: Date.now() - stageStartMs,
      created: result.appearances.created,
      updated: result.appearances.updated,
      skipped: result.appearances.skipped,
      warnings: warnings.length,
    };

    logger.info(progress, "CSV import apariciones progress");
    onProgress?.(progress);
  };

  emitProgress(0);

  for (let index = 0; index < rows.length; index++) {
    const row = rows[index];
    const fechaRaw = row[AparicionesCols.fecha]?.trim();
    const date = parseDate(fechaRaw ?? "");
    if (!date) {
      warnings.push(`apariciones: invalid date "${fechaRaw}" — row skipped`);
      result.appearances.skipped++;
      continue;
    }

    const rivalName = row[AparicionesCols.rival]?.trim();
    const tournamentName = row[AparicionesCols.torneo]?.trim() || null;

    // Resolve tournament id — must be year-scoped so same-named tournaments in
    // different calendar years are kept distinct (mirrors import-historial logic).
    let tournamentId: string | null = null;
    if (tournamentName) {
      const gameYear = date.getUTCFullYear();
      const yearStart = new Date(Date.UTC(gameYear, 0, 1));
      const yearEnd = new Date(Date.UTC(gameYear, 11, 31));
      const t = await prisma.tournament.findFirst({
        where: {
          name: { equals: tournamentName, mode: "insensitive" },
          startDate: { gte: yearStart, lte: yearEnd },
        },
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

    const jugadorExternalId = row[AparicionesCols.jugadorId]?.trim() || null;
    const playerName = row[AparicionesCols.jugador]?.trim();
    if (!jugadorExternalId && !playerName) {
      result.appearances.skipped++;
      continue;
    }

    // Resolve player — prefer stable externalId, fall back to name map then DB lookup
    let resolvedPlayerId: string | undefined;

    if (jugadorExternalId) {
      const byExternal = await prisma.player.findFirst({
        where: { externalId: jugadorExternalId },
        select: { id: true },
      });
      resolvedPlayerId = byExternal?.id;
    }

    if (!resolvedPlayerId && playerName) {
      resolvedPlayerId = playerNameToId.get(playerName.toLowerCase());
    }

    if (!resolvedPlayerId && playerName) {
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

    if (!resolvedPlayerId) {
      warnings.push(
        `apariciones: could not resolve player (externalId="${jugadorExternalId ?? ""}", name="${playerName ?? ""}") — row skipped`,
      );
      result.appearances.skipped++;
      continue;
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

    const processedRows = index + 1;
    if (
      processedRows % progressEveryRows === 0 ||
      processedRows === totalRows
    ) {
      emitProgress(processedRows);
    }
  }
}
