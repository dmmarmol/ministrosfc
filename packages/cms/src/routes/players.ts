import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
  validate,
  uuidSchema,
  paginationSchema,
} from "../middleware/validation";
import { PlayerService } from "../services/PlayerService";
import { z } from "zod";
import { PlayerType, PlayerStatus } from "@prisma/client";
import { logger } from "../utils/logger";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const playerCreateSchema = z.object({
  name: z.string().min(1).max(255),
  nickname: z.string().max(100).optional(),
  playerType: z.nativeEnum(PlayerType).optional(),
  position: z
    .enum(["GK","CB","RB","LB","RWB","LWB","DMF","CMF","AMF","RMF","LMF","SS","CF","RWF","LWF"])
    .optional(),
  jerseyNumber: z.coerce.number().int().min(1).max(99).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  height: z.coerce.number().int().min(100).max(250).optional(),
  dominantFoot: z.enum(["LEFT", "RIGHT", "AMBIDEXTROUS"]).optional(),
  nationalId: z.string().max(50).optional(),
  invitedById: z.string().uuid().optional(),
  "contact.phone": z.string().optional(),
  "contact.whatsapp": z.string().optional(),
  "contact.emergencyContact": z.string().optional(),
});

const playerUpdateSchema = playerCreateSchema.partial();

const playerStatusSchema = z.object({
  status: z.nativeEnum(PlayerStatus),
});

const playerFilterSchema = paginationSchema.extend({
  status: z.nativeEnum(PlayerStatus).optional(),
  position: z.string().optional(),
  search: z.string().optional(),
  playerType: z.nativeEnum(PlayerType).optional(),
});

// GET /api/v1/players - Public
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = playerFilterSchema.parse(req.query);
    const { status, position, search, playerType } = query;

    const result = await PlayerService.searchPlayers({
      status: status ?? PlayerStatus.ACTIVE,
      position,
      search,
      playerType,
      page: query.page,
      limit: query.limit,
    });

    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({
      data: result.players,
      meta: {
        total: result.total,
        page: result.page,
        limit: result.limit,
        totalPages: result.totalPages,
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/v1/players/:id - Public
router.get(
  "/:id",
  validate(uuidSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const player = await PlayerService.getPlayerById(req.params.id!);
      res.setHeader("Cache-Control", "public, max-age=300");
      res.json({ data: player });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/players - Admin only
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  upload.single("photo"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = playerCreateSchema.parse(req.body);
      const photoFile = req.file
        ? {
            buffer: req.file.buffer,
            mimetype: req.file.mimetype,
            originalname: req.file.originalname,
            size: req.file.size,
          }
        : undefined;

      const player = await PlayerService.createPlayer(dto, photoFile);
      logger.info({ playerId: player.id }, "Player created");
      res.status(201).json({ data: player });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/players/:id - Admin only
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(uuidSchema, "params"),
  upload.single("photo"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = playerUpdateSchema.parse(req.body);
      const photoFile = req.file
        ? {
            buffer: req.file.buffer,
            mimetype: req.file.mimetype,
            originalname: req.file.originalname,
            size: req.file.size,
          }
        : undefined;

      const player = await PlayerService.updatePlayer(
        req.params.id!,
        dto,
        photoFile,
      );
      res.json({ data: player });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/players/:id/status - Admin only
router.patch(
  "/:id/status",
  authenticate,
  requireRole("ADMIN"),
  validate(uuidSchema, "params"),
  validate(playerStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { status } = req.body as { status: PlayerStatus };
      const player =
        status === PlayerStatus.INACTIVE
          ? await PlayerService.deactivatePlayer(req.params.id!)
          : await PlayerService.reactivatePlayer(req.params.id!);

      logger.info(
        { playerId: player.id, status, adminId: req.user?.userId },
        "Player status changed",
      );
      res.json({ data: player });
    } catch (err) {
      next(err);
    }
  },
);

export { router as playerRouter };
