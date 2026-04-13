/**
 * Unit test: PlayerCard component
 * Verifies jersey badge renders when jerseyNumber is provided
 */
import { describe, it, expect } from "vitest";
import { mount } from "@vue/test-utils";
import PlayerCard from "../../src/components/player/PlayerCard.vue";

// Stub NuxtLink to avoid Nuxt context dependency
const NuxtLinkStub = {
  template: '<a :href="to"><slot /></a>',
  props: ["to"],
};

const basePlayer = {
  id: "player-1",
  firstName: "João",
  lastName: "Silva",
  position: "CF",
  jerseyNumber: null,
  photoUrl: null,
};

describe("PlayerCard", () => {
  it("renders player name", () => {
    const wrapper = mount(PlayerCard, {
      props: { player: basePlayer },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.text()).toContain("João Silva");
  });

  it("shows jersey badge when jerseyNumber is provided", () => {
    const wrapper = mount(PlayerCard, {
      props: { player: { ...basePlayer, jerseyNumber: 10 } },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.text()).toContain("#10");
  });

  it("does not show jersey badge when jerseyNumber is null", () => {
    const wrapper = mount(PlayerCard, {
      props: { player: { ...basePlayer, jerseyNumber: null } },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.text()).not.toContain("#");
  });

  it("renders player photo when photoUrl is provided", () => {
    const photoUrl = "https://example.com/player.jpg";
    const wrapper = mount(PlayerCard, {
      props: { player: { ...basePlayer, photoUrl } },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    const img = wrapper.find("img");
    expect(img.exists()).toBe(true);
    expect(img.attributes("src")).toBe(photoUrl);
  });

  it("shows fallback icon when photoUrl is null", () => {
    const wrapper = mount(PlayerCard, {
      props: { player: basePlayer },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.find("img").exists()).toBe(false);
    expect(wrapper.find("svg").exists()).toBe(true);
  });

  it("renders GK position code as-is", () => {
    const wrapper = mount(PlayerCard, {
      props: { player: { ...basePlayer, position: "GK" } },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.text()).toContain("GK");
  });

  it("shows em-dash when position is null", () => {
    const wrapper = mount(PlayerCard, {
      props: { player: { ...basePlayer, position: null } },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.text()).toContain("—");
  });
});
