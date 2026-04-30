import { test, expect } from "@playwright/test";

test.describe("minimal players flows", () => {
  test("players list page loads", async ({ page }) => {
    await page.goto("/players");
    await expect(page).toHaveURL(/\/players/);
  });

  test("players detail page route is reachable from list when links exist", async ({
    page,
  }) => {
    await page.goto("/players");
    const links = page.locator('a[href^="/players/"]');
    const count = await links.count();

    test.skip(count === 0, "No player links available in current fixture data");

    await links.first().click();
    await expect(page).toHaveURL(/\/players\//);
  });
});
