import {
  Router,
  type Request,
  type Response,
  type NextFunction,
} from "express";
import { authenticate } from "../middleware/auth";
import { validate } from "../middleware/validation";
import { AuthService } from "../services/AuthService";
import { z } from "zod";
import { passwordSchema } from "@ministrosfc/shared";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const registerSchema = z
  .object({
    email: z.string().email("Email inválido").max(255),
    password: passwordSchema,
    passwordConfirmation: z.string(),
    firstName: z.string().min(1, "Requerido").max(255).trim(),
    lastName: z.string().min(1, "Requerido").max(255).trim(),
  })
  .refine((d) => d.password === d.passwordConfirmation, {
    message: "Las contraseñas no coinciden",
    path: ["passwordConfirmation"],
  });

const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

// POST /api/v1/auth/login
router.post(
  "/login",
  validate(loginSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email, password } = req.body as {
        email: string;
        password: string;
      };
      const result = await AuthService.login(email, password);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/auth/register
router.post(
  "/register",
  validate(registerSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await AuthService.register(req.body);
      res.status(201).json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/auth/refresh
router.post(
  "/refresh",
  validate(refreshSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body as { refreshToken: string };
      const result = await AuthService.refresh(refreshToken);
      res.json({ data: result });
    } catch (err) {
      next(err);
    }
  },
);

// POST /api/v1/auth/logout
router.post(
  "/logout",
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { refreshToken } = req.body as { refreshToken?: string };
      if (refreshToken) await AuthService.logout(refreshToken);
      res.status(204).end();
    } catch (err) {
      next(err);
    }
  },
);

export { router as authRouter };
