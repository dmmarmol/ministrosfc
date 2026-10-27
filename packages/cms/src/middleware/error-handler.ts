import { type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";
import { ErrorCode } from "../utils/error-codes";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

export function globalErrorHandler(
  err: AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  if (err instanceof ZodError) {
    res.status(400).json({
      code: ErrorCode.VALIDATION_ERROR,
      message: err.issues.map((issue) => issue.message).join(", "),
      statusCode: 400,
    });
    return;
  }

  const statusCode = err.statusCode ?? 500;
  const isProduction = process.env.NODE_ENV === "production";

  logger.error(
    {
      err: isProduction ? { message: err.message, code: err.code } : err,
      req: { method: req.method, url: req.url },
    },
    "Request error",
  );

  res.status(statusCode).json({
    code: err.code ?? ErrorCode.INTERNAL_ERROR,
    message:
      statusCode === 500 && isProduction
        ? "Internal server error"
        : err.message,
    statusCode,
  });
}

export function createError(
  message: string,
  statusCode: number,
  code: string,
): AppError {
  const err: AppError = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}
