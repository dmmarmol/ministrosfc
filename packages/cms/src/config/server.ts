import express, { type Application } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { pinoHttp } from "pino-http";
import { logger } from "../utils/logger";
import {
  authLimiter,
  registerLimiter,
  apiLimiter,
} from "../middleware/rate-limiter";
import { globalErrorHandler } from "../middleware/error-handler";
import { healthRouter } from "../routes/health";
import { playerRouter } from "../routes/players";
import { teamRouter } from "../routes/teams";
import { gameRouter } from "../routes/games";
import { tournamentRouter } from "../routes/tournaments";
import { statisticsRouter } from "../routes/statistics";
import { authRouter } from "../routes/auth";
import { participantRouter } from "../routes/participants";
import { profileRouter } from "../routes/profile";
import { usersRouter } from "../routes/users";
import { onboardingRouter } from "../routes/onboarding";
import { playgroundRouter } from "../routes/playgrounds";
import { addressRouter } from "../routes/address";
import { importRouter } from "../routes/import";

export function createApp(): Application {
  const app = express();
  const isTest =
    process.env.NODE_ENV === "test" || process.env.JEST_WORKER_ID != null;

  // Trust proxy for rate limiting behind reverse proxy
  app.set("trust proxy", 1);

  // Parse CORS origins from env (comma-separated list).
  // Supports multiple origins — add extra dev hostnames in .env.local, e.g.:
  //   CORS_ORIGINS=http://localhost:5103,http://localhost.ministrosfc.com:5103
  const corsOrigins = (process.env.CORS_ORIGINS ?? "http://localhost:5103")
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);

  app.use(
    cors({
      origin: corsOrigins,
      credentials: true,
      methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
    }),
  );

  // HTTP request logging
  if (!isTest) {
    app.use(pinoHttp({ logger }));
  }

  // Body parsing
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());

  // Rate limiting
  app.use("/api/v1/auth/login", authLimiter);
  app.use("/api/v1/auth/register", registerLimiter);
  app.use("/api", apiLimiter);

  // Routes
  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/players", playerRouter);
  app.use("/api/v1/teams", teamRouter);
  app.use("/api/v1/games", gameRouter);
  app.use("/api/v1/games/:gameId/participants", participantRouter);
  app.use("/api/v1/tournaments", tournamentRouter);
  app.use("/api/v1/statistics", statisticsRouter);
  app.use("/api/v1/profile", profileRouter);
  app.use("/api/v1/admin/users", usersRouter);
  app.use("/api/v1/onboarding", onboardingRouter);
  app.use("/api/v1/playgrounds", playgroundRouter);
  app.use("/api/v1/address", addressRouter);
  app.use("/api/v1/import", importRouter);

  // Global error handler (must be last)
  app.use(globalErrorHandler);

  return app;
}

export const API_PORT = parseInt(process.env.API_PORT ?? "5102", 10);
