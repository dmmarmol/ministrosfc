import "dotenv/config";
import { validateEnv } from "./config/env-validation";
import { createApp, API_PORT } from "./config/server";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { runGameStatusTransitions } from "./jobs/GameStatusTransitionJob";
import { recordGameStatusSync } from "./jobs/GameStatusSync";
import { logger } from "./utils/logger";

async function bootstrap(): Promise<void> {
  // Fail fast if any required env var is missing — surfaces config errors
  // immediately on startup rather than as cryptic runtime failures later.
  if (process.env.NODE_ENV !== "test") {
    validateEnv();
  }

  await connectDatabase();
  logger.info("Database connected");

  // Synchronize game statuses once at startup. There is deliberately no recurring timer:
  // later syncs run (throttled) when a request reads games, so an idle process never
  // queries the database and the scale-to-zero database can suspend.
  await runGameStatusTransitions();
  recordGameStatusSync();

  const app = createApp();

  // No explicit host argument — Express defaults to binding on all interfaces
  // (0.0.0.0), making the API reachable via localhost, 127.0.0.1, and any
  // hostname that resolves to the local machine (e.g. localhost.ministrosfc.com).
  const server = app.listen(API_PORT, () => {
    logger.info(
      { port: API_PORT },
      `Ministros FC API running on port ${API_PORT}`,
    );
  });

  const shutdown = async (signal: string): Promise<void> => {
    logger.info({ signal }, "Shutting down...");
    server.close(async () => {
      await disconnectDatabase();
      logger.info("Graceful shutdown complete");
      process.exit(0);
    });
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
