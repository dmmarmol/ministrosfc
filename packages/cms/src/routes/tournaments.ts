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
import { TournamentService } from "../services/TournamentService";
import { z } from "zod";
import { CompetitionType } from "@prisma/client";

const router = Router();

const tournamentCreateSchema = z.object({
  name: z.string().min(1).max(255),
  competitionType: z.enum(CompetitionType),
  description: z.string().max(2000).optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
});

const tournamentUpdateSchema = tournamentCreateSchema.partial();

const tournamentFilterSchema = paginationSchema.extend({
  competitionType: z.enum(CompetitionType).optional(),
});

// GET /api/v1/tournaments - Public
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = tournamentFilterSchema.parse(req.query);
    const result = await TournamentService.listTournaments(query);
    res.setHeader("Cache-Control", "public, max-age=300");
    res.json({
      data: result.tournaments,
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

// GET /api/v1/tournaments/:id - Public (includes Ministros FC record)
router.get(
  "/:id",
  validate(uuidSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [tournament, record] = await Promise.all([
        TournamentService.getTournamentById(req.params.id!),
        TournamentService.getMinistrosRecord(req.params.id!),
      ]);
      res.json({ data: { ...tournament, ministrosRecord: record } });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/tournaments - Admin only
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(tournamentCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tournament = await TournamentService.createTournament(req.body);
      res.status(201).json({ data: tournament });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/tournaments/:id - Admin or Editor
router.patch(
  "/:id",
  authenticate,
  requireRole("EDITOR"),
  validate(uuidSchema, "params"),
  validate(tournamentUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const tournament = await TournamentService.updateTournament(
        req.params.id!,
        req.body,
      );
      res.json({ data: tournament });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/tournaments/:id - Admin only
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(uuidSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await TournamentService.deleteTournament(req.params.id!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export { router as tournamentRouter };
