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
import { Position, PlayerStatus } from "@ministrosfc/shared";
import { prisma } from "../config/database";

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
  status: z.nativeEnum(PlayerStatus).optional(),
});

// GET /api/v1/profile — user-only profile (no player required)
router.get(
  "/",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const result = await ProfileService.getUserProfile(userId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/profile/player — full player profile (requires player link)
router.get(
  "/player",
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

// PATCH /api/v1/profile/player — update player profile
router.patch(
  "/player",
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

// PATCH /api/v1/profile — update user-only info
router.patch(
  "/",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.userId;
      const updateSchema = z.object({
        firstName: z.string().min(1).max(255).trim().optional(),
        lastName: z.string().min(1).max(255).trim().optional(),
      });
      const parsed = updateSchema.parse(req.body);

      if (Object.keys(parsed).length === 0) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: "No fields to update",
          statusCode: 400,
        });
        return;
      }

      const updated = await prisma.user.update({
        where: { id: userId },
        data: parsed,
      });

      res.json({
        data: {
          user: {
            id: updated.id,
            email: updated.email,
            firstName: updated.firstName,
            lastName: updated.lastName,
            role: updated.role,
            hasPassword: updated.passwordHash != null,
            hasGoogle: updated.googleSubjectId != null,
            playerId: updated.playerId,
            createdAt: updated.createdAt,
          },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// PUT /api/v1/profile/player/photo — upload player photo
router.put(
  "/player/photo",
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

// GET /api/v1/profile/player/jersey-availability — check available jersey numbers
router.get(
  "/player/jersey-availability",
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
