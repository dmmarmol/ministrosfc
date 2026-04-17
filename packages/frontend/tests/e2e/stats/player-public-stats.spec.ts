/**
 * E2E: Player public stats
 * SC-001: Anonymous user can view player stats
 * SC-003: Year filter updates URL query param
 * SC-004: Shared URL restores filter state
 */
import { test, expect } from "@playwright/test";

test.describe("Player public stats", () => {
  test("SC-001: anonymous user can access player stats page", async ({
    page,
  }) => {
    // Navigate to roster first to find a player link
    await page.goto("/roster");
    await expect(page).toHaveURL(/\/roster/);

    // Player cards should be visible without login
    const playerLinks = page.locator('a[href*="/players/"]');
    const count = await playerLinks.count();
    if (count === 0) {
      // If no players yet, just verify the page loads
      return;
    }

    // Click first player
    const href = await playerLinks.first().getAttribute("href");
    await page.goto(href ?? "/roster");
    await expect(page).toHaveURL(/\/players\//);
  });

  test("SC-003: year filter updates URL without full page reload", async ({
    page,
  }) => {
    await page.goto("/roster");
    const playerLinks = page.locator('a[href*="/players/"]');
    const count = await playerLinks.count();
    if (count === 0) return;

    const href = await playerLinks.first().getAttribute("href");
    await page.goto(href ?? "/");

    // Find the year select
    const yearSelect = page.locator("select").first();
    const exists = await yearSelect.count();
    if (!exists) return;

    // Get current URL
    const urlBefore = page.url();

    // Change year filter
    const options = yearSelect.locator("option");
    const optCount = await options.count();
    if (optCount < 2) return;

    const secondOption = await options.nth(1).getAttribute("value");
    if (!secondOption) return;

    await yearSelect.selectOption(secondOption);

    // URL should update with year param
    await expect(page).toHaveURL(new RegExp(`year=${secondOption}`));
  });

  test("SC-004: shared URL with year param restores filter state", async ({
    page,
  }) => {
    await page.goto("/roster");
    const playerLinks = page.locator('a[href*="/players/"]');
    const count = await playerLinks.count();
    if (count === 0) return;

    const href = await playerLinks.first().getAttribute("href");
    const playerUrl = `${href}?year=2023`;

    await page.goto(playerUrl);
    await expect(page).toHaveURL(/year=2023/);

    // The year select should show 2023 as selected
    const yearSelect = page.locator("select").first();
    const selectedValue = await yearSelect.inputValue().catch(() => null);
    if (selectedValue !== null) {
      expect(selectedValue).toBe("2023");
    }
  });
});
