import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import { createHash } from "node:crypto";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { ImportJobService } from "../services/import-jobs/ImportJobService";

const router = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
});

const buildFileChecksum = (...files: Array<Buffer | undefined>) =>
  createHash("sha256")
    .update(
      Buffer.concat(
        files.filter((file): file is Buffer => Boolean(file)).map((file) => file),
      ),
    )
    .digest("hex");

// POST /api/v1/import/csv
// Admin-only: create a durable import job and return immediately.
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

      const fileChecksum = buildFileChecksum(
        historialFile.buffer,
        jugadoresFile.buffer,
        aparicionesFile.buffer,
        canchasFile?.buffer,
      );

      const existingJob = await ImportJobService.getDuplicateJob({
        userId,
        fileChecksum,
      });

      if (existingJob) {
        req.log?.info(
          {
            route: "POST /api/v1/import/csv",
            userId,
            jobId: existingJob.id,
          },
          "Returning existing CSV import job for duplicate request",
        );

        res.status(202).json({
          data: await ImportJobService.toJobSnapshot(existingJob),
        });
        return;
      }

      const job = await ImportJobService.createJob({
        userId,
        fileChecksum,
        fileMeta: {
          historial: { originalname: historialFile.originalname, size: historialFile.size },
          jugadores: { originalname: jugadoresFile.originalname, size: jugadoresFile.size },
          apariciones: { originalname: aparicionesFile.originalname, size: aparicionesFile.size },
          canchas: canchasFile ? { originalname: canchasFile.originalname, size: canchasFile.size } : null,
        },
      });

      req.log?.info(
        {
          route: "POST /api/v1/import/csv",
          userId,
          jobId: job.id,
        },
        "CSV import job created",
      );

      res.status(202).json({
        data: await ImportJobService.toJobSnapshot(job),
      });

      void ImportJobService.processImportJob(job.id, {
        historial: historialFile.buffer,
        jugadores: jugadoresFile.buffer,
        apariciones: aparicionesFile.buffer,
        canchas: canchasFile?.buffer,
        adminUserId: userId,
      });
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

router.get(
  "/jobs/:jobId",
  authenticate,
  requireRole("ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { jobId } = req.params;
      if (!jobId) {
        res.status(400).json({ error: "Import job id is required" });
        return;
      }

      const job = await ImportJobService.getJobById(jobId);
      if (!job) {
        res.status(404).json({ error: "Import job not found" });
        return;
      }

      res.status(200).json({ data: await ImportJobService.toJobSnapshot(job, true) });
    } catch (err) {
      next(err);
    }
  },
);

export { router as importRouter };
