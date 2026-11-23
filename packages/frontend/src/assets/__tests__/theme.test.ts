import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Tailwind theme dark mode", () => {
  it("applies the existing dark tokens when the root element has .dark", () => {
    const stylesheet = readFileSync(
      resolve(process.cwd(), "src/assets/theme.css"),
      "utf8",
    );

    expect(stylesheet).toMatch(/(?:\[data-theme="dark"\][\s\S]*?,\s*\.dark|\.dark[\s\S]*?,\s*\[data-theme="dark"\])\s*\{/);
    expect(stylesheet).toContain("--ui-bg: #0f1115;");
    expect(stylesheet).toContain("--ui-fg: #e5e7eb;");
  });
});
