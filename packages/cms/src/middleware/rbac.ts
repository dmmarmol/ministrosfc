import { type Request, type Response, type NextFunction } from "express";
import { ErrorCode } from "../utils/error-codes";

type Role = "ADMIN" | "EDITOR" | "PLAYER";

const ROLE_HIERARCHY: Record<Role, number> = {
  ADMIN: 3,
  EDITOR: 2,
  PLAYER: 1,
};

export function requireRole(minimumRole: Role) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        code: ErrorCode.UNAUTHORIZED,
        message: "Authentication required",
        statusCode: 401,
      });
      return;
    }

    const userLevel = ROLE_HIERARCHY[req.user.role] ?? 0;
    const requiredLevel = ROLE_HIERARCHY[minimumRole];

    if (userLevel < requiredLevel) {
      res.status(403).json({
        code: ErrorCode.FORBIDDEN,
        message: "Insufficient permissions",
        statusCode: 403,
      });
      return;
    }

    next();
  };
}
