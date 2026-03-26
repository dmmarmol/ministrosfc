import { type Request, type Response, type NextFunction } from "express";
import jwt from "jsonwebtoken";
import { authConfig } from "../config/auth";
import { ErrorCode } from "../utils/error-codes";
import { type UserRole } from "@ministrosfc/shared";

export interface JwtPayload {
  userId: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    res.status(401).json({
      code: ErrorCode.UNAUTHORIZED,
      message: "Authorization token required",
      statusCode: 401,
    });
    return;
  }

  const accessToken = authHeader.slice(7);

  try {
    const payload = jwt.verify(accessToken, authConfig.jwtSecret) as JwtPayload;
    req.user = payload;
    next();
  } catch (err) {
    const isExpired = err instanceof jwt.TokenExpiredError;
    res.status(401).json({
      code: isExpired ? ErrorCode.TOKEN_EXPIRED : ErrorCode.UNAUTHORIZED,
      message: isExpired ? "Token expired" : "Invalid token",
      statusCode: 401,
    });
  }
}
