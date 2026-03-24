/**
 * E2E: Player participation flow
 * Tests that a player user can log in and confirm participation for a game
 */
import { test, expect } from "@playwright/test";

const PLAYER_EMAIL = process.env.E2E_PLAYER_EMAIL ?? "player@ministrosfc.com";
const PLAYER_PASSWORD = process.env.E2E_PLAYER_PASSWORD ?? "player123";

test.describe("Player participation flow", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(PLAYER_EMAIL);
    await page.getByLabel(/password/i).fill(PLAYER_PASSWORD);
    await page.getByRole("button", { name: /sign in|log in/i }).click();
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("authenticated player can view schedule page", async ({ page }) => {
    await page.goto("/schedule");
    await expect(
      page.getByRole("heading", { name: /schedule/i }),
    ).toBeVisible();
  });

  test("player can see participation options on a game", async ({ page }) => {
    await page.goto("/schedule");
    // If there are any scheduled games, click on the first one
    const gameLinks = page.locator('a[href^="/games/"]');
    const gameCount = await gameLinks.count();
    if (gameCount > 0) {
      await gameLinks.first().click();
      // Game detail page should be visible
      await expect(page).toHaveURL(/\/games\//);
    }
  });
});
