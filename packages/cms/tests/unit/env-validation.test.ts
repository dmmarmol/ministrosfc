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

const PRODUCTION_BASE: Record<string, string | undefined> = {
  ...WITH_REDIS_URL,
  NODE_ENV: "production",
  APP_ENV: "production",
  CORS_ORIGINS: "https://app.example.com",
};

const PRODUCTION_WITH_CLOUDINARY: Record<string, string | undefined> = {
  ...PRODUCTION_BASE,
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

  it("does not require Cloudinary, even in production", () => {
    expect(() => validateEnv(PRODUCTION_BASE)).not.toThrow();
  });

  it("does not throw in production when Cloudinary is fully configured", () => {
    expect(() => validateEnv(PRODUCTION_WITH_CLOUDINARY)).not.toThrow();
  });

  it("rejects a partial Cloudinary configuration", () => {
    const partial = { ...WITH_REDIS_URL, CLOUDINARY_CLOUD_NAME: "my-cloud" };
    expect(() => validateEnv(partial)).toThrow(/photo storage/i);
    expect(() => validateEnv(partial)).toThrow("CLOUDINARY_API_KEY");
  });

  describe("APP_ENV", () => {
    it("is required when NODE_ENV is production", () => {
      const env = { ...PRODUCTION_BASE, APP_ENV: undefined };
      expect(() => validateEnv(env)).toThrow("APP_ENV");
    });

    it("defaults to development outside production builds", () => {
      expect(() => validateEnv(WITH_REDIS_URL)).not.toThrow();
    });

    it("rejects values other than development or production", () => {
      const env = { ...WITH_REDIS_URL, APP_ENV: "staging" };
      expect(() => validateEnv(env)).toThrow(/APP_ENV/);
    });
  });

  describe("Redis in production and with REDIS_DISABLED", () => {
    it("requires REDIS_URL when APP_ENV is production", () => {
      const env = {
        ...BASE_REQUIRED,
        NODE_ENV: "production",
        APP_ENV: "production",
        CORS_ORIGINS: "https://app.example.com",
        REDIS_HOST: "localhost",
        REDIS_PORT: "5101",
      };
      expect(() => validateEnv(env)).toThrow("REDIS_URL");
    });

    it("accepts REDIS_DISABLED=true when APP_ENV is development", () => {
      const env = {
        ...BASE_REQUIRED,
        NODE_ENV: "production",
        APP_ENV: "development",
        REDIS_DISABLED: "true",
      };
      expect(() => validateEnv(env)).not.toThrow();
    });

    it("rejects REDIS_DISABLED=true when APP_ENV is production", () => {
      const env = { ...PRODUCTION_BASE, REDIS_DISABLED: "true" };
      expect(() => validateEnv(env)).toThrow(/REDIS_DISABLED/);
    });
  });

  describe("production CORS origins", () => {
    it("rejects localhost origins when APP_ENV is production", () => {
      const env = {
        ...PRODUCTION_BASE,
        CORS_ORIGINS: "https://app.example.com,http://localhost:5103",
      };
      expect(() => validateEnv(env)).toThrow(/CORS_ORIGINS/);
    });

    it("rejects non-HTTPS origins when APP_ENV is production", () => {
      const env = { ...PRODUCTION_BASE, CORS_ORIGINS: "http://app.example.com" };
      expect(() => validateEnv(env)).toThrow(/HTTPS/);
    });

    it("allows localhost origins in development", () => {
      const env = { ...WITH_REDIS_URL, CORS_ORIGINS: "http://localhost:5103" };
      expect(() => validateEnv(env)).not.toThrow();
    });
  });

  it("reports every problem in one error message", () => {
    let error: Error | null = null;
    try {
      validateEnv({
        ...PRODUCTION_BASE,
        CORS_ORIGINS: "http://localhost:5103",
        CLOUDINARY_CLOUD_NAME: "my-cloud",
      });
    } catch (e) {
      error = e as Error;
    }
    expect(error?.message).toContain("CORS_ORIGINS");
    expect(error?.message).toContain("CLOUDINARY_API_KEY");
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
