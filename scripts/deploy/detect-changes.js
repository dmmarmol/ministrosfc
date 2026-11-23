#!/usr/bin/env node
/**
 * Decides which apps a push must deploy.
 *
 * Usage (CLI, from the deploy workflow):
 *   node scripts/deploy/detect-changes.js <before-sha> <after-sha>
 * Writes `deploy`, `cms` and `frontend` (true|false) to $GITHUB_OUTPUT (when set)
 * and prints them. The workflow deploys only the apps flagged here (CMS and frontend can
 * ship separately); `deploy` is true when either changed. If the diff cannot be computed (new branch, force push,
 * unknown commit) it deploys both apps: shipping too much is safer than too little.
 *
 * See specs/022-first-production-release/contracts/deployment-pipeline.md.
 */
const { execFileSync } = require("node:child_process");
const { appendFileSync } = require("node:fs");

const ZERO_SHA = "0000000000000000000000000000000000000000";

/** Files that never change what runs in production. */
function isDocumentationOnly(file) {
  return (
    /\.md$/i.test(file) ||
    file.startsWith("docs/") ||
    file.startsWith("specs/") ||
    file.startsWith(".claude/") ||
    file.startsWith(".specify/")
  );
}

function classifyChanges(files) {
  let cms = false;
  let frontend = false;

  for (const file of files) {
    if (isDocumentationOnly(file)) continue;

    if (
      file === "package.json" ||
      file === "package-lock.json" ||
      file.startsWith("packages/shared/") ||
      file === ".github/workflows/deploy.yml" ||
      file.startsWith("scripts/deploy/")
    ) {
      cms = true;
      frontend = true;
    } else if (file.startsWith("packages/cms/")) {
      cms = true;
    } else if (file.startsWith("packages/frontend/")) {
      frontend = true;
    }
  }

  return { cms, frontend };
}

/**
 * Whether anything deployable changed (either app). The base commit passed to the CLI is the
 * last successful deployment run, not just the current push, so an app changed in a replaced
 * (superseded) pending run is still picked up by the next run.
 */
function shouldDeploy(files) {
  const { cms, frontend } = classifyChanges(files);
  return cms || frontend;
}

function changedFiles(before, after) {
  const out = execFileSync("git", ["diff", "--name-only", before, after], {
    encoding: "utf8",
  });
  return out
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function main(argv) {
  const [before, after] = argv;
  if (!after) {
    console.error("Usage: detect-changes.js <before-sha> <after-sha>");
    process.exit(2);
  }

  let result;
  if (!before || before === ZERO_SHA) {
    result = { cms: true, frontend: true };
  } else {
    try {
      result = classifyChanges(changedFiles(before, after));
    } catch {
      result = { cms: true, frontend: true };
    }
  }

  const lines = [
    `deploy=${result.cms || result.frontend}`,
    `cms=${result.cms}`,
    `frontend=${result.frontend}`,
  ];
  console.log(lines.join("\n"));
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `${lines.join("\n")}\n`);
  }
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = {
  classifyChanges,
  shouldDeploy,
  isDocumentationOnly,
  ZERO_SHA,
};
