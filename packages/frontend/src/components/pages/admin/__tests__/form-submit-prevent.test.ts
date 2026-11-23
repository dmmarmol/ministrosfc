import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, resolve } from "node:path";
import { describe, expect, it } from "vitest";

function collectForms(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) {
      return entry === "__tests__" ? [] : collectForms(path);
    }
    return /Form\.vue$/.test(entry) ? [path] : [];
  });
}

describe("admin forms", () => {
  const root = resolve(process.cwd(), "src/components/pages/admin");

  it.each(collectForms(root))(
    "%s prevents the native submit so async handlers and returnUrl redirects complete",
    (file) => {
      const source = readFileSync(file, "utf8");
      const tags = [...source.matchAll(/<form\b[^>]*>/g)].map((m) => m[0]);

      expect(tags.length).toBeGreaterThan(0);
      for (const tag of tags) {
        expect(tag).toMatch(/@submit\.prevent/);
      }
    },
  );
});
