import { randomUUID } from "node:crypto";
import type { CsvImportResultDTO } from "@ministrosfc/shared";
import { prisma } from "../../config/database";
import { getRedisClient } from "../../config/redis";
import { logger } from "../../utils/logger";
import { CsvImportService } from "../csv-import";
import type {
  CsvImportInput,
  CsvImportProgress,
} from "../csv-import/handler";

export type ImportJobStatus =
  | "queued"
  | "processing"
  | "completed"
  | "failed"
  | "cancelled";

export type ImportJobStage =
  | "start"
  | "jugadores"
  | "canchas"
  | "historial"
  | "apariciones"
  | "finish";

export interface ImportJobSnapshot {
  jobId: string;
  status: ImportJobStatus;
  currentStage: ImportJobStage;
  progressPercent: number;
  warnings: string[];
  result: CsvImportResultDTO | null;
  error: { code: string; message: string; stage?: string | null } | null;
  startedAt: string | null;
  updatedAt: string | null;
  finishedAt: string | null;
  createdAt: string;
}

const STAGE_PROGRESS: Record<string, { stage: ImportJobStage; percent: number }> = {
  start: { stage: "start", percent: 5 },
  jugadores: { stage: "jugadores", percent: 30 },
  canchas: { stage: "canchas", percent: 55 },
  historial: { stage: "historial", percent: 75 },
  "tournament-playground-backfill": { stage: "historial", percent: 80 },
  "apariciones-progress": { stage: "apariciones", percent: 90 },
  apariciones: { stage: "apariciones", percent: 95 },
  finish: { stage: "finish", percent: 100 },
};

const JITTER_MS = 15 * 60 * 1000;

const toImportStage = (stage: string | null | undefined): ImportJobStage => {
  const mapped = STAGE_PROGRESS[stage ?? ""]?.stage ?? "start";
  return mapped;
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, Math.round(value)));

const flushRedisCache = async () => {
  try {
    await getRedisClient().flushall();
  } catch {
    // Non-fatal — import succeeded even if cache flush fails.
  }
};

export class ImportJobService {
  static async getDuplicateJob({
    userId,
    fileChecksum,
  }: {
    userId?: string;
    fileChecksum: string;
  }) {
    return prisma.importJob.findFirst({
      where: {
        submittedByUserId: userId ?? null,
        fileChecksum,
        status: { in: ["queued", "processing"] },
      },
      orderBy: { createdAt: "desc" },
    });
  }

  static async createJob({
    userId,
    fileChecksum,
    fileMeta,
  }: {
    userId?: string;
    fileChecksum: string;
    fileMeta: Record<string, unknown>;
  }) {
    const id = randomUUID();
    return prisma.importJob.create({
      data: {
        id,
        status: "queued",
        currentStage: "start",
        progressPercent: 0,
        submittedByUserId: userId ?? null,
        fileChecksum,
        fileMeta: fileMeta as any,
        warningsJson: [],
        startedAt: new Date(),
        lastHeartbeatAt: new Date(),
      },
    });
  }

  static async getJobById(jobId: string) {
    return prisma.importJob.findUnique({
      where: { id: jobId },
      include: {
        warnings: { orderBy: { createdAt: "asc" } },
        errors: { orderBy: { createdAt: "asc" } },
        stageProgress: { orderBy: { createdAt: "asc" } },
      },
    });
  }

  static async toJobSnapshot(job: any, includeResult = false): Promise<ImportJobSnapshot> {
    const warningMessages = Array.isArray(job.warningsJson)
      ? job.warningsJson.map((warning: unknown) => String(warning))
      : (job.warnings ?? []).map((warning: any) => warning.message);

    const result = includeResult
      ? (job.resultJson as CsvImportResultDTO | null)
      : null;
    const error = job.errorJson as
      | { code: string; message: string; stage?: string | null }
      | null;

    return {
      jobId: job.id,
      status: job.status,
      currentStage: job.currentStage,
      progressPercent: clampPercent(job.progressPercent ?? 0),
      warnings: warningMessages,
      result,
      error,
      startedAt: job.startedAt ? new Date(job.startedAt).toISOString() : null,
      updatedAt: job.updatedAt ? new Date(job.updatedAt).toISOString() : null,
      finishedAt: job.finishedAt ? new Date(job.finishedAt).toISOString() : null,
      createdAt: job.createdAt ? new Date(job.createdAt).toISOString() : "",
    };
  }

  static async updateProgress(jobId: string, progress: CsvImportProgress) {
    const job = await prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job || ["completed", "failed", "cancelled"].includes(job.status)) {
      return;
    }

    const mapped = STAGE_PROGRESS[progress.stage] ?? {
      stage: toImportStage(progress.stage),
      percent: clampPercent(job.progressPercent ?? 0),
    };
    const nextPercent = clampPercent(Math.max(job.progressPercent ?? 0, mapped.percent));

