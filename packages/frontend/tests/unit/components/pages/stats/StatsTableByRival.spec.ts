import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import StatsTableByRival from "~/components/pages/stats/StatsTableByRival.vue";
import type { TeamStatPeriodDTO } from "@ministrosfc/shared/types/statistics";

const row: TeamStatPeriodDTO = {
  label: "Rival FC",
  periodStart: undefined,
  periodEnd: undefined,
  gamesPlayed: 10,
  wins: 6,
  losses: 2,
  draws: 2,
  goalsFor: 18,
  goalsAgainst: 10,
  goalDifference: 8,
  goalRateFor: 1.8,
  goalRateAgainst: 1.0,
  winRate: 0.6,
  pointsEarned: 20,
};

describe("StatsTableByRival", () => {
  it("renders all-rivals mode with correct header", () => {
    const wrapper = mount(StatsTableByRival, { props: { rows: [row], mode: "all", loading: false } });
    expect(wrapper.text()).toContain("Rival");
  });

  it("renders single-rival mode with period column", () => {
    const wrapper = mount(StatsTableByRival, { props: { rows: [row], mode: "single", loading: false } });
    expect(wrapper.text()).toContain("Período");
    expect(wrapper.text()).toContain("Torneo");
  });

  it("maps rows in all mode", () => {
    const wrapper = mount(StatsTableByRival, { props: { rows: [row], mode: "all", loading: false } });
    const text = wrapper.text();
    expect(text).toContain("Rival FC");
    expect(text).toContain("60.0%");
  });

  it("shows empty state", () => {
    const wrapper = mount(StatsTableByRival, { props: { rows: [], mode: "all", loading: false } });
    expect(wrapper.text()).toContain("Sin datos");
  });
});
