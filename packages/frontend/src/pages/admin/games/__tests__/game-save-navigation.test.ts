import { describe, expect, it } from "vitest";
import { resolveReturnUrl } from "~/utils/returnUrl";

describe("game save navigation destinations", () => {
  it.each([
    ["/admin/players?status=ACTIVE", "/admin/players?status=ACTIVE"],
    ["", "/admin/games"],
    ["https://outside.example", "/admin/games"],
    ["//outside.example", "/admin/games"],
    ["/bad%ZZ", "/admin/games"],
  ])("resolves %s to %s for create and edit saves", (returnUrl, expected) => {
    expect(resolveReturnUrl(returnUrl, "/admin/games")).toBe(expected);
  });
});
