import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import StatsTableByRival from "~/components/pages/statistics/StatsTableByRival.vue";
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";

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
  winRate: 60.0,
  pointsEarned: 20,
};

describe("StatsTableByRival", () => {
  it("renders all-rivals mode with correct header", () => {
    const wrapper = mount(StatsTableByRival, {
      props: { rows: [row], loading: false },
    });
    expect(wrapper.text()).toContain("Rival");
  });

  it("maps rows correctly", () => {
    const wrapper = mount(StatsTableByRival, {
      props: { rows: [row], loading: false },
    });
    const text = wrapper.text();
    expect(text).toContain("Rival FC");
    expect(text).toContain("60.0%");
  });

  it("shows empty state", () => {
    const wrapper = mount(StatsTableByRival, {
      props: { rows: [], loading: false },
    });
    expect(wrapper.text()).toContain("Sin datos");
  });
});
