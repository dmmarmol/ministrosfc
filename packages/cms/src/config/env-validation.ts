/**
 * Startup environment variable validation.
 *
 * Call `validateEnv()` before the application bootstraps to fail fast
 * with a clear, actionable error if any required variable is absent.
 * In test environments, this module is imported to validate the function
 * directly — it is called via `main.ts` only in non-test mode.
 */

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "JWT_SECRET",
  "REDIS_URL",
  "CORS_ORIGINS",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

/**
 * Validates that all required environment variables are present and non-empty.
 *
 * @param env - The environment to check. Defaults to `process.env`.
 *              Pass an explicit object in tests to avoid mutating the process.
 * @throws {Error} If any required variable is missing or empty, listing all
 *                 missing variables in the message.
 */
export function validateEnv(
  env: Record<string, string | undefined> = process.env,
): void {
  const missing = REQUIRED_ENV_VARS.filter((key) => !env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(", ")}\n` +
        `See packages/cms/.env.example for the full list and expected formats.`,
    );
  }
}
