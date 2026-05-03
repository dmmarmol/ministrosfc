import { test, expect } from "@playwright/test";

const EMAIL = process.env.E2E_PLAYER_EMAIL;
const PASSWORD = process.env.E2E_PLAYER_PASSWORD;
const ENABLE_LOGOUT_FLOW = process.env.E2E_ENABLE_LOGOUT_FLOW === "1";

function requireCreds() {
  return Boolean(EMAIL && PASSWORD);
}

test.describe("minimal auth flows", () => {
  test("login", async ({ page }) => {
    test.skip(!requireCreds(), "Set E2E_PLAYER_EMAIL and E2E_PLAYER_PASSWORD");

    await page.goto("/login");
    await page.fill("#login-email", EMAIL ?? "");
    await page.fill("#login-password", PASSWORD ?? "");
    await page.getByRole("button", { name: /iniciar sesión/i }).click();
    await page.waitForURL((url: URL) => !url.pathname.includes("/login"), {
      timeout: 15000,
    });
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("register mode is reachable on login page", async ({ page }) => {
    await page.goto("/login?mode=register");
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText(/creá tu cuenta/i)).toBeVisible();
  });

  test("logout flow is available when enabled", async ({ page }) => {
    test.skip(
      !ENABLE_LOGOUT_FLOW || !requireCreds(),
      "Set E2E_ENABLE_LOGOUT_FLOW=1 with E2E_PLAYER_EMAIL/E2E_PLAYER_PASSWORD",
    );

    await page.goto("/login");
    await page.fill("#login-email", EMAIL ?? "");
    await page.fill("#login-password", PASSWORD ?? "");
    await page.getByRole("button", { name: /iniciar sesión/i }).click();
    await page.waitForURL((url: URL) => !url.pathname.includes("/login"), {
      timeout: 15000,
    });

    await page.goto("/");
    await page
      .getByRole("button", { name: /cerrar sesión|logout/i })
      .first()
      .click();
    await expect(page).toHaveURL(/\/login/);
  });
});