    const updates: Record<string, unknown> = {
      currentStage: mapped.stage,
      progressPercent: nextPercent,
      lastHeartbeatAt: new Date(),
      updatedAt: new Date(),
    };

    if (!job.startedAt) {
      updates.startedAt = new Date();
    }

    await prisma.importJob.update({
      where: { id: jobId },
      data: updates,
    });

    const warningMessages = Array.from(
      new Set((progress.result?.warnings ?? []).map((warning) => String(warning))),
    );
    const existingWarnings = await prisma.importWarning.findMany({
      where: { importJobId: jobId },
      select: { message: true },
    });

    for (const message of warningMessages.filter(
      (warning) => !existingWarnings.some((candidate) => candidate.message === warning),
    )) {
      await prisma.importWarning.create({
        data: {
          importJobId: jobId,
          message,
          stage: mapped.stage,
        },
      });
    }

    await prisma.importStageProgress.create({
      data: {
        importJobId: jobId,
        stage: mapped.stage,
        percentComplete: nextPercent,
        detailsJson: (progress.details ?? {}) as any,
        processedRows:
          typeof progress.details?.processedRows === "number"
            ? Number(progress.details.processedRows)
            : null,
        totalRows:
          typeof progress.details?.totalRows === "number"
            ? Number(progress.details.totalRows)
            : null,
      },
    });
  }

  static async markJobCompleted(jobId: string, result: CsvImportResultDTO) {
    const warnings = Array.isArray(result.warnings) ? result.warnings : [];
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: "completed",
        currentStage: "finish",
        progressPercent: 100,
        resultJson: result as any,
        warningsJson: warnings as any,
        finishedAt: new Date(),
        lastHeartbeatAt: new Date(),
      },
    });

    if (warnings.length > 0) {
      await prisma.importWarning.createMany({
        data: warnings
          .filter((warning) => warning && warning.length > 0)
          .map((warning) => ({
            importJobId: jobId,
            message: warning,
            stage: "finish",
          })),
      });
    }

    await flushRedisCache();
  }

  static async markJobFailed(
    jobId: string,
    error: { code: string; message: string; stage?: string | null },
  ) {
    await prisma.importJob.update({
      where: { id: jobId },
      data: {
        status: "failed",
        currentStage: toImportStage(error.stage ?? "start"),
        errorJson: error,
        finishedAt: new Date(),
        lastHeartbeatAt: new Date(),
      },
    });

    await prisma.importError.create({
      data: {
        importJobId: jobId,
        code: error.code,
        message: error.message,
        stage: toImportStage(error.stage ?? "start"),
        recoverable: false,
      },
    });

    await flushRedisCache();
  }

  static async recoverInterruptedJobs() {
    const cutoff = new Date(Date.now() - JITTER_MS);
    const staleJobs = await prisma.importJob.findMany({
      where: {
        status: { in: ["queued", "processing"] },
        OR: [
          { lastHeartbeatAt: null, startedAt: { lte: cutoff } },
          { lastHeartbeatAt: { lte: cutoff } },
        ],
      },
      select: { id: true, status: true, currentStage: true },
    });

    for (const job of staleJobs) {
      await prisma.importJob.update({
        where: { id: job.id },
        data: {
          status: "failed",
          currentStage: job.currentStage ?? "start",
          errorJson: {
            code: "JOB_INTERRUPTED",
            message:
              "The import job was interrupted and left in its last durable state.",
            stage: job.currentStage,
          },
          finishedAt: new Date(),
          lastHeartbeatAt: new Date(),
        },
      });
    }
  }

  static async processImportJob(
    jobId: string,
    files: CsvImportInput,
  ): Promise<CsvImportResultDTO> {
    const job = await prisma.importJob.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new Error(`Import job ${jobId} not found`);
    }

    const heartbeatTimer = setInterval(() => {
      void prisma.importJob
        .update({
          where: { id: jobId },
          data: { lastHeartbeatAt: new Date() },
        })
        .catch(() => undefined);
    }, 15000);

    try {
      await prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: "processing",
          currentStage: "start",
          progressPercent: 5,
          startedAt: job.startedAt ?? new Date(),
          lastHeartbeatAt: new Date(),
        },
      });

      const result = await CsvImportService.parseAndImport({
        ...files,
        onProgress: (progress) => {
          void ImportJobService.updateProgress(jobId, progress).catch((error) => {
            logger.error({ jobId, error }, "Failed to persist CSV import progress");
          });
        },
      });

      await ImportJobService.markJobCompleted(jobId, result);
      return result;
    } catch (error: any) {
      const message = error?.message ?? "CSV import failed";
      const code = error?.code ?? "CSV_IMPORT_FAILED";
      const stage = error?.stage ?? "start";

      await ImportJobService.markJobFailed(jobId, {
        code,
        message,
        stage,
      });

      logger.error({ jobId, code, message }, "CSV import job failed");
      throw error;
    } finally {
      clearInterval(heartbeatTimer);
    }
  }
}
