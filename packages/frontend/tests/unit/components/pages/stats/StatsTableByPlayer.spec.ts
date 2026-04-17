import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import StatsTableByPlayer from "~/components/pages/stats/StatsTableByPlayer.vue";
import type { PlayerStatRowDTO } from "@ministrosfc/shared";

const row: PlayerStatRowDTO = {
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
  winRate: 0.6,
  goalRate: 0.4,
  participationRate: 0.85,
};

describe("StatsTableByPlayer", () => {
  it("renders all-players mode headers", () => {
    const wrapper = mount(StatsTableByPlayer, {
      props: { rows: [row], mode: "all", loading: false },
    });
    const text = wrapper.text();
    expect(text).toContain("Jugador");
    expect(text).toContain("PJ");
    expect(text).toContain("Goles");
    expect(text).toContain("Asist.");
    expect(text).toContain("%V");
    expect(text).toContain("GPJ");
    expect(text).toContain("%Part.");
  });

  it("renders single-player mode with year header", () => {
    const wrapper = mount(StatsTableByPlayer, {
      props: { rows: [row], mode: "single", loading: false },
    });
    expect(wrapper.text()).toContain("Año");
  });

  it("maps row data with nickname", () => {
    const wrapper = mount(StatsTableByPlayer, {
      props: { rows: [row], mode: "all", loading: false },
    });
    const text = wrapper.text();
    expect(text).toContain("Juancho");
    expect(text).toContain("20");
    expect(text).toContain("60.0%");
  });

  it("displays goalRate as decimal", () => {
    const wrapper = mount(StatsTableByPlayer, {
      props: { rows: [row], mode: "all", loading: false },
    });
    expect(wrapper.text()).toContain("0.40");
  });

  it("shows empty state", () => {
    const wrapper = mount(StatsTableByPlayer, {
      props: { rows: [], mode: "all", loading: false },
    });
    expect(wrapper.text()).toContain("Sin datos");
  });
});
