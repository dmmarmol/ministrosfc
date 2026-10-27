// Set NODE_ENV to production so pino uses plain JSON transport (not pino-pretty)
// This runs before ANY module is loaded in the test process
process.env.NODE_ENV = "production";

// Test DB / JWT settings (also set in setup.ts for afterEach hooks, but needed here for module-load time)
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL ||
  "postgresql://dev:dev123@localhost:5100/ministrosfc_test";
process.env.JWT_SECRET =
  "test-secret-key-at-least-64-chars-long-for-test-suite-only-do-not-use";
// Read REDIS_HOST/PORT from the environment first so CI values (6379) are respected.
// Fall back to local docker-compose ports (5101) when not provided.
process.env.REDIS_HOST = process.env.REDIS_HOST || "localhost";
process.env.REDIS_PORT = process.env.REDIS_PORT || "5101";
