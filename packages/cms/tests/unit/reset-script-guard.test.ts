/**
 * The database reset script must be impossible to point at production (spec 022, US5).
 * It refuses any Fly app whose name does not end in "-dev", before it talks to Fly.
 * A fake `flyctl` on PATH guarantees no real call can happen during the test.
 */
import { spawnSync } from "child_process";
import { chmodSync, mkdtempSync, writeFileSync } from "fs";
import { tmpdir } from "os";
import { join } from "path";

const script = join(
  __dirname,
  "../../../../scripts/seed-admin/reset-cms-db.sh",
);

function run(env: Record<string, string>) {
  const fakeBin = mkdtempSync(join(tmpdir(), "fake-flyctl-"));
  const fake = join(fakeBin, "flyctl");
  writeFileSync(
    fake,
    "#!/usr/bin/env bash\necho 'fake flyctl called' >&2\nexit 1\n",
  );
  chmodSync(fake, 0o755);

  const result = spawnSync("bash", [script], {
    env: { PATH: `${fakeBin}:/usr/bin:/bin`, DRY_RUN: "1", ...env },
    encoding: "utf8",
  });
  return { status: result.status, output: `${result.stdout}${result.stderr}` };
}

describe("reset-cms-db.sh guard", () => {
  it.each(["ministrosfc-cms", "ministrosfc-cms-prod", "my-app"])(
    "refuses %s before talking to Fly",
    (app) => {
      const { status, output } = run({
        RESET_CONFIRMATION: "RESET_DB",
        CMS_APP_NAME: app,
      });

      expect(status).not.toBe(0);
      expect(output).toMatch(/-dev/);
      expect(output).not.toMatch(/Resetting CMS database/);
      expect(output).not.toMatch(/fake flyctl called/);
    },
  );

  it("refuses when the app name is missing", () => {
    const { status, output } = run({ RESET_CONFIRMATION: "RESET_DB" });

    expect(status).not.toBe(0);
    expect(output).not.toMatch(/fake flyctl called/);
  });

  it("still requires the typed confirmation", () => {
    const { status, output } = run({ CMS_APP_NAME: "ministrosfc-cms-dev" });

    expect(status).not.toBe(0);
    expect(output).toMatch(/RESET_CONFIRMATION/);
  });

  it("lets a development app through the guard", () => {
    const { output } = run({
      RESET_CONFIRMATION: "RESET_DB",
      CMS_APP_NAME: "ministrosfc-cms-dev",
    });

    expect(output).toMatch(
      /Resetting CMS database on Fly app: ministrosfc-cms-dev/,
    );
  });
});
