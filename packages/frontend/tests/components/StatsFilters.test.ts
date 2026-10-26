import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { ref } from "vue";
import { OPTION_FILTER_ALL, PlayerStatus } from "@ministrosfc/shared";

// ── Nuxt global stubs (none of these components use router/api directly) ─────
vi.stubGlobal("definePageMeta", vi.fn());
vi.stubGlobal("useHead", vi.fn());

// ── Composable mocks ──────────────────────────────────────────────────────────
const availableYearsMock = vi.fn().mockReturnValue({
  availableYears: ref([
    { value: "2023", label: "2023" },
    { value: "2024", label: "2024" },
  ]),
});
const availableTournamentsMock = vi.fn().mockReturnValue({
  availableTournaments: ref([
    { value: "t-1", label: "Copa de Oro" },
    { value: "t-2", label: "Liga" },
  ]),
});

vi.stubGlobal("useStatisticsAvailableYears", availableYearsMock);
vi.stubGlobal("useStatisticsAvailableTournaments", availableTournamentsMock);

// ── Lazy imports after stubs ──────────────────────────────────────────────────
const { default: PlayerStatusSelect } =
  await import("../../src/components/ui/Player/Status/Select.vue");
const { default: YearSelect } =
  await import("../../src/components/pages/statistics/StatsFilters/YearSelect.vue");
const { default: TournamentSelect } =
  await import("../../src/components/pages/statistics/StatsFilters/TournamentSelect.vue");

// ─────────────────────────────────────────────────────────────────────────────

describe("PlayerStatusSelect", () => {
  it("renders active and inactive items by default", () => {
    const wrapper = mount(PlayerStatusSelect);
    const items = wrapper
      .findComponent({ name: "USelectMenu" })
      .props("items") as Array<{ value: string }>;
    expect(items.map((item) => item.value)).toEqual([
      PlayerStatus.ACTIVE,
      PlayerStatus.INACTIVE,
    ]);
  });

  it("adds the all option only when includeAll is true", () => {
    const wrapper = mount(PlayerStatusSelect, { props: { includeAll: true } });
    const items = wrapper
      .findComponent({ name: "USelectMenu" })
      .props("items") as Array<{ value: string }>;
    expect(items[0]?.value).toBe(OPTION_FILTER_ALL);
  });

  it("shows placeholder state when modelValue is ALL and includeAll is false", () => {
    const wrapper = mount(PlayerStatusSelect, {
      props: { modelValue: OPTION_FILTER_ALL },
    });
    expect(
      wrapper.findComponent({ name: "USelectMenu" }).props("modelValue"),
    ).toBeUndefined();
  });

  it("emits selected status values", async () => {
    const wrapper = mount(PlayerStatusSelect);
    await wrapper
      .findComponent({ name: "USelectMenu" })
      .vm.$emit("update:model-value", PlayerStatus.INACTIVE);
    expect(wrapper.emitted("update:modelValue")?.[0]?.[0]).toBe(
      PlayerStatus.INACTIVE,
    );
  });

  it("clears to undefined when includeAll is false", async () => {
    const wrapper = mount(PlayerStatusSelect, {
      props: { modelValue: PlayerStatus.ACTIVE },
    });
    await wrapper.findComponent({ name: "USelectMenu" }).vm.$emit("clear");
    expect(wrapper.emitted("update:modelValue")?.[0]?.[0]).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("YearSelect", () => {
  beforeEach(() => {
    availableYearsMock.mockReturnValue({
      availableYears: ref([
        { value: "2023", label: "2023" },
        { value: "2024", label: "2024" },
      ]),
    });
  });

  it("passes available years into USelectMenu items", () => {
    const wrapper = mount(YearSelect);
    const items = wrapper
      .findComponent({ name: "USelectMenu" })
      .props("items") as Array<{ value: string }>;
    expect(items.map((item) => item.value)).toEqual(["2023", "2024"]);
  });

  it("adds the all-years option only when includeAll is true", () => {
    const wrapper = mount(YearSelect, { props: { includeAll: true } });
    const items = wrapper
      .findComponent({ name: "USelectMenu" })
      .props("items") as Array<{ value: string }>;
    expect(items[0]?.value).toBe(OPTION_FILTER_ALL);
  });

  it("uses the current placeholder", () => {
    const wrapper = mount(YearSelect);
    expect(
      wrapper.findComponent({ name: "USelectMenu" }).props("placeholder"),
    ).toBe("Seleccionar año");
  });

  it("emits update:modelValue with selected year string", async () => {
    const wrapper = mount(YearSelect);
    await wrapper
      .findComponent({ name: "USelectMenu" })
      .vm.$emit("update:model-value", "2023");
    expect(wrapper.emitted("update:modelValue")?.[0]?.[0]).toBe("2023");
  });

  it("renders no year options when composable returns empty list", () => {
    availableYearsMock.mockReturnValueOnce({ availableYears: ref([]) });
    const wrapper = mount(YearSelect);
    const items = wrapper
      .findComponent({ name: "USelectMenu" })
      .props("items") as Array<unknown>;
    expect(items).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("TournamentSelect", () => {
  it("passes tournament items through with id values and label text", () => {
    const wrapper = mount(TournamentSelect);
    const items = wrapper
      .findComponent({ name: "USelectMenu" })
      .props("items") as Array<{ value: string; label: string }>;
    expect(items).toEqual([
      { value: "t-1", label: "Copa de Oro" },
      { value: "t-2", label: "Liga" },
    ]);
  });

  it("shows placeholder state when modelValue is ALL and includeAll is false", () => {
    const wrapper = mount(TournamentSelect, {
      props: { modelValue: OPTION_FILTER_ALL },
    });
    expect(
      wrapper.findComponent({ name: "USelectMenu" }).props("modelValue"),
    ).toBeUndefined();
  });

  it("emits the tournament label when the select returns an id", async () => {
    const wrapper = mount(TournamentSelect);
    await wrapper
      .findComponent({ name: "USelectMenu" })
      .vm.$emit("update:model-value", "t-1");
    expect(wrapper.emitted("update:modelValue")?.[0]?.[0]).toBe("Copa de Oro");
  });

  it("emits ALL only when includeAll is enabled", async () => {
    const wrapper = mount(TournamentSelect, { props: { includeAll: true } });
    await wrapper
      .findComponent({ name: "USelectMenu" })
      .vm.$emit("update:model-value", OPTION_FILTER_ALL);
    expect(wrapper.emitted("update:modelValue")?.[0]?.[0]).toBe(
      OPTION_FILTER_ALL,
    );
  });

  it("clears to an empty string when ALL is selected without includeAll", async () => {
    const wrapper = mount(TournamentSelect);
    await wrapper
      .findComponent({ name: "USelectMenu" })
      .vm.$emit("update:model-value", OPTION_FILTER_ALL);
    expect(wrapper.emitted("update:modelValue")?.[0]?.[0]).toBe("");
  });
});
