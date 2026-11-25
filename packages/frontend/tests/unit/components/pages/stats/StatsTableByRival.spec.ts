import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import StatsTableByRival from "~/components/pages/statistics/StatsTableByRival.vue";
import type { TeamStatPeriodDTO } from "@ministrosfc/shared";

const row: TeamStatPeriodDTO = {
  key: "rival-1",
  playgroundName: "Cancha 1",
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
  const mountIt = (rows = [row], loading = false) =>
    mount(StatsTableByRival, {
      props: { rows, loading },
      global: { stubs: { NuxtLink: { template: "<a :href=\"to\"><slot /></a>", props: ["to"] } } },
    });

  it("shows the rival name as the row title", () => {
    expect(mountIt().text()).toContain("Rival FC");
  });

  it("leads with games played as the headline number", () => {
    const text = mountIt().text();
    expect(text).toContain("10");
    expect(text).toContain("partidos");
  });

  it("opens the detail with the win rate and a link to the rival history", async () => {
    const wrapper = mountIt();
    await wrapper.find("ol button").trigger("click");
    expect(wrapper.text()).toContain("60.0%");
    expect(wrapper.find("a").attributes("href")).toBe("/statistics/rivals/rival-1");
  });

  it("shows the empty message when there are no rows", () => {
    const wrapper = mount(StatsTableByRival, { props: { rows: [], loading: false } });
    expect(wrapper.text()).toContain("No hay datos para estos filtros.");
  });

  it("shows the loading message while loading", () => {
    const wrapper = mount(StatsTableByRival, { props: { rows: [], loading: true } });
    expect(wrapper.text()).toContain("Cargando…");
  });
});
