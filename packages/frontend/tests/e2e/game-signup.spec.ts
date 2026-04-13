/**
 * E2E: Game signup & invitation flow (014)
 * SC-001: self-signup end-to-end ≤ 60 s
 * SC-002: guest signup form-open-to-roster-update ≤ 30 s
 * SC-003: UUID → 301 → slug in one hop
 */
import { test, expect } from "@playwright/test";

const PLAYER_EMAIL = process.env.E2E_PLAYER_EMAIL ?? "player@ministrosfc.com";
const PLAYER_PASSWORD = process.env.E2E_PLAYER_PASSWORD ?? "player123";

/**
 * Slug of a SCHEDULED game that still has capacity and where the test player
 * has NOT yet confirmed. Override via env var in CI.
 */
const SIGNUP_GAME_SLUG = process.env.E2E_SIGNUP_GAME_SLUG ?? "test-signup-game";

/**
 * UUID of an existing game (any status). Used only for the redirect test.
 * Override via env var in CI.
 */
const GAME_UUID = process.env.E2E_GAME_UUID ?? "";

/**
 * Slug of a SCHEDULED game whose capacity is already full.
 * Override via env var in CI. If empty, the capacity-full test is skipped.
 */
const FULL_GAME_SLUG = process.env.E2E_FULL_GAME_SLUG ?? "";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function loginAsPlayer(page) {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill(PLAYER_EMAIL);
  await page.getByLabel(/password/i).fill(PLAYER_PASSWORD);
  await page.getByRole("button", { name: /sign in|ingresar|log in/i }).click();
  await expect(page).not.toHaveURL(/\/login/);
}

// ---------------------------------------------------------------------------
// SC-001: Full self-signup flow
// ---------------------------------------------------------------------------

test.describe("SC-001 — Self-signup flow", () => {
  test("unauthenticated visit redirects to /login with redirect param", async ({
    page,
  }) => {
    // Go to signup page without being logged in
    await page.goto(`/games/${SIGNUP_GAME_SLUG}/signup`);
    // Auth middleware must redirect to login
    await expect(page).toHaveURL(/\/login/);
    // The redirect= query param should include the original path
    expect(page.url()).toContain("redirect=");
  });

  test(
    "player can confirm attendance and appear in roster (SC-001 ≤ 60 s)",
    async ({ page }) => {
      const start = Date.now();

      // Step 1: Visit signup URL unauthenticated → login redirect
      await page.goto(`/games/${SIGNUP_GAME_SLUG}/signup`);
      await expect(page).toHaveURL(/\/login/);

      // Step 2: Log in
      await page.getByLabel(/email/i).fill(PLAYER_EMAIL);
      await page.getByLabel(/password/i).fill(PLAYER_PASSWORD);
      await page
        .getByRole("button", { name: /sign in|ingresar|log in/i })
        .click();

      // After login, Nuxt should redirect back to the signup page
      await expect(page).toHaveURL(/\/games\/.+\/signup/);

      // Step 3: Confirm attendance
      const confirmBtn = page.getByRole("button", {
        name: /confirmar asistencia/i,
      });
      await expect(confirmBtn).toBeVisible();
      await confirmBtn.click();

      // Step 4: Roster updates — "Ya estás confirmado" appears
      await expect(page.getByText(/ya estás confirmado/i)).toBeVisible();

      const elapsed = Date.now() - start;
      expect(elapsed).toBeLessThan(60000);
    },
    { timeout: 70000 },
  );
});

// ---------------------------------------------------------------------------
// SC-002: Guest signup form-open-to-roster-update ≤ 30 s
// ---------------------------------------------------------------------------

