import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { z } from "zod";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { OnboardingService } from "../services/OnboardingService";

const router = Router();

// GET /api/v1/onboarding/status
router.get(
  "/status",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await OnboardingService.getStatus(req.user!.userId);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

const VALID_POSITIONS = [
  "GK",
  "CB",
  "RB",
  "LB",
  "RWB",
  "LWB",
  "DMF",
  "CMF",
  "AMF",
  "RMF",
  "LMF",
  "SS",
  "CF",
  "RWF",
  "LWF",
] as const;

const completeSchema = z
  .object({
    isPlayer: z.boolean(),
    jerseyNumber: z.number().int().min(1).max(99).nullable().optional(),
    position: z.enum(VALID_POSITIONS).nullable().optional(),
  })
  .refine(
    (d) => {
      if (d.isPlayer) {
        return d.position != null;
      }
      return true;
    },
    {
      message: "La posición es requerida para jugadores",
      path: ["position"],
    },
  );

// POST /api/v1/onboarding/complete
router.post(
  "/complete",
  authenticate,
  validate(completeSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await OnboardingService.complete(
        req.user!.userId,
        req.body,
      );
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

export { router as onboardingRouter };
