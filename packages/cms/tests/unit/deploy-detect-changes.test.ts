/**
 * Unit tests for scripts/deploy/detect-changes.js — decides which apps the
 * deploy workflow must ship for a push (spec 022, US1).
 */
const { classifyChanges, shouldDeploy, ZERO_SHA } = require("../../../../scripts/deploy/detect-changes");

describe("classifyChanges", () => {
  it("deploys only the CMS for CMS source changes", () => {
    expect(classifyChanges(["packages/cms/src/main.ts"])).toEqual({ cms: true, frontend: false });
  });

  it("deploys only the frontend for frontend changes", () => {
    expect(classifyChanges(["packages/frontend/src/pages/index.vue"])).toEqual({
      cms: false,
      frontend: true,
    });
  });

  it("deploys both apps when the shared package changes", () => {
    expect(classifyChanges(["packages/shared/src/types/game.ts"])).toEqual({
      cms: true,
      frontend: true,
    });
  });

  it.each(["package.json", "package-lock.json"])("deploys both apps when %s changes", (file) => {
    expect(classifyChanges([file])).toEqual({ cms: true, frontend: true });
  });

  it("treats an app's Fly files and Dockerfile as that app's files", () => {
    expect(classifyChanges(["packages/cms/fly.production.toml"])).toEqual({ cms: true, frontend: false });
    expect(classifyChanges(["packages/frontend/Dockerfile"])).toEqual({ cms: false, frontend: true });
  });

  it("deploys both apps when the pipeline itself changes", () => {
    expect(classifyChanges([".github/workflows/deploy.yml"])).toEqual({ cms: true, frontend: true });
    expect(classifyChanges(["scripts/deploy/smoke-test.sh"])).toEqual({ cms: true, frontend: true });
  });

  it("deploys nothing for documentation-only changes", () => {
    expect(
      classifyChanges([
        "README.md",
        "docs/guides/DEPLOYMENT.md",
        "specs/022-first-production-release/spec.md",
        "packages/cms/README.md",
        "packages/frontend/CHANGELOG.md",
        ".claude/skills/create-pr/SKILL.md",
      ]),
    ).toEqual({ cms: false, frontend: false });
  });

  it("deploys nothing for unrelated workflows and an empty change list", () => {
    expect(classifyChanges([".github/workflows/ci-cms.yml"])).toEqual({ cms: false, frontend: false });
    expect(classifyChanges([])).toEqual({ cms: false, frontend: false });
  });

  it("combines results across many files", () => {
    expect(
      classifyChanges(["packages/cms/src/a.ts", "packages/frontend/src/b.vue", "docs/x.md"]),
    ).toEqual({ cms: true, frontend: true });
  });
});

describe("shouldDeploy", () => {
  it("is true when any application file changed, because both apps are deployed together", () => {
    expect(shouldDeploy(["packages/cms/src/main.ts"])).toBe(true);
    expect(shouldDeploy(["packages/frontend/src/pages/index.vue"])).toBe(true);
    expect(shouldDeploy(["packages/shared/src/types/game.ts"])).toBe(true);
  });

  it("is false for documentation-only or unrelated changes", () => {
    expect(shouldDeploy(["README.md", "docs/guides/DEPLOYMENT.md"])).toBe(false);
    expect(shouldDeploy([".github/workflows/ci-cms.yml"])).toBe(false);
    expect(shouldDeploy([])).toBe(false);
  });
});

describe("ZERO_SHA", () => {
  it("is the all-zero commit id GitHub sends for new branches", () => {
    expect(ZERO_SHA).toBe("0000000000000000000000000000000000000000");
  });
});
