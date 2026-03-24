import { type Request, type Response, NextFunction } from "express";
import { z, type ZodSchema } from "zod";
import { ErrorCode } from "../utils/error-codes";

type ValidationTarget = "body" | "params" | "query";

export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      res.status(400).json({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Validation failed",
        statusCode: 400,
        errors: result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      });
      return;
    }

    req[target] = result.data;
    next();
  };
}

// Common reusable schemas
export const uuidSchema = z.object({
  id: z.string().uuid("Invalid ID format"),
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});
