import { describe, expect, it } from "vitest";
import {
  PRIVATE_ROUTES,
  PUBLIC_CACHE_SECONDS,
  PUBLIC_ROUTES,
  routeRules,
} from "../../route-rules";

describe("route rules (public page caching)", () => {
  it("caches public pages with stale-while-revalidate for 5 minutes", () => {
    expect(PUBLIC_CACHE_SECONDS).toBe(300);
    for (const route of PUBLIC_ROUTES) {
      expect(routeRules[route]).toEqual({ swr: PUBLIC_CACHE_SECONDS });
    }
  });

  it("covers the public sections of the site", () => {
    for (const route of [
      "/",
      "/roster",
      "/schedule",
      "/tournaments/**",
      "/statistics/**",
      "/players/**",
      "/games/**",
    ]) {
      expect(PUBLIC_ROUTES).toContain(route);
    }
  });

  it("never caches private or per-user routes", () => {
    for (const route of [
      "/admin/**",
      "/profile/**",
      "/login",
      "/register",
      "/auth/**",
      "/games/*/signup",
    ]) {
      expect(PRIVATE_ROUTES).toContain(route);
      expect(routeRules[route]).toEqual({ swr: false });
    }
  });

  it("has no route that is both public and private", () => {
    const overlap = PUBLIC_ROUTES.filter((route) =>
      PRIVATE_ROUTES.includes(route),
    );
    expect(overlap).toEqual([]);
  });
});
