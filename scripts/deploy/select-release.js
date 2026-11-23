#!/usr/bin/env node
/**
 * Picks a Fly release image for rollback from `flyctl releases --image --json`.
 *
 * CLI: flyctl releases --app <app> --image --json | node select-release.js <current|previous> [version]
 * Prints `<version> <image>` only. The raw JSON is never echoed because it contains
 * user emails and other account data.
 */
const field = (release, ...names) => {
  for (const name of names) {
    if (release[name] !== undefined && release[name] !== null) return release[name];
  }
  return undefined;
};

function normalize(release) {
  const status = String(field(release, "Status", "status") ?? "").toLowerCase();
  const version = Number(field(release, "Version", "version"));
  const image = field(release, "ImageRef", "image_ref", "imageRef", "Image");
  return { status, version, image };
}

function pickRelease(releases, { mode, version } = {}) {
  const all = releases.map(normalize).filter((r) => Number.isFinite(r.version));
  const completed = all
    .filter((r) => r.status === "complete" && r.image)
    .sort((a, b) => b.version - a.version);

  if (completed.length === 0) {
    throw new Error("No completed release with an image was found.");
  }

  if (mode === "current") {
    return { version: completed[0].version, image: completed[0].image };
  }

  if (mode === "previous") {
    if (version !== undefined && version !== "") {
      const wanted = completed.find((r) => r.version === Number(version));
      if (!wanted) {
        throw new Error(`Release v${version} was not found among completed releases.`);
      }
      return { version: wanted.version, image: wanted.image };
    }
    if (completed.length < 2) {
      throw new Error("No previous completed release is available to roll back to.");
    }
    return { version: completed[1].version, image: completed[1].image };
  }

  throw new Error(`Unknown mode "${mode}" (expected "current" or "previous").`);
}

function main(argv) {
  const [mode, version] = argv;
  let input = "";
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (chunk) => (input += chunk));
  process.stdin.on("end", () => {
    try {
      const { version: v, image } = pickRelease(JSON.parse(input), { mode, version });
      console.log(`${v} ${image}`);
    } catch (error) {
      console.error(`select-release: ${error.message}`);
      process.exit(1);
    }
  });
}

if (require.main === module) {
  main(process.argv.slice(2));
}

module.exports = { pickRelease };
