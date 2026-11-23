// @vitest-environment node
import { afterEach, describe, expect, it } from "vitest";
import { createApp, toWebHandler } from "h3";
import { buildRobotsTxt } from "../../server/utils/robots";
import robotsHandler from "../../server/routes/robots.txt";

describe("buildRobotsTxt", () => {
  it("in production allows public routes and keeps private routes disallowed", () => {
    const txt = buildRobotsTxt("production");
    const lines = txt.split("\n");

    expect(lines).toContain("User-agent: *");
    for (const path of [
      "/admin",
      "/profile",
      "/login",
      "/register",
      "/auth",
      "/games/*/signup",
    ]) {
      expect(lines).toContain(`Disallow: ${path}`);
    }
    expect(lines).not.toContain("Disallow: /");
  });

  it.each(["development", "staging", undefined, ""])(
    "disallows everything when APP_ENV is %s",
    (env) => {
      const lines = buildRobotsTxt(env).split("\n");
      expect(lines).toContain("User-agent: *");
      expect(lines).toContain("Disallow: /");
    },
  );
});

describe("/robots.txt route", () => {
  const original = process.env.APP_ENV;
  afterEach(() => {
    if (original === undefined) delete process.env.APP_ENV;
    else process.env.APP_ENV = original;
  });

  async function fetchRobots() {
    const app = createApp().use(robotsHandler);
    const res = await toWebHandler(app)(
      new Request("http://localhost/robots.txt"),
    );
    return {
      status: res.status,
      type: res.headers.get("content-type"),
      body: await res.text(),
    };
  }

  it("serves the production rules when APP_ENV=production", async () => {
    process.env.APP_ENV = "production";
    const { status, type, body } = await fetchRobots();

    expect(status).toBe(200);
    expect(type).toContain("text/plain");
    expect(body).not.toMatch(/^Disallow: \/$/m);
    expect(body).toContain("Disallow: /admin");
  });

  it("blocks all crawling otherwise", async () => {
    process.env.APP_ENV = "development";
    const { body } = await fetchRobots();

    expect(body).toMatch(/^Disallow: \/$/m);
  });
});
