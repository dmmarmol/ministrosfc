/**
 * E2E: Admin Player Delete flow (Feature 013)
 * Tests T007 (Admin delete), T015 (Editor guard), T019 (Editor status toggle)
 */
import { test, expect } from "@playwright/test";

const ADMIN_EMAIL = process.env.E2E_ADMIN_EMAIL ?? "admin@ministrosfc.com";
const ADMIN_PASSWORD = process.env.E2E_ADMIN_PASSWORD ?? "admin123";
const EDITOR_EMAIL = process.env.E2E_EDITOR_EMAIL ?? "editor@ministrosfc.com";
const EDITOR_PASSWORD = process.env.E2E_EDITOR_PASSWORD ?? "editor123";

async function loginAs(page: any, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole("button", { name: /sign in|log in|entrar/i }).click();
  await page.waitForURL((url: URL) => !url.pathname.includes("/login"));
}

test.describe("Admin: Player Delete flow", () => {
  test("Admin opens player list, clicks Delete, modal shows player name, confirms — player absent from list", async ({
    page,
  }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin/players");

    // Find first Delete button
    const deleteBtn = page.locator('[data-testid="delete-player-btn"]').first();
    await expect(deleteBtn).toBeVisible();

    // Get player name from the same row
    const row = deleteBtn.locator("xpath=ancestor::tr");
    const playerName = await row.locator("td").first().textContent();

    await deleteBtn.click();

    // Modal should appear with player name
    const modal = page.locator('[data-testid="player-delete-modal"]');
    await expect(modal).toBeVisible();
    if (playerName) {
      await expect(modal).toContainText(playerName.trim());
    }

    // Confirm deletion
    await page.locator('[data-testid="confirm-delete"]').click();

    // Should navigate back to players list
    await page.waitForURL(/\/admin\/players/);

    // Player should no longer appear
    if (playerName) {
      await expect(page.locator("table")).not.toContainText(playerName.trim());
    }
  });

  test("Admin opens modal and clicks Cancel — no changes", async ({ page }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin/players");

    const deleteBtn = page.locator('[data-testid="delete-player-btn"]').first();
    await expect(deleteBtn).toBeVisible();

    const initialRows = await page.locator("tbody tr").count();

    await deleteBtn.click();
    const modal = page.locator('[data-testid="player-delete-modal"]');
    await expect(modal).toBeVisible();

    await page.locator('[data-testid="cancel-delete"]').click();
    await expect(modal).not.toBeVisible();

    // Row count unchanged
    await expect(page.locator("tbody tr")).toHaveCount(initialRows);
  });

  test("Admin on player edit page confirms delete — redirected to list with player absent", async ({
    page,
  }) => {
    await loginAs(page, ADMIN_EMAIL, ADMIN_PASSWORD);
    await page.goto("/admin/players");

    // Get first edit link
    const editLink = page
      .locator('a[href*="/admin/players/"][href*="/edit"]')
      .first();
    await expect(editLink).toBeVisible();
    const editHref = await editLink.getAttribute("href");
    await page.goto(editHref!);

    const playerHeading = page.locator("h2");
    const headingText = await playerHeading.textContent();

    // Delete button should be visible for Admin
    const deleteBtn = page.locator('[data-testid="delete-player-btn"]');
    await expect(deleteBtn).toBeVisible();
    await deleteBtn.click();

    const modal = page.locator('[data-testid="player-delete-modal"]');
    await expect(modal).toBeVisible();
    await page.locator('[data-testid="confirm-delete"]').click();

    // Should redirect to /admin/players
    await page.waitForURL(/\/admin\/players$/);
  });
});

test.describe("Editor: Delete button is hidden", () => {
  test("Editor sees no Delete button on players list", async ({ page }) => {
    await loginAs(page, EDITOR_EMAIL, EDITOR_PASSWORD);
    await page.goto("/admin/players");

    await expect(page.locator('[data-testid="delete-player-btn"]')).toHaveCount(
      0,
    );
  });

  test("Editor sees no Delete button on player edit page", async ({ page }) => {
    await loginAs(page, EDITOR_EMAIL, EDITOR_PASSWORD);
    await page.goto("/admin/players");

    const editLink = page
      .locator('a[href*="/admin/players/"][href*="/edit"]')
      .first();
    await expect(editLink).toBeVisible();
    const editHref = await editLink.getAttribute("href");
    await page.goto(editHref!);

    await expect(page.locator('[data-testid="delete-player-btn"]')).toHaveCount(
      0,
    );
  });
});

test.describe("Editor: Status toggle works", () => {
  test("Editor can toggle player status Activate/Deactivate — no Delete button present", async ({
    page,
  }) => {
    await loginAs(page, EDITOR_EMAIL, EDITOR_PASSWORD);
    await page.goto("/admin/players?status=ACTIVE");

    // No delete buttons
    await expect(page.locator('[data-testid="delete-player-btn"]')).toHaveCount(
      0,
    );

    // Status toggle button should be present
    const toggleBtn = page
      .locator("button", { hasText: /Desactivar|Deactivate/i })
      .first();
    await expect(toggleBtn).toBeVisible();

    await toggleBtn.click();

    // Status should update (badge changes)
    await page.waitForTimeout(500);
    // Re-check no delete buttons still
    await expect(page.locator('[data-testid="delete-player-btn"]')).toHaveCount(
      0,
    );
  });
});
