/**
 * Unit tests for PlaygroundSelect component (thin adapter over DropdownAddMore)
 *
 * These tests verify the adapter behaviour only: composable wiring, option
 * mapping, v-model forwarding, and the inline-create slot calling createPlayground.
 * Deep DropdownAddMore logic is covered in DropdownAddMore.test.ts.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount, flushPromises } from "@vue/test-utils";
import { ref } from "vue";

const mockFetchPlaygrounds = vi.fn();
const mockCreatePlayground = vi.fn();
const mockLoading = ref(false);

const mockPlaygroundList = ref([
  { id: "pg-1", name: "Alpha Cancha", address: "Av. Alpha 1" },
  { id: "pg-2", name: "Zeta Cancha", address: "Av. Zeta 9" },
]);

vi.mock("~/composables/usePlaygrounds", () => ({
  usePlaygrounds: () => ({
    playgrounds: mockPlaygroundList,
    loading: mockLoading,
    fetchPlaygrounds: mockFetchPlaygrounds,
    createPlayground: mockCreatePlayground,
  }),
}));

vi.mock("nuxt/app", () => ({
  useRuntimeConfig: () => ({ public: { apiBaseUrl: "http://localhost:5102" } }),
}));

// Mock vue-select exactly as in DropdownAddMore.test.ts so the stub renders
// list-footer and no-options slots inline (no teleport / dropdown state needed).
vi.mock("vue-select", async () => {
  const { defineComponent, h } = await import("vue");
  return {
    default: defineComponent({
      name: "VSelect",
      props: [
        "modelValue",
        "options",
        "loading",
        "searchable",
        "disabled",
        "placeholder",
        "clearable",
        "deselectFromDropdown",
        "appendToBody",
        "label",
        "reduce",
      ],
      emits: ["option:selected", "update:modelValue"],
      setup(_props, { slots }) {
        return () =>
          h("div", { class: "v-select-stub" }, [
            slots["no-options"]?.({ search: "" }) ?? null,
            slots["list-footer"]?.() ?? null,
          ]);
      },
    }),
  };
});

import VSelect from "vue-select";

vi.stubGlobal("definePageMeta", vi.fn());

const { default: PlaygroundSelect } =
  await import("../../src/components/PlaygroundSelect.vue");

describe("PlaygroundSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockFetchPlaygrounds.mockResolvedValue(undefined);
    mockCreatePlayground.mockResolvedValue({
      id: "pg-new",
      name: "Nueva",
      address: "Calle 99",
    });
  });

  it("calls fetchPlaygrounds on mount", async () => {
    mount(PlaygroundSelect, { props: { modelValue: null } });
    await flushPromises();
    expect(mockFetchPlaygrounds).toHaveBeenCalledOnce();
  });

  it("maps playgrounds to DropdownOption[] with label = 'name — address'", async () => {
    const wrapper = mount(PlaygroundSelect, { props: { modelValue: null } });
    await flushPromises();

    const opts = wrapper.findComponent(VSelect).props("options") as Array<{
      id: string;
      label: string;
    }>;
    expect(opts.some((o) => o.label === "Alpha Cancha — Av. Alpha 1")).toBe(
      true,
    );
    expect(opts.some((o) => o.label === "Zeta Cancha — Av. Zeta 9")).toBe(true);
  });

  it("re-emits update:modelValue when VSelect fires option:selected", async () => {
    const wrapper = mount(PlaygroundSelect, { props: { modelValue: null } });
    await flushPromises();

    await wrapper.findComponent(VSelect).vm.$emit("option:selected", {
      id: "pg-1",
      label: "Alpha Cancha — Av. Alpha 1",
    });

    expect(wrapper.emitted("update:modelValue")![0]).toEqual(["pg-1"]);
  });

  it("renders the inline-create form after clicking the add-new button", async () => {
    const wrapper = mount(PlaygroundSelect, { props: { modelValue: null } });
    await flushPromises();

    await wrapper.find(".vs__add-new-btn").trigger("click");

    expect(wrapper.find("input[placeholder='Nombre']").exists()).toBe(true);
    expect(wrapper.find("input[placeholder='Dirección']").exists()).toBe(true);
  });

  it("calls createPlayground with name and address on form submit", async () => {
    const wrapper = mount(PlaygroundSelect, { props: { modelValue: null } });
    await flushPromises();

    await wrapper.find(".vs__add-new-btn").trigger("click");

    await wrapper.find("input[placeholder='Nombre']").setValue("Nueva cancha");
    await wrapper
      .find("input[placeholder='Dirección']")
      .setValue("Calle 99 Nueva");

    await wrapper.find("form").trigger("submit");
    await flushPromises();

    expect(mockCreatePlayground).toHaveBeenCalledWith({
      name: "Nueva cancha",
      address: "Calle 99 Nueva",
    });
  });

  it("emits the new playground id after successful create", async () => {
    const wrapper = mount(PlaygroundSelect, { props: { modelValue: null } });
    await flushPromises();

    await wrapper.find(".vs__add-new-btn").trigger("click");
    await wrapper.find("input[placeholder='Nombre']").setValue("Nueva");
    await wrapper.find("input[placeholder='Dirección']").setValue("Calle 99");
    await wrapper.find("form").trigger("submit");
    await flushPromises();

    const emitted = wrapper.emitted("update:modelValue");
    expect(emitted?.at(-1)).toEqual(["pg-new"]);
  });
});
