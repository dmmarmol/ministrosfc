import { prisma } from "../../config/database";
import { CompetitionType, GameStatus } from "@prisma/client";
import type { CsvImportResultDTO } from "@ministrosfc/shared";
import { parseCsv, parseDate } from "./helpers";
import { HistorialCols } from "./column-maps";

/**
 * Parse historial.csv and upsert Game + Tournament + OpponentTeam records.
 *
 * Accepts an optional playground name → ID map (produced by importCanchas) to
 * set Game.playgroundId when a game's location matches a known playground.
 * When hasCanchas is true and a location has no match, a warning is emitted.
 */
export async function importHistorial(
  buf: Buffer,
  result: CsvImportResultDTO,
  warnings: string[],
  playgroundNameToId: Map<string, string>,
  hasCanchas: boolean,
): Promise<void> {
  const rows = parseCsv(buf);

  for (const row of rows) {
    const fechaRaw = row[HistorialCols.fecha]?.trim();

    // Skip completely empty rows (e.g. spreadsheet padding rows with no date or rival)
    if (!fechaRaw && !row[HistorialCols.rival]?.trim()) continue;

    const date = parseDate(fechaRaw ?? "");
    if (!date) {
      warnings.push(`historial: invalid date "${fechaRaw}" — row skipped`);
      result.games.skipped++;
      continue;
    }

    const rivalName = row[HistorialCols.rival]?.trim();
    if (!rivalName) {
      warnings.push(`historial: missing rival on ${fechaRaw} — row skipped`);
      result.games.skipped++;
      continue;
    }

    const tournamentName = row[HistorialCols.torneo]?.trim() || null;
    const gameYear = date.getUTCFullYear();

    // Upsert tournament — matched by (name, year) so editions in different
    // calendar years are kept as separate Tournament records.
    let tournamentId: string | null = null;
    if (tournamentName) {
      const yearStart = new Date(Date.UTC(gameYear, 0, 1));
      const yearEnd = new Date(Date.UTC(gameYear, 11, 31));
      const existingTournament = await prisma.tournament.findFirst({
        where: {
          name: { equals: tournamentName, mode: "insensitive" },
          startDate: { gte: yearStart, lte: yearEnd },
        },
        select: { id: true },
      });
      if (existingTournament) {
        tournamentId = existingTournament.id;
        // Extend the tournament's endDate if this game is later than the current one.
        await prisma.tournament.updateMany({
          where: { id: tournamentId, endDate: { lt: date } },
          data: { endDate: date },
        });
      } else {
        const newTournament = await prisma.tournament.create({
          data: {
            name: tournamentName,
            competitionType: CompetitionType.LEAGUE,
            startDate: date,
            endDate: date,
          },
          select: { id: true },
        });
        tournamentId = newTournament.id;
      }
    }

    // Upsert opponent team
    const opponent = await prisma.opponentTeam.upsert({
      where: { name: rivalName },
      create: { name: rivalName },
      update: {},
      select: { id: true },
    });

    const homeScore = row[HistorialCols.golesConvertidos]
      ? parseInt(row[HistorialCols.golesConvertidos]!, 10)
      : null;
    const awayScore = row[HistorialCols.golesRecibidos]
      ? parseInt(row[HistorialCols.golesRecibidos]!, 10)
      : null;

    const slugBase = `${date.toISOString().slice(0, 10)}-${rivalName.toLowerCase().replace(/\s+/g, "-").slice(0, 30)}`;
    const slugUnique = `${slugBase}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    const locationRaw = row[HistorialCols.estadio]?.trim() || null;
    const playgroundId = locationRaw
      ? (playgroundNameToId.get(locationRaw.toLowerCase()) ?? null)
      : null;

    if (hasCanchas && locationRaw && !playgroundId) {
      warnings.push(
        `game ${fechaRaw} vs ${rivalName}: location '${locationRaw}' not found in canchas.csv`,
      );
    }

    const gameData = {
      date,
      opponentTeamId: opponent.id,
      tournamentId,
      homeTeamScore: isNaN(homeScore ?? NaN) ? null : homeScore,
      awayTeamScore: isNaN(awayScore ?? NaN) ? null : awayScore,
      status: GameStatus.COMPLETED,
      competitionType: CompetitionType.LEAGUE,
      location: locationRaw,
      playgroundId,
      startTime: row[HistorialCols.comienzo]?.trim() || null,
      endTime: row[HistorialCols.finalizacion]?.trim() || null,
      coach: row[HistorialCols.dt]?.trim() || null,
      notes: row[HistorialCols.comentarios]?.trim() || null,
      photoUrl: row[HistorialCols.foto]?.trim() || null,
    };

    const existing = await prisma.game.findFirst({
      where: {
        date,
        opponentTeamId: opponent.id,
        tournamentId: tournamentId ?? null,
      },
      select: { id: true },
    });

    if (existing) {
      await prisma.game.update({ where: { id: existing.id }, data: gameData });
      result.games.updated++;
    } else {
      await prisma.game.create({
        data: { ...gameData, slug: slugUnique, endDate: date, lineup: "4-4-2" },
      });
      result.games.created++;
    }
  }
}
