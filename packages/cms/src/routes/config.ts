import { Router, type Request, type Response } from "express";
import { isPhotoStorageConfigured } from "../utils/object-storage";

const router = Router();

// GET /api/v1/config — public capability flags for the frontend.
// Dependency-free on purpose: no database or Redis access.
router.get("/", (_req: Request, res: Response) => {
  res.status(200).json({ photoUploadsEnabled: isPhotoStorageConfigured() });
});

export { router as configRouter };
