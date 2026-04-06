import { formatAvailableRanges } from "../jersey";

describe("formatAvailableRanges", () => {
  it("returns all numbers as ranges when taken list is empty", () => {
    const result = formatAvailableRanges([], 1, 5);
    expect(result).toBe("1-5");
  });

  it("returns empty string when all numbers are taken", () => {
    const taken = Array.from({ length: 99 }, (_, i) => i + 1);
    expect(formatAvailableRanges(taken)).toBe("");
  });

  it("returns empty string when all numbers in custom range are taken", () => {
    expect(formatAvailableRanges([1, 2, 3], 1, 3)).toBe("");
  });

  it("collapses consecutive available numbers into ranges", () => {
    // taken: 2,3 → available: 1, 4-5
    expect(formatAvailableRanges([2, 3], 1, 5)).toBe("1, 4-5");
  });

  it("handles sparse taken list with multiple gaps", () => {
    // taken: 2, 5, 10 → available: 1, 3-4, 6-9, 11-99 (default range)
    const result = formatAvailableRanges([2, 5, 10]);
    expect(result).toBe("1, 3-4, 6-9, 11-99");
  });

  it("returns only a single number when one number is available", () => {
    // taken: 1, 3-99 → available: 2
    const taken = Array.from({ length: 99 }, (_, i) => i + 1).filter(
      (n) => n !== 2,
    );
    expect(formatAvailableRanges(taken)).toBe("2");
  });

  it("includes boundary value 1 when not taken", () => {
    const result = formatAvailableRanges([2, 3, 4, 5], 1, 5);
    expect(result).toBe("1");
  });

  it("includes boundary value 99 when not taken", () => {
    // taken: 1-98 → available: 99
    const taken = Array.from({ length: 98 }, (_, i) => i + 1);
    expect(formatAvailableRanges(taken)).toBe("99");
  });

  it("handles taken numbers outside the range (ignores them)", () => {
    // taken includes 0 and 100 which are outside 1-99 — should not affect result
    expect(formatAvailableRanges([0, 100], 1, 3)).toBe("1-3");
  });

  it("produces the example from the spec: 1, 3, 15-32, 34-60, 62-99", () => {
    const taken = [
      2,
      ...Array.from({ length: 14 }, (_, i) => i + 4), // 4-17 ... wait, let me compute
    ];
    // spec example: available = 1, 3, 15-32, 34-60, 62-99
    // so taken = 2, 4-14, 33, 61
    const specTaken = [
      2,
      ...Array.from({ length: 11 }, (_, i) => i + 4), // 4-14
      33,
      61,
    ];
    expect(formatAvailableRanges(specTaken)).toBe("1, 3, 15-32, 34-60, 62-99");
  });

  it("respects custom min and max parameters", () => {
    expect(formatAvailableRanges([5], 3, 7)).toBe("3-4, 6-7");
  });
});