test.describe("SC-002 — Guest signup flow", () => {
  test.beforeEach(async ({ page }) => {
    await loginAsPlayer(page);
  });

  test(
    "guest signup adds roster row with Invitado por label (SC-002 ≤ 30 s)",
    async ({ page }) => {
      await page.goto(`/games/${SIGNUP_GAME_SLUG}/signup`);

      // Wait for page to be ready
      await expect(page.getByText(/agregar invitado/i).first()).toBeVisible();

      const formStart = Date.now();

      // Open guest form
      await page.getByRole("button", { name: /\+ agregar invitado/i }).click();

      // Fill first name
      await page.getByPlaceholder(/nombre/i).fill("Test");

      // Select a position (pick the first non-blank option)
      const positionSelect = page
        .locator("select")
        .filter({ hasText: /sin posición/i });
      await positionSelect.selectOption({ index: 1 });

      // Confirm
      await page.getByRole("button", { name: /^confirmar$/i }).click();

      // Guest row should appear in roster table: "Inv." prefix and "Invitado por"
      await expect(page.getByText(/invitado por/i)).toBeVisible();
      await expect(page.getByText(/Inv\./i)).toBeVisible();

      const elapsed = Date.now() - formStart;
      expect(elapsed).toBeLessThan(30000);
    },
    { timeout: 40000 },
  );

  test("guest dismiss restores default state without creating a record", async ({
    page,
  }) => {
    await page.goto(`/games/${SIGNUP_GAME_SLUG}/signup`);

    // Wait for the "+ Agregar invitado" link to be visible
    const addGuestBtn = page.getByRole("button", {
      name: /\+ agregar invitado/i,
    });
    await expect(addGuestBtn).toBeVisible();

    // Open guest form
    await addGuestBtn.click();

    // Guest form input should now be visible
    await expect(page.getByPlaceholder(/nombre/i)).toBeVisible();

    // Type something to confirm form is open
    await page.getByPlaceholder(/nombre/i).fill("Should Not");

    // Get initial roster count (count "Inv." badges)
    const rosterBefore = await page.getByText(/Inv\./i).count();

    // Click × to dismiss
    await page.getByRole("button", { name: /✕/i }).click();

    // Form inputs should be gone and the "+" button should be back
    await expect(addGuestBtn).toBeVisible();
    await expect(page.getByPlaceholder(/nombre/i)).not.toBeVisible();

    // Roster row count should be unchanged
    const rosterAfter = await page.getByText(/Inv\./i).count();
    expect(rosterAfter).toBe(rosterBefore);
  });
});

// ---------------------------------------------------------------------------
// Capacity full rejection
// ---------------------------------------------------------------------------

test.describe("Capacity full state", () => {
  test.beforeEach(async ({ page }) => {
    test.skip(
      !FULL_GAME_SLUG,
      "E2E_FULL_GAME_SLUG not set — skipping capacity test",
    );
    await loginAsPlayer(page);
  });

  test("signup page shows capacity full message and hides signup form", async ({
    page,
  }) => {
    await page.goto(`/games/${FULL_GAME_SLUG}/signup`);

    // Capacity banner must appear
    await expect(page.getByText(/el cupo está completo/i)).toBeVisible();

    // Signup actions must NOT be visible
    await expect(
      page.getByRole("button", { name: /confirmar asistencia/i }),
    ).not.toBeVisible();
    await expect(
      page.getByRole("button", { name: /\+ agregar invitado/i }),
    ).not.toBeVisible();
  });

  test("signup page shows Confirmados header and Equipo completo indicator", async ({
    page,
  }) => {
    await page.goto(`/games/${FULL_GAME_SLUG}/signup`);

    await expect(
      page.getByText(/confirmados\s*\(\d+\s*\/\s*\d+\)/i),
    ).toBeVisible();
    await expect(page.getByText(/equipo completo/i)).toBeVisible();
  });
});

test.describe("Public game detail full indicator", () => {
  test.beforeEach(() => {
    test.skip(!FULL_GAME_SLUG, "E2E_FULL_GAME_SLUG not set — skipping test");
  });

  test("public page shows Confirmados header and Equipo completo", async ({
    page,
  }) => {
    await page.goto(`/games/${FULL_GAME_SLUG}`);

    await expect(
      page.getByText(/confirmados\s*\(\d+\s*\/\s*\d+\)/i),
    ).toBeVisible();
    await expect(page.getByText(/equipo completo/i)).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// SC-003: UUID → 301 → slug redirect in a single hop
// ---------------------------------------------------------------------------

test.describe("SC-003 — UUID to slug redirect", () => {
  test.beforeEach(() => {
    test.skip(!GAME_UUID, "E2E_GAME_UUID not set — skipping redirect test");
  });

  test("visiting /games/{uuid} redirects to /games/{slug} in one hop", async ({
    page,
  }) => {
    const redirects = [];

    // Capture all redirect responses
    page.on("response", (response) => {
      if (response.status() === 301 || response.status() === 302) {
        redirects.push(
          `${response.status()} → ${response.headers()["location"] ?? ""}`,
        );
      }
    });

    await page.goto(`/games/${GAME_UUID}`);

    // Final URL must be a slug URL (not a UUID)
    const finalUrl = page.url();
    const uuidPattern =
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;
    expect(uuidPattern.test(finalUrl)).toBe(false);
    expect(finalUrl).toMatch(/\/games\/[^/]+(?:\/)?$/);

    // Must be exactly one redirect (single hop)
    expect(redirects).toHaveLength(1);
    expect(redirects[0]).toMatch(/^301/);
  });
});
