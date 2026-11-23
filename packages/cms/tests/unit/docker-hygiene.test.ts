/**
 * Image hygiene (spec 022, US4): container images must never contain `.env` files or
 * credentials. Secrets reach the apps only at run time (Fly secrets).
 */
import { existsSync, readFileSync } from "fs";
import { join } from "path";

const root = join(__dirname, "../../../..");
const read = (relative: string) => readFileSync(join(root, relative), "utf8");

const dockerfiles = ["packages/cms/Dockerfile", "packages/frontend/Dockerfile"];
const dockerignores = [".dockerignore", "packages/cms/.dockerignore", "packages/frontend/.dockerignore"];

describe("Dockerfiles", () => {
  it.each(dockerfiles)("%s exists", (file) => {
    expect(existsSync(join(root, file))).toBe(true);
  });

  it.each(dockerfiles)("%s never copies .env files into the image", (file) => {
    const copies = read(file)
      .split("\n")
      .filter((line) => /^\s*(COPY|ADD)\b/i.test(line));

    for (const line of copies) {
      expect(line).not.toMatch(/\.env/i);
    }
  });

  it.each(dockerfiles)("%s does not bake secrets in with ENV or ARG", (file) => {
    const declarations = read(file)
      .split("\n")
      .filter((line) => /^\s*(ENV|ARG)\b/i.test(line));

    for (const line of declarations) {
      expect(line).not.toMatch(/(SECRET|PASSWORD|TOKEN|PRIVATE_KEY|API_KEY|DATABASE_URL|JWT)/i);
    }
  });
});

describe(".dockerignore files", () => {
  it.each(dockerignores)("%s excludes .env files", (file) => {
    const patterns = read(file)
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"));

    expect(patterns).toContain(".env*");
  });
});
