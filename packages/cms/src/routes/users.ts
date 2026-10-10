import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { z } from "zod";
import type { ApiResponse } from "@ministrosfc/shared";
import { authenticate } from "../middleware/auth";
import { requireRole } from "../middleware/rbac";
import { UserService } from "../services/UserService";
import { UserApprovalService } from "../services/UserApprovalService";
import { Role } from "@prisma/client";

const router = Router();
export const orphanPlayersRouter = Router();

const VALID_ROLES = Object.values(Role);

const pendingApprovalsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  search: z.string().trim().optional(),
});

const reviewActionSchema = z.object({
  expectedUpdatedAt: z.string().datetime().optional(),
});

const approveMergeSchema = reviewActionSchema.extend({
  mergePlayerId: z.string().min(1).trim(),
});

const denySchema = reviewActionSchema.extend({
  reason: z.string().min(1),
});

const orphanPlayersQuerySchema = z.object({
  search: z.string().trim().optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

const postApprovalMergeSchema = z.object({
  mergePlayerId: z.string().min(1).trim(),
  expectedUpdatedAt: z.string().datetime().optional(),
});

// GET /api/v1/admin/users — paginated list (EDITOR+)
router.get(
  "/",
  authenticate,
  requireRole("EDITOR"),
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

router.get(
  "/pending-approvals",
  authenticate,
  requireRole("EDITOR"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = pendingApprovalsQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
          statusCode: 400,
        });
        return;
      }

      const result = await UserApprovalService.getPendingApprovals(parsed.data);
      const wrapped: ApiResponse<typeof result.data> = {
        data: result.data,
        meta: result.meta,
      };
      res.json({ data: wrapped });
    } catch (err) {
      next(err);
    }
  },
);

async function handleListOrphanPlayersGlobal(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const parsed = orphanPlayersQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      res.status(400).json({
        code: "VALIDATION_ERROR",
        message: parsed.error.issues.map((i) => i.message).join(", "),
        statusCode: 400,
      });
      return;
    }

    const result = await UserApprovalService.listOrphanPlayersGlobal(parsed.data);
    const wrapped: ApiResponse<typeof result.data> = {
      data: result.data,
      meta: result.meta,
    };
    res.json({ data: wrapped });
  } catch (err) {
    next(err);
  }
}

orphanPlayersRouter.get("/", authenticate, requireRole("EDITOR"), handleListOrphanPlayersGlobal);

router.get(
  "/orphan-players",
  authenticate,
  requireRole("EDITOR"),
  handleListOrphanPlayersGlobal,
);

router.get(
  "/pending-approvals/:userId/orphan-players",
  authenticate,
  requireRole("EDITOR"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = orphanPlayersQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
          statusCode: 400,
        });
        return;
      }

      const result = await UserApprovalService.listOrphanPlayers(
        req.params.userId!,
        parsed.data,
      );
      const wrapped: ApiResponse<typeof result.data> = {
        data: result.data,
        meta: result.meta,
      };
      res.json({ data: wrapped });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/pending-approvals/:userId/approve",
  authenticate,
  requireRole("EDITOR"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = reviewActionSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
          statusCode: 400,
        });
        return;
      }

      const data = await UserApprovalService.approveWithoutMerge(
        req.params.userId!,
        req.user!.userId,
        parsed.data.expectedUpdatedAt,
      );
      const response: ApiResponse<typeof data> = { data };

      res.json({ data: response.data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/pending-approvals/:userId/approve-merge",
  authenticate,
  requireRole("EDITOR"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = approveMergeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
          statusCode: 400,
        });
        return;
      }

      const data = await UserApprovalService.approveWithMerge(
        req.params.userId!,
        parsed.data.mergePlayerId,
        req.user!.userId,
        parsed.data.expectedUpdatedAt,
      );
      const response: ApiResponse<typeof data> = { data };

      res.json({ data: response.data });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/pending-approvals/:userId/deny",
  authenticate,
  requireRole("EDITOR"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = denySchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
          statusCode: 400,
        });
        return;
      }

      const result = await UserApprovalService.deny(
        req.params.userId!,
        req.user!.userId,
        parsed.data.reason,
        parsed.data.expectedUpdatedAt,
      );

      res.status(200).json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

router.post(
  "/:userId/merge-player",
  authenticate,
  requireRole("EDITOR"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = postApprovalMergeSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
          statusCode: 400,
        });
        return;
      }

      const data = await UserApprovalService.mergeApprovedUser(
        req.params.userId!,
        parsed.data.mergePlayerId,
        req.user!.userId,
        parsed.data.expectedUpdatedAt,
      );

      res.json({ data });
    } catch (err) {
      next(err);
    }
  },
);

router.get(
  "/:id",
  authenticate,
  requireRole("EDITOR"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const user = await UserService.getUserById(req.params.id!);
      res.json({ data: user });
    } catch (err) {
      next(err);
    }
  },
);

export const adminUserProfileSchema = z
  .object({
    email: z.email().optional(),
    firstName: z.string().trim().min(1).max(120).optional(),
    lastName: z.string().trim().min(1).max(120).optional(),
    password: z.string().min(8).max(128).optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    /** @TODO translate to spanish */
    message: "At least one field must be provided",
  });

export const adminUserRoleChangeSchema = z.object({
  role: z.enum(VALID_ROLES as [string, ...string[]]),
});

export const adminUserPlayerStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE"]),
});

router.patch(
  "/:id",
  authenticate,
  requireRole("EDITOR"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = adminUserProfileSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({
          code: "VALIDATION_ERROR",
          message: parsed.error.issues.map((i) => i.message).join(", "),
          statusCode: 400,
        });
        return;
      }

      const updated = await UserService.updateAdminUserProfile(
        req.params.id!,
        parsed.data,
        req.body.expectedUpdatedAt,
      );
      res.json({ data: updated });
    } catch (err) {
      next(err);
    }
  },
);

export { router as usersRouter };
