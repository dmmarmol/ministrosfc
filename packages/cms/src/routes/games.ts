import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
  validate,
  uuidSchema,
  paginationSchema,
} from "../middleware/validation";
import { GameService } from "../services/GameService";
import { z } from "zod";
import { GameStatus } from "@prisma/client";

const router = Router();

const gameCreateSchema = z.object({
  date: z.string().datetime({ offset: true, message: 'date must be a valid ISO 8601 datetime with timezone offset, e.g. "2026-03-28T14:00:00-03:00"' }),
  location: z
    .string()
    .max(500, "Location must be 500 characters or less")
    .optional(),
  notes: z
    .string()
    .max(2000, "Notes must be 2000 characters or less")
    .optional(),
  opponentTeamId: z.string().uuid("opponentTeamId must be a valid UUID"),
  tournamentId: z.string().uuid("tournamentId must be a valid UUID").optional(),
  competitionType: z
    .enum(["FRIENDLY", "LEAGUE", "CUP", "PLAYOFF", "SEASON"], {
      message:
        "competitionType must be one of: FRIENDLY, LEAGUE, CUP, PLAYOFF, SEASON",
    })
    .optional(),
});

const gameUpdateSchema = z.object({
  date: z
    .string()
    .datetime({ offset: true, message: 'date must be a valid ISO 8601 datetime with timezone offset, e.g. "2026-03-28T14:00:00-03:00"' })
    .optional(),
  location: z
    .string()
    .max(500, "Location must be 500 characters or less")
    .optional(),
  notes: z
    .string()
    .max(2000, "Notes must be 2000 characters or less")
    .optional(),
  opponentTeamId: z
    .string()
    .uuid("opponentTeamId must be a valid UUID")
    .optional(),
  tournamentId: z.string().uuid("tournamentId must be a valid UUID").optional(),
  competitionType: z
    .enum(["FRIENDLY", "LEAGUE", "CUP", "PLAYOFF", "SEASON"], {
      message:
        "competitionType must be one of: FRIENDLY, LEAGUE, CUP, PLAYOFF, SEASON",
    })
    .optional(),
  status: z.nativeEnum(GameStatus).optional(),
  homeTeamScore: z.coerce.number().int().min(0).optional(),
  awayTeamScore: z.coerce.number().int().min(0).optional(),
});

const gameFilterSchema = paginationSchema.extend({
  status: z.nativeEnum(GameStatus).optional(),
  tournamentId: z.string().uuid().optional(),
  opponentTeamId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

// GET /api/v1/games - Public
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = gameFilterSchema.parse(req.query);
    const result = await GameService.searchGames(query);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({
      data: result.games,
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

// GET /api/v1/games/:id - Public
router.get(
  "/:id",
  validate(uuidSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const game = await GameService.getGameById(req.params.id!);
      res.json({ data: game });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/games - Admin or Editor
router.post(
  "/",
  authenticate,
  requireRole("EDITOR"),
  validate(gameCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const game = await GameService.createGame(req.body);
      res.status(201).json({ data: game });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/games/:id - Admin or Editor (with field restrictions for Editor)
router.patch(
  "/:id",
  authenticate,
  requireRole("EDITOR"),
  validate(uuidSchema, "params"),
  validate(gameUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.user!.role;
      const game = await GameService.updateGame(req.params.id!, req.body, role);
      res.json({ data: game });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/games/:id - Admin only
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(uuidSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await GameService.deleteGame(req.params.id!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export { router as gameRouter };
