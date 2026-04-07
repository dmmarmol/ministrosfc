/**
 * Unit tests for AddressAutocompleteInput component (T048)
 */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";

vi.mock("nuxt/app", () => ({
  useRuntimeConfig: () => ({ public: { apiBaseUrl: "http://localhost:5102" } }),
}));

vi.stubGlobal("definePageMeta", vi.fn());

const mockFetch = vi.fn();
vi.stubGlobal("$fetch", mockFetch);

const mockSuggestions = [
  {
    displayName: "Av. Corrientes, Buenos Aires, Argentina",
    lat: -34.6037,
    lon: -58.3816,
    placeId: 1,
  },
  {
    displayName: "Av. Corrientes, Rosario, Argentina",
    lat: -32.9587,
    lon: -60.6927,
    placeId: 2,
  },
];

const { default: AddressAutocompleteInput } =
  await import("../../src/components/AddressAutocompleteInput.vue");

describe("AddressAutocompleteInput", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("does not send a request when fewer than 3 chars are typed", async () => {
    const wrapper = mount(AddressAutocompleteInput, {
      props: { modelValue: "" },
    });

    await wrapper.find("input").setValue("ab");
    vi.runAllTimers();
    await flushPromises();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(wrapper.find("[data-testid='suggestions']").exists()).toBe(false);
  });

  it("requests suggestions after 400ms debounce when 3+ chars are typed", async () => {
    mockFetch.mockResolvedValue({ data: mockSuggestions });
    const wrapper = mount(AddressAutocompleteInput, {
      props: { modelValue: "" },
    });

    await wrapper.find("input").setValue("Corrientes");
    vi.advanceTimersByTime(400);
    await flushPromises();

    expect(mockFetch).toHaveBeenCalledOnce();
    const [url, opts] = mockFetch.mock.calls[0] as [
      string,
      { params: { q: string } },
    ];
    expect(url).toContain("/api/v1/address/search");
    expect(opts.params?.q ?? url).toContain("Corrientes");

    const items = wrapper.findAll("[data-testid='suggestion-item']");
    expect(items).toHaveLength(2);
  });

  it("emits update:modelValue and select when a suggestion is clicked", async () => {
    mockFetch.mockResolvedValue({ data: mockSuggestions });
    const wrapper = mount(AddressAutocompleteInput, {
      props: { modelValue: "" },
    });

    await wrapper.find("input").setValue("Corrientes");
    vi.advanceTimersByTime(400);
    await flushPromises();

    await wrapper
      .findAll("[data-testid='suggestion-item']")[0]!
      .trigger("click");

    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    const allEmissions = wrapper.emitted("update:modelValue")!;
    expect(allEmissions[allEmissions.length - 1]).toEqual([
      "Av. Corrientes, Buenos Aires, Argentina",
    ]);

    expect(wrapper.emitted("select")).toBeTruthy();
    const allSelectEmissions = wrapper.emitted("select")!;
    expect(allSelectEmissions[allSelectEmissions.length - 1]).toEqual([mockSuggestions[0]]);
  });

  it("closes dropdown without changing input on Escape key", async () => {
    mockFetch.mockResolvedValue({ data: mockSuggestions });
    const wrapper = mount(AddressAutocompleteInput, {
      props: { modelValue: "Corrientes" },
    });

    await wrapper.find("input").setValue("Corrientes");
    vi.advanceTimersByTime(400);
    await flushPromises();

    expect(wrapper.find("[data-testid='suggestions']").exists()).toBe(true);

    await wrapper.find("input").trigger("keydown", { key: "Escape" });

    expect(wrapper.find("[data-testid='suggestions']").exists()).toBe(false);
    // Input value unchanged
    expect((wrapper.find("input").element as HTMLInputElement).value).toBe(
      "Corrientes",
    );
  });

  it("shows 'Sin resultados' when API returns empty array", async () => {
    mockFetch.mockResolvedValue({ data: [] });
    const wrapper = mount(AddressAutocompleteInput, {
      props: { modelValue: "" },
    });

    await wrapper.find("input").setValue("Zzzzz");
    vi.advanceTimersByTime(400);
    await flushPromises();

    expect(wrapper.text()).toContain("Sin resultados");
  });

  it("shows error message and keeps input editable when API fails", async () => {
    mockFetch.mockRejectedValue(new Error("503"));
    const wrapper = mount(AddressAutocompleteInput, {
      props: { modelValue: "" },
    });

    await wrapper.find("input").setValue("Corrientes");
    vi.advanceTimersByTime(400);
    await flushPromises();

    expect(wrapper.text()).toContain(
      "No se pueden cargar sugerencias en este momento",
    );
    expect(wrapper.find("input").element.disabled).toBe(false);
  });

  it("shows OSM attribution whenever the dropdown is open", async () => {
    mockFetch.mockResolvedValue({ data: mockSuggestions });
    const wrapper = mount(AddressAutocompleteInput, {
      props: { modelValue: "" },
    });

    await wrapper.find("input").setValue("Corrientes");
    vi.advanceTimersByTime(400);
    await flushPromises();

    expect(wrapper.text()).toContain("© OpenStreetMap contributors");
  });

  it("closes the dropdown after selecting a suggestion", async () => {
    mockFetch.mockResolvedValue({ data: mockSuggestions });
    const wrapper = mount(AddressAutocompleteInput, {
      props: { modelValue: "" },
    });

    await wrapper.find("input").setValue("Corrientes");
    vi.advanceTimersByTime(400);
    await flushPromises();

    await wrapper
      .findAll("[data-testid='suggestion-item']")[0]!
      .trigger("click");

    expect(wrapper.find("[data-testid='suggestions']").exists()).toBe(false);
  });
});
