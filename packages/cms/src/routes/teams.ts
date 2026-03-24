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
import { OpponentTeamService } from "../services/OpponentTeamService";
import { z } from "zod";

const router = Router();

const teamCreateSchema = z.object({
  name: z.string().min(1).max(255),
  shortName: z.string().max(10).optional(),
  logoUrl: z.string().url().optional(),
  primaryColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/)
    .optional(),
  notes: z.string().max(1000).optional(),
});

const teamUpdateSchema = teamCreateSchema.partial();

// GET /api/v1/teams - Public
router.get("/", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const query = paginationSchema.parse(req.query);
    const { search } = req.query as Record<string, string>;
    const result = await OpponentTeamService.searchTeams({
      search,
      page: query.page,
      limit: query.limit,
    });
    res.setHeader("Cache-Control", "public, max-age=600");
    res.json({
      data: result.teams,
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

// GET /api/v1/teams/:id - Public
router.get(
  "/:id",
  validate(uuidSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = await OpponentTeamService.getTeamById(req.params.id!);
      res.json({ data: team });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/teams - Admin only
router.post(
  "/",
  authenticate,
  requireRole("ADMIN"),
  validate(teamCreateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = await OpponentTeamService.createTeam(req.body);
      res.status(201).json({ data: team });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/teams/:id - Admin only
router.patch(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(uuidSchema, "params"),
  validate(teamUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const team = await OpponentTeamService.updateTeam(
        req.params.id!,
        req.body,
      );
      res.json({ data: team });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/teams/:id - Admin only
router.delete(
  "/:id",
  authenticate,
  requireRole("ADMIN"),
  validate(uuidSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await OpponentTeamService.deleteTeam(req.params.id!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export { router as teamRouter };
