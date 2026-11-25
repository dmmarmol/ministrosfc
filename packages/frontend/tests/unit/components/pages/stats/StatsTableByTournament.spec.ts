import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import StatsTableByTournament from "~/components/pages/statistics/StatsTableByTournament.vue";
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";

const row: TeamStatPeriodDTO = {
  key: "liga-2023",
  playgroundName: "Cancha 1",
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
  winRate: 64.0,
  pointsEarned: 29,
};

describe("StatsTableByTournament", () => {
  const mountIt = (rows = [row], loading = false) =>
    mount(StatsTableByTournament, { props: { rows, loading } });

  it("shows the tournament name as the row title", () => {
    expect(mountIt().text()).toContain("Liga 2023");
  });

  it("shows year, period dates and playground as the subtitle", () => {
    const text = mountIt().text();
    expect(text).toContain("2023");
    expect(text).toContain("03/23 – 11/23");
    expect(text).toContain("Cancha 1");
  });

  it("leads with points as the headline number", () => {
    expect(mountIt().text()).toContain("29");
  });

  it("opens the full columns when the row is tapped", async () => {
    const wrapper = mountIt();
    await wrapper.find("ol button").trigger("click");
    const text = wrapper.text();
    expect(text).toContain("GF");
    expect(text).toContain("28");
    expect(text).toContain("64.0%");
  });

  it("shows the empty message when there are no rows", () => {
    const wrapper = mount(StatsTableByTournament, { props: { rows: [], loading: false } });
    expect(wrapper.text()).toContain("No hay datos para estos filtros.");
  });

  it("shows the loading message while loading", () => {
    const wrapper = mount(StatsTableByTournament, { props: { rows: [], loading: true } });
    expect(wrapper.text()).toContain("Cargando…");
  });
});
