import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import multer from "multer";
import { authenticate, optionalAuthenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
  validate,
  uuidSchema,
  paginationSchema,
} from "../middleware/validation";
import { PlayerService } from "../services/PlayerService";
import { z } from "zod";
import { OPTION_FILTER_ALL } from "@ministrosfc/shared";
import { PlayerType, PlayerStatus } from "@prisma/client";
import { logger } from "../utils/logger";

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

const playerCreateSchema = z.object({
  firstName: z.string().min(1).max(255),
  lastName: z.string().min(1).max(255),
  nickname: z.string().max(100).optional(),
  playerType: z.enum(PlayerType).optional(),
  position: z
    .enum([
      "GK",
      "CB",
      "RB",
      "LB",
      "RWB",
      "LWB",
      "DMF",
      "CMF",
      "AMF",
      "RMF",
      "LMF",
      "SS",
      "CF",
      "RWF",
      "LWF",
    ])
    .optional(),
  jerseyNumber: z.coerce.number().int().min(1).max(99).optional(),
  dateOfBirth: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  height: z.coerce.number().int().min(100).max(250).optional(),
  dominantFoot: z.enum(["LEFT", "RIGHT", "AMBIDEXTROUS"]).optional(),
  nationalId: z.string().max(50).optional(),
  invitedById: z.uuid().optional(),
  "contact.phone": z.string().optional(),
  "contact.whatsapp": z.string().optional(),
  "contact.emergencyContact": z.string().optional(),
});

const playerUpdateSchema = playerCreateSchema.partial();

const playerStatusSchema = z.object({
  status: z.enum(PlayerStatus),
});

const playerExtendSchema = z.preprocess(
  (value) => {
    if (value === undefined) return [];
    return Array.isArray(value) ? value : [value];
  },
  z.array(z.enum(["invitedById", "invitedByName"])).default([]),
);

const playerFilterSchema = paginationSchema.extend({
  status: z
    .union([z.enum(PlayerStatus), z.literal(OPTION_FILTER_ALL)])
    .optional(),
  position: z.string().optional(),
  search: z.string().optional(),
  playerType: z.enum(PlayerType).optional(),
  extend: playerExtendSchema,
});

// GET /api/v1/players - Public
router.get(
  "/",
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = playerFilterSchema.parse(req.query);
      const { status, position, search, playerType, extend } = query;
      const hasExtend = extend.length > 0;

      if (hasExtend && !req.user) {
        res.status(401).json({
          code: "UNAUTHORIZED",
          message: "Authentication required when using extend",
          statusCode: 401,
        });
        return;
      }

      if (
        hasExtend &&
        req.user &&
        req.user.role !== "ADMIN" &&
        req.user.role !== "EDITOR"
      ) {
        res.status(403).json({
          code: "FORBIDDEN",
          message: "Insufficient permissions to use extend",
          statusCode: 403,
        });
        return;
      }

      const effectiveStatus =
        status === OPTION_FILTER_ALL ? null : (status ?? PlayerStatus.ACTIVE);

      const result = await PlayerService.searchPlayers({
        status: effectiveStatus,
        position,
        search,
        playerType,
        page: query.page,
        limit: query.limit,
        extend,
      });

      res.setHeader(
        "Cache-Control",
        hasExtend ? "private, no-store" : "public, max-age=300",
      );
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
  },
);

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

// PATCH /api/v1/players/:id/status - Editor or Admin (DT allowed for GUEST players)
router.patch(
  "/:id/status",
  authenticate,
  requireRole("DT"),
  validate(uuidSchema, "params"),
  validate(playerStatusSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.user!.role;
      const { status } = req.body as { status: PlayerStatus };

      // T045: DT can only set status on GUEST players
      if (role === "DT") {
        const target = await PlayerService.getPlayerById(req.params.id!);
        if (target.playerType !== "GUEST") {
          res.status(403).json({
            code: "FORBIDDEN",
            message: "DT role can only change status of guest players",
            statusCode: 403,
          });
          return;
        }
      }

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

// DELETE /api/v1/players/:id - Admin only
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(uuidSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await PlayerService.deletePlayer(req.params.id!);
      logger.info(
        { playerId: req.params.id, adminId: req.user?.userId },
        "Player deleted",
      );
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  },
);

export { router as playerRouter };
