import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import TournamentLine from "~/components/pages/tournaments/TournamentLine.vue";

const record = {
  played: 6,
  wins: 3,
  draws: 2,
  losses: 1,
  goalsFor: 14,
  goalsAgainst: 9,
  goalDifference: 5,
};
const tournament = {
  id: "t1",
  name: "Liga de Verano",
  competitionType: "LEAGUE",
  startDate: "2026-01-10",
  endDate: "2026-03-20",
  ministrosRecord: record,
};
const mountIt = (overrides: Record<string, unknown> = {}) =>
  mount(TournamentLine, {
    props: { tournament: { ...tournament, ...overrides } },
    global: {
      stubs: {
        NuxtLink: { template: '<a :href="to"><slot /></a>', props: ["to"] },
        HomeArrow: true,
      },
    },
  });

describe("TournamentLine record", () => {
  it("shows wins, draws and losses", () => {
    const text = mountIt().find("[data-testid='tournament-record']").text();
    expect(text).toContain("3 G");
    expect(text).toContain("2 E");
    expect(text).toContain("1 P");
  });

  it("describes the record in words for screen readers", () => {
    const el = mountIt().find("[data-testid='tournament-record']");
    expect(el.attributes("aria-label")).toBe("Ganados 3, empatados 2, perdidos 1");
  });

  it("shows nothing for a tournament with no completed games", () => {
    const w = mountIt({ ministrosRecord: { ...record, played: 0, wins: 0, draws: 0, losses: 0 } });
    expect(w.find("[data-testid='tournament-record']").exists()).toBe(false);
  });

  it("still renders when the API sent no record (older cached response)", () => {
    const w = mountIt({ ministrosRecord: undefined });
    expect(w.find("[data-testid='tournament-record']").exists()).toBe(false);
    expect(w.text()).toContain("Liga de Verano");
  });
});
