/**
 * E2E: Admin flow
 * Tests admin user can log in and manage players
 */
import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@ministrosfc.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "Admin1234!";

test.describe("Admin flow", () => {
  test("admin can log in", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#login-email", ADMIN_EMAIL);
    await page.fill("#login-password", ADMIN_PASSWORD);
    await page.getByRole("button", { name: /iniciar sesión/i }).click();

    // Wait for navigation away from login page
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 15000,
    });

    // Verify we're on a different page (should be admin dashboard)
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("admin can navigate to player creation form", async ({ page }) => {
    // Login first
    await page.goto("/login");
    await page.fill("#login-email", ADMIN_EMAIL);
    await page.fill("#login-password", ADMIN_PASSWORD);

    // Click login and wait for navigation
    await Promise.all([
      page.waitForURL((url) => !url.pathname.includes("/login"), {
        timeout: 10000,
      }),
      page.getByRole("button", { name: /iniciar sesión/i }).click(),
    ]);

    // Navigate to new player form
    await page.goto("/admin/players/create");
    await expect(page).toHaveURL(/\/admin\/players\/create/);
  });

  test("unauthenticated user is redirected from admin pages", async ({
    page,
  }) => {
    await page.goto("/admin/players/create");
    // Should redirect to login with redirect param
    await expect(page).toHaveURL(/\/login/);
  });
});
