import { Router, type Request, type Response, type NextFunction } from "express";
import { z } from "zod";
import { AddressSearchService } from "../services/AddressSearchService";
import { ErrorCode } from "../utils/error-codes";

const router = Router();

const addressSearchSchema = z.object({
  q: z.string().trim().min(3, { message: "QUERY_TOO_SHORT" }).max(200).optional(),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

// GET /api/v1/address/search — no auth required
router.get("/search", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const parsed = addressSearchSchema.safeParse(req.query);

    if (!parsed.success || parsed.data.q === undefined) {
      if (parsed.success) {
        // q was absent (undefined after optional)
        res.status(400).json({
          code: ErrorCode.VALIDATION_ERROR,
          message: "Validation failed",
          statusCode: 400,
          errors: [{ field: "q", message: "Required" }],
        });
        return;
      }

      const isQueryTooShort = parsed.error.issues.some(
        (i) => i.message === "QUERY_TOO_SHORT",
      );

      if (isQueryTooShort) {
        res.status(400).json({
          code: "QUERY_TOO_SHORT",
          message: "Query must be at least 3 characters",
          statusCode: 400,
        });
        return;
      }

      res.status(400).json({
        code: ErrorCode.VALIDATION_ERROR,
        message: "Validation failed",
        statusCode: 400,
        errors: parsed.error.issues.map((i) => ({
          field: i.path.join("."),
          message: i.message,
        })),
      });
      return;
    }

    const { q, limit } = parsed.data;
    const suggestions = await AddressSearchService.search(q, limit);
    res.json({ data: suggestions });
  } catch (err) {
    next(err);
  }
});

export { router as addressRouter };
