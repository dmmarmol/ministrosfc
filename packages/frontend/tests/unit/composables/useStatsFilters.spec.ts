import { describe, it, expect, vi, beforeEach } from "vitest";
import { useStatsFilters } from "../../../src/composables/useStatsFilters";

const pushMock = vi.fn();
const mockRoute = { query: {} as Record<string, string> };

vi.mock("vue-router", () => ({
  useRoute: () => mockRoute,
  useRouter: () => ({ push: pushMock }),
}));

describe("useStatsFilters", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRoute.query = {};
  });

  it("initializes from empty URL params", () => {
    const { filters } = useStatsFilters();
    expect(filters.value.year).toBe("");
    expect(filters.value.mode).toBe("");
    expect(filters.value.rivalId).toBe("");
  });

  it("reads filters from URL query params on mount", () => {
    mockRoute.query = { year: "2023", rivalId: "abc-123", mode: "rivals" };
    const { filters } = useStatsFilters();
    expect(filters.value.year).toBe("2023");
    expect(filters.value.rivalId).toBe("abc-123");
    expect(filters.value.mode).toBe("rivals");
  });

  it("setFilter calls router.push with merged query", async () => {
    mockRoute.query = { year: "2023" };
    const { setFilter } = useStatsFilters();
    await setFilter("rivalId", "xyz");
    expect(pushMock).toHaveBeenCalledWith({
      query: { year: "2023", rivalId: "xyz" },
    });
  });

  it("setFilter removes key when value is empty string", async () => {
    mockRoute.query = { year: "2023", rivalId: "xyz" };
    const { setFilter } = useStatsFilters();
    await setFilter("rivalId", "");
    expect(pushMock).toHaveBeenCalledWith({
      query: { year: "2023" },
    });
  });

  it("resetFilters clears all query params", async () => {
    mockRoute.query = { year: "2023", rivalId: "xyz" };
    const { resetFilters } = useStatsFilters();
    await resetFilters();
    expect(pushMock).toHaveBeenCalledWith({ query: {} });
  });

  it("ignores invalid/unexpected query params gracefully", () => {
    mockRoute.query = { year: "not-a-year", mode: "invalid-mode" };
    const { filters } = useStatsFilters();
    expect(filters.value.year).toBe("not-a-year");
    expect(filters.value.mode).toBe("invalid-mode");
  });
});
