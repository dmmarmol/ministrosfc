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
import { logger } from "../../utils/logger";
import { importJugadores } from "./import-jugadores";
import { importCanchas } from "./import-canchas";
import { importHistorial } from "./import-historial";
import {
  importApariciones,
  type AparicionesProgress,
} from "./import-apariciones";

export interface CsvImportProgress {
  stage:
    | "start"
    | "jugadores"
    | "canchas"
    | "historial"
    | "tournament-playground-backfill"
    | "apariciones-progress"
    | "apariciones"
    | "finish";
  elapsedMs: number;
  warnings: number;
  result: CsvImportResultDTO;
  details?: Record<string, unknown>;
}

export interface CsvImportInput {
  jugadores: Buffer;
  historial: Buffer;
  apariciones: Buffer;
  /** Optional: when provided, Playground records are upserted and Game.playgroundId is set. */
  canchas?: Buffer;
  /** Required when canchas is provided; used as createdById / updatedById on Playground records. */
  adminUserId?: string;
  onProgress?: (progress: CsvImportProgress) => void;
}

export const CsvImportService = {
  async parseAndImport(files: CsvImportInput): Promise<CsvImportResultDTO> {
    const totalStartMs = Date.now();
    const warnings: string[] = [];
    const result: CsvImportResultDTO = {
      players: { created: 0, updated: 0, skipped: 0 },
      games: { created: 0, updated: 0, skipped: 0 },
      appearances: { created: 0, updated: 0, skipped: 0 },
      playgrounds: { created: 0, updated: 0, skipped: 0 },
      warnings,
    };

    const snapshotResult = (): CsvImportResultDTO => ({
      players: { ...result.players },
      games: { ...result.games },
      appearances: { ...result.appearances },
      playgrounds: { ...result.playgrounds },
      warnings: [...warnings],
    });

    const emitProgress = (
      stage: CsvImportProgress["stage"],
      details?: Record<string, unknown>,
    ): void => {
      files.onProgress?.({
        stage,
        elapsedMs: Date.now() - totalStartMs,
        warnings: warnings.length,
        result: snapshotResult(),
        details,
      });
    };

    logger.info(
      {
        stage: "start",
        hasCanchas: !!files.canchas,
        hasAdminUserId: !!files.adminUserId,
        inputBytes: {
          jugadores: files.jugadores.length,
          historial: files.historial.length,
          apariciones: files.apariciones.length,
          canchas: files.canchas?.length ?? 0,
        },
      },
      "CSV import pipeline started",
    );
    emitProgress("start", {
      hasCanchas: !!files.canchas,
      hasAdminUserId: !!files.adminUserId,
    });

    // 1. jugadores → builds playerNameToId map (name + nickname → player ID)
    const jugadoresStartMs = Date.now();
    const playerNameToId = await importJugadores(files.jugadores, result);
    logger.info(
      {
        stage: "jugadores",
        elapsedMs: Date.now() - jugadoresStartMs,
        mappedPlayers: playerNameToId.size,
        result: result.players,
      },
      "CSV import stage completed",
    );
    emitProgress("jugadores", { mappedPlayers: playerNameToId.size });

    // 2. canchas (optional) → builds playgroundNameToId map (location → playground ID)
    let playgroundNameToId = new Map<string, string>();
    if (files.canchas && files.adminUserId) {
      const canchasStartMs = Date.now();
      playgroundNameToId = await importCanchas(
        files.canchas,
        files.adminUserId,
        result,
      );
      logger.info(
        {
          stage: "canchas",
          elapsedMs: Date.now() - canchasStartMs,
          mappedPlaygrounds: playgroundNameToId.size,
          result: result.playgrounds,
        },
        "CSV import stage completed",
      );
      emitProgress("canchas", { mappedPlaygrounds: playgroundNameToId.size });
    }

    // 3. historial → upserts games; uses playgroundNameToId to link Game.playgroundId
    const historialStartMs = Date.now();
    await importHistorial(
      files.historial,
      result,
      warnings,
      playgroundNameToId,
      !!files.canchas,
    );
    logger.info(
      {
        stage: "historial",
        elapsedMs: Date.now() - historialStartMs,
        result: result.games,
        warnings: warnings.length,
      },
      "CSV import stage completed",
    );
    emitProgress("historial");

    // 3.5. For each tournament, set playground to the most-used one across its games
    if (files.canchas && playgroundNameToId.size > 0) {
      const tournamentBackfillStartMs = Date.now();
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
      logger.info(
        {
          stage: "tournament-playground-backfill",
          elapsedMs: Date.now() - tournamentBackfillStartMs,
          tournaments: tournaments.length,
        },
        "CSV import stage completed",
      );
      emitProgress("tournament-playground-backfill", {
        tournaments: tournaments.length,
      });
    }

    // 4. apariciones → upserts game participants; uses playerNameToId to skip extra DB lookups
    const aparicionesStartMs = Date.now();
    await importApariciones(
      files.apariciones,
      result,
      warnings,
      playerNameToId,
      (progress: AparicionesProgress) => {
        emitProgress("apariciones-progress", {
          processedRows: progress.processedRows,
          totalRows: progress.totalRows,
          stageElapsedMs: progress.elapsedMs,
        });
      },
    );
    logger.info(
      {
        stage: "apariciones",
        elapsedMs: Date.now() - aparicionesStartMs,
        result: result.appearances,
        warnings: warnings.length,
      },
      "CSV import stage completed",
    );
    emitProgress("apariciones");

    logger.info(
      {
        stage: "finish",
        elapsedMs: Date.now() - totalStartMs,
        result,
      },
      "CSV import pipeline completed",
    );
    emitProgress("finish");

    return result;
  },
};
