import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import StatsTableByPlayer from "~/components/pages/statistics/StatsTableByPlayer.vue";
import type { AllPlayersStatsRow } from "@ministrosfc/shared";

const row: AllPlayersStatsRow = {
  position: "CF" as AllPlayersStatsRow["position"],
  invitedBy: "",
  invitedById: "",
  playerId: "player-1",
  playerName: "Juan Perez",
  playerNickname: "Juancho",
  gamesPlayed: 50,
  wins: 30,
  losses: 12,
  draws: 8,
  goals: 20,
  assists: 10,
  yellowCards: 3,
  redCards: 0,
  winRate: 60.0,
  goalRate: 0.4,
  participationRate: 0.85,
};

describe("StatsTableByPlayer", () => {
  const mountIt = (rows = [row], loading = false) =>
    mount(StatsTableByPlayer, {
      props: { rows, loading },
      global: { stubs: { NuxtLink: { template: "<a :href=\"to\"><slot /></a>", props: ["to"] } } },
    });

  it("shows the player name with nickname as the row title", () => {
    const text = mountIt().text();
    expect(text).toContain("Juan Perez");
    expect(text).toContain("Juancho");
  });

  it("leads with games played as the headline number", () => {
    const text = mountIt().text();
    expect(text).toContain("50");
    expect(text).toContain("partidos");
  });

  it("offers ranking chips for the player metrics", () => {
    const text = mountIt().text();
    for (const label of ["Partidos", "Goles", "Asist.", "% Victorias", "Presencia"])
      expect(text).toContain(label);
  });

  it("re-ranks by goals when the Goles chip is chosen", async () => {
    const wrapper = mountIt();
    const chip = wrapper.findAll("button").find((b) => b.text() === "Goles")!;
    await chip.trigger("click");
    expect(wrapper.text()).toContain("20");
    expect(wrapper.text()).toContain("goles");
  });

  it("opens the full columns and a link to the profile when tapped", async () => {
    const wrapper = mountIt();
    await wrapper.find("ol button").trigger("click");
    const text = wrapper.text();
    for (const label of ["PJ", "PG", "PE", "PP", "Amar.", "Rojas"])
      expect(text).toContain(label);
    expect(wrapper.find("a").attributes("href")).toBe("/players/player-1");
  });

  it("shows the empty message when there are no rows", () => {
    const wrapper = mount(StatsTableByPlayer, { props: { rows: [], loading: false } });
    expect(wrapper.text()).toContain("No hay datos para estos filtros.");
  });

  it("shows the loading message while loading", () => {
    const wrapper = mount(StatsTableByPlayer, { props: { rows: [], loading: true } });
    expect(wrapper.text()).toContain("Cargando…");
  });
});
