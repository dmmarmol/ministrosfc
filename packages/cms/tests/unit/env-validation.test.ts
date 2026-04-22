/**
 * Unit tests for the env-validation module.
 *
 * These tests exercise the exported `validateEnv` function directly,
 * passing an explicit env object so process.env is never mutated.
 *
 * Written BEFORE the implementation (TDD — red phase).
 */
const { validateEnv } = require("../../src/config/env-validation");

const BASE_REQUIRED: Record<string, string> = {
  DATABASE_URL: "postgresql://dev:dev123@localhost:5432/ministrosfc_test",
  JWT_SECRET: "a-long-jwt-secret-value-for-testing-purposes-only",
  CORS_ORIGINS: "http://localhost:5103",
};

const WITH_REDIS_URL: Record<string, string> = {
  ...BASE_REQUIRED,
  REDIS_URL: "rediss://default:token@example.upstash.io:6379",
};

const WITH_REDIS_HOST_PORT: Record<string, string> = {
  ...BASE_REQUIRED,
  REDIS_HOST: "localhost",
  REDIS_PORT: "5101",
};

const PRODUCTION_WITH_CLOUDINARY: Record<string, string> = {
  ...WITH_REDIS_URL,
  NODE_ENV: "production",
  CLOUDINARY_CLOUD_NAME: "my-cloud",
  CLOUDINARY_API_KEY: "123456789",
  CLOUDINARY_API_SECRET: "secret-value",
};

describe("validateEnv", () => {
  it("does not throw when required base variables and REDIS_URL are present", () => {
    expect(() => validateEnv(WITH_REDIS_URL)).not.toThrow();
  });

  it("does not throw when Redis is configured via REDIS_HOST + REDIS_PORT", () => {
    expect(() => validateEnv(WITH_REDIS_HOST_PORT)).not.toThrow();
  });

  it("throws when all required variables are missing", () => {
    expect(() => validateEnv({})).toThrow(
      "Missing required environment variables",
    );
  });

  it("lists every missing variable in the error message", () => {
    let error: Error | null = null;
    try {
      validateEnv({});
    } catch (e) {
      error = e as Error;
    }
    expect(error).not.toBeNull();
    const missing = [
      "DATABASE_URL",
      "JWT_SECRET",
      "REDIS_URL or REDIS_HOST+REDIS_PORT",
      "CORS_ORIGINS",
    ];
    for (const key of missing) {
      expect(error?.message).toContain(key);
    }
  });

  it("does not require Cloudinary in non-production environments", () => {
    expect(() => validateEnv(WITH_REDIS_URL)).not.toThrow();
  });

  it("requires full Cloudinary configuration in production", () => {
    const withoutCloudinary = {
      ...WITH_REDIS_URL,
      NODE_ENV: "production",
    };

    expect(() => validateEnv(withoutCloudinary)).toThrow(
      "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
    );
  });

  it("does not throw in production when Cloudinary is fully configured", () => {
    expect(() => validateEnv(PRODUCTION_WITH_CLOUDINARY)).not.toThrow();
  });

  it("lists only the actually missing variables", () => {
    const partial: Record<string, string | undefined> = {
      ...WITH_REDIS_URL,
      CORS_ORIGINS: undefined,
    };

    let error: Error | null = null;
    try {
      validateEnv(partial);
    } catch (e) {
      error = e as Error;
    }

    expect(error).not.toBeNull();
    expect(error?.message).toContain("CORS_ORIGINS");
    expect(error?.message).not.toContain("DATABASE_URL");
    expect(error?.message).not.toContain("JWT_SECRET");
  });

  it("throws when Redis URL is empty and host/port fallback is missing", () => {
    const withEmptyRedis = { ...WITH_REDIS_URL, REDIS_URL: "   " };
    expect(() => validateEnv(withEmptyRedis)).toThrow(
      "REDIS_URL or REDIS_HOST+REDIS_PORT",
    );
  });

  it("does not throw when REDIS_URL is empty but REDIS_HOST/REDIS_PORT are present", () => {
    const withHostPortFallback = {
      ...WITH_REDIS_HOST_PORT,
      REDIS_URL: "",
    };

    expect(() => validateEnv(withHostPortFallback)).not.toThrow();
  });
});
