import "dotenv/config";
import { createApp, API_PORT } from "./config/server";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { runTransitions } from "./jobs/GameStatusTransitionJob";
import { logger } from "./utils/logger";

const JOB_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

async function bootstrap(): Promise<void> {
  await connectDatabase();
  logger.info("Database connected");

  // Run game status transitions on startup and every 5 minutes
  await runTransitions();
  const jobInterval = setInterval(runTransitions, JOB_INTERVAL_MS);

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
    clearInterval(jobInterval);
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
