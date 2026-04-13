import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { validate, uuidSchema } from "../middleware/validation";
import { StatisticsService } from "../services/StatisticsService";
import { z } from "zod";

const router = Router();

const topScorersSchema = z.object({
  tournamentId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

// GET /api/v1/statistics/players - All players aggregated
router.get(
  "/players",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { tournamentId } = req.query as Record<string, string>;
      const data = await StatisticsService.getTopScorers(tournamentId, 50);
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
      const { tournamentId } = req.query as Record<string, string>;
      const result = await StatisticsService.getPlayerStats(
        req.params.id!,
        tournamentId,
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

export { router as statisticsRouter };
