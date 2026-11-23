/**
 * Unit tests for the Redis client selection rule.
 *
 * `shouldUseNoopRedis` is a pure function of the environment, so it can be
 * tested without Jest's own JEST_WORKER_ID forcing the no-op client.
 */
import { shouldUseNoopRedis } from "../../src/config/redis";

describe("shouldUseNoopRedis", () => {
  it("is true for development and test builds", () => {
    expect(shouldUseNoopRedis({ NODE_ENV: "development" })).toBe(true);
    expect(shouldUseNoopRedis({ NODE_ENV: "test" })).toBe(true);
  });

  it("is true under Jest workers", () => {
    expect(shouldUseNoopRedis({ NODE_ENV: "production", JEST_WORKER_ID: "1" })).toBe(true);
  });

  it("is false for a production build with a real Redis", () => {
    expect(
      shouldUseNoopRedis({ NODE_ENV: "production", APP_ENV: "production", REDIS_URL: "rediss://x" }),
    ).toBe(false);
  });

  it("is true for a deployed development app with REDIS_DISABLED=true", () => {
    expect(
      shouldUseNoopRedis({ NODE_ENV: "production", APP_ENV: "development", REDIS_DISABLED: "true" }),
    ).toBe(true);
  });

  it("ignores REDIS_DISABLED when APP_ENV is production", () => {
    expect(
      shouldUseNoopRedis({ NODE_ENV: "production", APP_ENV: "production", REDIS_DISABLED: "true" }),
    ).toBe(false);
  });

  it("does not treat other REDIS_DISABLED values as disabled", () => {
    expect(
      shouldUseNoopRedis({ NODE_ENV: "production", APP_ENV: "development", REDIS_DISABLED: "false" }),
    ).toBe(false);
  });
});
