/**
 * Unit tests for the env-validation module.
 *
 * These tests exercise the exported `validateEnv` function directly,
 * passing an explicit env object so process.env is never mutated.
 *
 * Written BEFORE the implementation (TDD — red phase).
 */
import { validateEnv } from "../../src/config/env-validation";

const ALL_REQUIRED: Record<string, string> = {
  DATABASE_URL: "postgresql://dev:dev123@localhost:5432/ministrosfc_test",
  JWT_SECRET: "a-long-jwt-secret-value-for-testing-purposes-only",
  REDIS_URL: "rediss://default:token@example.upstash.io:6379",
  CORS_ORIGINS: "http://localhost:5103",
  CLOUDINARY_CLOUD_NAME: "my-cloud",
  CLOUDINARY_API_KEY: "123456789",
  CLOUDINARY_API_SECRET: "secret-value",
};

describe("validateEnv", () => {
  it("does not throw when all required variables are present", () => {
    expect(() => validateEnv(ALL_REQUIRED)).not.toThrow();
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
      "REDIS_URL",
      "CORS_ORIGINS",
      "CLOUDINARY_CLOUD_NAME",
      "CLOUDINARY_API_KEY",
      "CLOUDINARY_API_SECRET",
    ];
    for (const key of missing) {
      expect(error!.message).toContain(key);
    }
  });

  it("lists only the actually missing variables", () => {
    const partial = { ...ALL_REQUIRED };
    delete partial.REDIS_URL;
    delete partial.CLOUDINARY_API_SECRET;

    let error: Error | null = null;
    try {
      validateEnv(partial);
    } catch (e) {
      error = e as Error;
    }

    expect(error).not.toBeNull();
    expect(error!.message).toContain("REDIS_URL");
    expect(error!.message).toContain("CLOUDINARY_API_SECRET");
    expect(error!.message).not.toContain("DATABASE_URL");
    expect(error!.message).not.toContain("JWT_SECRET");
  });

  it("throws when a variable is present but empty", () => {
    const withEmpty = { ...ALL_REQUIRED, REDIS_URL: "" };
    expect(() => validateEnv(withEmpty)).toThrow("REDIS_URL");
  });
});
