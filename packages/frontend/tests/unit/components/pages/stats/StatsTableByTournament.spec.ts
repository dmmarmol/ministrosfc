import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import StatsTableByTournament from "~/components/pages/stats/StatsTableByTournament.vue";
import type { TeamStatPeriodDTO } from "@ministrosfc/shared/types/statistics";

const row: TeamStatPeriodDTO = {
  label: "Liga 2023",
  periodStart: "2023-03-01",
  periodEnd: "2023-11-30",
  gamesPlayed: 14,
  wins: 9,
  losses: 3,
  draws: 2,
  goalsFor: 28,
  goalsAgainst: 14,
  goalDifference: 14,
  goalRateFor: 2.0,
  goalRateAgainst: 1.0,
  winRate: 0.64,
  pointsEarned: 29,
};

describe("StatsTableByTournament", () => {
  it("renders correct columns", () => {
    const wrapper = mount(StatsTableByTournament, { props: { rows: [row], loading: false } });
    const text = wrapper.text();
    expect(text).toContain("Torneo");
    expect(text).toContain("Año");
    expect(text).toContain("Período");
    expect(text).toContain("GRF");
    expect(text).toContain("GRC");
  });

  it("displays period dates", () => {
    const wrapper = mount(StatsTableByTournament, { props: { rows: [row], loading: false } });
    const text = wrapper.text();
    expect(text).toContain("2023-03-01");
    expect(text).toContain("2023-11-30");
  });

  it("maps row data", () => {
    const wrapper = mount(StatsTableByTournament, { props: { rows: [row], loading: false } });
    const text = wrapper.text();
    expect(text).toContain("Liga 2023");
    expect(text).toContain("14");
    expect(text).toContain("9");
    expect(text).toContain("64.0%");
  });

  it("shows empty state message", () => {
    const wrapper = mount(StatsTableByTournament, { props: { rows: [], loading: false } });
    expect(wrapper.text()).toContain("Sin datos");
  });
});
