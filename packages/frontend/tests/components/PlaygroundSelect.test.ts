/**
 * Unit tests for PlaygroundSelect component (T034)
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ref } from "vue";

const mockFetchPlaygrounds = vi.fn();
const mockCreatePlayground = vi.fn();

const mockPlaygroundList = ref([
  { id: "pg-1", name: "Alpha Cancha", address: "Av. Alpha 1" },
  { id: "pg-2", name: "Zeta Cancha", address: "Av. Zeta 9" },
]);

vi.mock("~/composables/usePlaygrounds", () => ({
  usePlaygrounds: () => ({
    playgrounds: mockPlaygroundList,
    fetchPlaygrounds: mockFetchPlaygrounds,
    createPlayground: mockCreatePlayground,
  }),
}));

vi.mock("nuxt/app", () => ({
  useRuntimeConfig: () => ({ public: { apiBaseUrl: "http://localhost:5102" } }),
}));

vi.stubGlobal("definePageMeta", vi.fn());

const { default: PlaygroundSelect } = await import("../../src/components/PlaygroundSelect.vue");

describe("PlaygroundSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPlaygrounds.mockResolvedValue(undefined);
    mockCreatePlayground.mockResolvedValue({ id: "pg-new", name: "Nueva", address: "Calle 99" });
  });

  it("renders all playground options from the composable", async () => {
    const wrapper = mount(PlaygroundSelect, { props: { modelValue: null } });
    await flushPromises();

    const options = wrapper.findAll("option");
    const labels = options.map((o) => o.text());
    expect(labels.some((l) => l.includes("Alpha Cancha"))).toBe(true);
    expect(labels.some((l) => l.includes("Zeta Cancha"))).toBe(true);
  });

  it("emits update:modelValue when an option is selected", async () => {
    const wrapper = mount(PlaygroundSelect, { props: { modelValue: null } });
    await flushPromises();

    const select = wrapper.find("select");
    await select.setValue("pg-1");

    expect(wrapper.emitted("update:modelValue")).toBeTruthy();
    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["pg-1"]);
  });

  it("emits null when the empty option is selected", async () => {
    const wrapper = mount(PlaygroundSelect, { props: { modelValue: "pg-1" } });
    await flushPromises();

    const select = wrapper.find("select");
    await select.setValue("");

    expect(wrapper.emitted("update:modelValue")![0]).toEqual([null]);
  });

  it("shows '--' placeholder option when the list is empty", async () => {
    // The '-- Sin cancha --' placeholder always exists
    const wrapper = mount(PlaygroundSelect, { props: { modelValue: null } });
    await flushPromises();
    const options = wrapper.findAll("option");
    expect(options.some((o) => o.text().includes("--"))).toBe(true);
  });

  it("reveals the inline mini-form when 'Agregar nueva…' option is selected", async () => {
    const wrapper = mount(PlaygroundSelect, { props: { modelValue: null } });
    await flushPromises();

    const select = wrapper.find("select");
    await select.setValue("__add_new__");

    expect(wrapper.find("[data-testid='inline-form']").exists()).toBe(true);
  });

  it("calls createPlayground on mini-form submit and emits the new playground id", async () => {
    const wrapper = mount(PlaygroundSelect, { props: { modelValue: null } });
    await flushPromises();

    // Open inline form
    const select = wrapper.find("select");
    await select.setValue("__add_new__");

    // Fill in the form
    const inputs = wrapper.findAll("input");
    await inputs[0]!.setValue("Nueva cancha");
    await inputs[1]!.setValue("Calle 99 Nueva");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(mockCreatePlayground).toHaveBeenCalledWith({
      name: "Nueva cancha",
      address: "Calle 99 Nueva",
    });
    // Emits the newly created id
    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted?.at(-1)).toEqual(["pg-new"]);
  });
});
