import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { CsvImportService } from "../services/CsvImportService";
import { getRedisClient } from "../config/redis";
import { type CsvImportProgress } from "src/services/csv-import/handler";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});

const CSV_IMPORT_SOFT_TIMEOUT_MS = Number.parseInt(
  process.env.CSV_IMPORT_SOFT_TIMEOUT_MS ?? "180000",
  10,
);

// POST /api/v1/import/csv
// Admin-only: upload historial, jugadores, apariciones CSV files
router.post(
  "/csv",
  authenticate,
  requireRole("ADMIN"),
  upload.fields([
    { name: "historial", maxCount: 1 },
    { name: "jugadores", maxCount: 1 },
    { name: "apariciones", maxCount: 1 },
    { name: "canchas", maxCount: 1 },
  ]),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const startMs = Date.now();
      const userId = (req as any).user?.userId;
      const softTimeoutMs =
        Number.isFinite(CSV_IMPORT_SOFT_TIMEOUT_MS) &&
        CSV_IMPORT_SOFT_TIMEOUT_MS > 0
          ? CSV_IMPORT_SOFT_TIMEOUT_MS
          : 180000;
      const files = req.files as
        | Record<string, Express.Multer.File[]>
        | undefined;

      const historialFile = files?.["historial"]?.[0];
      const jugadoresFile = files?.["jugadores"]?.[0];
      const aparicionesFile = files?.["apariciones"]?.[0];
      const canchasFile = files?.["canchas"]?.[0];

      req.log?.info(
        {
          route: "POST /api/v1/import/csv",
          userId,
          files: {
            historialBytes: historialFile?.size ?? 0,
            jugadoresBytes: jugadoresFile?.size ?? 0,
            aparicionesBytes: aparicionesFile?.size ?? 0,
            canchasBytes: canchasFile?.size ?? 0,
          },
        },
        "CSV import request received",
      );

      if (!historialFile || !jugadoresFile || !aparicionesFile) {
        res.status(422).json({
          error:
            "Missing required files: historial, jugadores, apariciones (all required)",
        });
        return;
      }

      let latestProgress: CsvImportProgress | null = null;

      const importPromise = CsvImportService.parseAndImport({
        historial: historialFile.buffer,
        jugadores: jugadoresFile.buffer,
        apariciones: aparicionesFile.buffer,
        canchas: canchasFile?.buffer,
        adminUserId: userId,
        onProgress: (progress) => {
          latestProgress = progress;
        },
      });

      const raceResult = await Promise.race<
        | { type: "done"; result: Awaited<typeof importPromise> }
        | { type: "timeout" }
      >([
        importPromise.then((result) => ({ type: "done", result })),
        new Promise<{ type: "timeout" }>((resolve) => {
          setTimeout(() => resolve({ type: "timeout" }), softTimeoutMs);
        }),
      ]);

      const flushRedisCache = async () => {
        try {
          await getRedisClient().flushall();
        } catch {
          // Non-fatal — import succeeded even if cache flush fails
        }
      };

      if (raceResult.type === "timeout") {
        req.log?.warn(
          {
            route: "POST /api/v1/import/csv",
            userId,
            elapsedMs: Date.now() - startMs,
            softTimeoutMs,
            progress: latestProgress,
          },
          "CSV import still running after soft timeout",
        );

        importPromise
          .then(async (finalResult) => {
            req.log?.info(
              {
                route: "POST /api/v1/import/csv",
                userId,
                elapsedMs: Date.now() - startMs,
                result: finalResult,
              },
              "CSV import completed after soft-timeout response",
            );
            await flushRedisCache();
          })
          .catch((backgroundErr: any) => {
            req.log?.error(
              {
                route: "POST /api/v1/import/csv",
                message: backgroundErr?.message,
              },
              "CSV import failed after soft-timeout response",
            );
          });

        res.status(202).json({
          data: {
            status: "processing",
            elapsedMs: Date.now() - startMs,
            softTimeoutMs,
            progress: latestProgress,
          },
        });
        return;
      }

      const result = raceResult.result;

      req.log?.info(
        {
          route: "POST /api/v1/import/csv",
          userId,
          elapsedMs: Date.now() - startMs,
          result,
        },
        "CSV import completed",
      );

      await flushRedisCache();

      res.status(200).json({ data: result });
    } catch (err: any) {
      if (
        err?.code === "CSV_INVALID_CLOSING_QUOTE" ||
        err?.code?.startsWith("CSV_")
      ) {
        req.log?.warn(
          {
            route: "POST /api/v1/import/csv",
            message: err?.message,
          },
          "CSV import rejected due to parse error",
        );
        res.status(422).json({ error: `CSV parse error: ${err.message}` });
        return;
      }

      req.log?.error(
        {
          route: "POST /api/v1/import/csv",
          message: err?.message,
        },
        "CSV import failed with unexpected error",
      );
      next(err);
    }
  },
);

export { router as importRouter };
