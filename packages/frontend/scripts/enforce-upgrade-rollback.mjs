#!/usr/bin/env node

import { readFileSync } from "node:fs";
import process from "node:process";

function parseFailures(content) {
  const explicit = content.match(/new\s+failures\s*:\s*(\d+)/i);
  if (explicit) return Number(explicit[1]);

  const failTokens = content.match(/\bFAIL\b/gi);
  if (failTokens) return failTokens.length;

  return 0;
}

function decisionFor(failures) {
  if (failures >= 2) return "rollback";
  if (failures >= 1) return "reconsider";
  return "pass";
}

function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error(
      "Usage: node scripts/enforce-upgrade-rollback.mjs <evidence-file>",
    );
    process.exit(2);
  }

  let content = "";
  try {
    content = readFileSync(filePath, "utf8");
  } catch (error) {
    console.error(`Cannot read evidence file: ${filePath}`);
    process.exit(2);
  }

  const failures = parseFailures(content);
  const decision = decisionFor(failures);

  console.log(`new_failures=${failures}`);
  console.log(`decision=${decision}`);

  if (decision === "rollback") process.exit(10);
  if (decision === "reconsider") process.exit(20);
  process.exit(0);
}

main();
