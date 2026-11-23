import { execSync } from "node:child_process";
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

  it("remaps the gray scale and surface tokens so hard-coded gray utilities stay legible in dark mode", () => {
    const stylesheet = readFileSync(
      resolve(process.cwd(), "src/assets/theme.css"),
      "utf8",
    );
    const dark = stylesheet.slice(stylesheet.indexOf(".dark {"));

    expect(dark).toContain("--surface:");
    expect(dark).toContain("--color-gray-50: #12151a;");
    expect(dark).toContain("--color-gray-900: #f1f3f6;");
  });

  it("does not use hard-coded white or near-black backgrounds in components", () => {
    const offenders = execSync(
      "grep -rEl '(^|[^/:\\w-])bg-(white|gray-900|gray-800)([^/\\w-]|$)' src/components src/pages src/layouts || true",
      { cwd: process.cwd(), encoding: "utf8" },
    ).trim();

    expect(offenders).toBe("");
  });
});
