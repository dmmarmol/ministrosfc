/**
 * CSV import handler — composes the per-CSV importers in dependency order:
 *
 *   jugadores → canchas (optional) → historial → apariciones
 *
 * Each importer is self-contained and receives only the shared state it needs
 * (counters, warnings, ID maps). This file owns the orchestration logic and
 * the public CsvImportService interface.
 */
import type { CsvImportResultDTO } from "@ministrosfc/shared";
import { prisma } from "../../config/database";
import { importJugadores } from "./import-jugadores";
import { importCanchas } from "./import-canchas";
import { importHistorial } from "./import-historial";
import { importApariciones } from "./import-apariciones";

export interface CsvImportInput {
  jugadores: Buffer;
  historial: Buffer;
  apariciones: Buffer;
  /** Optional: when provided, Playground records are upserted and Game.playgroundId is set. */
  canchas?: Buffer;
  /** Required when canchas is provided; used as createdById / updatedById on Playground records. */
  adminUserId?: string;
}

export const CsvImportService = {
  async parseAndImport(files: CsvImportInput): Promise<CsvImportResultDTO> {
    const warnings: string[] = [];
    const result: CsvImportResultDTO = {
      players: { created: 0, updated: 0, skipped: 0 },
      games: { created: 0, updated: 0, skipped: 0 },
      appearances: { created: 0, updated: 0, skipped: 0 },
      playgrounds: { created: 0, updated: 0, skipped: 0 },
      warnings,
    };

    // 1. jugadores → builds playerNameToId map (name + nickname → player ID)
    const playerNameToId = await importJugadores(files.jugadores, result);

    // 2. canchas (optional) → builds playgroundNameToId map (location → playground ID)
    let playgroundNameToId = new Map<string, string>();
    if (files.canchas && files.adminUserId) {
      playgroundNameToId = await importCanchas(
        files.canchas,
        files.adminUserId,
        result,
      );
    }

    // 3. historial → upserts games; uses playgroundNameToId to link Game.playgroundId
    await importHistorial(
      files.historial,
      result,
      warnings,
      playgroundNameToId,
      !!files.canchas,
    );

    // 3.5. For each tournament, set playground to the most-used one across its games
    if (files.canchas && playgroundNameToId.size > 0) {
      const tournaments = await prisma.tournament.findMany({
        select: {
          id: true,
          games: {
            where: { playgroundId: { not: null } },
            select: { playgroundId: true },
          },
        },
      });
      for (const tournament of tournaments) {
        if (tournament.games.length === 0) continue;
        // Count occurrences of each playgroundId
        const freq = new Map<string, number>();
        for (const g of tournament.games) {
          if (g.playgroundId)
            freq.set(g.playgroundId, (freq.get(g.playgroundId) ?? 0) + 1);
        }
        const topPlaygroundId = [...freq.entries()].sort(
          (a, b) => b[1] - a[1],
        )[0]?.[0];
        if (topPlaygroundId) {
          await prisma.tournament.update({
            where: { id: tournament.id },
            data: { playgroundId: topPlaygroundId },
          });
        }
      }
    }

    // 4. apariciones → upserts game participants; uses playerNameToId to skip extra DB lookups
    await importApariciones(
      files.apariciones,
      result,
      warnings,
      playerNameToId,
    );

    return result;
  },
};
