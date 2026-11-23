import { describe, expect, it } from "vitest";
import { formatCompetitionType, formatDateRange } from "../stats";

describe("stats display formatting", () => {
  it("uses the shared Spanish label for competition types", () => {
    expect(formatCompetitionType("FRIENDLY")).toBe("Amistoso");
  });

  it("formats open-ended tournament dates in Spanish", () => {
    expect(formatDateRange("2025-04-15", null)).toMatch(/^Desde /);
  });
});
