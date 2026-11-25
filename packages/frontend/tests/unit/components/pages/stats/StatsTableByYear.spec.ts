import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import StatsTableByYear from "~/components/pages/statistics/StatsTableByYear.vue";
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";

const row: TeamStatPeriodDTO = {
  key: "2023",
  playgroundName: "Cancha 1",
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
  winRate: 60.0,
  pointsEarned: 59,
};

describe("StatsTableByYear", () => {
  const mountIt = (rows = [row], loading = false) =>
    mount(StatsTableByYear, { props: { rows, loading } });

  it("shows the year and its period as the row title", () => {
    const text = mountIt().text();
    expect(text).toContain("2023");
    expect(text).toContain("01/23 – 12/23");
  });

  it("leads with points as the headline number", () => {
    const text = mountIt().text();
    expect(text).toContain("59");
    expect(text).toContain("puntos");
  });

  it("offers ranking chips for the main metrics", () => {
    const text = mountIt().text();
    for (const label of ["Orden", "Puntos", "Victorias", "Partidos", "% Victorias", "Dif. gol"])
      expect(text).toContain(label);
  });

  it("opens the full columns when the row is tapped", async () => {
    const wrapper = mountIt();
    expect(wrapper.text()).not.toContain("GF");
    await wrapper.find("ol button").trigger("click");
    const text = wrapper.text();
    for (const label of ["PJ", "PG", "PE", "PP", "GF", "GC", "DG", "% Vict."])
      expect(text).toContain(label);
    expect(text).toContain("55");
    expect(text).toContain("60.0%");
    expect(text).toContain("+25");
  });

  it("shows the empty message when there are no rows", () => {
    const wrapper = mount(StatsTableByYear, { props: { rows: [], loading: false } });
    expect(wrapper.text()).toContain("No hay datos para estos filtros.");
  });

  it("shows the loading message while loading", () => {
    const wrapper = mount(StatsTableByYear, { props: { rows: [], loading: true } });
    expect(wrapper.text()).toContain("Cargando…");
  });
});
