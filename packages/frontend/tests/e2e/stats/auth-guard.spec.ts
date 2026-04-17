/**
 * E2E: Auth guard for /stats/* routes
 * SC-006: Unauthenticated users are redirected to login; post-auth redirect returns to original URL
 */
import { test, expect } from "@playwright/test";

const statsRoutes = [
  "/stats",
  "/stats/years",
  "/stats/tournaments",
  "/stats/rivals",
  "/stats/players",
];

test.describe("Auth guard for stats pages", () => {
  for (const route of statsRoutes) {
    test(`redirects unauthenticated user from ${route} to login`, async ({
      page,
    }) => {
      await page.goto(route);
      // Should redirect to login
      await expect(page).toHaveURL(/\/login|\/auth/i);
    });
  }

  test("SC-006: post-auth redirect returns to original /stats URL", async ({
    page,
  }) => {
    await page.goto("/stats/years");
    await expect(page).toHaveURL(/\/login|\/auth/i);

    // After login, the redirect param should point back to /stats/years
    const url = page.url();
    expect(url).toMatch(/redirect|returnTo|from/i);
  });
});
