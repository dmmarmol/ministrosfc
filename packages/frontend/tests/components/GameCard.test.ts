/**
 * Unit test: GameCard component
 * Verifies score/result for COMPLETED games and status badges for other states
 */
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import GameCard from "../../src/components/game/GameCard.vue";

const NuxtLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ["to"],
};

const baseGame = {
  id: "game-1",
  date: "2024-03-15T18:00:00Z",
  location: "Estádio Municipal",
  status: "SCHEDULED",
  homeTeamScore: null,
  awayTeamScore: null,
  opponentTeam: { name: "Rival FC", logoUrl: null },
};

describe("GameCard", () => {
  it("renders opponent team name", () => {
    const wrapper = mount(GameCard, {
      props: { game: baseGame },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.text()).toContain("Rival FC");
  });

  it("renders location when provided", () => {
    const wrapper = mount(GameCard, {
      props: { game: baseGame },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.text()).toContain("Estádio Municipal");
  });

  it('shows "Próximo" badge for SCHEDULED game', () => {
    const wrapper = mount(GameCard, {
      props: { game: { ...baseGame, status: "SCHEDULED" } },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.text()).toContain("Próximo");
  });

  it('shows "En vivo" badge for IN_PROGRESS game', () => {
    const wrapper = mount(GameCard, {
      props: { game: { ...baseGame, status: "IN_PROGRESS" } },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.text()).toContain("En vivo");
  });

  it('shows "Cancelado" badge for CANCELLED game', () => {
    const wrapper = mount(GameCard, {
      props: { game: { ...baseGame, status: "CANCELLED" } },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.text()).toContain("Cancelado");
  });

  it("shows score and WIN label when home score > away score", () => {
    const wrapper = mount(GameCard, {
      props: {
        game: {
          ...baseGame,
          status: "COMPLETED",
          homeTeamScore: 3,
          awayTeamScore: 1,
        },
      },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.text()).toContain("3");
    expect(wrapper.text()).toContain("1");
    expect(wrapper.text()).toContain("Victoria");
  });

  it("shows WIN with green class when winning", () => {
    const wrapper = mount(GameCard, {
      props: {
        game: {
          ...baseGame,
          status: "COMPLETED",
          homeTeamScore: 2,
          awayTeamScore: 0,
        },
      },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    const resultEl = wrapper.find(".text-green-600");
    expect(resultEl.exists()).toBe(true);
    expect(resultEl.text()).toBe("Victoria");
  });

  it("shows DRAW with yellow class when scores are equal", () => {
    const wrapper = mount(GameCard, {
      props: {
        game: {
          ...baseGame,
          status: "COMPLETED",
          homeTeamScore: 1,
          awayTeamScore: 1,
        },
      },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    const resultEl = wrapper.find(".text-yellow-600");
    expect(resultEl.exists()).toBe(true);
    expect(resultEl.text()).toBe("Empate");
  });

  it("shows LOSS with red class when losing", () => {
    const wrapper = mount(GameCard, {
      props: {
        game: {
          ...baseGame,
          status: "COMPLETED",
          homeTeamScore: 0,
          awayTeamScore: 2,
        },
      },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    const resultEl = wrapper.find(".text-red-600");
    expect(resultEl.exists()).toBe(true);
    expect(resultEl.text()).toBe("Derrota");
  });

  it("shows team initials when no logo is provided", () => {
    const wrapper = mount(GameCard, {
      props: {
        game: {
          ...baseGame,
          opponentTeam: { name: "Rival FC", logoUrl: null },
        },
      },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    // Initials of "Rival FC" = "RF"
    expect(wrapper.text()).toContain("RF");
  });

  it("shows opponent logo image when logoUrl is provided", () => {
    const logoUrl = "https://example.com/logo.png";
    const wrapper = mount(GameCard, {
      props: {
        game: { ...baseGame, opponentTeam: { name: "Rival FC", logoUrl } },
      },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    const img = wrapper.find("img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe(logoUrl);
  });

  it('shows 0-0 and "Empate" for COMPLETED game with null scores', () => {
    const wrapper = mount(GameCard, {
      props: {
        game: {
          ...baseGame,
          status: "COMPLETED",
          homeTeamScore: null,
          awayTeamScore: null,
        },
      },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.text()).toContain("0");
    expect(wrapper.text()).toContain("Empate");
  });
});
