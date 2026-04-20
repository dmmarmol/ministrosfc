import { describe, it, expect, vi, beforeEach } from "vitest";
import { useQueryParams } from "../../../src/composables/useQueryParams";
import {
  useStatsFilters,
  type StatsFilters,
} from "../../../src/composables/useStatsFilters";

type MockRoute = { query: Partial<Record<keyof StatsFilters, string>> };

const pushMock = vi.fn();
const mockRoute: MockRoute = { query: {} };

// Stub Nuxt auto-imports as globals (composables call these without explicit imports)
vi.stubGlobal("useRoute", () => mockRoute);
vi.stubGlobal("useRouter", () => ({ push: pushMock }));
// Real useQueryParams implementation — it will pick up the mocked useRoute/useRouter globals
vi.stubGlobal("useQueryParams", useQueryParams);

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

  // playerStatus default
  it("playerStatus defaults to ACTIVE when absent from URL", () => {
    mockRoute.query = {};
    const { filters, playerStatus } = useStatsFilters();
    expect(filters.value.playerStatus).toBe("ACTIVE");
    expect(playerStatus.value).toBe("ACTIVE");
  });

  it("playerStatus reads value from URL when present", () => {
    mockRoute.query = { playerStatus: "INACTIVE" };
    const { filters, playerStatus } = useStatsFilters();
    expect(filters.value.playerStatus).toBe("INACTIVE");
    expect(playerStatus.value).toBe("INACTIVE");
  });

  it("playerStatus does not override explicit empty string URL value with default", () => {
    // empty string → falls back to ACTIVE default via `||`
    mockRoute.query = { playerStatus: "" };
    const { playerStatus } = useStatsFilters();
    expect(playerStatus.value).toBe("ACTIVE");
  });

  // Writable computeds
  it("setting year writable computed triggers router.push", async () => {
    mockRoute.query = {};
    const { year } = useStatsFilters();
    year.value = "2024";
    // computed setter calls qp.set which calls router.push
    expect(pushMock).toHaveBeenCalledWith({ query: { year: "2024" } });
  });

  it("setting tournament writable computed triggers router.push", async () => {
    mockRoute.query = {};
    const { tournament } = useStatsFilters();
    tournament.value = "Copa de Oro";
    expect(pushMock).toHaveBeenCalledWith({
      query: { tournament: "Copa de Oro" },
    });
  });

  it("setting playerStatus writable computed triggers router.push", async () => {
    mockRoute.query = {};
    const { playerStatus } = useStatsFilters();
    playerStatus.value = "INACTIVE";
    expect(pushMock).toHaveBeenCalledWith({
      query: { playerStatus: "INACTIVE" },
    });
  });

  it("setting playgroundId writable computed triggers router.push", async () => {
    mockRoute.query = {};
    const { playgroundId } = useStatsFilters();
    playgroundId.value = "pg-uuid-1";
    expect(pushMock).toHaveBeenCalledWith({
      query: { playgroundId: "pg-uuid-1" },
    });
  });

  it("all filter keys are present in filters computed", () => {
    const { filters } = useStatsFilters();
    const keys = Object.keys(filters.value);
    expect(keys).toContain("mode");
    expect(keys).toContain("year");
    expect(keys).toContain("tournament");
    expect(keys).toContain("rivalId");
    expect(keys).toContain("playerId");
    expect(keys).toContain("playerStatus");
    expect(keys).toContain("playgroundId");
  });
});
