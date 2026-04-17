import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import StatsHeader from "~/components/pages/stats/StatsHeader.vue";
import type { TeamSummaryHeaderDTO } from "@ministrosfc/shared";

const baseSummary: TeamSummaryHeaderDTO = {
  totalGames: 100,
  totalWins: 60,
  totalLosses: 25,
  totalDraws: 15,
  totalGoalsFor: 200,
  totalGoalsAgainst: 120,
  winRate: 0.6,
  rivalMostPlayed: { name: "Rival A", count: 20 },
  rivalMostWins: { name: "Rival B", count: 15 },
  rivalMostLosses: { name: "Rival C", count: 8 },
  rivalMostDraws: { name: "Rival D", count: 5 },
  bestWin: {
    rival: "Rival E",
    tournament: "Liga",
    date: "2022-05-01",
    score: "5-0",
  },
  worstLoss: {
    rival: "Rival F",
    tournament: "Copa",
    date: "2021-03-10",
    score: "0-4",
  },
  rivalMostGoalsFor: { name: "Rival G", totalGoals: 30 },
  rivalMostGoalsAgainst: { name: "Rival H", totalGoals: 20 },
  topScorer: { name: "Juan Perez", goals: 45 },
};

describe("StatsHeader", () => {
  it("renders all-time totals", () => {
    const wrapper = mount(StatsHeader, { props: { summary: baseSummary } });
    expect(wrapper.text()).toContain("100");
    expect(wrapper.text()).toContain("60");
    expect(wrapper.text()).toContain("25");
    expect(wrapper.text()).toContain("15");
  });

  it("renders goals for and against", () => {
    const wrapper = mount(StatsHeader, { props: { summary: baseSummary } });
    expect(wrapper.text()).toContain("200");
    expect(wrapper.text()).toContain("120");
  });

  it("renders win rate as percentage", () => {
    const wrapper = mount(StatsHeader, { props: { summary: baseSummary } });
    expect(wrapper.text()).toContain("60.0%");
  });

  it("renders rival most played", () => {
    const wrapper = mount(StatsHeader, { props: { summary: baseSummary } });
    expect(wrapper.text()).toContain("Rival A");
    expect(wrapper.text()).toContain("20");
  });

  it("renders rival most wins", () => {
    const wrapper = mount(StatsHeader, { props: { summary: baseSummary } });
    expect(wrapper.text()).toContain("Rival B");
  });

  it("renders rival most losses", () => {
    const wrapper = mount(StatsHeader, { props: { summary: baseSummary } });
    expect(wrapper.text()).toContain("Rival C");
  });

  it("renders rival most draws", () => {
    const wrapper = mount(StatsHeader, { props: { summary: baseSummary } });
    expect(wrapper.text()).toContain("Rival D");
  });

  it("renders best win", () => {
    const wrapper = mount(StatsHeader, { props: { summary: baseSummary } });
    expect(wrapper.text()).toContain("5-0");
    expect(wrapper.text()).toContain("Rival E");
  });

  it("renders worst loss", () => {
    const wrapper = mount(StatsHeader, { props: { summary: baseSummary } });
    expect(wrapper.text()).toContain("0-4");
    expect(wrapper.text()).toContain("Rival F");
  });

  it("renders top scorer", () => {
    const wrapper = mount(StatsHeader, { props: { summary: baseSummary } });
    expect(wrapper.text()).toContain("Juan Perez");
    expect(wrapper.text()).toContain("45");
  });

  it("handles null values gracefully", () => {
    const summary = {
      ...baseSummary,
      rivalMostPlayed: { name: "", count: 0 },
      topScorer: { name: "", goals: 0 },
    };
    const wrapper = mount(StatsHeader, { props: { summary } });
    expect(wrapper.text()).toContain("0");
  });

  it("renders empty state when summary is null", () => {
    const wrapper = mount(StatsHeader, { props: { summary: null } });
    expect(wrapper.text()).toContain("Sin datos");
  });
});
