import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import messages from "../../i18n/locales/es.json";

const SRC = join(__dirname, "../../src");
// t("key") / t('key') with a literal key; dynamic keys are out of reach here
const CALL = /\bt\(\s*(["'])([A-Za-z][\w.]*)\1/g;
// "cond ? 'a.b' : 'c.d'" inside t(...)
const TERNARY = /\bt\([^()]*\?\s*(["'])([A-Za-z][\w.]*)\1\s*:\s*(["'])([A-Za-z][\w.]*)\3/g;

function walk(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory())
      return name === "__tests__" ? [] : walk(path);
    return /\.(vue|ts)$/.test(name) ? [path] : [];
  });
}

function has(key: string): boolean {
  let node: unknown = messages;
  for (const part of key.split(".")) {
    if (typeof node !== "object" || node === null) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return typeof node === "string";
}

describe("i18n messages", () => {
  it("defines every key that the source asks t() for", () => {
    const missing: string[] = [];
    for (const file of walk(SRC)) {
      const source = readFileSync(file, "utf8");
      for (const m of source.matchAll(CALL))
        if (m[2]!.includes(".") && !has(m[2]!)) missing.push(`${file}: ${m[2]}`);
      for (const m of source.matchAll(TERNARY))
        for (const key of [m[2]!, m[4]!])
          if (!has(key)) missing.push(`${file}: ${key}`);
    }
    expect(missing).toEqual([]);
  });
});
