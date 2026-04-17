import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { validate, uuidSchema } from "../middleware/validation";
import { StatisticsService } from "../services/StatisticsService";
import { authenticate } from "../middleware/auth";
import { z } from "zod";

const router = Router();

const topScorersSchema = z.object({
  tournamentId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const teamStatsQuerySchema = z.object({
  year: z.coerce.number().int().min(1900).max(2100).optional(),
  tournamentId: z.uuid().optional(),
  tournamentName: z.string().max(100).optional(),
  rivalId: z.uuid().optional(),
});

// GET /api/v1/statistics/players - All players aggregated (public + extended)
router.get(
  "/players",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { year, rivalId, tournamentName } = req.query as Record<
        string,
        string
      >;
      const data = await StatisticsService.getAllPlayerStats({
        year: year ? parseInt(year, 10) : undefined,
        rivalId,
        tournamentName,
      });
      res.setHeader("Cache-Control", "public, max-age=300");
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/statistics/players/:id - Single player career stats
router.get(
  "/players/:id",
  validate(uuidSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tournamentId, year } = req.query as Record<string, string>;
      const result = await StatisticsService.getPlayerStats(
        req.params.id!,
        tournamentId,
        year ? parseInt(year, 10) : undefined,
      );
      res.setHeader("Cache-Control", "public, max-age=300");
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/statistics/top-scorers - Top scorers list
router.get(
  "/top-scorers",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = topScorersSchema.parse(req.query);
      const data = await StatisticsService.getTopScorers(
        query.tournamentId,
        query.limit,
      );
      res.setHeader("Cache-Control", "public, max-age=300");
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/statistics/tournaments/:id - Tournament stats + Ministros record
router.get(
  "/tournaments/:id",
  validate(uuidSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await StatisticsService.getTournamentStats(req.params.id!);
      res.setHeader("Cache-Control", "public, max-age=300");
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// ── Team stats endpoints (Feature 017) — all require auth ────────────────────

// GET /api/v1/statistics/years — global years range (public)
router.get(
  "/years",
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await StatisticsService.getGameYears();
      res.setHeader("Cache-Control", "public, max-age=300");
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/statistics/team/summary
router.get(
  "/team/summary",
  authenticate,
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await StatisticsService.getTeamSummary();
      res.setHeader("Cache-Control", "private, max-age=300");
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/statistics/team/by-year
router.get(
  "/team/by-year",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tournamentId, rivalId } = teamStatsQuerySchema.parse(req.query);
      const data = await StatisticsService.getTeamStatsByYear({
        tournamentId,
        rivalId,
      });
      res.setHeader("Cache-Control", "private, max-age=300");
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/statistics/team/by-tournament
router.get(
  "/team/by-tournament",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { year, rivalId, tournamentName } = teamStatsQuerySchema.parse(
        req.query,
      );
      const data = await StatisticsService.getTeamStatsByTournament({
        year,
        rivalId,
        tournamentName,
      });
      res.setHeader("Cache-Control", "private, max-age=300");
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/statistics/team/by-rival
router.get(
  "/team/by-rival",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { year, tournamentId, tournamentName, rivalId } =
        teamStatsQuerySchema.parse(req.query);
      const data = await StatisticsService.getTeamStatsByRival({
        year,
        tournamentId,
        tournamentName,
        rivalId,
      });
      res.setHeader("Cache-Control", "private, max-age=300");
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/statistics/team/rivals/:rivalId
router.get(
  "/team/rivals/:rivalId",
  authenticate,
  validate(z.object({ rivalId: z.uuid() }), "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { year } = teamStatsQuerySchema.parse(req.query);
      const data = await StatisticsService.getRivalStats(req.params.rivalId!, {
        year,
      });
      res.setHeader("Cache-Control", "private, max-age=300");
      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

export { router as statisticsRouter };
