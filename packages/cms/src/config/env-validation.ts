/**
 * Startup environment variable validation.
 *
 * Call `validateEnv()` before the application bootstraps to fail fast
 * with a clear, actionable error if the configuration is missing or invalid.
 * In test environments, this module is imported to validate the function
 * directly — it is called via `main.ts` only in non-test mode.
 *
 * Rules (see specs/022-first-production-release/contracts/runtime-endpoints.md):
 *  - DATABASE_URL, JWT_SECRET and CORS_ORIGINS are always required.
 *  - APP_ENV ("development" | "production") is required when NODE_ENV=production
 *    and defaults to "development" otherwise.
 *  - Redis: REDIS_URL is required when APP_ENV=production; elsewhere REDIS_URL or
 *    REDIS_HOST+REDIS_PORT, or REDIS_DISABLED=true (never allowed in production).
 *  - Photo storage (Cloudinary) is optional; if one variable is set, all three must be.
 *  - In production, CORS_ORIGINS must contain only HTTPS, non-localhost origins.
 */

const BASE_REQUIRED_ENV_VARS = ["DATABASE_URL", "JWT_SECRET", "CORS_ORIGINS"] as const;

const APP_ENVIRONMENTS = ["development", "production"] as const;

const PHOTO_STORAGE_ENV_VARS = [
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
] as const;

type Env = Record<string, string | undefined>;

function hasValue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().length > 0;
}

function isTrue(value: string | undefined): boolean {
  return typeof value === "string" && value.trim().toLowerCase() === "true";
}

function isLocalOrigin(origin: string): boolean {
  return /localhost|127\.0\.0\.1|\[::1\]/i.test(origin);
}

function validateProductionOrigins(corsOrigins: string | undefined): string[] {
  if (!hasValue(corsOrigins)) return [];
  const origins = corsOrigins!
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  const local = origins.filter(isLocalOrigin);
  const insecure = origins.filter(
    (origin) => !isLocalOrigin(origin) && !origin.startsWith("https://"),
  );

  const problems: string[] = [];
  if (local.length > 0) {
    problems.push(
      `CORS_ORIGINS must not contain localhost origins when APP_ENV=production (found: ${local.join(", ")})`,
    );
  }
  if (insecure.length > 0) {
    problems.push(
      `CORS_ORIGINS must use HTTPS origins when APP_ENV=production (found: ${insecure.join(", ")})`,
    );
  }
  return problems;
}

/**
 * Validates the environment and throws a single error listing every problem.
 *
 * @param env - The environment to check. Defaults to `process.env`.
 *              Pass an explicit object in tests to avoid mutating the process.
 */
export function validateEnv(env: Env = process.env): void {
  const missing: string[] = BASE_REQUIRED_ENV_VARS.filter((key) => !hasValue(env[key]));
  const invalid: string[] = [];

  // APP_ENV
  const rawAppEnv = env.APP_ENV?.trim();
  let appEnv: (typeof APP_ENVIRONMENTS)[number] = "development";
  if (!hasValue(rawAppEnv)) {
    if (env.NODE_ENV === "production") missing.push("APP_ENV");
  } else if ((APP_ENVIRONMENTS as readonly string[]).includes(rawAppEnv!)) {
    appEnv = rawAppEnv as (typeof APP_ENVIRONMENTS)[number];
  } else {
    invalid.push(`APP_ENV must be "development" or "production" (got "${rawAppEnv}")`);
  }
  const isProductionApp = appEnv === "production";

  // Redis
  const hasRedisUrl = hasValue(env.REDIS_URL);
  const hasRedisHostPort = hasValue(env.REDIS_HOST) && hasValue(env.REDIS_PORT);
  const redisDisabled = isTrue(env.REDIS_DISABLED);

  if (isProductionApp) {
    if (redisDisabled) {
      invalid.push("REDIS_DISABLED is not allowed when APP_ENV=production");
    }
    if (!hasRedisUrl) missing.push("REDIS_URL");
  } else if (!redisDisabled && !hasRedisUrl && !hasRedisHostPort) {
    missing.push("REDIS_URL or REDIS_HOST+REDIS_PORT (or REDIS_DISABLED=true)");
  }

  // Photo storage: optional, but all-or-none
  const photoVarsSet = PHOTO_STORAGE_ENV_VARS.filter((key) => hasValue(env[key]));
  if (photoVarsSet.length > 0 && photoVarsSet.length < PHOTO_STORAGE_ENV_VARS.length) {
    invalid.push(
      `Incomplete photo storage configuration: set all of ${PHOTO_STORAGE_ENV_VARS.join(", ")} or none`,
    );
  }

  // Production CORS origins
  if (isProductionApp) {
    invalid.push(...validateProductionOrigins(env.CORS_ORIGINS));
  }

  if (missing.length > 0 || invalid.length > 0) {
    const lines: string[] = [];
    if (missing.length > 0) {
      lines.push(`Missing required environment variables: ${missing.join(", ")}`);
    }
    for (const problem of invalid) lines.push(`Invalid environment configuration: ${problem}`);
    lines.push("See packages/cms/.env.example for the full list and expected formats.");
    throw new Error(lines.join("\n"));
  }
}
