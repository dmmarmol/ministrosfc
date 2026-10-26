import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD;

function hasAdminCreds() {
  return Boolean(ADMIN_EMAIL && ADMIN_PASSWORD);
}

async function loginAsAdmin(page) {
  await page.goto("/login");
  await page.fill("#login-email", ADMIN_EMAIL ?? "");
  await page.fill("#login-password", ADMIN_PASSWORD ?? "");
  await page.getByRole("button", { name: /iniciar sesión/i }).click();
  await page.waitForURL((url: URL) => !url.pathname.includes("/login"), {
    timeout: 15000,
  });
}

test.describe("minimal admin create flows", () => {
  test("admin user create route reachable", async ({ page }) => {
    test.skip(!hasAdminCreds(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    await loginAsAdmin(page);
    await page.goto("/admin/users/create");
    await expect(page).toHaveURL(/\/admin\/users\/create/);
  });

  test("admin game create route reachable", async ({ page }) => {
    test.skip(!hasAdminCreds(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    await loginAsAdmin(page);
    await page.goto("/admin/games/create");
    await expect(page).toHaveURL(/\/admin\/games\/create/);
  });

  test("admin player create route reachable", async ({ page }) => {
    test.skip(!hasAdminCreds(), "Set E2E_ADMIN_EMAIL and E2E_ADMIN_PASSWORD");
    await loginAsAdmin(page);
    await page.goto("/admin/players/create");
    await expect(page).toHaveURL(/\/admin\/players\/create/);
  });
});
