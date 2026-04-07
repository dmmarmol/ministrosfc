import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate, uuidSchema } from "../middleware/validation";
import { PlaygroundService } from "../services/PlaygroundService";

const router = Router();

const playgroundCreateSchema = z.object({
  name: z.string().min(1).max(255, "Name must be 255 characters or less"),
  address: z.string().min(1).max(500, "Address must be 500 characters or less"),
});

const playgroundUpdateSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  address: z.string().min(1).max(500).optional(),
});

// GET /api/v1/playgrounds — public
router.get("/", async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const playgrounds = await PlaygroundService.list();
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({ data: playgrounds });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/playgrounds/:id — public
router.get(
  "/:id",
  validate(uuidSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const playground = await PlaygroundService.findById(req.params.id!);
      res.json({ data: playground });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/playgrounds — EDITOR+
router.post(
  "/",
  authenticate,
  requireRole("EDITOR"),
  validate(playgroundCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const playground = await PlaygroundService.create(req.body, req.user!.userId);
      res.status(201).json({ data: playground });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/playgrounds/:id — EDITOR+
router.patch(
  "/:id",
  authenticate,
  requireRole("EDITOR"),
  validate(uuidSchema, "params"),
  validate(playgroundUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const playground = await PlaygroundService.update(
        req.params.id!,
        req.body,
        req.user!.userId,
      );
      res.json({ data: playground });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/playgrounds/:id — ADMIN only
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(uuidSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await PlaygroundService.delete(req.params.id!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export { router as playgroundRouter };
