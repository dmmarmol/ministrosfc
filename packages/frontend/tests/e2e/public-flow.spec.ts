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

  test("players page (roster) loads", async ({ page }) => {
    await page.goto("/roster");
    await expect(page).toHaveURL(/\/roster/);
  });

  test("schedule page loads", async ({ page }) => {
    await page.goto("/schedule");
    await expect(page).toHaveURL(/\/schedule/);
  });

  test("tournaments page loads", async ({ page }) => {
    await page.goto("/tournaments");
    await expect(page).toHaveURL(/\/tournaments/);
  });

  test("navigation links are present", async ({ page }) => {
    await page.goto("/");
    // Check navigation bar links (not footer or page content links)
    const nav = page.locator("nav");
    await expect(nav.getByRole("link", { name: /plantilla/i })).toBeVisible();
    await expect(nav.getByRole("link", { name: /calendario/i })).toBeVisible();
  });
});
