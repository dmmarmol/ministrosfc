/**
 * E2E: Filter URL roundtrip
 * SC-003: Applying filters encodes them in URL
 * SC-004: Reload with URL params restores filters
 */
import { test, expect } from "@playwright/test";

test.describe("Filter URL roundtrip (authenticated)", () => {
  test.skip(true, "Requires authenticated session — run with saved auth state");

  test("SC-003: year filter encodes into URL", async ({ page }) => {
    await page.goto("/statistics/years");
    await expect(page).toHaveURL(/\/statistics\/years/);

    const yearSelect = page.locator("select").first();
    const options = yearSelect.locator("option");
    const optCount = await options.count();
    if (optCount < 2) return;

    const secondOption = await options.nth(1).getAttribute("value");
    if (!secondOption) return;

    await yearSelect.selectOption(secondOption);
    await expect(page).toHaveURL(new RegExp(`year=${secondOption}`));
  });

  test("SC-004: reload with URL params restores filter", async ({ page }) => {
    await page.goto("/statistics/years?year=2022");
    await expect(page).toHaveURL(/year=2022/);

    const yearSelect = page.locator("select").first();
    const value = await yearSelect.inputValue();
    expect(value).toBe("2022");
  });

  test("invalid year param is ignored gracefully", async ({ page }) => {
    await page.goto("/statistics/years?year=invalid");
    // Page should still render without error
    await expect(page).toHaveURL(/\/statistics\/years/);
    await expect(page.locator("body")).not.toContainText("Error");
  });
});
