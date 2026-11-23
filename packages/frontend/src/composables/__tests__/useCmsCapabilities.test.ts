import { beforeEach, describe, expect, it, vi } from "vitest";

const mockFetch = vi.fn();
vi.stubGlobal("$fetch", mockFetch);

vi.mock("nuxt/app", () => ({
  useRuntimeConfig: () => ({ public: { apiBaseUrl: "http://localhost:5102" } }),
}));

const { useCmsCapabilities } = await import("../useCmsCapabilities");

describe("useCmsCapabilities", () => {
  beforeEach(() => mockFetch.mockReset());

  it("starts with photo uploads disabled until the config is loaded", () => {
    const { photoUploadsEnabled, loaded } = useCmsCapabilities();

    expect(photoUploadsEnabled.value).toBe(false);
    expect(loaded.value).toBe(false);
  });

  it("enables photo uploads when the API reports them enabled", async () => {
    mockFetch.mockResolvedValueOnce({ photoUploadsEnabled: true });
    const { photoUploadsEnabled, loaded, load } = useCmsCapabilities();

    await load();

    expect(mockFetch).toHaveBeenCalledWith("http://localhost:5102/api/v1/config");
    expect(photoUploadsEnabled.value).toBe(true);
    expect(loaded.value).toBe(true);
  });

  it("keeps photo uploads disabled when the API reports them disabled", async () => {
    mockFetch.mockResolvedValueOnce({ photoUploadsEnabled: false });
    const { photoUploadsEnabled, load } = useCmsCapabilities();

    await load();

    expect(photoUploadsEnabled.value).toBe(false);
  });

  it("falls back to disabled when the request fails", async () => {
    mockFetch.mockRejectedValueOnce(new Error("network"));
    const { photoUploadsEnabled, loaded, load } = useCmsCapabilities();

    await load();

    expect(photoUploadsEnabled.value).toBe(false);
    expect(loaded.value).toBe(true);
  });

  it("treats anything other than true as disabled", async () => {
    mockFetch.mockResolvedValueOnce({ photoUploadsEnabled: "yes" });
    const { photoUploadsEnabled, load } = useCmsCapabilities();

    await load();

    expect(photoUploadsEnabled.value).toBe(false);
  });
});
