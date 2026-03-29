import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import { ProfileService } from "../services/ProfileService";
import { z } from "zod";
import { Position } from "@prisma/client";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(255).trim().optional(),
  lastName: z.string().min(1).max(255).trim().optional(),
  nickname: z.string().max(100).optional(),
  position: z.nativeEnum(Position).optional(),
  jerseyNumber: z.number().int().positive().optional().nullable(),
  dateOfBirth: z.string().optional().nullable(),
  address: z.string().max(500).optional().nullable(),
  phone: z.string().max(255).optional().nullable(),
  whatsapp: z.string().max(255).optional().nullable(),
  emergencyContact: z.string().max(255).optional().nullable(),
});

// GET /api/v1/profile
router.get(
  "/",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const result = await ProfileService.getProfile(userId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/profile
router.patch(
  "/",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const parsed = updateProfileSchema.parse(req.body);
      const result = await ProfileService.updateProfile(userId, parsed);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/v1/profile/photo
router.put(
  "/photo",
  authenticate,
  upload.single("photo"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const file = req.file;
      if (!file) {
        res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "No file provided" },
        });
        return;
      }
      const result = await ProfileService.updatePhoto(userId, {
        buffer: file.buffer,
        mimetype: file.mimetype,
        originalname: file.originalname,
        size: file.size,
      });
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/profile/jersey-availability
router.get(
  "/jersey-availability",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const exclude = req.query.exclude as string | undefined;
      const result = await ProfileService.getJerseyAvailability(exclude);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

export { router as profileRouter };
