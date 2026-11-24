/**
 * Unit tests for the Redis client selection rule.
 *
 * `shouldUseNoopRedis` is a pure function of the environment, so it can be
 * tested without Jest's own JEST_WORKER_ID forcing the no-op client.
 */
import {
  createMemoryClient,
  getRedisClient,
  shouldUseNoopRedis,
} from "../../src/config/redis";

describe("shouldUseNoopRedis", () => {
  it("is true for development and test builds", () => {
    expect(shouldUseNoopRedis({ NODE_ENV: "development" })).toBe(true);
    expect(shouldUseNoopRedis({ NODE_ENV: "test" })).toBe(true);
  });

  it("is true under Jest workers", () => {
    expect(
      shouldUseNoopRedis({ NODE_ENV: "production", JEST_WORKER_ID: "1" }),
    ).toBe(true);
  });

  it("is false for a production build with a real Redis", () => {
    expect(
      shouldUseNoopRedis({
        NODE_ENV: "production",
        APP_ENV: "production",
        REDIS_URL: "rediss://x",
      }),
    ).toBe(false);
  });

  it("is true for a deployed development app with REDIS_DISABLED=true", () => {
    expect(
      shouldUseNoopRedis({
        NODE_ENV: "production",
        APP_ENV: "development",
        REDIS_DISABLED: "true",
      }),
    ).toBe(true);
  });

  it("ignores REDIS_DISABLED when APP_ENV is production", () => {
    expect(
      shouldUseNoopRedis({
        NODE_ENV: "production",
        APP_ENV: "production",
        REDIS_DISABLED: "true",
      }),
    ).toBe(false);
  });

  it("does not treat other REDIS_DISABLED values as disabled", () => {
    expect(
      shouldUseNoopRedis({
        NODE_ENV: "production",
        APP_ENV: "development",
        REDIS_DISABLED: "false",
      }),
    ).toBe(false);
  });
});

describe("createMemoryClient (cache-less deployments)", () => {
  // Sessions live in Redis, so a disabled Redis must still remember refresh tokens
  // for the lifetime of the process; otherwise refreshing a session always fails.
  let clock = 1_000_000;
  const client = () => createMemoryClient(() => clock);

  beforeEach(() => {
    clock = 1_000_000;
  });

  it("returns a value stored with setex", async () => {
    const redis = client();
    await redis.setex("session:refresh:abc", 60, "user-1");
    expect(await redis.get("session:refresh:abc")).toBe("user-1");
  });

  it("returns null for unknown and for expired keys", async () => {
    const redis = client();
    expect(await redis.get("missing")).toBeNull();
    await redis.setex("short", 10, "v");
    clock += 10_001;
    expect(await redis.get("short")).toBeNull();
  });

  it("deletes one or several keys and reports how many existed", async () => {
    const redis = client();
    await redis.setex("a", 60, "1");
    await redis.setex("b", 60, "2");
    expect(await redis.del("a", "nope")).toBe(1);
    expect(await redis.get("a")).toBeNull();
    expect(await redis.get("b")).toBe("2");
  });

  it("lists live keys matching a glob pattern", async () => {
    const redis = client();
    await redis.setex("cache:stats:1", 60, "x");
    await redis.setex("cache:stats:2", 60, "x");
    await redis.setex("session:refresh:z", 60, "u");
    await redis.setex("cache:old", 1, "x");
    clock += 2_000;
    expect((await redis.keys("cache:stats:*")).sort()).toEqual([
      "cache:stats:1",
      "cache:stats:2",
    ]);
  });

  it("flushall clears everything and ping answers PONG", async () => {
    const redis = client();
    await redis.setex("a", 60, "1");
    await redis.flushall();
    expect(await redis.get("a")).toBeNull();
    expect(await redis.ping()).toBe("PONG");
  });
});

describe("getRedisClient with Redis disabled outside Jest", () => {
  it("shares one in-memory store between calls", async () => {
    const env = { ...process.env };
    delete process.env.JEST_WORKER_ID;
    process.env.NODE_ENV = "production";
    process.env.APP_ENV = "development";
    process.env.REDIS_DISABLED = "true";
    try {
      await getRedisClient().setex("session:refresh:t", 60, "user-9");
      expect(await getRedisClient().get("session:refresh:t")).toBe("user-9");
    } finally {
      process.env = env;
    }
  });
});
