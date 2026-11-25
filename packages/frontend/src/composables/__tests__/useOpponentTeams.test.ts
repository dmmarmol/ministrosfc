import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("$fetch", mockFetch);

vi.mock("nuxt/app", () => ({
  useRuntimeConfig: () => ({ public: { apiBaseUrl: "http://localhost:5102" } }),
}));

vi.mock("~/stores/auth", () => ({
  useAuthStore: () => ({ accessToken: "test-token" }),
}));

const { useOpponentTeams } = await import("../useOpponentTeams");

const team = (id: string) => ({ id, name: `Team ${id}` });

describe("useOpponentTeams.fetchOpponentTeams", () => {
  beforeEach(() => mockFetch.mockReset());

  it("walks every page so teams beyond the first page are selectable", async () => {
    mockFetch
      .mockResolvedValueOnce({ data: [team("1"), team("2")], meta: { totalPages: 2 } })
      .mockResolvedValueOnce({ data: [team("3")], meta: { totalPages: 2 } });

    const { fetchOpponentTeams, opponentTeams } = useOpponentTeams();
    const result = await fetchOpponentTeams();

    expect(result.map((t) => t.id)).toEqual(["1", "2", "3"]);
    expect(opponentTeams.value).toHaveLength(3);
    expect(mockFetch).toHaveBeenCalledTimes(2);
    expect(mockFetch.mock.calls[1][1].query).toEqual({ page: 2, limit: 100 });
  });

  it("stops after one request when the response has no pagination meta", async () => {
    mockFetch.mockResolvedValueOnce({ data: [team("1")] });

    const { fetchOpponentTeams } = useOpponentTeams();
    await fetchOpponentTeams();

    expect(mockFetch).toHaveBeenCalledTimes(1);
  });
});
