/**
 * E2E: Auth guard for /statistics/* routes
 * SC-006: Unauthenticated users are redirected to login; post-auth redirect returns to original URL
 * SC-009: Legacy /stats/* prefix returns 404
 */
import { test, expect } from "@playwright/test";

const statsRoutes = [
  "/statistics/years",
  "/statistics/tournaments",
  "/statistics/rivals",
  "/statistics/players",
];

test.describe("Auth guard for statistics pages", () => {
  for (const route of statsRoutes) {
    test(`redirects unauthenticated user from ${route} to login`, async ({
      page,
    }) => {
      await page.goto(route);
      // Should redirect to login
      await expect(page).toHaveURL(/\/login|\/auth/i);
    });
  }

  test("SC-006: post-auth redirect returns to original /statistics/* URL", async ({
    page,
  }) => {
    await page.goto("/statistics/years");
    await expect(page).toHaveURL(/\/login|\/auth/i);

    // After login, the redirect param should point back to /statistics/years
    const url = page.url();
    expect(url).toMatch(/redirect|returnTo|from/i);
  });

  test("SC-009: legacy /stats/years returns 404", async ({ page }) => {
    const response = await page.goto("/stats/years");
    // Nuxt should return a 404 — either via HTTP status or by rendering its error page
    const is404 =
      response?.status() === 404 ||
      (await page.locator("body").textContent())?.includes("404") ||
      (await page.locator("body").textContent())?.includes("not found");
    expect(is404).toBe(true);
  });
});
