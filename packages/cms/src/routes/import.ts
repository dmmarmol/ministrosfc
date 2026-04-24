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

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});

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

      const result = await CsvImportService.parseAndImport({
        historial: historialFile.buffer,
        jugadores: jugadoresFile.buffer,
        apariciones: aparicionesFile.buffer,
        canchas: canchasFile?.buffer,
        adminUserId: userId,
      });

      req.log?.info(
        {
          route: "POST /api/v1/import/csv",
          userId,
          elapsedMs: Date.now() - startMs,
          result,
        },
        "CSV import completed",
      );

      // Flush Redis so stale cached stats don't survive a re-import
      try {
        await getRedisClient().flushall();
      } catch {
        // Non-fatal — import succeeded even if cache flush fails
      }

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
