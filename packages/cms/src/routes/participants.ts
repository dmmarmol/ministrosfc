import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { validate } from "../middleware/validation";
import { ParticipationService } from "../services/ParticipationService";
import { z } from "zod";
import { ConfirmationStatus } from "@prisma/client";

// This router is mounted at /api/v1/games/:gameId/participants
// Express mergeParams needed to access :gameId
const router = Router({ mergeParams: true });

const confirmSchema = z.object({
  friends: z
    .array(z.object({ name: z.string().min(1).max(255) }))
    .max(10)
    .optional(),
});

const statusUpdateSchema = z.object({
  status: z.nativeEnum(ConfirmationStatus),
});

const gameIdSchema = z.object({ gameId: z.string().uuid() });

// GET /api/v1/games/:gameId/participants - Public
router.get(
  "/",
  validate(gameIdSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const participants = await ParticipationService.getParticipants(
        req.params.gameId!,
      );
      res.json({ data: participants });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/games/:gameId/participants/confirm - Player auth
router.post(
  "/confirm",
  authenticate,
  requireRole("PLAYER"),
  validate(gameIdSchema, "params"),
  validate(confirmSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await ParticipationService.confirmParticipation(
        req.params.gameId!,
        req.user!.userId,
        req.body,
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/games/:gameId/participants/:playerId/status - Admin or player (own status)
router.patch(
  "/:playerId/status",
  authenticate,
  requireRole("PLAYER"),
  validate(z.object({ gameId: z.string().uuid(), playerId: z.string().uuid() }), "params"),
  validate(statusUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { gameId, playerId } = req.params as {
        gameId: string;
        playerId: string;
      };
      const { status } = req.body as { status: ConfirmationStatus };
      const result = await ParticipationService.updateParticipationStatus(
        gameId,
        playerId!,
        status,
        req.user!.userId,
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

export { router as participantRouter };
