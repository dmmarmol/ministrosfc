import "dotenv/config";
import { createApp, API_PORT } from "./config/server";
import { connectDatabase, disconnectDatabase } from "./config/database";
import { logger } from "./utils/logger";

async function bootstrap(): Promise<void> {
  await connectDatabase();
  logger.info("Database connected");

  const app = createApp();

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
