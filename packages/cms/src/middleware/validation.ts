import { type Request, type Response, NextFunction } from "express";
import { z, type ZodSchema } from "zod";
import { ErrorCode } from "../utils/error-codes";

type ValidationTarget = "body" | "params" | "query";

export function validate(schema: ZodSchema, target: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      // Only expose field-level details to authenticated users.
      // Unauthenticated callers receive a generic message to avoid
      // leaking schema information to potential attackers.
      const isAuthenticated = !!req.user;
      const body: Record<string, unknown> = {
        code: ErrorCode.VALIDATION_ERROR,
        message: "Validation failed",
        statusCode: 400,
      };
      if (isAuthenticated) {
        body.errors = result.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
      }
      res.status(400).json(body);
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
