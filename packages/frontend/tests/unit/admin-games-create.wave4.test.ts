import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("admin create game page - Wave 4 source contract", () => {
  const createPagePath = resolve(
    __dirname,
    "../../src/pages/admin/games/create.vue",
  );
  const gameFormPath = resolve(
    __dirname,
    "../../src/components/pages/admin/games/GameForm.vue",
  );
  const gameFormFieldsPath = resolve(
    __dirname,
    "../../src/components/pages/admin/games/GameFormFields.vue",
  );
  const createPageSource = readFileSync(createPagePath, "utf8");
  const gameFormSource = readFileSync(gameFormPath, "utf8");
  const gameFormFieldsSource = readFileSync(gameFormFieldsPath, "utf8");

  it("imports DEFAULT_MAX_PLAYERS and sets maxPlayers default to 16 constant", () => {
    expect(gameFormSource).toContain("DEFAULT_MAX_PLAYERS");
    expect(gameFormSource).toContain('from "@ministrosfc/shared";');
    expect(gameFormSource).toContain(
      "maxPlayers: DEFAULT_MAX_PLAYERS as number | null",
    );
  });

  it("submits maxPlayers as null when input is cleared (NaN coercion)", () => {
    expect(createPageSource).toContain("Number.isNaN(payload.maxPlayers as any)");
    expect(createPageSource).toContain("? null");
    expect(createPageSource).toContain(": (payload.maxPlayers ?? null)");
  });

  it("renders Cupo máximo numeric input with min=1 and step=1", () => {
    expect(gameFormFieldsSource).toContain("Cupo máximo");
    expect(gameFormFieldsSource).toContain('v-model.number="form.maxPlayers"');
    expect(gameFormFieldsSource).toContain('type="number"');
    expect(gameFormFieldsSource).toContain('min="1"');
    expect(gameFormFieldsSource).toContain('step="1"');
    expect(gameFormFieldsSource).toContain('placeholder="Sin límite"');
  });
});
