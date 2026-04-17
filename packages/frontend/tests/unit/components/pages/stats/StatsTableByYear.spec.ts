import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import StatsTableByYear from "~/components/pages/stats/StatsTableByYear.vue";
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";

const row: TeamStatPeriodDTO = {
  label: "2023",
  periodStart: "2023-01-01",
  periodEnd: "2023-12-31",
  gamesPlayed: 30,
  wins: 18,
  losses: 7,
  draws: 5,
  goalsFor: 55,
  goalsAgainst: 30,
  goalDifference: 25,
  goalRateFor: 1.83,
  goalRateAgainst: 1.0,
  winRate: 0.6,
  pointsEarned: 59,
};

describe("StatsTableByYear", () => {
  it("renders all expected columns", () => {
    const wrapper = mount(StatsTableByYear, {
      props: { rows: [row], loading: false },
    });
    const text = wrapper.text();
    expect(text).toContain("Año");
    expect(text).toContain("Período");
    expect(text).toContain("PJ");
    expect(text).toContain("V");
    expect(text).toContain("D");
    expect(text).toContain("E");
    expect(text).toContain("GF");
    expect(text).toContain("GC");
    expect(text).toContain("DG");
    expect(text).toContain("Pts");
    expect(text).toContain("%V");
  });

  it("maps row data correctly", () => {
    const wrapper = mount(StatsTableByYear, {
      props: { rows: [row], loading: false },
    });
    const text = wrapper.text();
    expect(text).toContain("2023");
    expect(text).toContain("30");
    expect(text).toContain("18");
    expect(text).toContain("55");
    expect(text).toContain("59");
    expect(text).toContain("60.0%");
  });

  it("shows empty state when rows is empty", () => {
    const wrapper = mount(StatsTableByYear, {
      props: { rows: [], loading: false },
    });
    expect(wrapper.text()).toContain("Sin datos");
  });

  it("shows loading skeleton when loading=true", () => {
    const wrapper = mount(StatsTableByYear, {
      props: { rows: [], loading: true },
    });
    const animatedDiv = wrapper.find(".animate-pulse");
    expect(animatedDiv.exists()).toBe(true);
  });
});
