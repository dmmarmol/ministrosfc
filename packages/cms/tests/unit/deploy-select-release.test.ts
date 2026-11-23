/**
 * Unit tests for scripts/deploy/select-release.js — picks the Fly release image
 * to restore on rollback (spec 022, US1). Only version and image are ever used;
 * the raw release JSON (which contains user emails) is never printed.
 */
const { pickRelease } = require("../../../../scripts/deploy/select-release");

const releases = [
  { Version: 7, Status: "failed", ImageRef: "registry.fly.io/app:deployment-7" },
  { Version: 6, Status: "complete", ImageRef: "registry.fly.io/app:deployment-6" },
  { Version: 5, Status: "complete", ImageRef: "registry.fly.io/app:deployment-5" },
  { Version: 4, Status: "complete", ImageRef: "registry.fly.io/app:deployment-4" },
];

describe("pickRelease", () => {
  it("'current' returns the newest completed release", () => {
    expect(pickRelease(releases, { mode: "current" })).toEqual({
      version: 6,
      image: "registry.fly.io/app:deployment-6",
    });
  });

  it("'previous' skips the newest completed release and failed ones", () => {
    expect(pickRelease(releases, { mode: "previous" })).toEqual({
      version: 5,
      image: "registry.fly.io/app:deployment-5",
    });
  });

  it("'previous' with a version returns exactly that release", () => {
    expect(pickRelease(releases, { mode: "previous", version: "4" })).toEqual({
      version: 4,
      image: "registry.fly.io/app:deployment-4",
    });
  });

  it("rejects a version that is missing or not completed", () => {
    expect(() => pickRelease(releases, { mode: "previous", version: "7" })).toThrow(/not found|completed/i);
    expect(() => pickRelease(releases, { mode: "previous", version: "99" })).toThrow(/not found|completed/i);
  });

  it("fails clearly when there is no earlier release", () => {
    expect(() => pickRelease([releases[1]], { mode: "previous" })).toThrow(/no previous/i);
  });

  it("fails clearly when there is no completed release at all", () => {
    expect(() => pickRelease([releases[0]], { mode: "current" })).toThrow(/no completed/i);
  });

  it("accepts lower-case field names and mixed-case status", () => {
    const lower = [
      { version: 2, status: "Complete", image_ref: "img:2" },
      { version: 1, status: "complete", image_ref: "img:1" },
    ];
    expect(pickRelease(lower, { mode: "previous" })).toEqual({ version: 1, image: "img:1" });
  });

  it("ignores completed releases that have no image reference", () => {
    const noImage = [
      { Version: 3, Status: "complete" },
      { Version: 2, Status: "complete", ImageRef: "img:2" },
    ];
    expect(pickRelease(noImage, { mode: "current" })).toEqual({ version: 2, image: "img:2" });
  });
});
