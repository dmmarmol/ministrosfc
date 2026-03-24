/**
 * E2E: Public browsing flow
 * Tests unauthenticated user can browse public pages
 */
import { test, expect } from "@playwright/test";

test.describe("Public browsing flow", () => {
  test("homepage loads with site title", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/Ministros FC/i);
  });

  test("players page shows player cards", async ({ page }) => {
    await page.goto("/players");
    await expect(page.getByRole("heading", { name: /players/i })).toBeVisible();
  });

  test("schedule page shows games list", async ({ page }) => {
    await page.goto("/schedule");
    await expect(
      page.getByRole("heading", { name: /schedule/i }),
    ).toBeVisible();
  });

  test("tournaments page loads", async ({ page }) => {
    await page.goto("/tournaments");
    await expect(
      page.getByRole("heading", { name: /tournaments/i }),
    ).toBeVisible();
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("link", { name: /players/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /schedule/i })).toBeVisible();
    await expect(
      page.getByRole("link", { name: /tournaments/i }),
    ).toBeVisible();
  });
});
