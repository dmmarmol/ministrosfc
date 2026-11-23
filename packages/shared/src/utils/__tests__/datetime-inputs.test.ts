import {
  formatDateInput,
  formatTimeInput,
  toISOWithOffset,
} from "../datetime";

describe("date/time input helpers", () => {
  it("returns empty strings for missing values", () => {
    expect(formatDateInput(null)).toBe("");
    expect(formatTimeInput(undefined)).toBe("");
  });

  it("keeps naive and date-only values as written", () => {
    expect(formatDateInput("2026-03-28T14:00:00")).toBe("2026-03-28");
    expect(formatTimeInput("2026-03-28T14:00:00")).toBe("14:00");
    expect(formatDateInput("2026-03-28")).toBe("2026-03-28");
    expect(formatTimeInput("2026-03-28")).toBe("");
  });

  it("round-trips a UTC instant through the form without shifting it", () => {
    const iso = "2026-10-24T22:30:00.000Z";
    const date = formatDateInput(iso);
    const time = formatTimeInput(iso);
    const resubmitted = toISOWithOffset(date, time);

    expect(new Date(resubmitted).getTime()).toBe(new Date(iso).getTime());
  });

  it("round-trips an offset instant", () => {
    const iso = "2026-03-28T14:00:00-03:00";
    const resubmitted = toISOWithOffset(
      formatDateInput(iso),
      formatTimeInput(iso),
    );

    expect(new Date(resubmitted).getTime()).toBe(new Date(iso).getTime());
  });
});
