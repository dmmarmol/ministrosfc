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
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";

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
  status: z.enum(ConfirmationStatus),
});

const gameIdSchema = z.object({ gameId: z.uuid() });
const gameParticipantParamsSchema = z.object({
  gameId: z.uuid(),
  participantId: z.uuid(),
});

const signupSchema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("self") }),
  z.object({
    mode: z.literal("guest"),
    firstName: z.string().min(1).max(255),
    lastName: z.string().min(1).max(255),
    position: z.string().max(10).optional().nullable(),
  }),
  z.object({
    mode: z.literal("proxy"),
    targetPlayerId: z.uuid("targetPlayerId must be a valid UUID"),
  }),
]);

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

// POST /api/v1/games/:gameId/participants/confirm - Player auth (legacy)
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

// POST /api/v1/games/:gameId/participants/signup - Player auth (T020)
router.post(
  "/signup",
  authenticate,
  requireRole("PLAYER"),
  validate(gameIdSchema, "params"),
  validate(signupSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = req.body;
      let result;
      try {
        result = await ParticipationService.signupParticipant(
          req.params.gameId!,
          req.user!.userId,
          dto,
        );
      } catch (err: any) {
        // Mode-aware P2002 mapping (unique constraint)
        if (err?.code === "P2002") {
          const mode: string = dto.mode ?? "self";
          if (mode === "proxy") {
            throw createError(
              "Player is already registered for this game by another user",
              409,
              ErrorCode.PROXY_CONFLICT,
            );
          } else {
            throw createError(
              "You are already signed up for this game",
              409,
              ErrorCode.SIGNUP_DUPLICATE,
            );
          }
        }
        throw err;
      }
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/games/:gameId/participants/:participantId - Admin/Editor (T021)
router.delete(
  "/:participantId",
  authenticate,
  requireRole("EDITOR"),
  validate(gameParticipantParamsSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await ParticipationService.removeParticipant(
        req.params.gameId!,
        req.params.participantId!,
        req.user!.userId,
        req.user!.role,
      );
      res.status(204).end();
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
  validate(z.object({ gameId: z.uuid(), playerId: z.uuid() }), "params"),
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
