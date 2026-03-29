import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { UserService } from "../services/UserService";
import { Role } from "@prisma/client";

const router = Router();

const VALID_ROLES = Object.values(Role);

// GET /api/v1/admin/users — paginated list (ADMIN only)
router.get(
  "/",
  authenticate,
  requireRole("ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const page = Math.max(parseInt(req.query.page as string, 10) || 1, 1);
      const limit = parseInt(req.query.limit as string, 10) || 20;
      const role = VALID_ROLES.includes(req.query.role as Role)
        ? (req.query.role as Role)
        : undefined;
      const search = (req.query.search as string) || undefined;

      const result = await UserService.listUsersAdmin({
        page,
        limit,
        role,
        search,
      });
      res.json(result);
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/admin/users/:id/role — promote/demote (ADMIN only)
const changeRoleSchema = z.object({
  role: z.enum(VALID_ROLES as [string, ...string[]]),
});

router.patch(
  "/:id/role",
  authenticate,
  requireRole("ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = changeRoleSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
          statusCode: 400,
        });
        return;
      }
      const result = await UserService.changeRole(
        req.user!.userId,
        req.params.id!,
        parsed.data.role as Role,
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// PATCH /api/v1/admin/users/:id/player-status — activate/deactivate (EDITOR+)
const playerStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

router.patch(
  "/:id/player-status",
  authenticate,
  requireRole("EDITOR"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = playerStatusSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
          statusCode: 400,
        });
        return;
      }
      const player = await UserService.updatePlayerStatus(
        req.params.id!,
        parsed.data.status,
      );
      // Return the user + player data
      const user = await UserService.getUserById(req.params.id!);
      res.json({
        data: {
          ...user,
          player: { id: player.id, status: player.status },
        },
      });
    } catch (err) {
      next(err);
    }
  },
);

// DELETE /api/v1/admin/users/:id/player — hard-delete player (ADMIN only)
router.delete(
  "/:id/player",
  authenticate,
  requireRole("ADMIN"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await UserService.deletePlayer(req.params.id!);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export { router as usersRouter };
