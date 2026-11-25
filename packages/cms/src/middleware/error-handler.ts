import { type Request, type Response, type NextFunction } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";
import { ErrorCode } from "../utils/error-codes";
import { formatValidationIssue } from "./validation";

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
}

function getErrorMessage(err: AppError): string {
  if (err.name !== "MulterError") return err.message;

  switch (err.code) {
    case "LIMIT_FILE_SIZE":
      return "El archivo supera el tamaño máximo permitido.";
    case "LIMIT_FILE_COUNT":
      return "Se superó la cantidad máxima de archivos permitida.";
    case "LIMIT_UNEXPECTED_FILE":
      return "Se recibió un archivo en un campo no permitido.";
    case "LIMIT_PART_COUNT":
      return "El formulario supera la cantidad máxima de partes permitida.";
    case "LIMIT_FIELD_KEY":
      return "El nombre de un campo del formulario es demasiado largo.";
    case "LIMIT_FIELD_VALUE":
      return "El valor de un campo del formulario es demasiado largo.";
    case "LIMIT_FIELD_COUNT":
      return "Se superó la cantidad máxima de campos permitida.";
    default:
      return "No se pudo procesar el archivo enviado.";
  }
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
      message: err.issues.map(formatValidationIssue).join(", "),
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
      statusCode === 500 ? "Error interno del servidor." : getErrorMessage(err),
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
