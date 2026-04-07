import { describe, it, expect, vi, beforeEach } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("$fetch", mockFetch);

vi.mock("nuxt/app", () => ({
  useRuntimeConfig: () => ({ public: { apiBaseUrl: "http://localhost:5102" } }),
}));

vi.mock("~/stores/auth", () => ({
  useAuthStore: () => ({ accessToken: "test-token" }),
}));

const { usePlaygrounds } = await import("./usePlaygrounds");

const mockPlaygrounds = [
  {
    id: "pg-1",
    name: "Cancha Norte",
    address: "Av. Corrientes 1234",
    latitude: -34.6,
    longitude: -58.3,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    createdById: "u1",
    updatedById: null,
    gameCount: 0,
  },
];

describe("usePlaygrounds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("fetchPlaygrounds", () => {
    it("populates the playgrounds ref and sets loading correctly", async () => {
      mockFetch.mockResolvedValueOnce({ data: mockPlaygrounds });

      const { playgrounds, loading, fetchPlaygrounds } = usePlaygrounds();

      expect(loading.value).toBe(false);
      const promise = fetchPlaygrounds();
      expect(loading.value).toBe(true);
      await promise;

      expect(loading.value).toBe(false);
      expect(playgrounds.value).toHaveLength(1);
      expect(playgrounds.value[0]!.name).toBe("Cancha Norte");
    });

    it("sets error ref on API failure", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network error"));

      const { error, fetchPlaygrounds } = usePlaygrounds();
      await fetchPlaygrounds();

      expect(error.value).toBeTruthy();
    });
  });

  describe("createPlayground", () => {
    it("calls POST then re-fetches and returns the new record", async () => {
      const newPlayground = { ...mockPlaygrounds[0]!, id: "pg-new" };
      // First call: POST → returns the new playground
      mockFetch.mockResolvedValueOnce({ data: newPlayground });
      // Second call: GET → re-fetches the list
      mockFetch.mockResolvedValueOnce({ data: [newPlayground] });

      const { playgrounds, createPlayground } = usePlaygrounds();
      const result = await createPlayground({ name: "Nueva", address: "Av. 99" });

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(result.id).toBe("pg-new");
      expect(playgrounds.value).toHaveLength(1);
    });
  });

  describe("deletePlayground", () => {
    it("calls DELETE then re-fetches", async () => {
      // DELETE call
      mockFetch.mockResolvedValueOnce(undefined);
      // GET re-fetch
      mockFetch.mockResolvedValueOnce({ data: [] });

      const { playgrounds, deletePlayground } = usePlaygrounds();
      await deletePlayground("pg-1");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      expect(playgrounds.value).toHaveLength(0);

      const deleteCall = mockFetch.mock.calls[0];
      expect(deleteCall![0]).toContain("/api/v1/playgrounds/pg-1");
      expect(deleteCall![1]?.method).toBe("DELETE");
    });
  });
});
