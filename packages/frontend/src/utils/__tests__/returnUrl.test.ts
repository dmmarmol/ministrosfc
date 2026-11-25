import { describe, expect, it } from "vitest";
import { resolveReturnUrl } from "../returnUrl";

describe("resolveReturnUrl", () => {
  it.each(["/admin/games", "/players?status=ACTIVE#list"])(
    "accepts an internal path: %s",
    (returnUrl) => {
      expect(resolveReturnUrl(returnUrl, "/admin")).toBe(returnUrl);
    },
  );

  it.each([
    "",
    "//evil.example/path",
    "https://evil.example/path",
    "javascript:alert(1)",
    "/\\evil.example/path",
    "/%5cevil.example/path",
    "/bad%ZZpath",
    "/path\nwith-control",
  ])("rejects an unsafe or malformed path: %s", (returnUrl) => {
    expect(resolveReturnUrl(returnUrl, "/admin/games")).toBe("/admin/games");
  });

  it("uses the configured fallback when the return path is missing", () => {
    expect(resolveReturnUrl("", "/admin/teams")).toBe("/admin/teams");
  });
});
