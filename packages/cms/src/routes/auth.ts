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
import { OAuth2Client } from "google-auth-library";
import { authConfig } from "../config/auth";
import crypto from "crypto";

const router = Router();

const oauthClient = new OAuth2Client(
  authConfig.googleClientId,
  authConfig.googleClientSecret,
  authConfig.googleRedirectUri,
);

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
    isPlayer: z.boolean().optional().default(true),
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

const FRONTEND_ORIGIN = process.env.FRONTEND_URL ?? "http://localhost:5103";

// GET /api/v1/auth/google — initiate Google OAuth flow
router.get("/google", (_req: Request, res: Response) => {
  const state = crypto.randomBytes(32).toString("hex");

  res.cookie("google_oauth_state", state, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 5 * 60 * 1000, // 5 minutes
    secure: process.env.NODE_ENV === "production",
  });

  const url = oauthClient.generateAuthUrl({
    access_type: "offline",
    scope: ["openid", "email", "profile"],
    prompt: "select_account",
    state,
  });

  res.redirect(url);
});

// GET /api/v1/auth/google/callback — handle Google OAuth callback
router.get("/google/callback", async (req: Request, res: Response) => {
  const {
    code,
    state,
    error: oauthError,
  } = req.query as {
    code?: string;
    state?: string;
    error?: string;
  };

  // User cancelled consent
  if (oauthError === "access_denied") {
    return res.redirect(`${FRONTEND_ORIGIN}/login?error=google_cancelled`);
  }

  // CSRF validation
  const storedState = (req as any).cookies?.google_oauth_state;
  if (!state || !storedState || state !== storedState) {
    return res.redirect(`${FRONTEND_ORIGIN}/login?error=csrf_mismatch`);
  }

  // Clear state cookie
  res.clearCookie("google_oauth_state");

  try {
    // Exchange code for tokens
    const { tokens } = await oauthClient.getToken(code as string);
    const ticket = await oauthClient.verifyIdToken({
      idToken: tokens.id_token!,
      audience: authConfig.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload || !payload.email) {
      return res.redirect(`${FRONTEND_ORIGIN}/login?error=google_failed`);
    }

    const result = await AuthService.googleAuth({
      sub: payload.sub!,
      email: payload.email,
      given_name: payload.given_name ?? "",
      family_name: payload.family_name ?? "",
    });

    res.redirect(
      `${FRONTEND_ORIGIN}/auth/google/callback?token=${result.accessToken}&refresh=${result.refreshToken}`,
    );
  } catch {
    res.redirect(`${FRONTEND_ORIGIN}/login?error=google_failed`);
  }
});

export { router as authRouter };
