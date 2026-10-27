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

vi.stubGlobal("definePageMeta", vi.fn());

const { default: PlaygroundSelect } =
  await import("../../src/components/pages/admin/playground/PlaygroundSelect.vue");

describe("PlaygroundSelect", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoading.value = false;
  });

  it("calls fetchPlaygrounds on mount", async () => {
    mount(PlaygroundSelect, { props: { modelValue: null } });

    await flushPromises();

    expect(mockFetchPlaygrounds).toHaveBeenCalledOnce();
  });

  it("maps playgrounds to USelectMenu items using the current name-only label", async () => {
    const wrapper = mount(PlaygroundSelect, { props: { modelValue: null } });

    await flushPromises();

    const items = wrapper
      .findComponent({ name: "USelectMenu" })
      .props("items") as Array<{
      value: string;
      label: string;
      meta: { id: string; name: string; address: string };
    }>;

    expect(items).toEqual([
      {
        value: "pg-1",
        label: "Alpha Cancha",
        meta: mockPlaygroundList.value[0],
      },
      {
        value: "pg-2",
        label: "Zeta Cancha",
        meta: mockPlaygroundList.value[1],
      },
    ]);
  });

  it("re-emits update:modelValue with the selected playground id", async () => {
    const wrapper = mount(PlaygroundSelect, { props: { modelValue: null } });

    await flushPromises();
    await wrapper
      .findComponent({ name: "USelectMenu" })
      .vm.$emit("update:model-value", "pg-1");

    expect(wrapper.emitted("update:modelValue")?.[0]).toEqual(["pg-1"]);
  });

  it("passes loading state through to USelectMenu", async () => {
    mockLoading.value = true;
    const wrapper = mount(PlaygroundSelect, { props: { modelValue: null } });

    await flushPromises();

    expect(
      wrapper.findComponent({ name: "USelectMenu" }).props("loading"),
    ).toBe(true);
  });
});
