import express, { type Application } from "express";
import cors from "cors";
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

export function createApp(): Application {
  const app = express();

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
  app.use(pinoHttp({ logger }));

  // Body parsing
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));

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

  // Global error handler (must be last)
  app.use(globalErrorHandler);

  return app;
}

export const API_PORT = parseInt(process.env.API_PORT ?? "5102", 10);
