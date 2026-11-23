// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createApp, eventHandler, toWebHandler } from "h3";
import {
  createRateLimiter,
  isBlockedUserAgent,
  isExemptPath,
} from "../../server/utils/bot-protection";

describe("isBlockedUserAgent", () => {
  it.each([
    "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
    "SemrushBot/7~bl",
    "MJ12bot/v1.4.8",
    "Bytespider; spider-feedback@bytedance.com",
  ])("blocks abusive crawler %s", (ua) => {
    expect(isBlockedUserAgent(ua)).toBe(true);
  });

  it.each([
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120 Safari/537.36",
    "Googlebot/2.1 (+http://www.google.com/bot.html)",
    "Mozilla/5.0 (compatible; bingbot/2.0)",
    "",
    undefined,
  ])("lets %s through", (ua) => {
    expect(isBlockedUserAgent(ua)).toBe(false);
  });
});

describe("isExemptPath", () => {
  it.each([
    "/_nuxt/entry.abc.js",
    "/robots.txt",
    "/favicon.ico",
    "/images/logo.png",
    "/fonts/inter.woff2",
  ])("exempts %s", (path) => {
    expect(isExemptPath(path)).toBe(true);
  });

  it.each(["/", "/roster", "/games/some-game", "/statistics/top-scorers"])(
    "does not exempt %s",
    (path) => {
      expect(isExemptPath(path)).toBe(false);
    },
  );
});

describe("createRateLimiter", () => {
  it("allows up to the limit inside a window and blocks the rest", () => {
    let now = 0;
    const limiter = createRateLimiter({
      limit: 3,
      windowMs: 60_000,
      now: () => now,
    });

    expect(limiter.hit("1.1.1.1").allowed).toBe(true);
    expect(limiter.hit("1.1.1.1").allowed).toBe(true);
    expect(limiter.hit("1.1.1.1").allowed).toBe(true);
    const blocked = limiter.hit("1.1.1.1");

    expect(blocked.allowed).toBe(false);
    expect(blocked.retryAfterSeconds).toBeGreaterThan(0);
  });

  it("tracks each client separately", () => {
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 60_000,
      now: () => 0,
    });

    expect(limiter.hit("a").allowed).toBe(true);
    expect(limiter.hit("b").allowed).toBe(true);
    expect(limiter.hit("a").allowed).toBe(false);
  });

  it("starts a new window after the old one expires", () => {
    let now = 0;
    const limiter = createRateLimiter({
      limit: 1,
      windowMs: 60_000,
      now: () => now,
    });

    limiter.hit("a");
    expect(limiter.hit("a").allowed).toBe(false);
    now = 60_001;
    expect(limiter.hit("a").allowed).toBe(true);
  });
});

describe("bot-protection middleware", () => {
  const original = {
    env: process.env.APP_ENV,
    limit: process.env.RATE_LIMIT_PER_MINUTE,
  };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    for (const [key, value] of [
      ["APP_ENV", original.env],
      ["RATE_LIMIT_PER_MINUTE", original.limit],
    ] as const) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  });

  async function request(path: string, headers: Record<string, string> = {}) {
    const { default: middleware } =
      await import("../../server/middleware/bot-protection");
    const app = createApp()
      .use(middleware)
      .use(eventHandler(() => "ok"));
    return toWebHandler(app)(
      new Request(`http://localhost${path}`, { headers }),
    );
  }

  it("adds X-Robots-Tag noindex outside production", async () => {
    process.env.APP_ENV = "development";
    const res = await request("/roster");

    expect(res.status).toBe(200);
    expect(res.headers.get("x-robots-tag")).toBe("noindex, nofollow");
  });

  it("does not add the noindex header in production", async () => {
    process.env.APP_ENV = "production";
    const res = await request("/roster");

    expect(res.headers.get("x-robots-tag")).toBeNull();
  });

  it("answers 403 to a denied crawler without reaching the app", async () => {
    process.env.APP_ENV = "production";
    const res = await request("/roster", { "user-agent": "AhrefsBot/7.0" });

    expect(res.status).toBe(403);
  });

  it("answers 429 with Retry-After above the per-IP limit", async () => {
    process.env.APP_ENV = "production";
    process.env.RATE_LIMIT_PER_MINUTE = "2";
    const { default: middleware } =
      await import("../../server/middleware/bot-protection");
    const handle = toWebHandler(
      createApp()
        .use(middleware)
        .use(eventHandler(() => "ok")),
    );
    const hit = () =>
      handle(
        new Request("http://localhost/roster", {
          headers: { "fly-client-ip": "9.9.9.9" },
        }),
      );

    expect((await hit()).status).toBe(200);
    expect((await hit()).status).toBe(200);
    const limited = await hit();

    expect(limited.status).toBe(429);
    expect(Number(limited.headers.get("retry-after"))).toBeGreaterThan(0);
  });

  it("never rate-limits assets or the health probe path", async () => {
    process.env.APP_ENV = "production";
    process.env.RATE_LIMIT_PER_MINUTE = "1";
    const { default: middleware } =
      await import("../../server/middleware/bot-protection");
    const handle = toWebHandler(
      createApp()
        .use(middleware)
        .use(eventHandler(() => "ok")),
    );
    const hit = (path: string) =>
      handle(
        new Request(`http://localhost${path}`, {
          headers: { "fly-client-ip": "8.8.8.8" },
        }),
      );

    for (let i = 0; i < 5; i++) {
      expect((await hit("/robots.txt")).status).toBe(200);
      expect((await hit("/_nuxt/app.js")).status).toBe(200);
    }
  });
});
