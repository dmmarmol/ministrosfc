/**
 * Unit tests: Statistics filter components
 * Covers: PlayerStatusSelect, YearSelect, TournamentSelect, PlaygroundSelect
 *
 * Each filter is a thin <select> wrapper over a v-model. Tests verify:
 * - Default "all" option is rendered
 * - Dynamic options are rendered from the backing composable
 * - Selecting an option emits the correct model-update value
 * - Default model value is applied correctly
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { mount } from "@vue/test-utils";
import { ref, nextTick } from "vue";

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
    { value: "Copa de Oro", label: "Copa de Oro" },
    { value: "Liga", label: "Liga" },
  ]),
});
const availablePlaygroundsMock = vi.fn().mockReturnValue({
  availablePlaygrounds: ref([
    { value: "pg-1", label: "Cancha Norte" },
    { value: "pg-2", label: "Cancha Sur" },
  ]),
});

vi.stubGlobal("useStatisticsAvailableYears", availableYearsMock);
vi.stubGlobal("useStatisticsAvailableTournaments", availableTournamentsMock);
vi.stubGlobal("useStatisticsAvailablePlaygrounds", availablePlaygroundsMock);

// ── Lazy imports after stubs ──────────────────────────────────────────────────
const { default: PlayerStatusSelect } =
  await import("../../src/components/pages/statistics/StatsFilters/PlayerStatusSelect.vue");
const { default: YearSelect } =
  await import("../../src/components/pages/statistics/StatsFilters/YearSelect.vue");
const { default: TournamentSelect } =
  await import("../../src/components/pages/statistics/StatsFilters/TournamentSelect.vue");
const { default: PlaygroundSelect } =
  await import("../../src/components/pages/statistics/StatsFilters/PlaygroundSelect.vue");

// ─────────────────────────────────────────────────────────────────────────────

describe("PlayerStatusSelect", () => {
  it("renders ACTIVE and INACTIVE options", () => {
    const wrapper = mount(PlayerStatusSelect);
    const options = wrapper.findAll("option");
    const values = options.map((o) => o.element.value);
    expect(values).toContain("ACTIVE");
    expect(values).toContain("INACTIVE");
  });

  it("renders a 'all' option with empty value", () => {
    const wrapper = mount(PlayerStatusSelect);
    const emptyOption = wrapper
      .findAll("option")
      .find((o) => o.element.value === "");
    expect(emptyOption).toBeDefined();
  });

  it("defaults model to ACTIVE", () => {
    const wrapper = mount(PlayerStatusSelect);
    const select = wrapper.find("select");
    expect(select.element.value).toBe("ACTIVE");
  });

  it("emits update:modelValue when user selects INACTIVE", async () => {
    const wrapper = mount(PlayerStatusSelect, {
      props: { modelValue: "ACTIVE", "onUpdate:modelValue": vi.fn() },
    });
    await wrapper.find("select").setValue("INACTIVE");
    expect(wrapper.emitted("update:modelValue")?.[0]?.[0]).toBe("INACTIVE");
  });

  it("emits empty string when user selects the all-states option", async () => {
    const wrapper = mount(PlayerStatusSelect, {
      props: { modelValue: "ACTIVE", "onUpdate:modelValue": vi.fn() },
    });
    await wrapper.find("select").setValue("");
    expect(wrapper.emitted("update:modelValue")?.[0]?.[0]).toBe("");
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

  it("renders a 'all years' default option with empty value", () => {
    const wrapper = mount(YearSelect);
    const firstOption = wrapper.find("option");
    expect(firstOption.element.value).toBe("");
  });

  it("renders one option per available year", () => {
    const wrapper = mount(YearSelect);
    const yearOptions = wrapper
      .findAll("option")
      .filter((o) => o.element.value !== "");
    expect(yearOptions).toHaveLength(2);
    expect(yearOptions[0].element.value).toBe("2023");
    expect(yearOptions[1].element.value).toBe("2024");
  });

  it("shows 'Todos los años' label in the default option", () => {
    const wrapper = mount(YearSelect);
    expect(wrapper.find("option").text()).toContain("años");
  });

  it("emits update:modelValue with selected year string", async () => {
    const wrapper = mount(YearSelect, {
      props: { modelValue: "", "onUpdate:modelValue": vi.fn() },
    });
    await nextTick();
    await wrapper.find("select").setValue("2023");
    expect(wrapper.emitted("update:modelValue")?.[0]?.[0]).toBe("2023");
  });

  it("renders no year options when composable returns empty list", () => {
    availableYearsMock.mockReturnValueOnce({ availableYears: ref([]) });
    const wrapper = mount(YearSelect);
    const yearOptions = wrapper
      .findAll("option")
      .filter((o) => o.element.value !== "");
    expect(yearOptions).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("TournamentSelect", () => {
  it("renders a 'all tournaments' default option", () => {
    const wrapper = mount(TournamentSelect);
    const firstOption = wrapper.find("option");
    expect(firstOption.element.value).toBe("");
  });

  it("renders one option per available tournament", () => {
    const wrapper = mount(TournamentSelect);
    const tournamentOptions = wrapper
      .findAll("option")
      .filter((o) => o.element.value !== "");
    expect(tournamentOptions).toHaveLength(2);
    expect(tournamentOptions[0].text()).toBe("Copa de Oro");
    expect(tournamentOptions[1].text()).toBe("Liga");
  });

  it("option values are tournament names (not IDs)", () => {
    const wrapper = mount(TournamentSelect);
    const options = wrapper
      .findAll("option")
      .filter((o) => o.element.value !== "");
    for (const opt of options) {
      // value must equal label (name-based, not UUID-based)
      expect(opt.element.value).toBe(opt.text());
    }
  });

  it("emits update:modelValue with tournament name when selected", async () => {
    const wrapper = mount(TournamentSelect, {
      props: { modelValue: "", "onUpdate:modelValue": vi.fn() },
    });
    await nextTick();
    await wrapper.find("select").setValue("Copa de Oro");
    expect(wrapper.emitted("update:modelValue")?.[0]?.[0]).toBe("Copa de Oro");
  });

  it("emits empty string when all-tournaments option is selected", async () => {
    const wrapper = mount(TournamentSelect, {
      props: { modelValue: "Copa de Oro", "onUpdate:modelValue": vi.fn() },
    });
    await wrapper.find("select").setValue("");
    expect(wrapper.emitted("update:modelValue")?.[0]?.[0]).toBe("");
  });
});

// ─────────────────────────────────────────────────────────────────────────────

describe("PlaygroundSelect", () => {
  it("renders a 'all playgrounds' default option", () => {
    const wrapper = mount(PlaygroundSelect);
    const firstOption = wrapper.find("option");
    expect(firstOption.element.value).toBe("");
  });

  it("renders one option per available playground", () => {
    const wrapper = mount(PlaygroundSelect);
    const pgOptions = wrapper
      .findAll("option")
      .filter((o) => o.element.value !== "");
    expect(pgOptions).toHaveLength(2);
    expect(pgOptions[0].text()).toBe("Cancha Norte");
    expect(pgOptions[1].text()).toBe("Cancha Sur");
  });

  it("emits update:modelValue with playground id when selected", async () => {
    const wrapper = mount(PlaygroundSelect, {
      props: { modelValue: "", "onUpdate:modelValue": vi.fn() },
    });
    await nextTick();
    await wrapper.find("select").setValue("pg-1");
    expect(wrapper.emitted("update:modelValue")?.[0]?.[0]).toBe("pg-1");
  });
});
