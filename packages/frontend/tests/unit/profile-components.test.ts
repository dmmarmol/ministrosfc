/**
 * Unit tests for profile components: InvitedGuestsList, JerseySvg, ProfileHeader
 */
import { describe, it, expect, vi } from "vitest";
import { mount } from "@vue/test-utils";

vi.stubGlobal("definePageMeta", vi.fn());
vi.stubGlobal("useRuntimeConfig", () => ({
  public: { apiBaseUrl: "http://localhost:5102" },
}));

// Stub NuxtLink
const NuxtLinkStub = {
  name: "NuxtLink",
  template: '<a :href="to"><slot /></a>',
  props: ["to"],
};

describe("InvitedGuestsList", () => {
  let InvitedGuestsList: any;

  beforeAll(async () => {
    const mod =
      await import("../../src/components/profile/InvitedGuestsList.vue");
    InvitedGuestsList = mod.default;
  });

  it("renders nothing when guests array is empty", () => {
    const wrapper = mount(InvitedGuestsList, {
      props: { guests: [] },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.find("section").exists()).toBe(false);
  });

  it("renders guest names and game info", () => {
    const guests = [
      {
        id: "g1",
        firstName: "Juan",
        lastName: "López",
        game: {
          id: "game1",
          date: "2026-03-15T00:00:00.000Z",
          opponent: "Real Madrid",
        },
      },
    ];
    const wrapper = mount(InvitedGuestsList, {
      props: { guests },
      global: { stubs: { NuxtLink: NuxtLinkStub } },
    });
    expect(wrapper.text()).toContain("Juan López");
    expect(wrapper.text()).toContain("Real Madrid");
  });
});

describe("JerseySvg", () => {
  let JerseySvg: any;

  beforeAll(async () => {
    const mod = await import("../../src/components/profile/JerseySvg.vue");
    JerseySvg = mod.default;
  });

  it("renders the jersey number", () => {
    const wrapper = mount(JerseySvg, {
      props: { jerseyNumber: 10, lastName: "Gómez" },
    });
    expect(wrapper.text()).toContain("10");
  });

  it("renders empty when number is null", () => {
    const wrapper = mount(JerseySvg, {
      props: { jerseyNumber: null, lastName: "Gómez" },
    });
    expect(wrapper.find("svg").exists()).toBe(true);
  });
});

describe("ProfileHeader", () => {
  let ProfileHeader: any;

  beforeAll(async () => {
    const mod = await import("../../src/components/profile/ProfileHeader.vue");
    ProfileHeader = mod.default;
  });

  const baseProps = {
    firstName: "Carlos",
    lastName: "Gómez",
    role: "PLAYER",
    status: "ACTIVE",
    photoUrl: null,
    createdAt: "2025-06-01T00:00:00.000Z",
  };

  it("renders full name", () => {
    const wrapper = mount(ProfileHeader, { props: baseProps });
    expect(wrapper.text()).toContain("Carlos Gómez");
  });

  it("shows initials when no photo URL", () => {
    const wrapper = mount(ProfileHeader, { props: baseProps });
    expect(wrapper.text()).toContain("CG");
  });

  it("shows role badge", () => {
    const wrapper = mount(ProfileHeader, { props: baseProps });
    expect(wrapper.text()).toContain("PLAYER");
  });
});
