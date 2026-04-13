import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("admin create game page - Wave 4 source contract", () => {
  const filePath = resolve(__dirname, "../../src/pages/admin/games/create.vue");
  const source = readFileSync(filePath, "utf8");

  it("imports DEFAULT_MAX_PLAYERS and sets maxPlayers default to 16 constant", () => {
    expect(source).toContain(
      'import { DEFAULT_MAX_PLAYERS } from "@ministrosfc/shared";',
    );
    expect(source).toContain(
      "maxPlayers: DEFAULT_MAX_PLAYERS as number | null",
    );
  });

  it("submits maxPlayers as null when input is cleared (NaN coercion)", () => {
    expect(source).toContain("Number.isNaN(form.maxPlayers as any)");
    expect(source).toContain("? null");
    expect(source).toContain(": (form.maxPlayers ?? null)");
  });

  it("renders Cupo máximo numeric input with min=1 and step=1", () => {
    expect(source).toContain("Cupo máximo");
    expect(source).toContain('v-model.number="form.maxPlayers"');
    expect(source).toContain('type="number"');
    expect(source).toContain('min="1"');
    expect(source).toContain('step="1"');
    expect(source).toContain('placeholder="Sin límite"');
  });
});
