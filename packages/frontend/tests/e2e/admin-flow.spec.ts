/**
 * E2E: Admin flow
 * Tests admin user can log in and manage players
 */
import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@ministrosfc.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin123";

test.describe("Admin flow", () => {
  test("admin can log in", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // After login, should redirect away from login page
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("admin can navigate to player creation form", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL);
    await page.getByLabel(/password/i).fill(ADMIN_PASSWORD);
    await page.getByRole("button", { name: /sign in|log in/i }).click();

    // Navigate to new player form
    await page.goto("/admin/players/new");
    await expect(
      page.getByRole("heading", { name: /add player|new player/i }),
    ).toBeVisible();
  });

  test("unauthenticated user is redirected from admin pages", async ({
    page,
  }) => {
    await page.goto("/admin/players/new");
    await expect(page).toHaveURL(/\/login/);
  });
});
