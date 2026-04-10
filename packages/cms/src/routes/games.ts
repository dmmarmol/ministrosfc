import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { authenticate, optionalAuthenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import {
  validate,
  uuidSchema,
  paginationSchema,
} from "../middleware/validation";
import { GameService } from "../services/GameService";
import { ParticipationService } from "../services/ParticipationService";
import { GameModel } from "../models/Game";
import { prisma } from "../config/database";
import { z } from "zod";
import { GameStatus } from "@prisma/client";
import { createError } from "../middleware/error-handler";
import { ErrorCode } from "../utils/error-codes";
import { FORMATIONS, type GameSignupState } from "@ministrosfc/shared";

const router = Router();

const FORMATIONS_ENUM = FORMATIONS as readonly string[];

const gameCreateSchema = z
  .object({
    date: z.string().datetime({
      offset: true,
      message:
        'date must be a valid ISO 8601 datetime with timezone offset, e.g. "2026-03-28T14:00:00-03:00"',
    }),
    location: z
      .string()
      .max(500, "Location must be 500 characters or less")
      .optional(),
    notes: z
      .string()
      .max(2000, "Notes must be 2000 characters or less")
      .optional(),
    opponentTeamId: z.uuid("opponentTeamId must be a valid UUID"),
    tournamentId: z.string().min(1).optional(),
    competitionType: z
      .enum(["FRIENDLY", "LEAGUE", "CUP", "PLAYOFF", "SEASON"], {
        message:
          "competitionType must be one of: FRIENDLY, LEAGUE, CUP, PLAYOFF, SEASON",
      })
      .optional(),
    playgroundId: z
      .string()
      .uuid("playgroundId must be a valid UUID")
      .optional()
      .nullable(),
    maxPlayers: z.coerce.number().int().min(1).optional().nullable(),
    lineup: z
      .string()
      .refine((v) => FORMATIONS_ENUM.includes(v), {
        message: "Invalid formation code",
      })
      .optional()
      .default("4-4-2"),
    // Strip server-generated fields silently
    endDate: z.any().optional(),
    slug: z.any().optional(),
  })
  .transform((v) => {
    const { endDate: _e, slug: _s, ...rest } = v;
    return rest;
  });

const gameUpdateSchema = z
  .object({
    date: z
      .string()
      .datetime({
        offset: true,
        message:
          'date must be a valid ISO 8601 datetime with timezone offset, e.g. "2026-03-28T14:00:00-03:00"',
      })
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
    tournamentId: z.string().min(1).optional(),
    competitionType: z
      .enum(["FRIENDLY", "LEAGUE", "CUP", "PLAYOFF", "SEASON"], {
        message:
          "competitionType must be one of: FRIENDLY, LEAGUE, CUP, PLAYOFF, SEASON",
      })
      .optional(),
    status: z.enum(GameStatus).optional(),
    homeTeamScore: z.coerce.number().int().min(0).optional(),
    awayTeamScore: z.coerce.number().int().min(0).optional(),
    playgroundId: z
      .string()
      .uuid("playgroundId must be a valid UUID")
      .optional()
      .nullable(),
    maxPlayers: z.coerce.number().int().min(1).optional().nullable(),
    lineup: z
      .string()
      .refine((v) => FORMATIONS_ENUM.includes(v), {
        message: "Invalid formation code",
      })
      .optional(),
    // Strip server-generated fields silently
    endDate: z.any().optional(),
    slug: z.any().optional(),
  })
  .transform((v) => {
    const { endDate: _e, slug: _s, ...rest } = v;
    return rest;
  });

const gameFilterSchema = paginationSchema.extend({
  status: z.enum(GameStatus).optional(),
  tournamentId: z.string().optional(),
  opponentTeamId: z.uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
});

/** Helper: assert game is mutable by non-ADMIN roles. Throws if not. */
async function assertNonAdminMutationAllowed(
  gameId: string,
  role: string,
  mutationType: "any" | "lineup" | "participants" = "any",
) {
  if (role === "ADMIN") return; // ADMIN bypasses all status guards

  const game = await GameModel.findById(gameId);
  if (!game) throw createError("Game not found", 404, ErrorCode.GAME_NOT_FOUND);

  if (game.status === GameStatus.IN_PROGRESS) {
    throw createError(
      "Non-admin users cannot modify games that are in progress",
      403,
      ErrorCode.FORBIDDEN,
    );
  }

  if (game.status === GameStatus.COMPLETED) {
    if (
      mutationType === "lineup" ||
      mutationType === "participants" ||
      mutationType === "any"
    ) {
      throw createError(
        "Non-admin users cannot modify lineup or participants of completed games",
        403,
        ErrorCode.FORBIDDEN,
      );
    }
  }

  return game;
}

// GET /api/v1/games - Public (optionally authenticated for PLAYER currentPlayerStatus)
router.get(
  "/",
  optionalAuthenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const query = gameFilterSchema.parse(req.query);
      const result = await GameService.searchGames(query);
      // Map _count.participants → confirmedCount (T043)
      const games = result.results.map((g: any) => {
        const { _count, ...rest } = g;
        return { ...rest, confirmedCount: _count?.participants ?? 0 };
      });

      // T048: PLAYER-specific currentPlayerStatus — skip cache for authenticated players
      if (req.user?.role === "PLAYER") {
        const gameIds = games.map((g: any) => g.id as string);
        const [userRecord, participantRows] = await Promise.all([
          prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { playerId: true },
          }),
          prisma.gameParticipant.findMany({
            where: {
              gameId: { in: gameIds },
              confirmationStatus: "CONFIRMED",
            },
            select: { gameId: true, playerId: true },
          }),
        ]);

        const signedUpGameIds = new Set(
          participantRows
            .filter((p) => p.playerId === userRecord?.playerId)
            .map((p) => p.gameId),
        );

        const gamesWithStatus = games.map((g: any) => {
          let currentPlayerStatus: GameSignupState | null = null;
          if (g.status === GameStatus.SCHEDULED) {
            if (signedUpGameIds.has(g.id)) {
              currentPlayerStatus = "signed_up";
            } else if (
              g.maxPlayers !== null &&
              g.confirmedCount >= g.maxPlayers
            ) {
              currentPlayerStatus = "full";
            } else {
              currentPlayerStatus = "available";
            }
          }
          return { ...g, currentPlayerStatus };
        });

        return res.json({
          data: gamesWithStatus,
          meta: {
            total: result.total,
            page: result.page,
            limit: result.limit,
            totalPages: result.totalPages,
          },
        });
      }

      res.setHeader("Cache-Control", "public, max-age=300");
      res.json({
        data: games,
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

// GET /api/v1/games/slug/:slug - Public (must be before /:id)
router.get(
  "/slug/:slug",
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const game = await GameModel.findBySlug(req.params.slug!);
      if (!game)
        throw createError("Game not found", 404, ErrorCode.GAME_NOT_FOUND);
      res.json({ data: { id: game.id, slug: game.slug } });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/games/:id - Public (T044: redact guest lastName)
router.get(
  "/:id",
  validate(uuidSchema, "params"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const game = await GameService.getGameById(req.params.id!);
      // Redact guest lastName for public endpoint (FR-012)
      const serialized = serializeGamePublic(game);
      res.json({ data: serialized });
    } catch (err) {
      next(err);
    }
  },
);

// GET /api/v1/games/:gameId/signup-page - Authenticated (T018)
router.get(
  "/:gameId/signup-page",
  validate(z.object({ gameId: z.uuid() }), "params"),
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dto = await ParticipationService.getSignupPage(
        req.params.gameId!,
        req.user!.userId,
        req.user!.role,
      );
      res.json({ data: dto });
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

// PATCH /api/v1/games/:id - Admin, Editor, or DT (with field restrictions for non-admin roles)
router.patch(
  "/:id",
  authenticate,
  requireRole("DT"),
  validate(uuidSchema, "params"),
  validate(gameUpdateSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = req.user!.role;
      // T017: status guards for non-ADMIN
      const hasLineupChange = "lineup" in req.body;
      const mutationType = hasLineupChange ? "lineup" : "any";
      await assertNonAdminMutationAllowed(req.params.id!, role, mutationType);

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

/** Serialize a game for public consumption — redacts guest lastName (T044). */
function serializeGamePublic(game: any): any {
  if (!game || !game.participants) return game;
  return {
    ...game,
    participants: game.participants.map((p: any) => {
      /** @TODO Define enum in shared package and use it here instead of string literal */
      if (p.player?.playerType === "GUEST") {
        return {
          ...p,
          player: { ...p.player, lastName: null },
        };
      }
      return p;
    }),
  };
}

export { router as gameRouter, assertNonAdminMutationAllowed };
